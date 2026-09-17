const stockModel = require('../models/stock.model')
const productoModel = require('../models/producto.model')
const motivoStockModel = require('../models/motivo-stock.model')
const movimientoModel = require('../models/movimiento.model')
const categoriaModel = require('../models/categoria.model')
const { validarFechaDeCarga, parsearFecha, aFechaISO } = require('../services/fecha.service')

// Valida una cantidad de mercaderia. Devuelve { valor } o { error }.
//
// Redondea ANTES de comparar contra cero, no despues: si no, un 0,001 pasa el
// control de "mayor que cero" y se guarda como 0,00, dejando un movimiento que
// no mueve nada. Es el mismo error que hubo con los montos de movimientos.
const parsearCantidad = (valor) => {

  if (valor === undefined || valor === null || valor === '') {
    return { error: 'La cantidad es obligatoria' }
  }

  // Un booleano se convierte en 1 o en 0, asi que hay que descartarlo antes.
  if (typeof valor === 'boolean') {
    return { error: 'La cantidad tiene que ser un número' }
  }

  const numero = Number(valor)
  if (!Number.isFinite(numero)) {
    return { error: 'La cantidad tiene que ser un número' }
  }

  const redondeado = Math.round(numero * 100) / 100
  if (redondeado <= 0) {
    return { error: 'La cantidad tiene que ser mayor que cero' }
  }
  if (redondeado > 9999999999.99) {  // no entra en DECIMAL(12,2)
    return { error: 'La cantidad es demasiado grande' }
  }

  return { valor: redondeado }
}

// Formatea una cantidad para los mensajes: 5 en vez de 5.00, pero 2,5 entero.
const formatearCantidad = (numero) => {
  return Number.isInteger(numero) ? String(numero) : String(numero).replace('.', ',')
}

// Valida el monto del movimiento de dinero. Devuelve { valor } o { error }.
// Mismo criterio que en movimientos: redondea antes de comparar contra cero.
const parsearMonto = (valor) => {

  if (valor === undefined || valor === null || valor === '' || typeof valor === 'boolean') {
    return { error: 'El monto es obligatorio' }
  }

  const numero = Number(valor)
  if (!Number.isFinite(numero)) {
    return { error: 'El monto tiene que ser un número' }
  }

  const redondeado = Math.round(numero * 100) / 100
  if (redondeado <= 0) {
    return { error: 'El monto tiene que ser mayor que cero' }
  }
  if (redondeado > 999999999999.99) {  // no entra en DECIMAL(14,2)
    return { error: 'El monto es demasiado grande' }
  }

  return { valor: redondeado }
}

// Existencias de todos los productos, con su stock calculado.
exports.getExistencias = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id

    const filtros = {
      soloActivos: req.query.estado !== 'todos',   // por defecto, solo los activos
      id_categoria_producto: Number(req.query.id_categoria_producto) || undefined,
      busqueda: typeof req.query.busqueda === 'string' ? req.query.busqueda.trim().slice(0, 120) : ''
    }

    const existencias = await stockModel.findExistencias(id_empresa, filtros)
    res.json(existencias)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener las existencias' })
  }
}

// Historial de movimientos de stock.
exports.getMovimientos = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id

    // Filtros del historial (HU-43). Las fechas pasan por parsearFecha: si no
    // son un dia real del calendario se ignora el filtro, en vez de mandarle
    // a la consulta algo que no es una fecha.
    const filtros = {
      id_producto: Number(req.query.id_producto) || undefined,
      id_motivo_stock: Number(req.query.id_motivo_stock) || undefined,
      efecto_stock: ['entrada', 'salida'].includes(req.query.efecto_stock) ? req.query.efecto_stock : undefined,
      desde: parsearFecha(req.query.desde) || undefined,
      hasta: parsearFecha(req.query.hasta) || undefined,
      limite: Number.isInteger(Number(req.query.limite)) && Number(req.query.limite) > 0
        ? Number(req.query.limite)
        : undefined
    }

    const movimientos = await stockModel.findMovimientos(id_empresa, filtros)
    res.json(movimientos)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los movimientos de stock' })
  }
}

exports.registrarMovimiento = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const id_usuario = req.session.user.id

    // --- El producto tiene que ser de esta empresa y estar activo ---
    const producto = await productoModel.findProductoById(req.body.id_producto, id_empresa)
    if (!producto) {
      return res.status(404).json({ error: 'No se encontró el producto' })
    }
    if (!producto.activo) {
      return res.status(400).json({ error: 'Ese producto está dado de baja: no se le pueden cargar movimientos' })
    }

    // --- El motivo tambien, y tiene que estar activo ---
    const motivo = await motivoStockModel.findMotivoById(req.body.id_motivo_stock, id_empresa)
    if (!motivo) {
      return res.status(404).json({ error: 'No se encontró el motivo' })
    }
    if (!motivo.activo) {
      return res.status(400).json({ error: 'Ese motivo está desactivado: elegí uno activo' })
    }

    const cantidad = parsearCantidad(req.body.cantidad)
    if (cantidad.error) {
      return res.status(400).json({ error: cantidad.error })
    }

    const revision = validarFechaDeCarga(req.body.fecha)
    if (revision.error) {
      return res.status(400).json({ error: revision.error })
    }

    const descripcion = typeof req.body.descripcion === 'string'
      ? req.body.descripcion.trim().slice(0, 255) || null
      : null

    // --- Una salida no puede dejar el stock en negativo ---
    //
    // El stock negativo no existe en un deposito: si el sistema lo permite,
    // el numero deja de significar algo y nadie se entera de donde vino el
    // error. El mensaje dice cuanto hay y como cargar lo que falta, porque el
    // caso tipico es una empresa que todavia no cargo su existencia inicial.
    //
    // El control y el alta van JUNTOS, con la fila del producto trabada: si no,
    // dos ventas simultaneas del mismo producto leen las dos la misma
    // existencia, pasan las dos y el stock termina en negativo.
    const resultado = await stockModel.conProductoTrabado(
      producto.id_producto, id_empresa,
      async (disponible, conexion) => {

        if (motivo.efecto_stock === 'salida' && cantidad.valor > disponible) {
          return {
            error: `No hay stock suficiente: hay ${formatearCantidad(disponible)} y estás sacando ${formatearCantidad(cantidad.valor)}. ` +
                   'Si el sistema todavía no tiene la existencia real, cargala con un movimiento de "Ajuste positivo".'
          }
        }

        const id_movimiento_stock = await stockModel.createMovimiento({
          id_producto: producto.id_producto,
          id_motivo_stock: motivo.id_motivo_stock,
          cantidad: cantidad.valor,
          descripcion,
          fecha: revision.fecha,
          id_empresa,
          id_usuario
        }, conexion)

        return { id_movimiento_stock }
      }
    )

    if (resultado.error) {
      return res.status(400).json({ error: resultado.error })
    }

    // La existencia ya viene recalculada adentro de la transaccion, asi la
    // pantalla muestra como quedo el producto sin volver a pedir el listado.
    const { id_movimiento_stock, existencia } = resultado

    // Si el motivo mueve plata, se le ofrece a la pantalla registrar tambien
    // el movimiento de dinero, con lo que ya se sabe. NO se crea solo: la
    // persona decide, porque el sistema no conoce el monto (no hay precios
    // cargados) y porque una venta puede haberse cobrado de otra manera.
    //
    // Solo se ofrece a quien despues va a poder confirmarlo. Al operador no
    // tiene sentido proponerselo: no maneja la plata y se comeria un rechazo.
    const propuesta = (motivo.efecto_dinero !== 'ninguno' && puedeCargarDinero(req.session.user))
      ? {
          naturaleza: motivo.efecto_dinero,
          fecha: revision.fecha,
          descripcion: `${motivo.nombre}: ${formatearCantidad(cantidad.valor)} ${producto.unidad_medida} de ${producto.nombre}`
        }
      : null

    res.status(201).json({
      id_movimiento_stock,
      existencia,
      propuesta,
      message: `Movimiento registrado. ${producto.nombre} queda en ${formatearCantidad(existencia)}.`
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al registrar el movimiento de stock' })
  }
}

// Quien puede cargar movimientos de dinero. Mismo criterio que las rutas de
// /movimientos: el operador queda afuera.
const puedeCargarDinero = (user) => ['admin_empresa', 'tesorero'].includes(user.rol)

// HU-45 · Registrar el movimiento de dinero que corresponde a un movimiento de
// stock ya cargado, y dejar los dos atados.
exports.registrarMovimientoDinero = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const id_usuario = req.session.user.id
    const { id } = req.params

    const movimiento = await stockModel.findMovimientoById(id, id_empresa)
    if (!movimiento) {
      return res.status(404).json({ error: 'No se encontró el movimiento de stock' })
    }
    if (movimiento.anulado) {
      return res.status(400).json({ error: 'Ese movimiento de stock está anulado' })
    }
    if (movimiento.efecto_dinero === 'ninguno') {
      return res.status(400).json({ error: `El motivo "${movimiento.motivo_nombre}" no mueve dinero` })
    }

    // El control de "ya tiene su movimiento de dinero" NO se hace aca: se hace
    // adentro de la transaccion, con la fila trabada (ver el modelo). Aca
    // pasaba de a un pedido por vez, pero con dos pedidos juntos los dos veian
    // el campo vacio y los dos creaban su movimiento.

    // El tipo tiene que ser de la empresa, estar activo, y su naturaleza tiene
    // que coincidir con lo que dice el motivo: si el motivo genera un ingreso,
    // no se puede cargar como egreso.
    const tipo = await categoriaModel.findTipoById(req.body.id_tipo, id_empresa)
    if (!tipo) {
      return res.status(404).json({ error: 'No se encontró el tipo de movimiento' })
    }
    if (!tipo.activo || !tipo.categoria_activa) {
      return res.status(400).json({ error: 'Ese tipo de movimiento está desactivado: elegí uno activo' })
    }
    if (tipo.naturaleza !== movimiento.efecto_dinero) {
      return res.status(400).json({
        error: `El motivo "${movimiento.motivo_nombre}" genera un ${movimiento.efecto_dinero}, así que hay que elegir una categoría de ${movimiento.efecto_dinero}s`
      })
    }

    const monto = parsearMonto(req.body.monto)
    if (monto.error) {
      return res.status(400).json({ error: monto.error })
    }

    const descripcion = typeof req.body.descripcion === 'string'
      ? req.body.descripcion.trim().slice(0, 255) || null
      : null

    // El movimiento de dinero se fecha igual que el de stock: son el mismo
    // hecho contado dos veces, y con fechas distintas los reportes no cierran.
    //
    // Pasa por aFechaISO porque la base devuelve la fecha como objeto Date:
    // mandarla asi terminaba guardando 0000-00-00.
    const resultado = await stockModel.registrarDineroDeMovimiento(
      id, id_empresa,
      (conexion) => movimientoModel.create({
        id_tipo: tipo.id_tipo,
        monto: monto.valor,
        descripcion,
        fecha: aFechaISO(movimiento.fecha),
        id_empresa,
        id_usuario
      }, conexion)
    )

    if (resultado.error) {
      return res.status(400).json({ error: resultado.error })
    }

    res.status(201).json({
      id_movimiento: resultado.id_movimiento,
      message: `Movimiento de dinero registrado y vinculado al movimiento de stock`
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al registrar el movimiento de dinero' })
  }
}

// HU-46 · Anular un movimiento de stock cargado por error.
exports.anularMovimiento = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const { id } = req.params

    const movimiento = await stockModel.findMovimientoById(id, id_empresa)
    if (!movimiento) {
      return res.status(404).json({ error: 'No se encontró el movimiento de stock' })
    }
    if (movimiento.anulado) {
      return res.status(400).json({ error: 'Ese movimiento ya estaba anulado' })
    }

    // Anular una ENTRADA le saca mercaderia al producto, asi que puede dejar
    // el stock en negativo: si entraron 20 y ya se vendieron 15, anular la
    // entrada dejaria -15. Es la contracara de la regla del alta, y va con el
    // mismo candado: una anulacion y una venta al mismo tiempo se pisaban igual.
    const resultado = await stockModel.conProductoTrabado(
      movimiento.id_producto, id_empresa,
      async (disponible, conexion) => {

        // Se vuelve a mirar ADENTRO del candado: entre la consulta de arriba y
        // este momento, otro pedido pudo haberlo anulado. Sin esto, dos
        // anulaciones simultaneas contestaban las dos "movimiento anulado",
        // como si cada una hubiera hecho el trabajo.
        const [[actual]] = await conexion.query(
          'SELECT anulado FROM movimientos_stock WHERE id_movimiento_stock = ? AND id_empresa = ?',
          [id, id_empresa]
        )

        if (!actual || actual.anulado) {
          return { error: 'Ese movimiento ya estaba anulado' }
        }

        const cantidad = Number(movimiento.cantidad)

        if (movimiento.efecto_stock === 'entrada' && cantidad > disponible) {
          return {
            error: `No se puede anular: este movimiento sumó ${formatearCantidad(cantidad)} y hoy quedan ${formatearCantidad(disponible)}. ` +
                   'Anularlo dejaría el stock en negativo, así que primero hay que anular las salidas que se cargaron después.'
          }
        }

        await stockModel.anularMovimiento(id, id_empresa, conexion)
        return {}
      }
    )

    if (resultado.error) {
      return res.status(400).json({ error: resultado.error })
    }

    const { existencia } = resultado

    // El movimiento de dinero NO se anula solo: puede necesitar permisos que
    // esta persona no tiene (un operador no toca finanzas) y el cobro pudo
    // haber sido real aunque la mercaderia se haya cargado mal. Se avisa.
    // Solo se avisa si el movimiento de dinero sigue vigente: si ya estaba
    // anulado, no hay nada que dar de baja.
    const avisoDinero = (movimiento.id_movimiento && !movimiento.dinero_anulado)
      ? ' Ojo: este movimiento tenía un movimiento de dinero asociado, que sigue vigente. Si también hay que darlo de baja, se anula desde Movimientos.'
      : ''

    res.json({
      existencia,
      message: `Movimiento anulado. ${movimiento.producto_nombre} queda en ${formatearCantidad(existencia)}.${avisoDinero}`
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al anular el movimiento de stock' })
  }
}
