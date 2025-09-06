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
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);
  db.run(
    `INSERT OR IGNORE INTO users(username, password) VALUES(?, ?)`,
    ['demo', '1234']
  );
});
// 3. Ruta de registro (sin encriptar)
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  db.run(
    `INSERT INTO users(username, password) VALUES(?, ?)`,
    [username, password],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ message: 'Usuario ya existe' });
        }
        return res.status(500).json({ message: 'Error de servidor' });
      }
      res.json({ message: 'Registro exitoso' });
    }
  );
});

// 4. Endpoint POST /api/login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get(
    `SELECT * FROM users WHERE username = ? AND password = ?`,
    [username, password],
    (err, row) => {
      if (err) return res.status(500).json({ message: 'Error en servidor' });
      if (row) {
        return res.json({ success: true, message: 'Login exitoso' });
      }
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
  );
});

// 4. Arranca el servidor
const PORT = 3000;
app.listen(PORT, () => console.log(`Backend escuchando en http://localhost:${PORT}`));
