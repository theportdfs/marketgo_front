import { environment } from '../../../../environments/environment';
import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { SocketService } from '../../../core/services/socket.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">Mis Pedidos</h2>
          <button (click)="loadOrders()" class="text-indigo-600 hover:text-indigo-800 font-semibold text-sm flex items-center">
            <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Actualizar
          </button>
        </div>

        @if (isLoading()) {
          <div class="flex justify-center items-center min-h-[300px]">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        } @else {
          @if (orders().length === 0) {
            <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center">
              <div class="mx-auto h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <svg class="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900">Aún no has hecho pedidos</h3>
              <p class="mt-2 text-gray-500 max-w-sm mx-auto">Explora las tiendas disponibles y realiza tu primera compra. Tus pedidos aparecerán aquí.</p>
            </div>
          } @else {
            <div class="space-y-6">
              @for (order of orders(); track order.id) {
                <div class="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
                  
                  <!-- Cabecera del pedido -->
                  <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Orden #</p>
                      <p class="text-base font-bold text-gray-900">{{ order.orderNumber }}</p>
                    </div>
                    <div>
                      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tienda</p>
                      <p class="text-base font-bold text-gray-900">{{ order.store?.name || 'Desconocida' }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</p>
                      <p class="text-xl font-extrabold text-indigo-600">\${{ order.total }}</p>
                    </div>
                    <div>
                      <button (click)="openOrderDetails(order)" class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow flex items-center mb-2 w-full justify-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        Seguimiento y Chat
                      </button>
                      <button (click)="repeatOrder(order)" class="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg font-semibold hover:bg-indigo-50 flex items-center w-full justify-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        Repetir Pedido
                      </button>
                    </div>
                  </div>

                  <div class="p-6 md:p-8">
                    <!-- Progress Bar (Estado) -->
                    <div class="mb-10 mt-2">
                      <div class="relative">
                        <div class="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-100">
                          <div [style.width]="getProgressPercentage(order.status) + '%'" 
                               class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500 ease-in-out">
                          </div>
                        </div>
                        <div class="flex justify-between text-xs font-bold text-gray-500 px-1">
                          <span [ngClass]="{'text-indigo-600': isStatusActive(order.status, 'pending')}">Pendiente</span>
                          <span [ngClass]="{'text-indigo-600': isStatusActive(order.status, 'preparing')}" class="text-center">Empaquetando</span>
                          <span [ngClass]="{'text-green-600': isStatusActive(order.status, 'ready_for_pickup')}" class="text-right">Listo</span>
                        </div>
                      </div>
                    </div>

                    <!-- Detalles -->
                    <div>
                      <h4 class="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Artículos ({{ order.items?.length }})</h4>
                      <ul class="divide-y divide-gray-100 bg-gray-50 rounded-xl p-4 border border-gray-100">
                        @for (item of order.items; track item.id) {
                          <li class="py-3 flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-700">
                              <span class="inline-block bg-indigo-100 text-indigo-800 rounded-md px-2 py-0.5 mr-2 text-xs font-bold">{{ item.quantity }}x</span> 
                              {{ item.product?.name || 'Producto ID: ' + item.productId }}
                            </span>
                            <span class="text-sm font-bold text-gray-900">\${{ item.lineTotal }}</span>
                          </li>
                        }
                      </ul>
                    </div>
                  </div>

                </div>
              }
            </div>
          }
        }

        <!-- Modal de Detalles y Chat para Cliente -->
        @if (selectedOrder()) {
          <div class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 class="text-xl font-bold text-gray-900">Seguimiento - Pedido #{{ selectedOrder().orderNumber }}</h3>
                <button (click)="closeOrderDetails()" class="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              
              <div class="flex-1 overflow-hidden flex flex-col md:flex-row">
                <!-- Left side: Order Details -->
                <div class="w-full md:w-1/2 p-6 border-r border-gray-200 overflow-y-auto flex flex-col">
                  
                  <div class="mb-8">
                    <h4 class="font-bold text-gray-900 text-sm mb-3">Estado del Pedido</h4>
                    <div class="relative">
                      <div class="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-100">
                        <div [style.width]="getProgressPercentage(selectedOrder().status) + '%'" 
                             class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500 ease-in-out">
                        </div>
                      </div>
                      <div class="flex justify-between text-xs font-bold text-gray-500 px-1">
                        <span [ngClass]="{'text-indigo-600': isStatusActive(selectedOrder().status, 'pending')}">Pendiente</span>
                        <span [ngClass]="{'text-indigo-600': isStatusActive(selectedOrder().status, 'preparing')}" class="text-center">Empaquetando</span>
                        <span [ngClass]="{'text-green-600': isStatusActive(selectedOrder().status, 'ready_for_pickup')}" class="text-right">Listo</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex justify-between items-center mb-4">
                    <h4 class="font-bold text-gray-900 uppercase tracking-wider text-sm">Resumen de tu compra</h4>
                    <span class="text-xl font-extrabold text-indigo-600">\${{ selectedOrder().total }}</span>
                  </div>
                  <div class="space-y-2 mb-6">
                    @for (item of selectedOrder().items; track item.id) {
                      <div class="flex justify-between text-sm bg-gray-50 p-2 rounded-lg">
                        <span class="text-gray-700"><span class="font-bold mr-1">{{ item.quantity }}x</span> {{ item.product?.name || 'ID: ' + item.productId }}</span>
                        <span class="text-gray-900 font-bold">\${{ item.lineTotal }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Right side: Chat -->
                <div class="w-full md:w-1/2 flex flex-col bg-gray-50 h-full">
                  <div class="p-4 border-b border-gray-200 bg-white">
                    <h4 class="font-bold text-gray-900 flex items-center">
                      <svg class="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                      Chat con la tienda
                    </h4>
                    <p class="text-xs text-gray-500">¿Olvidaste algo? Pídele al tendero que lo añada a tu pedido.</p>
                  </div>
                  <div class="flex-1 overflow-y-auto p-4 space-y-3" #chatContainer>
                    @if (chatMessages().length === 0) {
                      <p class="text-center text-gray-500 text-sm mt-10">No hay mensajes. Escribe aquí si necesitas algo más.</p>
                    }
                    @for (msg of chatMessages(); track msg.id) {
                      @if (msg.isSystem) {
                        <div class="text-center my-2">
                          <span class="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full">{{ msg.message }}</span>
                        </div>
                      } @else {
                        <div class="flex" [ngClass]="msg.senderType === 'customer' ? 'justify-end' : 'justify-start'">
                          <div class="max-w-[75%] rounded-2xl px-4 py-2 text-sm" 
                               [ngClass]="msg.senderType === 'customer' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'">
                            {{ msg.message }}
                          </div>
                        </div>
                      }
                    }
                  </div>
                  <div class="p-3 bg-white border-t border-gray-200">
                    <form (submit)="$event.preventDefault(); sendMessage(msgInput.value); msgInput.value = ''" class="flex space-x-2">
                      <input #msgInput type="text" placeholder="Escribe un mensaje..." class="flex-1 border-gray-300 rounded-full shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4">
                      <button type="submit" class="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

      </div>
    </div>
  `
})
export class CustomerOrdersComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private socketService = inject(SocketService);
  private cartService = inject(CartService);
  private router = inject(Router);

  orders = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  private socketSub: any;
  private orderUpdateSub: any;
  private chatSocketSub: any;

  selectedOrder = signal<any | null>(null);
  chatMessages = signal<any[]>([]);

  ngOnInit() {
    this.loadOrders();
    this.setupSockets();
    
    // Request notification permission if not already granted
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  loadOrders() {
    this.isLoading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/api/orders/me`).subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
        this.subscribeToStoreRooms(data);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  setupSockets() {
    this.socketService.connect();
    
    this.socketSub = this.socketService.onOrderStatusUpdated().subscribe(update => {
      console.log('Update de estado recibido:', update);
      this.orders.update(currentOrders => {
        return currentOrders.map(o => {
          if (o.id === update.orderId) {
            return { ...o, status: update.status };
          }
          return o;
        });
      });
      if (this.selectedOrder() && this.selectedOrder().id === update.orderId) {
        this.selectedOrder.update(o => ({ ...o, status: update.status }));
      }
    });

    this.orderUpdateSub = this.socketService.onOrderUpdated().subscribe(updatedOrder => {
      // Reemplazamos la orden en la lista principal
      this.orders.update(currentOrders => {
        return currentOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
      });
      // Si la orden seleccionada fue actualizada, actualizamos la vista
      if (this.selectedOrder() && this.selectedOrder().id === updatedOrder.id) {
        this.selectedOrder.set(updatedOrder);
      }
    });

    this.chatSocketSub = this.socketService.onChatMessage().subscribe(msg => {
      if (this.selectedOrder() && String(msg.orderId) === String(this.selectedOrder().id)) {
        this.chatMessages.update(msgs => {
          if (msgs.find(m => m.id === msg.id)) return msgs;
          return [...msgs, msg];
        });
        this.scrollToBottom();
      }
      if (msg.senderType === 'merchant' || msg.isSystem) {
        this.playNotificationSound();
        
        // Show visual browser notification if modal isn't open or if it is open
        if ('Notification' in window && Notification.permission === 'granted') {
          const isModalOpen = this.selectedOrder() && String(this.selectedOrder().id) === String(msg.orderId);
          if (!isModalOpen) {
            new Notification('Nuevo mensaje en Pedido #' + msg.orderId, { 
              body: msg.message,
              icon: '/favicon.ico'
            });
          }
        }
      }
    });
  }

  playNotificationSound() {
    try {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
      audio.play().catch(e => console.log('Audio autoplay blocked'));
    } catch(e) {}
  }

  subscribeToStoreRooms(ordersList: any[]) {
    // Para que el cliente reciba eventos de "order_status_updated",
    // necesita unirse a las salas de las tiendas a las que les compró.
    // Extraemos los storeIds únicos.
    const storeIds = [...new Set(ordersList.filter(o => o.storeId).map(o => o.storeId))];
    
    storeIds.forEach(storeId => {
      this.socketService.joinStoreRoom(storeId.toString());
    });
  }

  ngOnDestroy() {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
    if (this.orderUpdateSub) {
      this.orderUpdateSub.unsubscribe();
    }
    if (this.chatSocketSub) {
      this.chatSocketSub.unsubscribe();
    }
    // Desuscribirse de las salas al salir
    const storeIds = [...new Set(this.orders().filter(o => o.storeId).map(o => o.storeId))];
    storeIds.forEach(storeId => {
      this.socketService.leaveStoreRoom(storeId.toString());
    });
    if (this.selectedOrder()) {
      this.socketService.leaveOrderRoom(this.selectedOrder().id);
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.overflow-y-auto:last-child');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  openOrderDetails(order: any) {
    this.selectedOrder.set(order);
    this.socketService.joinOrderRoom(order.id);
    
    // Load Chat
    this.http.get<any[]>(`${environment.apiUrl}/api/orders/${order.id}/chat`).subscribe(msgs => {
      this.chatMessages.set(msgs);
      this.scrollToBottom();
    });
  }

  closeOrderDetails() {
    if (this.selectedOrder()) {
      this.socketService.leaveOrderRoom(this.selectedOrder().id);
    }
    this.selectedOrder.set(null);
  }

  sendMessage(text: string) {
    if (!text.trim() || !this.selectedOrder()) return;

    // Create optimistic message
    const tempId = Date.now();
    const optimisticMsg = {
      id: tempId,
      orderId: this.selectedOrder().id,
      senderType: 'customer',
      message: text,
      isSystem: false,
      createdAt: new Date().toISOString()
    };
    
    this.chatMessages.update(msgs => [...msgs, optimisticMsg]);
    this.scrollToBottom();

    this.http.post(`${environment.apiUrl}/api/orders/${this.selectedOrder().id}/chat`, { message: text })
      .subscribe({
        next: (realMsg: any) => {
          this.chatMessages.update(msgs => msgs.map(m => m.id === tempId ? realMsg : m));
        },
        error: () => {
          this.chatMessages.update(msgs => msgs.filter(m => m.id !== tempId));
        }
      });
  }

  getProgressPercentage(status: string): number {
    switch (status) {
      case 'pending': return 10;
      case 'confirmed': return 30; // Si pasa por confirmado
      case 'preparing': return 50;
      case 'ready_for_pickup': return 100;
      case 'out_for_delivery': return 100;
      case 'delivered': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  }

  isStatusActive(currentStatus: string, checkStatus: string): boolean {
    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const checkIndex = statusOrder.indexOf(checkStatus);
    
    if (currentIndex === -1 || checkIndex === -1) return false;
    
    // Si el currentStatus está igual o más avanzado que el checkStatus, es activo
    return currentIndex >= checkIndex;
  }

  async repeatOrder(order: any) {
    if (!order || !order.items || order.items.length === 0) return;
    
    try {
      const mappedItems = order.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }));

      const storeSlug = order.store?.slug || 'tienda';
      
      await this.cartService.addMultipleItems(order.storeId, storeSlug, mappedItems);
      
      // Navigate to store catalog where they can see the cart drawer open
      this.router.navigate(['/tiendas', storeSlug]);
    } catch (error) {
      console.error('Error al repetir el pedido', error);
    }
  }
}
