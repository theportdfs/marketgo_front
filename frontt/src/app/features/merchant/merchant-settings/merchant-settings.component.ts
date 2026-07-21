import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService, Store } from '../../../core/services/store';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';

@Component({
  selector: 'app-merchant-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploaderComponent],
  template: `
    <div class="max-w-3xl mx-auto p-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-2xl font-bold text-gray-800">Configuración de la Tienda</h2>
          <p class="text-gray-500 mt-1">Configura los datos de contacto y detalles operativos de tu tienda.</p>
        </div>

        <div class="p-6">
          <div *ngIf="isLoading()" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>

          <form *ngIf="!isLoading()" (ngSubmit)="saveSettings()" class="space-y-6">
            
            <div *ngIf="successMessage()" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              {{ successMessage() }}
            </div>

            <div *ngIf="errorMessage()" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {{ errorMessage() }}
            </div>

            <div class="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 mb-6">
              <h3 class="text-lg font-semibold text-indigo-900 mb-2 flex items-center">
                <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                WhatsApp de Pedidos
              </h3>
              <p class="text-sm text-indigo-700 mb-4">Ingresa el número de celular al cual los clientes te enviarán los pedidos por WhatsApp. Asegúrate de incluir el indicativo de país (Ej: 57 para Colombia).</p>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Número de Celular</label>
                <div class="flex">
                  <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    +
                  </span>
                  <input type="text" [(ngModel)]="phone" name="phone" placeholder="573001234567" 
                    class="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    [class.border-red-300]="!isValidPhone()" [class.focus:border-red-500]="!isValidPhone()" [class.focus:ring-red-500]="!isValidPhone()">
                </div>
                <p *ngIf="!isValidPhone()" class="mt-1 text-xs text-red-600">El número debe contener solo dígitos y empezar con el código de país (Ej: 57...)</p>
              </div>
            </div>

            <div class="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 mb-6">
              <h3 class="text-lg font-semibold text-indigo-900 mb-2 flex items-center">
                <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Horarios de Atención
              </h3>
              <p class="text-sm text-indigo-700 mb-4">Configura los días y horarios en los que tu tienda está abierta para recibir pedidos.</p>
              
              <div class="space-y-3">
                <div *ngFor="let day of scheduleDays" class="flex items-center space-x-4 bg-white p-3 rounded-md border border-gray-200">
                  <div class="w-32 flex items-center">
                    <input type="checkbox" [id]="day.id" [(ngModel)]="day.isOpen" [name]="'isOpen_' + day.id" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                    <label [for]="day.id" class="ml-2 block text-sm text-gray-900 font-medium capitalize">{{ day.label }}</label>
                  </div>
                  
                  <div class="flex-1 flex items-center space-x-2" [class.opacity-50]="!day.isOpen">
                    <input type="time" [(ngModel)]="day.openTime" [name]="'openTime_' + day.id" [disabled]="!day.isOpen" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-1.5 px-3 border">
                    <span class="text-gray-500">a</span>
                    <input type="time" [(ngModel)]="day.closeTime" [name]="'closeTime_' + day.id" [disabled]="!day.isOpen" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-1.5 px-3 border">
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 mb-6">
              <h3 class="text-lg font-semibold text-indigo-900 mb-2 flex items-center">
                <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Logística de Entregas
              </h3>
              <p class="text-sm text-indigo-700 mb-4">Indica si tu tienda ofrece servicio a domicilio o si los clientes deben recoger los pedidos en tu ubicación.</p>
              
              <div class="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer" (click)="hasDelivery = !hasDelivery">
                <div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input type="checkbox" [checked]="hasDelivery" (change)="hasDelivery = !hasDelivery" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" [ngClass]="hasDelivery ? 'right-0 border-indigo-600' : 'left-0 border-gray-300'"/>
                  <label class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer" [ngClass]="hasDelivery ? 'bg-indigo-600' : 'bg-gray-300'"></label>
                </div>
                <div>
                  <p class="font-bold text-gray-900">{{ hasDelivery ? 'Ofrezco servicio de Domicilio' : 'Solo Recogida en Tienda' }}</p>
                  <p class="text-xs text-gray-500">
                    {{ hasDelivery ? 'Los clientes podrán elegir que les lleves el pedido a su casa.' : 'Los clientes deberán ir hasta tu local por su pedido.' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Image Uploaders -->
            <div class="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 mb-6">
              <h3 class="text-lg font-semibold text-indigo-900 mb-2 flex items-center">
                <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Fotos de la Tienda
              </h3>
              <p class="text-sm text-indigo-700 mb-4">La primera foto de la tienda es <strong>obligatoria</strong> para aparecer en el mapa. Sube fotos llamativas de la fachada o el interior.</p>
              
              <app-image-uploader 
                label="Logo de la Tienda" 
                [maxImages]="1" 
                uploadType="store"
                [existingImages]="logoUrl ? [logoUrl] : []"
                (imagesChanged)="onLogoChanged($event)">
              </app-image-uploader>

              <div class="mt-6"></div>

              <app-image-uploader 
                label="Fotos del Local (Máx 3)" 
                [maxImages]="3" 
                uploadType="store"
                [existingImages]="photos"
                (imagesChanged)="onPhotosChanged($event)">
              </app-image-uploader>
              <p *ngIf="photos.length === 0" class="mt-1 text-xs text-red-600 font-medium">⚠️ Sube al menos 1 foto para activar tu tienda en Tiendas Cercanas.</p>
            </div>

            <div class="flex justify-end pt-4 border-t border-gray-100">
              <button type="submit" [disabled]="isSaving() || !isValidPhone()" 
                class="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <svg *ngIf="isSaving()" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardar Configuración
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class MerchantSettingsComponent implements OnInit {
  private storeService = inject(StoreService);
  
  store = signal<Store | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  
  phone = '';
  hasDelivery = false;
  logoUrl = '';
  photos: string[] = [];
  
  successMessage = signal('');
  errorMessage = signal('');

  scheduleDays = [
    { id: 'monday', label: 'Lunes', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    { id: 'tuesday', label: 'Martes', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    { id: 'wednesday', label: 'Miércoles', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    { id: 'thursday', label: 'Jueves', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    { id: 'friday', label: 'Viernes', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    { id: 'saturday', label: 'Sábado', isOpen: true, openTime: '09:00', closeTime: '14:00' },
    { id: 'sunday', label: 'Domingo', isOpen: false, openTime: '09:00', closeTime: '14:00' }
  ];

  ngOnInit() {
    this.loadStore();
  }

  loadStore() {
    this.storeService.getMyStore().subscribe({
      next: (store) => {
        this.store.set(store);
        this.phone = store.phone || '';
        this.hasDelivery = store.hasDelivery || false;
        this.logoUrl = store.logoUrl || '';
        this.photos = store.photos || [];
        if (store.openingHours) {
          try {
            const parsed = JSON.parse(store.openingHours);
            if (Array.isArray(parsed)) {
              this.scheduleDays = parsed;
            }
          } catch (e) {
            console.error('Failed to parse opening hours');
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando tienda', err);
        this.errorMessage.set('No se pudo cargar la información de la tienda. Intenta nuevamente.');
        this.isLoading.set(false);
      }
    });
  }

  isValidPhone(): boolean {
    if (!this.phone) return true; // Optional field? Let's say yes for now, but empty won't receive whatsapp
    // Basic validation: only numbers, min length 10
    const numbersOnly = /^[0-9]+$/.test(this.phone);
    return numbersOnly && this.phone.length >= 10;
  }

  saveSettings() {
    if (!this.isValidPhone()) return;
    
    const storeData = this.store();
    if (!storeData || !storeData.id) return;

    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    // Remove any '+' sign if user typed it despite the UI
    const cleanPhone = this.phone.replace('+', '').trim();
    const openingHoursStr = JSON.stringify(this.scheduleDays);

    this.storeService.updateStore(storeData.id, { 
      phone: cleanPhone,
      openingHours: openingHoursStr,
      hasDelivery: this.hasDelivery,
      logoUrl: this.logoUrl,
      photos: this.photos
    }).subscribe({
      next: (updatedStore) => {
        this.store.set(updatedStore);
        this.phone = updatedStore.phone || '';
        this.hasDelivery = updatedStore.hasDelivery || false;
        this.successMessage.set('Configuración guardada exitosamente.');
        this.isSaving.set(false);
        
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        console.error('Error guardando configuración', err);
        this.errorMessage.set('Ocurrió un error al guardar la configuración.');
        this.isSaving.set(false);
      }
    });
  }

  onLogoChanged(urls: string[]) {
    this.logoUrl = urls.length > 0 ? urls[0] : '';
  }

  onPhotosChanged(urls: string[]) {
    this.photos = urls;
  }
}
