const productoModel = require('../models/producto.model')
const categoriaProductoModel = require('../models/categoria-producto.model')
const { UNIDADES_MEDIDA, CLAVES_UNIDADES } = require('../config/unidades-medida')

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

  const numero = Number(valor)
  if (!Number.isFinite(numero)) {
    return { error: 'El stock mínimo tiene que ser un número' }
  }

  const redondeado = Math.round(numero * 100) / 100
  if (redondeado < 0) {
    return { error: 'El stock mínimo no puede ser negativo' }
  }
  if (redondeado > 9999999999.99) {  // no entra en DECIMAL(12,2)
    return { error: 'El stock mínimo es demasiado grande' }
  }

  return { valor: redondeado }
}

// Valida la clasificacion que viene del formulario y devuelve los ids ya
// verificados, o un mensaje de error.
//
// Dos niveles, con reglas distintas:
//   - la CATEGORIA es obligatoria, tiene que ser de la empresa y estar activa
//   - la SUBCATEGORIA es opcional; si viene, tiene que pertenecer a esa misma
//     categoria (si no, un pedido armado a mano podria colgar el producto de
//     la subcategoria de otra categoria, o de otra empresa)
const validarClasificacion = async (body, id_empresa) => {

  const categoria = await categoriaProductoModel.findCategoriaById(body.id_categoria_producto, id_empresa)
  if (!categoria) {
    return { error: 'Elegí una categoría válida' }
  }
  if (!categoria.activo) {
    return { error: 'Esa categoría está desactivada: elegí una activa' }
  }

  // Sin subcategoria es un caso normal, no un error: el producto queda
  // clasificado solo por categoria.
  const idSubcategoria = body.id_subcategoria_producto
  if (idSubcategoria === undefined || idSubcategoria === null || idSubcategoria === '') {
    return { id_categoria_producto: categoria.id_categoria_producto, id_subcategoria_producto: null }
  }

  const subcategoria = await categoriaProductoModel.findSubcategoriaById(idSubcategoria, id_empresa)
  if (!subcategoria) {
    return { error: 'Elegí una subcategoría válida' }
  }
  if (subcategoria.id_categoria_producto !== categoria.id_categoria_producto) {
    return { error: 'Esa subcategoría no pertenece a la categoría elegida' }
  }
  if (!subcategoria.activo) {
    return { error: 'Esa subcategoría está desactivada: elegí una activa o dejá el campo vacío' }
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
    res.status(500).json({ error: 'Error al obtener los productos' })
  }
}

exports.crearProducto = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id

    const nombre = limpiarTexto(req.body.nombre, 120)
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del producto es obligatorio (máximo 120 caracteres)' })
    }

    if (!CLAVES_UNIDADES.includes(req.body.unidad_medida)) {
      return res.status(400).json({ error: 'Elegí una unidad de medida válida' })
    }

    // La descripcion si es opcional: vacia se guarda como NULL.
    const descripcion = req.body.descripcion ? limpiarTexto(req.body.descripcion, 255) : null
    if (req.body.descripcion && !descripcion) {
      return res.status(400).json({ error: 'La descripción no puede pasar de 255 caracteres' })
    }

    const stock = limpiarStockMinimo(req.body.stock_minimo)
    if (stock.error) {
      return res.status(400).json({ error: stock.error })
    }

    const clasificacion = await validarClasificacion(req.body, id_empresa)
    if (clasificacion.error) {
      return res.status(400).json({ error: clasificacion.error })
    }

    const id_producto = await productoModel.createProducto({
      nombre,
      descripcion,
      unidad_medida: req.body.unidad_medida,
      stock_minimo: stock.valor,
      ...clasificacion,
      id_empresa
    })

    res.status(201).json({ id_producto, message: 'Producto creado correctamente' })

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un producto con ese nombre en tu empresa' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al crear el producto' })
  }
}

exports.actualizarProducto = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const { id } = req.params

    const producto = await productoModel.findProductoById(id, id_empresa)
    if (!producto) {
      return res.status(404).json({ error: 'No se encontró el producto' })
    }

    const nombre = limpiarTexto(req.body.nombre, 120)
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del producto es obligatorio (máximo 120 caracteres)' })
    }

    if (!CLAVES_UNIDADES.includes(req.body.unidad_medida)) {
      return res.status(400).json({ error: 'Elegí una unidad de medida válida' })
    }

    const descripcion = req.body.descripcion ? limpiarTexto(req.body.descripcion, 255) : null
    if (req.body.descripcion && !descripcion) {
      return res.status(400).json({ error: 'La descripción no puede pasar de 255 caracteres' })
    }

    const stock = limpiarStockMinimo(req.body.stock_minimo)
    if (stock.error) {
      return res.status(400).json({ error: stock.error })
    }

    const clasificacion = await validarClasificacion(req.body, id_empresa)
    if (clasificacion.error) {
      return res.status(400).json({ error: clasificacion.error })
    }

    await productoModel.updateProducto(id, id_empresa, {
      nombre,
      descripcion,
      unidad_medida: req.body.unidad_medida,
      stock_minimo: stock.valor,
      ...clasificacion
    })

    res.json({ message: 'Producto actualizado correctamente' })

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un producto con ese nombre en tu empresa' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar el producto' })
  }
}

exports.cambiarEstadoProducto = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const { id } = req.params

    const producto = await productoModel.findProductoById(id, id_empresa)
    if (!producto) {
      return res.status(404).json({ error: 'No se encontró el producto' })
    }

    const activo = req.body.activo ? 1 : 0
    await productoModel.setActivoProducto(id, id_empresa, activo)

    res.json({ message: activo ? 'Producto activado' : 'Producto dado de baja' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al cambiar el estado del producto' })
  }
}
