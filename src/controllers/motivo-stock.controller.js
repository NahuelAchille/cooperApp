const motivoStockModel = require('../models/motivo-stock.model')
const stockModel = require('../models/stock.model')
const categoriaModel = require('../models/categoria.model')

const EFECTOS_STOCK = ['entrada', 'salida']
const EFECTOS_DINERO = ['ingreso', 'egreso', 'ninguno']

// Normaliza un nombre libre: recorta espacios y valida que no quede vacio ni
// se pase del limite de la columna (80). Devuelve null si no sirve.
const limpiarNombre = (valor) => {
  if (typeof valor !== 'string') return null
  const limpio = valor.trim()
  if (!limpio || limpio.length > 80) return null
  return limpio
}

// Valida los dos impactos del motivo. Devuelve { efecto_stock, efecto_dinero }
// o { error }.
//
// La combinacion tambien se valida, no solo cada campo por separado: una
// entrada de mercaderia que genere un INGRESO de dinero no existe (si entra
// algo, o lo pagaste, o no hubo plata de por medio), y una salida que genere
// un EGRESO tampoco. Dejarlas pasar produce reportes que no cierran.
const validarEfectos = (body) => {

  const efecto_stock = body.efecto_stock
  if (!EFECTOS_STOCK.includes(efecto_stock)) {
    return { error: 'Elegí si el motivo suma o resta stock' }
  }

  const efecto_dinero = body.efecto_dinero || 'ninguno'
  if (!EFECTOS_DINERO.includes(efecto_dinero)) {
    return { error: 'Elegí qué hace el motivo con el dinero' }
  }

  if (efecto_stock === 'entrada' && efecto_dinero === 'ingreso') {
    return { error: 'Si entra mercadería, el dinero no puede ser un ingreso: será un egreso (la pagaste) o ninguno' }
  }
  if (efecto_stock === 'salida' && efecto_dinero === 'egreso') {
    return { error: 'Si sale mercadería, el dinero no puede ser un egreso: será un ingreso (la vendiste) o ninguno' }
  }

  return { efecto_stock, efecto_dinero }
}

// Valida en que tipo de dinero cae la plata del motivo. Devuelve { id_tipo }
// o { error }.
//
// Si el motivo no mueve plata, el tipo se FUERZA en null aunque venga uno: no
// hay plata que clasificar, y un tipo colgado ahi se leeria como que si.
//
// Es opcional tambien en los que mueven plata (un motivo recien creado puede
// no tenerlo todavia), pero si viene tiene que ser de esta empresa, estar
// activo y ser de la misma naturaleza: una Venta no puede caer en un egreso.
const validarTipo = async (body, efecto_dinero, id_empresa) => {

  if (efecto_dinero === 'ninguno') return { id_tipo: null }

  if (body.id_tipo === undefined || body.id_tipo === null || body.id_tipo === '') {
    return { id_tipo: null }
  }

  const tipo = await categoriaModel.findTipoById(body.id_tipo, id_empresa)
  if (!tipo) {
    return { error: 'No se encontró la categoría de dinero elegida' }
  }
  if (!tipo.activo || !tipo.categoria_activa) {
    return { error: 'Esa categoría de dinero está dada de baja: elegí una activa' }
  }
  if (tipo.naturaleza !== efecto_dinero) {
    return { error: `Este motivo genera un ${efecto_dinero}, así que su plata tiene que ir a una categoría de ${efecto_dinero}s` }
  }

  return { id_tipo: tipo.id_tipo }
}

exports.getMotivos = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const soloActivos = req.query.soloActivos === 'true'

    const motivos = await motivoStockModel.findMotivos(id_empresa, { soloActivos })
    res.json(motivos)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los motivos' })
  }
}

exports.crearMotivo = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id

    const nombre = limpiarNombre(req.body.nombre)
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del motivo es obligatorio (máximo 80 caracteres)' })
    }

    const efectos = validarEfectos(req.body)
    if (efectos.error) {
      return res.status(400).json({ error: efectos.error })
    }

    const tipo = await validarTipo(req.body, efectos.efecto_dinero, id_empresa)
    if (tipo.error) {
      return res.status(400).json({ error: tipo.error })
    }

    const id_motivo_stock = await motivoStockModel.createMotivo({ nombre, ...efectos, ...tipo, id_empresa })
    res.status(201).json({ id_motivo_stock, message: 'Motivo creado correctamente' })

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un motivo con ese nombre en tu empresa' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al crear el motivo' })
  }
}

exports.actualizarMotivo = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const { id } = req.params

    const motivo = await motivoStockModel.findMotivoById(id, id_empresa)
    if (!motivo) {
      return res.status(404).json({ error: 'No se encontró el motivo' })
    }

    const nombre = limpiarNombre(req.body.nombre)
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del motivo es obligatorio (máximo 80 caracteres)' })
    }

    const efectos = validarEfectos(req.body)
    if (efectos.error) {
      return res.status(400).json({ error: efectos.error })
    }

    // Un motivo que ya se uso NO puede cambiar de efecto: el stock se calcula
    // recorriendo los movimientos y subiendo al motivo para saber si suman o
    // restan. Dar vuelta "Venta" de salida a entrada reinterpretaria todo el
    // historial y las existencias cambiarian solas, sin que nadie toque un
    // movimiento. El nombre si se puede corregir siempre.
    const cambiaElEfecto = efectos.efecto_stock !== motivo.efecto_stock ||
                           efectos.efecto_dinero !== motivo.efecto_dinero

    if (cambiaElEfecto) {
      const usos = await stockModel.contarMovimientosDeMotivo(id)
      if (usos > 0) {
        return res.status(400).json({
          error: `No se puede cambiar lo que hace "${motivo.nombre}": ya tiene ${usos} ${usos === 1 ? 'movimiento registrado' : 'movimientos registrados'} y cambiarlo daría vuelta el historial. ` +
                 'Podés renombrarlo, o darlo de baja y crear uno nuevo que haga lo que necesitás.'
        })
      }
    }

    // El tipo de dinero, en cambio, SI se puede cambiar aunque el motivo ya se
    // haya usado: no reinterpreta nada, sólo dice dónde caen las ventas de
    // acá en adelante. Las ya cargadas tienen su movimiento de dinero propio.
    const tipo = await validarTipo(req.body, efectos.efecto_dinero, id_empresa)
    if (tipo.error) {
      return res.status(400).json({ error: tipo.error })
    }

    await motivoStockModel.updateMotivo(id, id_empresa, { nombre, ...efectos, ...tipo })
    res.json({ message: 'Motivo actualizado correctamente' })

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un motivo con ese nombre en tu empresa' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar el motivo' })
  }
}

exports.cambiarEstadoMotivo = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const { id } = req.params

    const motivo = await motivoStockModel.findMotivoById(id, id_empresa)
    if (!motivo) {
      return res.status(404).json({ error: 'No se encontró el motivo' })
    }

    const activo = req.body.activo ? 1 : 0
    await motivoStockModel.setActivoMotivo(id, id_empresa, activo)

    res.json({ message: activo ? 'Motivo reactivado' : 'Motivo dado de baja' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al cambiar el estado del motivo' })
  }
}
