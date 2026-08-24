const express = require('express')
const router = express.Router()
const registerController = require('../controllers/register.controller')
const userController = require('../controllers/user.controller')
const { requireLogin, requireRol } = require('../middlewares/auth.middleware')

router.post('/register', registerController.registerCooperativa)
router.post('/login', userController.login)
router.get('/logout', userController.logout)
router.get('/me', requireLogin, userController.me)

router.get('/',    requireLogin, userController.getUsuariosCooperativa)
router.post('/',   requireLogin, requireRol('admin_cooperativa'), userController.crearUsuario)
router.post('/cambiar-password', requireLogin, userController.cambiarPassword)
router.post('/:id/resetear-password', requireLogin, requireRol('superadmin', 'admin_cooperativa'), userController.resetearPassword)

// Edicion y baja de usuarios: solo el administrador de la cooperativa
router.put('/:id', requireLogin, requireRol('admin_cooperativa'), userController.actualizarUsuario)
router.put('/:id/estado', requireLogin, requireRol('admin_cooperativa'), userController.cambiarEstadoUsuario)

module.exports = router
