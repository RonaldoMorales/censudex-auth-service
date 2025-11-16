require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

// Habilita CORS para permitir solicitudes desde otros servicios/frontend
app.use(cors());

// Permite recibir JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas principales del servicio de autenticación
app.use('/api/auth', authRoutes);

// Endpoint de salud para verificar que el servicio está activo
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Auth Service' });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware de manejo de errores generales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Inicia el servidor HTTP
const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Auth Service corriendo en puerto ${PORT}`);
  });
};

startServer();
