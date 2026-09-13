const express = require('express')
const router = express.Router()
const empresaController = require('../controllers/empresa.controller')
const { requireLogin, requireRol } = require('../middlewares/auth.middleware')

// Perfil de la empresa del usuario logueado.
// El superadmin no administra ninguna empresa: para eso tiene su propio panel.
router.get('/mi-empresa', requireLogin, empresaController.getMiEmpresa)
router.put('/mi-empresa', requireLogin, requireRol('admin_empresa'), empresaController.actualizarMiEmpresa)

// Administración de la plataforma: sólo para el superadmin.
// El listado expone datos de contacto de todas las empresas, y aprobar o rechazar
// decide quién entra al sistema: nada de esto puede quedar abierto.
router.get('/', requireLogin, requireRol('superadmin'), empresaController.getAll)
router.get('/pendientes', requireLogin, requireRol('superadmin'), empresaController.getPendientes)
router.put('/:id/aprobar', requireLogin, requireRol('superadmin'), empresaController.aprobar)
router.put('/:id/rechazar', requireLogin, requireRol('superadmin'), empresaController.rechazar)

module.exports = router
