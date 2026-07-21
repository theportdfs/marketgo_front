import { environment } from '../../../../environments/environment';
import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../../core/services/socket.service';
import { StoreService } from '../../../core/services/store';

@Component({
  selector: 'app-merchant-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto py-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-extrabold text-gray-900">Gestión de Pedidos</h2>
        <button (click)="loadOrders()" class="text-sm bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-200 font-semibold py-2 px-4 rounded-lg shadow-sm flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          Actualizar
        </button>
      </div>

      @if (isLoading()) {
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      } @else {
        @if (orders().length === 0) {
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">Sin pedidos activos</h3>
            <p class="mt-1 text-sm text-gray-500">Los nuevos pedidos aparecerán aquí automáticamente.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (order of orders(); track order.id) {
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                <!-- Indicador de Nuevo (si está pendiente) -->
                @if (order.status === 'pending') {
                  <div class="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider animate-pulse">
                    NUEVO
                  </div>
                }

                <div class="p-5">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <p class="text-xs text-gray-500">Orden #{{ order.orderNumber }}</p>
                      <h3 class="text-lg font-bold text-gray-900 mt-1">\${{ order.total }}</h3>
                    </div>
                    <span [ngClass]="getStatusClass(order.status)" class="px-2.5 py-1 text-xs font-semibold rounded-full border">
                      {{ getStatusText(order.status) }}
                    </span>
                  </div>

                  <div class="border-t border-b border-gray-100 py-3 mb-4 max-h-32 overflow-y-auto">
                    @for (item of order.items; track item.id) {
                      <div class="flex justify-between text-sm mb-2 last:mb-0">
                        <span class="text-gray-700"><span class="font-bold mr-1">{{ item.quantity }}x</span> {{ item.product?.name || 'Producto ID: ' + item.productId }}</span>
                        <span class="text-gray-500 font-medium">\${{ item.lineTotal }}</span>
                      </div>
                    }
                  </div>

                  <!-- Botones de Acción -->
                  <div class="flex space-x-2 mb-3">
                    <button (click)="openOrderDetails(order)" class="flex-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm">
                      Ver Detalles y Chat
                    </button>
                  </div>
                  <div class="flex space-x-3">
                    @if (order.status === 'pending') {
                      <button (click)="updateStatus(order, 'preparing')" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm">
                        Empezar a Empacar
                      </button>
                    }
                    @if (order.status === 'preparing') {
                      <button (click)="updateStatus(order, 'ready_for_pickup')" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm">
                        Listo para Recoger
                      </button>
                    }
                    @if (order.status === 'ready_for_pickup') {
                      <button (click)="updateStatus(order, 'delivered')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm">
                        Marcar Entregado
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- Modal de Detalles y Chat -->
      @if (selectedOrder()) {
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 class="text-xl font-bold text-gray-900">Pedido #{{ selectedOrder().orderNumber }}</h3>
              <button (click)="closeOrderDetails()" class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div class="flex-1 overflow-hidden flex flex-col md:flex-row">
              <!-- Left side: Order Details & Modification -->
              <div class="w-full md:w-1/2 p-6 border-r border-gray-200 overflow-y-auto flex flex-col">
                <div class="flex justify-between items-center mb-4">
                  <h4 class="font-bold text-gray-900 uppercase tracking-wider text-sm">Resumen</h4>
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

                <div class="mt-auto border-t border-gray-200 pt-4">
                  <h4 class="font-bold text-gray-900 text-sm mb-3">Modificar Pedido (Añadir Producto)</h4>
                  <div class="flex space-x-2">
                    <select #productSelect class="flex-1 border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                      <option value="">Seleccionar producto...</option>
                      @for (inv of inventory(); track inv.id) {
                        <option [value]="inv.product.id">{{ inv.product.name }} (\${{ inv.price }})</option>
                      }
                    </select>
                    <input #qtyInput type="number" min="1" value="1" class="w-20 border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    <button (click)="addOrderItem(productSelect.value, qtyInput.value)" class="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700">
                      Añadir
                    </button>
                  </div>
                </div>
              </div>

              <!-- Right side: Chat -->
              <div class="w-full md:w-1/2 flex flex-col bg-gray-50 h-full">
                <div class="p-4 border-b border-gray-200 bg-white">
                  <h4 class="font-bold text-gray-900 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    Chat con el Cliente
                  </h4>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-3" #chatContainer>
                  @if (chatMessages().length === 0) {
                    <p class="text-center text-gray-500 text-sm mt-10">No hay mensajes. ¡Escríbele al cliente!</p>
                  }
                  @for (msg of chatMessages(); track msg.id) {
                    @if (msg.isSystem) {
                      <div class="text-center my-2">
                        <span class="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full">{{ msg.message }}</span>
                      </div>
                    } @else {
                      <div class="flex" [ngClass]="msg.senderType === 'merchant' ? 'justify-end' : 'justify-start'">
                        <div class="max-w-[75%] rounded-2xl px-4 py-2 text-sm" 
                             [ngClass]="msg.senderType === 'merchant' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'">
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
  `
})
export class MerchantOrdersComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private socketService = inject(SocketService);
  private storeService = inject(StoreService);

  orders = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  storeId: string | null = null;
  private socketSub: any;
  private chatSocketSub: any;

  selectedOrder = signal<any | null>(null);
  chatMessages = signal<any[]>([]);
  inventory = signal<any[]>([]);

  ngOnInit() {
    this.storeService.getMyStore().subscribe(store => {
      if (store && store.id) {
        this.storeId = store.id;
        this.loadOrders();
        this.setupSockets();
        
        // Request notification permission if not already granted
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    });
  }

  loadOrders() {
    this.isLoading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/api/orders/store`).subscribe({
      next: (data) => {
        // Filtrar órdenes canceladas o entregadas si se desea, o mostrarlas todas
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  setupSockets() {
    if (!this.storeId) return;
    this.socketService.connect();
    this.socketService.joinStoreRoom(this.storeId.toString());

    // Escuchar actualizaciones de estado u órdenes nuevas
    this.socketSub = this.socketService.onOrderStatusUpdated().subscribe(update => {
      console.log('Update recibido en panel tendero:', update);
      this.loadOrders();
      this.playNotificationSound();
    });

    this.chatSocketSub = this.socketService.onChatMessage().subscribe(msg => {
      // If we are looking at the order, append it
      if (this.selectedOrder() && String(msg.orderId) === String(this.selectedOrder().id)) {
        // Prevent duplicate if we already added optimistically
        this.chatMessages.update(msgs => {
          if (msgs.find(m => m.id === msg.id)) return msgs;
          return [...msgs, msg];
        });
        this.scrollToBottom();
      }
      // Always play notification sound for incoming messages if it's from the customer
      if (msg.senderType === 'customer' || msg.isSystem) {
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

  scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.overflow-y-auto');
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

    // Load Inventory if empty
    if (this.inventory().length === 0) {
      this.http.get<any[]>(`${environment.apiUrl}/api/catalog/my-inventory`).subscribe(inv => {
        this.inventory.set(inv);
      });
    }
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
      senderType: 'merchant',
      message: text,
      isSystem: false,
      createdAt: new Date().toISOString()
    };
    
    this.chatMessages.update(msgs => [...msgs, optimisticMsg]);
    this.scrollToBottom();

    this.http.post(`${environment.apiUrl}/api/orders/${this.selectedOrder().id}/chat`, { message: text })
      .subscribe({
        next: (realMsg: any) => {
          // Replace optimistic message with real one
          this.chatMessages.update(msgs => msgs.map(m => m.id === tempId ? realMsg : m));
        },
        error: () => {
          // Remove if failed
          this.chatMessages.update(msgs => msgs.filter(m => m.id !== tempId));
        }
      });
  }

  addOrderItem(productId: string, quantity: string) {
    if (!productId || !quantity || !this.selectedOrder()) return;
    this.http.post(`${environment.apiUrl}/api/orders/${this.selectedOrder().id}/add-item`, {
      productId,
      quantity: parseInt(quantity)
    }).subscribe({
      next: (updatedOrder) => {
        this.selectedOrder.set(updatedOrder);
        this.loadOrders(); // Update main list too
      },
      error: () => alert('Error al modificar pedido')
    });
  }

  playNotificationSound() {
    try {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
      audio.play().catch(e => console.log('Audio autoplay blocked'));
    } catch(e) {}
  }

  ngOnDestroy() {
    if (this.storeId) {
      this.socketService.leaveStoreRoom(this.storeId.toString());
    }
    if (this.selectedOrder()) {
      this.socketService.leaveOrderRoom(this.selectedOrder().id);
    }
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
    if (this.chatSocketSub) {
      this.chatSocketSub.unsubscribe();
    }
  }

  updateStatus(order: any, newStatus: string) {
    // Optimistic UI
    const prevStatus = order.status;
    order.status = newStatus;
    
    this.http.patch(`${environment.apiUrl}/api/orders/${order.id}/status`, { status: newStatus })
      .subscribe({
        next: () => {
          // Exitoso
        },
        error: () => {
          // Revertir
          order.status = prevStatus;
          alert('Error al actualizar el estado del pedido');
        }
      });
  }

  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmado',
      'preparing': 'Empaquetando',
      'ready_for_pickup': 'Listo p/ Recoger',
      'out_for_delivery': 'En Camino',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };
    return texts[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'confirmed': 'bg-blue-100 text-blue-800 border-blue-200',
      'preparing': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'ready_for_pickup': 'bg-green-100 text-green-800 border-green-200',
      'delivered': 'bg-gray-100 text-gray-800 border-gray-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return classes[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
