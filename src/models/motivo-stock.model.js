const db = require('../config/db')

// Por que se mueve el stock: venta, compra, consumo, perdida, robo, ajuste.
// Cada motivo lleva su impacto configurado (que le hace al stock y que le hace
// al dinero), asi el administrador arma los suyos sin tocar codigo.

const findMotivos = async (id_empresa, { soloActivos = false } = {}) => {

  const [rows] = await db.query(`
    SELECT id_motivo_stock, nombre, efecto_stock, efecto_dinero, activo
    FROM motivos_stock
    WHERE id_empresa = ? ${soloActivos ? 'AND activo = 1' : ''}
    ORDER BY efecto_stock, nombre
  `, [id_empresa])

  return rows
}

// Busca un motivo propio de la empresa (sirve para validar pertenencia).
const findMotivoById = async (id_motivo_stock, id_empresa) => {

  const [rows] = await db.query(`
    SELECT id_motivo_stock, nombre, efecto_stock, efecto_dinero, activo
    FROM motivos_stock
    WHERE id_motivo_stock = ? AND id_empresa = ?
  `, [id_motivo_stock, id_empresa])

  return rows[0] || null
}

const createMotivo = async ({ nombre, efecto_stock, efecto_dinero, id_empresa }) => {

  const [result] = await db.query(
    'INSERT INTO motivos_stock (nombre, efecto_stock, efecto_dinero, id_empresa) VALUES (?, ?, ?, ?)',
    [nombre, efecto_stock, efecto_dinero, id_empresa]
  )

  return result.insertId
}

const updateMotivo = async (id_motivo_stock, id_empresa, { nombre, efecto_stock, efecto_dinero }) => {

  await db.query(`
    UPDATE motivos_stock
    SET nombre = ?, efecto_stock = ?, efecto_dinero = ?
    WHERE id_motivo_stock = ? AND id_empresa = ?
  `, [nombre, efecto_stock, efecto_dinero, id_motivo_stock, id_empresa])
}

const setActivoMotivo = async (id_motivo_stock, id_empresa, activo) => {
  await db.query(
    'UPDATE motivos_stock SET activo = ? WHERE id_motivo_stock = ? AND id_empresa = ?',
    [activo, id_motivo_stock, id_empresa]
  )
}

// =====================================================================
// CARGA INICIAL (al aprobar una empresa)
// =====================================================================

// Sirve para no volver a sembrar encima de una empresa que ya armo los suyos.
const contarMotivos = async (id_empresa) => {

  const [rows] = await db.query(
    'SELECT COUNT(*) AS cantidad FROM motivos_stock WHERE id_empresa = ?',
    [id_empresa]
  )

  return rows[0].cantidad
}

// Carga los motivos con los que arranca la empresa. Recibe la lista desde
// config/datos-iniciales.
const crearMotivosIniciales = async (id_empresa, motivos) => {

  for (const motivo of motivos) {
    await createMotivo({ ...motivo, id_empresa })
  }
}

module.exports = {
  findMotivos, findMotivoById, createMotivo, updateMotivo, setActivoMotivo,
  contarMotivos, crearMotivosIniciales
}
