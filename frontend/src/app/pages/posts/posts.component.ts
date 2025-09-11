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


  // Variables para comentarios
  comments: { [postId: number]: any[] } = {};
  showComments: { [postId: number]: boolean } = {};
  newComment: { [postId: number]: string } = {};

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

  // Método para cargar comentarios de una publicación
  loadComments(postId: number): void {
    this.http.get<any[]>(`http://localhost:3000/api/posts/${postId}/comments`)
      .subscribe({
        next: (data) => {
          this.comments[postId] = data;
        },
        error: (error) => {
          console.error('Error al cargar comentarios:', error);
          this.message = 'Error al cargar comentarios';
        }
      });
  }

  // Método para mostrar/ocultar comentarios
  toggleComments(postId: number): void {
    this.showComments[postId] = !this.showComments[postId];
    
    // Si estamos mostrando comentarios y no los hemos cargado aún, cargarlos
    if (this.showComments[postId] && !this.comments[postId]) {
      this.loadComments(postId);
    }
  }

  // Método para agregar un comentario
  addComment(postId: number): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.registroAcademico) {
      this.message = 'Debes iniciar sesión para comentar';
      return;
    }

    const commentText = this.newComment[postId];
    if (!commentText) {
      this.message = 'El comentario no puede estar vacío';
      return;
    }

    const commentData = {
      mensaje: commentText,
      registroAcademico: user.registroAcademico
    };

    this.http.post(`http://localhost:3000/api/posts/${postId}/comments`, commentData)
      .subscribe({
        next: (response: any) => {
          this.message = response.message || 'Comentario agregado exitosamente';
          this.newComment[postId] = '';
          
          // Recargar los comentarios para mostrar el nuevo
          this.loadComments(postId);
        },
        error: (error) => {
          console.error('Error al agregar comentario:', error);
          if (error.error && typeof error.error === 'string') {
            try {
              const errorObj = JSON.parse(error.error);
              this.message = errorObj.message || 'Error al agregar comentario';
            } catch (e) {
              this.message = error.error || 'Error al agregar comentario';
            }
          } else if (error.error && error.error.message) {
            this.message = error.error.message;
          } else {
            this.message = 'Error al agregar comentario';
          }
        }
      });
  }

  onBackToMain(): void {
    this.router.navigate(['/principal']);
  }
}