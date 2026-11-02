const express = require('express')
const router = express.Router()
const localidadController = require('../controllers/localidad.controller')

// SIN sesion a proposito: la pide el formulario de registro de una empresa,
// que se llena antes de tener usuario. Es una lista de nombres de lugares,
// la misma para todos: no expone nada de nadie.
router.get('/', localidadController.getLocalidades)

module.exports = router
