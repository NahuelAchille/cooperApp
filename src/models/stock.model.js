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

  // Los servicios viven en la misma tabla que los productos, pero no tienen
  // existencia: no se guardan en ningun lado. Si entraran al listado
  // apareceria "Servicio técnico: 0, sin stock" y el aviso de reponer, que no
  // significa nada.
  const condiciones = ['p.id_empresa = ?', 'p.es_servicio = 0']
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
           --
           -- Cuenta solo los NO anulados, igual que la suma de arriba: si no,
           -- un movimiento cargado por error y anulado dejaba al producto
           -- marcado "Sin stock" (rojo, y contando como "a reponer" en el
           -- tablero) para siempre, aunque nunca hubiera tenido nada.
           SUM(CASE WHEN ms.id_movimiento_stock IS NOT NULL AND ms.anulado = 0
                    THEN 1 ELSE 0 END) AS cantidad_movimientos
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

// Existencia de un solo producto.
//
// Recibe el "ejecutor": normalmente el pool, pero adentro de una transaccion
// hay que pasarle la conexion, o la cuenta se haria fuera del candado y no
// serviria de nada.
const existenciaCon = async (ejecutor, id_producto, id_empresa) => {

  const [rows] = await ejecutor.query(`
    SELECT ${SUMA_STOCK} AS existencia
    FROM productos p
    LEFT JOIN movimientos_stock ms ON ms.id_producto = p.id_producto
    LEFT JOIN motivos_stock mo     ON mo.id_motivo_stock = ms.id_motivo_stock
    WHERE p.id_producto = ? AND p.id_empresa = ?
    GROUP BY p.id_producto
  `, [id_producto, id_empresa])

  return rows.length ? Number(rows[0].existencia) : 0
}

const existenciaDeProducto = (id_producto, id_empresa) => existenciaCon(db, id_producto, id_empresa)

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
           -- No alcanza con saber que HAY un movimiento de dinero: hay que
           -- saber si sigue vivo. Si se anulo, la venta volvio a quedar sin
           -- cobro y la marca tiene que decirlo.
           m.anulado AS dinero_anulado,
           p.id_producto, p.nombre AS producto_nombre, p.unidad_medida,
           mo.id_motivo_stock, mo.nombre AS motivo_nombre,
           mo.efecto_stock, mo.efecto_dinero,
           u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
    FROM movimientos_stock ms
    JOIN productos p      ON p.id_producto = ms.id_producto
    JOIN motivos_stock mo ON mo.id_motivo_stock = ms.id_motivo_stock
    JOIN usuarios u       ON u.id = ms.id_usuario
    LEFT JOIN movimientos m ON m.id_movimiento = ms.id_movimiento
    WHERE ${condiciones.join(' AND ')}
    ORDER BY ms.fecha DESC, ms.id_movimiento_stock DESC
    ${limite}
  `, filtros.limite ? [...params, filtros.limite] : params)

  return rows
}

// ---------------------------------------------------------------------
// EL CANDADO DEL PRODUCTO
//
// Todo lo que puede cambiar la existencia de un producto pasa por aca.
//
// Antes se consultaba la existencia, se decidia en JavaScript y recien
// despues se escribia. Con dos pedidos al mismo tiempo —dos operadores en el
// deposito, o dos pestañas— los dos leian el mismo numero, los dos pasaban el
// control y los dos guardaban: el stock quedaba en negativo y nadie veia un
// error. Con 9 kg y dos ventas de 6 kg simultaneas quedaba en -3.
//
// La solucion es trabar la fila del producto ANTES de contar. El segundo
// pedido espera a que el primero termine, y entonces cuenta sobre el numero
// verdadero. Todas las operaciones de stock de un producto quedan en fila.
//
// Recibe una funcion "decidir" que mira la existencia real y dice si sigue o
// no: asi la regla de negocio la escribe el controlador y el modelo se queda
// con el SQL, como en el resto del proyecto.
const conProductoTrabado = async (id_producto, id_empresa, decidir) => {

  const conexion = await db.getConnection()

  try {
    await conexion.beginTransaction()

    // FOR UPDATE: mientras dure la transaccion, nadie mas pasa por aca para
    // este producto. La fila del producto hace de candado del stock.
    const [productos] = await conexion.query(
      'SELECT id_producto FROM productos WHERE id_producto = ? AND id_empresa = ? FOR UPDATE',
      [id_producto, id_empresa]
    )

    if (!productos.length) {
      await conexion.rollback()
      return { error: 'No se encontró el producto' }
    }

    const existencia = await existenciaCon(conexion, id_producto, id_empresa)

    const decision = await decidir(existencia, conexion)

    if (decision && decision.error) {
      await conexion.rollback()
      return decision
    }

    const existenciaFinal = await existenciaCon(conexion, id_producto, id_empresa)
    await conexion.commit()

    return { ...decision, existencia: existenciaFinal }

  } catch (error) {
    await conexion.rollback()
    throw error

  } finally {
    conexion.release()
  }
}

const createMovimiento = async ({ id_producto, id_motivo_stock, cantidad,
                                  descripcion, fecha, id_empresa, id_usuario }, ejecutor = db) => {

  const [result] = await ejecutor.query(`
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
           m.anulado AS dinero_anulado,
           p.nombre AS producto_nombre, p.unidad_medida,
           mo.nombre AS motivo_nombre, mo.efecto_stock, mo.efecto_dinero
    FROM movimientos_stock ms
    JOIN productos p      ON p.id_producto = ms.id_producto
    JOIN motivos_stock mo ON mo.id_motivo_stock = ms.id_motivo_stock
    LEFT JOIN movimientos m ON m.id_movimiento = ms.id_movimiento
    WHERE ms.id_movimiento_stock = ? AND ms.id_empresa = ?
  `, [id_movimiento_stock, id_empresa])

  return rows[0] || null
}

// Ata el movimiento de stock con el movimiento de dinero que se genero a
// partir de el. Es lo que despues evita cargar la misma venta dos veces.
const vincularMovimientoDinero = async (id_movimiento_stock, id_empresa, id_movimiento, ejecutor = db) => {
  await ejecutor.query(
    'UPDATE movimientos_stock SET id_movimiento = ? WHERE id_movimiento_stock = ? AND id_empresa = ?',
    [id_movimiento, id_movimiento_stock, id_empresa]
  )
}

// Crea el movimiento de dinero de una venta y lo ata al movimiento de stock,
// TODO JUNTO Y CON LA FILA TRABADA.
//
// Es el mismo problema que el del stock negativo, escrito en otro lado: antes
// se miraba si el movimiento ya tenia dinero cargado, se decidia, y recien
// despues se creaba. Con seis pedidos al mismo tiempo los seis veian el campo
// vacio y los seis creaban su movimiento: seis ingresos por la misma venta,
// cinco de ellos huerfanos y sumando al balance sin que nadie pudiera
// encontrarlos desde el historial de stock.
//
// Ahora el segundo pedido espera al primero y se encuentra el campo ya
// completo, asi que rebota como corresponde.
//
// "crearDinero" recibe la conexion y devuelve el id del movimiento creado. La
// arma el controlador, que es el que sabe que monto, que tipo y que fecha van.
const registrarDineroDeMovimiento = async (id_movimiento_stock, id_empresa, crearDinero) => {

  const conexion = await db.getConnection()

  try {
    await conexion.beginTransaction()

    const [filas] = await conexion.query(`
      SELECT ms.id_movimiento, m.anulado AS dinero_anulado
      FROM movimientos_stock ms
      LEFT JOIN movimientos m ON m.id_movimiento = ms.id_movimiento
      WHERE ms.id_movimiento_stock = ? AND ms.id_empresa = ?
      FOR UPDATE
    `, [id_movimiento_stock, id_empresa])

    if (!filas.length) {
      await conexion.rollback()
      return { error: 'No se encontró el movimiento de stock' }
    }

    // Ya tiene dinero cargado Y ese movimiento sigue vivo: no va otro.
    // Si esta anulado, en cambio, la venta volvio a quedar sin cobro y hay
    // que poder registrarlo de nuevo (si no, el error queda sin arreglo).
    if (filas[0].id_movimiento && !filas[0].dinero_anulado) {
      await conexion.rollback()
      return { error: 'Ese movimiento de stock ya tiene su movimiento de dinero registrado' }
    }

    const id_movimiento = await crearDinero(conexion)

    await vincularMovimientoDinero(id_movimiento_stock, id_empresa, id_movimiento, conexion)

    await conexion.commit()
    return { id_movimiento }

  } catch (error) {
    await conexion.rollback()
    throw error

  } finally {
    conexion.release()
  }
}

// Los movimientos de stock no se borran: se anulan. La existencia se recalcula
// sola porque sale de sumar los movimientos, y la suma ignora los anulados.
const anularMovimiento = async (id_movimiento_stock, id_empresa, ejecutor = db) => {
  await ejecutor.query(
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
  contarMovimientosDeMotivo, conProductoTrabado, registrarDineroDeMovimiento
}
