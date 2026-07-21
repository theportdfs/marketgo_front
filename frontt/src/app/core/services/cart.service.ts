import { environment } from '../../../environments/environment';
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth';
import { Router } from '@angular/router';

export interface CartItem {
  id?: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  productImageUrl?: string;
  unit?: string;
  maxStock?: number; // Optional reference to max available stock
}

export interface Cart {
  id: number;
  userId: number;
  storeId: number;
  status: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  // El Signal mantiene el estado actual (puede ser optimista)
  private cartSignal = signal<Cart | null>(null);

  cart = this.cartSignal.asReadonly();
  
  cartItems = computed(() => {
    return this.cartSignal()?.items || [];
  });

  totalItems = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + item.quantity, 0);
  });

  totalPrice = computed(() => {
    return this.cartSignal()?.total || 0;
  });

  constructor() {
    this.loadActiveCart();
  }

  loadActiveCart(storeId?: number) {
    if (!this.auth.isAuthenticated()) return;

    this.http.post<Cart>(`${environment.apiUrl}/api/carts/active`, { storeId }).subscribe({
      next: (cart) => {
        if (cart) {
          this.cartSignal.set(cart);
        }
      },
      error: (err) => console.error('No se pudo cargar el carrito', err)
    });
  }

  // Optimistic Add
  async addItemOptimistic(storeId: number, storeSlug: string, productId: number, productName: string, unitPrice: number, quantity: number = 1, unit: string = 'unidad'): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      // Redirigir al login y guardar donde estaba
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/tiendas/${storeSlug}` } });
      return Promise.reject('Usuario no autenticado');
    }

    // Guardar copia del estado anterior para rollback
    const previousState = this.cartSignal();
    
    // Mutación Optimista de la UI
    this.applyOptimisticAdd(storeId, productId, productName, unitPrice, quantity, unit);

    // Petición Real
    try {
      const updatedCart = await this.http.post<Cart>(`${environment.apiUrl}/api/carts/add`, {
        storeId,
        productId,
        quantity,
        unitPrice
      }).toPromise();
      
      // Si tiene éxito, actualizamos con el objeto real del servidor
      if (updatedCart) {
        this.cartSignal.set(updatedCart);
      }
    } catch (error) {
      // Rollback en caso de error
      console.error('Error al añadir al carrito', error);
      this.cartSignal.set(previousState);
      alert('Error al añadir el producto al carrito. Es posible que no haya stock suficiente en el servidor.');
      throw error;
    }
  }

  private applyOptimisticAdd(storeId: number, productId: number, productName: string, unitPrice: number, quantity: number, unit: string) {
    let currentCart = this.cartSignal();
    
    // Si no hay carrito local o es de otra tienda, creamos uno local temporal
    if (!currentCart || currentCart.storeId !== storeId) {
      currentCart = {
        id: 0, // temporal
        userId: Number(this.auth.currentUser()?.id || 0),
        storeId: storeId,
        status: 'active',
        items: [],
        subtotal: 0,
        discountTotal: 0,
        total: 0
      };
    }

    // Copia profunda para inmutabilidad
    const newCart: Cart = JSON.parse(JSON.stringify(currentCart));
    
    const existingIndex = newCart.items.findIndex(i => i.productId === productId);
    if (existingIndex > -1) {
      newCart.items[existingIndex].quantity += quantity;
      newCart.items[existingIndex].lineTotal = newCart.items[existingIndex].quantity * newCart.items[existingIndex].unitPrice;
    } else {
      newCart.items.push({
        productId,
        productName,
        unitPrice,
        quantity,
        unit,
        lineTotal: unitPrice * quantity
      });
    }

    // Recalcular totales básicos optimistas
    newCart.subtotal = newCart.items.reduce((sum, item) => sum + item.lineTotal, 0);
    newCart.total = newCart.subtotal - newCart.discountTotal;

    this.cartSignal.set(newCart);
  }

  async addMultipleItems(storeId: number, storeSlug: string, items: {productId: number, quantity: number, unitPrice: number}[]): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/tiendas/${storeSlug}` } });
      return Promise.reject('Usuario no autenticado');
    }

    const previousState = this.cartSignal();
    
    try {
      const updatedCart = await this.http.post<Cart>(`${environment.apiUrl}/api/carts/add-multiple`, {
        storeId,
        items
      }).toPromise();
      
      if (updatedCart) {
        this.cartSignal.set(updatedCart);
      }
    } catch (error) {
      console.error('Error al añadir múltiples items al carrito', error);
      this.cartSignal.set(previousState);
      alert('Error al añadir los productos al carrito.');
      throw error;
    }
  }

  updateQuantity(productId: number, quantity: number) {
    if (!this.cartSignal()) return;
    const cartId = this.cartSignal()!.id;
    
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    
    this.http.patch<Cart>(`${environment.apiUrl}/api/carts/${cartId}/items/${productId}`, { quantity }).subscribe({
      next: (updatedCart) => this.cartSignal.set(updatedCart),
      error: (err) => {
        alert('Error al actualizar la cantidad');
      }
    });
  }

  removeItem(productId: number) {
    if (!this.cartSignal()) return;
    const cartId = this.cartSignal()!.id;
    
    this.http.delete<Cart>(`${environment.apiUrl}/api/carts/${cartId}/items/${productId}`).subscribe({
      next: (updatedCart) => this.cartSignal.set(updatedCart),
      error: (err) => {
        alert('Error al remover el producto');
      }
    });
  }

  clearCart() {
    this.cartSignal.set(null);
  }

  updateItemMaxStock(productId: number, newMaxStock: number) {
    // Aquí puedes implementar lógica para advertir si el nuevo stock es menor a lo que hay en el carrito
    const current = this.cartSignal();
    if (!current) return;

    const itemIndex = current.items.findIndex(i => i.productId === productId);
    if (itemIndex > -1 && current.items[itemIndex].quantity > newMaxStock) {
      alert(`El stock disponible para ${current.items[itemIndex].productName} ha disminuido.`);
      if (newMaxStock === 0) {
        this.removeItem(productId);
      } else {
        this.updateQuantity(productId, newMaxStock);
      }
    }
  }
}
