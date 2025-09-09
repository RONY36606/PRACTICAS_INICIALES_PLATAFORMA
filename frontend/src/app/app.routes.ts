import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { PaginaPrincipalComponent } from './pages/pagina-principal/pagina-principal.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'principal', component: PaginaPrincipalComponent }
];
