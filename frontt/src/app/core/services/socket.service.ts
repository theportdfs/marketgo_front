import { environment } from '../../../environments/environment';
import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private readonly URL = `${environment.apiUrl}`; // Make sure this matches backend URL

  constructor(private zone: NgZone) {
    this.socket = io(this.URL, {
      autoConnect: false // We'll connect manually when needed
    });
  }

  connect() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  joinStoreRoom(storeIdOrSlug: string) {
    this.socket.emit('join_store', storeIdOrSlug);
  }

  leaveStoreRoom(storeIdOrSlug: string) {
    this.socket.emit('leave_store', storeIdOrSlug);
  }

  joinOrderRoom(orderId: string | number) {
    this.socket.emit('join_order', orderId);
  }

  leaveOrderRoom(orderId: string | number) {
    this.socket.emit('leave_order', orderId);
  }

  joinUserRoom(userId: string | number) {
    this.socket.emit('join_user', userId);
  }

  leaveUserRoom(userId: string | number) {
    this.socket.emit('leave_user', userId);
  }

  onOrderStatusUpdated(): Observable<any> {
    return new Observable((observer) => {
      if (this.socket) {
        this.socket.on('order_status_updated', (data: any) => {
          this.zone.run(() => observer.next(data));
        });
      }
    });
  }

  onNewOrder(): Observable<any> {
    return new Observable((observer) => {
      if (this.socket) {
        this.socket.on('new_order', (data: any) => {
          this.zone.run(() => observer.next(data));
        });
      }
    });
  }

  onStockUpdated(): Observable<{ productId: number, newStock: any }> {
    return new Observable(observer => {
      this.socket.on('stock_updated', (data) => {
        this.zone.run(() => observer.next(data));
      });
      return () => {
        this.socket.off('stock_updated');
      };
    });
  }

  onChatMessage(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('chat_message', (data: any) => {
        this.zone.run(() => observer.next(data));
      });
      return () => {
        this.socket.off('chat_message');
      };
    });
  }

  onOrderUpdated(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('order_updated', (data: any) => {
        this.zone.run(() => observer.next(data));
      });
      return () => {
        this.socket.off('order_updated');
      };
    });
  }
}
