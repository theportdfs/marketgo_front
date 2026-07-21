import { Component, inject, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { SocketService } from '../../services/socket.service';
import { StoreService } from '../../services/store';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  socketService = inject(SocketService);
  storeService = inject(StoreService);
  
  // Using Signals to read the current user state
  currentUser = this.authService.currentUser;
  
  // State for the banner
  newOrderAlert = signal<any | null>(null);
  
  private socketSub: Subscription | null = null;
  private storeId: string | null = null;

  constructor() {
    // Escuchar cambios en el currentUser para conectar/desconectar el socket
    effect(() => {
      const user = this.currentUser();
      if (user && user.role === 'merchant') {
        this.setupMerchantSockets();
      } else {
        this.cleanupSockets();
      }
    });
  }

  ngOnInit() {
    // Initial setup handled by effect
  }

  setupMerchantSockets() {
    this.storeService.getMyStore().subscribe({
      next: (store) => {
        if (store && store.id) {
          this.storeId = store.id;
          this.socketService.connect();
          this.socketService.joinStoreRoom(this.storeId);
          
          if (!this.socketSub) {
            this.socketSub = this.socketService.onNewOrder().subscribe(order => {
              this.showNewOrderAlert(order);
            });
          }
        }
      },
      error: (err) => console.log('Merchant without store yet')
    });
  }

  showNewOrderAlert(order: any) {
    this.newOrderAlert.set(order);
    this.playNotificationSound();
    
    // Ocultar la alerta después de 15 segundos
    setTimeout(() => {
      this.closeOrderAlert();
    }, 15000);
  }
  
  closeOrderAlert() {
    this.newOrderAlert.set(null);
  }

  playNotificationSound() {
    try {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
      audio.play().catch(e => console.log('Audio autoplay blocked'));
    } catch(e) {}
  }

  cleanupSockets() {
    if (this.storeId) {
      this.socketService.leaveStoreRoom(this.storeId.toString());
      this.storeId = null;
    }
    if (this.socketSub) {
      this.socketSub.unsubscribe();
      this.socketSub = null;
    }
  }

  ngOnDestroy() {
    this.cleanupSockets();
  }

  logout() {
    this.authService.logout();
  }
}
