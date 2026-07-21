import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface PosProduct {
  id: number;
  productId: number;
  price: number;
  stock: number;
  product?: {
    name: string;
    sku: string;
    imageUrl: string;
  };
  batches?: any[];
}

export interface PosCartItem {
  storeProductId: number;
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  maxStock: number;
}

@Component({
  selector: 'app-merchant-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-gray-50 overflow-hidden">
      <!-- POS Header -->
      <header class="bg-white shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] px-6 py-4 flex justify-between items-center z-10 flex-shrink-0">
        <div>
          <h1 class="text-2xl font-black text-gray-900 tracking-tight">Punto de Venta (POS)</h1>
          <p class="text-sm font-medium text-gray-500">Registra ventas físicas de mostrador</p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="relative">
            <input type="text" [(ngModel)]="searchQuery" placeholder="Buscar producto..." 
                   class="w-80 pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-indigo-500 text-sm font-medium transition-colors">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <div class="flex flex-1 overflow-hidden">
        
        <!-- Left Column: Products Grid -->
        <div class="flex-1 overflow-y-auto p-6 bg-gray-50">
          @if (isLoading()) {
            <div class="flex justify-center items-center h-full">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          } @else {
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              @for (item of filteredProducts(); track item.id) {
                <div (click)="addToCart(item)" 
                     class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl hover:border-indigo-400 hover:-translate-y-1 transition-all duration-200 active:scale-95 group relative"
                     [ngClass]="{'opacity-50 pointer-events-none grayscale': getTotalStock(item) <= 0}">
                     
                  <div class="aspect-w-1 aspect-h-1 bg-gray-50 flex items-center justify-center p-4 h-36 relative">
                    <img *ngIf="item.product?.imageUrl" [src]="item.product?.imageUrl" class="object-contain h-full w-full mix-blend-multiply transition-transform duration-300 group-hover:scale-110">
                    <svg *ngIf="!item.product?.imageUrl" class="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    
                    @if (getTotalStock(item) <= 0) {
                      <div class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
                        <span class="bg-red-100 text-red-800 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border border-red-200">Agotado</span>
                      </div>
                    }
                  </div>
                  
                  <div class="p-4 border-t border-gray-100 bg-white">
                    <h3 class="text-sm font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors" [title]="item.product?.name">{{ item.product?.name }}</h3>
                    <div class="mt-3 flex items-center justify-between">
                      <span class="text-indigo-600 font-black text-lg leading-none">\${{ getActivePrice(item) }}</span>
                      <span class="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded-md" [ngClass]="{'text-red-600 bg-red-100': getTotalStock(item) <= 5}">Stock: {{ getTotalStock(item) }}</span>
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="col-span-full py-16 text-center">
                  <p class="text-gray-500 font-medium">No se encontraron productos.</p>
                </div>
              }
            </div>
          }
        </div>

        <!-- Right Column: Cart / Checkout -->
        <div class="w-96 bg-white border-l border-gray-200 flex flex-col shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)] z-20">
          <div class="p-5 border-b border-gray-100 bg-white flex justify-between items-center">
            <h2 class="text-lg font-black text-gray-900 flex items-center tracking-tight">
              <svg class="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              Venta Actual
            </h2>
            <button (click)="clearCart()" class="text-sm text-gray-400 hover:text-red-600 font-bold uppercase tracking-wider transition-colors">Vaciar</button>
          </div>
          
          <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            @for (cItem of cart(); track cItem.storeProductId) {
              <div class="flex flex-col bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative group hover:border-indigo-200 transition-colors">
                <div class="flex justify-between items-start mb-3 pr-6">
                  <span class="text-sm font-bold text-gray-900 leading-tight">{{ cItem.name }}</span>
                  <span class="text-base font-black text-indigo-600">\${{ cItem.lineTotal }}</span>
                </div>
                
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500 font-semibold">\${{ cItem.unitPrice }} c/u</span>
                  
                  <div class="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                    <button (click)="updateQuantity(cItem, -1)" class="w-7 h-7 flex items-center justify-center bg-white text-gray-600 hover:text-indigo-600 shadow-sm rounded-md transition-colors" [disabled]="cItem.quantity <= 1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"></path></svg>
                    </button>
                    <span class="text-sm font-black w-8 text-center text-gray-900">{{ cItem.quantity }}</span>
                    <button (click)="updateQuantity(cItem, 1)" class="w-7 h-7 flex items-center justify-center bg-white text-gray-600 hover:text-indigo-600 shadow-sm rounded-md transition-colors" [disabled]="cItem.quantity >= cItem.maxStock">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                    </button>
                  </div>
                </div>

                <button (click)="removeFromCart(cItem.storeProductId)" class="absolute top-3 right-3 text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            } @empty {
              <div class="h-full flex flex-col items-center justify-center text-gray-400">
                <div class="bg-gray-100 p-4 rounded-full mb-4">
                  <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                </div>
                <p class="text-sm font-bold text-center px-4 text-gray-500">Sin productos</p>
                <p class="text-xs text-center px-4 mt-1 text-gray-400">Selecciona productos de la izquierda</p>
              </div>
            }
          </div>

          <!-- Checkout Section -->
          <div class="border-t border-gray-200 bg-white p-6 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-bold text-gray-500 uppercase tracking-wider">Total a Cobrar</span>
            </div>
            <div class="flex justify-between items-end mb-6">
              <span class="text-4xl font-black text-gray-900 tracking-tight leading-none">\${{ cartTotal() }}</span>
            </div>

            <button (click)="openCheckoutModal()" 
                    [disabled]="cart().length === 0"
                    class="w-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 font-black py-4 rounded-2xl shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center text-lg tracking-wide uppercase">
              <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              COBRAR
            </button>
          </div>
        </div>

      </div>

      <!-- Checkout Modal -->
      @if (showCheckoutModal()) {
        <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div class="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 class="text-xl font-black text-gray-900">Confirmar Venta</h3>
              <button (click)="closeCheckoutModal()" class="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div class="p-8">
              <div class="text-center mb-8">
                <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Monto Total</p>
                <p class="text-5xl font-black text-indigo-600">\${{ cartTotal() }}</p>
              </div>

              <div class="space-y-4 mb-8">
                <label class="block text-sm font-bold text-gray-900 uppercase tracking-wider">Método de Pago</label>
                <div class="grid grid-cols-2 gap-4">
                  <button (click)="paymentMethod.set('cash')" 
                          [ngClass]="paymentMethod() === 'cash' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'"
                          class="rounded-2xl p-5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95">
                    <svg class="w-8 h-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    <span class="font-black text-sm tracking-wide">EFECTIVO</span>
                  </button>
                  
                  <button (click)="paymentMethod.set('card')" 
                          [ngClass]="paymentMethod() === 'card' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'"
                          class="rounded-2xl p-5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95">
                    <svg class="w-8 h-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                    <span class="font-black text-sm tracking-wide">TARJETA</span>
                  </button>
                </div>
              </div>

              <div class="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <input type="checkbox" id="wantsReceipt" [(ngModel)]="wantsReceipt" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5">
                <label for="wantsReceipt" class="text-sm font-bold text-gray-700 cursor-pointer flex-1">
                  Generar e Imprimir Factura
                  <span class="block text-xs font-medium text-gray-500 mt-0.5">La funcionalidad estará disponible próximamente.</span>
                </label>
              </div>

              <button (click)="confirmCheckout()" 
                      [disabled]="isCheckingOut()"
                      class="w-full mt-8 bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 font-black py-4 rounded-2xl shadow-[0_8px_20px_-6px_rgba(34,197,94,0.5)] transition-all flex items-center justify-center text-lg tracking-wider uppercase active:scale-95">
                @if (isCheckingOut()) {
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Procesando...
                } @else {
                  Confirmar Pago
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Success Toast -->
      @if (showSuccess()) {
        <div class="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 z-50">
          <div class="bg-green-500 rounded-full p-1.5">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <span class="font-black tracking-wide">¡Venta registrada exitosamente!</span>
        </div>
      }
    </div>
  `
})
export class MerchantPosComponent implements OnInit {
  private http = inject(HttpClient);
  
  inventory = signal<PosProduct[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');
  
  cart = signal<PosCartItem[]>([]);
  showCheckoutModal = signal<boolean>(false);
  isCheckingOut = signal<boolean>(false);
  paymentMethod = signal<'cash' | 'card'>('cash');
  wantsReceipt = signal<boolean>(false);
  showSuccess = signal<boolean>(false);

  ngOnInit() {
    this.loadInventory();
  }

  loadInventory() {
    this.isLoading.set(true);
    this.http.get<PosProduct[]>(`${environment.apiUrl}/api/catalog/store`).subscribe({
      next: (data) => {
        this.inventory.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  filteredProducts = computed(() => {
    const term = this.searchQuery().toLowerCase().trim();
    if (!term) return this.inventory();
    
    return this.inventory().filter(item => 
      item.product?.name.toLowerCase().includes(term) ||
      item.product?.sku.toLowerCase().includes(term)
    );
  });

  cartTotal = computed(() => {
    return this.cart().reduce((sum, item) => sum + item.lineTotal, 0);
  });

  getTotalStock(item: PosProduct): number {
    const batchStock = item.batches ? item.batches.reduce((acc, b) => acc + b.quantity, 0) : 0;
    return (item.stock || 0) + batchStock;
  }

  getActivePrice(item: PosProduct): number {
    if (!item.batches) return item.price;
    const saleBatches = item.batches.filter(b => b.isOnSale && b.salePrice != null);
    if (saleBatches.length === 0) return item.price;
    return Math.min(...saleBatches.map(b => b.salePrice!));
  }

  addToCart(item: PosProduct) {
    const maxStock = this.getTotalStock(item);
    if (maxStock <= 0) return;

    this.cart.update(currentCart => {
      const existing = currentCart.find(c => c.storeProductId === item.id);
      if (existing) {
        if (existing.quantity < maxStock) {
          existing.quantity += 1;
          existing.lineTotal = existing.quantity * existing.unitPrice;
        }
        return [...currentCart];
      } else {
        const price = this.getActivePrice(item);
        return [...currentCart, {
          storeProductId: item.id!,
          productId: item.productId,
          name: item.product?.name || 'Producto',
          unitPrice: price,
          quantity: 1,
          lineTotal: price,
          maxStock: maxStock
        }];
      }
    });
  }

  updateQuantity(item: PosCartItem, delta: number) {
    this.cart.update(currentCart => {
      const target = currentCart.find(c => c.storeProductId === item.storeProductId);
      if (target) {
        const newQty = target.quantity + delta;
        if (newQty > 0 && newQty <= target.maxStock) {
          target.quantity = newQty;
          target.lineTotal = target.quantity * target.unitPrice;
        }
      }
      return [...currentCart];
    });
  }

  removeFromCart(storeProductId: number) {
    this.cart.update(current => current.filter(c => c.storeProductId !== storeProductId));
  }

  clearCart() {
    this.cart.set([]);
  }

  openCheckoutModal() {
    if (this.cart().length > 0) {
      this.showCheckoutModal.set(true);
    }
  }

  closeCheckoutModal() {
    this.showCheckoutModal.set(false);
  }

  confirmCheckout() {
    if (this.cart().length === 0) return;
    
    this.isCheckingOut.set(true);

    const payload = {
      items: this.cart().map(c => ({
        productId: c.productId,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        lineTotal: c.lineTotal
      })),
      subtotal: this.cartTotal(),
      total: this.cartTotal(),
      deliveryFee: 0,
      paymentMethod: this.paymentMethod()
    };

    this.http.post(`${environment.apiUrl}/api/orders/pos`, payload).subscribe({
      next: () => {
        this.isCheckingOut.set(false);
        this.closeCheckoutModal();
        this.clearCart();
        
        // Mostrar success
        this.showSuccess.set(true);
        setTimeout(() => this.showSuccess.set(false), 3000);

        // Recargar inventario para actualizar stocks
        this.loadInventory();
      },
      error: () => {
        this.isCheckingOut.set(false);
        alert('Ocurrió un error al procesar el pago.');
      }
    });
  }
}
