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
  username = '';
  password = '';
  confirm = '';           // para repetir contraseña al registrar
  message = '';

  constructor(private http: HttpClient) {}

  // Cambia entre modo login y modo registro
  toggleForm(): void {
    this.isRegister = !this.isRegister;
    this.username = '';
    this.password = '';
    this.confirm = '';
    this.message = '';
  }

  // Envía login o registro según isRegister
  onSubmit(): void {
    if (!this.username || !this.password) {
      this.message = 'Completa usuario y contraseña';
      return;
    }

    if (this.isRegister) {
      // Validar confirmación
      if (this.password !== this.confirm) {
        this.message = 'Las contraseñas no coinciden';
        return;
      }
      // Llamada a /api/register
      this.http.post<{ message: string }>(
        'http://localhost:3000/api/register',
        { username: this.username, password: this.password }
      ).subscribe({
        next: resp => this.message = resp.message,
        error: (err: HttpErrorResponse) =>
          this.message = err.error?.message || 'Error al registrar'
      });
    } else {
      // Llamada a /api/login
      this.http.post<{ message: string }>(
        'http://localhost:3000/api/login',
        { username: this.username, password: this.password }
      ).subscribe({
        next: resp => this.message = resp.message,
        error: (err: HttpErrorResponse) =>
          this.message = err.error?.message || 'Credenciales inválidas'
      });
    }
    this.username = '';
    this.password = '';
    this.confirm = '';
  }
}
