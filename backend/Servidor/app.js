const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 3001;

// Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'westbrookMVP23',
  database: 'factiodb'
});

// Conectar a la base de datos
connection.connect((err) => {
  if (err) {
    // Imprime el error completo para obtener detalles
    console.error('Error al conectar a la base de datos:', err);
    console.error('Detalles del error:', {
      host: 'localhost',
      user: 'root',
      database: 'factiodb'
    });
    return;
  }
  console.log('Conexión exitosa a la base de datos MySQL');
});

// // Definir una ruta básica para probar la API
// app.get('/', (req, res) => {
//   res.send('¡Hola desde tu API REST!');
// });

// // Iniciar el servidor
// app.listen(port, () => {
// //  console.log(`Servidor escuchando en http://localhost:${port}`);
// });

// // Cierra la conexión a la base de datos cuando la aplicación se detiene
// process.on('SIGINT', () => {
//   connection.end(() => {
//     console.log('Conexión a la base de datos cerrada.');
//     process.exit(0);
//   });
// });
