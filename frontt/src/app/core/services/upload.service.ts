import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Obtiene la URL pre-firmada desde el backend
   */
  getPresignedUrl(fileName: string, fileType: string, uploadType: 'store' | 'product' | 'banner' | 'master-catalog'): Observable<PresignedUrlResponse> {
    return this.http.get<PresignedUrlResponse>(`${this.apiUrl}/api/uploads/presign`, {
      params: {
        fileName,
        fileType,
        uploadType
      }
    });
  }

  /**
   * Sube el archivo directamente a AWS S3 utilizando la URL pre-firmada
   */
  uploadToS3(uploadUrl: string, file: File): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': file.type
    });

    return this.http.put(uploadUrl, file, { 
      headers, 
      reportProgress: true,
      observe: 'events'
    });
  }
}
