const reporteModel = require('../models/reporte.model')
const movimientoModel = require('../models/movimiento.model')
const moduloModel = require('../models/modulo.model')
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

// =====================================================================
// AGRUPADOS (HU-52)
// =====================================================================
//
// El mismo periodo mirado por otro lado: no "cuanto entro y cuanto salio",
// sino "de donde". Tres criterios, un solo endpoint, porque la pregunta es la
// misma y lo unico que cambia es por que agrupar.

const CRITERIOS = ['categoria', 'producto', 'servicio']

// Que modulo necesita cada agrupacion. El de categorias no lleva ninguno
// aparte: toda empresa clasifica su dinero, y la ruta ya pide movimientos.
const MODULO_DE = { producto: 'productos', servicio: 'servicios' }

exports.getReporteAgrupado = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id

    const criterio = CRITERIOS.includes(req.query.por) ? req.query.por : 'categoria'

    const periodo = resolver(req.query)
    if (periodo.error) {
      return res.status(400).json({ error: periodo.error })
    }

    // Si la empresa no tiene el modulo, se devuelve vacio y se avisa por que.
    // No es un pedido invalido: es una empresa que no usa esa parte del
    // sistema, y la pantalla simplemente no ofrece esa vista. Mismo criterio
    // que el resumen por servicio de HU-49.
    const moduloNecesario = MODULO_DE[criterio]
    if (moduloNecesario && !await moduloModel.estaActivo(id_empresa, moduloNecesario)) {
      return res.json({
        criterio,
        periodo: { desde: periodo.desde, hasta: periodo.hasta, etiqueta: periodo.etiqueta },
        modulo_apagado: moduloNecesario,
        filas: []
      })
    }

    const filas = await armarFilas(criterio, id_empresa, periodo)

    res.json({
      criterio,
      periodo: { desde: periodo.desde, hasta: periodo.hasta, etiqueta: periodo.etiqueta },
      modulo_apagado: null,
      filas
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al armar el reporte' })
  }
}

// Cada criterio devuelve las mismas columnas, aunque las saque de lugares
// distintos: nombre, ingresos, egresos, resultado y un detalle propio. Asi la
// pantalla pinta una sola tabla y no tres.
const armarFilas = async (criterio, id_empresa, periodo) => {

  if (criterio === 'servicio') {
    // REUSA la consulta de HU-49 en vez de escribir una igual. Si mañana
    // cambia la regla de que servicio entra en el resumen, cambia en los dos
    // lados a la vez. Es lo mismo que se hizo con el calculo del stock.
    const servicios = await movimientoModel.resumenPorServicio(id_empresa, periodo)
    return servicios.map(s => ({
      id: s.id_servicio,
      nombre: s.nombre,
      activo: s.activo,
      ingresos: s.total_ingresos,
      egresos: s.total_egresos,
      resultado: s.resultado,
      detalle: s.cantidad === 0
        ? 'Sin movimientos en el período'
        : `${s.cantidad} ${s.cantidad === 1 ? 'movimiento' : 'movimientos'}`
    }))
  }

  if (criterio === 'producto') {
    const productos = await reporteModel.porProducto(id_empresa, periodo)
    return productos.map(p => {
      const cobrado = Number(p.cobrado)
      const pagado = Number(p.pagado)
      const sinValorizar = Number(p.sin_valorizar)

      // El detalle de un producto son las cantidades, no la plata: es lo que
      // el del deposito reconoce. Y si quedaron movimientos sin el $, se dice
      // acá mismo: sin eso, el total parece el total y es una parte.
      const partes = []
      if (Number(p.entradas) > 0) partes.push(`entraron ${formatearCantidad(p.entradas)}`)
      if (Number(p.salidas) > 0) partes.push(`salieron ${formatearCantidad(p.salidas)}`)
      if (!partes.length) partes.push('Sin movimientos en el período')
      if (sinValorizar > 0) {
        partes.push(sinValorizar === 1
          ? '1 movimiento sin el $ cargado'
          : `${sinValorizar} movimientos sin el $ cargado`)
      }

      return {
        id: p.id_producto,
        nombre: p.nombre,
        activo: p.activo,
        ingresos: cobrado,
        egresos: pagado,
        resultado: cobrado - pagado,
        detalle: partes.join(' · '),
        sin_valorizar: sinValorizar
      }
    })
  }

  // --- categoria ---
  //
  // Una categoria es de ingreso O de egreso, nunca las dos: la naturaleza es
  // fija y vive en la categoria. Por eso su total va de un lado o del otro, y
  // el "resultado" de una categoria es su propio total con signo.
  const categorias = await reporteModel.porCategoria(id_empresa, periodo)
  return categorias.map(c => {
    const total = Number(c.total)
    const esIngreso = c.naturaleza === 'ingreso'
    return {
      id: c.id_categoria,
      nombre: c.nombre,
      activo: c.activo,
      naturaleza: c.naturaleza,
      ingresos: esIngreso ? total : 0,
      egresos: esIngreso ? 0 : total,
      resultado: esIngreso ? total : -total,
      detalle: Number(c.cantidad) === 0
        ? 'Sin movimientos en el período'
        : `${c.cantidad} ${Number(c.cantidad) === 1 ? 'movimiento' : 'movimientos'}`
    }
  })
}

// Las cantidades se guardan con 2 decimales, pero mostrar "5,00 unidades"
// cuando son 5 es ruido. Mismo criterio que el catalogo de productos.
function formatearCantidad(valor) {
  const numero = Number(valor)
  return Number.isInteger(numero) ? String(numero) : numero.toFixed(2).replace('.', ',')
}

// =====================================================================
// PERDIDAS VALORIZADAS (HU-53)
// =====================================================================
//
// Cuanto se fue en mercaderia que salio sin venderse, valuada a lo que costo.
//
// ESTA PLATA NO ESTA EN EL BALANCE y el reporte lo dice en pantalla. Los
// egresos del balance son plata que salio de la caja; esto es mercaderia que
// se fue. Sumarlos seria contar dos veces lo mismo, porque esa mercaderia ya
// se pago cuando se compro. Por eso este reporte va aparte y no toca los
// totales del periodo.
//
// Pide los DOS modulos: productos (de donde sale la mercaderia) y reportes
// (que ya lo pide la ruta). Es el primer reporte que lee stock, que era
// justamente lo que quedaba anotado en HU-51.
exports.getReportePerdidas = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id

    if (!await moduloModel.estaActivo(id_empresa, 'productos')) {
      return res.json({
        modulo_apagado: 'productos',
        periodo: null, totales: null, motivos: [], productos: []
      })
    }

    const periodo = resolver(req.query)
    if (periodo.error) {
      return res.status(400).json({ error: periodo.error })
    }

    const [motivos, productos] = await Promise.all([
      reporteModel.perdidasPorMotivo(id_empresa, periodo),
      reporteModel.perdidasPorProducto(id_empresa, periodo)
    ])

    // El total sale de las mismas filas que se listan, igual que en HU-51.
    const valorizado = sumarEnCentavos(motivos.map(m => m.valorizado))
    const movimientos = motivos.reduce((s, m) => s + Number(m.movimientos), 0)
    const sinCosto = motivos.reduce((s, m) => s + Number(m.sin_costo), 0)

    res.json({
      modulo_apagado: null,
      periodo: { desde: periodo.desde, hasta: periodo.hasta, etiqueta: periodo.etiqueta },
      totales: {
        valorizado,
        movimientos,
        // Cuantas salidas no se pudieron valorizar porque el producto no tiene
        // costo cargado. Se informa SIEMPRE, aunque sea cero: es lo que separa
        // "perdimos $12.000" de "perdimos $12.000 y algo mas que no sabemos".
        sin_costo: sinCosto
      },
      motivos: motivos.map(m => ({
        id: m.id_motivo_stock,
        nombre: m.nombre,
        activo: m.activo,
        valorizado: Number(m.valorizado),
        movimientos: Number(m.movimientos),
        sin_costo: Number(m.sin_costo)
      })),
      productos: productos.map(p => ({
        id: p.id_producto,
        nombre: p.nombre,
        unidad_medida: p.unidad_medida,
        cantidad: Number(p.cantidad),
        movimientos: Number(p.movimientos),
        valorizado: Number(p.valorizado),
        // null = "no lo se". La pantalla lo muestra como tal, nunca como $0.
        costo_referencia: p.costo_referencia === null ? null : Number(p.costo_referencia),
        costo_actualizado_en: p.costo_actualizado_en
      }))
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al armar el reporte de pérdidas' })
  }
}
