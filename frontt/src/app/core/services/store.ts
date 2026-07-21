import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Store {
  id?: string;
  name: string;
  slug: string;
  address: string;
  city?: string;
  state?: string;
  phone?: string;
  hasDelivery?: boolean;
  logoUrl?: string;
  photos?: string[];
  merchantId?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
  openingHours?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private apiUrl = `${environment.apiUrl}/api/stores`;
  private http = inject(HttpClient);

  // 1. Obtener todas las tiendas (soporta filtro isActive)
  listStores(isActive?: boolean): Observable<Store[]> {
    let params = new HttpParams();
    if (isActive !== undefined) {
      params = params.set('isActive', String(isActive));
    }
    return this.http.get<Store[]>(this.apiUrl, { params });
  }

  // 2. Obtener tiendas cercanas enviando coordenadas como Query Params
  nearbyStores(latitude: number, longitude: number, radiusKm?: number): Observable<Store[]> {
    let params = new HttpParams()
      .set('latitude', latitude)
      .set('longitude', longitude);

    if (radiusKm) {
      params = params.set('radiusKm', radiusKm);
    }

    return this.http.get<Store[]>(`${this.apiUrl}/nearby`, { params });
  }

  // 3. Obtener la tienda del vendedor logueado
  getMyStore(): Observable<Store> {
    return this.http.get<Store>(`${this.apiUrl}/mine`);
  }

  // 4. Obtener una tienda específica por su ID
  getStore(id: string | number): Observable<Store> {
    return this.http.get<Store>(`${this.apiUrl}/${id}`);
  }

  // 5. Crear una nueva tienda
  createStore(storeData: Partial<Store>): Observable<Store> {
    return this.http.post<Store>(this.apiUrl, storeData);
  }

  // 6. Actualizar una tienda existente (PATCH)
  updateStore(id: string | number, storeData: Partial<Store>): Observable<Store> {
    return this.http.patch<Store>(`${this.apiUrl}/${id}`, storeData);
  }
}