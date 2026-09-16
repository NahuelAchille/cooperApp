const express = require('express')
const router = express.Router()
const motivoStockController = require('../controllers/motivo-stock.controller')
const { requireLogin, requireRol } = require('../middlewares/auth.middleware')
const { requireModulo } = require('../middlewares/modulo.middleware')

const moduloProductos = requireModulo('productos')

// Definir los motivos es del admin: cada uno lleva configurado su impacto en
// el stock y en el dinero, asi que no es un dato mas, es una regla del sistema.
const soloAdmin = [requireLogin, requireRol('admin_empresa'), moduloProductos]

// Leerlos tambien los necesita el operador: sin la lista no podria elegir el
// motivo al registrar un movimiento de stock.
const puedeLeer = [requireLogin, requireRol('admin_empresa', 'operador'), moduloProductos]

router.get('/',           ...puedeLeer, motivoStockController.getMotivos)
router.post('/',          ...soloAdmin, motivoStockController.crearMotivo)
router.put('/:id',        ...soloAdmin, motivoStockController.actualizarMotivo)
router.put('/:id/estado', ...soloAdmin, motivoStockController.cambiarEstadoMotivo)

module.exports = router
