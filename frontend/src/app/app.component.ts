// src/app/app.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // Propiedades usadas en el template
  isRegister = false;     // toggle entre login/registro
  registroAcademico = '';
  nombre = '';
  apellido = '';
  email = '';
  password = '';
  confirm = '';          // para repetir contraseña al registrar
  message = '';

  constructor(private http: HttpClient) {}

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

  // Envía login o registro según isRegister
  onSubmit(): void {
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
            // opcional: cambiar a login tras registro exitoso
            this.isRegister = false;
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
            // aquí podrías guardar resp.user en un servicio de sesión
          },
          error: (err: HttpErrorResponse) =>
            (this.message = err.error?.message || 'Credenciales inválidas')
        });
    }
  }
}
