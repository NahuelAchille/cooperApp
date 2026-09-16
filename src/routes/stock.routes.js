const express = require('express')
const router = express.Router()
const stockController = require('../controllers/stock.controller')
const { requireLogin, requireRol } = require('../middlewares/auth.middleware')
const { requireModulo } = require('../middlewares/modulo.middleware')

// El stock es del deposito: lo trabajan el operador y el admin, igual que el
// catalogo. El tesorero no entra (lo suyo es el dinero) y el superadmin no
// pertenece a ninguna empresa.
const deposito = [requireLogin, requireRol('admin_empresa', 'operador'), requireModulo('productos')]

// Registrar el movimiento de DINERO que sale de un movimiento de stock es otra
// cosa: eso es finanzas. Hacen falta los dos modulos y el rol que maneja plata.
const finanzas = [
  requireLogin,
  requireRol('admin_empresa', 'tesorero'),
  requireModulo('productos'),
  requireModulo('movimientos')
]

router.get('/',             ...deposito, stockController.getExistencias)
router.get('/movimientos',  ...deposito, stockController.getMovimientos)
router.post('/movimientos', ...deposito, stockController.registrarMovimiento)

router.put('/movimientos/:id/anular', ...deposito, stockController.anularMovimiento)

router.post('/movimientos/:id/dinero', ...finanzas, stockController.registrarMovimientoDinero)

module.exports = router
