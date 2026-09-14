const express = require('express')
const router = express.Router()
const categoriaProductoController = require('../controllers/categoria-producto.controller')
const { requireLogin, requireRol } = require('../middlewares/auth.middleware')
const { requireModulo } = require('../middlewares/modulo.middleware')

// El arbol de categorias es parte del modulo de Productos: si la empresa lo
// tiene apagado, esto tampoco se toca.
const moduloProductos = requireModulo('productos')

// Definir la estructura del catalogo es del admin de la empresa.
const soloAdmin = [requireLogin, requireRol('admin_empresa'), moduloProductos]

// Leerla tambien la necesita el operador: sin la lista de categorias y
// subcategorias no podria elegir al cargar un producto.
const puedeLeer = [requireLogin, requireRol('admin_empresa', 'operador'), moduloProductos]

// --- Categorias (nivel 1) ---
router.get('/',           ...puedeLeer, categoriaProductoController.getCategorias)
router.post('/',          ...soloAdmin, categoriaProductoController.crearCategoria)
router.put('/:id',        ...soloAdmin, categoriaProductoController.actualizarCategoria)
router.put('/:id/estado', ...soloAdmin, categoriaProductoController.cambiarEstadoCategoria)

// --- Subcategorias (nivel 2), colgadas de una categoria ---
router.get('/:id/subcategorias',  ...puedeLeer, categoriaProductoController.getSubcategorias)
router.post('/:id/subcategorias', ...soloAdmin, categoriaProductoController.crearSubcategoria)

// --- Subcategorias por id propio (renombrar / activar / desactivar) ---
router.put('/subcategorias/:id',        ...soloAdmin, categoriaProductoController.actualizarSubcategoria)
router.put('/subcategorias/:id/estado', ...soloAdmin, categoriaProductoController.cambiarEstadoSubcategoria)

module.exports = router
