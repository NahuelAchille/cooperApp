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

// Las perdidas valorizadas. Es el PRIMER reporte que lee stock, asi que
// necesita tambien el modulo de productos -- el control lo hace el controlador
// y devuelve vacio en vez de un 403, porque una empresa sin productos no tiene
// nada que perder, no es un pedido invalido.
router.get('/perdidas', ...finanzas, reporteController.getReportePerdidas)

// La descarga (HU-54): ?formato=csv|pdf y ?vista=... Una sola ruta para las
// dos formas y las cinco vistas, porque los datos son los mismos que ya
// alimentan la pantalla y lo unico que cambia es como se escriben.
router.get('/descargar', ...finanzas, reporteController.descargarReporte)

module.exports = router
