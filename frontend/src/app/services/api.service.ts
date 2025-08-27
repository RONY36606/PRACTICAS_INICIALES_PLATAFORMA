import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' }) // <-- esto es obligatorio
export class ApiService {

  constructor(private http: HttpClient) {}

  getSaludo(): Observable<{ mensaje: string }> {
    return this.http.get<{ mensaje: string }>('http://localhost:3000/api/saludo');
  }
}
