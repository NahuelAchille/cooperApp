const express = require('express')
const router = express.Router()
const articulacionController = require('../controllers/articulacion.controller')
const { requireLogin, requireRol } = require('../middlewares/auth.middleware')
const { requireModulo } = require('../middlewares/modulo.middleware')

// El buscador lo usan todos los roles de una empresa: buscar un proveedor no
// es cosa de un solo puesto. No toca plata ni stock: muestra lo que las otras
// empresas eligieron mostrar. El superadmin no entra (no tiene empresa), y
// hace falta el modulo de Articulacion prendido.
const buscador = [
  requireLogin,
  requireRol('admin_empresa', 'tesorero', 'operador'),
  requireModulo('articulacion')
]

router.get('/buscar',        ...buscador, articulacionController.buscar)
router.get('/mi-estado',     ...buscador, articulacionController.getMiEstado)
router.get('/empresas/:id',  ...buscador, articulacionController.getFicha)

module.exports = router
