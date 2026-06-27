const express = require('express');
const router = express.Router();
const registerController = require('../controllers/register.controller');
const userController = require('../controllers/user.controller');
const { requireLogin, requireRol } = require('../middlewares/auth.middleware');

router.post('/register', registerController.registerCooperativa);
router.post('/login', userController.login);
router.get('/logout', userController.logout);
router.get('/me', requireLogin, userController.me);

router.get('/',    requireLogin, userController.getUsuariosCooperativa);
router.post('/',   requireLogin, requireRol('admin_cooperativa'), userController.crearUsuario);
router.post('/cambiar-password', requireLogin, userController.cambiarPassword);

module.exports = router;
