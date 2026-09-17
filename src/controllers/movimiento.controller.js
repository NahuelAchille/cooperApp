const movimientoModel = require('../models/movimiento.model')
const categoriaModel = require('../models/categoria.model')
const { parsearFecha, validarFechaDeCarga } = require('../services/fecha.service')

const NATURALEZAS = ['ingreso', 'egreso']

// Valida un monto: debe ser un numero positivo con hasta 2 decimales
const parsearMonto = (valor) => {

  // true se convierte en 1 y false en 0, asi que un booleano pasaria como
  // monto valido. Solo se aceptan numeros o texto que represente un numero.
  if (typeof valor !== 'number' && typeof valor !== 'string') return null

  const numero = Number(valor)

  // Rechaza si no es un numero finito (NaN, infinito).
  if (!Number.isFinite(numero)) return null

  // Se redondea ANTES de comparar contra cero: si se hiciera al reves, un
  // monto como 0.001 pasaria el control y terminaria guardado como 0.00.
  const redondeado = Math.round(numero * 100) / 100

  if (redondeado <= 0) return null

  // Rechaza si es mas grande de lo que entra en DECIMAL(14,2)
  if (redondeado > 999999999999.99) return null

  return redondeado
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

  // Cantidad maxima de filas. Lo usa el dashboard, que solo muestra las
  // ultimas 5 y no tiene por que traerse el historial entero.
  const limite = Number(query.limit)
  if (Number.isInteger(limite) && limite > 0) filtros.limite = Math.min(limite, 500)

  return filtros
}

exports.getMovimientos = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const movimientos = await movimientoModel.findByEmpresa(id_empresa, filtrosDeQuery(req.query))
    res.json(movimientos)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los movimientos' })
  }
}

exports.getResumen = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const resumen = await movimientoModel.resumen(id_empresa, filtrosDeQuery(req.query))
    res.json(resumen)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener el resumen' })
  }
}

exports.crearMovimiento = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const id_usuario = req.session.user.id

    // El tipo debe existir, ser de esta empresa y estar activo.
    const tipo = await categoriaModel.findTipoById(req.body.id_tipo, id_empresa)
    if (!tipo) {
      return res.status(400).json({ error: 'El tipo de movimiento no es válido' })
    }
    if (!tipo.activo) {
      return res.status(400).json({ error: 'No se puede usar un tipo de movimiento dado de baja' })
    }

    // Tambien hay que mirar la categoria: un tipo activo colgado de una
    // categoria dada de baja no se puede usar.
    if (!tipo.categoria_activa) {
      return res.status(400).json({ error: 'No se puede usar un tipo cuya categoría está dada de baja' })
    }

    const monto = parsearMonto(req.body.monto)
    if (monto === null) {
      return res.status(400).json({ error: 'El monto debe ser un número mayor a cero' })
    }

    // Un movimiento no se puede fechar en el futuro (todavia no paso) ni en un
    // año absurdo: casi siempre es un error de tipeo en el año.
    const revision = validarFechaDeCarga(req.body.fecha)
    if (revision.error) {
      return res.status(400).json({ error: revision.error })
    }
    const fecha = revision.fecha

    const descripcion = typeof req.body.descripcion === 'string' ? req.body.descripcion.trim().slice(0, 255) : null

    const id_movimiento = await movimientoModel.create({
      id_tipo: tipo.id_tipo, monto, descripcion, fecha, id_empresa, id_usuario
    })

    res.status(201).json({ id_movimiento, message: 'Movimiento registrado correctamente' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al registrar el movimiento' })
  }
}

exports.anularMovimiento = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const { id } = req.params

    const movimiento = await movimientoModel.findById(id, id_empresa)
    if (!movimiento) {
      return res.status(404).json({ error: 'No se encontró el movimiento' })
    }
    if (movimiento.anulado) {
      return res.status(400).json({ error: 'El movimiento ya estaba anulado' })
    }

    await movimientoModel.anular(id, id_empresa)
    res.json({ message: 'Movimiento anulado correctamente' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al anular el movimiento' })
  }
}
