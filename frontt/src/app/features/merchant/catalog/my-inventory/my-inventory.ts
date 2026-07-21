import { environment } from '../../../../../environments/environment';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MasterProduct } from '../../../admin/master-catalog/master-catalog';
import { ImageUploaderComponent } from '../../../../shared/components/image-uploader/image-uploader.component';

export interface ProductBatch {
  id?: number;
  quantity: number;
  expirationDate: string | null;
  isOnSale: boolean;
  salePrice: number | null;
}

export interface StoreProduct {
  id?: number;
  storeId: number;
  productId: number;
  price: number;
  stock: number;
  isActive: boolean;
  product?: MasterProduct;
  batches?: ProductBatch[];
}

@Component({
  selector: 'app-my-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ImageUploaderComponent],
  template: `
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      <!-- Lotes Info Banner -->
      <div class="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md shadow-sm">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-bold text-blue-800">¿Cómo funciona el control de inventario?</h3>
            <div class="mt-2 text-sm text-blue-700">
              <p>Puedes registrar tus productos de dos formas:</p>
              <ul class="list-disc pl-5 mt-1 space-y-1">
                <li><strong>Stock Genérico:</strong> Cantidad total sin fecha de vencimiento. (Ideal para productos no perecederos o venta rápida).</li>
                <li><strong>Lotes con Vencimiento:</strong> Te permite registrar cuándo vence una cantidad específica. El sistema te alertará días antes de su caducidad para que puedas aplicar descuentos.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Header & Actions -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">Mi Inventario</h2>
          <p class="mt-2 text-lg text-gray-500">Administra precios, stock general y lotes de vencimiento.</p>
        </div>
        <div class="mt-4 sm:mt-0 flex space-x-3 items-center">
          <div class="relative w-full sm:w-64">
            <input type="text" [(ngModel)]="searchTerm" placeholder="Buscar producto..."
                   class="block w-full rounded-md border-gray-300 pl-10 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          <button (click)="openAddModal()" type="button" class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
            <svg class="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Catálogo Global
          </button>
          
          <button (click)="openCustomModal()" type="button" class="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors">
            <svg class="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Crear Propio
          </button>
        </div>
      </div>

      <!-- Inventory Grid -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (item of filteredInventory(); track item.id) {
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow relative">
              <div class="aspect-w-16 aspect-h-9 bg-gray-100 flex items-center justify-center p-4">
                <img *ngIf="item.product?.imageUrl" [src]="item.product?.imageUrl" alt="" class="object-contain h-32 w-full rounded-md">
                <div *ngIf="!item.product?.imageUrl" class="h-32 flex items-center justify-center text-gray-400">
                  <svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div class="p-5">
                <h3 class="text-lg font-bold text-gray-900 truncate">{{ item.product?.name }}</h3>
                <p class="text-sm font-mono text-gray-500 mt-1 mb-4">SKU: {{ item.product?.sku }}</p>
                
                <div class="flex items-center justify-between mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div>
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</p>
                    <div class="flex items-center space-x-2">
                      <p class="text-lg font-bold" [ngClass]="hasActiveSale(item) ? 'text-gray-400 line-through text-sm' : 'text-indigo-600'">\${{ item.price }}</p>
                      @if (hasActiveSale(item)) {
                        <p class="text-lg font-bold text-green-600">\${{ getLowestSalePrice(item) }}</p>
                      }
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Total</p>
                    <p class="text-lg font-bold text-gray-900" [ngClass]="{'text-red-500': getTotalStock(item) <= 5}">{{ getTotalStock(item) }} u.</p>
                  </div>
                </div>

                @if (hasActiveSale(item)) {
                  <div class="mt-2 bg-green-50 border border-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center">
                    <svg class="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Producto con Lotes en Oferta
                  </div>
                }

                <div class="mt-4 grid grid-cols-2 gap-2">
                  <button (click)="openEditModal(item)" class="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center">
                    Editar Gral
                  </button>
                  <button (click)="openBatchesModal(item)" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center relative">
                    Gestionar Lotes
                    <span *ngIf="item.batches && item.batches.length > 0" class="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {{ item.batches.length }}
                    </span>
                  </button>
                </div>
                
                <button (click)="removeProduct(item.productId)" class="mt-2 w-full bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors text-center" title="Remover del inventario">
                  Eliminar del Catálogo
                </button>
              </div>
            </div>
          } @empty {
            <div class="col-span-full py-16 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No tienes productos</h3>
              <p class="mt-1 text-sm text-gray-500">Comienza añadiendo productos del catálogo maestro a tu tienda.</p>
              <div class="mt-6">
                <button (click)="openAddModal()" type="button" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <svg class="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                  Catálogo Global
                </button>
                <button (click)="openCustomModal()" type="button" class="ml-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  <svg class="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                  Crear Propio
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Modals (Add / Edit / Batches) -->
      @if (showAddModal()) {
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div class="bg-white rounded-2xl shadow-xl max-w-5xl w-full flex flex-col max-h-[90vh]">
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 class="text-xl font-bold text-gray-900">Catálogo Global</h3>
                <p class="text-sm text-gray-500">Selecciona los productos que vendes en tu negocio. Puedes agregar stock genérico o lotes específicos.</p>
              </div>
              <button (click)="closeAddModal()" class="text-gray-400 hover:text-gray-500">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div class="p-6 overflow-y-auto flex-1">
              @if (masterProducts().length === 0) {
                <p class="text-center text-gray-500 py-4">No hay productos disponibles en el catálogo global.</p>
              } @else {
                <div class="mb-4 relative">
                  <input type="text" [(ngModel)]="searchMasterTerm" placeholder="Buscar en catálogo global..."
                         class="block w-full rounded-md border-gray-300 pl-10 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (master of filteredMasterProducts(); track master.id) {
                    <div class="border border-gray-200 rounded-xl p-4 flex items-start justify-between hover:border-indigo-300 transition-colors">
                      <div class="flex items-center space-x-4 mt-2">
                         <div class="h-14 w-14 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                           <img *ngIf="master.imageUrl" [src]="master.imageUrl" class="h-14 w-14 object-cover">
                        </div>
                        <div>
                          <h4 class="text-sm font-bold text-gray-900">{{ master.name }}</h4>
                          <p class="text-xs text-gray-500">{{ master.sku }}</p>
                        </div>
                      </div>
                      
                      <!-- Formulario Independiente por Producto -->
                      <div class="flex flex-col space-y-2 w-48 bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm" *ngIf="quickAddData[master.id!]">
                        <input type="number" [(ngModel)]="quickAddData[master.id!].price" placeholder="Precio ($)" class="block w-full rounded-md border-gray-300 py-1.5 px-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        
                        <div class="flex items-center space-x-2 mt-1 mb-1">
                          <input type="checkbox" [(ngModel)]="quickAddData[master.id!].isLot" [id]="'isLot-'+master.id" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3 w-3">
                          <label [for]="'isLot-'+master.id" class="text-[11px] font-semibold text-gray-600">¿Es un lote con fecha?</label>
                        </div>

                        <input type="number" [(ngModel)]="quickAddData[master.id!].stock" [placeholder]="quickAddData[master.id!].isLot ? 'Cant. del Lote' : 'Stock General'" class="block w-full rounded-md border-gray-300 py-1.5 px-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        
                        @if (quickAddData[master.id!].isLot) {
                          <input type="date" [(ngModel)]="quickAddData[master.id!].expirationDate" class="block w-full rounded-md border-gray-300 py-1.5 px-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500" title="Fecha de Vencimiento">
                        }

                        <button (click)="quickAdd(master.id!)" 
                                [disabled]="!isValidQuickAdd(master.id!) || isSubmittingQuickAdd()" 
                                class="bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 text-xs font-bold py-1.5 px-2 rounded-md transition-colors mt-2">
                          Añadir Producto
                        </button>
                      </div>

                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      @if (showEditModal()) {
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 class="text-lg font-bold text-gray-900">Editar General</h3>
              <button (click)="closeEditModal()" class="text-gray-400 hover:text-gray-500">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="p-6">
              <div class="mb-4">
                <p class="text-sm font-medium text-gray-500">Producto</p>
                <p class="text-base font-bold text-gray-900">{{ editingItem()?.product?.name }}</p>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700">Precio de Venta Base ($)</label>
                  <input type="number" formControlName="price" class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700">Stock Genérico</label>
                  <input type="number" formControlName="stock" class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                  <p class="text-xs text-gray-500 mt-1">Este stock no tiene fecha de vencimiento asociada.</p>
                </div>
              </div>
              
              <div class="mt-6">
                <button type="submit" [disabled]="editForm.invalid" class="w-full justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (showBatchesModal()) {
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div class="bg-white rounded-2xl shadow-xl max-w-3xl w-full flex flex-col max-h-[90vh]">
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 class="text-xl font-bold text-gray-900">Gestión de Lotes: {{ activeBatchItem()?.product?.name }}</h3>
                <p class="text-sm text-gray-500">Agrega lotes específicos para controlar las fechas de vencimiento.</p>
              </div>
              <button (click)="closeBatchesModal()" class="text-gray-400 hover:text-gray-500">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div class="p-6 overflow-y-auto flex-1">
              
              <!-- Añadir nuevo lote form -->
              <div class="bg-indigo-50 rounded-xl p-4 mb-6 border border-indigo-100">
                <h4 class="text-sm font-bold text-indigo-900 mb-3">Registrar Nuevo Lote</h4>
                <form [formGroup]="batchForm" (ngSubmit)="saveBatch()" class="flex flex-wrap gap-4 items-end">
                  <div class="flex-1 min-w-[120px]">
                    <label class="block text-xs font-semibold text-indigo-800">Cantidad</label>
                    <input type="number" formControlName="quantity" class="mt-1 block w-full rounded-md border-gray-300 py-1.5 px-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  </div>
                  <div class="flex-1 min-w-[150px]">
                    <label class="block text-xs font-semibold text-indigo-800">Fecha de Vencimiento</label>
                    <input type="date" formControlName="expirationDate" class="mt-1 block w-full rounded-md border-gray-300 py-1.5 px-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  </div>
                  <div class="flex-none">
                    <button type="submit" [disabled]="batchForm.invalid || isSubmittingBatch()" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50">
                      Añadir Lote
                    </button>
                  </div>
                </form>
              </div>

              <!-- Lista de Lotes Actuales -->
              <h4 class="text-sm font-bold text-gray-700 mb-3">Lotes Activos</h4>
              @if (!activeBatchItem()?.batches || activeBatchItem()?.batches?.length === 0) {
                <p class="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">No hay lotes con fecha de vencimiento registrados para este producto.</p>
              } @else {
                <div class="space-y-3">
                  @for (batch of activeBatchItem()?.batches; track batch.id) {
                    <div class="border border-gray-200 rounded-lg p-4 flex justify-between items-center bg-white shadow-sm" [ngClass]="{'border-red-300 bg-red-50': isExpiring(batch.expirationDate)}">
                      <div>
                        <p class="text-sm font-bold text-gray-900">Cantidad: {{ batch.quantity }} u.</p>
                        <p class="text-xs font-semibold mt-1" [ngClass]="isExpiring(batch.expirationDate) ? 'text-red-600' : 'text-gray-500'">
                          Vence: {{ batch.expirationDate | date:'mediumDate' }}
                          <span *ngIf="isExpiring(batch.expirationDate)" class="ml-2 bg-red-100 text-red-800 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                            Pronto a vencer
                          </span>
                        </p>
                      </div>
                      <div class="text-right flex flex-col items-end space-y-2">
                        @if (batch.isOnSale) {
                          <div class="flex items-center space-x-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              En Oferta: \${{ batch.salePrice }}
                            </span>
                          </div>
                          <div class="flex space-x-2">
                            <button (click)="openSalePrompt(batch)" class="text-xs font-bold text-indigo-600 hover:text-indigo-900 transition-colors">
                              Editar
                            </button>
                            <span class="text-gray-300">|</span>
                            <button (click)="removeSale(batch)" class="text-xs font-bold text-red-600 hover:text-red-900 transition-colors">
                              Quitar
                            </button>
                          </div>
                        } @else {
                          <button (click)="openSalePrompt(batch)" class="text-xs font-bold text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-200 transition-colors">
                            Poner en Oferta
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      @if (showCustomModal()) {
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 class="text-lg font-bold text-gray-900">Crear Producto Personalizado</h3>
              <button (click)="closeCustomModal()" class="text-gray-400 hover:text-gray-500">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form [formGroup]="customForm" (ngSubmit)="saveCustom()" class="p-6 overflow-y-auto">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700">Nombre del Producto <span class="text-red-500">*</span></label>
                  <input type="text" formControlName="name" class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1">Imagen del Producto</label>
                  <app-image-uploader 
                    [uploadType]="'product'" 
                    (imagesChanged)="onProductImageUploaded($event)">
                  </app-image-uploader>
                  @if (uploadedCustomImageUrl()) {
                    <p class="text-xs text-green-600 mt-1 font-semibold">✓ Imagen subida correctamente</p>
                  }
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700">Categoría</label>
                  <select formControlName="category" class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border">
                    <option value="General">General</option>
                    <option value="Abarrotes">Abarrotes</option>
                    <option value="Lácteos y Huevos">Lácteos y Huevos</option>
                    <option value="Carnes y Embutidos">Carnes y Embutidos</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Aseo y Hogar">Aseo y Hogar</option>
                    <option value="Cuidado Personal">Cuidado Personal</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Panadería">Panadería</option>
                  </select>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-semibold text-gray-700">Unidad</label>
                    <select formControlName="unit" class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border">
                      <option value="unidad">Unidad</option>
                      <option value="kg">Kilogramos</option>
                      <option value="libras">Libras</option>
                      <option value="g">Gramos</option>
                      <option value="l">Litros</option>
                    </select>
                  </div>
                  <div>
                    <div class="flex items-center justify-between">
                      <label class="block text-sm font-semibold text-gray-700">Stock Inicial</label>
                      <div class="flex items-center space-x-2">
                        <input type="checkbox" formControlName="isLot" id="customIsLot" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4">
                        <label for="customIsLot" class="text-xs font-semibold text-gray-600">¿Es lote con vencimiento?</label>
                      </div>
                    </div>
                    <input type="number" formControlName="stock" class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border">
                    
                    @if (customForm.get('isLot')?.value) {
                      <div class="mt-3">
                        <label class="block text-sm font-semibold text-gray-700">Fecha de Vencimiento <span class="text-red-500">*</span></label>
                        <input type="date" formControlName="expirationDate" class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border">
                      </div>
                    }
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700">Precio de Venta ($) <span class="text-red-500">*</span></label>
                  <input type="number" formControlName="price" class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border">
                </div>
              </div>
              
              <div class="mt-6">
                <button type="submit" [disabled]="customForm.invalid || isSubmittingCustom()" class="w-full justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50">
                  @if (isSubmittingCustom()) { Creando... } @else { Crear y Añadir al Inventario }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  `
})
export class MyInventoryComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  private storeUrl = `${environment.apiUrl}/api/catalog/store`;
  private masterUrl = `${environment.apiUrl}/api/catalog/master`;

  inventory = signal<StoreProduct[]>([]);
  masterProducts = signal<MasterProduct[]>([]);
  isLoading = signal<boolean>(true);

  searchTerm = signal<string>('');
  searchMasterTerm = signal<string>('');

  filteredInventory = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.inventory();
    return this.inventory().filter(i =>
      i.product?.name.toLowerCase().includes(term) ||
      i.product?.sku.toLowerCase().includes(term)
    );
  });

  filteredMasterProducts = computed(() => {
    const term = this.searchMasterTerm().toLowerCase();
    if (!term) return this.masterProducts();
    return this.masterProducts().filter(m =>
      m.name.toLowerCase().includes(term) ||
      m.sku.toLowerCase().includes(term)
    );
  });

  showAddModal = signal<boolean>(false);
  showEditModal = signal<boolean>(false);
  showBatchesModal = signal<boolean>(false);
  showCustomModal = signal<boolean>(false);
  uploadedCustomImageUrl = signal<string>('');

  editingItem = signal<StoreProduct | null>(null);
  activeBatchItem = signal<StoreProduct | null>(null);
  isSubmittingBatch = signal<boolean>(false);
  isSubmittingQuickAdd = signal<boolean>(false);
  isSubmittingCustom = signal<boolean>(false);

  quickAddData: Record<number, { price: number | null, stock: number | null, isLot: boolean, expirationDate: string | null }> = {};

  editForm: FormGroup;
  batchForm: FormGroup;
  customForm: FormGroup;

  constructor() {
    this.editForm = this.fb.group({
      price: [null, [Validators.required, Validators.min(0)]],
      stock: [null, [Validators.required, Validators.min(0)]]
    });

    this.batchForm = this.fb.group({
      quantity: [null, [Validators.required, Validators.min(1)]],
      expirationDate: [null, Validators.required]
    });

    this.customForm = this.fb.group({
      name: ['', Validators.required],
      category: ['General'],
      unit: ['unidad'],
      stock: [0, Validators.min(0)],
      price: [0, [Validators.required, Validators.min(0)]],
      isLot: [false],
      expirationDate: [null]
    });
  }

  ngOnInit() {
    this.loadInventory();
  }

  loadInventory() {
    this.isLoading.set(true);
    this.http.get<StoreProduct[]>(this.storeUrl).subscribe({
      next: (data) => {
        this.inventory.set(data);
        this.isLoading.set(false);
        // Refresh active batch item if modal is open
        const active = this.activeBatchItem();
        if (active) {
          const updated = data.find(d => d.productId === active.productId);
          if (updated) this.activeBatchItem.set(updated);
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  getTotalStock(item: StoreProduct): number {
    const batchStock = item.batches ? item.batches.reduce((acc, b) => acc + b.quantity, 0) : 0;
    return (item.stock || 0) + batchStock;
  }

  hasActiveSale(item: StoreProduct): boolean {
    if (!item.batches) return false;
    return item.batches.some(b => b.isOnSale);
  }

  getLowestSalePrice(item: StoreProduct): number {
    if (!item.batches) return item.price;
    const saleBatches = item.batches.filter(b => b.isOnSale && b.salePrice != null);
    if (saleBatches.length === 0) return item.price;
    return Math.min(...saleBatches.map(b => b.salePrice!));
  }

  openAddModal() {
    this.http.get<MasterProduct[]>(this.masterUrl).subscribe(data => {
      const inInventoryIds = this.inventory().map(i => i.productId);
      const available = data.filter(m => !inInventoryIds.includes(m.id!));
      this.masterProducts.set(available);

      this.quickAddData = {};
      available.forEach(m => {
        this.quickAddData[m.id!] = { price: null, stock: null, isLot: false, expirationDate: null };
      });

      this.showAddModal.set(true);
    });
  }

  closeAddModal() {
    this.showAddModal.set(false);
  }

  isValidQuickAdd(productId: number): boolean {
    const data = this.quickAddData[productId];
    if (!data) return false;
    if (data.price === null || data.price < 0) return false;
    if (data.stock === null || data.stock < 0) return false;
    if (data.isLot && !data.expirationDate) return false;
    return true;
  }

  quickAdd(productId: number) {
    if (!this.isValidQuickAdd(productId)) return;

    const data = this.quickAddData[productId];
    this.isSubmittingQuickAdd.set(true);

    // Si es un lote, creamos el producto en tienda con stock 0 y luego le asociamos el lote
    const storeProductData = {
      masterProductId: productId,
      price: data.price,
      stock: data.isLot ? 0 : data.stock
    };

    this.http.post<StoreProduct>(this.storeUrl, storeProductData).subscribe({
      next: (createdStoreProduct) => {
        if (data.isLot) {
          // Add batch
          const batchData = {
            quantity: data.stock,
            expirationDate: data.expirationDate
          };
          this.http.post(`${this.storeUrl}/${productId}/batches`, batchData).subscribe({
            next: () => {
              this.finishQuickAdd(productId);
            },
            error: () => {
              this.isSubmittingQuickAdd.set(false);
              alert('Error al añadir el lote');
            }
          });
        } else {
          this.finishQuickAdd(productId);
        }
      },
      error: () => {
        this.isSubmittingQuickAdd.set(false);
        alert('Error al añadir el producto a la tienda');
      }
    });
  }

  private finishQuickAdd(productId: number) {
    this.isSubmittingQuickAdd.set(false);
    this.loadInventory();
    this.masterProducts.update(list => list.filter(m => m.id !== productId));
    delete this.quickAddData[productId];
  }

  openEditModal(item: StoreProduct) {
    this.editingItem.set(item);
    this.editForm.patchValue({
      price: item.price,
      stock: item.stock
    });
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
  }

  saveEdit() {
    const item = this.editingItem();
    if (!item || this.editForm.invalid) return;

    const data = this.editForm.value;
    this.http.put<StoreProduct>(`${this.storeUrl}/${item.productId}`, data).subscribe(() => {
      this.loadInventory();
      this.closeEditModal();
    });
  }

  removeProduct(productId: number) {
    if (confirm('¿Estás seguro de que quieres remover este producto de tu inventario? Se eliminarán también sus lotes.')) {
      this.http.delete(`${this.storeUrl}/${productId}`).subscribe(() => {
        this.loadInventory();
      });
    }
  }

  openBatchesModal(item: StoreProduct) {
    this.activeBatchItem.set(item);
    this.batchForm.reset();
    this.showBatchesModal.set(true);
  }

  closeBatchesModal() {
    this.showBatchesModal.set(false);
    this.activeBatchItem.set(null);
  }

  saveBatch() {
    const item = this.activeBatchItem();
    if (!item || this.batchForm.invalid) return;

    this.isSubmittingBatch.set(true);
    this.http.post(`${this.storeUrl}/${item.productId}/batches`, this.batchForm.value).subscribe({
      next: () => {
        this.isSubmittingBatch.set(false);
        this.batchForm.reset();
        this.loadInventory();
      },
      error: () => {
        this.isSubmittingBatch.set(false);
        alert('Error al guardar el lote');
      }
    });
  }

  isExpiring(dateStr: string | null): boolean {
    if (!dateStr) return false;
    const expDate = new Date(dateStr);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }

  openSalePrompt(batch: ProductBatch) {
    const priceStr = prompt('Ingresa el precio de oferta especial para este lote:', batch.salePrice ? batch.salePrice.toString() : '');
    if (!priceStr) return;
    const salePrice = parseFloat(priceStr);
    if (isNaN(salePrice) || salePrice <= 0) {
      alert('Precio inválido');
      return;
    }

    this.http.patch(`${this.storeUrl}/batches/${batch.id}/sale`, { salePrice, isActive: true }).subscribe({
      next: () => {
        this.loadInventory();
      },
      error: () => {
        alert('Error al actualizar oferta');
      }
    });
  }

  removeSale(batch: ProductBatch) {
    if (confirm('¿Estás seguro de que quieres quitar la oferta para este lote?')) {
      this.http.patch(`${this.storeUrl}/batches/${batch.id}/sale`, { isActive: false }).subscribe({
        next: () => {
          this.loadInventory();
        },
        error: () => {
          alert('Error al quitar la oferta');
        }
      });
    }
  }

  openCustomModal() {
    this.uploadedCustomImageUrl.set('');
    this.customForm.reset({ unit: 'unidad', stock: 0, price: 0, isLot: false, category: 'General' });
    this.showCustomModal.set(true);
  }

  closeCustomModal() {
    this.showCustomModal.set(false);
  }

  saveCustom() {
    if (this.customForm.invalid) return;

    if (this.customForm.get('isLot')?.value && !this.customForm.get('expirationDate')?.value) {
      alert('Debes ingresar la fecha de vencimiento para el lote');
      return;
    }

    const payload = {
      ...this.customForm.value,
      isLot: !!this.customForm.get('isLot')?.value,
      imageUrl: this.uploadedCustomImageUrl() || null
    };

    this.isSubmittingCustom.set(true);
    this.http.post(`${environment.apiUrl}/api/catalog/custom`, payload).subscribe({
      next: () => {
        this.isSubmittingCustom.set(false);
        this.closeCustomModal();
        this.loadInventory();
      },
      error: () => {
        this.isSubmittingCustom.set(false);
        alert('Error al crear el producto personalizado');
      }
    });
  }

  onProductImageUploaded(urls: string[]) {
    this.uploadedCustomImageUrl.set(urls.length > 0 ? urls[0] : '');
  }
}
