const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'useradmin',
    password: process.env.DB_PASSWORD || 'adminpass',
    database: process.env.DB_NAME || 'usuarios',
    port: process.env.DB_PORT || 3306
};

let connection;

async function connectToDatabase() {
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Conectado a MySQL correctamente');
        return connection;
    } catch (error) {
        console.error('Error conectando a la base de datos:', error);
        process.exit(1);
    }
}

function getConnection() {
    return connection;
}

module.exports = { connectToDatabase, getConnection };