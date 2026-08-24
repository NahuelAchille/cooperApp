const express = require('express')
const router = express.Router()
const cooperativaController = require('../controllers/cooperativa.controller')
const { requireLogin, requireRol } = require('../middlewares/auth.middleware')

// Perfil de la cooperativa del usuario logueado.
// El superadmin no administra ninguna cooperativa: para eso tiene su propio panel.
router.get('/mi-cooperativa', requireLogin, cooperativaController.getMiCooperativa)
router.put('/mi-cooperativa', requireLogin, requireRol('admin_cooperativa'), cooperativaController.actualizarMiCooperativa)

// Administración de la plataforma: sólo para el superadmin.
// El listado expone datos de contacto de todas las cooperativas, y aprobar o rechazar
// decide quién entra al sistema: nada de esto puede quedar abierto.
router.get('/', requireLogin, requireRol('superadmin'), cooperativaController.getAll)
router.get('/pendientes', requireLogin, requireRol('superadmin'), cooperativaController.getPendientes)
router.put('/:id/aprobar', requireLogin, requireRol('superadmin'), cooperativaController.aprobar)
router.put('/:id/rechazar', requireLogin, requireRol('superadmin'), cooperativaController.rechazar)

module.exports = router
