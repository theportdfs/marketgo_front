import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-global-chat-bubble',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (authService.currentUser(); as user) {
      <!-- Burbuja flotante -->
      @if (!isOpen() && hasActiveChats()) {
        <button (click)="openBubble()" 
                class="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-all z-50 focus:outline-none">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          @if (unreadCount() > 0) {
            <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {{ unreadCount() > 9 ? '9+' : unreadCount() }}
            </span>
          }
        </button>
      }

      <!-- Panel flotante -->
      @if (isOpen()) {
        <div class="fixed bottom-24 right-6 w-[350px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 border border-gray-100" [ngStyle]="{'height': view() === 'chat' ? '450px' : 'auto', 'max-height': '600px'}">
          <!-- Cabecera -->
          <div class="bg-indigo-600 px-4 py-3 text-white flex justify-between items-center shadow-md z-10">
            <div class="flex items-center">
              @if (view() === 'chat' && activeChats().length > 1) {
                <button (click)="backToList()" class="mr-2 hover:bg-indigo-700 p-1 rounded-full transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
              }
              <h4 class="font-bold">
                {{ view() === 'list' ? 'Chats Activos' : 'Pedido #' + selectedChat()?.orderNumber }}
              </h4>
            </div>
            <button (click)="closeBubble()" class="hover:bg-indigo-700 p-1 rounded-full transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <!-- Contenido -->
          <div class="flex-1 overflow-y-auto bg-gray-50 flex flex-col relative" #chatContainer>
            
            @if (isLoading()) {
              <div class="flex justify-center items-center h-32">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            } @else {
              <!-- Lista de Chats -->
              @if (view() === 'list') {
                <div class="divide-y divide-gray-100">
                  @for (chat of activeChats(); track chat.id) {
                    <div (click)="selectChat(chat)" class="p-4 hover:bg-indigo-50 cursor-pointer transition-colors flex flex-col">
                      <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-gray-900 text-sm">Pedido #{{ chat.orderNumber }}</span>
                        <span class="text-xs font-semibold px-2 py-0.5 rounded-full" [ngClass]="isCustomer(chat) ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'">
                          {{ isCustomer(chat) ? 'Tienda: ' + (chat.store?.name || 'Desconocida') : 'Cliente' }}
                        </span>
                      </div>
                      <p class="text-xs text-gray-500 line-clamp-1">
                        {{ chat.messages?.length > 0 ? chat.messages[chat.messages.length - 1].message : 'Sin mensajes aún' }}
                      </p>
                    </div>
                  }
                </div>
              }

              <!-- Interfaz de Chat -->
              @if (view() === 'chat' && selectedChat()) {
                <div class="flex-1 p-4 space-y-3 pb-4">
                  @for (msg of chatMessages(); track msg.id) {
                    @if (msg.isSystem) {
                      <div class="text-center my-2">
                        <span class="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full">{{ msg.message }}</span>
                      </div>
                    } @else {
                      <div class="flex" [ngClass]="isMyMessage(msg) ? 'justify-end' : 'justify-start'">
                        <div class="max-w-[85%] rounded-2xl px-3 py-1.5 text-sm" 
                             [ngClass]="isMyMessage(msg) ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'">
                          {{ msg.message }}
                        </div>
                      </div>
                    }
                  }
                </div>
              }
            }
          </div>

          <!-- Input Area (solo en vista chat) -->
          @if (view() === 'chat' && !isLoading()) {
            <div class="p-3 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
              <form (submit)="$event.preventDefault(); sendMessage(msgInput.value); msgInput.value = ''" class="flex space-x-2">
                <input #msgInput type="text" placeholder="Escribe un mensaje..." class="flex-1 border-gray-300 rounded-full shadow-inner focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 bg-gray-50">
                <button type="submit" class="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors shadow-sm">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
              </form>
            </div>
          }
        </div>
      }
    }
  `
})
export class GlobalChatBubbleComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private http = inject(HttpClient);
  private socketService = inject(SocketService);
  private router = inject(Router);

  isOpen = signal(false);
  hasActiveChats = signal(false);
  unreadCount = signal(0);
  
  view = signal<'list' | 'chat'>('list');
  activeChats = signal<any[]>([]);
  selectedChat = signal<any | null>(null);
  chatMessages = signal<any[]>([]);
  isLoading = signal(false);

  private chatSub: any;

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user && (user as any).id) {
      this.fetchActiveChats();
      this.socketService.connect();
      // Join the global user room to receive messages regardless of the page we are on
      this.socketService.joinUserRoom((user as any).id);

      this.chatSub = this.socketService.onChatMessage().subscribe(msg => {
        this.handleIncomingMessage(msg);
      });
    }
  }

  fetchActiveChats() {
    this.http.get<any[]>(`${environment.apiUrl}/api/orders/chats/active`).subscribe(chats => {
      this.activeChats.set(chats);
      if (chats.length > 0) {
        this.hasActiveChats.set(true);
      } else {
        this.hasActiveChats.set(false);
        this.isOpen.set(false);
      }
    });
  }

  handleIncomingMessage(msg: any) {
    this.hasActiveChats.set(true);
    
    // Play sound on incoming message if we didn't just send it
    if (!this.isMyMessage(msg)) {
      this.playNotificationSound();
    }
    
    if (!this.isOpen()) {
      this.unreadCount.update(c => c + 1);
    } else {
      if (this.view() === 'list' || (this.selectedChat() && String(this.selectedChat().id) !== String(msg.orderId))) {
        this.unreadCount.update(c => c + 1);
      }
    }

    // Refresh active chats silently
    this.http.get<any[]>(`${environment.apiUrl}/api/orders/chats/active`).subscribe(chats => {
      this.activeChats.set(chats);
    });

    if (this.selectedChat() && String(this.selectedChat().id) === String(msg.orderId)) {
      this.chatMessages.update(msgs => {
        if (msgs.find(m => m.id === msg.id)) return msgs;
        return [...msgs, msg];
      });
      this.scrollToBottom();
    }
  }
  
  playNotificationSound() {
    try {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
      audio.play().catch(e => console.log('Audio autoplay blocked'));
    } catch(e) {}
  }

  openBubble() {
    this.isOpen.set(true);
    this.unreadCount.set(0); 
    
    if (this.activeChats().length === 1) {
      this.selectChat(this.activeChats()[0]);
    } else {
      this.view.set('list');
      this.fetchActiveChats();
    }
  }

  closeBubble() {
    this.isOpen.set(false);
    this.selectedChat.set(null);
  }

  backToList() {
    this.view.set('list');
    this.selectedChat.set(null);
    this.fetchActiveChats();
  }

  selectChat(chat: any) {
    this.selectedChat.set(chat);
    this.view.set('chat');
    this.isLoading.set(true);
    this.unreadCount.set(0);

    this.http.get<any[]>(`${environment.apiUrl}/api/orders/${chat.id}/chat`).subscribe({
      next: msgs => {
        this.chatMessages.set(msgs);
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: () => this.isLoading.set(false)
    });
  }

  sendMessage(text: string) {
    if (!text.trim() || !this.selectedChat()) return;

    const user = this.authService.currentUser() as any;
    const isCustomerInThisChat = this.selectedChat().userId === user?.id;

    const tempId = Date.now();
    const optimisticMsg = {
      id: tempId,
      orderId: this.selectedChat().id,
      senderType: isCustomerInThisChat ? 'customer' : 'merchant',
      message: text,
      isSystem: false,
      createdAt: new Date().toISOString()
    };
    
    this.chatMessages.update(msgs => [...msgs, optimisticMsg]);
    this.scrollToBottom();

    this.http.post(`${environment.apiUrl}/api/orders/${this.selectedChat().id}/chat`, { message: text })
      .subscribe({
        next: (realMsg: any) => {
          this.chatMessages.update(msgs => msgs.map(m => m.id === tempId ? realMsg : m));
        },
        error: () => {
          this.chatMessages.update(msgs => msgs.filter(m => m.id !== tempId));
        }
      });
  }

  isCustomer(chat: any): boolean {
    const user = this.authService.currentUser() as any;
    return chat.userId === user?.id;
  }

  isMyMessage(msg: any): boolean {
    const user = this.authService.currentUser() as any;
    // Simplified logic: if we are customer, we sent 'customer' msgs. If merchant, 'merchant' msgs.
    if (!this.selectedChat() && !msg) return false;
    
    // If msg is provided without selectedChat
    if (msg && !this.selectedChat()) {
       // We can't know for sure unless we check active chats. But we only need this for currently open chat mostly
       return false;
    }
    
    const amICustomer = this.isCustomer(this.selectedChat());
    if (amICustomer && msg.senderType === 'customer') return true;
    if (!amICustomer && msg.senderType === 'merchant') return true;
    return false;
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.overflow-y-auto');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  ngOnDestroy() {
    if (this.chatSub) {
      this.chatSub.unsubscribe();
    }
    const user = this.authService.currentUser() as any;
    if (user && user.id) {
       this.socketService.leaveUserRoom(user.id);
    }
  }
}
