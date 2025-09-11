import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface UserProfile {
  id: string;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  carrera?: string;
  rol?: string;
  bio?: string;
  ubicacion?: string;
  sitioWeb?: string;
  fechaIngreso?: string | Date;
  avatarUrl?: string;
  portadaUrl?: string;
  stats?: {
    publicaciones: number;
    seguidores: number;
    siguiendo: number;
  };
}

type UserProfileResponse = {
  id?: string;                 // si tu endpoint manda id
  registroAcademico?: string;  // o este campo
  nombre: string;
  apellido: string;
  email: string;
  stats?: {
    publicaciones?: number;
    seguidores?: number;
    siguiendo?: number;
  };
};

interface Curso {
  id?: number;
  codigo: string;
  nombre: string;
  creditos: number;
}

@Component({
  selector: 'app-ver-perfil',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePipe],
  templateUrl: './ver-perfil.html',
  styleUrls: ['./ver-perfil.css']
})
export class VerPerfilComponent implements OnInit {

  // --------- Estado general ----------
  cargando = true;
  isOwner = false;
  rpActualUsuario = 'RP-12345'; // si tienes el RA real en localStorage, lo reemplazamos en ngOnInit
  rpVisto = '';

  // --------- Perfil ----------
  perfil: UserProfile = {
    id: 'RP-12345', // RP
    nombre: 'Jeremy',
    apellido: 'Jiménez',
    username: 'JeremyJP13',
    email: '7jeremyjimenez@gmail.com',
    carrera: 'Ing. en Ciencias y Sistemas (USAC)',
    rol: 'Estudiante / Dev',
    bio: 'Apasionado por Angular, redes y proyectos full-stack. Me gusta construir UIs limpias y medirlo todo.',
    ubicacion: 'Guatemala',
    sitioWeb: 'https://ejemplo.dev',
    fechaIngreso: '2023-02-14',
    avatarUrl: 'https://i.pravatar.cc/300?img=12',
    portadaUrl: 'https://images.unsplash.com/photo-1503264116251-35a269479413?q=80&w=1200&auto=format&fit=crop',
    stats: {
      publicaciones: 42,
      seguidores: 380,
      siguiendo: 127
    }
  };

  // --------- Actividad reciente (demo) ----------
  recientes = [
    { titulo: 'Tips de Angular + Bootstrap', fecha: new Date(), tag: 'Frontend' },
    { titulo: 'Filtrado por catedrático optimizado', fecha: new Date(Date.now() - 86400000), tag: 'UX' },
    { titulo: 'Validación de montos con regex', fecha: new Date(Date.now() - 2 * 86400000), tag: 'JS' },
  ];

  // --------- Cursos y créditos ----------
  catalogoCursos: Curso[] = [];   // viene de /api/courses/catalog (derivado)
  cursosAprobados: Curso[] = [];  // viene de /api/users/:ra/courses
  cursoSeleccionadoCodigo = '';

  private toCodigo(nombre: string): string {
  // slug simple y estable a partir del nombre
  return nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
               .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Cargar catálogo global (derivado de courses existentes)
private loadCatalogoCursos(): void {
  this.http.get<Array<{codigo:string; nombre:string; creditos:number}>>(
    `http://localhost:3000/api/courses`
  ).subscribe({
    next: rows => {
      this.catalogoCursos = rows.map(r => ({
        codigo: r.codigo,
        nombre: r.nombre,
        creditos: r.creditos
      }));
    },
    error: e => console.error('Error cargando catálogo:', e)
  });
}

  get totalCreditos(): number {
    return this.cursosAprobados.reduce((acc, c) => acc + (c.creditos || 0), 0);
  }

  // --------- Modal de edición ----------
  mostrarModalEditar = false;

  editModel: Omit<UserProfile, 'id'> = {
    nombre: '',
    apellido: '',
    username: '',
    email: '',
    carrera: '',
    rol: '',
    bio: '',
    ubicacion: '',
    sitioWeb: '',
    fechaIngreso: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) { }

  // --- NUEVO: cargar desde API al entrar o cambiar :rp ---
  ngOnInit(): void {
    // si hay usuario en localStorage, usar su RA como "actual"
    const lsUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (lsUser?.registroAcademico) {
      this.rpActualUsuario = lsUser.registroAcademico;
    }

    this.route.paramMap.subscribe(pm => {
      this.cargando = true;

      // RP de la ruta o del usuario actual
      this.rpVisto = pm.get('rp') || this.rpActualUsuario;
      this.isOwner = (this.rpVisto === this.rpActualUsuario);

      // Cargar datos reales
      this.loadUser();
    });
  }

  // ------- Cargar usuario desde backend ----------
  loadUser(): void {
    const id = this.rpVisto || this.rpActualUsuario;

    this.http.get<UserProfileResponse>(`http://localhost:3000/api/users/${id}`)
      .subscribe({
        next: (data) => {
          const userId = data.id ?? data.registroAcademico ?? id;
          const username = data.email ? data.email.split('@')[0] : (data.nombre + data.apellido).toLowerCase();

          this.perfil = {
            ...this.perfil, // mantiene bio, carrera, urls, etc.
            id: userId,
            nombre: data.nombre,
            apellido: data.apellido,
            username,
            email: data.email,
            stats: {
              publicaciones: data.stats?.publicaciones ?? this.perfil.stats?.publicaciones ?? 0,
              seguidores: data.stats?.seguidores ?? this.perfil.stats?.seguidores ?? 0,
              siguiendo: data.stats?.siguiendo ?? this.perfil.stats?.siguiendo ?? 0,
            }
          };

          this.isOwner = (userId === this.rpActualUsuario);
          this.cargando = false;

        this.loadCatalogoCursos();     // llena el <select> con cursos del catálogo
        this.loadCursosAprobados();    // lista los cursos aprobados del usuario
        },
        error: (error) => {
          console.error('Error al cargar usuario:', error);

          // Fallback: si falla la API, mantén el demo que tenías
          if (!this.isOwner && this.rpVisto !== this.perfil.id) {
            this.perfil = {
              ...this.perfil,
              id: this.rpVisto,
              nombre: 'María',
              apellido: 'Gómez',
              username: 'maria.g',
              email: 'maria.gomez@example.com',
              ubicacion: 'Quetzaltenango',
              avatarUrl: 'https://i.pravatar.cc/300?img=32',
              sitioWeb: 'https://portafolio-maria.dev'
            };
            this.cursosAprobados = [
              { codigo: 'MAT101', nombre: 'Matemática 1', creditos: 5 },
              { codigo: 'PRO101', nombre: 'Programación 1', creditos: 6 },
              { codigo: 'ADS301', nombre: 'Análisis y Diseño de Sistemas', creditos: 6 },
            ];
          }

          this.cargando = false;
          this.loadCatalogoCursos();
          this.loadCursosAprobados();
        }
      });
  }

  // --------- Navegar por RP ----------
  buscarPorRegistroPersonal(rp: string) {
    const destino = ['/perfil', rp.trim()];
    this.router.navigate(destino);
  }

  // --------- Avatar ----------
  onCambiarFoto(input: HTMLInputElement) {
    if (!this.isOwner) return;
    input.click();
  }

  onArchivoSeleccionado(event: Event) {
    if (!this.isOwner) return;
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.perfil.avatarUrl = reader.result as string; // preview
      // TODO: subir a servidor
    };
    reader.readAsDataURL(file);
  }

  // --------- Copiar correo ----------
  copiarCorreo() {
    navigator.clipboard.writeText(this.perfil.email || '');
  }

  // --------- Modal Editar Perfil ----------
  abrirModalEditar() {
    if (!this.isOwner) return;
    this.editModel = {
      nombre: this.perfil.nombre,
      apellido: this.perfil.apellido,
      username: this.perfil.username,
      email: this.perfil.email,
      carrera: this.perfil.carrera,
      rol: this.perfil.rol,
      bio: this.perfil.bio,
      ubicacion: this.perfil.ubicacion,
      sitioWeb: this.perfil.sitioWeb,
      fechaIngreso: this.perfil.fechaIngreso
    };
    this.mostrarModalEditar = true;
  }

  cerrarModalEditar() {
    this.mostrarModalEditar = false;
  }

  // --------- Cursos ----------
agregarCursoAprobado() {
  if (!this.isOwner || !this.cursoSeleccionadoCodigo) return;

  const curso = this.catalogoCursos.find(c => c.codigo === this.cursoSeleccionadoCodigo);
  if (!curso) return;

  if (this.cursosAprobados.some(c => c.nombre === curso.nombre)) {
    alert('Este curso ya está en tu lista de aprobados.');
    return;
  }

  const ra = this.perfil.id;
  const body = { nombre: curso.nombre, creditos: Number(curso.creditos) }; // 👈 a número

  this.http.post<{ id:number; nombre:string; creditos:number }>(
    `http://localhost:3000/api/users/${encodeURIComponent(ra)}/courses`,
    body
  ).subscribe({
    next: res => {
      this.cursosAprobados = [...this.cursosAprobados, {
        id: res.id,
        codigo: curso.codigo,    // viene del catálogo cargado
        nombre: res.nombre,
        creditos: res.creditos
      }];
      this.cursoSeleccionadoCodigo = '';
    },
    error: err => {
      if (err?.status === 409) alert('Ese curso ya está registrado.');
      else alert('No se pudo agregar el curso.');
      console.error('Error agregando curso:', err);
    }
  });
}

removerCurso(codigo: string) {
  if (!this.isOwner) return;
  const curso = this.cursosAprobados.find(c => c.codigo === codigo);
  if (!curso?.id) return;

  const ra = this.perfil.id;
  this.http.delete(
    `http://localhost:3000/api/users/${encodeURIComponent(ra)}/courses/${curso.id}`
  ).subscribe({
    next: () => {
      this.cursosAprobados = this.cursosAprobados.filter(c => c.id !== curso.id);
    },
    error: err => {
      alert('No se pudo eliminar el curso.');
      console.error('Error eliminando curso:', err);
    }
  });
}


  editarPerfil() {
    this.abrirModalEditar();
  }

  //--------- guardar cambios del perfil editado ----------
  guardarPerfil() {
    if (!this.isOwner) return;

    // Validaciones mínimas
    const nombre = this.editModel.nombre?.trim();
    const apellido = this.editModel.apellido?.trim();
    const email = this.editModel.email?.trim();

    if (!nombre || !apellido || !email) {
      alert('Nombre, Apellido y Email son obligatorios.');
      return;
    }

    // El id en tu UI debe ser el registro académico (RA)
    const ra = this.perfil.id;
    this.cargando = true;

    // Solo persistimos lo que existe en la tabla "users"
    const body = { nombre, apellido, email };

    this.http.put<{ message: string; user: { registroAcademico: string; nombre: string; apellido: string; email: string } }>(
      `http://localhost:3000/api/users/${encodeURIComponent(ra)}`,
      body
    ).subscribe({
      next: (res) => {
        // Actualiza el objeto local con lo editado
        this.perfil = {
          ...this.perfil,
          nombre,
          apellido,
          email,
        };

        this.mostrarModalEditar = false;
        this.cargando = false;
        alert('Perfil actualizado.');
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        this.cargando = false;
        if (err?.status === 409) {
          alert('Ese email ya está en uso.');
        } else if (err?.status === 404) {
          alert('Usuario no encontrado.');
        } else {
          alert('No se pudo actualizar el perfil. Intenta de nuevo.');
        }
      }
    });
  }

  // dentro de VerPerfilComponent

private mapNombreToCodigo(nombre: string): string {
  return this.catalogoCursos.find(c => c.nombre === nombre)?.codigo || '';
}

// Llamar después de setear this.perfil en loadUser()
private loadCursosAprobados(): void {
  const ra = this.perfil.id;
  this.http.get<Array<{id:number; nombre:string; creditos:number}>>(
    `http://localhost:3000/api/users/${encodeURIComponent(ra)}/courses`
  ).subscribe({
    next: rows => {
      this.cursosAprobados = rows.map(r => ({
        id: r.id,
        nombre: r.nombre,
        creditos: r.creditos,
        // usa el catálogo si ya está cargado; si aún no, usa un slug de respaldo
        codigo: this.mapNombreToCodigo(r.nombre) || this.toCodigo(r.nombre),
      }));
    },
    error: e => console.error('Error cargando cursos aprobados:', e)
  });
}

  onBackToMain(): void {
    this.router.navigate(['/principal']);
  }
}