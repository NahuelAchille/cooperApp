const db = require('../config/db')

const findByEmail = async (email) => {

  const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email])
  return rows[0] || null

}

const findByDni = async (dni) => {

  const [rows] = await db.query('SELECT id FROM usuarios WHERE dni = ?', [dni])
  return rows[0] || null

}

const findByEmailWithContext = async (email) => {

  const [rows] = await db.query(`
    SELECT
      u.id, u.nombre, u.apellido, u.email, u.password_hash, u.activo, u.debe_cambiar_password,
      c.id_empresa, c.nombre AS empresa_nombre, c.estado AS empresa_estado,
      r.id_rol, r.nombre AS rol
    FROM usuarios u
    LEFT JOIN empresas c ON u.id_empresa = c.id_empresa
    JOIN roles r ON u.id_rol = r.id_rol
    WHERE u.email = ?
  `, [email])

  return rows[0] || null
}

const create = async ({ nombre, apellido, email, password_hash, dni, fecha_nacimiento, domicilio, codigo_postal, id_rol, id_empresa }) => {

  const [result] = await db.query(
    `INSERT INTO usuarios (nombre, apellido, email, password_hash, dni, fecha_nacimiento, domicilio, codigo_postal, id_rol, id_empresa)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre, apellido, email, password_hash, dni, fecha_nacimiento || null, domicilio || null, codigo_postal || null, id_rol, id_empresa]
  )

  return result.insertId
}

const createInterno = async ({ nombre, apellido, email, password_hash, dni, id_rol, id_empresa, debe_cambiar_password }) => {

  const [result] = await db.query(
    `INSERT INTO usuarios (nombre, apellido, email, password_hash, dni, id_rol, id_empresa, debe_cambiar_password)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre, apellido, email, password_hash, dni, id_rol, id_empresa, debe_cambiar_password]
  )

  return result.insertId
}

const findByEmpresa = async (id_empresa) => {

  const [rows] = await db.query(`
    SELECT u.id, u.nombre, u.apellido, u.email, u.dni, u.activo, u.fecha_registro, u.debe_cambiar_password,
           u.id_rol, r.nombre AS rol
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id_rol
    WHERE u.id_empresa = ?
    ORDER BY u.fecha_registro DESC
  `, [id_empresa])

  return rows
}

const updatePassword = async (id, hashedPassword) => {

  await db.query(
    'UPDATE usuarios SET password_hash = ?, debe_cambiar_password = 0 WHERE id = ?',
    [hashedPassword, id]
  )

}

// Busca otro usuario que ya use ese email, sin contar al propio
const findByEmailExcluyendo = async (email, id) => {

  const [rows] = await db.query('SELECT id FROM usuarios WHERE email = ? AND id <> ?', [email, id])
  return rows[0] || null

}

const findByDniExcluyendo = async (dni, id) => {

  const [rows] = await db.query('SELECT id FROM usuarios WHERE dni = ? AND id <> ?', [dni, id])
  return rows[0] || null

}

const update = async (id, { nombre, apellido, email, dni, id_rol }) => {

  await db.query(
    'UPDATE usuarios SET nombre = ?, apellido = ?, email = ?, dni = ?, id_rol = ? WHERE id = ?',
    [nombre, apellido, email, dni, id_rol, id]
  )

}

// Baja y alta logica: el registro nunca se borra
const setActivo = async (id, activo) => {

  await db.query('UPDATE usuarios SET activo = ? WHERE id = ?', [activo, id])

}

// Vuelve a poner la contraseña temporal y obliga a cambiarla en el proximo ingreso
const resetPassword = async (id, hashedPassword) => {

  await db.query(
    'UPDATE usuarios SET password_hash = ?, debe_cambiar_password = 1 WHERE id = ?',
    [hashedPassword, id]
  )

}

const findById = async (id) => {

  const [rows] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id])
  
  return rows[0] || null
}

// Estado actual del usuario y de su empresa. Lo consulta el control de sesion
// en cada pedido: la sesion guarda una foto del momento del login, y entre
// medio al usuario lo pueden dar de baja o suspender su empresa.
const estadoDeSesion = async (id) => {

  const [rows] = await db.query(`
    SELECT u.activo, u.debe_cambiar_password, e.estado AS empresa_estado
    FROM usuarios u
    LEFT JOIN empresas e ON e.id_empresa = u.id_empresa
    WHERE u.id = ?
  `, [id])

  return rows[0] || null
}

module.exports = { estadoDeSesion, findByEmail, findByDni, findByEmailExcluyendo, findByDniExcluyendo, findByEmailWithContext, create, createInterno, findByEmpresa, update, setActivo, updatePassword, resetPassword, findById }
