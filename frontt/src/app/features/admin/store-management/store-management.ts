import { environment } from '../../../../environments/environment';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '../../../core/services/store';

@Component({
  selector: 'app-store-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
      <div class="px-6 py-5 border-b border-gray-200 bg-gray-50 sm:flex justify-between items-center space-y-3 sm:space-y-0">
        <h3 class="text-lg leading-6 font-bold text-gray-900">Gestión de Tiendas</h3>
        <button (click)="openCreateMerchantModal()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm">
          Registrar Tendero
        </button>
      </div>
      
      <div class="px-6 py-4 border-b border-gray-200 bg-white">
        <div class="relative max-w-sm w-full">
          <input type="text" [(ngModel)]="searchTerm" placeholder="Buscar por nombre o ciudad..."
                 class="block w-full rounded-md border-gray-300 pl-10 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      @if (isLoading()) {
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre / Slug</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ubicación</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contacto</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @for (store of filteredStores(); track store.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-bold text-gray-900">{{ store.name }}</div>
                    <div class="text-sm text-gray-500 font-mono">/{{ store.slug }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ store.city || 'N/A' }}</div>
                    <div class="text-sm text-gray-500">{{ store.address }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ store.phone || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" 
                          [ngClass]="store.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                      {{ store.isActive ? 'Activa' : 'Inactiva' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button (click)="toggleStoreStatus(store)"
                            class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors">
                      {{ store.isActive ? 'Deshabilitar' : 'Habilitar' }}
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500">
                    No hay tiendas registradas en el sistema.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Modal para Crear Tendero -->
    @if (showCreateMerchantModal()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" (click)="closeCreateMerchantModal()"></div>
          
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          
          <div class="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Registrar Nuevo Tendero
                  </h3>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500 mb-4">
                      Se creará la cuenta y se enviará un correo a esta dirección con una contraseña temporal.
                    </p>
                    
                    @if (createError()) {
                      <div class="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
                        {{ createError() }}
                      </div>
                    }

                    <form [formGroup]="merchantForm" (ngSubmit)="submitMerchant()" class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Nombre del Tendero</label>
                        <input type="text" formControlName="name" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                        <input type="email" formControlName="email" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3">
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button type="button" (click)="submitMerchant()" [disabled]="merchantForm.invalid || isSubmittingMerchant()"
                      class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                {{ isSubmittingMerchant() ? 'Creando...' : 'Crear y Enviar Correo' }}
              </button>
              <button type="button" (click)="closeCreateMerchantModal()" [disabled]="isSubmittingMerchant()"
                      class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class StoreManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/stores/admin`;
  
  stores = signal<Store[]>([]);
  searchTerm = signal<string>('');
  isLoading = signal<boolean>(true);

  filteredStores = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.stores();
    return this.stores().filter(s => 
      s.name.toLowerCase().includes(term) || 
      (s.city && s.city.toLowerCase().includes(term))
    );
  });

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores() {
    this.isLoading.set(true);
    this.http.get<Store[]>(`${this.apiUrl}/all`).subscribe({
      next: (data) => {
        this.stores.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        // Add error handling logic
      }
    });
  }

  toggleStoreStatus(store: Store) {
    if (!store.id) return;
    
    const newStatus = !store.isActive;
    this.http.patch<Store>(`${this.apiUrl}/${store.id}/status`, { isActive: newStatus }).subscribe({
      next: (updatedStore) => {
        this.stores.update(stores => stores.map(s => s.id === updatedStore.id ? updatedStore : s));
      },
      error: (err) => {
        console.error('Error toggling status', err);
      }
    });
  }

  showCreateMerchantModal = signal<boolean>(false);
  isSubmittingMerchant = signal<boolean>(false);
  createError = signal<string>('');
  merchantForm: FormGroup;

  private fb = inject(FormBuilder);

  constructor() {
    this.merchantForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  openCreateMerchantModal() {
    this.merchantForm.reset();
    this.createError.set('');
    this.showCreateMerchantModal.set(true);
  }

  closeCreateMerchantModal() {
    this.showCreateMerchantModal.set(false);
  }

  submitMerchant() {
    if (this.merchantForm.invalid) return;

    this.isSubmittingMerchant.set(true);
    this.createError.set('');

    const payload = this.merchantForm.value;
    
    this.http.post(`${environment.apiUrl}/api/auth/merchant`, payload).subscribe({
      next: () => {
        this.isSubmittingMerchant.set(false);
        this.closeCreateMerchantModal();
        alert('Tendero creado con éxito. Se le ha enviado un correo con la contraseña temporal.');
      },
      error: (err) => {
        this.isSubmittingMerchant.set(false);
        this.createError.set(err.error?.message || 'Error al crear el tendero');
      }
    });
  }
}
