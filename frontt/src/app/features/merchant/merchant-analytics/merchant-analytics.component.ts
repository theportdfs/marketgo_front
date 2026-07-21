import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-merchant-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Gráficas y Reportes</h1>
        <p class="text-gray-500 mt-1">Aquí podrás visualizar el rendimiento detallado de tu negocio.</p>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <svg class="mx-auto h-12 w-12 text-indigo-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 class="text-lg font-bold text-gray-900">Módulo en Construcción</h3>
        <p class="text-gray-500 mt-2">Pronto añadiremos gráficos interactivos de ventas, historial y reportes avanzados aquí.</p>
      </div>
    </div>
  `
})
export class MerchantAnalyticsComponent {}
