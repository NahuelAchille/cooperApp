const db = require('../config/db')

// Rubros: la lista comun del buscador entre empresas (Articulacion), de
// general a especifico. La define el sistema y es igual para todas las
// empresas: no se edita desde la app (ver database.sql).

// Todos los rubros, con el nombre de su general ya resuelto. Ordenados para
// armar el desplegable tal cual: cada general seguido de sus especificos.
const findRubros = async () => {

  const [rows] = await db.query(`
    SELECT r.id_rubro, r.nombre, r.id_rubro_padre,
           p.nombre AS padre_nombre
    FROM rubros r
    LEFT JOIN rubros p ON p.id_rubro = r.id_rubro_padre
    ORDER BY COALESCE(p.orden, r.orden), r.id_rubro_padre IS NOT NULL, r.orden
  `)

  return rows
}

const findRubroById = async (id_rubro) => {

  const [rows] = await db.query(
    'SELECT id_rubro, nombre, id_rubro_padre FROM rubros WHERE id_rubro = ?',
    [id_rubro]
  )

  return rows[0] || null
}

module.exports = { findRubros, findRubroById }
