const express = require('express')
const router = express.Router()
const categoriaController = require('../controllers/categoria.controller')
const { requireLogin, requireRol } = require('../middlewares/auth.middleware')
const { requireModulo } = require('../middlewares/modulo.middleware')

// Las categorias son la clasificacion de los movimientos, asi que pertenecen
// al mismo modulo: si la empresa lo tiene apagado, esto tampoco se toca.
const moduloMovimientos = requireModulo('movimientos')

// Modificar el arbol de clasificacion (crear/editar/dar de baja categorias y
// tipos) lo hace solo el admin de la empresa.
const soloAdmin = [requireLogin, requireRol('admin_empresa'), moduloMovimientos]

// Leerlo, en cambio, tambien lo necesita el tesorero: sin la lista de
// categorias y tipos no podria elegir al cargar un movimiento.
const puedeLeer = [requireLogin, requireRol('admin_empresa', 'tesorero'), moduloMovimientos]

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
