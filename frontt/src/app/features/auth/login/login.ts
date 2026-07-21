import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html'
})
export class LoginComponent {
  loginForm: FormGroup;
  confirmForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  isConfirming: boolean = false;
  requireNewPassword = false;
  showPassword = false;
  loginEmail: string = '';
  loginSession: string = '';
  
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.confirmForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    this.newPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]] // AWS default requires at least 8 chars
    });
  }

  newPasswordForm: FormGroup;

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.authService.login(this.loginForm.value).subscribe({
        next: (res: any) => {
          if (res.challengeName === 'NEW_PASSWORD_REQUIRED') {
            this.requireNewPassword = true;
            this.loginEmail = res.email;
            this.loginSession = res.session;
            this.successMessage = 'Por seguridad, debes crear una nueva contraseña para tu cuenta.';
            this.isLoading = false;
            return;
          }

          const user = this.authService.currentUser();
          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
          
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
          } else if (user?.role === 'merchant') {
            this.router.navigate(['/merchant/dashboard']);
          } else if (user?.role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/']); // Fallback para customer
          }
        },
        error: (err) => {
          this.isLoading = false;
          // Si Cognito arroja 403, significa que falta confirmación OTP
          if (err.status === 403 && err.error?.code === 'UserNotConfirmedException') {
            this.isConfirming = true;
            this.loginEmail = this.loginForm.value.email;
            this.successMessage = 'Tu cuenta aún no ha sido verificada. Ingresa el código que enviamos a tu correo.';
          } else {
            this.errorMessage = err.error?.message || 'Error al iniciar sesión. Por favor, verifica tus credenciales.';
          }
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  onConfirmSubmit() {
    if (this.confirmForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.authService.confirmRegistration({
        email: this.loginEmail,
        code: this.confirmForm.value.code
      }).subscribe({
        next: () => {
          this.isConfirming = false;
          this.successMessage = 'Cuenta verificada exitosamente. Ahora puedes iniciar sesión.';
          this.isLoading = false;
          // Opcional: Podríamos auto-loguearlos aquí llamando a onSubmit() de nuevo, 
          // pero dejarlos que le den a Iniciar Sesión es más seguro por ahora.
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Código incorrecto.';
        }
      });
    } else {
      this.confirmForm.markAllAsTouched();
    }
  }

  resendCode() {
    this.isLoading = true;
    this.authService.resendRegistrationCode({ email: this.loginEmail }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Código reenviado exitosamente.';
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'No se pudo reenviar el código.';
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onNewPasswordSubmit() {
    if (this.newPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.http.post<any>(`${environment.apiUrl}/api/auth/new-password`, {
        email: this.loginEmail,
        session: this.loginSession,
        password: this.newPasswordForm.value.newPassword
      }).subscribe({
        next: (res: any) => {
          // El backend devuelve los tokens y usuario cuando cambia exitosamente.
          this.authService.handleLoginResponse(res);
          this.isLoading = false;
          
          const user = this.authService.currentUser();
          if (user?.role === 'merchant') {
            this.router.navigate(['/merchant/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (err: any) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Error al cambiar la contraseña. Asegúrate de cumplir con los requisitos (8 caracteres, letras, números, símbolos).';
        }
      });
    } else {
      this.newPasswordForm.markAllAsTouched();
    }
  }
}
