const express = require('express')
const router = express.Router()
const productoController = require('../controllers/producto.controller')
const { requireLogin, requireRol } = require('../middlewares/auth.middleware')
const { requireModulo } = require('../middlewares/modulo.middleware')

// El catalogo es del modulo de Productos: si la empresa lo tiene apagado,
// estas rutas no responden aunque el rol alcance.
const moduloProductos = requireModulo('productos')

// El operador es el rol del deposito: es el que carga y mantiene el catalogo.
// El admin tambien entra, porque es quien arma la empresa al principio.
const catalogo = [requireLogin, requireRol('admin_empresa', 'operador'), moduloProductos]

router.get('/unidades',   ...catalogo, productoController.getUnidades)

router.get('/',           ...catalogo, productoController.getProductos)
router.post('/',          ...catalogo, productoController.crearProducto)
router.put('/:id',        ...catalogo, productoController.actualizarProducto)
router.put('/:id/estado', ...catalogo, productoController.cambiarEstadoProducto)

module.exports = router
