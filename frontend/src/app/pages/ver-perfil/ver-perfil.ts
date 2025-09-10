import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

interface Curso {
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
  rpActualUsuario = 'RP-12345';    
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
  // Catálogo de cursos disponibles (en real, proviene de API)
  catalogoCursos: Curso[] = [
    { codigo: 'MAT101', nombre: 'Matemática 1', creditos: 5 },
    { codigo: 'FIS101', nombre: 'Física 1', creditos: 5 },
    { codigo: 'PRO101', nombre: 'Programación 1', creditos: 6 },
    { codigo: 'LOG201', nombre: 'Lógica', creditos: 4 },
    { codigo: 'ADS301', nombre: 'Análisis y Diseño de Sistemas', creditos: 6 },
  ];

  // Cursos aprobados del perfil actual (en real, proviene de API por RP)
  cursosAprobados: Curso[] = [
    { codigo: 'PRO101', nombre: 'Programación 1', creditos: 6 },
    { codigo: 'LOG201', nombre: 'Lógica', creditos: 4 },
  ];

  cursoSeleccionadoCodigo: string = ''; // para combo de agregar cursos (solo owner)

  get totalCreditos(): number {
    return this.cursosAprobados.reduce((acc, c) => acc + (c.creditos || 0), 0);

  }

  // --------- Modal de edición ----------
  mostrarModalEditar = false;

  // Modelo editable (sin RP)
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
    private router: Router
  ) {}

  ngOnInit(): void {
    // Leer RP de la ruta. Rutas esperadas: /perfil/:rp
    this.rpVisto = this.route.snapshot.paramMap.get('rp') || this.perfil.id;
    this.isOwner = (this.rpVisto === this.rpActualUsuario);

    setTimeout(() => {
      // Si NO soy owner y vengo a ver otro RP, cambia datos demo:
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
    }, 400);
  }

  // --------- Navegar por RP desde un buscador externo (navbar) ----------
  buscarPorRegistroPersonal(rp: string) {
    const destino = ['/perfil', rp.trim()];
    this.router.navigate(destino);
  }

  // --------- Avatar ----------
  onCambiarFoto(input: HTMLInputElement) {
    if (!this.isOwner) return; // Solo propietario puede cambiar
    input.click();
  }

  onArchivoSeleccionado(event: Event) {
    if (!this.isOwner) return;
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.perfil.avatarUrl = reader.result as string; // preview
      // TODO: subir a 
    };
    reader.readAsDataURL(file);
  }

  // --------- Copiar correo ----------
  copiarCorreo() {
    navigator.clipboard.writeText(this.perfil.email || '');
  }

  // --------- Modal Editar Perfil (sin cambiar RP) ----------
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

  guardarPerfil() {
    if (!this.isOwner) return;

    // Validaciones mínimas (puedes extender)
    if (!this.editModel.nombre?.trim() || !this.editModel.apellido?.trim() || !this.editModel.email?.trim()) {
      alert('Nombre, Apellido y Email son obligatorios.');
      return;
    }

    this.perfil = { ...this.perfil, ...this.editModel };
    // TODO: llamar a API para persistencia real
    this.mostrarModalEditar = false;
  }


  agregarCursoAprobado() {
    if (!this.isOwner || !this.cursoSeleccionadoCodigo) return;

    const curso = this.catalogoCursos.find(c => c.codigo === this.cursoSeleccionadoCodigo);
    if (!curso) return;

    const yaExiste = this.cursosAprobados.some(c => c.codigo === curso.codigo);
    if (yaExiste) {
      alert('Este curso ya está en tu lista de aprobados.');
      return;
    }
    this.cursosAprobados = [...this.cursosAprobados, curso];
    this.cursoSeleccionadoCodigo = '';
    // TODO: persistir en API
  }

  removerCurso(codigo: string) {
    if (!this.isOwner) return;
    this.cursosAprobados = this.cursosAprobados.filter(c => c.codigo !== codigo);
    // TODO: persistir en API
  }

  editarPerfil() {
    this.abrirModalEditar();
  }
}
