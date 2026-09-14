const categoriaProductoModel = require('../models/categoria-producto.model')

// Normaliza un nombre libre: recorta espacios y valida que no quede vacio ni
// se pase del limite de la columna (80). Devuelve null si no sirve.
const limpiarNombre = (valor) => {
  if (typeof valor !== 'string') return null
  const limpio = valor.trim()
  if (!limpio || limpio.length > 80) return null
  return limpio
}

// =====================================================================
// CATEGORIAS
// =====================================================================

exports.getCategorias = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const soloActivas = req.query.soloActivas === 'true'

    const categorias = await categoriaProductoModel.findCategorias(id_empresa, { soloActivas })
    res.json(categorias)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener las categorías de productos' })
  }
}

exports.crearCategoria = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id

    const nombre = limpiarNombre(req.body.nombre)
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre de la categoría es obligatorio (máximo 80 caracteres)' })
    }

    const id = await categoriaProductoModel.createCategoria({ nombre, id_empresa })
    res.status(201).json({ id_categoria_producto: id, message: 'Categoría creada correctamente' })

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe una categoría de productos con ese nombre' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al crear la categoría' })
  }
}

exports.actualizarCategoria = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const { id } = req.params

    const categoria = await categoriaProductoModel.findCategoriaById(id, id_empresa)
    if (!categoria) {
      return res.status(404).json({ error: 'No se encontró la categoría' })
    }

    const nombre = limpiarNombre(req.body.nombre)
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre de la categoría es obligatorio (máximo 80 caracteres)' })
    }

    await categoriaProductoModel.updateCategoria(id, id_empresa, { nombre })
    res.json({ message: 'Categoría actualizada correctamente' })

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe una categoría de productos con ese nombre' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar la categoría' })
  }
}

exports.cambiarEstadoCategoria = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const { id } = req.params

    const categoria = await categoriaProductoModel.findCategoriaById(id, id_empresa)
    if (!categoria) {
      return res.status(404).json({ error: 'No se encontró la categoría' })
    }

    const activo = req.body.activo ? 1 : 0
    await categoriaProductoModel.setActivoCategoria(id, id_empresa, activo)

    res.json({
      message: activo
        ? 'Categoría activada (sus subcategorías también)'
        : 'Categoría desactivada (sus subcategorías también)'
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al cambiar el estado de la categoría' })
  }
}

// =====================================================================
// SUBCATEGORIAS
// =====================================================================

exports.getSubcategorias = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const { id } = req.params // id de la categoria

    // Verifica que la categoria sea de esta empresa antes de listar nada.
    const categoria = await categoriaProductoModel.findCategoriaById(id, id_empresa)
    if (!categoria) {
      return res.status(404).json({ error: 'No se encontró la categoría' })
    }

    const subcategorias = await categoriaProductoModel.findSubcategoriasByCategoria(id)
    res.json(subcategorias)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener las subcategorías' })
  }
}

exports.crearSubcategoria = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const { id } = req.params // id de la categoria

    const categoria = await categoriaProductoModel.findCategoriaById(id, id_empresa)
    if (!categoria) {
      return res.status(404).json({ error: 'No se encontró la categoría' })
    }

    const nombre = limpiarNombre(req.body.nombre)
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre de la subcategoría es obligatorio (máximo 80 caracteres)' })
    }

    // Hereda el estado de la categoria: dentro de una categoria de baja, la
    // subcategoria nueva tambien nace de baja.
    const id_subcategoria_producto = await categoriaProductoModel.createSubcategoria({
      nombre,
      id_categoria_producto: id,
      activo: categoria.activo
    })

    res.status(201).json({
      id_subcategoria_producto,
      message: categoria.activo
        ? 'Subcategoría creada correctamente'
        : 'Subcategoría creada, pero queda inactiva porque su categoría está desactivada'
    })

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe una subcategoría con ese nombre en esa categoría' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al crear la subcategoría' })
  }
}

exports.actualizarSubcategoria = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const { id } = req.params // id de la subcategoria

    const subcategoria = await categoriaProductoModel.findSubcategoriaById(id, id_empresa)
    if (!subcategoria) {
      return res.status(404).json({ error: 'No se encontró la subcategoría' })
    }

    const nombre = limpiarNombre(req.body.nombre)
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre de la subcategoría es obligatorio (máximo 80 caracteres)' })
    }

    await categoriaProductoModel.updateSubcategoria(id, { nombre })
    res.json({ message: 'Subcategoría actualizada correctamente' })

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe una subcategoría con ese nombre en esa categoría' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar la subcategoría' })
  }
}

exports.cambiarEstadoSubcategoria = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const { id } = req.params // id de la subcategoria

    const subcategoria = await categoriaProductoModel.findSubcategoriaById(id, id_empresa)
    if (!subcategoria) {
      return res.status(404).json({ error: 'No se encontró la subcategoría' })
    }

    // No se puede reactivar una subcategoria si su categoria esta de baja:
    // quedaria disponible para elegir dentro de algo que no se ve.
    const activo = req.body.activo ? 1 : 0
    if (activo && !subcategoria.categoria_activa) {
      return res.status(400).json({ error: 'No se puede activar la subcategoría: su categoría está desactivada' })
    }

    await categoriaProductoModel.setActivoSubcategoria(id, activo)
    res.json({ message: activo ? 'Subcategoría activada' : 'Subcategoría desactivada' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al cambiar el estado de la subcategoría' })
  }
}
