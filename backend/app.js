const express = require('express');
const cors = require('cors');
const { getConnection, connectToDatabase } = require('./db');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
app.use(express.json());

// Obtener los usuarios
app.get('/usuarios', async (req, res) => {
  try {
    const connection = getConnection();
    const [rows] = await connection.execute('SELECT id, nombre, email, contrasena FROM usuarios');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un usuario por ID
app.get('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = getConnection();
    const [rows] = await connection.execute('SELECT id, nombre, email, contrasena FROM usuarios WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear un nuevo usuario
app.post('/usuarios', async (req, res) => {
  try {
    const { nombre, email, contrasena } = req.body;
    
    // Validaciones básicas
    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    
    const connection = getConnection();
    const [result] = await connection.execute(
      'INSERT INTO usuarios (nombre, email, contrasena) VALUES (?, ?, ?)',
      [nombre, email, contrasena]
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      nombre, 
      email,
      message: 'Usuario creado exitosamente'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'El email ya está registrado' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Actualizar un usuario existente
app.put('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, contrasena } = req.body;
    
    if (!nombre || !email) {
      return res.status(400).json({ error: 'Nombre y email son obligatorios' });
    }
    
    const connection = getConnection();
    
    // Verificar si el usuario existe
    const [checkRows] = await connection.execute('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (checkRows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Actualizar usuario
    if (contrasena) {
      await connection.execute(
        'UPDATE usuarios SET nombre = ?, email = ?, contrasena = ? WHERE id = ?',
        [nombre, email, contrasena, id]
      );
    } else {
      await connection.execute(
        'UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?',
        [nombre, email, id]
      );
    }
    
    res.json({ id, nombre, email, message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'El email ya está registrado' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});


// Eliminar un usuario
app.delete('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = getConnection();
    
    // Verificar si el usuario existe
    const [checkRows] = await connection.execute('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (checkRows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    await connection.execute('DELETE FROM usuarios WHERE id = ?', [id]);
    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta de salud para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

// Inicializar servidor
async function startServer() {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  });
}

startServer();