// Cómo se escriben cantidades y plata en los mensajes y en los archivos que
// arma el servidor (Stock, Reportes, CSV y PDF).
//
// Estaba copiado en stock.controller.js y en reporte.controller.js, y las dos
// copias daban distinto: una "2,5" y la otra "2,50". Los reportes, además,
// decían "10 caja" y "4 bolsa" (revisión de código y funcional, 14/11/2026).
const { nombreUnidad } = require('../config/unidades-medida')

// "5" cuando son 5 (no "5,00"), y "12,5" o "2,75" cuando tiene decimales.
const formatearCantidad = (valor) => {
  const numero = Math.round(Number(valor) * 100) / 100
  return String(numero).replace('.', ',')
}

// "12,5 kg", "6 bolsas", "1 caja". Sin unidad (un servicio), sólo el número.
const conUnidad = (cantidad, clave) =>
  clave ? `${formatearCantidad(cantidad)} ${nombreUnidad(cantidad, clave)}` : formatearCantidad(cantidad)

// "$ 8.200,00", con el punto de miles y la coma decimal de acá.
const formatearPlata = (valor) =>
  '$ ' + Number(valor || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

module.exports = { formatearCantidad, conUnidad, formatearPlata }
