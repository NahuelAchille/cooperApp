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

// =====================================================================
// AGRUPADOS (HU-52)
// =====================================================================
//
// El reporte por periodo contesta "cuanto entro y cuanto salio". Estos
// contestan "de donde". Son el mismo periodo mirado por otro lado, asi que
// sus totales tienen que dar lo mismo que los de arriba -- y por eso los tres
// arrancan del mismo universo de filas: los movimientos no anulados del
// periodo.

// Cuanto movio cada CATEGORIA del dinero.
//
// Es el unico de los tres que no depende de ningun otro modulo: toda empresa
// clasifica su dinero, aunque no use productos ni servicios. Por eso es el
// que se muestra primero.
//
// Arranca de las categorias, con LEFT JOIN, por lo mismo que el resumen por
// servicio: una categoria que en el periodo no movio nada tiene que aparecer
// igual, en cero. Es informacion -- "el mes pasado no vendimos nada de esto".
const porCategoria = async (id_empresa, { desde, hasta } = {}) => {

  const condicionesMov = ['m.id_tipo = t.id_tipo', 'm.id_empresa = ?', 'm.anulado = 0']
  const params = [id_empresa]

  if (desde) { condicionesMov.push('m.fecha >= ?'); params.push(desde) }
  if (hasta) { condicionesMov.push('m.fecha <= ?'); params.push(hasta) }

  params.push(id_empresa)

  const [rows] = await db.query(`
    SELECT c.id_categoria, c.nombre, c.naturaleza, c.activo,
           COALESCE(SUM(m.monto), 0) AS total,
           COUNT(m.id_movimiento) AS cantidad
    FROM categorias_movimiento c
    -- LEFT JOIN tambien a los tipos, no solo a los movimientos. Con un JOIN
    -- comun, una categoria recien creada -- que todavia no tiene ningun tipo
    -- colgado -- desaparecia del reporte, mientras que una CON tipos y sin
    -- movimientos aparecia en cero. Dos categorias igual de vacias se trataban
    -- distinto por un detalle de como esta escrita la consulta, no por una
    -- decision. Ahora las dos aparecen en cero.
    LEFT JOIN tipos_movimiento t ON t.id_categoria = c.id_categoria
    LEFT JOIN movimientos m ON ${condicionesMov.join(' AND ')}
    WHERE c.id_empresa = ?
    GROUP BY c.id_categoria
    -- Una categoria dada de baja solo aparece si en el periodo movio algo: su
    -- plata es real. Si no movio nada es ruido, porque ya no se usa.
    HAVING c.activo = 1 OR cantidad > 0
    ORDER BY c.naturaleza, total DESC, c.nombre
  `, params)

  return rows
}

// Cuanto movio cada PRODUCTO.
//
// OJO, esto es distinto de los otros dos: un movimiento de dinero NO apunta a
// un producto. El camino es al reves -- el movimiento de STOCK es el que
// apunta al producto, y a veces tiene colgado un movimiento de dinero
// (movimientos_stock.id_movimiento). Se llega a la plata subiendo por ahi.
//
// La consecuencia hay que decirla, no esconderla: **hay movimientos de stock
// sin plata cargada**. El sistema no conoce los precios, asi que el
// movimiento de dinero se OFRECE y la persona puede decir que no (queda
// marcado "Falta el $"). Un reporte que muestre solo la plata registrada
// estaria contando una parte y pareciendo el total, asi que se devuelve
// tambien cuantos movimientos quedaron sin valorizar.
const porProducto = async (id_empresa, { desde, hasta } = {}) => {

  const condicionesMs = ['ms.id_producto = p.id_producto', 'ms.id_empresa = ?', 'ms.anulado = 0']
  const params = [id_empresa]

  if (desde) { condicionesMs.push('ms.fecha >= ?'); params.push(desde) }
  if (hasta) { condicionesMs.push('ms.fecha <= ?'); params.push(hasta) }

  params.push(id_empresa)

  const [rows] = await db.query(`
    SELECT p.id_producto, p.nombre, p.unidad_medida, p.activo,
           -- Las cantidades salen del motivo, igual que la existencia.
           COALESCE(SUM(CASE WHEN mo.efecto_stock = 'entrada' THEN ms.cantidad ELSE 0 END), 0) AS entradas,
           COALESCE(SUM(CASE WHEN mo.efecto_stock = 'salida'  THEN ms.cantidad ELSE 0 END), 0) AS salidas,
           -- La plata, solo la que de verdad quedo registrada y sigue vigente:
           -- un movimiento de dinero anulado no cuenta, aunque el de stock siga.
           COALESCE(SUM(CASE WHEN m.anulado = 0 AND c.naturaleza = 'ingreso' THEN m.monto ELSE 0 END), 0) AS cobrado,
           COALESCE(SUM(CASE WHEN m.anulado = 0 AND c.naturaleza = 'egreso'  THEN m.monto ELSE 0 END), 0) AS pagado,
           COUNT(ms.id_movimiento_stock) AS movimientos,
           -- Los que movieron mercaderia y NO tienen plata cargada. Se cuentan
           -- solo los motivos que SI mueven plata: una perdida no tiene que
           -- aparecer como "falta cargar", porque no le falta nada.
           SUM(CASE WHEN ms.id_movimiento_stock IS NOT NULL
                     AND mo.efecto_dinero <> 'ninguno'
                     AND (m.id_movimiento IS NULL OR m.anulado = 1)
                    THEN 1 ELSE 0 END) AS sin_valorizar
    FROM productos p
    LEFT JOIN movimientos_stock ms     ON ${condicionesMs.join(' AND ')}
    LEFT JOIN motivos_stock mo         ON mo.id_motivo_stock = ms.id_motivo_stock
    LEFT JOIN movimientos m            ON m.id_movimiento = ms.id_movimiento
    LEFT JOIN tipos_movimiento t       ON t.id_tipo = m.id_tipo
    LEFT JOIN categorias_movimiento c  ON c.id_categoria = t.id_categoria
    WHERE p.id_empresa = ? AND p.es_servicio = 0
    GROUP BY p.id_producto
    HAVING p.activo = 1 OR movimientos > 0
    ORDER BY (COALESCE(SUM(CASE WHEN m.anulado = 0 AND c.naturaleza = 'ingreso' THEN m.monto ELSE 0 END), 0)
            - COALESCE(SUM(CASE WHEN m.anulado = 0 AND c.naturaleza = 'egreso'  THEN m.monto ELSE 0 END), 0)) DESC,
             p.nombre
  `, params)

  return rows
}

module.exports = { movimientosDelPeriodo, contarAnulados, porCategoria, porProducto }
