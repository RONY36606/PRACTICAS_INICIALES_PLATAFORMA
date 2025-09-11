import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { PaginaPrincipalComponent } from './pages/pagina-principal/pagina-principal.component';
import { PostsComponent } from './pages/posts/posts.component';
import { VerPerfilComponent } from './pages/ver-perfil/ver-perfil';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'principal', component: PaginaPrincipalComponent },
  { path: 'posts', component: PostsComponent },
  { path: 'perfil', component: VerPerfilComponent },
];
