const express = require('express')
const router = express.Router()
const cooperativaController = require('../controllers/cooperativa.controller')

router.get('/', cooperativaController.getAll)
router.get('/pendientes', cooperativaController.getPendientes)
router.put('/:id/aprobar', cooperativaController.aprobar)
router.put('/:id/rechazar', cooperativaController.rechazar)

module.exports = router
