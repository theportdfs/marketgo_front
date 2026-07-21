import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const merchantGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Intentamos obtener del signal primero
  let user = authService.currentUser();
  
  // Si no está en el signal, intentamos desde localStorage por si recargó
  if (!user) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      user = JSON.parse(storedUser);
    }
  }

  if (user && (user.role === 'merchant' || user.role === 'admin')) {
    return true;
  }

  // Redirigir al inicio o mostrar denegado
  return router.createUrlTree(['/']);
};
