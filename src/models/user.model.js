const db = require('../config/db');

const findByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  return rows[0] || null;
};

const findByDni = async (dni) => {
  const [rows] = await db.query('SELECT id FROM usuarios WHERE dni = ?', [dni]);
  return rows[0] || null;
};

const findByEmailWithContext = async (email) => {
  const [rows] = await db.query(`
    SELECT
      u.id, u.nombre, u.apellido, u.email, u.contraseña, u.activo, u.debe_cambiar_password,
      c.id_cooperativa, c.nombre AS cooperativa_nombre, c.estado AS cooperativa_estado,
      r.id_rol, r.nombre AS rol
    FROM usuarios u
    LEFT JOIN cooperativas c ON u.id_cooperativa = c.id_cooperativa
    JOIN roles r ON u.id_rol = r.id_rol
    WHERE u.email = ?
  `, [email]);
  return rows[0] || null;
};

const create = async ({ nombre, apellido, email, contraseña, dni, fecha_nacimiento, domicilio, codigo_postal, id_rol, id_cooperativa }) => {
  const [result] = await db.query(
    `INSERT INTO usuarios (nombre, apellido, email, contraseña, dni, fecha_nacimiento, domicilio, codigo_postal, id_rol, id_cooperativa)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre, apellido, email, contraseña, dni, fecha_nacimiento || null, domicilio || null, codigo_postal || null, id_rol, id_cooperativa]
  );
  return result.insertId;
};

const createInterno = async ({ nombre, apellido, email, contraseña, dni, id_rol, id_cooperativa, debe_cambiar_password }) => {
  const [result] = await db.query(
    `INSERT INTO usuarios (nombre, apellido, email, contraseña, dni, id_rol, id_cooperativa, debe_cambiar_password)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre, apellido, email, contraseña, dni, id_rol, id_cooperativa, debe_cambiar_password]
  );
  return result.insertId;
};

const findByCooperativa = async (id_cooperativa) => {
  const [rows] = await db.query(`
    SELECT u.id, u.nombre, u.apellido, u.email, u.dni, u.activo, u.fecha_registro, u.debe_cambiar_password,
           r.nombre AS rol
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id_rol
    WHERE u.id_cooperativa = ?
    ORDER BY u.fecha_registro DESC
  `, [id_cooperativa]);
  return rows;
};

const updatePassword = async (id, hashedPassword) => {
  await db.query(
    'UPDATE usuarios SET contraseña = ?, debe_cambiar_password = 0 WHERE id = ?',
    [hashedPassword, id]
  );
};

const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
  return rows[0] || null;
};

module.exports = { findByEmail, findByDni, findByEmailWithContext, create, createInterno, findByCooperativa, updatePassword, findById };
