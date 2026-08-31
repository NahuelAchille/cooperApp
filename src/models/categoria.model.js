const db = require('../config/db')

// =====================================================================
// CATEGORIAS (nivel 2: cuelgan de una naturaleza, son por empresa)
// =====================================================================

// Devuelve las categorias de una empresa con la cantidad de tipos que tiene
// cada una. Por defecto trae todas; con soloActivas = true filtra las de baja.
const findCategorias = async (id_cooperativa, { soloActivas = false } = {}) => {

  const [rows] = await db.query(`
    SELECT c.id_categoria, c.nombre, c.naturaleza, c.activo,
           (SELECT COUNT(*) FROM tipos_movimiento t WHERE t.id_categoria = c.id_categoria) AS cantidad_tipos
    FROM categorias_movimiento c
    WHERE c.id_cooperativa = ? ${soloActivas ? 'AND c.activo = 1' : ''}
    ORDER BY c.naturaleza, c.nombre
  `, [id_cooperativa])

  return rows
}

// Busca una categoria propia de la empresa (sirve para validar pertenencia).
const findCategoriaById = async (id_categoria, id_cooperativa) => {

  const [rows] = await db.query(
    'SELECT id_categoria, nombre, naturaleza, activo FROM categorias_movimiento WHERE id_categoria = ? AND id_cooperativa = ?',
    [id_categoria, id_cooperativa]
  )

  return rows[0] || null
}

const createCategoria = async ({ nombre, naturaleza, id_cooperativa }) => {

  const [result] = await db.query(
    'INSERT INTO categorias_movimiento (nombre, naturaleza, id_cooperativa) VALUES (?, ?, ?)',
    [nombre, naturaleza, id_cooperativa]
  )

  return result.insertId
}

// Solo se puede renombrar. La naturaleza no se cambia: si estuviera mal,
// se da de baja la categoria y se crea otra, para no romper el historial.
const updateCategoria = async (id_categoria, id_cooperativa, { nombre }) => {
  await db.query(
    'UPDATE categorias_movimiento SET nombre = ? WHERE id_categoria = ? AND id_cooperativa = ?',
    [nombre, id_categoria, id_cooperativa]
  )
}

// Baja / alta logica de la categoria y, en cascada logica, de sus tipos.
const setActivoCategoria = async (id_categoria, id_cooperativa, activo) => {

  await db.query(
    'UPDATE categorias_movimiento SET activo = ? WHERE id_categoria = ? AND id_cooperativa = ?',
    [activo, id_categoria, id_cooperativa]
  )

  // Al desactivar una categoria, sus tipos tampoco deben poder usarse.
  if (!activo) {
    await db.query('UPDATE tipos_movimiento SET activo = 0 WHERE id_categoria = ?', [id_categoria])
  }
}

// =====================================================================
// TIPOS (nivel 3: cuelgan de una categoria)
// =====================================================================

const findTiposByCategoria = async (id_categoria) => {

  const [rows] = await db.query(
    'SELECT id_tipo, nombre, activo FROM tipos_movimiento WHERE id_categoria = ? ORDER BY nombre',
    [id_categoria]
  )

  return rows
}

// Busca un tipo verificando que pertenezca a la empresa (subiendo por la
// categoria). Devuelve tambien la naturaleza, util al cargar un movimiento.
const findTipoById = async (id_tipo, id_cooperativa) => {

  const [rows] = await db.query(`
    SELECT t.id_tipo, t.nombre, t.activo, t.id_categoria,
           c.naturaleza, c.nombre AS categoria_nombre
    FROM tipos_movimiento t
    JOIN categorias_movimiento c ON c.id_categoria = t.id_categoria
    WHERE t.id_tipo = ? AND c.id_cooperativa = ?
  `, [id_tipo, id_cooperativa])

  return rows[0] || null
}

const createTipo = async ({ nombre, id_categoria }) => {

  const [result] = await db.query(
    'INSERT INTO tipos_movimiento (nombre, id_categoria) VALUES (?, ?)',
    [nombre, id_categoria]
  )

  return result.insertId
}

const updateTipo = async (id_tipo, { nombre }) => {
  await db.query('UPDATE tipos_movimiento SET nombre = ? WHERE id_tipo = ?', [nombre, id_tipo])
}

const setActivoTipo = async (id_tipo, activo) => {
  await db.query('UPDATE tipos_movimiento SET activo = ? WHERE id_tipo = ?', [activo, id_tipo])
}

module.exports = {
  findCategorias, findCategoriaById, createCategoria, updateCategoria, setActivoCategoria,
  findTiposByCategoria, findTipoById, createTipo, updateTipo, setActivoTipo
}
