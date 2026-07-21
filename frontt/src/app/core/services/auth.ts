import { environment } from '../../../environments/environment';
import { Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;

  // Signal to maintain reactive state of the current user
  currentUser: WritableSignal<User | null> = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      try {
        this.currentUser.set(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (!response.challengeName) {
          this.setAuth(response);
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  confirmRegistration(data: {email: string, code: string}): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/confirm`, data);
  }

  resendRegistrationCode(data: {email: string}): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/resend`, data);
  }

  private setAuth(response: AuthResponse) {
    if (response.token && response.user) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      this.currentUser.set(response.user);
    }
  }

  handleLoginResponse(response: any) {
    this.setAuth(response);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
