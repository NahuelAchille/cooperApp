const express = require('express')
const router = express.Router()
const moduloController = require('../controllers/modulo.controller')
const { requireLogin, requireRol } = require('../middlewares/auth.middleware')

// Consultar que modulos estan activos lo necesita cualquier usuario logueado:
// el menu se arma con eso.
router.get('/', requireLogin, moduloController.getModulos)

// Prenderlos y apagarlos, solo el administrador de la empresa.
router.put('/:clave', requireLogin, requireRol('admin_empresa'), moduloController.cambiarEstadoModulo)

module.exports = router
