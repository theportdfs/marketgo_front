import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { UploadService } from '../../../core/services/upload.service';

export interface UploadedImage {
  url: string;
  file?: File;
}

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <label class="block text-sm font-semibold text-gray-700">{{ label }}</label>
        <span class="text-xs text-gray-500">{{ images().length }} / {{ maxImages }} fotos permitidas</span>
      </div>

      <div *ngIf="images().length < maxImages" 
           class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 hover:border-indigo-400 transition-colors cursor-pointer relative"
           (click)="fileInput.click()"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)"
           [class.border-indigo-500]="isDragging"
           [class.bg-indigo-50]="isDragging">
        
        <div class="space-y-1 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <div class="flex text-sm text-gray-600 justify-center">
            <span class="relative cursor-pointer bg-transparent rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
              Sube un archivo
            </span>
            <p class="pl-1">o arrástralo y suéltalo aquí</p>
          </div>
          <p class="text-xs text-gray-500">PNG, JPG, WEBP hasta {{ maxFileSizeMB }}MB</p>
        </div>
        <input #fileInput type="file" class="hidden" accept="image/png, image/jpeg, image/webp" [multiple]="maxImages > 1" (change)="onFileSelected($event)">
      </div>

      <!-- Error Message -->
      <p *ngIf="errorMessage()" class="text-sm text-red-600 mt-2">{{ errorMessage() }}</p>

      <!-- Images Gallery -->
      <div *ngIf="images().length > 0" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 mt-4">
        <div *ngFor="let img of images(); let i = index" class="relative group rounded-lg overflow-hidden shadow-sm border border-gray-200 aspect-w-1 aspect-h-1">
          <img [src]="img.url" class="object-cover w-full h-32">
          
          <!-- Delete Overlay -->
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button type="button" (click)="removeImage(i)" class="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors focus:outline-none">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </div>
        
        <!-- Uploading Placeholder -->
        <div *ngFor="let upload of activeUploads()" class="relative rounded-lg overflow-hidden shadow-sm border border-gray-200 aspect-w-1 aspect-h-1 bg-gray-50 flex flex-col items-center justify-center p-4">
          <svg class="animate-spin h-8 w-8 text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div class="bg-indigo-600 h-1.5 rounded-full" [style.width]="upload.progress + '%'"></div>
          </div>
          <span class="text-xs text-gray-500 mt-1 font-medium">{{ upload.progress }}%</span>
        </div>
      </div>
    </div>
  `
})
export class ImageUploaderComponent {
  private uploadService = inject(UploadService);

  @Input() label: string = 'Imágenes';
  @Input() maxImages: number = 1;
  @Input() maxFileSizeMB: number = 2;
  @Input() uploadType: 'store' | 'product' | 'banner' | 'master-catalog' = 'store';
  
  // Input binding for existing images
  @Input() set existingImages(urls: string[]) {
    if (urls && urls.length > 0) {
      this.images.set(urls.map(url => ({ url })));
    }
  }

  @Output() imagesChanged = new EventEmitter<string[]>();

  images = signal<UploadedImage[]>([]);
  activeUploads = signal<{ file: File, progress: number }[]>([]);
  errorMessage = signal<string>('');
  isDragging = false;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  onFileSelected(event: any) {
    if (event.target.files) {
      this.handleFiles(event.target.files);
      event.target.value = ''; // Reset input
    }
  }

  handleFiles(files: FileList) {
    this.errorMessage.set('');
    const filesArray = Array.from(files);

    if (this.images().length + filesArray.length > this.maxImages) {
      this.errorMessage.set(`Solo puedes subir un máximo de ${this.maxImages} imagen(es).`);
      return;
    }

    for (const file of filesArray) {
      if (file.size > this.maxFileSizeMB * 1024 * 1024) {
        this.errorMessage.set(`La imagen ${file.name} supera el límite de ${this.maxFileSizeMB}MB.`);
        continue;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        this.errorMessage.set(`El formato de ${file.name} no está soportado. Usa JPG, PNG o WEBP.`);
        continue;
      }

      this.uploadFile(file);
    }
  }

  uploadFile(file: File) {
    const uploadRef = { file, progress: 0 };
    this.activeUploads.update(uploads => [...uploads, uploadRef]);

    this.uploadService.getPresignedUrl(file.name, file.type, this.uploadType).subscribe({
      next: (res) => {
        this.uploadService.uploadToS3(res.uploadUrl, file).subscribe({
          next: (event: any) => {
            if (event.type === HttpEventType.UploadProgress) {
              const progress = Math.round(100 * event.loaded / event.total);
              this.updateUploadProgress(file, progress);
            } else if (event.type === HttpEventType.Response) {
              // Upload finished
              this.removeActiveUpload(file);
              this.images.update(imgs => [...imgs, { url: res.publicUrl, file }]);
              this.emitChanges();
            }
          },
          error: () => {
            this.errorMessage.set(`Error al subir la imagen ${file.name} a AWS S3.`);
            this.removeActiveUpload(file);
          }
        });
      },
      error: () => {
        this.errorMessage.set(`Error al obtener permisos de subida para ${file.name}.`);
        this.removeActiveUpload(file);
      }
    });
  }

  updateUploadProgress(file: File, progress: number) {
    this.activeUploads.update(uploads => 
      uploads.map(u => u.file === file ? { ...u, progress } : u)
    );
  }

  removeActiveUpload(file: File) {
    this.activeUploads.update(uploads => uploads.filter(u => u.file !== file));
  }

  removeImage(index: number) {
    this.images.update(imgs => {
      const newImgs = [...imgs];
      newImgs.splice(index, 1);
      return newImgs;
    });
    this.emitChanges();
  }

  emitChanges() {
    this.imagesChanged.emit(this.images().map(img => img.url));
  }
}
