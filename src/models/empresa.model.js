const db = require('../config/db')

const findByEmail = async (email) => {
  const [rows] = await db.query('SELECT id_empresa FROM empresas WHERE email = ?', [email])
  return rows[0] || null
}

const findByCuit = async (cuit) => {
  const [rows] = await db.query('SELECT id_empresa FROM empresas WHERE cuit = ?', [cuit])
  return rows[0] || null
}

const findByMatricula = async (matricula) => {
  const [rows] = await db.query('SELECT id_empresa FROM empresas WHERE matricula = ?', [matricula])
  return rows[0] || null
}

const create = async ({ nombre, email, cuit, matricula, federacion, domicilio }) => {

  const [result] = await db.query(
    `INSERT INTO empresas (nombre, email, cuit, matricula, federacion, domicilio, estado)
     VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
    [nombre, email, cuit, matricula, federacion || null, domicilio || null]
  )

  return result.insertId
}

// Alta de la empresa y de su administrador EN UNA SOLA OPERACION.
//
// Antes se hacian por separado: si el alta del usuario fallaba (o se cortaba
// la conexion en el medio), quedaba una empresa sin ningun administrador, y
// como el email, el CUIT y la matricula son unicos, la persona ya no podia
// volver a registrarse. Peor todavia si el superadmin la aprobaba: una empresa
// activa a la que nadie podia entrar nunca.
//
// Con la transaccion, o entran las dos filas o no entra ninguna.
const createConAdmin = async (empresa, admin) => {

  const conexion = await db.getConnection()

  try {
    await conexion.beginTransaction()

    const [resultadoEmpresa] = await conexion.query(
      `INSERT INTO empresas (nombre, email, cuit, matricula, federacion, domicilio, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
      [empresa.nombre, empresa.email, empresa.cuit, empresa.matricula,
       empresa.federacion || null, empresa.domicilio || null]
    )

    const id_empresa = resultadoEmpresa.insertId

    await conexion.query(
      `INSERT INTO usuarios (nombre, apellido, email, password_hash, dni, id_rol, id_empresa)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [admin.nombre, admin.apellido, admin.email, admin.password_hash,
       admin.dni, admin.id_rol, id_empresa]
    )

    await conexion.commit()
    return id_empresa

  } catch (error) {
    await conexion.rollback()
    throw error

  } finally {
    conexion.release()
  }
}

const findPendientes = async () => {

  const [rows] = await db.query(`
    SELECT c.id_empresa, c.nombre, c.email, c.cuit, c.matricula, c.federacion, c.domicilio, c.estado,
           u.nombre AS admin_nombre, u.apellido AS admin_apellido, u.email AS admin_email
    FROM empresas c
    LEFT JOIN usuarios u ON u.id_empresa = c.id_empresa AND u.id_rol = 1
    WHERE c.estado = 'pendiente'
    ORDER BY c.id_empresa DESC
  `)

  return rows
}

const findAll = async () => {

  const [rows] = await db.query(`
    SELECT c.id_empresa, c.nombre, c.email, c.cuit, c.matricula, c.estado,
           (SELECT COUNT(*) FROM usuarios u WHERE u.id_empresa = c.id_empresa) AS cantidad_usuarios,
           adm.id AS admin_id, adm.nombre AS admin_nombre, adm.apellido AS admin_apellido, adm.email AS admin_email
    FROM empresas c
    LEFT JOIN usuarios adm ON adm.id_empresa = c.id_empresa AND adm.id_rol = 1
    ORDER BY c.id_empresa DESC
  `)

  return rows
}

const findById = async (id_empresa) => {

  const [rows] = await db.query(`
    SELECT id_empresa, nombre, email, cuit, matricula, federacion, domicilio,
           cantidadTrabajadores, cantidadDiversidad, cantidadHombre, cantidadMujer, estado
    FROM empresas
    WHERE id_empresa = ?
  `, [id_empresa])

  return rows[0] || null
}

// Busca otra empresa que ya use ese email, sin contar la propia
const findByEmailExcluyendo = async (email, id_empresa) => {

  const [rows] = await db.query(
    'SELECT id_empresa FROM empresas WHERE email = ? AND id_empresa <> ?',
    [email, id_empresa]
  )

  return rows[0] || null
}

const update = async (id_empresa, { nombre, email, federacion, domicilio, cantidadTrabajadores, cantidadDiversidad, cantidadHombre, cantidadMujer }) => {

  await db.query(`
    UPDATE empresas
    SET nombre = ?, email = ?, federacion = ?, domicilio = ?,
        cantidadTrabajadores = ?, cantidadDiversidad = ?, cantidadHombre = ?, cantidadMujer = ?
    WHERE id_empresa = ?
  `, [nombre, email, federacion, domicilio, cantidadTrabajadores, cantidadDiversidad, cantidadHombre, cantidadMujer, id_empresa])
}

const updateEstado = async (id_empresa, estado) => {
  await db.query('UPDATE empresas SET estado = ? WHERE id_empresa = ?', [estado, id_empresa])
}

const activarUsuarioAdmin = async (id_empresa) => {
  await db.query('UPDATE usuarios SET activo = 1 WHERE id_empresa = ? AND id_rol = 1', [id_empresa])
}

module.exports = { createConAdmin, findByEmail, findByCuit, findByMatricula, create, findPendientes, findAll, findById, findByEmailExcluyendo, update, updateEstado, activarUsuarioAdmin }
