const db = require('../config/db')

// Localidades: la lista de donde elige su ubicacion cada empresa. Cada una
// tiene las coordenadas APROXIMADAS de su centro, que el buscador entre
// empresas usa para ordenar por cercania (ver database.sql).

const findLocalidades = async () => {

  const [rows] = await db.query(`
    SELECT l.id_localidad, l.nombre, l.id_provincia, p.nombre AS provincia_nombre
    FROM localidades l
    JOIN provincias p ON p.id_provincia = l.id_provincia
    ORDER BY l.nombre
  `)

  return rows
}

const findLocalidadById = async (id_localidad) => {

  const [rows] = await db.query(
    'SELECT id_localidad, nombre, id_provincia, latitud, longitud FROM localidades WHERE id_localidad = ?',
    [id_localidad]
  )

  return rows[0] || null
}

module.exports = { findLocalidades, findLocalidadById }
