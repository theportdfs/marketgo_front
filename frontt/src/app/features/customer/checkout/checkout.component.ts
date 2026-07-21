import { environment } from '../../../../environments/environment';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-3xl font-extrabold text-gray-900 mb-8 text-center">Confirmar tu Pedido</h1>
        
        @if (cart.cartItems().length === 0 && !orderSuccess()) {
          <div class="text-center py-12 bg-white rounded-2xl shadow-sm">
            <p class="text-gray-500 mb-4">No hay productos en tu carrito.</p>
            <button (click)="router.navigate(['/'])" class="text-indigo-600 font-bold hover:text-indigo-800">Volver a inicio</button>
          </div>
        } @else if (orderSuccess()) {
          <div class="text-center py-16 bg-white rounded-2xl shadow-sm border border-green-100">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg class="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">¡Pedido Confirmado!</h2>
            <p class="text-gray-500 mb-8">Tu orden se ha generado con éxito en el sistema.</p>
            <a [href]="whatsappLink()" target="_blank" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.086 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Enviar Detalle por WhatsApp
            </a>
          </div>
        } @else {
          <div class="bg-white shadow-xl rounded-2xl overflow-hidden">
            <div class="p-6 sm:p-8">
              <h2 class="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Resumen de Compra</h2>
              
              <div class="flow-root mb-8">
                <ul role="list" class="-my-4 divide-y divide-gray-100">
                  @for (item of cart.cartItems(); track item.productId) {
                    <li class="flex py-4 items-center">
                      <div class="flex-1 flex justify-between text-sm">
                        <div>
                          <p class="font-bold text-gray-900">{{ item.productName }}</p>
                          <p class="text-gray-500">{{ item.quantity }} x \${{ item.unitPrice }}</p>
                        </div>
                        <p class="font-bold text-gray-900">\${{ item.unitPrice * item.quantity }}</p>
                      </div>
                    </li>
                  }
                </ul>
              </div>

              <div class="border-t border-gray-100 pt-6">
                <div class="flex justify-between text-base font-bold text-gray-900 mb-2">
                  <p>Total a Pagar</p>
                  <p class="text-indigo-600 text-xl">\${{ cart.totalPrice() }}</p>
                </div>
                <p class="text-sm text-gray-500 mb-6">El pago se acordará con el tendero al momento de la entrega o recogida.</p>
                
                <div class="mb-6">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Método de Entrega</label>
                  <select [(ngModel)]="fulfillmentType" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm border">
                    <option value="pickup">🚶 Recoger en Tienda</option>
                    <option *ngIf="storeInfo()?.hasDelivery" value="delivery">🚗 Envío a Domicilio</option>
                  </select>
                </div>

                @if (fulfillmentType === 'delivery') {
                  <div class="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <label class="block text-sm font-bold text-indigo-900 mb-2">Dirección de Envío <span class="text-red-500">*</span></label>
                    <input type="text" [(ngModel)]="deliveryAddress" placeholder="Ej: Calle 123 #45-67, Apto 802" class="mt-1 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border">
                  </div>
                }

                <div class="mb-8">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Notas adicionales (Opcional)</label>
                  <textarea [(ngModel)]="notes" rows="3" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-3" placeholder="Ej: Traer cambio de $50.000"></textarea>
                </div>
                
                <div class="mb-8">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label class="border rounded-lg p-4 flex items-center cursor-pointer hover:bg-gray-50 transition-colors" [ngClass]="{'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50': paymentMethod === 'cash'}">
                      <input type="radio" name="payment" value="cash" [(ngModel)]="paymentMethod" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300">
                      <div class="ml-3">
                        <span class="block text-sm font-bold text-gray-900">Efectivo</span>
                        <span class="block text-xs text-gray-500">Pagar al recibir/recoger</span>
                      </div>
                    </label>
                    <label class="border rounded-lg p-4 flex items-center cursor-pointer hover:bg-gray-50 transition-colors" [ngClass]="{'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50': paymentMethod === 'card_simulated'}">
                      <input type="radio" name="payment" value="card_simulated" [(ngModel)]="paymentMethod" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300">
                      <div class="ml-3">
                        <span class="block text-sm font-bold text-gray-900">Tarjeta (Simulada)</span>
                        <span class="block text-xs text-gray-500">Paga en línea ahora</span>
                      </div>
                    </label>
                  </div>
                </div>

                @if (paymentMethod === 'card_simulated') {
                  <div class="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 class="text-sm font-bold text-gray-900 mb-4 flex items-center">
                      <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                      Información de Tarjeta
                    </h3>
                    <div class="space-y-4">
                      <div>
                        <label class="block text-xs font-medium text-gray-700">Número de Tarjeta (Tip: Usa '42...' para aprobar)</label>
                        <input type="text" [(ngModel)]="cardToken" placeholder="4242 4242 4242 4242" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border">
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-xs font-medium text-gray-700">Expiración</label>
                          <input type="text" placeholder="MM/YY" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border">
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700">CVC</label>
                          <input type="text" placeholder="123" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border">
                        </div>
                      </div>
                    </div>
                  </div>
                }

                <button 
                  (click)="confirmOrder()" 
                  [disabled]="isProcessing() || (fulfillmentType === 'delivery' && !deliveryAddress.trim())"
                  class="w-full bg-indigo-600 border border-transparent rounded-lg shadow-sm py-4 px-4 text-lg font-extrabold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center">
                  @if (isProcessing()) {
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Procesando...
                  } @else {
                    Confirmar Compra @if (paymentMethod === 'card_simulated') { (Pagar $ {{cart.totalPrice()}}) }
                  }
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class CheckoutComponent {
  cart = inject(CartService);
  router = inject(Router);
  private http = inject(HttpClient);

  fulfillmentType = 'pickup';
  deliveryAddress = '';
  notes = '';
  paymentMethod = 'cash';
  cardToken = '';

  isProcessing = signal(false);
  orderSuccess = signal(false);
  whatsappLink = signal('');
  storeInfo = signal<any>(null);

  ngOnInit() {
    this.loadStoreInfo();
  }

  loadStoreInfo() {
    const currentCart = this.cart.cart();
    if (currentCart && currentCart.storeId) {
      // Assuming you have an endpoint that can fetch store details by ID or we just hit the public slug if we stored it,
      // but in this case we only have storeId. Wait, cart has storeId. Let's fetch it via a standard get
      this.http.get<any>(`${environment.apiUrl}/api/stores/${currentCart.storeId}`).subscribe({
        next: (store) => {
          this.storeInfo.set(store);
          // If store doesn't have delivery, force pickup
          if (!store.hasDelivery) {
            this.fulfillmentType = 'pickup';
          }
        },
        error: (err) => console.error('Could not fetch store info for checkout', err)
      });
    }
  }

  confirmOrder() {
    if (!this.cart.cart()) return;
    const cartId = this.cart.cart()!.id;

    this.isProcessing.set(true);

    this.http.post<any>(`${environment.apiUrl}/api/carts/${cartId}/checkout`, {
      fulfillmentType: this.fulfillmentType,
      notes: this.notes,
      paymentMethod: this.paymentMethod,
      cardToken: this.paymentMethod === 'card_simulated' ? this.cardToken : null,
      deliveryAddress: this.fulfillmentType === 'delivery' ? this.deliveryAddress : null
    }).subscribe({
      next: (order) => {
        this.isProcessing.set(false);
        this.orderSuccess.set(true);
        this.generateWhatsappLink(order);
        this.cart.clearCart();
      },
      error: (err) => {
        this.isProcessing.set(false);
        alert(err.error?.message || 'Error al procesar el pedido');
      }
    });
  }

  private generateWhatsappLink(order: any) {
    // Generar mensaje de whatsapp con los detalles de la orden
    let text = `¡Hola! Acabo de hacer un pedido (Orden #${order.orderNumber || order.id}).\\n\\n`;
    text += `*Tipo:* ${this.fulfillmentType === 'pickup' ? '🚶 Recogida en Tienda' : '🚗 A Domicilio'}\\n`;
    if (this.fulfillmentType === 'delivery' && this.deliveryAddress) {
      text += `*Dirección:* ${this.deliveryAddress}\\n`;
    }
    if (this.notes) text += `*Notas:* ${this.notes}\\n`;
    text += `\\n*Total:* $${order.total}`;

    const phone = order.store?.phone || "573213424790"; // Use store phone, fallback if not set
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    this.whatsappLink.set(url);
  }
}
