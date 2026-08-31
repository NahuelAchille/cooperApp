const db = require('../config/db')

// Arma la clausula WHERE y sus parametros a partir de los filtros opcionales.
// Se reutiliza en el listado y en el resumen para que ambos filtren igual.
const construirFiltro = (id_cooperativa, filtros = {}) => {

  const condiciones = ['m.id_cooperativa = ?']
  const params = [id_cooperativa]

  // Por defecto los anulados no se muestran; hay que pedirlos explicitamente.
  if (!filtros.incluirAnulados) condiciones.push('m.anulado = 0')

  if (filtros.naturaleza) {
    condiciones.push('c.naturaleza = ?')
    params.push(filtros.naturaleza)
  }
  if (filtros.id_categoria) {
    condiciones.push('c.id_categoria = ?')
    params.push(filtros.id_categoria)
  }
  if (filtros.id_tipo) {
    condiciones.push('m.id_tipo = ?')
    params.push(filtros.id_tipo)
  }
  if (filtros.desde) {
    condiciones.push('m.fecha >= ?')
    params.push(filtros.desde)
  }
  if (filtros.hasta) {
    condiciones.push('m.fecha <= ?')
    params.push(filtros.hasta)
  }

  return { where: condiciones.join(' AND '), params }
}

// Listado de movimientos ya resuelto: cada fila trae el tipo, su categoria,
// la naturaleza y quien lo cargo, listo para mostrar sin mas joins.
const findByCoop = async (id_cooperativa, filtros = {}) => {

  const { where, params } = construirFiltro(id_cooperativa, filtros)

  const [rows] = await db.query(`
    SELECT m.id_movimiento, m.monto, m.descripcion, m.fecha, m.anulado, m.creado_en,
           t.id_tipo, t.nombre AS tipo_nombre,
           c.id_categoria, c.nombre AS categoria_nombre, c.naturaleza,
           u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
    FROM movimientos m
    JOIN tipos_movimiento t      ON t.id_tipo = m.id_tipo
    JOIN categorias_movimiento c ON c.id_categoria = t.id_categoria
    JOIN usuarios u              ON u.id = m.id_usuario
    WHERE ${where}
    ORDER BY m.fecha DESC, m.id_movimiento DESC
  `, params)

  return rows
}

const findById = async (id_movimiento, id_cooperativa) => {

  const [rows] = await db.query(`
    SELECT m.id_movimiento, m.monto, m.descripcion, m.fecha, m.anulado, m.id_tipo
    FROM movimientos m
    WHERE m.id_movimiento = ? AND m.id_cooperativa = ?
  `, [id_movimiento, id_cooperativa])

  return rows[0] || null
}

const create = async ({ id_tipo, monto, descripcion, fecha, id_cooperativa, id_usuario }) => {

  const [result] = await db.query(`
    INSERT INTO movimientos (id_tipo, monto, descripcion, fecha, id_cooperativa, id_usuario)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [id_tipo, monto, descripcion || null, fecha, id_cooperativa, id_usuario])

  return result.insertId
}

// Los movimientos no se borran: se marcan como anulados (baja logica).
const anular = async (id_movimiento, id_cooperativa) => {
  await db.query(
    'UPDATE movimientos SET anulado = 1 WHERE id_movimiento = ? AND id_cooperativa = ?',
    [id_movimiento, id_cooperativa]
  )
}

// Totales de ingresos, egresos y balance, respetando los mismos filtros que
// el listado. Ignora siempre los anulados.
const resumen = async (id_cooperativa, filtros = {}) => {

  const { where, params } = construirFiltro(id_cooperativa, { ...filtros, incluirAnulados: false })

  const [rows] = await db.query(`
    SELECT
      COALESCE(SUM(CASE WHEN c.naturaleza = 'ingreso' THEN m.monto ELSE 0 END), 0) AS total_ingresos,
      COALESCE(SUM(CASE WHEN c.naturaleza = 'egreso'  THEN m.monto ELSE 0 END), 0) AS total_egresos
    FROM movimientos m
    JOIN tipos_movimiento t      ON t.id_tipo = m.id_tipo
    JOIN categorias_movimiento c ON c.id_categoria = t.id_categoria
    WHERE ${where}
  `, params)

  const totalIngresos = Number(rows[0].total_ingresos)
  const totalEgresos = Number(rows[0].total_egresos)

  return {
    total_ingresos: totalIngresos,
    total_egresos: totalEgresos,
    balance: totalIngresos - totalEgresos
  }
}

module.exports = { findByCoop, findById, create, anular, resumen }
