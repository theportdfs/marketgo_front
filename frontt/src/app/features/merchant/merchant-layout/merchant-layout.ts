import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { StoreService, Store } from '../../../core/services/store';

@Component({

  selector: 'app-merchant-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex">
      <!-- Sidebar -->
      <aside class="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col z-20">
        <!-- Logo Area -->
        <div class="h-20 flex items-center px-6 border-b border-gray-100">
          <a routerLink="/" class="text-2xl font-black tracking-tighter text-indigo-600 flex items-center gap-2">
            <svg class="w-8 h-8 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16.5C21 16.88 20.79 17.21 20.47 17.38L12.57 21.82C12.22 22.02 11.78 22.02 11.43 21.82L3.53 17.38C3.21 17.21 3 16.88 3 16.5V7.5C3 7.12 3.21 6.79 3.53 6.62L11.43 2.18C11.78 1.98 12.22 1.98 12.57 2.18L20.47 6.62C20.79 6.79 21 7.12 21 7.5V16.5Z"/>
            </svg>
            MiniMarket
          </a>
        </div>
        
        <!-- User/Store Profile -->
        <div class="p-5 border-b border-gray-100 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg overflow-hidden shrink-0">
            @if (myStore()?.logoUrl) {
              <img [src]="myStore()?.logoUrl" class="w-full h-full object-cover">
            } @else {
              {{ myStore()?.name?.charAt(0) || 'M' }}
            }
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-900 truncate">
              {{ myStore()?.name || 'Cargando...' }}
            </p>
            <p class="text-xs text-gray-500 truncate">
              {{ authService.currentUser()?.name || authService.currentUser()?.email }}
            </p>
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex-1 overflow-y-auto py-5 px-3">
          <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">Panel Principal</div>
          <nav class="space-y-1 mb-8">
            <a routerLink="/merchant/dashboard" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold" [routerLinkActiveOptions]="{exact: true}"
               class="group flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              <svg class="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" [ngClass]="{'text-indigo-600': isActive('/merchant/dashboard')}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Punto de Venta (POS)
            </a>
            
            <a routerLink="/merchant/orders" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold" 
               class="group flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors justify-between">
              <div class="flex items-center">
                <svg class="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" [ngClass]="{'text-indigo-600': isActive('/merchant/orders')}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Pedidos en Línea
              </div>
            </a>
            
            <a routerLink="/merchant/analytics" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold" 
               class="group flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              <svg class="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" [ngClass]="{'text-indigo-600': isActive('/merchant/analytics')}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              Gráficas / Reportes
            </a>
          </nav>

          <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">Gestión de Catálogo</div>
          <nav class="space-y-1 mb-8">
            <a routerLink="/merchant/inventory" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold" 
               class="group flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              <svg class="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" [ngClass]="{'text-indigo-600': isActive('/merchant/inventory')}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Inventario
            </a>
            
            <a routerLink="/merchant/bundles" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold" 
               class="group flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              <svg class="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" [ngClass]="{'text-indigo-600': isActive('/merchant/bundles')}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Combos / Promociones
            </a>
          </nav>

          <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">Administración</div>
          <nav class="space-y-1">
            <a routerLink="/merchant/banners" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold" 
               class="group flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              <svg class="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" [ngClass]="{'text-indigo-600': isActive('/merchant/banners')}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Mis Banners
            </a>
            
            <a routerLink="/merchant/settings" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold" 
               class="group flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              <svg class="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" [ngClass]="{'text-indigo-600': isActive('/merchant/settings')}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configurar Tienda
            </a>
          </nav>
        </div>
        
        <div class="p-4 border-t border-gray-100 bg-white">
          <button (click)="logout()" class="flex w-full items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors">
            <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <!-- Mobile header -->
        <div class="md:hidden h-16 bg-white shadow-sm flex items-center justify-between px-4 sm:px-6 z-10 relative">
          <a routerLink="/" class="text-xl font-black text-indigo-600">MiniMarket</a>
          <button (click)="logout()" class="text-sm font-medium text-gray-500 hover:text-gray-900">Salir</button>
        </div>
        
        <!-- Contenedor dinámico (outlet) -->
        <div class="flex-1 overflow-y-auto h-full w-full">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class MerchantLayoutComponent implements OnInit {
  authService = inject(AuthService);
  storeService = inject(StoreService);
  private router = inject(Router);

  myStore = signal<Store | null>(null);

  ngOnInit() {
    this.storeService.getMyStore().subscribe({
      next: (store) => this.myStore.set(store),
      error: () => console.log('Store not found')
    });
  }

  logout() {
    this.authService.logout();
  }

  // helper to tint icons when active
  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}
