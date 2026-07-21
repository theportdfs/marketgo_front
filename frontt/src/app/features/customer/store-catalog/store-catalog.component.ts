import { environment } from '../../../../environments/environment';
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CartService } from '../../../core/services/cart.service';
import { SocketService } from '../../../core/services/socket.service';
import { CartDrawerComponent } from '../components/cart-drawer/cart-drawer.component';

export interface PublicStoreProduct {
  id: number;
  productId: number;
  storeId: number;
  price: number;
  stock: number; // general stock
  product: {
    name: string;
    description: string;
    sku: string;
    imageUrl: string;
    unit: string;
    category?: string;
  };
  batches: {
    id: number;
    quantity: number;
    isOnSale: boolean;
    salePrice: number;
    expirationDate: string;
  }[];
  // Computed fields on frontend
  totalAvailableStock?: number;
}

export interface StoreInfo {
  id: number;
  name: string;
  slug: string;
  openingHours?: string;
  logoUrl?: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
}

@Component({
  selector: 'app-store-catalog',
  standalone: true,
  imports: [CommonModule, CartDrawerComponent],
  template: `
    <div class="min-h-screen bg-gray-50 relative pb-20">
      
      <!-- Store Header -->
      <div class="bg-indigo-600 text-white shadow-md">
        <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div class="flex items-center space-x-4">
            @if (storeInfo()?.logoUrl) {
              <div class="h-20 w-20 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-inner border-2 border-white">
                <img [src]="storeInfo()?.logoUrl" alt="Store Logo" class="w-full h-full object-cover">
              </div>
            } @else {
              <div class="h-16 w-16 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl shadow-inner">
                {{ storeSlug()?.charAt(0)?.toUpperCase() || 'T' }}
              </div>
            }
            <div>
              <h1 class="text-3xl font-extrabold tracking-tight">Tienda: {{ storeInfo()?.name || storeSlug() }}</h1>
              <p class="mt-1 text-indigo-100 text-sm flex items-center">
                <span class="w-2 h-2 rounded-full mr-2" [ngClass]="isStoreOpen() ? 'bg-green-400 animate-pulse' : 'bg-red-400'"></span>
                {{ isStoreOpen() ? 'Abierto Ahora' : 'Cerrado Ahora' }} - Catálogo en vivo
              </p>
              @if (storeScheduleText()) {
                <p class="mt-1 text-indigo-200 text-xs flex items-center">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {{ storeScheduleText() }}
                </p>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        @if (isLoading()) {
          <div class="flex justify-center items-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        } @else {
          
          <!-- Store Banners -->
          @if (storeBanners().length > 0) {
            <div class="mb-10 w-full rounded-2xl overflow-hidden shadow-md">
              <div class="flex overflow-x-auto snap-x hide-scroll">
                @for (banner of storeBanners(); track banner.id) {
                  <div class="snap-start shrink-0 w-full sm:w-1/2 lg:w-1/3 p-2">
                    <div (click)="handleBannerClick(banner)" class="block w-full h-48 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative cursor-pointer">
                      <img [src]="banner.imageUrl" class="w-full h-full object-cover" [alt]="banner.title || 'Banner'">
                      @if (banner.title) {
                        <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <h3 class="text-white font-bold">{{ banner.title }}</h3>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Store Photos Carousel -->
          @if (storeInfo()?.photos && storeInfo()?.photos!.length > 0) {
            <div class="mb-10">
              <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg class="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Conoce la Tienda
              </h2>
              <div class="flex overflow-x-auto gap-4 pb-4 snap-x hide-scroll">
                @for (photo of storeInfo()?.photos; track photo) {
                  <div class="snap-start shrink-0 w-72 h-48 rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer" (click)="openPhoto(photo)">
                    <img [src]="photo" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
                  </div>
                }
              </div>
            </div>
          }

          @if (bundles().length > 0) {
            <div class="mb-12">
              <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span class="bg-orange-100 text-orange-600 p-2 rounded-lg mr-3">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </span>
                Combos y Promociones
              </h2>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                @for (bundle of bundles(); track bundle.id) {
                  <div [id]="'bundle-' + bundle.id" class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-sm border border-orange-100 p-6 flex flex-col relative overflow-hidden group">
                    <div class="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-orange-200 rounded-full opacity-50 transition-transform group-hover:scale-150"></div>
                    
                    <h3 class="text-xl font-black text-orange-900 relative z-10">
                      {{ bundle.name }}
                      @if (bundle.storeId === null) {
                        <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                          Global
                        </span>
                      }
                    </h3>
                    @if (bundle.imageUrl) {
                      <div class="mt-3 relative z-10 rounded-lg overflow-hidden h-32">
                        <img [src]="bundle.imageUrl" class="w-full h-full object-cover" alt="Bundle Image">
                      </div>
                    }
                    <p class="text-sm text-orange-700 mt-3 relative z-10 line-clamp-2">{{ bundle.description }}</p>
                    
                    <div class="mt-6 mb-8 relative z-10 flex-1">
                      <p class="text-xs font-bold text-orange-800 uppercase tracking-widest mb-3">Incluye:</p>
                      <ul class="space-y-2">
                        @for (item of bundle.items; track item.id) {
                          <li class="flex items-center text-sm font-medium text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                            <span class="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-0.5 rounded mr-2">{{ item.quantity }}x</span>
                            {{ item.product?.name }}
                          </li>
                        }
                      </ul>
                    </div>
                    
                    <div class="mb-4 text-center">
                      @if (bundle.discountPercentage > 0) {
                        <p class="text-sm text-gray-500 line-through leading-none mb-1">\${{ getBundleOriginalPrice(bundle) | number:'1.0-0' }}</p>
                        <p class="text-xl font-extrabold text-green-600 leading-none">
                          \${{ getBundleFinalPrice(bundle) | number:'1.0-0' }} 
                          <span class="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full ml-2 border border-green-200">-{{ bundle.discountPercentage }}%</span>
                        </p>
                      } @else {
                        <p class="text-xl font-extrabold text-gray-900 leading-none">\${{ getBundleOriginalPrice(bundle) | number:'1.0-0' }}</p>
                      }
                    </div>

                    <button (click)="addBundleToCart(bundle)" 
                            [disabled]="!canAddBundle(bundle)"
                            class="relative z-10 w-full font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            [ngClass]="canAddBundle(bundle) ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'">
                      @if (canAddBundle(bundle)) {
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        Añadir Combo
                      } @else {
                        Agotado
                      }
                    </button>
                  </div>
                }
              </div>
            </div>
            
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Todos los Productos</h2>
          }

          <!-- STICKY CATEGORY FILTER -->
          @if (categories().length > 1) {
            <div class="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-sm py-4 mb-6 border-b border-gray-200">
              <div class="flex overflow-x-auto space-x-2 pb-2 hide-scroll snap-x">
                @for (category of categories(); track category) {
                  <button (click)="selectCategory(category)" 
                          class="snap-start shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap shadow-sm border"
                          [ngClass]="selectedCategory() === category ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'">
                    {{ category }}
                  </button>
                }
              </div>
            </div>
          }

          @if (filteredProducts().length === 0) {
            <div class="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
              <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">Sin productos</h3>
              <p class="mt-1 text-sm text-gray-500">Esta tienda aún no tiene productos disponibles.</p>
            </div>
          } @else {
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              @for (item of filteredProducts(); track item.productId) {
                <div [id]="'product-' + item.productId" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow relative group">
                  
                  <!-- Out of stock overlay -->
                  @if (item.totalAvailableStock === 0) {
                    <div class="absolute inset-0 bg-white bg-opacity-70 z-10 flex flex-col items-center justify-center backdrop-blur-[1px]">
                      <span class="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-red-200">Agotado</span>
                    </div>
                  }

                  <div class="aspect-w-1 aspect-h-1 bg-gray-50 flex items-center justify-center p-4">
                    <img *ngIf="item.product.imageUrl" [src]="item.product.imageUrl" alt="" class="object-contain h-24 w-full">
                    <div *ngIf="!item.product.imageUrl" class="h-24 flex items-center justify-center text-gray-300">
                       <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                  </div>
                  <div class="p-4 flex-1 flex flex-col">
                    <h3 class="text-sm font-bold text-gray-900 line-clamp-2 leading-tight flex-1">{{ item.product.name }}</h3>
                    <p class="text-[10px] text-gray-400 mt-1 mb-2">{{ item.product.sku }}</p>
                    
                    <div class="flex items-end justify-between mt-auto">
                      <div>
                        @if (hasSale(item)) {
                          <p class="text-xs text-gray-400 line-through leading-none">\${{ item.price }} / {{ item.product.unit || 'u.' }}</p>
                          <p class="text-lg font-extrabold text-green-600 leading-none mt-1">\${{ getBestPrice(item) }} / {{ item.product.unit || 'u.' }}</p>
                        } @else {
                          <p class="text-lg font-extrabold text-gray-900 leading-none">\${{ item.price }} / <span class="text-sm font-medium text-gray-500">{{ item.product.unit || 'u.' }}</span></p>
                        }
                      </div>
                      <div class="text-right">
                        <p class="text-[10px] font-semibold text-gray-500">Disp.</p>
                        <p class="text-xs font-bold" [ngClass]="{'text-red-500': item.totalAvailableStock! <= 5, 'text-gray-900': item.totalAvailableStock! > 5}">{{ item.totalAvailableStock }} {{ item.product.unit === 'g' || item.product.unit === 'ml' ? item.product.unit : 'u.' }}</p>
                      </div>
                    </div>

                    <!-- QUICK ADD BUTTON ON HOVER -->
                    <button (click)="addToCart(item)" 
                            [disabled]="item.totalAvailableStock === 0"
                            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white rounded-full p-3 shadow-xl disabled:hidden z-20">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    </button>

                    <button (click)="addToCart(item)" 
                            [disabled]="item.totalAvailableStock === 0"
                            class="mt-4 w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-100 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center">
                      <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                      Añadir
                    </button>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Store Location Map -->
          @if (storeInfo()?.latitude && storeInfo()?.longitude) {
            <div class="mt-16 mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <svg class="w-6 h-6 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Nuestra Ubicación
              </h2>
              <div class="w-full h-80 rounded-xl overflow-hidden shadow-inner bg-gray-100">
                <iframe 
                  [src]="getMapUrl(storeInfo()?.latitude!, storeInfo()?.longitude!)" 
                  width="100%" 
                  height="100%" 
                  style="border:0;" 
                  allowfullscreen="" 
                  loading="lazy" 
                  referrerpolicy="no-referrer-when-downgrade">
                </iframe>
              </div>
            </div>
          }
        }
      </div>

      <!-- Fullscreen Photo Modal -->
      @if (selectedPhoto()) {
        <div class="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center p-4 cursor-pointer" (click)="closePhoto()">
          <button class="absolute top-6 right-6 text-white hover:text-gray-300 focus:outline-none" (click)="closePhoto()">
            <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img [src]="selectedPhoto()" class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default" (click)="$event.stopPropagation()">
        </div>
      }

      <app-cart-drawer></app-cart-drawer>
    </div>
  `
})
export class StoreCatalogComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private cartService = inject(CartService);
  private socketService = inject(SocketService);
  private sanitizer = inject(DomSanitizer);

  storeSlug = signal<string | null>(null);
  storeId = signal<number | null>(null);
  storeInfo = signal<StoreInfo | null>(null);
  storeBanners = signal<any[]>([]);
  products = signal<PublicStoreProduct[]>([]);
  bundles = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  
  categories = signal<string[]>(['Todos']);
  selectedCategory = signal<string>('Todos');
  selectedPhoto = signal<string | null>(null);

  filteredProducts = computed(() => {
    if (this.selectedCategory() === 'Todos') return this.products();
    return this.products().filter(p => (p.product?.category || 'General') === this.selectedCategory());
  });

  isStoreOpen = signal<boolean>(true);
  storeScheduleText = signal<string>('');

  private socketSub: any;

  ngOnInit() {
    this.storeSlug.set(this.route.snapshot.paramMap.get('slug'));
    if (this.storeSlug()) {
      this.loadCatalog();
    }
  }

  loadCatalog() {
    this.isLoading.set(true);
    
    // Fetch store info
    this.http.get<StoreInfo>(`${environment.apiUrl}/api/stores/public/${this.storeSlug()}`).subscribe({
      next: (store) => {
        this.storeInfo.set(store);
        this.processSchedule(store.openingHours);
      },
      error: (e) => console.error('Error fetching store info', e)
    });

    // Fetch bundles
    this.http.get<any[]>(`${environment.apiUrl}/api/catalog/public/store/${this.storeSlug()}/bundles`).subscribe({
      next: (bundles) => this.bundles.set(bundles),
      error: (e) => console.error('Error fetching bundles', e)
    });

    // Fetch store banners
    this.http.get<any[]>(`${environment.apiUrl}/api/banners/store/${this.storeSlug()}`).subscribe({
      next: (banners) => this.storeBanners.set(banners),
      error: (e) => console.error('Error fetching store banners', e)
    });

    // Fetch catalog
    this.http.get<PublicStoreProduct[]>(`${environment.apiUrl}/api/catalog/public/store/${this.storeSlug()}`)
      .subscribe({
        next: (data) => {
          // Filter out null products to avoid rendering crashes
          const validData = data.filter(p => p.product);
          // Calculate total stock including batches
          const processed = validData.map(p => {
            const batchStock = p.batches ? p.batches.reduce((acc, b) => acc + b.quantity, 0) : 0;
            p.totalAvailableStock = p.stock + batchStock;
            return p;
          });
          
          this.products.set(processed);
          
          // Extract unique categories
          const cats = new Set<string>();
          processed.forEach(p => {
            if (p.product && p.product.category) {
              cats.add(p.product.category);
            } else {
              cats.add('General');
            }
          });
          const catArray = Array.from(cats).sort();
          this.categories.set(['Todos', ...catArray]);

          if (processed.length > 0 && !this.storeId()) {
            this.storeId.set(processed[0].storeId);
            this.setupSocket();
          }
          
          this.isLoading.set(false);
          this.syncCartMaxStock();
        },
        error: () => {
          this.isLoading.set(false);
          alert('Error al cargar la tienda');
        }
      });
  }

  processSchedule(scheduleStr?: string) {
    if (!scheduleStr) {
      this.isStoreOpen.set(true);
      this.storeScheduleText.set('');
      return;
    }
    
    try {
      const schedule = JSON.parse(scheduleStr);
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const now = new Date();
      const todayDayId = days[now.getDay()];
      
      const todaySchedule = schedule.find((d: any) => d.id === todayDayId);
      
      if (!todaySchedule || !todaySchedule.isOpen) {
        this.isStoreOpen.set(false);
        this.storeScheduleText.set('Cerrado hoy');
        return;
      }
      
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const [openH, openM] = todaySchedule.openTime.split(':').map(Number);
      const openMinutes = openH * 60 + openM;
      
      const [closeH, closeM] = todaySchedule.closeTime.split(':').map(Number);
      const closeMinutes = closeH * 60 + closeM;
      
      if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
        this.isStoreOpen.set(true);
      } else {
        this.isStoreOpen.set(false);
      }
      
      this.storeScheduleText.set(`Hoy de ${todaySchedule.openTime} a ${todaySchedule.closeTime}`);
      
    } catch (e) {
      this.isStoreOpen.set(true);
    }
  }

  getMapUrl(lat: number, lng: number): SafeResourceUrl {
    const url = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  openPhoto(photoUrl: string) {
    this.selectedPhoto.set(photoUrl);
  }

  closePhoto() {
    this.selectedPhoto.set(null);
  }

  handleBannerClick(banner: any) {
    if (!banner.linkUrl) return;

    if (banner.linkUrl.startsWith('#product-') || banner.linkUrl.startsWith('#bundle-')) {
      // Find element and scroll to it smoothly
      const elementId = banner.linkUrl.substring(1);
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Optional: Add a highlight effect
          element.classList.add('ring-4', 'ring-indigo-500', 'ring-opacity-50', 'transition-all', 'duration-500');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-indigo-500', 'ring-opacity-50');
          }, 2000);
        }
      }, 100);
    } else {
      // It's a regular external URL
      window.open(banner.linkUrl, '_blank');
    }
  }

  setupSocket() {
    this.socketService.connect();
    this.socketService.joinStoreRoom(this.storeId()!.toString());

    this.socketSub = this.socketService.onStockUpdated().subscribe(update => {
      console.log('Live update received:', update);
      // For simplicity and to ensure accuracy, refetch the catalog when stock updates
      // This ensures we get the latest batches/sales as well.
      this.loadCatalog();
    });
  }

  ngOnDestroy() {
    if (this.storeId()) {
      this.socketService.leaveStoreRoom(this.storeId()!.toString());
    }
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
  }

  hasSale(item: PublicStoreProduct): boolean {
    return item.batches && item.batches.some(b => b.isOnSale);
  }

  getBestPrice(item: PublicStoreProduct): number {
    if (!this.hasSale(item)) return item.price;
    const salePrices = item.batches.filter(b => b.isOnSale).map(b => b.salePrice);
    return Math.min(...salePrices, item.price);
  }

  async addToCart(item: PublicStoreProduct) {
    if (item.totalAvailableStock === undefined || item.totalAvailableStock === 0) return;
    
    // 1. UI Optimista: Restar visualmente el stock
    item.totalAvailableStock -= 1;
    
    try {
      // 2. Petición al backend
      await this.cartService.addItemOptimistic(
        item.storeId,
        this.storeSlug()!,
        item.productId,
        item.product?.name || 'Producto Desconocido',
        this.getBestPrice(item),
        1,
        item.product?.unit || 'unidad'
      );
    } catch (error) {
      // 3. Rollback en caso de error
      item.totalAvailableStock += 1;
    }
  }

  syncCartMaxStock() {
    // If the catalog is refreshed (e.g. from a websocket event), 
    // we should tell the cart to validate its current quantities against the new maxStock.
    this.products().forEach(p => {
      this.cartService.updateItemMaxStock(p.productId, p.totalAvailableStock!);
    });
  }

  canAddBundle(bundle: any): boolean {
    if (!bundle || !bundle.items) return false;
    for (const bItem of bundle.items) {
      const catalogItem = this.products().find(p => p.productId === bItem.productId);
      if (!catalogItem || (catalogItem.totalAvailableStock || 0) < bItem.quantity) {
        return false;
      }
    }
    return true;
  }

  async addBundleToCart(bundle: any) {
    if (!bundle || !bundle.items) return;
    if (!this.canAddBundle(bundle)) return;
    
    // Convert bundle items to cart item payload format
    // We need unitPrice. Since bundles don't store real-time price, we pull it from products()
    const mappedItems = bundle.items.map((bItem: any) => {
      const catalogItem = this.products().find(p => p.productId === bItem.productId);
      const originalUnitPrice = catalogItem ? this.getBestPrice(catalogItem) : 0;
      
      // Aplicar porcentaje de descuento si el combo lo tiene
      const discount = bundle.discountPercentage || 0;
      const unitPrice = originalUnitPrice * (1 - (discount / 100));
      
      return {
        productId: bItem.productId,
        quantity: bItem.quantity,
        unitPrice: unitPrice
      };
    });

    try {
      const storeIdForCart = bundle.storeId || this.storeId();
      await this.cartService.addMultipleItems(storeIdForCart, this.storeSlug()!, mappedItems);
    } catch (e) {
      console.error('Error adding bundle to cart', e);
    }
  }

  getBundleOriginalPrice(bundle: any): number {
    if (!bundle || !bundle.items) return 0;
    return bundle.items.reduce((total: number, bItem: any) => {
      const catalogItem = this.products().find(p => p.productId === bItem.productId);
      const unitPrice = catalogItem ? this.getBestPrice(catalogItem) : 0;
      return total + (unitPrice * bItem.quantity);
    }, 0);
  }

  getBundleFinalPrice(bundle: any): number {
    const original = this.getBundleOriginalPrice(bundle);
    const discount = bundle.discountPercentage || 0;
    return original * (1 - (discount / 100));
  }
}
