import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-pagina-principal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './pagina-principal.component.html',
  styleUrls: ['./pagina-principal.component.css']
})
export class PaginaPrincipalComponent implements OnInit {

  // estos son valores de prueba para los posts
  posts: any[] = [];
  filtroCurso = '';
  filtroCatedratico = '';
  ordenSeleccionado = ''; //ordenar alfabeticamente

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
    let resultado = this.posts.filter(pub => {
      if (!pub) return false;

      const curso = (pub.curso || '').toLowerCase();
      const tipo = pub.tipo || '';
      const mensaje = (pub.mensaje || '').toLowerCase();

      // Filtrar por curso (solo si el tipo es 'course')
      let coincideCurso = true;
      if (this.filtroCurso !== '') {
        coincideCurso = tipo === 'course' && curso.includes(this.filtroCurso.toLowerCase());
      }

      // Filtrar por catedrático (solo si el tipo es 'teacher')
      let coincideCatedratico = true;
      if (this.filtroCatedratico !== '') {
        coincideCatedratico = tipo === 'teacher' && curso.includes(this.filtroCatedratico.toLowerCase());
      }

      return coincideCurso && coincideCatedratico;
    });

    // Ordenamiento
    if (this.ordenSeleccionado === 'curso') {
      // Solo ordenar cursos
      resultado = resultado
        .filter(pub => pub.tipo === 'course')
        .sort((a, b) => (a.curso || '').localeCompare(b.curso || ''));
    } else if (this.ordenSeleccionado === 'catedratico') {
      // Solo ordenar catedráticos
      resultado = resultado
        .filter(pub => pub.tipo === 'teacher')
        .sort((a, b) => (a.curso || '').localeCompare(b.curso || ''));
    }

    return resultado;
  }

  verPerfil(): void {
    this.router.navigate(['/perfil']);
  }

  logout(): void {
    localStorage.removeItem('user'); 
    this.router.navigate(['/']);     
  }

}
