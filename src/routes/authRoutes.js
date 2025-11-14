const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  loginValidation,
  validateTokenValidation,
  logoutValidation
} = require('../validators/authValidator');

router.post('/login', loginValidation, authController.login);

router.get('/validate-token', validateTokenValidation, authController.validateToken);

router.post('/logout', logoutValidation, authController.logout);

module.exports = router;