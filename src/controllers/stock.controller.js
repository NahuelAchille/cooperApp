const stockModel = require('../models/stock.model')
const productoModel = require('../models/producto.model')
const motivoStockModel = require('../models/motivo-stock.model')
const movimientoModel = require('../models/movimiento.model')
const categoriaModel = require('../models/categoria.model')
const { validarFechaDeCarga, parsearFecha, aFechaISO } = require('../services/fecha.service')
const { leerDecimal, TOPE_12_2, TOPE_14_2 } = require('../services/validacion.service')
const { conUnidad, formatearPlata } = require('../services/formato.service')
const { esEntera } = require('../config/unidades-medida')

// Lo que se cuenta (unidades, cajas, paquetes, bolsas) va en números enteros
// (revisión funcional, 14/11/2026: se había vendido "1,5 unidades").
const cantidadQueNoSeCuenta = (cantidad, producto) =>
  esEntera(producto.unidad_medida) && !Number.isInteger(cantidad)
    ? `${producto.nombre} se cuenta por ${producto.unidad_medida === 'unidad' ? 'unidades' : producto.unidad_medida + 's'}: escribí un número entero.`
    : null

// Valida una cantidad de mercaderia. Devuelve { valor } o { error }.
//
// Redondea ANTES de comparar contra cero, no despues: si no, un 0,001 pasa el
// control de "mayor que cero" y se guarda como 0,00, dejando un movimiento que
// no mueve nada. Es el mismo error que hubo con los montos de movimientos.
const parsearCantidad = (valor) => {

  const leido = leerDecimal(valor)
  if (leido.vacio) return { error: 'La cantidad es obligatoria' }
  if (leido.noEsNumero) return { error: 'La cantidad tiene que ser un número' }
  if (leido.valor <= 0) return { error: 'La cantidad tiene que ser mayor que cero' }
  if (leido.valor > TOPE_12_2) return { error: 'La cantidad es demasiado grande' }
  return { valor: leido.valor }
}


// Valida el monto del movimiento de dinero. Devuelve { valor } o { error }.
// Mismo criterio que en movimientos: redondea antes de comparar contra cero.
// "El" cambia las palabras del mensaje: la venta lo usa para el precio.
// "tope" es lo maximo que entra en la columna donde va a terminar el numero.
const parsearMonto = (valor, El = 'El monto', tope = TOPE_14_2) => {
  const leido = leerDecimal(valor)
  // Un booleano cuenta como "no vino": es lo que manda un formulario roto.
  if (leido.vacio || typeof valor === 'boolean') return { error: `${El} es obligatorio` }
  if (leido.noEsNumero) return { error: `${El} tiene que ser un número` }
  if (leido.valor <= 0) return { error: `${El} tiene que ser mayor que cero` }
  if (leido.valor > tope) return { error: `${El} es demasiado grande` }
  return { valor: leido.valor }
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
      limite: Number.isInteger(Number(req.query.limit)) && Number(req.query.limit) > 0
        ? Number(req.query.limit)
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
    // Un servicio se presta, no se guarda: no tiene existencia que sumar ni
    // restar. Comparte la tabla con los productos, asi que el id existe y la
    // empresa da bien -- lo unico que lo frena es este control. La pantalla
    // de stock tampoco lo ofrece, pero el pedido se puede armar a mano.
    if (producto.es_servicio) {
      return res.status(400).json({ error: 'Los servicios no llevan stock: no se les pueden cargar entradas ni salidas' })
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
      return res.status(400).json({ error: 'Ese motivo está dado de baja: elegí uno activo' })
    }

    // Las ventas y las compras van por su propio camino, que carga la
    // mercaderia y la plata juntas. Por aca quedaban a medias ("Sin registrar
    // el cobro"). La pantalla ya no las ofrecia, pero el pedido se puede armar
    // a mano: la regla tiene que estar en el servidor (QA venta-compra, B3).
    // Se reconocen por lo que hacen, igual que alla, no por el nombre.
    const clase = ['venta', 'compra'].find(c => esMotivoDe(c)(motivo))
    if (clase) {
      return res.status(400).json({
        error: `"${motivo.nombre}" es un motivo ${OPERACIONES[clase].de}: se registra con el botón "Registrar una ${clase}", que carga la mercadería y ${OPERACIONES[clase].laPlata} juntos.`
      })
    }

    const cantidad = parsearCantidad(req.body.cantidad)
    if (cantidad.error) {
      return res.status(400).json({ error: cantidad.error })
    }
    const noSeCuenta = cantidadQueNoSeCuenta(cantidad.valor, producto)
    if (noSeCuenta) {
      return res.status(400).json({ error: noSeCuenta, campo: 'cantidad' })
    }

    const revision = validarFechaDeCarga(req.body.fecha)
    if (revision.error) {
      return res.status(400).json({ error: revision.error })
    }

    // Un detalle demasiado largo se avisa, no se corta en silencio: es lo que
    // el modo estricto de la base vino a evitar (revisión de código, 14/11/2026).
    const descripcion = typeof req.body.descripcion === 'string'
      ? req.body.descripcion.trim() || null
      : null
    if (descripcion && descripcion.length > 255) {
      return res.status(400).json({ error: 'El detalle es muy largo: puede tener hasta 255 caracteres.', campo: 'descripcion' })
    }

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
            error: `No alcanza: hay ${conUnidad(disponible, producto.unidad_medida)} y estás sacando ${conUnidad(cantidad.valor, producto.unidad_medida)}. ` +
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

    // Antes, si el motivo movia plata, aca se le proponia a la pantalla cargar
    // el movimiento de dinero en un segundo paso. Ya no hace falta: los unicos
    // motivos que mueven plata son los de venta y compra (entrada + ingreso y
    // salida + egreso no se pueden guardar), y esos rebotan arriba.
    res.status(201).json({
      id_movimiento_stock,
      existencia,
      message: `${motivo.efecto_stock === 'entrada' ? 'Entrada' : 'Salida'} registrada. De ${producto.nombre} hay ahora ${conUnidad(existencia, producto.unidad_medida)}.`
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al registrar el movimiento de stock' })
  }
}


// VENTA y COMPRA en un solo paso. Son la misma operacion espejada: una saca
// mercaderia y trae plata, la otra trae mercaderia y se lleva plata. Por eso
// van por UNA sola funcion y las diferencias viven en esta tabla: escritas dos
// veces, cada arreglo habria que hacerlo dos veces, y el dia que uno se olvide
// las dos se comportarian distinto sin que nadie lo decida.
//
// Que motivo es una venta o una compra se reconoce por lo que HACE, no por el
// nombre: cada empresa nombra los suyos como quiere.
const OPERACIONES = {
  venta: {
    efecto_stock: 'salida',
    efecto_dinero: 'ingreso',
    la: 'la venta',
    Laoperacion: 'Venta',
    de: 'de venta',
    loQueHace: 'saque mercadería y genere un ingreso',
    categorias: 'ingresos',
    las: 'las ventas',
    Las: 'Las ventas',
    laPlata: 'su cobro',
    queEra: 'cobro',
    La: 'La venta',
    una: 'una venta',
    noSePuede: 'no se puede vender',
    Precio: 'El precio'
  },
  compra: {
    efecto_stock: 'entrada',
    efecto_dinero: 'egreso',
    la: 'la compra',
    Laoperacion: 'Compra',
    de: 'de compra',
    loQueHace: 'sume mercadería y genere un egreso',
    categorias: 'egresos',
    las: 'las compras',
    Las: 'Las compras',
    laPlata: 'su pago',
    queEra: 'pago',
    La: 'La compra',
    una: 'una compra',
    noSePuede: 'no se puede comprar',
    Precio: 'El costo'
  }
}

const esMotivoDe = (clase) => (motivo) =>
  motivo.efecto_stock === OPERACIONES[clase].efecto_stock &&
  motivo.efecto_dinero === OPERACIONES[clase].efecto_dinero

// Registrar una venta o una compra en un solo paso: el movimiento de stock y
// el de dinero, juntos y atados.
//
// Antes eran dos formularios y dos clasificaciones: en Stock se elegia el
// motivo, y despues se abria otro cartel que pedia la categoria y el tipo del
// dinero, y el total calculado de cabeza. Para el operador el segundo paso ni
// aparecia, y la operacion quedaba a medias hasta que alguien de finanzas la
// completara. Al usarlo el grupo, era lo que trababa.
//
// Ahora la persona dice QUE, CUANTO y A CUANTO. Lo demas ya esta decidido:
//   - el motivo: el de la empresa (si tiene uno solo, ni se pregunta)
//   - la categoria del dinero: la que el motivo tiene configurada (id_tipo)
//   - el total: cantidad por precio, calculado aca y no en la pantalla
//
// El operador SI registra la plata de sus ventas y de sus compras (decision
// del grupo, 25/10 y 26/10/2026): es el que esta en el mostrador y el que
// recibe al proveedor. Sigue sin entrar a Movimientos ni ver el balance; lo
// unico que puede hacer con la plata es esto.
// Anula un movimiento de stock y, en el mismo paso, la plata atada (decision
// del grupo, 02/11/2026). Se usa adentro del candado del producto: al anular
// desde el historial y al corregir una venta o una compra (UX F-08).
//
// Vuelve a mirar el movimiento ADENTRO del candado (FOR UPDATE): otro pedido
// pudo anularlo, o alguien de finanzas pudo estar atandole el cobro justo
// ahora. "controlar" es una regla extra que se mira antes de anular; si
// devuelve un texto, no se anula nada y ese es el error.
const anularConSuPlata = async (id_movimiento_stock, id_empresa, conexion, controlar) => {

  const [[actual]] = await conexion.query(`
    SELECT ms.anulado, ms.id_movimiento, m.monto, m.anulado AS dinero_anulado
    FROM movimientos_stock ms
    LEFT JOIN movimientos m ON m.id_movimiento = ms.id_movimiento
    WHERE ms.id_movimiento_stock = ? AND ms.id_empresa = ?
    FOR UPDATE
  `, [id_movimiento_stock, id_empresa])

  if (!actual || actual.anulado) {
    return { error: 'Ese movimiento ya estaba anulado' }
  }

  const problema = controlar ? controlar() : null
  if (problema) return { error: problema }

  await stockModel.anularMovimiento(id_movimiento_stock, id_empresa, conexion)

  let dineroAnulado = null
  if (actual.id_movimiento && !actual.dinero_anulado) {
    await movimientoModel.anular(actual.id_movimiento, id_empresa, conexion)
    dineroAnulado = Number(actual.monto)
  }

  return { dineroAnulado }
}

const registrarOperacion = async (clase, req, res) => {

  const op = OPERACIONES[clase]

  try {
    const id_empresa = req.session.user.empresa.id
    const id_usuario = req.session.user.id
    const esAdmin = req.session.user.rol === 'admin_empresa'

    const producto = await productoModel.findProductoById(req.body.id_producto, id_empresa)
    if (!producto) {
      return res.status(404).json({ error: 'No se encontró el producto' })
    }
    if (producto.es_servicio) {
      return res.status(400).json({ error: `Los servicios no pasan por el stock: ${op.laPlata} se registra desde Movimientos` })
    }
    if (!producto.activo) {
      return res.status(400).json({ error: `Ese producto está dado de baja: ${op.noSePuede}` })
    }

    // --- Corregir una venta o una compra ya cargada (UX F-08) ---
    //
    // Con "reemplaza", la operación vieja (con su plata) se anula y la nueva se
    // carga EN EL MISMO PASO. Antes el operador que tipeaba mal un precio tenía
    // que anular y volver a cargar de memoria. Tiene que ser del mismo producto:
    // si el producto estaba mal, es otra venta, no una corrección.
    let original = null
    if (req.body.reemplaza !== undefined && req.body.reemplaza !== null && req.body.reemplaza !== '') {
      original = await stockModel.findMovimientoById(req.body.reemplaza, id_empresa)
      if (!original || original.anulado) {
        return res.status(400).json({ error: `${op.La} que querés corregir no existe o ya estaba anulada` })
      }
      if (!esMotivoDe(clase)(original)) {
        return res.status(400).json({ error: `Ese movimiento no es ${op.una}` })
      }
      if (original.id_producto !== producto.id_producto) {
        return res.status(400).json({
          error: `Para cambiar el producto, anulá ${op.la} desde el historial y cargala de nuevo`
        })
      }
    }

    // --- El motivo: si la empresa tiene uno solo de esta clase, se usa ese ---
    const candidatos = (await motivoStockModel.findMotivos(id_empresa, { soloActivos: true })).filter(esMotivoDe(clase))

    let motivo
    if (req.body.id_motivo_stock) {
      motivo = candidatos.find(m => String(m.id_motivo_stock) === String(req.body.id_motivo_stock))
      if (!motivo) {
        return res.status(400).json({ error: `Ese motivo no es una ${clase} activa de tu empresa` })
      }
    } else if (candidatos.length === 1) {
      motivo = candidatos[0]
    } else if (candidatos.length === 0) {
      return res.status(400).json({
        error: esAdmin
          ? `Tu empresa no tiene ningún motivo ${op.de} activo. Crealo en Configuración › Motivos de stock: uno que ${op.loQueHace}.`
          : `Tu empresa no tiene ningún motivo ${op.de} activo. Pedile al administrador que lo cree.`
      })
    } else {
      return res.status(400).json({ error: `Elegí qué tipo ${op.de} es` })
    }

    // --- Dónde cae la plata: lo dice el motivo, no la persona ---
    //
    // Se vuelve a mirar el tipo entero, no solo que este cargado: entre que el
    // admin lo configuro y hoy, la categoria pudo darse de baja.
    const tipo = motivo.id_tipo ? await categoriaModel.findTipoById(motivo.id_tipo, id_empresa) : null

    // Si está elegida pero dada de baja, se dice eso: "falta decir" mandaba a
    // buscar algo que ya estaba hecho (QA venta-compra, B4). Mismas palabras
    // que la pantalla de Motivos.
    if (tipo && tipo.naturaleza === op.efecto_dinero && (!tipo.activo || !tipo.categoria_activa)) {
      const destino = `${tipo.categoria_nombre} › ${tipo.nombre}`
      return res.status(400).json({
        error: esAdmin
          ? `${op.Las} de "${motivo.nombre}" van a ${destino}, que está dada de baja. Reactivala, o elegí otra categoría en Configuración › Motivos de stock.`
          : `${op.Las} de "${motivo.nombre}" van a ${destino}, que está dada de baja. Pedile al administrador que lo arregle en Motivos de stock.`
      })
    }

    if (!tipo || tipo.naturaleza !== op.efecto_dinero) {
      return res.status(400).json({
        error: esAdmin
          ? `Falta decir en qué categoría de ${op.categorias} van ${op.las} de "${motivo.nombre}". Elegila en Configuración › Motivos de stock y volvé a intentar.`
          : `Falta configurar en qué categoría van ${op.las} de "${motivo.nombre}". Pedile al administrador que lo complete en Motivos de stock.`
      })
    }

    const cantidad = parsearCantidad(req.body.cantidad)
    if (cantidad.error) {
      return res.status(400).json({ error: cantidad.error })
    }
    const noSeCuenta = cantidadQueNoSeCuenta(cantidad.valor, producto)
    if (noSeCuenta) {
      return res.status(400).json({ error: noSeCuenta, campo: 'cantidad' })
    }

    // El precio por unidad tiene el mismo tope que el precio de venta y el
    // costo del producto, DECIMAL(12,2): en la compra puede terminar guardado
    // como costo. Con el tope del monto (DECIMAL(14,2)) pasaba este control y
    // reventaba al guardar el costo, con un "Error al registrar la compra"
    // que no decia que pasaba (QA venta-compra, B2).
    const precio = parsearMonto(req.body.precio_unitario, op.Precio, 9999999999.99)
    if (precio.error) {
      return res.status(400).json({ error: precio.error })
    }

    // El total se calcula en centavos y con enteros, como en los reportes:
    // con la cuenta comun, 0,1 por 3 da 0,30000000000000004.
    const centavos = Math.round(Math.round(cantidad.valor * 100) * Math.round(precio.valor * 100) / 100)
    if (centavos <= 0) {
      return res.status(400).json({ error: `El total de ${op.la} da $ 0: revisá la cantidad y el precio` })
    }
    if (centavos > 99999999999999) {  // no entra en DECIMAL(14,2)
      return res.status(400).json({ error: `El total de ${op.la} es demasiado grande` })
    }
    const total = centavos / 100

    const revision = validarFechaDeCarga(req.body.fecha)
    if (revision.error) {
      return res.status(400).json({ error: revision.error })
    }

    const detalle = typeof req.body.descripcion === 'string'
      ? req.body.descripcion.trim().slice(0, 200) || null
      : null

    // El movimiento de dinero cuenta qué se vendió o compró, para que en
    // Movimientos se entienda sin ir a buscar al stock. El detalle (el cliente,
    // el proveedor, el remito) va a continuación.
    // Si con el nombre del producto y el detalle se pasa de los 255 de la
    // columna, se corta con "…" para que se note (el detalle completo queda
    // en el movimiento de stock).
    const descripcionCompleta = `${motivo.nombre}: ${conUnidad(cantidad.valor, producto.unidad_medida)} de ${producto.nombre}` +
                                (detalle ? ` · ${detalle}` : '')
    const descripcionDinero = descripcionCompleta.length > 255 ? descripcionCompleta.slice(0, 254) + '…' : descripcionCompleta

    // Todo adentro del candado del producto: el control del stock, el dinero
    // y la mercaderia. O entran los dos movimientos o no entra ninguno: nunca
    // queda una venta con el stock descontado y la plata sin cargar.
    const resultado = await stockModel.conProductoTrabado(
      producto.id_producto, id_empresa,
      async (disponibleAntes, conexion) => {

        // Si corrige otra, primero se anula la vieja (con su plata), y lo que
        // hay disponible es como si nunca se hubiera cargado.
        let disponible = disponibleAntes
        let dineroAnulado = null
        if (original) {
          const anulado = await anularConSuPlata(original.id_movimiento_stock, id_empresa, conexion)
          if (anulado.error) return { error: `${op.La} que querés corregir ya estaba anulada` }
          dineroAnulado = anulado.dineroAnulado
          const cantidadVieja = Number(original.cantidad)
          disponible = op.efecto_stock === 'salida' ? disponible + cantidadVieja : disponible - cantidadVieja

          // Una compra con menos cantidad puede dejar el stock en negativo si
          // de lo que entró ya se vendió una parte.
          if (op.efecto_stock === 'entrada' && disponible + cantidad.valor < 0) {
            return {
              error: `No se puede corregir así: de esta compra ya salieron ${conUnidad(-disponible, producto.unidad_medida)}, ` +
                     `y con ${conUnidad(cantidad.valor, producto.unidad_medida)} el stock quedaría en negativo.`
            }
          }
        }

        // Una compra suma: no hay nada que pueda faltar.
        if (op.efecto_stock === 'salida' && cantidad.valor > disponible) {
          return {
            error: `No alcanza: hay ${conUnidad(disponible, producto.unidad_medida)} y estás vendiendo ${conUnidad(cantidad.valor, producto.unidad_medida)}. ` +
                   'Si el sistema todavía no tiene la existencia real, cargala con un movimiento de "Ajuste positivo".'
          }
        }

        // Sólo en la compra: lo que se pagó por unidad pasa a ser el costo del
        // producto (el que valoriza las pérdidas), si la persona lo deja tildado
        // y si de verdad cambió. Con inflacion, es la forma de que el costo no
        // quede viejo sin que nadie tenga que acordarse de editarlo. Si el valor
        // es el mismo no se toca, para no rejuvenecer la fecha del costo.
        //
        // El costo se lee ACA, con el producto trabado, y no al principio: dos
        // compras simultaneas leian el mismo costo viejo, y la que entraba
        // segunda creia que su precio ya estaba guardado y no lo guardaba.
        const actualizarCosto = clase === 'compra' &&
                                req.body.actualizar_costo === true &&
                                await productoModel.costoActual(producto.id_producto, id_empresa, conexion) !== precio.valor

        if (actualizarCosto) {
          await productoModel.actualizarCosto(producto.id_producto, id_empresa, precio.valor, conexion)
        }

        const id_movimiento = await movimientoModel.create({
          id_tipo: tipo.id_tipo,
          monto: total,
          descripcion: descripcionDinero,
          fecha: revision.fecha,
          id_empresa,
          id_usuario
        }, conexion)

        const id_movimiento_stock = await stockModel.createMovimiento({
          id_producto: producto.id_producto,
          id_motivo_stock: motivo.id_motivo_stock,
          cantidad: cantidad.valor,
          descripcion: detalle,
          fecha: revision.fecha,
          id_empresa,
          id_usuario,
          id_movimiento
        }, conexion)

        return { id_movimiento_stock, id_movimiento, actualizarCosto, dineroAnulado }
      }
    )

    if (resultado.error) {
      return res.status(400).json({ error: resultado.error })
    }

    const { id_movimiento_stock, id_movimiento, existencia, actualizarCosto, dineroAnulado } = resultado

    const comoQueda = op.efecto_stock === 'salida'
      ? `Quedan ${conUnidad(existencia, producto.unidad_medida)}.`
      : `Ahora hay ${conUnidad(existencia, producto.unidad_medida)}.`
    const avisoCosto = actualizarCosto
      ? ` El costo del producto pasó a ${formatearPlata(precio.valor)}.`
      : ''

    res.status(201).json({
      id_movimiento_stock,
      id_movimiento,
      existencia,
      total,
      costoActualizado: actualizarCosto,
      message: `${op.Laoperacion} ${original ? 'corregida' : 'registrada'}: ${conUnidad(cantidad.valor, producto.unidad_medida)} de ${producto.nombre} por ${formatearPlata(total)}. ` +
               comoQueda + avisoCosto +
               (original
                 ? ` La anterior quedó anulada${dineroAnulado !== null ? `, con su ${op.queEra} de ${formatearPlata(dineroAnulado)}` : ''}.`
                 : '')
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: `Error al registrar ${op.la}` })
  }
}

exports.registrarVenta  = (req, res) => registrarOperacion('venta', req, res)
exports.registrarCompra = (req, res) => registrarOperacion('compra', req, res)

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
      return res.status(400).json({ error: 'Ese tipo de movimiento está dado de baja: elegí uno activo' })
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
      ? req.body.descripcion.trim() || null
      : null
    if (descripcion && descripcion.length > 255) {
      return res.status(400).json({ error: 'La descripción es muy larga: puede tener hasta 255 caracteres.' })
    }

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

        // Se vuelve a mirar ADENTRO del candado (anularConSuPlata): entre la
        // consulta de arriba y este momento, otro pedido pudo haberlo anulado.
        // Sin esto, dos anulaciones simultaneas contestaban las dos
        // "movimiento anulado", como si cada una hubiera hecho el trabajo.
        //
        // La plata atada se anula EN EL MISMO PASO (decision del grupo,
        // 02/11/2026, por el hallazgo C1 de QA). Antes no se tocaba, con dos
        // razones que dejaron de valer cuando la venta y la compra pasaron a
        // hacerse en un paso:
        //   - "el cobro pudo ser real aunque la mercaderia se cargo mal": no,
        //     el monto sale de cantidad por precio, asi que si la cantidad
        //     estaba mal, la plata tambien. Y la unica forma de volver a cargar
        //     la venta es el formulario nuevo, que crea su propia plata: dejar
        //     viva la vieja la cuenta dos veces, siempre.
        //   - "el operador no toca finanzas": ahora crea la plata de sus ventas
        //     y compras, y no podia deshacerla. Quedaba inflando el balance sin
        //     que nadie se enterara.
        // Una venta es una sola cosa: si no paso, no paso ni la mercaderia ni
        // la plata. Anular la plata sola desde Movimientos sigue igual.
        const cantidad = Number(movimiento.cantidad)
        return anularConSuPlata(id, id_empresa, conexion, () =>
          movimiento.efecto_stock === 'entrada' && cantidad > disponible
            ? `No se puede anular: esta entrada sumó ${conUnidad(cantidad, movimiento.unidad_medida)} y hoy quedan ${conUnidad(disponible, movimiento.unidad_medida)}. ` +
              'Anularlo dejaría el stock en negativo, así que primero hay que anular las salidas que se cargaron después.'
            : null
        )
      }
    )

    if (resultado.error) {
      return res.status(400).json({ error: resultado.error })
    }

    const { existencia, dineroAnulado } = resultado

    const queEra = movimiento.efecto_dinero === 'ingreso' ? 'cobro' : 'pago'
    const avisoDinero = dineroAnulado !== null
      ? ` También se anuló su ${queEra} de ${formatearPlata(dineroAnulado)}.`
      : ''

    res.json({
      existencia,
      message: `${movimiento.efecto_stock === 'entrada' ? 'Entrada anulada' : 'Salida anulada'}. De ${movimiento.producto_nombre} hay ahora ${conUnidad(existencia, movimiento.unidad_medida)}.${avisoDinero}`
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al anular el movimiento de stock' })
  }
}
