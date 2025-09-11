const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

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
  db.run('PRAGMA foreign_keys = ON'); 
  db.run('PRAGMA journal_mode = WAL'); 
  db.run('PRAGMA busy_timeout = 5000'); 

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      registroAcademico TEXT PRIMARY KEY,
      nombre            TEXT NOT NULL,
      apellido          TEXT NOT NULL,
      password          TEXT NOT NULL,
      email             TEXT NOT NULL UNIQUE
    )
  `);

  // Tabla de publicaciones
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      userId         TEXT NOT NULL,
      tipo           TEXT NOT NULL CHECK (tipo IN ('course','teacher')),
      curso          TEXT NOT NULL, -- nombre del curso o catedrático
      mensaje        TEXT NOT NULL,
      fechaCreacion  TEXT  DEFAULT (CURRENT_TIMESTAMP),
      FOREIGN KEY (userId)
        REFERENCES users (registroAcademico)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  // Tabla de comentarios
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      postId         INTEGER NOT NULL,
      userId         TEXT    NOT NULL,
      mensaje        TEXT    NOT NULL,
      fechaCreacion  TEXT    DEFAULT (CURRENT_TIMESTAMP),
      FOREIGN KEY (postId)
        REFERENCES posts (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (userId)
        REFERENCES users (registroAcademico)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  // Tabla de cursos aprobados
  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      userId   TEXT    NOT NULL,
      nombre   TEXT    NOT NULL,
      creditos INTEGER NOT NULL CHECK (creditos > 0),
      FOREIGN KEY (userId)
        REFERENCES users (registroAcademico)
        ON DELETE CASCADE ON UPDATE CASCADE,
      UNIQUE (userId, nombre) -- evita duplicar el mismo curso para un usuario
    )
  `);
  // Catálogo de cursos
  db.run(`
  CREATE TABLE IF NOT EXISTS course_catalog (
    codigo   TEXT PRIMARY KEY,
    nombre   TEXT NOT NULL UNIQUE,
    creditos INTEGER NOT NULL CHECK (creditos > 0)
  )
  `);

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
  console.log(req.body);

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

// GET /api/users/:registroAcademico  -> devuelve datos del usuario + stats
app.get('/api/users/:registroAcademico', (req, res) => {
  const ra = req.params.registroAcademico;

  db.get(
    `SELECT 
       u.registroAcademico AS id,
       u.nombre,
       u.apellido,
       u.email,
       (SELECT COUNT(*) FROM posts   p WHERE p.userId = u.registroAcademico) AS publicaciones,
       (SELECT COUNT(*) FROM courses c WHERE c.userId = u.registroAcademico) AS cursosAprobados
     FROM users u
     WHERE u.registroAcademico = ?`,
    [ra],
    (err, row) => {
      if (err)  return res.status(500).json({ message: 'Error en el servidor' });
      if (!row) return res.status(404).json({ message: 'Usuario no encontrado' });

      res.json({
        id: row.id,
        nombre: row.nombre,
        apellido: row.apellido,
        email: row.email,
        stats: {
          publicaciones: row.publicaciones,
          cursosAprobados: row.cursosAprobados,
          seguidores: 0, // no hay tabla de follows en tu esquema
          siguiendo: 0
        }
      });
    }
  );
});

// Actualizar datos básicos del usuario (nombre, apellido, email)
app.put('/api/users/:registroAcademico', (req, res) => {
  const { registroAcademico } = req.params;
  let { nombre, apellido, email } = req.body || {};

  if (!nombre || !apellido || !email) {
    return res.status(400).json({ message: 'nombre, apellido y email son requeridos' });
  }

  // Limpieza simple
  nombre = String(nombre).trim();
  apellido = String(apellido).trim();
  email = String(email).trim();

  db.run(
    `UPDATE users
       SET nombre = ?, apellido = ?, email = ?
     WHERE registroAcademico = ?`,
    [nombre, apellido, email, registroAcademico],
    function (err) {
      if (err) {
        // Manejo de UNIQUE(email)
        if (String(err.message).includes('UNIQUE') || String(err.message).includes('constraint')) {
          return res.status(409).json({ message: 'Ese email ya está en uso' });
        }
        return res.status(500).json({ message: 'Error al actualizar usuario' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Devuelve el recurso actualizado
      return res.json({
        message: 'Usuario actualizado',
        user: {
          registroAcademico,
          nombre,
          apellido,
          email
        }
      });
    }
  );
});

// Listar cursos aprobados de un usuario
app.get('/api/users/:registroAcademico/courses', (req, res) => {
  const { registroAcademico } = req.params;
  db.all(
    `SELECT id, nombre, creditos
       FROM courses
      WHERE userId = ?
      ORDER BY nombre ASC`,
    [registroAcademico],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Error al obtener cursos' });
      res.json(rows);
    }
  );
});

// Agregar curso aprobado
app.post('/api/users/:registroAcademico/courses', (req, res) => {
  const { registroAcademico } = req.params;
  const { nombre, creditos } = req.body || {};

  if (!nombre || !Number.isInteger(creditos) || creditos <= 0) {
    return res.status(400).json({ message: 'nombre y creditos (>0) son requeridos' });
  }

  db.run(
    `INSERT INTO courses (userId, nombre, creditos)
     VALUES (?, ?, ?)`,
    [registroAcademico, nombre.trim(), creditos],
    function (err) {
      if (err) {
        if (String(err.message).includes('UNIQUE')) {
          return res.status(409).json({ message: 'El curso ya está registrado' });
        }
        return res.status(500).json({ message: 'Error al agregar curso' });
      }
      res.status(201).json({ id: this.lastID, nombre, creditos });
    }
  );
});

// Eliminar curso aprobado (por id)
app.delete('/api/users/:registroAcademico/courses/:courseId', (req, res) => {
  const { registroAcademico, courseId } = req.params;
  db.run(
    `DELETE FROM courses
      WHERE id = ? AND userId = ?`,
    [courseId, registroAcademico],
    function (err) {
      if (err) return res.status(500).json({ message: 'Error al eliminar curso' });
      if (this.changes === 0) return res.status(404).json({ message: 'Curso no encontrado' });
      res.json({ message: 'Curso eliminado' });
    }
  );
});

// Listar cursos aprobados de un usuario
app.get('/api/users/:registroAcademico/courses', (req, res) => {
  const { registroAcademico } = req.params;
  db.all(
    `SELECT id, nombre, creditos
       FROM courses
      WHERE userId = ?
      ORDER BY nombre ASC`,
    [registroAcademico],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Error al obtener cursos' });
      res.json(rows);
    }
  );
});

// Catálogo derivado: cursos únicos conocidos en la BD (por nombre)
app.get('/api/courses/catalog', (req, res) => {
  db.all(
    `SELECT nombre, MAX(creditos) AS creditos
       FROM courses
      GROUP BY nombre
      ORDER BY nombre ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Error al obtener catálogo' });
      res.json(rows);
    }
  );
});

// Agregar curso aprobado a un usuario
app.post('/api/users/:registroAcademico/courses', (req, res) => {
  const { registroAcademico } = req.params;
  const { nombre, creditos } = req.body || {};
  if (!nombre || !Number.isInteger(creditos) || creditos <= 0) {
    return res.status(400).json({ message: 'nombre y creditos (>0) son requeridos' });
  }
  db.run(
    `INSERT INTO courses (userId, nombre, creditos) VALUES (?, ?, ?)`,
    [registroAcademico, String(nombre).trim(), creditos],
    function (err) {
      if (err) {
        if (String(err.message).includes('UNIQUE')) {
          return res.status(409).json({ message: 'El curso ya está registrado' });
        }
        return res.status(500).json({ message: 'Error al agregar curso' });
      }
      res.status(201).json({ id: this.lastID, nombre, creditos });
    }
  );
});

// Eliminar curso aprobado (por id)
app.delete('/api/users/:registroAcademico/courses/:courseId', (req, res) => {
  const { registroAcademico, courseId } = req.params;
  db.run(
    `DELETE FROM courses WHERE id = ? AND userId = ?`,
    [courseId, registroAcademico],
    function (err) {
      if (err) return res.status(500).json({ message: 'Error al eliminar curso' });
      if (this.changes === 0) return res.status(404).json({ message: 'Curso no encontrado' });
      res.json({ message: 'Curso eliminado' });
    }
  );
});

// Obtener catálogo global de cursos disponibles
app.get('/api/courses', (req, res) => {
  db.all(
    `SELECT codigo, nombre, creditos
       FROM course_catalog
      ORDER BY codigo ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Error al obtener catálogo' });
      res.json(rows);
    }
  );
});

app.post('/api/users/:registroAcademico/courses/by-code', (req, res) => {
  const { registroAcademico } = req.params;
  const { codigo } = req.body || {};
  if (!codigo) return res.status(400).json({ message: 'codigo es requerido' });

  db.get(
    `SELECT nombre, creditos FROM course_catalog WHERE codigo = ?`,
    [codigo],
    (err, cat) => {
      if (err) return res.status(500).json({ message: 'Error en el servidor' });
      if (!cat) return res.status(404).json({ message: 'Curso no existe en el catálogo' });

      db.run(
        `INSERT INTO courses (userId, nombre, creditos)
         VALUES (?, ?, ?)`,
        [registroAcademico, cat.nombre.trim(), Math.trunc(cat.creditos)],
        function (err2) {
          if (err2) {
            if (/UNIQUE/i.test(err2.message))  return res.status(409).json({ message: 'El curso ya está registrado' });
            if (/FOREIGN KEY/i.test(err2.message)) return res.status(404).json({ message: 'Usuario no encontrado' });
            return res.status(500).json({ message: 'Error al agregar curso' });
          }
          res.status(201).json({ id: this.lastID, codigo, nombre: cat.nombre, creditos: cat.creditos });
        }
      );
    }
  );
});

// =====================
// ENDPOINT: Crear comentario en una publicación
// =====================
app.post('/api/posts/:postId/comments', checkUser, (req, res) => {
  const { mensaje } = req.body;
  const { registroAcademico } = req.user;
  const { postId } = req.params;

  if (!mensaje) {
    return res.status(400).json({ message: 'El comentario no puede estar vacío' });
  }

  // Verificar que la publicación exista
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ message: 'Error en el servidor' });
    if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });

    // Insertar comentario
    db.run(
      'INSERT INTO comments (postId, userId, mensaje) VALUES (?, ?, ?)',
      [postId, registroAcademico, mensaje],
      function (err) {
        if (err) {
          return res.status(500).json({ message: 'Error al crear comentario' });
        }

        res.status(201).json({
          message: 'Comentario agregado exitosamente',
          commentId: this.lastID
        });
      }
    );
  });
});

// =====================
// ENDPOINT: Obtener comentarios de una publicación
// =====================
app.get('/api/posts/:postId/comments', (req, res) => {
  const { postId } = req.params;

  db.all(
    `SELECT c.*, u.nombre, u.apellido
     FROM comments c
     JOIN users u ON c.userId = u.registroAcademico
     WHERE c.postId = ?
     ORDER BY datetime(c.fechaCreacion) ASC`,
    [postId],
    (err, rows) => {
      if (err) {
        console.error('Error en la consulta:', err);
        return res.status(500).json({ message: 'Error al obtener comentarios' });
      }

      res.json(rows);
    }
  );
});

// 4. Arranca el servidor
const PORT = 3000;
app.listen(PORT, () => console.log(`Backend escuchando en http://localhost:${PORT}`));
