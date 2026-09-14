const db = require('../config/db')

// Devuelve el catalogo completo de modulos con el estado que tiene cada uno
// en esta empresa. El LEFT JOIN es a proposito: si la empresa todavia no
// eligio nada para un modulo, no hay fila en empresa_modulos y vale el
// activo_por_defecto del catalogo.
const findByEmpresa = async (id_empresa) => {

  const [rows] = await db.query(`
    SELECT m.id_modulo, m.clave, m.nombre, m.descripcion, m.opcional,
           COALESCE(em.activo, m.activo_por_defecto) AS activo
    FROM modulos m
    LEFT JOIN empresa_modulos em
           ON em.id_modulo = m.id_modulo AND em.id_empresa = ?
    ORDER BY m.orden
  `, [id_empresa])

  return rows
}

// Busca un modulo del catalogo por su clave ('productos', 'servicios', ...).
const findByClave = async (clave) => {

  const [rows] = await db.query(
    'SELECT id_modulo, clave, nombre, opcional, activo_por_defecto FROM modulos WHERE clave = ?',
    [clave]
  )

  return rows[0] || null
}

// Dice si una empresa tiene prendido un modulo. Lo usa el control de acceso,
// asi que resuelve el caso "sin fila" igual que findByEmpresa.
const estaActivo = async (id_empresa, clave) => {

  const [rows] = await db.query(`
    SELECT COALESCE(em.activo, m.activo_por_defecto) AS activo
    FROM modulos m
    LEFT JOIN empresa_modulos em
           ON em.id_modulo = m.id_modulo AND em.id_empresa = ?
    WHERE m.clave = ?
  `, [id_empresa, clave])

  return rows.length > 0 && rows[0].activo === 1
}

// Prende o apaga un modulo para una empresa. Como puede no existir todavia la
// fila, se inserta y si ya estaba se actualiza.
const setActivo = async (id_empresa, id_modulo, activo) => {

  await db.query(`
    INSERT INTO empresa_modulos (id_empresa, id_modulo, activo)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE activo = VALUES(activo)
  `, [id_empresa, id_modulo, activo])
}

// Deja escritas las filas de la empresa con el valor por defecto del catalogo.
// Hasta ahora el estado se deducia del catalogo; al aprobarla se materializa,
// asi la configuracion de cada empresa queda fija y no cambia sola si mañana
// se toca un valor por defecto del sistema.
// El IGNORE es la red: si ya tenia filas, no se pisa lo que eligio.
const activarPorDefecto = async (id_empresa) => {

  await db.query(`
    INSERT IGNORE INTO empresa_modulos (id_empresa, id_modulo, activo)
    SELECT ?, id_modulo, activo_por_defecto FROM modulos
  `, [id_empresa])
}

module.exports = { findByEmpresa, findByClave, estaActivo, setActivo, activarPorDefecto }
