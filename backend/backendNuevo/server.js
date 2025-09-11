const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

/*
//holi
const express = require("express");
const router = express.Router();
const db = require("../db"); // conexión MySQL
*/

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 1. Abre (o crea) la base de datos users.db
const db = new sqlite3.Database('./users.db', err => {
  if (err) return console.error(err.message);
  console.log('DB conectada');
});

// 2. Crea la tabla usuarios y un registro de ejemplo
db.serialize(() => {
  // Elimiar tablas anteriores comantadas para por si acaso
  // db.run("DROP TABLE IF EXISTS users_cursos");
  // db.run("DROP TABLE IF EXISTS cursos");
  // db.run("DROP TABLE IF EXISTS users");


  // Tabla de usuarios
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      registroAcademico TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      password TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    )
  `);

  // Tabla de publicaciones
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      tipo TEXT NOT NULL, -- 'course' o 'teacher'
      curso TEXT NOT NULL, -- nombre del curso o catedrático
      mensaje TEXT NOT NULL,
      fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(registroAcademico)
    )
  `);

  // Tabla de comentarios
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      postId INTEGER NOT NULL,
      userId TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (postId) REFERENCES posts(id),
      FOREIGN KEY (userId) REFERENCES users(registroAcademico)
    )
  `);

  // Tabla de cursos aprobados
  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      nombre TEXT NOT NULL,
      creditos INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(registroAcademico)
    )
  `);
/*
//comentarios ale prueba

 db.run(`
    CREATE TABLE comentarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      publicacion_id INT NOT NULL,
      usuario_id INT NOT NULL,
      comentario TEXT NOT NULL,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
`);
*/

  // Usuario de ejemplo
  db.run(`
    INSERT OR IGNORE INTO users (registroAcademico, nombre, apellido, password, email)
    VALUES ('20210001', 'Juan', 'Perez', 'password123', 'juan@ejemplo.com')
  `);
});

// Verificar usuarios
const checkUser = (req, res, next) => {
  const { registroAcademico } = req.body;
  
  if (!registroAcademico) {
    return res.status(400).json({ message: 'Número de registro es requerido' });
  }
  
  // Verificar si el usuario existe
  db.get(
    'SELECT * FROM users WHERE registroAcademico = ?',
    [registroAcademico],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Error en el servidor' });
      }
      
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      req.user = user;
      next();
    }
  );
};



// Rutas y endpoints

// 3. Ruta de registro (sin encriptar)
app.post('/api/register', (req, res) => {
  const { registroAcademico, nombre, apellido, password, email } = req.body;
  
  if (!registroAcademico || !nombre || !apellido || !password || !email) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  try {
    // Verificar si el usuario ya existe
    db.get(
      'SELECT * FROM users WHERE registroAcademico = ? OR email = ?',
      [registroAcademico, email],
      async (err, row) => {
        if (err) {
          return res.status(500).json({ message: 'Error en el servidor' });
        }
        
        if (row) {
          return res.status(409).json({ message: 'El usuario ya existe' });
        }

        // Insertar nuevo usuario
        db.run(
          'INSERT INTO users (registroAcademico, nombre, apellido, password, email) VALUES (?, ?, ?, ?, ?)',
          [registroAcademico, nombre, apellido, password, email],
          function(err) {
            if (err) {
              return res.status(500).json({ message: 'Error al crear usuario' });
            }
            res.status(201).json({ message: 'Usuario registrado exitosamente' });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// 4. Endpoint POST /api/login
app.post('/api/login', (req, res) => {
  const { registroAcademico, password } = req.body;
  
  if (!registroAcademico || !password) {
    return res.status(400).json({ message: 'Registro Academico y contraseña son requeridos' });
  }
  
  // Buscar usuario
  db.get(
    'SELECT * FROM users WHERE registroAcademico = ? AND password = ?',
    [registroAcademico, password],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Error en el servidor' });
      }
      
      if (!user) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
      
      // Devolver datos del usuario
      res.json({
        message: 'Login exitoso',
        user: {
          registroAcademico: user.registroAcademico,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email
        }
      });
    }
  );
});

// 5. Endpoint para recuperar contraseña
app.post('/api/forgot-password', (req, res) => {
  const { registroAcademico, email } = req.body;
  
  if (!registroAcademico || !email) {
    return res.status(400).json({ message: 'Registro academico requerido' });
  }
  
  // Verificar que los datos coincidan
  db.get(
    'SELECT * FROM users WHERE registroAcademico = ?',
    [registroAcademico, email],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Error en el servidor' });
      }
      
      if (!user) {
        return res.status(404).json({ message: 'Datos incorrectos' });
      }
      
      res.json({ message: 'Verificación exitosa. Puede restablecer su contraseña.' });
    }
  );
});

// Endpoint para restablecer contraseña
app.post('/api/reset-password', (req, res) => {
  const { registroAcademico, newPassword } = req.body;
  
  if (!registroAcademico || !newPassword) {
    return res.status(400).json({ message: 'Registro academico y nueva contraseña son requeridos' });
  }
  
  db.run(
    'UPDATE users SET password = ? WHERE registroAcademico = ?',
    [newPassword, registroAcademico],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error al actualizar contraseña' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      res.json({ message: 'Contraseña actualizada exitosamente' });
    }
  );
});

// Endpoint para obtener publicaciones con información del usuario
app.get('/api/posts', (req, res) => {
  db.all(
    `SELECT p.*, u.nombre, u.apellido 
     FROM posts p 
     JOIN users u ON p.userId = u.registroAcademico 
     ORDER BY datetime(p.fechaCreacion) DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Error en la consulta:', err);
        return res.status(500).json({ message: 'Error al obtener publicaciones' });
      }
      res.json(rows);
    }
  );
});

// Endpoint para crear publicación
app.post('/api/posts', checkUser, (req, res) => {
  const { tipo, curso, mensaje } = req.body;
  const { registroAcademico } = req.user;
  
  if (!tipo || !curso || !mensaje) {
    return res.status(400).json({ message: 'Tipo, curso y mensaje son requeridos' });
  }
  
  db.run(
    'INSERT INTO posts (userId, tipo, curso, mensaje) VALUES (?, ?, ?, ?)',
    [registroAcademico, tipo, curso, mensaje],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error al crear publicación' });
      }
      
      res.status(201).json({
        message: 'Publicación creada exitosamente',
        postId: this.lastID
      });
    }
  );
});

/*
//codigo prueba

// Obtener comentarios de una publicación
router.get("/:postId", (req, res) => {
  const { postId } = req.params;
  db.query(
    "SELECT c.id, c.comentario, c.fecha, u.nombres, u.apellidos FROM comentarios c JOIN usuarios u ON c.usuario_id = u.id WHERE c.publicacion_id = ? ORDER BY c.fecha DESC",
    [postId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    }
  );
});
*/

// Crear un comentario
router.post("/", (req, res) => {
  const { publicacion_id, usuario_id, comentario } = req.body;
  db.query(
    "INSERT INTO comentarios (publicacion_id, usuario_id, comentario, fecha) VALUES (?, ?, ?, NOW())",
    [publicacion_id, usuario_id, comentario],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Comentario agregado con éxito" });
    }
  );
});

module.exports = router;





// 4. Arranca el servidor
const PORT = 3000;
app.listen(PORT, () => console.log(`Backend escuchando en http://localhost:${PORT}`));
