CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL
);

INSERT INTO usuarios (nombre, email, contrasena) VALUES
('Juan Pérez', 'juan@example.com', '123456'),
('María García', 'maria@example.com', 'abc');