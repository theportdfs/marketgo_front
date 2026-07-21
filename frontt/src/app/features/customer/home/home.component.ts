import { environment } from '../../../../environments/environment';
import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { SocketService } from '../../../core/services/socket.service';

export interface PublicStore {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  distanceKm?: number;
  photos?: string[];
  logoUrl?: string;
}

export interface Banner {
  id: number;
  imageUrl: string;
  image_url?: string;
  storeId?: number;
  store_id?: number;
  title?: string;
  linkUrl?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="bg-gray-50 min-h-screen pb-20">
      
      <!-- HERO & SEARCH SECTION -->
      <div class="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 overflow-hidden pb-20 pt-20">
        <!-- Abstract Glassmorphism Shapes -->
        <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/30 blur-3xl mix-blend-screen"></div>
          <div class="absolute top-32 -right-24 w-[40rem] h-[40rem] rounded-full bg-purple-500/30 blur-3xl mix-blend-screen"></div>
          <div class="absolute -bottom-48 left-1/2 transform -translate-x-1/2 w-[50rem] h-[50rem] rounded-full bg-pink-500/20 blur-3xl mix-blend-screen"></div>
        </div>
        
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center z-10">
          
          <!-- WIDGET PEDIDO ACTIVO (SOBRE EL HERO) -->
          @if (activeOrder()) {
            <div class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 mb-12 border-t-4 border-indigo-500 transform transition-all hover:scale-105 cursor-pointer" routerLink="/cliente/mis-pedidos">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                  <div class="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                  </div>
                  <div class="text-left">
                    <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide">Pedido en curso</h3>
                    <p class="text-xs text-gray-500">{{ activeOrder().store?.name || 'Tu tienda' }} - Orden #{{ activeOrder().orderNumber }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                    {{ getStatusText(activeOrder().status) }}
                  </span>
                </div>
              </div>
              
              <!-- Barra de Progreso en Vivo -->
              <div class="relative pt-1">
                <div class="overflow-hidden h-2 mb-2 text-xs flex rounded-full bg-gray-100">
                  <div [style.width]="getProgressPercentage(activeOrder().status) + '%'" 
                       class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-1000 ease-in-out">
                  </div>
                </div>
                <div class="flex justify-between text-[10px] font-bold text-gray-400 px-1 uppercase tracking-wider">
                  <span [ngClass]="{'text-indigo-600': isStatusActive(activeOrder().status, 'pending')}">Pendiente</span>
                  <span [ngClass]="{'text-indigo-600': isStatusActive(activeOrder().status, 'preparing')}" class="text-center">Empaquetando</span>
                  <span [ngClass]="{'text-green-600': isStatusActive(activeOrder().status, 'ready_for_pickup')}" class="text-right">Listo</span>
                </div>
              </div>
            </div>
          }

          <h1 class="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6 drop-shadow-lg">
            Tus compras del barrio,<br>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-300">ahora a un clic.</span>
          </h1>
          
          <!-- Search Bar with Glassmorphism -->
          <div class="max-w-2xl w-full sm:flex justify-center mt-8">
            <div class="min-w-0 flex-1 relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg class="h-6 w-6 text-gray-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <input type="text" [(ngModel)]="searchCity" (keyup.enter)="searchNearby()"
                     class="block w-full bg-white px-4 py-4 pl-12 rounded-l-xl border-0 text-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600 transition-all shadow-xl"
                     placeholder="¿En qué ciudad te encuentras?">
            </div>
            <div class="mt-3 sm:mt-0 sm:ml-0">
              <button (click)="searchNearby()" class="block w-full h-full py-4 px-8 border border-transparent rounded-r-xl shadow-xl text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:scale-[1.02] active:scale-95">
                Explorar
              </button>
            </div>
          </div>
          <button (click)="useMyLocation()" class="mt-4 text-sm text-indigo-200 hover:text-white flex items-center transition-colors">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.078 2.027-.231 3.02M15.428 15.428L19.5 19.5"></path></svg>
            Usar mi ubicación actual
          </button>
        </div>
      </div>

      <!-- BANNERS PROMOCIONALES -->
      @if (banners().length > 0) {
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
          <!-- Simple Horizontal Scroll for Banners -->
          <div class="flex overflow-x-auto space-x-6 pb-4 snap-x hide-scroll">
            @for (banner of banners(); track banner.id) {
              <div class="flex-none w-[85vw] md:w-[60vw] lg:w-[45vw] h-48 md:h-56 snap-center rounded-2xl overflow-hidden shadow-lg cursor-pointer transform transition-transform relative bg-indigo-100 group"
                   (click)="onBannerClick(banner)">
                <img [src]="banner.imageUrl || banner['image_url']" [alt]="banner.title || 'Promoción'" class="w-full h-full object-cover transition-transform group-hover:scale-110">
                @if (banner.title) {
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p class="text-white font-bold text-lg drop-shadow-md line-clamp-1">{{ banner.title }}</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- TIENDAS SECTION -->
      <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 mt-4">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-extrabold text-gray-900 tracking-tight">Tiendas Disponibles</h2>
        </div>

        @if (isLoading()) {
          <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        } @else {
          @if (stores().length === 0) {
            <div class="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No encontramos tiendas</h3>
              <p class="mt-1 text-sm text-gray-500">Intenta buscar en otra ciudad o usar tu ubicación actual.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              @for (store of stores(); track store.id) {
                <div class="relative bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 group">
                  <div class="p-6">
                    <div class="flex items-center mb-4">
                      <div class="h-16 w-16 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm overflow-hidden border border-gray-100">
                        <img *ngIf="store.logoUrl" [src]="store.logoUrl" class="w-full h-full object-cover">
                        <span *ngIf="!store.logoUrl">{{ store.name.charAt(0).toUpperCase() }}</span>
                      </div>
                      <div class="ml-4">
                        <h3 class="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          <a [routerLink]="['/tiendas', store.slug]" class="focus:outline-none">
                            <span class="absolute inset-0" aria-hidden="true"></span>
                            {{ store.name }}
                          </a>
                        </h3>
                        <p class="text-sm text-gray-500">{{ store.city }}, {{ store.state }}</p>
                      </div>
                    </div>
                    
                    <!-- Cover Photo -->
                    <div class="relative h-40 rounded-xl overflow-hidden mb-4 bg-gray-100 border border-gray-200">
                      <img *ngIf="store.photos && store.photos.length > 0" [src]="store.photos[0]" class="w-full h-full object-cover">
                      <div *ngIf="!store.photos || store.photos.length === 0" class="w-full h-full flex items-center justify-center text-gray-400">
                        <svg class="h-12 w-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                    </div>

                    <div class="flex flex-col gap-2">
                      <div class="flex items-center text-sm text-gray-500">
                        <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span class="truncate">{{ store.address }}</span>
                      </div>
                      @if (store.distanceKm !== undefined) {
                        <div class="flex items-center text-sm font-semibold text-indigo-600 bg-indigo-50 inline-flex px-2 py-1 rounded-md w-fit">
                          <svg class="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          A {{ store.distanceKm }} km de ti
                        </div>
                      }
                    </div>
                  </div>
                  <div class="bg-gray-50/50 px-6 py-3 border-t border-gray-50 flex items-center justify-between">
                     <span class="text-sm font-semibold text-gray-600 group-hover:text-indigo-600 transition-colors">Ver catálogo</span>
                     <svg class="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                     </svg>
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>
      
    </div>
  `,
  styles: [`
    .hide-scroll::-webkit-scrollbar {
      display: none;
    }
    .hide-scroll {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private socketService = inject(SocketService);
  private router = inject(Router);

  stores = signal<PublicStore[]>([]);
  banners = signal<Banner[]>([]);
  activeOrder = signal<any>(null);

  isLoading = signal<boolean>(false);
  searchCity: string = '';

  private socketSub: any;

  ngOnInit() {
    this.loadAllStores();
    this.loadBanners();

    if (this.authService.isAuthenticated()) {
      this.loadActiveOrder();
    }
  }

  loadAllStores() {
    this.isLoading.set(true);
    this.http.get<PublicStore[]>(`${environment.apiUrl}/api/stores`).subscribe({
      next: (data) => {
        this.stores.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadBanners() {
    this.http.get<Banner[]>(`${environment.apiUrl}/api/banners/active`).subscribe({
      next: (data) => this.banners.set(data),
      error: (e) => console.error('Error cargando banners', e)
    });
  }

  loadActiveOrder() {
    const token = this.authService.getToken();
    if (!token) return;

    this.http.get<any>(`${environment.apiUrl}/api/orders/me/active`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (order) => {
        if (order) {
          this.activeOrder.set(order);
          this.setupSocketForOrder(order.storeId);
        }
      },
      error: (e) => console.error('Error al verificar orden activa', e)
    });
  }

  setupSocketForOrder(storeId: number) {
    this.socketService.connect();
    this.socketService.joinStoreRoom(storeId.toString());

    this.socketSub = this.socketService.onOrderStatusUpdated().subscribe(update => {
      const currentOrder = this.activeOrder();
      if (currentOrder && currentOrder.id === update.orderId) {
        // If order becomes inactive (delivered, cancelled), we could remove it from view
        if (update.status === 'delivered' || update.status === 'cancelled') {
          setTimeout(() => this.activeOrder.set(null), 3000); // 3 seconds to let them see it finished
        }
        this.activeOrder.set({ ...currentOrder, status: update.status });
      }
    });
  }

  ngOnDestroy() {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
    const currentOrder = this.activeOrder();
    if (currentOrder && currentOrder.storeId) {
      this.socketService.leaveStoreRoom(currentOrder.storeId.toString());
    }
  }

  searchNearby() {
    if (!this.searchCity.trim()) {
      this.loadAllStores();
      return;
    }
    this.isLoading.set(true);
    this.http.get<PublicStore[]>(`${environment.apiUrl}/api/stores`).subscribe({
      next: (data) => {
        const filtered = data.filter(s => s.city.toLowerCase().includes(this.searchCity.toLowerCase()));
        this.stores.set(filtered);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  useMyLocation() {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }
    this.isLoading.set(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        console.log(`Buscando tiendas cerca a lat: ${lat}, lng: ${lng}`);

        // Use a large radius of 50km to be more forgiving in testing (Bogota <-> Medellin will still fail but locally it works)
        this.http.get<PublicStore[]>(`${environment.apiUrl}/api/stores/nearby?latitude=${lat}&longitude=${lng}&radiusKm=50`).subscribe({
          next: (data) => {
            this.stores.set(data);
            this.isLoading.set(false);
            if (data.length === 0) {
              alert(`No hay tiendas en un radio de 50km de tu ubicación actual (Lat: ${lat.toFixed(2)}, Lng: ${lng.toFixed(2)})`);
            }
          },
          error: () => {
            alert('Error al buscar tiendas cercanas');
            this.isLoading.set(false);
          }
        });
      },
      (error) => {
        alert('No pudimos obtener tu ubicación.');
        this.isLoading.set(false);
      }
    );
  }

  onBannerClick(banner: Banner) {
    if (banner.linkUrl) {
      if (banner.linkUrl.startsWith('http')) {
        window.open(banner.linkUrl, '_blank');
      } else {
        this.router.navigateByUrl(banner.linkUrl);
      }
    } else if (banner.storeId || banner['store_id']) {
      const sid = banner.storeId || banner['store_id'];
      // Find the store slug from our loaded stores list
      const store = this.stores().find(s => s.id === sid);
      if (store) {
        this.router.navigate(['/tiendas', store.slug]);
      }
    }
  }

  getProgressPercentage(status: string): number {
    switch (status) {
      case 'pending': return 10;
      case 'confirmed': return 30;
      case 'preparing': return 50;
      case 'ready_for_pickup': return 100;
      case 'out_for_delivery': return 100;
      default: return 0;
    }
  }

  isStatusActive(currentStatus: string, checkStatus: string): boolean {
    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const checkIndex = statusOrder.indexOf(checkStatus);
    if (currentIndex === -1 || checkIndex === -1) return false;
    return currentIndex >= checkIndex;
  }

  getStatusText(status: string): string {
    const map: any = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      preparing: 'Empaquetando',
      ready_for_pickup: 'Listo para recoger',
      out_for_delivery: 'En camino'
    };
    return map[status] || status;
  }
}
