const db = require('../config/db')

// Arbol de clasificacion del catalogo de productos, de dos niveles:
//   categoria (ej: "Alimentos")  ->  subcategoria (ej: "Perecederos")
//
// Mismo criterio que la clasificacion de movimientos: es por empresa, las
// bajas son logicas y van en cascada a los dos lados. Lo que NO comparten es
// la naturaleza (ingreso/egreso): un producto no es dinero, el dinero tiene
// su propia clasificacion aparte.
//
// Estas mismas tablas guardan los dos arboles, el de productos y el de
// servicios, separados por la columna es_servicio. Por eso casi todas las
// funciones de aca abajo lo reciben: sin ese filtro, el alta de un servicio
// ofreceria las categorias de los productos.

// =====================================================================
// CATEGORIAS (nivel 1)
// =====================================================================

// Categorias de la empresa con la cantidad de subcategorias de cada una.
const findCategorias = async (id_empresa, { soloActivas = false, es_servicio = 0 } = {}) => {

  const [rows] = await db.query(`
    SELECT c.id_categoria_producto, c.nombre, c.activo,
           (SELECT COUNT(*) FROM subcategorias_producto s
             WHERE s.id_categoria_producto = c.id_categoria_producto) AS cantidad_subcategorias
    FROM categorias_producto c
    WHERE c.id_empresa = ? AND c.es_servicio = ? ${soloActivas ? 'AND c.activo = 1' : ''}
    ORDER BY c.nombre
  `, [id_empresa, es_servicio])

  return rows
}

// Busca una categoria propia de la empresa y del arbol que corresponde
// (sirve para validar pertenencia).
const findCategoriaById = async (id_categoria_producto, id_empresa, es_servicio = 0) => {

  const [rows] = await db.query(
    `SELECT id_categoria_producto, nombre, activo, es_servicio
     FROM categorias_producto
     WHERE id_categoria_producto = ? AND id_empresa = ? AND es_servicio = ?`,
    [id_categoria_producto, id_empresa, es_servicio]
  )

  return rows[0] || null
}

const createCategoria = async ({ nombre, id_empresa, es_servicio = 0 }) => {

  const [result] = await db.query(
    'INSERT INTO categorias_producto (nombre, id_empresa, es_servicio) VALUES (?, ?, ?)',
    [nombre, id_empresa, es_servicio]
  )

  return result.insertId
}

const updateCategoria = async (id_categoria_producto, id_empresa, { nombre }) => {
  await db.query(
    'UPDATE categorias_producto SET nombre = ? WHERE id_categoria_producto = ? AND id_empresa = ?',
    [nombre, id_categoria_producto, id_empresa]
  )
}

// Baja / alta logica de la categoria y, en cascada, de sus subcategorias.
// La cascada va para los dos lados a proposito: si al reactivar la categoria
// las subcategorias quedaran de baja, volveria "activa" pero vacia.
const setActivoCategoria = async (id_categoria_producto, id_empresa, activo) => {

  await db.query(
    'UPDATE categorias_producto SET activo = ? WHERE id_categoria_producto = ? AND id_empresa = ?',
    [activo, id_categoria_producto, id_empresa]
  )

  if (activo) {
    // Vuelven SOLO las que se fueron arrastradas por esta misma cascada, no
    // las que el administrador habia dado de baja a proposito. Mismo criterio
    // que en la clasificacion de movimientos.
    await db.query(
      'UPDATE subcategorias_producto SET activo = 1, baja_en_cascada = 0 WHERE id_categoria_producto = ? AND baja_en_cascada = 1',
      [id_categoria_producto]
    )
  } else {
    await db.query(
      'UPDATE subcategorias_producto SET activo = 0, baja_en_cascada = 1 WHERE id_categoria_producto = ? AND activo = 1',
      [id_categoria_producto]
    )
  }
}

// =====================================================================
// SUBCATEGORIAS (nivel 2)
// =====================================================================

const findSubcategoriasByCategoria = async (id_categoria_producto) => {

  const [rows] = await db.query(
    `SELECT id_subcategoria_producto, nombre, activo
     FROM subcategorias_producto WHERE id_categoria_producto = ? ORDER BY nombre`,
    [id_categoria_producto]
  )

  return rows
}

// Busca una subcategoria verificando que sea de la empresa y del arbol que
// corresponde, subiendo por su categoria. Devuelve tambien el estado de la
// categoria: hace falta para no dejar activa una subcategoria colgada de una
// categoria dada de baja.
const findSubcategoriaById = async (id_subcategoria_producto, id_empresa, es_servicio = 0) => {

  const [rows] = await db.query(`
    SELECT s.id_subcategoria_producto, s.nombre, s.activo, s.id_categoria_producto,
           c.nombre AS categoria_nombre, c.activo AS categoria_activa
    FROM subcategorias_producto s
    JOIN categorias_producto c ON c.id_categoria_producto = s.id_categoria_producto
    WHERE s.id_subcategoria_producto = ? AND c.id_empresa = ? AND c.es_servicio = ?
  `, [id_subcategoria_producto, id_empresa, es_servicio])

  return rows[0] || null
}

// Nace con el mismo estado que su categoria: dentro de una categoria dada de
// baja, no tiene sentido que la subcategoria nueva quede activa.
const createSubcategoria = async ({ nombre, id_categoria_producto, activo = 1 }) => {

  const [result] = await db.query(
    'INSERT INTO subcategorias_producto (nombre, id_categoria_producto, activo) VALUES (?, ?, ?)',
    [nombre, id_categoria_producto, activo]
  )

  return result.insertId
}

const updateSubcategoria = async (id_subcategoria_producto, { nombre }) => {
  await db.query(
    'UPDATE subcategorias_producto SET nombre = ? WHERE id_subcategoria_producto = ?',
    [nombre, id_subcategoria_producto]
  )
}

// Baja o alta de UNA subcategoria, decidida por el administrador. La marca
// vuelve a 0: reactivar la categoria no deshace esta decision.
const setActivoSubcategoria = async (id_subcategoria_producto, activo) => {
  await db.query(
    'UPDATE subcategorias_producto SET activo = ?, baja_en_cascada = 0 WHERE id_subcategoria_producto = ?',
    [activo, id_subcategoria_producto]
  )
}

module.exports = {
  findCategorias, findCategoriaById, createCategoria, updateCategoria, setActivoCategoria,
  findSubcategoriasByCategoria, findSubcategoriaById, createSubcategoria,
  updateSubcategoria, setActivoSubcategoria
}
