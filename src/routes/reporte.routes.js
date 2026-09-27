const express = require('express')
const router = express.Router()
const reporteController = require('../controllers/reporte.controller')
const { requireLogin, requireRol } = require('../middlewares/auth.middleware')
const { requireModulo } = require('../middlewares/modulo.middleware')

// Un reporte es plata, asi que pide lo mismo que el resto de finanzas: el rol
// de admin o tesorero. El operador no entra -- lo suyo es el deposito -- y el
// superadmin tampoco, porque no pertenece a ninguna empresa.
//
// Ademas pide el modulo de REPORTES, que la empresa prende o no. Ojo: un
// reporte de dinero necesita las dos cosas, porque lee movimientos; el dia
// que un reporte lea stock, esa ruta va a tener que pedir tambien productos.
const finanzas = [requireLogin, requireRol('admin_empresa', 'tesorero'), requireModulo('reportes')]

router.get('/periodo', ...finanzas, reporteController.getReportePeriodo)

// El mismo periodo agrupado por categoria, por producto o por servicio
// (?por=...). Los tres van por la misma ruta porque la pregunta es la misma
// y lo unico que cambia es por que agrupar. El control del modulo que
// necesita cada uno lo hace el controlador, porque depende del criterio.
router.get('/agrupado', ...finanzas, reporteController.getReporteAgrupado)

module.exports = router
