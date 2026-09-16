const db = require('../config/db')

// Movimientos de stock y existencias.
//
// La existencia NO esta guardada en ninguna columna: se calcula sumando los
// movimientos no anulados, sumando los de motivo "entrada" y restando los de
// "salida". Por eso todas las consultas de existencia arrancan igual.

// El calculo del stock, escrito una sola vez. Se repite en varias consultas y
// si cada una lo escribiera a su manera, el dia que cambie una regla quedarian
// dando numeros distintos entre si.
const SUMA_STOCK = `
  COALESCE(SUM(CASE WHEN ms.anulado = 1 THEN 0
                    WHEN mo.efecto_stock = 'entrada' THEN ms.cantidad
                    ELSE -ms.cantidad END), 0)`

// Existencias de todos los productos de la empresa.
//
// Va con LEFT JOIN a proposito: un producto recien cargado no tiene ningun
// movimiento todavia y tiene que aparecer igual, en cero. Con JOIN comun
// desapareceria del listado justo cuando hay que cargarle la existencia inicial.
const findExistencias = async (id_empresa, filtros = {}) => {

  const condiciones = ['p.id_empresa = ?']
  const params = [id_empresa]

  if (filtros.soloActivos) condiciones.push('p.activo = 1')

  if (filtros.id_categoria_producto) {
    condiciones.push('p.id_categoria_producto = ?')
    params.push(filtros.id_categoria_producto)
  }

  if (filtros.busqueda) {
    const texto = `%${filtros.busqueda.replace(/[%_\\]/g, '\\$&')}%`
    condiciones.push('(p.nombre LIKE ? OR p.descripcion LIKE ?)')
    params.push(texto, texto)
  }

  const [rows] = await db.query(`
    SELECT p.id_producto, p.nombre, p.unidad_medida, p.stock_minimo, p.activo,
           c.nombre AS categoria_nombre,
           s.nombre AS subcategoria_nombre,
           ${SUMA_STOCK} AS existencia,
           -- Sirve para distinguir un producto que se quedo sin stock de otro
           -- al que todavia nadie le cargo nada. Los dos estan en cero, pero
           -- solo el primero es un problema.
           COUNT(ms.id_movimiento_stock) AS cantidad_movimientos
    FROM productos p
    JOIN categorias_producto c         ON c.id_categoria_producto = p.id_categoria_producto
    LEFT JOIN subcategorias_producto s ON s.id_subcategoria_producto = p.id_subcategoria_producto
    LEFT JOIN movimientos_stock ms     ON ms.id_producto = p.id_producto
    LEFT JOIN motivos_stock mo         ON mo.id_motivo_stock = ms.id_motivo_stock
    WHERE ${condiciones.join(' AND ')}
    GROUP BY p.id_producto
    ORDER BY p.nombre
  `, params)

  return rows
}

// Existencia de un solo producto. Se usa antes de registrar una salida, para
// no dejar el stock en negativo.
const existenciaDeProducto = async (id_producto, id_empresa) => {

  const [rows] = await db.query(`
    SELECT ${SUMA_STOCK} AS existencia
    FROM productos p
    LEFT JOIN movimientos_stock ms ON ms.id_producto = p.id_producto
    LEFT JOIN motivos_stock mo     ON mo.id_motivo_stock = ms.id_motivo_stock
    WHERE p.id_producto = ? AND p.id_empresa = ?
    GROUP BY p.id_producto
  `, [id_producto, id_empresa])

  return rows.length ? Number(rows[0].existencia) : 0
}

// Movimientos de stock de la empresa, con todo lo que la pantalla necesita ya
// resuelto: producto, motivo, su efecto y quien lo registro.
const findMovimientos = async (id_empresa, filtros = {}) => {

  const condiciones = ['ms.id_empresa = ?']
  const params = [id_empresa]

  if (filtros.id_producto) {
    condiciones.push('ms.id_producto = ?')
    params.push(filtros.id_producto)
  }
  if (filtros.id_motivo_stock) {
    condiciones.push('ms.id_motivo_stock = ?')
    params.push(filtros.id_motivo_stock)
  }
  if (filtros.efecto_stock) {
    condiciones.push('mo.efecto_stock = ?')
    params.push(filtros.efecto_stock)
  }
  if (filtros.desde) {
    condiciones.push('ms.fecha >= ?')
    params.push(filtros.desde)
  }
  if (filtros.hasta) {
    condiciones.push('ms.fecha <= ?')
    params.push(filtros.hasta)
  }

  const limite = filtros.limite ? 'LIMIT ?' : ''

  const [rows] = await db.query(`
    SELECT ms.id_movimiento_stock, ms.cantidad, ms.descripcion, ms.fecha,
           ms.anulado, ms.creado_en, ms.id_movimiento,
           p.id_producto, p.nombre AS producto_nombre, p.unidad_medida,
           mo.id_motivo_stock, mo.nombre AS motivo_nombre,
           mo.efecto_stock, mo.efecto_dinero,
           u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
    FROM movimientos_stock ms
    JOIN productos p      ON p.id_producto = ms.id_producto
    JOIN motivos_stock mo ON mo.id_motivo_stock = ms.id_motivo_stock
    JOIN usuarios u       ON u.id = ms.id_usuario
    WHERE ${condiciones.join(' AND ')}
    ORDER BY ms.fecha DESC, ms.id_movimiento_stock DESC
    ${limite}
  `, filtros.limite ? [...params, filtros.limite] : params)

  return rows
}

const createMovimiento = async ({ id_producto, id_motivo_stock, cantidad,
                                  descripcion, fecha, id_empresa, id_usuario }) => {

  const [result] = await db.query(`
    INSERT INTO movimientos_stock
      (id_producto, id_motivo_stock, cantidad, descripcion, fecha, id_empresa, id_usuario)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [id_producto, id_motivo_stock, cantidad, descripcion, fecha, id_empresa, id_usuario])

  return result.insertId
}

// Un movimiento de stock con todo lo que hace falta para decidir si se puede
// anular o si corresponde ofrecerle el movimiento de dinero.
const findMovimientoById = async (id_movimiento_stock, id_empresa) => {

  const [rows] = await db.query(`
    SELECT ms.id_movimiento_stock, ms.cantidad, ms.descripcion, ms.fecha,
           ms.anulado, ms.id_producto, ms.id_movimiento,
           p.nombre AS producto_nombre, p.unidad_medida,
           mo.nombre AS motivo_nombre, mo.efecto_stock, mo.efecto_dinero
    FROM movimientos_stock ms
    JOIN productos p      ON p.id_producto = ms.id_producto
    JOIN motivos_stock mo ON mo.id_motivo_stock = ms.id_motivo_stock
    WHERE ms.id_movimiento_stock = ? AND ms.id_empresa = ?
  `, [id_movimiento_stock, id_empresa])

  return rows[0] || null
}

// Ata el movimiento de stock con el movimiento de dinero que se genero a
// partir de el. Es lo que despues evita cargar la misma venta dos veces.
const vincularMovimientoDinero = async (id_movimiento_stock, id_empresa, id_movimiento) => {
  await db.query(
    'UPDATE movimientos_stock SET id_movimiento = ? WHERE id_movimiento_stock = ? AND id_empresa = ?',
    [id_movimiento, id_movimiento_stock, id_empresa]
  )
}

// Los movimientos de stock no se borran: se anulan. La existencia se recalcula
// sola porque sale de sumar los movimientos, y la suma ignora los anulados.
const anularMovimiento = async (id_movimiento_stock, id_empresa) => {
  await db.query(
    'UPDATE movimientos_stock SET anulado = 1 WHERE id_movimiento_stock = ? AND id_empresa = ?',
    [id_movimiento_stock, id_empresa]
  )
}

// Cuenta los movimientos de un motivo. Se usa para no dejar cambiar el efecto
// de un motivo que ya se uso: si "Venta" pasara de salida a entrada, todo el
// historial cargado con ese motivo se daria vuelta y el stock cambiaria solo.
const contarMovimientosDeMotivo = async (id_motivo_stock) => {

  const [rows] = await db.query(
    'SELECT COUNT(*) AS cantidad FROM movimientos_stock WHERE id_motivo_stock = ?',
    [id_motivo_stock]
  )

  return rows[0].cantidad
}

module.exports = {
  findExistencias, existenciaDeProducto, findMovimientos, findMovimientoById,
  createMovimiento, vincularMovimientoDinero, anularMovimiento,
  contarMovimientosDeMotivo
}
