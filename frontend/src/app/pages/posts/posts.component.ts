import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.css']
})
export class PostsComponent implements OnInit {
  posts: any[] = [];
  newPost = { tipo: 'course', curso: '', mensaje: '' };
  message = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.http.get<any[]>('http://localhost:3000/api/posts')
      .subscribe({
        next: (data) => {
          console.log('Datos recibidos:', data); // Para verificar los datos en la consola
          this.posts = data;
        },
        error: (error) => {
          console.error('Error al cargar publicaciones:', error);
          this.message = 'Error al cargar publicaciones';
        }
      });
  }

  onCreatePost(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.registroAcademico) {
      this.message = 'Debes iniciar sesión para publicar';
      return;
    }

    if (!this.newPost.curso || !this.newPost.mensaje) {
      this.message = 'Curso y mensaje son requeridos';
      return;
    }

    const postData = {
      ...this.newPost,
      registroAcademico: user.registroAcademico
    };

    this.http.post('http://localhost:3000/api/posts', postData)
      .subscribe({
        next: (response: any) => {
          this.message = response.message || 'Publicación creada exitosamente';
          this.newPost = { tipo: 'course', curso: '', mensaje: '' };
          this.loadPosts();
        },
        error: (error) => {
          console.error('Error al crear publicación:', error);
          if (error.error && typeof error.error === 'string') {
            try {
              const errorObj = JSON.parse(error.error);
              this.message = errorObj.message || 'Error al crear publicación';
            } catch (e) {
              this.message = error.error || 'Error al crear publicación';
            }
          } else if (error.error && error.error.message) {
            this.message = error.error.message;
          } else {
            this.message = 'Error al crear publicación';
          }
        }
      });
  }

  onBackToMain(): void {
    this.router.navigate(['/principal']);
  }
}