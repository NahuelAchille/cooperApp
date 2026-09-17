const db = require('../config/db')

// Arma la clausula WHERE y sus parametros a partir de los filtros opcionales.
// Se reutiliza en el listado y en el resumen para que ambos filtren igual.
const construirFiltro = (id_empresa, filtros = {}) => {

  const condiciones = ['m.id_empresa = ?']
  const params = [id_empresa]

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
  // De donde salio la plata. Como el resumen usa este mismo filtro, pedir un
  // servicio da directamente sus ingresos, sus egresos y lo que deja.
  if (filtros.id_servicio) {
    condiciones.push('m.id_servicio = ?')
    params.push(filtros.id_servicio)
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
const findByEmpresa = async (id_empresa, filtros = {}) => {

  const { where, params } = construirFiltro(id_empresa, filtros)

  // El limite se agrega solo si el controlador lo valido como entero positivo.
  const limite = filtros.limite ? 'LIMIT ?' : ''
  if (filtros.limite) params.push(filtros.limite)

  const [rows] = await db.query(`
    SELECT m.id_movimiento, m.monto, m.descripcion, m.fecha, m.anulado, m.creado_en,
           t.id_tipo, t.nombre AS tipo_nombre,
           c.id_categoria, c.nombre AS categoria_nombre, c.naturaleza,
           u.nombre AS usuario_nombre, u.apellido AS usuario_apellido,
           m.id_servicio, sv.nombre AS servicio_nombre
    FROM movimientos m
    JOIN tipos_movimiento t      ON t.id_tipo = m.id_tipo
    JOIN categorias_movimiento c ON c.id_categoria = t.id_categoria
    JOIN usuarios u              ON u.id = m.id_usuario
    -- LEFT JOIN: el servicio es opcional y casi siempre va vacio. Con un JOIN
    -- comun desapareceria del listado todo lo que no viene de un servicio,
    -- que es la mayor parte del historial.
    LEFT JOIN productos sv       ON sv.id_producto = m.id_servicio
    WHERE ${where}
    ORDER BY m.fecha DESC, m.id_movimiento DESC
    ${limite}
  `, params)

  return rows
}

const findById = async (id_movimiento, id_empresa) => {

  const [rows] = await db.query(`
    SELECT m.id_movimiento, m.monto, m.descripcion, m.fecha, m.anulado, m.id_tipo
    FROM movimientos m
    WHERE m.id_movimiento = ? AND m.id_empresa = ?
  `, [id_movimiento, id_empresa])

  return rows[0] || null
}

// El "ejecutor" es normalmente el pool. El alta que sale de una venta de stock
// le pasa la conexion de su transaccion, para que el movimiento de dinero y su
// vinculo con el stock entren juntos o no entre ninguno.
const create = async ({ id_tipo, monto, descripcion, fecha, id_empresa, id_usuario,
                        id_servicio = null }, ejecutor = db) => {

  const [result] = await ejecutor.query(`
    INSERT INTO movimientos (id_tipo, monto, descripcion, fecha, id_empresa, id_usuario, id_servicio)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [id_tipo, monto, descripcion || null, fecha, id_empresa, id_usuario, id_servicio])

  return result.insertId
}

// Los movimientos no se borran: se marcan como anulados (baja logica).
const anular = async (id_movimiento, id_empresa) => {
  await db.query(
    'UPDATE movimientos SET anulado = 1 WHERE id_movimiento = ? AND id_empresa = ?',
    [id_movimiento, id_empresa]
  )
}

// Totales de ingresos, egresos y balance, respetando los mismos filtros que
// el listado. Ignora siempre los anulados.
const resumen = async (id_empresa, filtros = {}) => {

  const { where, params } = construirFiltro(id_empresa, { ...filtros, incluirAnulados: false })

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

module.exports = { findByEmpresa, findById, create, anular, resumen }
