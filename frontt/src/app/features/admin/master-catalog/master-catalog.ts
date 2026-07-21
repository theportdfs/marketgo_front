import { environment } from '../../../../environments/environment';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';

export interface MasterProduct {
  id?: number;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  creatorStore?: { id: number, name: string };
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-master-catalog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header & Add Button -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Catálogo Maestro</h2>
          <p class="mt-1 text-sm text-gray-500">Gestiona los productos globales que los tenderos podrán agregar a sus inventarios.</p>
        </div>
        <div class="mt-4 sm:ml-4 sm:mt-0 flex space-x-3 items-center">
          <div class="relative w-full sm:w-64">
            <input type="text" [(ngModel)]="searchTerm" placeholder="Buscar por SKU o Nombre..."
                   class="block w-full rounded-md border-gray-300 pl-10 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          <button (click)="openModal()" type="button" class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors">
            <svg class="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
            </svg>
            Nuevo Producto
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        @if (isLoading()) {
          <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Creador</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (product of filteredProducts(); track product.id) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {{ product.sku }}
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center">
                        <div class="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                          <img *ngIf="product.imageUrl" [src]="product.imageUrl" alt="" class="h-10 w-10 object-cover">
                          <div *ngIf="!product.imageUrl" class="h-10 w-10 flex items-center justify-center text-gray-400">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-bold text-gray-900">{{ product.name }}</div>
                          <div class="text-sm text-gray-500 line-clamp-1">{{ product.description || 'Sin descripción' }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ product.category || 'General' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      @if (product.creatorStore) {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {{ product.creatorStore.name }}
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Global
                        </span>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" 
                            [ngClass]="product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                        {{ product.status === 'active' ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      @if (product.creatorStore) {
                        <button (click)="approveGlobal(product)" class="text-green-600 hover:text-green-900 px-3 py-1 bg-green-50 hover:bg-green-100 rounded transition-colors" title="Aprobar para que todos los tenderos lo vean">Aprobar Global</button>
                      }
                      <button (click)="editProduct(product)" class="text-indigo-600 hover:text-indigo-900 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors">Editar</button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-sm text-gray-500">
                      No hay productos en el catálogo maestro.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Add/Edit Modal (Simple absolute overlay for now) -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 class="text-lg font-bold text-gray-900">{{ editingProduct() ? 'Editar' : 'Nuevo' }} Producto</h3>
              <button (click)="closeModal()" class="text-gray-400 hover:text-gray-500">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form [formGroup]="productForm" (ngSubmit)="saveProduct()" class="p-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700">SKU</label>
                  <input type="text" formControlName="sku" class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border sm:text-sm">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700">Nombre</label>
                  <input type="text" formControlName="name" class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border sm:text-sm">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700">Descripción</label>
                  <textarea formControlName="description" rows="2" class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border sm:text-sm"></textarea>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700">Categoría</label>
                  <select formControlName="category" class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border sm:text-sm">
                    <option value="General">General</option>
                    <option value="Abarrotes">Abarrotes</option>
                    <option value="Lácteos y Huevos">Lácteos y Huevos</option>
                    <option value="Carnes y Embutidos">Carnes y Embutidos</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Aseo y Hogar">Aseo y Hogar</option>
                    <option value="Cuidado Personal">Cuidado Personal</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Panadería">Panadería</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700">URL de la Imagen</label>
                  <input type="text" formControlName="imageUrl" placeholder="https://..." class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border sm:text-sm">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700">Estado</label>
                  <select formControlName="status" class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border sm:text-sm">
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
              
              <div class="mt-6 flex justify-end space-x-3">
                <button type="button" (click)="closeModal()" class="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Cancelar</button>
                <button type="submit" [disabled]="productForm.invalid" class="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class MasterCatalogComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private apiUrl = `${environment.apiUrl}/api/catalog/master`;
  
  products = signal<MasterProduct[]>([]);
  searchTerm = signal<string>('');
  isLoading = signal<boolean>(true);
  showModal = signal<boolean>(false);
  editingProduct = signal<MasterProduct | null>(null);

  filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.products();
    return this.products().filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.sku.toLowerCase().includes(term)
    );
  });
  
  productForm: FormGroup;

  constructor() {
    this.productForm = this.fb.group({
      sku: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      category: ['General'],
      imageUrl: [''],
      status: ['active']
    });
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading.set(true);
    this.http.get<MasterProduct[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.products.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openModal() {
    this.editingProduct.set(null);
    this.productForm.reset({ status: 'active' });
    this.showModal.set(true);
  }

  editProduct(product: MasterProduct) {
    this.editingProduct.set(product);
    this.productForm.patchValue(product);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  approveGlobal(product: MasterProduct) {
    if (confirm(`¿Estás seguro de que deseas aprobar el producto "${product.name}" para el catálogo global? Todos los tenderos podrán verlo.`)) {
      this.http.patch(`${this.apiUrl}/${product.id}/approve`, {}).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => {
          console.error(err);
          alert('Error al aprobar el producto.');
        }
      });
    }
  }

  saveProduct() {
    if (this.productForm.invalid) return;

    const data = this.productForm.value;
    const current = this.editingProduct();

    if (current?.id) {
      this.http.put<MasterProduct>(`${this.apiUrl}/${current.id}`, data).subscribe(() => {
        this.loadProducts();
        this.closeModal();
      });
    } else {
      this.http.post<MasterProduct>(this.apiUrl, data).subscribe(() => {
        this.loadProducts();
        this.closeModal();
      });
    }
  }
}
