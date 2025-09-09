import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pagina-principal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagina-principal.component.html',
  styleUrls: ['./pagina-principal.component.css']
})
export class PaginaPrincipalComponent implements OnInit {
  posts: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    // validamos si el usuario si inicio sesion
    const user = localStorage.getItem('user');
    if (!user) {
      //si no hay sesion redirige al login
      this.router.navigate(['/']);
      return;
    }

    // en caso de haber sesion se pasa a la pagina principal
    this.http.get<any[]>('http://localhost:3000/api/posts')
      .subscribe({
        next: data => this.posts = data,
        error: () => console.error('Error al cargar publicaciones')
      });     
  }

  logout(): void {
    localStorage.removeItem('user'); 
    this.router.navigate(['/']);     
  }

}
