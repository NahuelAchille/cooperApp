const motivoStockModel = require('../models/motivo-stock.model')
const stockModel = require('../models/stock.model')

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

    const id_motivo_stock = await motivoStockModel.createMotivo({ nombre, ...efectos, id_empresa })
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
          error: `No se puede cambiar el efecto de "${motivo.nombre}": ya tiene ${usos} ${usos === 1 ? 'movimiento registrado' : 'movimientos registrados'} y cambiarlo daría vuelta el historial. ` +
                 'Podés renombrarlo, o darlo de baja y crear uno nuevo con el efecto que necesitás.'
        })
      }
    }

    await motivoStockModel.updateMotivo(id, id_empresa, { nombre, ...efectos })
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
