const reporteModel = require('../models/reporte.model')
const movimientoModel = require('../models/movimiento.model')
const moduloModel = require('../models/modulo.model')
const { resolver } = require('../services/periodo.service')
const { armarCSV, nombreDeArchivo, numero, fecha } = require('../services/exportar.service')
const { armarPDF, plata, fechaCorta, VERDE, ROJO, GRIS } = require('../services/pdf.service')

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
// Arma el reporte del periodo. Esta aparte del endpoint porque la DESCARGA
// (HU-54) tiene que salir exactamente de aca: si el archivo se armara con su
// propia consulta, el dia que una cambie el PDF diria un numero y la pantalla
// otro. Es la misma regla que ordena todo el modulo.
const datosDelPeriodo = async (id_empresa, periodo) => {

  const movimientos = await reporteModel.movimientosDelPeriodo(id_empresa, periodo)

  const ingresos = movimientos.filter(m => m.naturaleza === 'ingreso')
  const egresos  = movimientos.filter(m => m.naturaleza === 'egreso')

  const total_ingresos = sumarEnCentavos(ingresos.map(m => m.monto))
  const total_egresos  = sumarEnCentavos(egresos.map(m => m.monto))

  // Cuantos quedaron afuera por estar anulados. Se informa a proposito: un
  // total que no cierra con lo que la persona recuerda haber cargado
  // necesita una explicacion, y "no aparecen" es distinto de "los escondi".
  const anulados = await reporteModel.contarAnulados(id_empresa, periodo)

  return {
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
  }
}

exports.getReportePeriodo = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id

    const periodo = resolver(req.query)
    if (periodo.error) {
      return res.status(400).json({ error: periodo.error })
    }

    const datos = await datosDelPeriodo(id_empresa, periodo)
    // Sólo hace falta preguntarlo cuando el período vino vacío.
    datos.empresa_sin_movimientos = datos.movimientos.length === 0 &&
      !(await reporteModel.tieneMovimientosCargados(id_empresa))
    res.json(datos)

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
      aviso: criterio === 'producto' ? avisoDeProductosSinPlata(filas) : null,
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
//
// `movio` dice si esa fila tuvo algun movimiento en el periodo. Una tabla con
// todas las filas en cero no es un reporte: la pantalla no ofrece bajarla.
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
      // El bloque al que pertenece: los que se ofrecen y los que se contratan
      // no se comparan entre si (UX 28/09, H-03). Ya vienen ordenados por
      // bloque desde el modelo.
      categoria: s.categoria,
      deja_categoria: s.deja_categoria,
      movio: s.cantidad > 0,
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
      // Con la unidad: en la misma columna conviven kilos, bolsas y unidades,
      // y "salieron 14,50" a secas no dice de que (UX 28/09, vocabulario).
      const unidad = p.unidad_medida ? ' ' + p.unidad_medida : ''
      const partes = []
      if (Number(p.entradas) > 0) partes.push(`entraron ${formatearCantidad(p.entradas)}${unidad}`)
      if (Number(p.salidas) > 0) partes.push(`salieron ${formatearCantidad(p.salidas)}${unidad}`)
      if (!partes.length) partes.push('Sin movimientos en el período')
      if (sinValorizar > 0) {
        partes.push(sinValorizar === 1
          ? '1 movimiento sin la plata registrada'
          : `${sinValorizar} movimientos sin la plata registrada`)
      }

      return {
        id: p.id_producto,
        nombre: p.nombre,
        activo: p.activo,
        ingresos: cobrado,
        egresos: pagado,
        resultado: cobrado - pagado,
        detalle: partes.join(' · '),
        movio: Number(p.entradas) > 0 || Number(p.salidas) > 0,
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
      movio: Number(c.cantidad) > 0,
      detalle: Number(c.cantidad) === 0
        ? 'Sin movimientos en el período'
        : `${c.cantidad} ${Number(c.cantidad) === 1 ? 'movimiento' : 'movimientos'}`
    }
  })
}

// El reporte por producto con TODA la plata en cero no es "no se vendio
// nada": es que ninguna salida tiene el cobro cargado, porque el sistema no
// conoce los precios y el movimiento de dinero se ofrece, no se calcula. En
// pantalla el detalle de cada fila lo insinua; el archivo que se manda al
// contador tiene que decirlo con todas las letras (UX 28/09, H-01).
// Devuelve el aviso, o null si no hace falta.
const avisoDeProductosSinPlata = (filas) => {
  const conPlata = filas.some(f => f.ingresos || f.egresos)
  const sinCargar = filas.reduce((s, f) => s + (f.sin_valorizar || 0), 0)
  if (conPlata || sinCargar === 0) return null
  return 'Ninguna de las salidas de este período tiene el cobro cargado, por eso todas las filas dan $0. ' +
         'El dinero de una venta se carga desde Stock, al registrar la salida.'
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
// Aparte del endpoint por lo mismo que datosDelPeriodo: la descarga sale de
// aca, no de una consulta propia.
const datosDePerdidas = async (id_empresa, periodo) => {

    const [motivos, productos] = await Promise.all([
      reporteModel.perdidasPorMotivo(id_empresa, periodo),
      reporteModel.perdidasPorProducto(id_empresa, periodo)
    ])

    // El total sale de las mismas filas que se listan, igual que en HU-51.
    const valorizado = sumarEnCentavos(motivos.map(m => m.valorizado))
    const movimientos = motivos.reduce((s, m) => s + Number(m.movimientos), 0)
    const sinCosto = motivos.reduce((s, m) => s + Number(m.sin_costo), 0)

    return {
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
  }
}

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

    res.json(await datosDePerdidas(id_empresa, periodo))

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al armar el reporte de pérdidas' })
  }
}

// =====================================================================
// DESCARGAR (HU-54)
// =====================================================================
//
// Un solo endpoint para las dos formas y las cinco vistas. Los datos salen de
// las MISMAS funciones que alimentan la pantalla (datosDelPeriodo, armarFilas,
// datosDePerdidas): si el archivo consultara por su cuenta, el dia que una
// cambie el PDF diria un numero y la pantalla otro.

const FORMATOS = ['csv', 'pdf']

// Como se llama cada vista en el titulo del reporte y en el nombre del
// archivo. Escrito una sola vez para que no se separen.
const TITULO_DE = {
  movimientos: 'Movimientos del período',
  categoria:   'Totales por categoría',
  producto:    'Totales por producto',
  servicio:    'Totales por servicio',
  perdidas:    'Lo que se perdió en el período'
}

exports.descargarReporte = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const empresa = req.session.user.empresa.nombre || 'Empresa'

    const formato = FORMATOS.includes(req.query.formato) ? req.query.formato : 'csv'
    const vista = TITULO_DE[req.query.vista] ? req.query.vista : 'movimientos'

    const periodo = resolver(req.query)
    if (periodo.error) {
      return res.status(400).json({ error: periodo.error })
    }

    // El modulo que necesita cada vista, igual que en la pantalla. Aca se
    // devuelve 403 y no una lista vacia: pedir un ARCHIVO de algo que la
    // empresa no tiene si es un pedido invalido, y un archivo vacio que se
    // baja igual es peor que un error, porque no se nota.
    const moduloNecesario = vista === 'perdidas' ? 'productos' : MODULO_DE[vista]
    if (moduloNecesario && !await moduloModel.estaActivo(id_empresa, moduloNecesario)) {
      return res.status(403).json({ error: `El módulo de ${moduloNecesario} no está activo en tu empresa` })
    }

    const armado = vista === 'perdidas'
      ? await armarDescargaDePerdidas(id_empresa, periodo)
      : vista === 'movimientos'
        ? await armarDescargaDeMovimientos(id_empresa, periodo)
        : await armarDescargaAgrupada(vista, id_empresa, periodo)

    const nombre = nombreDeArchivo({ empresa, vista, periodo, extension: formato })

    // Content-Disposition: attachment es lo que hace que el navegador lo baje
    // en vez de mostrarlo, y lo que le da el nombre al archivo.
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`)

    if (formato === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      return res.send(armarCSV({
        titulo: TITULO_DE[vista], empresa, periodo, totales: armado.totalesCSV,
        avisos: armado.avisos, encabezado: armado.encabezadoCSV, filas: armado.filasCSV
      }))
    }

    res.setHeader('Content-Type', 'application/pdf')
    armarPDF(res, {
      empresa, titulo: TITULO_DE[vista], periodo,
      avisos: armado.avisos, casilleros: armado.casilleros, bloques: armado.bloques
    })

  } catch (error) {
    // Si el PDF ya empezo a escribirse no se puede mandar un JSON encima: los
    // encabezados ya salieron. Se corta ahi y el navegador muestra su propio
    // error de descarga incompleta, que es lo unico honesto que queda.
    if (res.headersSent) return res.end()

    // La libreria del PDF no viaja en el pull (node_modules esta en el
    // .gitignore). En vez de un "Error del servidor" que no dice nada, se
    // explica que falta y como se arregla. El CSV sigue andando igual.
    if (error.codigo === 'FALTA_PDFKIT') {
      console.error('Falta pdfkit: correr "npm install" en la carpeta cooperApp')
      return res.status(500).json({
        error: 'Falta instalar la librería del PDF. Corré "npm install" en la carpeta cooperApp y volvé a intentar. Mientras tanto podés descargar el CSV.'
      })
    }

    console.error(error)
    res.status(500).json({ error: 'Error al armar el archivo' })
  }
}

// Los tres casilleros del periodo, para los dos formatos. La pantalla los
// muestra arriba de TODAS las vistas menos la de perdidas, asi que el archivo
// tambien: el que lo recibe no tiene la pantalla al lado para mirarlos.
const totalesDelPeriodo = (t) => ({
  casilleros: [
    { etiqueta: 'Entró', valor: plata(t.ingresos), color: VERDE },
    { etiqueta: 'Salió', valor: plata(t.egresos), color: ROJO },
    { etiqueta: 'Resultado', valor: plata(t.resultado), color: t.resultado < 0 ? ROJO : VERDE }
  ],
  totalesCSV: [
    ['Entró en el período', numero(t.ingresos)],
    ['Salió en el período', numero(t.egresos)],
    ['Resultado del período', numero(t.resultado)]
  ]
})

// El aviso de los anulados, que acompaña a los casilleros donde vayan.
const avisosDelPeriodo = (t) => t.anulados_fuera > 0
  ? [`${t.anulados_fuera} ${t.anulados_fuera === 1 ? 'movimiento anulado no entra' : 'movimientos anulados no entran'} en este reporte: un movimiento anulado es uno que no pasó.`]
  : []

// --- Los movimientos del periodo ---
const armarDescargaDeMovimientos = async (id_empresa, periodo) => {

  const datos = await datosDelPeriodo(id_empresa, periodo)

  return {
    avisos: avisosDelPeriodo(datos.totales),
    ...totalesDelPeriodo(datos.totales),
    encabezadoCSV: ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Entró / Salió', 'Monto', 'Servicio'],
    filasCSV: datos.movimientos.map(m => [
      fecha(m.fecha), m.descripcion, m.categoria_nombre, m.tipo_nombre,
      m.naturaleza === 'ingreso' ? 'Entró' : 'Salió',
      numero(m.monto), m.servicio_nombre
    ]),
    bloques: [{
      columnas: [
        { titulo: 'Fecha', ancho: 0.13 },
        { titulo: 'Descripción', ancho: 0.34 },
        { titulo: 'Categoría', ancho: 0.20 },
        { titulo: 'Tipo', ancho: 0.18 },
        { titulo: 'Monto', ancho: 0.15, align: 'right' }
      ],
      filas: datos.movimientos.map(m => [
        fechaCorta(m.fecha),
        m.servicio_nombre ? `${m.descripcion || '—'}\n(${m.servicio_nombre})` : (m.descripcion || '—'),
        m.categoria_nombre,
        m.tipo_nombre,
        { texto: (m.naturaleza === 'ingreso' ? '+' : '-') + plata(m.monto),
          color: m.naturaleza === 'ingreso' ? VERDE : ROJO }
      ]),
      vacio: 'No hubo movimientos en este período.'
    }]
  }
}

// --- Los agrupados: por categoria, producto o servicio ---
const armarDescargaAgrupada = async (vista, id_empresa, periodo) => {

  // Los totales salen del reporte del periodo, igual que en la pantalla: en
  // producto y servicio la tabla es un pedazo del periodo, no el periodo.
  const [filas, periodoCompleto] = await Promise.all([
    armarFilas(vista, id_empresa, periodo),
    datosDelPeriodo(id_empresa, periodo)
  ])
  const agrupador = { categoria: 'Categoría', producto: 'Producto', servicio: 'Servicio' }[vista]

  const avisos = avisosDelPeriodo(periodoCompleto.totales)
  const sinPlata = vista === 'producto' ? avisoDeProductosSinPlata(filas) : null
  if (sinPlata) avisos.push(sinPlata)

  // Por servicio, la categoria va adelante del detalle y NO como una fila de
  // subtotal: un subtotal metido en la misma columna la hace sumar de mas al
  // seleccionarla en Excel, que es lo que paso con las perdidas (H-02).
  const detalle = (f) => vista === 'servicio' && f.categoria ? `${f.categoria} · ${f.detalle}` : f.detalle

  return {
    avisos,
    ...totalesDelPeriodo(periodoCompleto.totales),
    encabezadoCSV: [agrupador, 'Detalle', 'Entró', 'Salió', 'Resultado'],
    filasCSV: filas.map(f => [
      f.nombre + (f.activo ? '' : ' (de baja)'),
      detalle(f), numero(f.ingresos), numero(f.egresos), numero(f.resultado)
    ]),
    bloques: [{
      columnas: [
        { titulo: agrupador, ancho: 0.46 },
        { titulo: 'Entró', ancho: 0.18, align: 'right' },
        { titulo: 'Salió', ancho: 0.18, align: 'right' },
        { titulo: 'Resultado', ancho: 0.18, align: 'right' }
      ],
      // El detalle va abajo del nombre, como en la pantalla. Sin el, el PDF
      // por producto era una hoja de ceros sin una palabra de por que
      // (UX 28/09, H-01).
      filas: filas.map(f => [
        f.nombre + (f.activo ? '' : ' (de baja)') + (f.detalle ? `\n${detalle(f)}` : ''),
        f.ingresos ? plata(f.ingresos) : '—',
        f.egresos ? plata(f.egresos) : '—',
        { texto: plata(f.resultado), color: f.resultado < 0 ? ROJO : (f.resultado > 0 ? VERDE : GRIS) }
      ]),
      vacio: 'No hay nada para agrupar en este período.'
    }]
  }
}

// --- Lo que se perdio ---
const armarDescargaDePerdidas = async (id_empresa, periodo) => {

  const datos = await datosDePerdidas(id_empresa, periodo)
  const t = datos.totales

  // Los dos avisos de la pantalla van tambien al archivo. El primero es el que
  // MAS importa: sin el, alguien que recibe el PDF suelto puede restar este
  // numero del balance y contar dos veces la misma mercaderia.
  const avisos = [
    'Esta plata NO está en los egresos del balance: es mercadería que se fue sin venderse, valuada a lo que costó. Esa mercadería ya se pagó cuando se compró, así que sumarlas sería contar dos veces lo mismo.'
  ]
  if (t.sin_costo > 0) {
    avisos.push(`${t.sin_costo} ${t.sin_costo === 1 ? 'salida no se pudo valorizar' : 'salidas no se pudieron valorizar'} porque esos productos no tienen cargado cuánto cuestan. NO están en el total: lo perdido es ese número y algo más.`)
  }

  return {
    avisos,
    casilleros: [
      { etiqueta: 'Se fue en mercadería', valor: plata(t.valorizado), color: ROJO }
    ],
    totalesCSV: [['Se fue en mercadería', numero(t.valorizado)]],
    // Los dos cortes son LA MISMA plata mirada de dos maneras. Uno abajo del
    // otro en la misma columna, quien la seleccionaba en Excel veia el doble
    // del total (UX 28/09, H-02). Ahora cada uno es un bloque aparte, con su
    // titulo, su encabezado y su total, separados por dos filas en blanco.
    //
    // Y el producto sin costo dice "No se sabe", como la pantalla y el PDF:
    // una celda vacia en una columna de plata se lee como nada (H-10).
    encabezadoCSV: null,
    filasCSV: [
      ['¿Por qué se fue?'],
      ['Motivo', 'Detalle', 'Cuánto costó'],
      ...datos.motivos.map(m => [m.nombre + (m.activo ? '' : ' (de baja)'),
        `${m.movimientos} ${m.movimientos === 1 ? 'salida' : 'salidas'}` +
        (m.sin_costo > 0 ? ` · ${m.sin_costo} sin poder valorizar` : ''),
        numero(m.valorizado)]),
      ['Total', '', numero(t.valorizado)],
      [],
      [],
      ['¿Qué se fue?'],
      ['Producto', 'Detalle', 'Cuánto costó'],
      ...datos.productos.map(p => [p.nombre,
        `${p.cantidad}${p.unidad_medida ? ' ' + p.unidad_medida : ''}` +
        (p.costo_referencia === null ? ' · sin costo cargado' : ` · a ${p.costo_referencia} cada uno`),
        p.costo_referencia === null ? 'No se sabe' : numero(p.valorizado)]),
      ['Total', '', numero(t.valorizado)]
    ],
    bloques: [
      {
        titulo: '¿Por qué se fue?',
        columnas: [
          { titulo: 'Motivo', ancho: 0.52 },
          { titulo: 'Salidas', ancho: 0.20, align: 'right' },
          { titulo: 'Cuánto costó', ancho: 0.28, align: 'right' }
        ],
        filas: datos.motivos.map(m => [
          m.nombre + (m.activo ? '' : ' (de baja)'),
          String(m.movimientos) + (m.sin_costo > 0 ? ` (${m.sin_costo} sin valorizar)` : ''),
          { texto: plata(m.valorizado), color: ROJO }
        ]),
        vacio: 'No se perdió nada en este período.'
      },
      {
        titulo: '¿Qué se fue?',
        columnas: [
          { titulo: 'Producto', ancho: 0.46 },
          { titulo: 'Cantidad', ancho: 0.26, align: 'right' },
          { titulo: 'Cuánto costó', ancho: 0.28, align: 'right' }
        ],
        filas: datos.productos.map(p => [
          p.nombre,
          `${p.cantidad}${p.unidad_medida ? ' ' + p.unidad_medida : ''}`,
          p.costo_referencia === null
            ? { texto: 'No se sabe', color: GRIS }
            : { texto: plata(p.valorizado), color: ROJO }
        ]),
        vacio: '—'
      }
    ]
  }
}
