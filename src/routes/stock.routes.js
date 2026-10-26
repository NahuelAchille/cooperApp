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

// Una VENTA o una COMPRA en un solo paso: la mercaderia y la plata, juntas. La
// hacen los mismos que el stock, incluido el operador, que es el que esta en
// el mostrador y el que recibe al proveedor: es lo unico de la plata que el
// operador puede tocar. Pide los dos modulos porque escribe en los dos lados.
const operacion = [
  requireLogin,
  requireRol('admin_empresa', 'operador'),
  requireModulo('productos'),
  requireModulo('movimientos')
]

router.post('/ventas',  ...operacion, stockController.registrarVenta)
router.post('/compras', ...operacion, stockController.registrarCompra)

module.exports = router
