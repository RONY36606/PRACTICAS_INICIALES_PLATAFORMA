import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pagina-principal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagina-principal.component.html',
  styleUrls: ['./pagina-principal.component.css']
})
export class PaginaPrincipalComponent implements OnInit {

  // estos son valores de prueba para los posts
  // posts: any[] = []; este es el original
  posts = [
    { curso: 'Matematica I', catedratico: 'Juan Pérez'},
    { curso: 'Fisica II', catedratico: 'María López'},
    { curso: 'Programacion I', catedratico: 'Carlos Gómez'},
    { curso: 'Lenguajes Formales', catedratico: 'Ana Torres'},
    { curso: 'Lenguajes Formales', catedratico: 'Judith Najera'}
  ];

  filtroCurso = '';
  filtroCatedratico = '';

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
        next: data => {
        if (data && data.length > 0) {
          this.posts = data;
        }
        },
        error: () => console.error('Error al cargar publicaciones')
      });     
  }

  //este metodo sera para realizar las busquedas de los cursos segun el filtro indicado
    get publicacionesFiltradas() {
    return this.posts.filter(pub =>
      pub.curso.toLowerCase().includes(this.filtroCurso.toLowerCase()) &&
      pub.catedratico.toLowerCase().includes(this.filtroCatedratico.toLowerCase())
    );
  }


  logout(): void {
    localStorage.removeItem('user'); 
    this.router.navigate(['/']);     
  }

}
