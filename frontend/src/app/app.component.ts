import { Component, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
  this.configurarBotones();
}


  registrarUsuario(): void {
  const nombre = (document.getElementById('nombreUsuario') as HTMLInputElement).value;
  const email = (document.getElementById('emailUsuario') as HTMLInputElement).value;
  const contrasena = (document.getElementById('contrasenaUsuario') as HTMLInputElement).value;

  if (!nombre || !email || !contrasena) {
    alert('Todos los campos son obligatorios');
    return;
  }

  fetch('http://localhost:3000/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, email, contrasena })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert('Error: ' + data.error);
    } else {
      alert('✅ ' + data.message + '\nID asignado: ' + data.id);
      this.visualizarUsuarios(); // actualiza la tabla
    }
  })
  .catch(err => {
    alert('Error al conectar con el servidor');
    console.error(err);
  });
}


  configurarBotones(): void {
    const btnActualizar = document.getElementById('btnActualizar');
    const btnEliminar = document.getElementById('btnEliminar');
    const btnVisualizar = document.getElementById('btnVisualizar');
    const btnRegistrar = document.getElementById('btnRegistrar');
    btnRegistrar?.addEventListener('click', () => this.registrarUsuario());


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
