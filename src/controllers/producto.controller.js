const productoModel = require('../models/producto.model')
const categoriaProductoModel = require('../models/categoria-producto.model')
const { UNIDADES_MEDIDA, CLAVES_UNIDADES } = require('../config/unidades-medida')
const { flagServicio, rotulo } = require('../middlewares/catalogo.middleware')

// Este controlador sirve los DOS catalogos, el de productos y el de
// servicios: un servicio es un producto sin stock. De cual se trata lo dice
// la RUTA (ver catalogo.middleware), nunca el cuerpo del pedido.

// Normaliza un texto libre: recorta espacios y valida el largo maximo de la
// columna. Devuelve null si no sirve.
const limpiarTexto = (valor, maximo) => {
  if (typeof valor !== 'string') return null
  const limpio = valor.trim()
  if (!limpio || limpio.length > maximo) return null
  return limpio
}

// Valida el stock minimo. Devuelve { valor } listo para guardar o { error }.
// Vacio vale 0: es "no me avises", el caso de arranque.
//
// Redondea ANTES de comparar, no despues: si no, un 0,001 pasaba el control
// de "mayor o igual que cero" y despues se guardaba como 0,00. Es el mismo
// error que habia en los montos de movimientos.
const limpiarStockMinimo = (valor) => {
  if (valor === undefined || valor === null || valor === '') return { valor: 0 }

  // Un booleano se convierte en 1 o en 0: hay que descartarlo antes.
  if (typeof valor === 'boolean') {
    return { error: 'El stock mínimo tiene que ser un número' }
  }

  const numero = Number(valor)
  if (!Number.isFinite(numero)) {
    return { error: 'El stock mínimo tiene que ser un número' }
  }

  const redondeado = Math.round(numero * 100) / 100
  if (redondeado < 0) {
    return { error: 'El stock mínimo no puede ser negativo' }
  }

  // Aca el 0 es delicado, porque significa lo contrario que un numero chico:
  // 0 es "no me avises". Un 0,001 redondeaba a 0 y el producto quedaba SIN
  // aviso de reposicion, que es justo lo opuesto de lo que la persona quiso.
  // Se rechaza en vez de aceptarlo en silencio.
  if (numero > 0 && redondeado === 0) {
    return { error: 'El stock mínimo es demasiado chico: usá al menos 0,01, o dejalo en 0 para no recibir avisos' }
  }
  if (redondeado > 9999999999.99) {  // no entra en DECIMAL(12,2)
    return { error: 'El stock mínimo es demasiado grande' }
  }

  return { valor: redondeado }
}

// Como se mide lo que se esta cargando. Es lo unico que separa de verdad a un
// producto de un servicio, y por eso esta escrito en un solo lugar.
//
// Un servicio no se guarda en ningun lado: no se mide en kilos ni en litros y
// no tiene existencia que pueda bajar de nada. Los dos campos se fuerzan aca
// (unidad en NULL, minimo en 0) y NO se leen del pedido, asi que da lo mismo
// lo que mande alguien armandolo a mano desde afuera de la pantalla.
const validarMedida = (body, es_servicio) => {

  if (es_servicio) {
    return { unidad_medida: null, stock_minimo: 0 }
  }

  if (!CLAVES_UNIDADES.includes(body.unidad_medida)) {
    return { error: 'Elegí una unidad de medida válida' }
  }

  const stock = limpiarStockMinimo(body.stock_minimo)
  if (stock.error) {
    return { error: stock.error }
  }

  return { unidad_medida: body.unidad_medida, stock_minimo: stock.valor }
}

// Busca una fila del catalogo que se esta mirando. Que sea de la empresa no
// alcanza: tiene que ser ademas del mismo lado (producto o servicio). Sin
// esto, un PUT a /servicios/7 editaria el producto 7, que es una pantalla que
// esa persona podria no tener ni en el menu.
const buscarDelCatalogo = async (req, id, id_empresa) => {

  const fila = await productoModel.findProductoById(id, id_empresa)
  if (!fila) return null

  return Number(fila.es_servicio) === flagServicio(req) ? fila : null
}

// Valida la clasificacion que viene del formulario y devuelve los ids ya
// verificados, o un mensaje de error.
//
// Dos niveles, con reglas distintas:
//   - la CATEGORIA es obligatoria, tiene que ser de la empresa y estar activa
//   - la SUBCATEGORIA es opcional; si viene, tiene que pertenecer a esa misma
//     categoria (si no, un pedido armado a mano podria colgar el producto de
//     la subcategoria de otra categoria, o de otra empresa)
const validarClasificacion = async (body, id_empresa, es_servicio = 0) => {

  const categoria = await categoriaProductoModel.findCategoriaById(body.id_categoria_producto, id_empresa, es_servicio)
  if (!categoria) {
    return { error: 'Elegí una categoría válida' }
  }
  if (!categoria.activo) {
    return { error: 'Esa categoría está dada de baja: elegí una activa' }
  }

  // Sin subcategoria es un caso normal, no un error: el producto queda
  // clasificado solo por categoria.
  const idSubcategoria = body.id_subcategoria_producto
  if (idSubcategoria === undefined || idSubcategoria === null || idSubcategoria === '') {
    return { id_categoria_producto: categoria.id_categoria_producto, id_subcategoria_producto: null }
  }

  const subcategoria = await categoriaProductoModel.findSubcategoriaById(idSubcategoria, id_empresa, es_servicio)
  if (!subcategoria) {
    return { error: 'Elegí una subcategoría válida' }
  }
  if (subcategoria.id_categoria_producto !== categoria.id_categoria_producto) {
    return { error: 'Esa subcategoría no pertenece a la categoría elegida' }
  }
  if (!subcategoria.activo) {
    return { error: 'Esa subcategoría está dada de baja: elegí una activa o dejá el campo vacío' }
  }

  return {
    id_categoria_producto: categoria.id_categoria_producto,
    id_subcategoria_producto: subcategoria.id_subcategoria_producto
  }
}

// Lista cerrada de unidades, para que la pantalla arme el desplegable sin
// tener que repetirla en el HTML.
exports.getUnidades = (req, res) => {
  res.json(UNIDADES_MEDIDA)
}

// Un id que llega por la direccion puede ser cualquier cosa. Si no es un
// numero se ignora el filtro, en vez de mandarle basura a la consulta.
const idValido = (valor) => {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero > 0 ? numero : undefined
}

exports.getProductos = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id

    // Filtros del catalogo (HU-40). Todos opcionales: sin ninguno se devuelve
    // el catalogo completo, como antes.
    const filtros = {
      es_servicio:   flagServicio(req),
      soloActivos:   req.query.estado === 'activos',
      soloInactivos: req.query.estado === 'inactivos',
      id_categoria_producto:    idValido(req.query.id_categoria_producto),
      id_subcategoria_producto: idValido(req.query.id_subcategoria_producto),
      busqueda: typeof req.query.busqueda === 'string' ? req.query.busqueda.trim().slice(0, 120) : ''
    }

    const productos = await productoModel.findProductos(id_empresa, filtros)
    res.json(productos)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: `Error al obtener los ${rotulo(req).varios}` })
  }
}

exports.crearProducto = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const es_servicio = flagServicio(req)
    const r = rotulo(req)

    const nombre = limpiarTexto(req.body.nombre, 120)
    if (!nombre) {
      return res.status(400).json({ error: `El nombre del ${r.uno} es obligatorio (máximo 120 caracteres)` })
    }

    const medida = validarMedida(req.body, es_servicio)
    if (medida.error) {
      return res.status(400).json({ error: medida.error })
    }

    // La descripcion si es opcional: vacia se guarda como NULL.
    const descripcion = req.body.descripcion ? limpiarTexto(req.body.descripcion, 255) : null
    if (req.body.descripcion && !descripcion) {
      return res.status(400).json({ error: 'La descripción no puede pasar de 255 caracteres' })
    }

    const clasificacion = await validarClasificacion(req.body, id_empresa, es_servicio)
    if (clasificacion.error) {
      return res.status(400).json({ error: clasificacion.error })
    }

    const id_producto = await productoModel.createProducto({
      nombre,
      descripcion,
      ...medida,
      ...clasificacion,
      id_empresa,
      es_servicio
    })

    res.status(201).json({ id_producto, message: `${r.Uno} creado correctamente` })

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: `Ya existe un ${rotulo(req).uno} con ese nombre en tu empresa` })
    }
    console.error(error)
    res.status(500).json({ error: `Error al crear el ${rotulo(req).uno}` })
  }
}

exports.actualizarProducto = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const es_servicio = flagServicio(req)
    const r = rotulo(req)
    const { id } = req.params

    const producto = await buscarDelCatalogo(req, id, id_empresa)
    if (!producto) {
      return res.status(404).json({ error: `No se encontró el ${r.uno}` })
    }

    const nombre = limpiarTexto(req.body.nombre, 120)
    if (!nombre) {
      return res.status(400).json({ error: `El nombre del ${r.uno} es obligatorio (máximo 120 caracteres)` })
    }

    const medida = validarMedida(req.body, es_servicio)
    if (medida.error) {
      return res.status(400).json({ error: medida.error })
    }

    const descripcion = req.body.descripcion ? limpiarTexto(req.body.descripcion, 255) : null
    if (req.body.descripcion && !descripcion) {
      return res.status(400).json({ error: 'La descripción no puede pasar de 255 caracteres' })
    }

    const clasificacion = await validarClasificacion(req.body, id_empresa, es_servicio)
    if (clasificacion.error) {
      return res.status(400).json({ error: clasificacion.error })
    }

    await productoModel.updateProducto(id, id_empresa, {
      nombre,
      descripcion,
      ...medida,
      ...clasificacion
    })

    res.json({ message: `${r.Uno} actualizado correctamente` })

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: `Ya existe un ${rotulo(req).uno} con ese nombre en tu empresa` })
    }
    console.error(error)
    res.status(500).json({ error: `Error al actualizar el ${rotulo(req).uno}` })
  }
}

exports.cambiarEstadoProducto = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const { id } = req.params

    const r = rotulo(req)

    const producto = await buscarDelCatalogo(req, id, id_empresa)
    if (!producto) {
      return res.status(404).json({ error: `No se encontró el ${r.uno}` })
    }

    const activo = req.body.activo ? 1 : 0
    await productoModel.setActivoProducto(id, id_empresa, activo)

    res.json({ message: activo ? `${r.Uno} reactivado` : `${r.Uno} dado de baja` })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: `Error al cambiar el estado del ${rotulo(req).uno}` })
  }
}
