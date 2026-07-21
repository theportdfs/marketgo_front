import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-100 flex">
      <!-- Sidebar -->
      <aside class="w-64 bg-indigo-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div class="h-16 flex items-center px-6 font-bold text-xl border-b border-indigo-800">
          Admin Panel
        </div>
        <div class="flex-1 overflow-y-auto py-4">
          <nav class="space-y-1 px-2">
            <a routerLink="/admin/stores" routerLinkActive="bg-indigo-800" class="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md hover:bg-indigo-800 transition-colors">
              <svg class="mr-3 h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Tiendas
            </a>
            <a routerLink="/admin/catalog" routerLinkActive="bg-indigo-800" class="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md hover:bg-indigo-800 transition-colors">
              <svg class="mr-3 h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Catálogo Maestro
            </a>
            <a routerLink="/admin/banners" routerLinkActive="bg-indigo-800" class="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md hover:bg-indigo-800 transition-colors">
              <svg class="mr-3 h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Banners Promocionales
            </a>
            <a routerLink="/admin/bundles" routerLinkActive="bg-indigo-800" class="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md hover:bg-indigo-800 transition-colors">
              <svg class="mr-3 h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              Combos Globales
            </a>
          </nav>
        </div>
        <div class="p-4 border-t border-indigo-800">
          <button (click)="logout()" class="flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-md text-indigo-200 hover:text-white hover:bg-indigo-800 transition-colors">
            <svg class="mr-3 h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Top header for mobile -->
        <div class="md:hidden h-16 bg-white shadow-sm flex items-center justify-between px-4 sm:px-6">
          <div class="font-bold text-lg text-indigo-900">Admin Panel</div>
          <button (click)="logout()" class="text-sm font-medium text-gray-500 hover:text-gray-900">Salir</button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }
}
