import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StoreService, Store } from '../../../core/services/store';
import * as L from 'leaflet';

@Component({
  selector: 'app-edit-store',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-store.html'
})
export class EditStoreComponent implements OnInit {
  private storeService = inject(StoreService);
  private fb = inject(FormBuilder);

  editForm: FormGroup;
  storeId = signal<string | undefined>(undefined);
  
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  
  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  constructor() {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      city: [''],
      state: [''],
      phone: [''],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadStoreData();
  }

  loadStoreData() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.storeService.getMyStore().subscribe({
      next: (store: Store) => {
        this.storeId.set(store.id);
        this.editForm.patchValue({
          name: store.name,
          address: store.address,
          city: store.city,
          state: store.state,
          phone: store.phone,
          latitude: store.latitude,
          longitude: store.longitude
        });
        this.isLoading.set(false);
        // Inicializar el mapa después de que se renderiza la vista
        setTimeout(() => this.initMap(store.latitude, store.longitude), 100);
      },
      error: (err) => {
        this.errorMessage.set('No se pudo cargar la información de la tienda.');
        this.isLoading.set(false);
      }
    });
  }

  private initMap(initialLat?: number, initialLng?: number): void {
    if (this.map) return;

    // Use initial coords if available, otherwise default to Bogota
    const lat = initialLat || 4.6097;
    const lng = initialLng || -74.0817;

    this.map = L.map('edit-store-map').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

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

    // Colocar el marcador inicial si existen coordenadas
    if (initialLat && initialLng) {
      this.marker = L.marker([initialLat, initialLng]).addTo(this.map);
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const clickLat = e.latlng.lat;
      const clickLng = e.latlng.lng;
      
      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      } else {
        this.marker = L.marker(e.latlng).addTo(this.map!);
      }
      
      this.editForm.patchValue({
        latitude: clickLat,
        longitude: clickLng
      });
      this.editForm.get('latitude')?.markAsTouched();
    });
  }

  onSubmit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const id = this.storeId();
    if (!id) {
      this.errorMessage.set('ID de la tienda no encontrado.');
      return;
    }

    this.isSubmitting.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.storeService.updateStore(id, this.editForm.value).subscribe({
      next: (updatedStore) => {
        this.successMessage.set('La información de la tienda se ha actualizado correctamente.');
        this.isSubmitting.set(false);
        
        // Limpiamos el mensaje de éxito después de unos segundos
        setTimeout(() => this.successMessage.set(''), 5000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Hubo un error al actualizar la tienda.');
        this.isSubmitting.set(false);
      }
    });
  }
}
