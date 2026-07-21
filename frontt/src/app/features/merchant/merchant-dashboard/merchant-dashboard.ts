import { environment } from '../../../../environments/environment';
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { StoreService, Store } from '../../../core/services/store';
import { MerchantPosComponent } from '../pos/merchant-pos.component';
import * as L from 'leaflet';

@Component({
  selector: 'app-merchant-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MerchantPosComponent],
  templateUrl: './merchant-dashboard.html'
})
export class MerchantDashboardComponent implements OnInit {
  private storeService = inject(StoreService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  isLoading = signal<boolean>(true);
  hasStore = signal<boolean>(false);
  myStore = signal<Store | null>(null);
  
  storeForm: FormGroup;
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');
  
  expiringBatches = signal<any[]>([]);
  lowStockAlerts = signal<any[]>([]);
  showAlerts = signal<boolean>(false);
  activeAlertTab = signal<'vencimiento' | 'inventario'>('vencimiento');
  
  stats = signal<any>(null);
  activeOrders = signal<any[]>([]);

  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  constructor() {
    this.storeForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      phone: [''],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadStore();
  }

  loadStore() {
    this.isLoading.set(true);
    this.storeService.getMyStore().subscribe({
      next: (store) => {
        this.myStore.set(store);
        this.hasStore.set(true);
        this.loadAlerts();
        this.loadStats();
        this.loadActiveOrders();
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.hasStore.set(false);
          setTimeout(() => this.initMap(), 100);
        } else {
          this.errorMessage.set('Error al cargar la información de tu tienda.');
        }
        this.isLoading.set(false);
      }
    });
  }

  loadAlerts() {
    this.http.get<any[]>(`${environment.apiUrl}/api/catalog/store/alerts/expiring`).subscribe({
      next: (data) => {
        this.expiringBatches.set(data);
      }
    });
    this.http.get<any[]>(`${environment.apiUrl}/api/catalog/store/alerts/low-stock`).subscribe({
      next: (data) => {
        this.lowStockAlerts.set(data);
      }
    });
  }

  loadStats() {
    this.http.get<any>(`${environment.apiUrl}/api/orders/store/stats`).subscribe({
      next: (data) => {
        this.stats.set(data);
      },
      error: (err) => console.error('Error loading stats:', err)
    });
  }

  loadActiveOrders() {
    this.http.get<any[]>(`${environment.apiUrl}/api/orders/store`).subscribe({
      next: (data) => {
        // Filtramos para mostrar solo los que no están finalizados
        const active = data.filter(order => order.status !== 'completed' && order.status !== 'cancelled');
        this.activeOrders.set(active);
      },
      error: (err) => console.error('Error loading active orders:', err)
    });
  }

  toggleAlerts() {
    this.showAlerts.set(!this.showAlerts());
  }

  private initMap(): void {
    if (this.map) return;

    // Default center (e.g., Bogota, Colombia)
    const defaultLat = 4.6097;
    const defaultLng = -74.0817;

    this.map = L.map('create-store-map').setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Fix marker icon issue in Leaflet
    const iconDefault = L.icon({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      } else {
        this.marker = L.marker(e.latlng).addTo(this.map!);
      }
      
      this.storeForm.patchValue({
        latitude: lat,
        longitude: lng
      });
      this.storeForm.get('latitude')?.markAsTouched();
    });
  }

  onSubmit() {
    if (this.storeForm.valid) {
      this.isSubmitting.set(true);
      this.errorMessage.set('');
      
      this.storeService.createStore(this.storeForm.value).subscribe({
        next: (store) => {
          this.myStore.set(store);
          this.hasStore.set(true);
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al crear la tienda. Verifica los datos o intenta de nuevo.');
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.storeForm.markAllAsTouched();
    }
  }

  generateSlug() {
    const nameControl = this.storeForm.get('name');
    const slugControl = this.storeForm.get('slug');
    
    if (nameControl && slugControl && nameControl.value && !slugControl.value) {
      const slug = nameControl.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      slugControl.setValue(slug);
    }
  }
}
