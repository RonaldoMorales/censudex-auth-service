const { body, header } = require('express-validator');

const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('El correo o nombre de usuario es requerido')
    .isString()
    .withMessage('El identificador debe ser texto'),
  
  body('password')
    .notEmpty()
    .withMessage('La contrasena es requerida')
    .isString()
    .withMessage('La contrasena debe ser texto')
];

const validateTokenValidation = [
  header('authorization')
    .notEmpty()
    .withMessage('El token es requerido')
    .matches(/^Bearer\s[\w-]*\.[\w-]*\.[\w-]*$/)
    .withMessage('Formato de token invalido. Debe ser Bearer <token>')
];

const logoutValidation = [
  header('authorization')
    .notEmpty()
    .withMessage('El token es requerido')
    .matches(/^Bearer\s[\w-]*\.[\w-]*\.[\w-]*$/)
    .withMessage('Formato de token invalido. Debe ser Bearer <token>')
];

module.exports = {
  loginValidation,
  validateTokenValidation,
  logoutValidation
};