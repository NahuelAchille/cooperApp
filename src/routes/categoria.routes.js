const express = require('express')
const router = express.Router()
const categoriaController = require('../controllers/categoria.controller')
const { requireLogin, requireRol } = require('../middlewares/auth.middleware')

// Modificar el arbol de clasificacion (crear/editar/dar de baja categorias y
// tipos) lo hace solo el admin de la cooperativa.
const soloAdmin = [requireLogin, requireRol('admin_cooperativa')]

// Leerlo, en cambio, tambien lo necesita el tesorero: sin la lista de
// categorias y tipos no podria elegir al cargar un movimiento.
const puedeLeer = [requireLogin, requireRol('admin_cooperativa', 'tesorero')]

// --- Categorias (nivel 2) ---
router.get('/',              ...puedeLeer, categoriaController.getCategorias)
router.post('/',             ...soloAdmin, categoriaController.crearCategoria)
router.put('/:id',           ...soloAdmin, categoriaController.actualizarCategoria)
router.put('/:id/estado',    ...soloAdmin, categoriaController.cambiarEstadoCategoria)

// --- Tipos (nivel 3), colgados de una categoria ---
router.get('/:id/tipos',     ...puedeLeer, categoriaController.getTipos)
router.post('/:id/tipos',    ...soloAdmin, categoriaController.crearTipo)

// --- Tipos por id propio (renombrar / activar / desactivar) ---
router.put('/tipos/:id',        ...soloAdmin, categoriaController.actualizarTipo)
router.put('/tipos/:id/estado', ...soloAdmin, categoriaController.cambiarEstadoTipo)

module.exports = router
