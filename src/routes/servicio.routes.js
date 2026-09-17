const express = require('express')
const router = express.Router()
const productoController = require('../controllers/producto.controller')
const { requireLogin, requireRol } = require('../middlewares/auth.middleware')
const { requireModulo } = require('../middlewares/modulo.middleware')
const { marcarServicio } = require('../middlewares/catalogo.middleware')

// El catalogo de servicios usa el MISMO controlador que el de productos: un
// servicio es un producto sin stock. Lo unico que cambia es la marca que pone
// marcarServicio, que le dice al controlador de que lado esta parado.
//
// Va siempre primero, antes que el control de rol, para que hasta los errores
// hablen de servicios y no de productos.
const moduloServicios = requireModulo('servicios')

// Quien arma el catalogo es el administrador. El tesorero lo LEE porque lo
// necesita para decir de donde viene cada ingreso o egreso; el operador no
// entra: un servicio no pasa por el deposito.
const soloAdmin = [requireLogin, marcarServicio, requireRol('admin_empresa'), moduloServicios]
const puedeLeer = [requireLogin, marcarServicio, requireRol('admin_empresa', 'tesorero'), moduloServicios]

router.get('/',           ...puedeLeer, productoController.getProductos)
router.post('/',          ...soloAdmin, productoController.crearProducto)
router.put('/:id',        ...soloAdmin, productoController.actualizarProducto)
router.put('/:id/estado', ...soloAdmin, productoController.cambiarEstadoProducto)

module.exports = router
