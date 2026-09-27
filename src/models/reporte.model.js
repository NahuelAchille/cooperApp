const db = require('../config/db')

// Reportes: lo mismo que ya se ve en pantalla, pero armado para LEER y para
// MOSTRARLE a alguien, no para operar.
//
// La diferencia con el listado de movimientos no es cosmetica. El listado es
// la pantalla de trabajo: se carga, se corrige, se anula. Un reporte se mira,
// se imprime y se manda: no lleva botones, no incluye lo anulado, y sus
// totales tienen que cerrar con lo que se ve, porque es lo unico que el que
// lo recibe puede verificar.

// Movimientos de dinero de un periodo, con su clasificacion ya resuelta.
//
// NO incluye los anulados. Un movimiento anulado es uno que no paso: si
// apareciera, el que lee el reporte tendria que restarlo a mano, y si ademas
// sumara en los totales el reporte estaria mintiendo. Se cuentan aparte
// (contarAnulados) para poder decir cuantos quedaron afuera, que es distinto
// de esconderlos.
const movimientosDelPeriodo = async (id_empresa, { desde, hasta } = {}) => {

  const condiciones = ['m.id_empresa = ?', 'm.anulado = 0']
  const params = [id_empresa]

  if (desde) { condiciones.push('m.fecha >= ?'); params.push(desde) }
  if (hasta) { condiciones.push('m.fecha <= ?'); params.push(hasta) }

  const [rows] = await db.query(`
    SELECT m.id_movimiento, m.monto, m.descripcion, m.fecha,
           t.nombre AS tipo_nombre,
           c.id_categoria, c.nombre AS categoria_nombre, c.naturaleza,
           sv.nombre AS servicio_nombre
    FROM movimientos m
    JOIN tipos_movimiento t      ON t.id_tipo = m.id_tipo
    JOIN categorias_movimiento c ON c.id_categoria = t.id_categoria
    LEFT JOIN productos sv       ON sv.id_producto = m.id_servicio
    WHERE ${condiciones.join(' AND ')}
    ORDER BY m.fecha, m.id_movimiento
  `, params)

  return rows
}

// Cuantos movimientos del periodo quedaron afuera por estar anulados.
//
// Existe para que el reporte pueda decirlo. Un total que no cierra con lo que
// la persona recuerda haber cargado necesita una explicacion: sin esto, la
// unica lectura posible es que el sistema perdio algo.
const contarAnulados = async (id_empresa, { desde, hasta } = {}) => {

  const condiciones = ['m.id_empresa = ?', 'm.anulado = 1']
  const params = [id_empresa]

  if (desde) { condiciones.push('m.fecha >= ?'); params.push(desde) }
  if (hasta) { condiciones.push('m.fecha <= ?'); params.push(hasta) }

  const [rows] = await db.query(
    `SELECT COUNT(*) AS cantidad FROM movimientos m WHERE ${condiciones.join(' AND ')}`,
    params
  )

  return Number(rows[0].cantidad)
}

// El orden cronologico es el del reporte: se lee de la fecha mas vieja a la
// mas nueva, al reves que el listado de trabajo, donde lo ultimo cargado va
// arriba porque es lo que se acaba de tocar.

module.exports = { movimientosDelPeriodo, contarAnulados }
