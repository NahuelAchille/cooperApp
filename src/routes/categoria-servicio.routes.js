const express = require('express')
const router = express.Router()
const categoriaProductoController = require('../controllers/categoria-producto.controller')
const { requireLogin, requireRol } = require('../middlewares/auth.middleware')
const { requireModulo } = require('../middlewares/modulo.middleware')
const { marcarServicio } = require('../middlewares/catalogo.middleware')

// El arbol de clasificacion de los servicios. Mismas tablas y mismo
// controlador que el de productos, separados por la marca de servicio: sin
// ella, el alta de un servicio ofreceria "Alimentos" y la de un producto
// ofreceria "Transporte".
const moduloServicios = requireModulo('servicios')

const soloAdmin = [requireLogin, marcarServicio, requireRol('admin_empresa'), moduloServicios]
const puedeLeer = [requireLogin, marcarServicio, requireRol('admin_empresa', 'tesorero'), moduloServicios]

// --- Categorias (nivel 1) ---
router.get('/',           ...puedeLeer, categoriaProductoController.getCategorias)
router.post('/',          ...soloAdmin, categoriaProductoController.crearCategoria)
router.put('/:id',        ...soloAdmin, categoriaProductoController.actualizarCategoria)
router.put('/:id/estado', ...soloAdmin, categoriaProductoController.cambiarEstadoCategoria)

// --- Subcategorias (nivel 2), colgadas de una categoria ---
router.get('/:id/subcategorias',  ...puedeLeer, categoriaProductoController.getSubcategorias)
router.post('/:id/subcategorias', ...soloAdmin, categoriaProductoController.crearSubcategoria)

// --- Subcategorias por id propio (renombrar / dar de baja / reactivar) ---
router.put('/subcategorias/:id',        ...soloAdmin, categoriaProductoController.actualizarSubcategoria)
router.put('/subcategorias/:id/estado', ...soloAdmin, categoriaProductoController.cambiarEstadoSubcategoria)

module.exports = router
