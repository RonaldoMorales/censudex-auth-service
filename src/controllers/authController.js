// Importa herramientas de validación, JWT, hashing y requests HTTP
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');
const { addToBlocklist, isBlocked } = require('../utils/tokenBlocklist');

// ---------------- LOGIN ----------------
const login = async (req, res) => {
  try {
    // Valida parámetros del request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body;

    // Solicita lista completa de clientes al servicio externo
    const clientsResponse = await axios.get(process.env.CLIENTS_SERVICE_URL);
    
    // Busca al usuario por email o username
    const client = clientsResponse.data.clients.find(
      c => c.email === identifier || c.username === identifier
    );

    // Si no existe usuario → credenciales inválidas
    if (!client) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    // Si el usuario está inactivo → no puede iniciar sesión
    if (!client.isActive) {
      return res.status(403).json({ message: 'Usuario inactivo' });
    }

    // Obtiene detalles completos del usuario, incluyendo contraseña
    const clientDetail = await axios.get(`${process.env.CLIENTS_SERVICE_URL}/${client.id}?includePassword=true`);
    const clientData = clientDetail.data.client;

    // Validación extra por si el backend no retornó password
    if (!clientData.password) {
      return res.status(500).json({ message: 'Error al verificar credenciales' });
    }

    // Compara contraseña ingresada con la encriptada
    const isPasswordValid = await bcrypt.compare(password, clientData.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    // Generación del JWT con datos mínimos del usuario
    const token = jwt.sign(
      { 
        id: clientData.id, 
        role: clientData.role,
        username: clientData.username
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Respuesta final
    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: {
        id: clientData.id,
        username: clientData.username,
        email: clientData.email,
        role: clientData.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      message: 'Error al iniciar sesion',
      error: error.message 
    });
  }
};

// ---------------- VALIDAR TOKEN ----------------
const validateToken = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];

    // Revisa si el token ya fue invalidado manualmente
    if (isBlocked(token)) {
      return res.status(401).json({ message: 'Token invalidado' });
    }

    // Decodifica token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.status(200).json({
      valid: true,
      user: {
        id: decoded.id,
        role: decoded.role,
        username: decoded.username
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalido' });
    }
    res.status(500).json({ 
      message: 'Error al validar token',
      error: error.message 
    });
  }
};

// ---------------- LOGOUT ----------------
const logout = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];

    // Agrega token a blocklist para invalidarlo inmediatamente
    addToBlocklist(token);

    res.status(200).json({ message: 'Sesion cerrada exitosamente' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ 
      message: 'Error al cerrar sesion',
      error: error.message 
    });
  }
};

// Exporta funciones del servicio
module.exports = {
  login,
  validateToken,
  logout
};