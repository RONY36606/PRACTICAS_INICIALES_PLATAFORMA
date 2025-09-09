// src/app/app.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  // Propiedades usadas en el template
  isRegister = false;     // toggle entre login/registro
  isReset = false; //toggle para restablecer contraseña
  
  registroAcademico = '';
  nombre = '';
  apellido = '';
  email = '';
  password = '';
  confirm = '';          // para repetir contraseña al registrar
  message = '';

   // Campos para nuevo contraseña
  newPassword = '';
  confirmNewPassword = '';

  constructor(private http: HttpClient, private router: Router) {}
  // Cambia entre modo login y modo registro
  toggleForm(): void {
    this.isRegister = !this.isRegister;
    this.registroAcademico = '';
    this.nombre = '';
    this.apellido = '';
    this.email = '';
    this.password = '';
    this.confirm = '';
    this.message = '';
  }
    // Ir a formulario de restablecer
  goToResetPassword(): void {
    this.isReset = true;
    this.isRegister = false;
  }
    // Volver a login desde restablecer
  backToLogin(): void {
    this.isReset = false;
    this.isRegister = false;
  }
  
  // Envía login,registro o restablecer contraseña
  onSubmit(): void {

     // esto de aca es para restablecer la contraseña
    if (this.isReset) {
      if (!this.registroAcademico || !this.newPassword || !this.confirmNewPassword) {
        this.message = 'Completa todos los campos';
        return;
      }
      if (this.newPassword !== this.confirmNewPassword) {
        this.message = 'Las contraseñas no coinciden';
        return;
      }
      const payload = {
        registroAcademico: this.registroAcademico,
        newPassword: this.newPassword
      };
      this.http.post<{ message: string }>('http://localhost:3000/api/reset-password', payload)
        .subscribe({
          next: resp => {
            this.message = resp.message;
            this.backToLogin();
          },
          error: (err: HttpErrorResponse) =>
            this.message = err.error?.message || 'Error al restablecer contraseña'
        });
      return;
    }  

    // validar campos obligatorios
    if (
      !this.registroAcademico ||
      !this.password ||
      (this.isRegister &&
        (!this.nombre || !this.apellido || !this.email))
    ) {
      this.message = 'Completa todos los campos requeridos';
      return;
    }

    if (this.isRegister) {
      // validar contraseñas iguales
      if (this.password !== this.confirm) {
        this.message = 'Las contraseñas no coinciden';
        return;
      }

      // payload para /api/register
      const payload = {
        registroAcademico: this.registroAcademico,
        nombre: this.nombre,
        apellido: this.apellido,
        password: this.password,
        email: this.email
      };

      this.http
        .post<{ message: string }>(
          'http://localhost:3000/api/register',
          payload
        )
        .subscribe({
          next: resp => {
            this.message = resp.message;
          },
          error: (err: HttpErrorResponse) =>
            (this.message = err.error?.message || 'Error al registrar')
        });
    } else {
      // payload para /api/login
      const payload = {
        registroAcademico: this.registroAcademico,
        password: this.password
      };

      this.http
        .post<{
          message: string;
          user?: {
            registroAcademico: string;
            nombre: string;
            apellido: string;
            email: string;
          };
        }>('http://localhost:3000/api/login', payload)
        .subscribe({
          next: resp => {
            this.message = resp.message;
                if (resp.user) {
                   localStorage.setItem('user', JSON.stringify(resp.user));
                  // opcional: cambiar a login tras registro exitoso
                  this.router.navigate(['/principal']);
                }
            // aquí podrías guardar resp.user en un servicio de sesión
          },
          error: (err: HttpErrorResponse) =>
            (this.message = err.error?.message || 'Credenciales inválidas')
        });
        
    }
    
  }
}
