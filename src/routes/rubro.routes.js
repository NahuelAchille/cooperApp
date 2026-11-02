const express = require('express')
const router = express.Router()
const rubroController = require('../controllers/rubro.controller')
const { requireLogin } = require('../middlewares/auth.middleware')

// La lista comun de rubros la lee cualquier usuario logueado: la necesitan el
// buscador y los formularios de productos y servicios. Nadie la modifica
// desde la app: la define el sistema.
router.get('/', requireLogin, rubroController.getRubros)

module.exports = router
