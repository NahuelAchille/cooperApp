const express = require('express')
const router = express.Router()
const movimientoController = require('../controllers/movimiento.controller')
const { requireLogin, requireRol } = require('../middlewares/auth.middleware')

// Los movimientos financieros los ven y cargan el admin de la cooperativa y el
// tesorero (el rol pensado para la caja). Coincide con los permisos sembrados
// en la base: movimientos.ver / movimientos.crear.
const finanzas = [requireLogin, requireRol('admin_cooperativa', 'tesorero')]

router.get('/',            ...finanzas, movimientoController.getMovimientos)
router.get('/resumen',     ...finanzas, movimientoController.getResumen)
router.post('/',           ...finanzas, movimientoController.crearMovimiento)
router.put('/:id/anular',  ...finanzas, movimientoController.anularMovimiento)

module.exports = router
