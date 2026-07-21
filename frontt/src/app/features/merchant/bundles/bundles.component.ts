import { environment } from '../../../../environments/environment';
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-merchant-bundles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Combos y Promociones</h1>
        <button (click)="openCreateModal()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          + Crear Combo
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (bundle of bundles(); track bundle.id) {
          <div class="bg-white rounded-xl shadow border p-4">
            <div class="flex justify-between items-start mb-4">
              <h3 class="text-lg font-bold">
                {{ bundle.name }}
                @if (bundle.discountPercentage) {
                  <span class="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold border border-green-200">
                    -{{ bundle.discountPercentage }}%
                  </span>
                }
              </h3>
              <button (click)="deleteBundle(bundle.id)" class="text-red-500 hover:text-red-700 text-sm">Eliminar</button>
            </div>
            <p class="text-sm text-gray-500 mb-4">{{ bundle.description }}</p>
            <div class="space-y-2">
              <h4 class="text-xs font-semibold uppercase text-gray-400">Productos:</h4>
              @for (item of bundle.items; track item.id) {
                <div class="text-sm flex justify-between">
                  <span>{{ item.quantity }}x {{ item.product?.name }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Sugeridos -->
      @if (globalBundles().length > 0) {
        <h2 class="text-xl font-bold text-gray-900 mt-10 mb-4 flex items-center">
          <svg class="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          Sugerencias del Administrador
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          @for (gb of globalBundles(); track gb.id) {
            <div class="bg-indigo-50 rounded-xl shadow border border-indigo-100 p-4">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-lg font-bold text-indigo-900">
                  {{ gb.name }}
                  @if (gb.discountPercentage) {
                    <span class="ml-2 bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-green-200">
                      -{{ gb.discountPercentage }}%
                    </span>
                  }
                </h3>
              </div>
              <p class="text-sm text-indigo-700 mb-4">{{ gb.description }}</p>
              <div class="space-y-1 mb-4">
                @for (item of gb.items; track item.id) {
                  <div class="text-xs text-indigo-800">
                    • {{ item.quantity }}x {{ item.product?.name }}
                  </div>
                }
              </div>
              
              @if (getParticipationStatus(gb) === 'pending') {
                <div class="flex gap-2 mt-auto pt-4 border-t border-indigo-200">
                  <button (click)="optInGlobalBundle(gb.id, 'accepted')" class="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 transition">Aceptar Combo</button>
                  <button (click)="optInGlobalBundle(gb.id, 'rejected')" class="flex-1 bg-gray-200 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-300 transition">Rechazar</button>
                </div>
              } @else if (getParticipationStatus(gb) === 'accepted') {
                <div class="mt-auto pt-4 border-t border-indigo-200 flex justify-between items-center">
                  <span class="text-sm font-bold text-green-600 flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    Activo en tu tienda
                  </span>
                  <button (click)="optInGlobalBundle(gb.id, 'rejected')" class="text-xs text-red-500 hover:underline">Desactivar</button>
                </div>
              } @else {
                <div class="mt-auto pt-4 border-t border-indigo-200 flex justify-between items-center">
                  <span class="text-sm font-bold text-gray-500">Rechazado</span>
                  <button (click)="optInGlobalBundle(gb.id, 'accepted')" class="text-xs text-indigo-600 hover:underline">Volver a Activar</button>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Modal de Creación -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div class="p-6 border-b">
              <h2 class="text-xl font-bold">Nuevo Combo</h2>
            </div>
            
            <div class="p-6 overflow-y-auto flex-1">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Nombre del Combo (Ej: Desayuno Paisa)</label>
                  <input [(ngModel)]="newBundle.name" type="text" class="w-full border rounded-lg px-3 py-2">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Descripción</label>
                  <textarea [(ngModel)]="newBundle.description" class="w-full border rounded-lg px-3 py-2"></textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Porcentaje de Descuento (%)</label>
                  <input [(ngModel)]="newBundle.discountPercentage" type="number" min="0" max="100" class="w-full border rounded-lg px-3 py-2">
                </div>
                
                <div class="pt-4 border-t">
                  <h3 class="font-bold mb-2">Añadir Productos al Combo</h3>
                  <div class="flex gap-2 mb-4">
                    <select [(ngModel)]="selectedProductId" class="flex-1 border rounded-lg px-3 py-2">
                      <option [value]="0">Seleccione un producto</option>
                      @for (p of storeProducts(); track p.id) {
                        <option [value]="p.product?.id">{{ p.product?.name }}</option>
                      }
                    </select>
                    <input [(ngModel)]="selectedQuantity" type="number" min="1" class="w-20 border rounded-lg px-3 py-2" placeholder="Cant.">
                    <button (click)="addProductToBundle()" class="bg-gray-100 px-4 py-2 rounded-lg font-bold">+</button>
                  </div>

                  <ul class="space-y-2">
                    @for (item of newBundle.items; track item.productId) {
                      <li class="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span>{{ item.quantity }}x {{ getProductName(item.productId) }}</span>
                        <button (click)="removeProductFromBundle(item.productId)" class="text-red-500 text-sm">Quitar</button>
                      </li>
                    }
                  </ul>
                </div>
              </div>
            </div>

            <div class="p-6 border-t flex justify-end gap-3">
              <button (click)="closeModal()" class="px-4 py-2 border rounded-lg text-gray-700">Cancelar</button>
              <button (click)="saveBundle()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg">Guardar Combo</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class MerchantBundlesComponent implements OnInit {
  private http = inject(HttpClient);
  
  bundles = signal<any[]>([]);
  globalBundles = signal<any[]>([]);
  storeProducts = signal<any[]>([]);
  showModal = signal(false);
  
  newBundle = { name: '', description: '', discountPercentage: 0, items: [] as any[] };
  selectedProductId: number = 0;
  selectedQuantity: number = 1;

  ngOnInit() {
    this.loadBundles();
    this.loadGlobalBundles();
    this.loadStoreProducts();
  }

  loadBundles() {
    this.http.get<any[]>(`${environment.apiUrl}/api/bundles`).subscribe({
      next: (data) => this.bundles.set(data),
      error: (e) => console.error(e)
    });
  }

  loadGlobalBundles() {
    this.http.get<any[]>(`${environment.apiUrl}/api/bundles/global/suggestions`).subscribe({
      next: (data) => this.globalBundles.set(data),
      error: (e) => console.error(e)
    });
  }

  loadStoreProducts() {
    this.http.get<any[]>(`${environment.apiUrl}/api/catalog/store`).subscribe({
      next: (data) => this.storeProducts.set(data),
      error: (e) => console.error(e)
    });
  }

  getProductName(id: number) {
    const sp = this.storeProducts().find(p => p.product?.id == id);
    return sp?.product?.name || 'Desconocido';
  }

  openCreateModal() {
    this.newBundle = { name: '', description: '', discountPercentage: 0, items: [] };
    this.showModal.set(true);
  }
  
  closeModal() {
    this.showModal.set(false);
  }

  addProductToBundle() {
    if (this.selectedProductId == 0 || this.selectedQuantity < 1) return;
    this.newBundle.items.push({
      productId: Number(this.selectedProductId),
      quantity: this.selectedQuantity
    });
    this.selectedProductId = 0;
    this.selectedQuantity = 1;
  }

  removeProductFromBundle(productId: number) {
    this.newBundle.items = this.newBundle.items.filter(i => i.productId !== productId);
  }

  saveBundle() {
    if (!this.newBundle.name || this.newBundle.items.length === 0) {
      alert('Debes ingresar un nombre y al menos un producto');
      return;
    }

    this.http.post(`${environment.apiUrl}/api/bundles`, this.newBundle).subscribe({
      next: () => {
        this.loadBundles();
        this.closeModal();
      },
      error: (e) => console.error(e)
    });
  }

  deleteBundle(id: number) {
    if (confirm('¿Estás seguro de eliminar este combo?')) {
      this.http.delete(`${environment.apiUrl}/api/bundles/${id}`).subscribe({
        next: () => this.loadBundles(),
        error: (e) => console.error(e)
      });
    }
  }

  getParticipationStatus(bundle: any) {
    if (bundle.participations && bundle.participations.length > 0) {
      return bundle.participations[0].status;
    }
    return 'pending';
  }
  
  optInGlobalBundle(bundleId: number, status: 'accepted' | 'rejected') {
    this.http.post(`${environment.apiUrl}/api/bundles/global/${bundleId}/opt-in`, { status }).subscribe({
      next: () => this.loadGlobalBundles(),
      error: (e) => console.error(e)
    });
  }
}
