const movimientoModel = require('../models/movimiento.model')
const categoriaModel = require('../models/categoria.model')
const productoModel = require('../models/producto.model')
const moduloModel = require('../models/modulo.model')
const { parsearFecha, validarFechaDeCarga } = require('../services/fecha.service')

const NATURALEZAS = ['ingreso', 'egreso']

// De donde salio la plata (HU-48). Es OPCIONAL: la mayor parte de los
// movimientos -- la luz, el alquiler, un sueldo -- no viene de ningun
// servicio, y el campo queda vacio.
//
// Devuelve { id_servicio } listo para guardar, o { error }.
//
// No confunde el ORIGEN con la CLASIFICACION: el movimiento igual tiene que
// elegir su categoria y su tipo, que es lo que lo ordena en el balance. Esto
// dice de donde vino, y es lo que despues responde cuanto deja cada servicio.
const validarServicio = async (valor, id_empresa) => {

  if (valor === undefined || valor === null || valor === '') {
    return { id_servicio: null }
  }

  // Si la empresa no tiene el modulo, la pantalla no ofrece el campo. Un
  // pedido armado a mano si lo puede mandar, y se rechaza: si no, quedarian
  // movimientos atados a un modulo que esa empresa nunca prendio.
  if (!await moduloModel.estaActivo(id_empresa, 'servicios')) {
    return { error: 'El módulo de Servicios no está activo en tu empresa' }
  }

  const servicio = await productoModel.findProductoById(valor, id_empresa)

  // Un id de PRODUCTO tambien llegaria hasta aca (comparten la tabla), asi que
  // no alcanza con que exista y sea de la empresa.
  if (!servicio || !servicio.es_servicio) {
    return { error: 'Elegí un servicio válido' }
  }
  if (!servicio.activo) {
    return { error: 'Ese servicio está dado de baja: elegí uno activo o dejá el campo vacío' }
  }

  return { id_servicio: servicio.id_producto }
}

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

  // Filtrar por servicio no valida nada mas: el WHERE ya lleva la empresa, asi
  // que un id ajeno o inventado simplemente no trae filas. Y a proposito
  // acepta tambien los servicios dados de baja: sus movimientos siguen
  // existiendo y hay que poder encontrarlos, igual que en el catalogo.
  if (query.id_servicio) filtros.id_servicio = Number(query.id_servicio) || undefined

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

// Cuanto deja cada servicio en el periodo elegido (HU-49).
//
// Toma SOLO las fechas de los filtros, no los demas. Con el filtro de
// naturaleza puesto en "ingreso", todos los servicios mostrarian egresos en
// cero y el resultado seria pura ganancia inventada. La pantalla dice de que
// periodo esta hablando para que no haya duda.
exports.getResumenPorServicio = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id

    // Si la empresa no tiene el modulo, no hay servicios de que hablar. Se
    // devuelve vacio en vez de un error: la pantalla simplemente no muestra
    // el panel, y esto no es un pedido invalido, es una empresa que no usa
    // esa parte del sistema.
    if (!await moduloModel.estaActivo(id_empresa, 'servicios')) {
      return res.json([])
    }

    const { desde, hasta } = filtrosDeQuery(req.query)
    const filas = await movimientoModel.resumenPorServicio(id_empresa, { desde, hasta })
    res.json(filas)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener el resumen por servicio' })
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

    // De donde salio la plata. Opcional: casi siempre viene vacio.
    const origen = await validarServicio(req.body.id_servicio, id_empresa)
    if (origen.error) {
      return res.status(400).json({ error: origen.error })
    }

    const id_movimiento = await movimientoModel.create({
      id_tipo: tipo.id_tipo, monto, descripcion, fecha, id_empresa, id_usuario,
      id_servicio: origen.id_servicio
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
