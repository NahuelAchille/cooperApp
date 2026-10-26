const db = require('../config/db')

// Por que se mueve el stock: venta, compra, consumo, perdida, robo, ajuste.
// Cada motivo lleva su impacto configurado (que le hace al stock y que le hace
// al dinero), asi el administrador arma los suyos sin tocar codigo.
//
// Los que mueven plata llevan ademas el TIPO de movimiento de dinero donde cae
// esa plata (id_tipo). Es lo que deja registrar una venta sin elegir ninguna
// categoria: el motivo ya sabe a donde va el ingreso.

// Las columnas del motivo, con su tipo de dinero ya resuelto. El LEFT JOIN es
// porque casi todos los motivos no mueven plata y no tienen tipo.
const COLUMNAS = `
  ms.id_motivo_stock, ms.nombre, ms.efecto_stock, ms.efecto_dinero, ms.activo,
  ms.id_tipo, t.nombre AS tipo_nombre, c.nombre AS tipo_categoria_nombre,
  (t.activo = 1 AND c.activo = 1) AS tipo_activo`

const UNIONES = `
  LEFT JOIN tipos_movimiento t      ON t.id_tipo = ms.id_tipo
  LEFT JOIN categorias_movimiento c ON c.id_categoria = t.id_categoria`

const findMotivos = async (id_empresa, { soloActivos = false } = {}) => {

  const [rows] = await db.query(`
    SELECT ${COLUMNAS}
    FROM motivos_stock ms
    ${UNIONES}
    WHERE ms.id_empresa = ? ${soloActivos ? 'AND ms.activo = 1' : ''}
    ORDER BY ms.efecto_stock, ms.nombre
  `, [id_empresa])

  return rows
}

// Busca un motivo propio de la empresa (sirve para validar pertenencia).
const findMotivoById = async (id_motivo_stock, id_empresa) => {

  const [rows] = await db.query(`
    SELECT ${COLUMNAS}
    FROM motivos_stock ms
    ${UNIONES}
    WHERE ms.id_motivo_stock = ? AND ms.id_empresa = ?
  `, [id_motivo_stock, id_empresa])

  return rows[0] || null
}

const createMotivo = async ({ nombre, efecto_stock, efecto_dinero, id_tipo = null, id_empresa }) => {

  const [result] = await db.query(
    'INSERT INTO motivos_stock (nombre, efecto_stock, efecto_dinero, id_tipo, id_empresa) VALUES (?, ?, ?, ?, ?)',
    [nombre, efecto_stock, efecto_dinero, id_tipo, id_empresa]
  )

  return result.insertId
}

const updateMotivo = async (id_motivo_stock, id_empresa, { nombre, efecto_stock, efecto_dinero, id_tipo = null }) => {

  await db.query(`
    UPDATE motivos_stock
    SET nombre = ?, efecto_stock = ?, efecto_dinero = ?, id_tipo = ?
    WHERE id_motivo_stock = ? AND id_empresa = ?
  `, [nombre, efecto_stock, efecto_dinero, id_tipo, id_motivo_stock, id_empresa])
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

// Busca un tipo de dinero de la empresa por los nombres de su categoria y el
// suyo. Lo usa la carga inicial, que conoce los tipos por nombre y no por id.
// Si no lo encuentra devuelve null: el motivo queda sin tipo y el admin lo
// elige despues, que es mejor que no poder aprobar la empresa.
const findIdTipoPorNombre = async (id_empresa, nombreCategoria, nombreTipo) => {

  const [rows] = await db.query(`
    SELECT t.id_tipo
    FROM tipos_movimiento t
    JOIN categorias_movimiento c ON c.id_categoria = t.id_categoria
    WHERE c.id_empresa = ? AND c.nombre = ? AND t.nombre = ?
  `, [id_empresa, nombreCategoria, nombreTipo])

  return rows.length ? rows[0].id_tipo : null
}

// Carga los motivos con los que arranca la empresa. Recibe la lista desde
// config/datos-iniciales.
const crearMotivosIniciales = async (id_empresa, motivos) => {

  for (const { tipo, ...motivo } of motivos) {
    const id_tipo = tipo ? await findIdTipoPorNombre(id_empresa, tipo.categoria, tipo.nombre) : null
    await createMotivo({ ...motivo, id_tipo, id_empresa })
  }
}

module.exports = {
  findMotivos, findMotivoById, createMotivo, updateMotivo, setActivoMotivo,
  contarMotivos, crearMotivosIniciales
}
