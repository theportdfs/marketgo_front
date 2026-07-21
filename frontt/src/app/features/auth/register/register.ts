import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html'
})
export class RegisterComponent {
  registerForm: FormGroup;
  confirmForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  isConfirming: boolean = false;
  showPassword = false;
  registeredEmail: string = '';
  
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/)
      ]],
      role: ['customer'] // Default to customer
    });

    this.confirmForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.authService.register(this.registerForm.value).subscribe({
        next: (res) => {
          console.log('Registro exitoso:', res);
          this.registeredEmail = this.registerForm.value.email;
          this.isConfirming = true;
          this.successMessage = 'Cuenta creada. Hemos enviado un código a tu correo.';
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error en registro:', err);
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Error al crear la cuenta. Por favor, intenta de nuevo.';
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  onConfirmSubmit() {
    if (this.confirmForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.authService.confirmRegistration({
        email: this.registeredEmail,
        code: this.confirmForm.value.code
      }).subscribe({
        next: () => {
          this.router.navigate(['/login'], { queryParams: { confirmed: true } });
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
    this.authService.resendRegistrationCode({ email: this.registeredEmail }).subscribe({
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
}
