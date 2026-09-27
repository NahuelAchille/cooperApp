const reporteModel = require('../models/reporte.model')
const { resolver } = require('../services/periodo.service')

// Suma montos sin que la coma se corra.
//
// En JavaScript 0.1 + 0.2 no da 0.3, y un reporte de plata que no cierra por
// un centavo es un reporte que nadie vuelve a creer. Se suma en CENTAVOS, que
// son enteros, y se divide al final una sola vez.
//
// El redondeo del centavo se hace ANTES de sumar, no despues: es el mismo
// criterio que ya se aplico a los montos y al stock minimo, donde redondear
// al final dejaba pasar valores que despues se guardaban en cero.
const sumarEnCentavos = (montos) => {
  const total = montos.reduce((suma, monto) => suma + Math.round(Number(monto) * 100), 0)
  return total / 100
}

// Reporte de un periodo: los movimientos y sus totales.
//
// LOS TOTALES SALEN DE LAS MISMAS FILAS QUE SE LISTAN, no de una segunda
// consulta. Es la condicion de la historia ("los totales coinciden con la
// suma de los movimientos") y la unica forma de que no puedan discrepar
// nunca: son literalmente el mismo array sumado.
//
// Hacerlo con dos consultas tambien daria bien hoy, porque comparten el
// filtro. El problema es manana: el dia que una de las dos cambie y la otra
// no, el reporte muestra una lista que no suma lo que dice su propio total, y
// nadie se entera hasta que alguien saca la calculadora. Es la misma razon
// por la que el calculo del stock esta escrito una sola vez.
exports.getReportePeriodo = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id

    const periodo = resolver(req.query)
    if (periodo.error) {
      return res.status(400).json({ error: periodo.error })
    }

    const movimientos = await reporteModel.movimientosDelPeriodo(id_empresa, periodo)

    const ingresos = movimientos.filter(m => m.naturaleza === 'ingreso')
    const egresos  = movimientos.filter(m => m.naturaleza === 'egreso')

    const total_ingresos = sumarEnCentavos(ingresos.map(m => m.monto))
    const total_egresos  = sumarEnCentavos(egresos.map(m => m.monto))

    // Cuantos quedaron afuera por estar anulados. Se informa a proposito: un
    // total que no cierra con lo que la persona recuerda haber cargado
    // necesita una explicacion, y "no aparecen" es distinto de "los escondi".
    const anulados = await reporteModel.contarAnulados(id_empresa, periodo)

    res.json({
      periodo: { desde: periodo.desde, hasta: periodo.hasta, etiqueta: periodo.etiqueta },
      totales: {
        ingresos: total_ingresos,
        egresos: total_egresos,
        resultado: total_ingresos - total_egresos,
        cantidad: movimientos.length,
        cantidad_ingresos: ingresos.length,
        cantidad_egresos: egresos.length,
        anulados_fuera: anulados
      },
      movimientos
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al armar el reporte' })
  }
}
