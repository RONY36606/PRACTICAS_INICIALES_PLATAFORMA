import { Component, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.crearFormulario();
  }

  configurarBotones(): void {
    const btnActualizar = document.getElementById('btnActualizar');
    const btnEliminar = document.getElementById('btnEliminar');
    const btnVisualizar = document.getElementById('btnVisualizar');

    btnActualizar?.addEventListener('click', () => this.actualizarUsuario());
    btnEliminar?.addEventListener('click', () => this.eliminarUsuario());
    btnVisualizar?.addEventListener('click', () => this.visualizarUsuarios());
  }

  actualizarUsuario(): void {
  const id = (document.getElementById('idUsuario') as HTMLInputElement).value;
  const nombre = (document.getElementById('nombreUsuario') as HTMLInputElement).value;
  const email = (document.getElementById('emailUsuario') as HTMLInputElement).value;
  const contrasena = (document.getElementById('contrasenaUsuario') as HTMLInputElement).value;

  if (!id || !nombre || !email) {
    alert('ID, nombre y email son obligatorios');
    return;
  }

  fetch(`http://localhost:3000/usuarios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, email, contrasena })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert('Error: ' + data.error);
    } else {
      alert('✅ ' + data.message);
      this.visualizarUsuarios(); // refresca la tabla
    }
  })
  .catch(err => console.error(err));
}

eliminarUsuario(): void {
  const id = (document.getElementById('idUsuario') as HTMLInputElement).value;
  if (!id) {
    alert('Ingresa el ID del usuario a eliminar');
    return;
  }

  fetch(`http://localhost:3000/usuarios/${id}`, {
    method: 'DELETE'
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert('Error: ' + data.error);
    } else {
      alert('🗑 Usuario eliminado');
      this.visualizarUsuarios(); // refresca la tabla
    }
  })
  .catch(err => console.error(err));
}


visualizarUsuarios(): void {
  fetch('http://localhost:3000/usuarios')
    .then(res => res.json())
    .then(usuarios => {
      const tbody = document.getElementById('tablaUsuarios')?.getElementsByTagName('tbody')[0];
      if (tbody) {
        tbody.innerHTML = ''; // limpia tabla
        usuarios.forEach((usuario: any) => {
          const fila = tbody.insertRow();
          fila.insertCell().textContent = usuario.id;
          fila.insertCell().textContent = usuario.nombre;
          fila.insertCell().textContent = usuario.email;
          fila.insertCell().textContent = usuario.contrasena || '••••••';
        });
      }
    })
    .catch(err => console.error(err));
}


  crearFormulario(): void {
    const form = this.renderer.createElement('form');
    form.id = 'formularioRegistro';

    const campos = [
      { label: 'ID', type: 'number', name: 'id' },
      { label: 'Nombre', type: 'text', name: 'nombre' },
      { label: 'Email', type: 'email', name: 'email' },
      { label: 'Contraseña', type: 'password', name: 'password' }
    ];

    campos.forEach(campo => {
      const label = this.renderer.createElement('label');
      const labelText = this.renderer.createText(campo.label);
      this.renderer.appendChild(label, labelText);
      this.renderer.setAttribute(label, 'for', campo.name);

      const input = this.renderer.createElement('input');
      this.renderer.setAttribute(input, 'type', campo.type);
      this.renderer.setAttribute(input, 'name', campo.name);
      this.renderer.setAttribute(input, 'id', campo.name);
      this.renderer.setAttribute(input, 'required', '');

      this.renderer.appendChild(form, label);
      this.renderer.appendChild(form, input);
      this.renderer.appendChild(form, this.renderer.createElement('br'));
    });

    const boton = this.renderer.createElement('button');
    this.renderer.setAttribute(boton, 'type', 'submit');
    const textoBoton = this.renderer.createText('Registrar');
    this.renderer.appendChild(boton, textoBoton);
    this.renderer.appendChild(form, boton);
      form.addEventListener('submit', (event:Event) => {
        event.preventDefault();

        const nombre = (document.getElementById('nombre') as HTMLInputElement).value;
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const contrasena = (document.getElementById('password') as HTMLInputElement).value;

        if (!nombre || !email || !contrasena) {
          alert('Todos los campos son obligatorios');
          return;
        }

        this.enviarUsuario(nombre, email, contrasena);
      });

    this.renderer.listen(form, 'submit', (event) => {
      event.preventDefault();
      const datos = {
        id: (document.getElementById('id') as HTMLInputElement).value,
        nombre: (document.getElementById('nombre') as HTMLInputElement).value,
        email: (document.getElementById('email') as HTMLInputElement).value,
        password: (document.getElementById('password') as HTMLInputElement).value
      };
      console.log('Datos registrados:', datos);
      // Aquí podrías llamar a tu ApiService para enviar al backend
    });

    this.renderer.setAttribute(form, 'class', 'formulario'); // opcional si usas clases
    this.renderer.setAttribute(form, 'id', 'formularioRegistro'); // ya lo tienes

    const contenedor = document.getElementById('contenedorFormulario');
    if (contenedor) {
      this.renderer.appendChild(contenedor, form);
    }

    
  }

  enviarUsuario(nombre: string, email: string, contrasena: string): void {
    fetch('http://localhost:3000/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nombre, email, contrasena })
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert('Error: ' + data.error);
      } else {
        alert('ok, ' + data.message + '\nID asignado: ' + data.id);
        this.agregarFilaATabla(data.id, data.nombre, data.email, data.contrasena);
      }
    })
    .catch(error => {
      alert('Error de conexión con el servidor');
      console.error(error);
    });
  }

  agregarFilaATabla(id: number, nombre: string, email: string, contrasena: string): void {
    const tabla = document.getElementById('tablaUsuarios')?.getElementsByTagName('tbody')[0];
    if (tabla) {
      const fila = tabla.insertRow();
      fila.insertCell().textContent = id.toString();
      fila.insertCell().textContent = nombre;
      fila.insertCell().textContent = email;
      fila.insertCell().textContent = contrasena;
    }}

    editarUsuario(fila: HTMLTableRowElement, id: number): void {
  const nombreActual = fila.cells[1].textContent || '';
  const emailActual = fila.cells[2].textContent || '';
  const contrasenaActual = fila.cells[3].textContent || '';

  const nuevoNombre = prompt('Nuevo nombre:', nombreActual);
  const nuevoEmail = prompt('Nuevo email:', emailActual);
  const nuevaContrasena = prompt('Nueva contraseña (dejar vacío para no cambiar):', contrasenaActual);

  if (!nuevoNombre || !nuevoEmail) {
    alert('Nombre y email son obligatorios');
    return;
  }

  const datosActualizados = {
    nombre: nuevoNombre,
    email: nuevoEmail,
    contrasena: nuevaContrasena || undefined // si está vacío, no se envía
  };

  fetch(`http://localhost:3000/usuarios/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datosActualizados)
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      alert('Error: ' + data.error);
    } else {
      alert('✅ ' + data.message);
      fila.cells[1].textContent = data.nombre;
      fila.cells[2].textContent = data.email;
      if (nuevaContrasena) fila.cells[3].textContent = nuevaContrasena;
    }
  })
  .catch(error => {
    alert('Error al conectar con el servidor');
    console.error(error);
  });
}



  
}
