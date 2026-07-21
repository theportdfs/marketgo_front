import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';

interface Banner {
  id: number;
  imageUrl: string;
  title: string | null;
  linkUrl: string | null;
  position: number;
  isActive: boolean;
}

@Component({
  selector: 'app-banners-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploaderComponent],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-900">Gestión de Banners Promocionales</h2>
        <button (click)="openModal()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          Añadir Banner
        </button>
      </div>

      <!-- Banners List -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Imagen</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título / Link</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            @for (banner of banners; track banner.id) {
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ banner.position }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <img [src]="banner.imageUrl" class="h-16 w-32 object-cover rounded" alt="Banner">
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">{{ banner.title || 'Sin Título' }}</div>
                  <div class="text-sm text-blue-500 truncate max-w-xs"><a [href]="banner.linkUrl" target="_blank">{{ banner.linkUrl }}</a></div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                        [ngClass]="banner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ banner.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button (click)="openModal(banner)" class="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                  <button (click)="deleteBanner(banner.id)" class="text-red-600 hover:text-red-900">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      @if (showModal) {
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 class="text-lg font-bold">{{ isEditing ? 'Editar' : 'Nuevo' }} Banner</h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Imagen del Banner</label>
              <app-image-uploader 
                [uploadType]="'banner'" 
                (imagesChanged)="onBannerImageUploaded($event)">
              </app-image-uploader>
              @if (currentBanner.imageUrl) {
                <p class="text-xs text-green-600 mt-1 font-semibold break-all">✓ Imagen asignada: {{ currentBanner.imageUrl }}</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Título (Opcional)</label>
              <input type="text" [(ngModel)]="currentBanner.title" class="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">URL de Redirección (linkUrl)</label>
              <input type="text" [(ngModel)]="currentBanner.linkUrl" placeholder="Ej: /tiendas/mi-tienda o https://..." class="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <div class="flex space-x-4">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700">Orden (Posición)</label>
                <input type="number" [(ngModel)]="currentBanner.position" class="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500">
              </div>
              <div class="flex-1 flex items-center mt-6">
                <label class="flex items-center">
                  <input type="checkbox" [(ngModel)]="currentBanner.isActive" class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                  <span class="ml-2 text-sm text-gray-600">Activo</span>
                </label>
              </div>
            </div>

            <div class="flex justify-end space-x-3 mt-6">
              <button (click)="closeModal()" class="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button (click)="saveBanner()" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Guardar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class BannersManagementComponent implements OnInit {
  private http = inject(HttpClient);
  banners: Banner[] = [];
  showModal = false;
  isEditing = false;
  
  currentBanner: Partial<Banner> = {
    imageUrl: '',
    title: '',
    linkUrl: '',
    position: 1,
    isActive: true
  };

  ngOnInit() {
    this.loadBanners();
  }

  loadBanners() {
    this.http.get<Banner[]>(`${environment.apiUrl}/api/banners`).subscribe({
      next: (data) => this.banners = data,
      error: (e) => console.error(e)
    });
  }

  openModal(banner?: Banner) {
    if (banner) {
      this.isEditing = true;
      this.currentBanner = { ...banner };
    } else {
      this.isEditing = false;
      this.currentBanner = {
        imageUrl: '',
        title: '',
        linkUrl: '',
        position: this.banners.length + 1,
        isActive: true
      };
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveBanner() {
    if (!this.currentBanner.imageUrl) {
      alert('La URL de imagen es obligatoria');
      return;
    }

    const req = this.isEditing 
      ? this.http.put(`${environment.apiUrl}/api/banners/${this.currentBanner.id}`, this.currentBanner)
      : this.http.post(`${environment.apiUrl}/api/banners`, this.currentBanner);

    req.subscribe({
      next: () => {
        this.loadBanners();
        this.closeModal();
      },
      error: (e) => console.error(e)
    });
  }

  deleteBanner(id: number) {
    if (confirm('¿Estás seguro de eliminar este banner?')) {
      this.http.delete(`${environment.apiUrl}/api/banners/${id}`).subscribe({
        next: () => this.loadBanners(),
        error: (e) => console.error(e)
      });
    }
  }

  onBannerImageUploaded(urls: string[]) {
    this.currentBanner.imageUrl = urls.length > 0 ? urls[0] : '';
  }
}
