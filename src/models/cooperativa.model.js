const db = require('../config/db');

const findByEmail = async (email) => {
  const [rows] = await db.query('SELECT id_cooperativa FROM cooperativas WHERE email = ?', [email]);
  return rows[0] || null;
};

const findByCuit = async (cuit) => {
  const [rows] = await db.query('SELECT id_cooperativa FROM cooperativas WHERE cuit = ?', [cuit]);
  return rows[0] || null;
};

const findByMatricula = async (matricula) => {
  const [rows] = await db.query('SELECT id_cooperativa FROM cooperativas WHERE matricula = ?', [matricula]);
  return rows[0] || null;
};

const create = async ({ nombre, email, cuit, matricula, federacion, domicilio }) => {
  const [result] = await db.query(
    `INSERT INTO cooperativas (nombre, email, cuit, matricula, federacion, domicilio, estado)
     VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
    [nombre, email, cuit, matricula, federacion || null, domicilio || null]
  );
  return result.insertId;
};

const findPendientes = async () => {
  const [rows] = await db.query(`
    SELECT c.id_cooperativa, c.nombre, c.email, c.cuit, c.matricula, c.federacion, c.domicilio, c.estado,
           u.nombre AS admin_nombre, u.apellido AS admin_apellido, u.email AS admin_email
    FROM cooperativas c
    LEFT JOIN usuarios u ON u.id_cooperativa = c.id_cooperativa AND u.id_rol = 1
    WHERE c.estado = 'pendiente'
    ORDER BY c.id_cooperativa DESC
  `);
  return rows;
};

const findAll = async () => {
  const [rows] = await db.query(`
    SELECT c.id_cooperativa, c.nombre, c.email, c.cuit, c.matricula, c.estado,
           COUNT(u.id) AS cantidad_usuarios
    FROM cooperativas c
    LEFT JOIN usuarios u ON u.id_cooperativa = c.id_cooperativa
    GROUP BY c.id_cooperativa
    ORDER BY c.id_cooperativa DESC
  `);
  return rows;
};

const updateEstado = async (id_cooperativa, estado) => {
  await db.query('UPDATE cooperativas SET estado = ? WHERE id_cooperativa = ?', [estado, id_cooperativa]);
};

const activarUsuarioAdmin = async (id_cooperativa) => {
  await db.query('UPDATE usuarios SET activo = 1 WHERE id_cooperativa = ? AND id_rol = 1', [id_cooperativa]);
};

module.exports = { findByEmail, findByCuit, findByMatricula, create, findPendientes, findAll, updateEstado, activarUsuarioAdmin };
