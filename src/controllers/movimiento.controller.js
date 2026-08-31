const movimientoModel = require('../models/movimiento.model')
const categoriaModel = require('../models/categoria.model')

const NATURALEZAS = ['ingreso', 'egreso']

// Valida un monto: debe ser un numero positivo con hasta 2 decimales 
const parsearMonto = (valor) => {

  const numero = Number(valor)

  // Rechaza si no es un numero finito (NaN, infinito) o si es cero/negativo.
  if (!Number.isFinite(numero) || numero <= 0) return null

  // Rechaza si es mas grande de lo que entra en DECIMAL(14,2)
  if (numero > 999999999999.99) return null

  // Redondea a 2 decimales
  return Math.round(numero * 100) / 100
}

// Valida una fecha en formato YYYY-MM-DD y que sea real
const parsearFecha = (valor) => {

  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null

  const fecha = new Date(`${valor}T00:00:00`)
  if (Number.isNaN(fecha.getTime())) return null

  //arregla fechas imposibles
  const iso = fecha.toISOString().slice(0, 10)
  return iso === valor ? valor : null
}

// Toma los filtros que vienen en la URL (?naturaleza=ingreso&desde=...) y arma
// un objeto limpio con SOLO los filtros validos
const filtrosDeQuery = (query) => {

  const filtros = {}

  // Naturaleza: solo si es una de las permitidas ('ingreso' / 'egreso').
  if (NATURALEZAS.includes(query.naturaleza)) filtros.naturaleza = query.naturaleza

  // Categoria y tipo: pasan el id a numero. El "|| undefined" es una red:
  // si diera 0 o NaN (invalido), guarda undefined (nada) en vez de basura.
  if (query.id_categoria) filtros.id_categoria = Number(query.id_categoria) || undefined
  if (query.id_tipo) filtros.id_tipo = Number(query.id_tipo) || undefined

  if (parsearFecha(query.desde)) filtros.desde = query.desde
  if (parsearFecha(query.hasta)) filtros.hasta = query.hasta

  // Todo lo de la URL es texto, por eso se compara con el string 'true'.
  if (query.incluirAnulados === 'true') filtros.incluirAnulados = true

  return filtros
}

exports.getMovimientos = async (req, res) => {

  try {
    const id_cooperativa = req.session.user.cooperativa.id
    const movimientos = await movimientoModel.findByCoop(id_cooperativa, filtrosDeQuery(req.query))
    res.json(movimientos)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los movimientos' })
  }
}

exports.getResumen = async (req, res) => {

  try {
    const id_cooperativa = req.session.user.cooperativa.id
    const resumen = await movimientoModel.resumen(id_cooperativa, filtrosDeQuery(req.query))
    res.json(resumen)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener el resumen' })
  }
}

exports.crearMovimiento = async (req, res) => {

  try {
    const id_cooperativa = req.session.user.cooperativa.id
    const id_usuario = req.session.user.id

    // El tipo debe existir, ser de esta empresa y estar activo.
    const tipo = await categoriaModel.findTipoById(req.body.id_tipo, id_cooperativa)
    if (!tipo) {
      return res.status(400).json({ error: 'El tipo de movimiento no es válido' })
    }
    if (!tipo.activo) {
      return res.status(400).json({ error: 'No se puede usar un tipo de movimiento desactivado' })
    }

    const monto = parsearMonto(req.body.monto)
    if (monto === null) {
      return res.status(400).json({ error: 'El monto debe ser un número mayor a cero' })
    }

    const fecha = parsearFecha(req.body.fecha)
    if (!fecha) {
      return res.status(400).json({ error: 'La fecha no es válida (formato AAAA-MM-DD)' })
    }

    const descripcion = typeof req.body.descripcion === 'string' ? req.body.descripcion.trim().slice(0, 255) : null

    const id_movimiento = await movimientoModel.create({
      id_tipo: tipo.id_tipo, monto, descripcion, fecha, id_cooperativa, id_usuario
    })

    res.status(201).json({ id_movimiento, message: 'Movimiento registrado correctamente' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al registrar el movimiento' })
  }
}

exports.anularMovimiento = async (req, res) => {

  try {
    const id_cooperativa = req.session.user.cooperativa.id
    const { id } = req.params

    const movimiento = await movimientoModel.findById(id, id_cooperativa)
    if (!movimiento) {
      return res.status(404).json({ error: 'No se encontró el movimiento' })
    }
    if (movimiento.anulado) {
      return res.status(400).json({ error: 'El movimiento ya estaba anulado' })
    }

    await movimientoModel.anular(id, id_cooperativa)
    res.json({ message: 'Movimiento anulado correctamente' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al anular el movimiento' })
  }
}
