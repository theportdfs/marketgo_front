import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../../core/services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Cart toggle button -->
    <button (click)="toggleCart()" class="fixed bottom-6 right-6 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105 z-40 focus:outline-none focus:ring-4 focus:ring-indigo-300">
      <div class="relative">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
        @if (cart.totalItems() > 0) {
          <span class="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white">
            {{ cart.totalItems() }}
          </span>
        }
      </div>
    </button>

    <!-- Overlay -->
    @if (isOpen) {
      <div class="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity z-40" (click)="toggleCart()"></div>
    }

    <!-- Drawer -->
    <div [class.translate-x-full]="!isOpen" class="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col z-50 transition-transform duration-300 ease-in-out transform">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <h2 class="text-xl font-bold text-gray-900">Tu Pedido</h2>
        <button (click)="toggleCart()" class="text-gray-400 hover:text-gray-600 focus:outline-none">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 bg-white">
        @if (cart.cartItems().length === 0) {
          <div class="flex flex-col items-center justify-center h-full text-gray-500">
            <svg class="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <p class="text-lg font-medium text-gray-900">Tu carrito está vacío</p>
            <p class="text-sm">Agrega algunos productos del catálogo.</p>
            <button (click)="toggleCart()" class="mt-6 text-indigo-600 font-bold hover:text-indigo-800">Seguir comprando</button>
          </div>
        } @else {
          <div class="flow-root">
            <ul role="list" class="-my-6 divide-y divide-gray-200">
              @for (item of cart.cartItems(); track item.productId) {
                <li class="flex py-6">
                  <div class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center">
                    <svg class="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>

                  <div class="ml-4 flex flex-1 flex-col">
                    <div>
                      <div class="flex justify-between text-sm font-bold text-gray-900">
                        <h3 class="line-clamp-2"><a href="#">{{ item.productName }}</a></h3>
                        <p class="ml-4 whitespace-nowrap">\${{ item.unitPrice * item.quantity }}</p>
                      </div>
                      <p class="mt-1 text-xs text-gray-500">\${{ item.unitPrice }} / {{ item.unit || 'u.' }}</p>
                    </div>
                    <div class="flex flex-1 items-end justify-between text-sm">
                      <div class="flex items-center border border-gray-300 rounded-lg">
                        <button (click)="updateQuantity(item.productId, item.quantity - 1)" class="px-3 py-1 text-gray-600 hover:bg-gray-100 font-bold">-</button>
                        <span class="px-3 font-semibold text-gray-900">{{ item.quantity }}</span>
                        <button (click)="updateQuantity(item.productId, item.quantity + 1)" class="px-3 py-1 text-gray-600 hover:bg-gray-100 font-bold">+</button>
                      </div>

                      <div class="flex">
                        <button (click)="removeItem(item.productId)" type="button" class="font-medium text-red-500 hover:text-red-400 text-xs flex items-center">
                          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              }
            </ul>
          </div>
        }
      </div>

      @if (cart.cartItems().length > 0) {
        <div class="border-t border-gray-200 px-6 py-6 sm:px-6 bg-gray-50">
          <div class="flex justify-between text-base font-bold text-gray-900 mb-4">
            <p>Subtotal</p>
            <p>\${{ cart.totalPrice() }}</p>
          </div>
          <div class="mt-2">
            <button (click)="checkout()" class="flex w-full items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-6 py-3.5 text-base font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors">
              Proceder al Pago
            </button>
          </div>
          <div class="mt-4 flex justify-center text-center text-xs text-gray-500">
            <p>
              o <button (click)="toggleCart()" type="button" class="font-medium text-indigo-600 hover:text-indigo-500">Continuar comprando<span aria-hidden="true"> &rarr;</span></button>
            </p>
          </div>
        </div>
      }
    </div>
  `
})
export class CartDrawerComponent {
  cart = inject(CartService);
  router = inject(Router);
  isOpen = false;

  toggleCart() {
    this.isOpen = !this.isOpen;
  }

  updateQuantity(productId: number, quantity: number) {
    this.cart.updateQuantity(productId, quantity);
  }

  removeItem(productId: number) {
    this.cart.removeItem(productId);
  }

  checkout() {
    this.isOpen = false;
    this.router.navigate(['/checkout']);
  }
}
