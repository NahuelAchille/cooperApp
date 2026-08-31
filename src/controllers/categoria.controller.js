const categoriaModel = require('../models/categoria.model')

const NATURALEZAS = ['ingreso', 'egreso']

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
    const id_cooperativa = req.session.user.cooperativa.id
    const soloActivas = req.query.soloActivas === 'true'

    const categorias = await categoriaModel.findCategorias(id_cooperativa, { soloActivas })
    res.json(categorias)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener las categorías' })
  }
}

exports.crearCategoria = async (req, res) => {

  try {
    const id_cooperativa = req.session.user.cooperativa.id

    const nombre = limpiarNombre(req.body.nombre)
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre de la categoría es obligatorio (máximo 80 caracteres)' })
    }

    const naturaleza = req.body.naturaleza
    if (!NATURALEZAS.includes(naturaleza)) {
      return res.status(400).json({ error: 'La naturaleza debe ser "ingreso" o "egreso"' })
    }

    const id = await categoriaModel.createCategoria({ nombre, naturaleza, id_cooperativa })
    res.status(201).json({ id_categoria: id, message: 'Categoría creada correctamente' })

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre en esa naturaleza' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al crear la categoría' })
  }
}

exports.actualizarCategoria = async (req, res) => {

  try {
    const id_cooperativa = req.session.user.cooperativa.id
    const { id } = req.params

    const categoria = await categoriaModel.findCategoriaById(id, id_cooperativa)
    if (!categoria) {
      return res.status(404).json({ error: 'No se encontró la categoría' })
    }

    const nombre = limpiarNombre(req.body.nombre)
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre de la categoría es obligatorio (máximo 80 caracteres)' })
    }

    await categoriaModel.updateCategoria(id, id_cooperativa, { nombre })
    res.json({ message: 'Categoría actualizada correctamente' })

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre en esa naturaleza' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar la categoría' })
  }
}

exports.cambiarEstadoCategoria = async (req, res) => {

  try {
    const id_cooperativa = req.session.user.cooperativa.id
    const { id } = req.params

    const categoria = await categoriaModel.findCategoriaById(id, id_cooperativa)
    if (!categoria) {
      return res.status(404).json({ error: 'No se encontró la categoría' })
    }

    const activo = req.body.activo ? 1 : 0
    await categoriaModel.setActivoCategoria(id, id_cooperativa, activo)

    res.json({ message: activo ? 'Categoría activada' : 'Categoría desactivada (sus tipos también)' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al cambiar el estado de la categoría' })
  }
}

// =====================================================================
// TIPOS
// =====================================================================

exports.getTipos = async (req, res) => {

  try {
    const id_cooperativa = req.session.user.cooperativa.id
    const { id } = req.params // id de la categoria

    // Verifica que la categoria sea de esta empresa antes de listar sus tipos.
    const categoria = await categoriaModel.findCategoriaById(id, id_cooperativa)
    if (!categoria) {
      return res.status(404).json({ error: 'No se encontró la categoría' })
    }

    const tipos = await categoriaModel.findTiposByCategoria(id)
    res.json(tipos)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los tipos' })
  }
}

exports.crearTipo = async (req, res) => {

  try {
    const id_cooperativa = req.session.user.cooperativa.id
    const { id } = req.params // id de la categoria

    const categoria = await categoriaModel.findCategoriaById(id, id_cooperativa)
    if (!categoria) {
      return res.status(404).json({ error: 'No se encontró la categoría' })
    }

    const nombre = limpiarNombre(req.body.nombre)
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del tipo es obligatorio (máximo 80 caracteres)' })
    }

    const id_tipo = await categoriaModel.createTipo({ nombre, id_categoria: id })
    res.status(201).json({ id_tipo, message: 'Tipo creado correctamente' })

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un tipo con ese nombre en esa categoría' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al crear el tipo' })
  }
}

exports.actualizarTipo = async (req, res) => {

  try {
    const id_cooperativa = req.session.user.cooperativa.id
    const { id } = req.params // id del tipo

    const tipo = await categoriaModel.findTipoById(id, id_cooperativa)
    if (!tipo) {
      return res.status(404).json({ error: 'No se encontró el tipo' })
    }

    const nombre = limpiarNombre(req.body.nombre)
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del tipo es obligatorio (máximo 80 caracteres)' })
    }

    await categoriaModel.updateTipo(id, { nombre })
    res.json({ message: 'Tipo actualizado correctamente' })

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un tipo con ese nombre en esa categoría' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar el tipo' })
  }
}

exports.cambiarEstadoTipo = async (req, res) => {

  try {
    const id_cooperativa = req.session.user.cooperativa.id
    const { id } = req.params // id del tipo

    const tipo = await categoriaModel.findTipoById(id, id_cooperativa)
    if (!tipo) {
      return res.status(404).json({ error: 'No se encontró el tipo' })
    }

    // No se puede reactivar un tipo si su categoria esta dada de baja.
    const activo = req.body.activo ? 1 : 0
    if (activo && !tipo.activo && !(await esCategoriaActiva(tipo.id_categoria, id_cooperativa))) {
      return res.status(400).json({ error: 'No se puede activar el tipo: su categoría está desactivada' })
    }

    await categoriaModel.setActivoTipo(id, activo)
    res.json({ message: activo ? 'Tipo activado' : 'Tipo desactivado' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al cambiar el estado del tipo' })
  }
}

const esCategoriaActiva = async (id_categoria, id_cooperativa) => {
  const categoria = await categoriaModel.findCategoriaById(id_categoria, id_cooperativa)
  return categoria?.activo === 1
}
