const movimientoModel = require('../models/movimiento.model')
const categoriaModel = require('../models/categoria.model')

const NATURALEZAS = ['ingreso', 'egreso']

// Un movimiento no puede quedar fechado antes de esto ni despues de hoy.
const FECHA_MINIMA = '2000-01-01'

// Valida un monto: debe ser un numero positivo con hasta 2 decimales
const parsearMonto = (valor) => {

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

// Fecha de hoy en hora local, como AAAA-MM-DD. Se arma a mano y no con
// toISOString(), que trabaja en UTC: en Argentina (UTC-3) devolveria el dia
// siguiente a partir de las 21:00.
const fechaDeHoy = () => {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
}

// Valida una fecha en formato AAAA-MM-DD y que sea un dia real del calendario.
// No usa Date para comparar, asi no depende de la zona horaria.
const parsearFecha = (valor) => {

  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null

  const [anio, mes, dia] = valor.split('-').map(Number)
  if (mes < 1 || mes > 12) return null

  // El dia 0 del mes siguiente es el ultimo del mes buscado: sirve para saber
  // cuantos dias tiene, contemplando los años bisiestos.
  const diasDelMes = new Date(anio, mes, 0).getDate()
  if (dia < 1 || dia > diasDelMes) return null

  return valor
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
      return res.status(400).json({ error: 'No se puede usar un tipo de movimiento desactivado' })
    }

    // Tambien hay que mirar la categoria: un tipo activo colgado de una
    // categoria dada de baja no se puede usar.
    if (!tipo.categoria_activa) {
      return res.status(400).json({ error: 'No se puede usar un tipo cuya categoría está desactivada' })
    }

    const monto = parsearMonto(req.body.monto)
    if (monto === null) {
      return res.status(400).json({ error: 'El monto debe ser un número mayor a cero' })
    }

    const fecha = parsearFecha(req.body.fecha)
    if (!fecha) {
      return res.status(400).json({ error: 'La fecha no es válida (formato AAAA-MM-DD)' })
    }

    // Un movimiento no se puede fechar en el futuro (todavia no paso) ni en un
    // año absurdo: casi siempre es un error de tipeo en el año.
    const hoy = fechaDeHoy()
    if (fecha > hoy) {
      return res.status(400).json({ error: 'La fecha no puede ser posterior a hoy' })
    }
    if (fecha < FECHA_MINIMA) {
      return res.status(400).json({ error: `La fecha no puede ser anterior al ${FECHA_MINIMA.split('-').reverse().join('/')}` })
    }

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
