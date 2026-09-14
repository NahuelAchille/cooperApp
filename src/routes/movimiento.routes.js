const express = require('express')
const router = express.Router()
const movimientoController = require('../controllers/movimiento.controller')
const { requireLogin, requireRol } = require('../middlewares/auth.middleware')
const { requireModulo } = require('../middlewares/modulo.middleware')

// Para entrar hacen falta las dos cosas:
//   ROL    -> los movimientos los ven y cargan el admin de la empresa y el
//             tesorero (el rol pensado para la caja).
//   MODULO -> la empresa tiene que tener prendido el modulo de movimientos.
const finanzas = [requireLogin, requireRol('admin_empresa', 'tesorero'), requireModulo('movimientos')]

router.get('/',            ...finanzas, movimientoController.getMovimientos)
router.get('/resumen',     ...finanzas, movimientoController.getResumen)
router.post('/',           ...finanzas, movimientoController.crearMovimiento)
router.put('/:id/anular',  ...finanzas, movimientoController.anularMovimiento)

module.exports = router
