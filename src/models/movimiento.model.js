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

// Cuanto deja cada servicio en un periodo (HU-49).
//
// El resumen de arriba contesta "cuanto entro y cuanto salio en total"; este
// contesta "de esto, que parte trajo cada servicio". Puestos uno al lado del
// otro se puede comparar, que es lo que hace falta para decidir cual sostener
// y cual no. Filtrando de a un servicio por vez eso no se ve.
//
// Arranca de PRODUCTOS y no de movimientos, con LEFT JOIN, a proposito: un
// servicio que en el periodo no movio un peso tiene que aparecer igual, en
// cero. Es justamente el que hay que mirar. Con un JOIN comun desapareceria
// del listado, que es como decir que anduvo bien.
//
// Las fechas van en el ON y no en el WHERE por lo mismo: en el WHERE
// descartarian las filas sin movimientos, que es lo que el LEFT JOIN trajo.
//
// Sobre los filtros: toma SOLO el periodo. Aplicarle el de naturaleza daria
// un resultado mentiroso -- con "Solo lo que entro" mostraria egresos en cero
// y cada servicio pareceria pura ganancia. Un resultado necesita los dos
// lados o no es un resultado.
const resumenPorServicio = async (id_empresa, { desde, hasta } = {}) => {

  const condicionesMov = ['m.id_servicio = p.id_producto', 'm.id_empresa = ?', 'm.anulado = 0']
  const params = [id_empresa]

  if (desde) { condicionesMov.push('m.fecha >= ?'); params.push(desde) }
  if (hasta) { condicionesMov.push('m.fecha <= ?'); params.push(hasta) }

  params.push(id_empresa)   // el de la clausula WHERE, sobre productos

  const [rows] = await db.query(`
    SELECT p.id_producto AS id_servicio, p.nombre, p.activo,
           COALESCE(SUM(CASE WHEN c.naturaleza = 'ingreso' THEN m.monto ELSE 0 END), 0) AS total_ingresos,
           COALESCE(SUM(CASE WHEN c.naturaleza = 'egreso'  THEN m.monto ELSE 0 END), 0) AS total_egresos,
           COUNT(m.id_movimiento) AS cantidad
    FROM productos p
    LEFT JOIN movimientos m           ON ${condicionesMov.join(' AND ')}
    LEFT JOIN tipos_movimiento t      ON t.id_tipo = m.id_tipo
    LEFT JOIN categorias_movimiento c ON c.id_categoria = t.id_categoria
    WHERE p.id_empresa = ? AND p.es_servicio = 1
    GROUP BY p.id_producto
    -- Un servicio dado de baja solo aparece si en el periodo movio algo: su
    -- plata es real y tiene que estar en la comparacion. Si no movio nada, es
    -- ruido -- ya no se presta.
    HAVING p.activo = 1 OR cantidad > 0
    -- Lo que mas deja, primero: la pregunta es cual conviene sostener.
    ORDER BY (COALESCE(SUM(CASE WHEN c.naturaleza = 'ingreso' THEN m.monto ELSE 0 END), 0)
            - COALESCE(SUM(CASE WHEN c.naturaleza = 'egreso'  THEN m.monto ELSE 0 END), 0)) DESC,
             p.nombre
  `, params)

  return rows.map(fila => {
    const ingresos = Number(fila.total_ingresos)
    const egresos = Number(fila.total_egresos)
    return {
      id_servicio: fila.id_servicio,
      nombre: fila.nombre,
      activo: fila.activo,
      cantidad: Number(fila.cantidad),
      total_ingresos: ingresos,
      total_egresos: egresos,
      resultado: ingresos - egresos
    }
  })
}

module.exports = { findByEmpresa, findById, create, anular, resumen, resumenPorServicio }
