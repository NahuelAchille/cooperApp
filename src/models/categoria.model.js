const db = require('../config/db')

// =====================================================================
// CATEGORIAS (nivel 2: cuelgan de una naturaleza, son por empresa)
// =====================================================================

// Devuelve las categorias de una empresa con la cantidad de tipos que tiene
// cada una. Por defecto trae todas; con soloActivas = true filtra las de baja.
const findCategorias = async (id_empresa, { soloActivas = false } = {}) => {

  const [rows] = await db.query(`
    SELECT c.id_categoria, c.nombre, c.naturaleza, c.activo,
           (SELECT COUNT(*) FROM tipos_movimiento t WHERE t.id_categoria = c.id_categoria) AS cantidad_tipos
    FROM categorias_movimiento c
    WHERE c.id_empresa = ? ${soloActivas ? 'AND c.activo = 1' : ''}
    ORDER BY c.naturaleza, c.nombre
  `, [id_empresa])

  return rows
}

// Busca una categoria propia de la empresa (sirve para validar pertenencia).
const findCategoriaById = async (id_categoria, id_empresa) => {

  const [rows] = await db.query(
    'SELECT id_categoria, nombre, naturaleza, activo FROM categorias_movimiento WHERE id_categoria = ? AND id_empresa = ?',
    [id_categoria, id_empresa]
  )

  return rows[0] || null
}

const createCategoria = async ({ nombre, naturaleza, id_empresa }) => {

  const [result] = await db.query(
    'INSERT INTO categorias_movimiento (nombre, naturaleza, id_empresa) VALUES (?, ?, ?)',
    [nombre, naturaleza, id_empresa]
  )

  return result.insertId
}

// Solo se puede renombrar. La naturaleza no se cambia: si estuviera mal,
// se da de baja la categoria y se crea otra, para no romper el historial.
const updateCategoria = async (id_categoria, id_empresa, { nombre }) => {
  await db.query(
    'UPDATE categorias_movimiento SET nombre = ? WHERE id_categoria = ? AND id_empresa = ?',
    [nombre, id_categoria, id_empresa]
  )
}

// Baja / alta logica de la categoria y, en cascada logica, de sus tipos.
// La cascada va para los dos lados a proposito: si al reactivar la categoria
// los tipos quedaran en baja, volveria "activa" pero vacia, imposible de usar.
const setActivoCategoria = async (id_categoria, id_empresa, activo) => {

  await db.query(
    'UPDATE categorias_movimiento SET activo = ? WHERE id_categoria = ? AND id_empresa = ?',
    [activo, id_categoria, id_empresa]
  )

  await db.query('UPDATE tipos_movimiento SET activo = ? WHERE id_categoria = ?', [activo, id_categoria])
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
const findTipoById = async (id_tipo, id_empresa) => {

  const [rows] = await db.query(`
    SELECT t.id_tipo, t.nombre, t.activo, t.id_categoria,
           c.naturaleza, c.nombre AS categoria_nombre, c.activo AS categoria_activa
    FROM tipos_movimiento t
    JOIN categorias_movimiento c ON c.id_categoria = t.id_categoria
    WHERE t.id_tipo = ? AND c.id_empresa = ?
  `, [id_tipo, id_empresa])

  return rows[0] || null
}

// El tipo nace con el mismo estado que su categoria: si la categoria esta
// dada de baja, no tiene sentido que el tipo nuevo quede activo.
const createTipo = async ({ nombre, id_categoria, activo = 1 }) => {

  const [result] = await db.query(
    'INSERT INTO tipos_movimiento (nombre, id_categoria, activo) VALUES (?, ?, ?)',
    [nombre, id_categoria, activo]
  )

  return result.insertId
}

const updateTipo = async (id_tipo, { nombre }) => {
  await db.query('UPDATE tipos_movimiento SET nombre = ? WHERE id_tipo = ?', [nombre, id_tipo])
}

const setActivoTipo = async (id_tipo, activo) => {
  await db.query('UPDATE tipos_movimiento SET activo = ? WHERE id_tipo = ?', [activo, id_tipo])
}

// =====================================================================
// CARGA INICIAL (al aprobar una empresa)
// =====================================================================

// Cuenta las categorias que tiene la empresa. Sirve para no volver a sembrar
// encima de una empresa que ya armo su clasificacion.
const contarCategorias = async (id_empresa) => {

  const [rows] = await db.query(
    'SELECT COUNT(*) AS cantidad FROM categorias_movimiento WHERE id_empresa = ?',
    [id_empresa]
  )

  return rows[0].cantidad
}

// Carga la clasificacion inicial para que la empresa pueda registrar
// movimientos desde el primer dia. Recibe la lista desde config/datos-iniciales.
const crearCategoriasIniciales = async (id_empresa, categorias) => {

  for (const categoria of categorias) {

    const id_categoria = await createCategoria({
      nombre: categoria.nombre,
      naturaleza: categoria.naturaleza,
      id_empresa
    })

    for (const nombreTipo of categoria.tipos) {
      await createTipo({ nombre: nombreTipo, id_categoria })
    }
  }
}

module.exports = {
  findCategorias, findCategoriaById, createCategoria, updateCategoria, setActivoCategoria,
  findTiposByCategoria, findTipoById, createTipo, updateTipo, setActivoTipo,
  contarCategorias, crearCategoriasIniciales
}
