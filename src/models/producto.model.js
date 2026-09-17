const db = require('../config/db')

// El catalogo: que productos existen en la empresa. Cada producto cuelga de
// una categoria y, si la empresa subdividio, tambien de una subcategoria.
//
// Los productos no se borran: se dan de baja (activo = 0). Manana van a
// tener stock e historial colgando y un borrado fisico los dejaria huerfanos.
//
// Esta misma tabla guarda los SERVICIOS, que son productos sin stock, y los
// separa la columna es_servicio. Por eso el filtro la lleva siempre: sin ella
// el catalogo de productos mostraria los servicios mezclados.

// Arma la clausula WHERE y sus parametros a partir de los filtros opcionales.
// Todo va parametrizado, incluida la busqueda por nombre: el texto lo escribe
// el usuario y nunca se pega dentro de la consulta.
const construirFiltro = (id_empresa, filtros = {}) => {

  const condiciones = ['p.id_empresa = ?', 'p.es_servicio = ?']
  const params = [id_empresa, filtros.es_servicio ? 1 : 0]

  if (filtros.soloActivos) condiciones.push('p.activo = 1')
  if (filtros.soloInactivos) condiciones.push('p.activo = 0')

  if (filtros.id_categoria_producto) {
    condiciones.push('p.id_categoria_producto = ?')
    params.push(filtros.id_categoria_producto)
  }
  if (filtros.id_subcategoria_producto) {
    condiciones.push('p.id_subcategoria_producto = ?')
    params.push(filtros.id_subcategoria_producto)
  }

  // La busqueda mira el nombre y tambien la descripcion: si alguien anoto ahi
  // la marca o el proveedor, esperaria encontrarlo escribiendolo.
  if (filtros.busqueda) {
    // El % y el _ son comodines del LIKE: si alguien busca "50%" y no se
    // escapan, el % deja de ser texto y trae cualquier cosa.
    const texto = `%${filtros.busqueda.replace(/[%_\\]/g, '\\$&')}%`
    condiciones.push('(p.nombre LIKE ? OR p.descripcion LIKE ?)')
    params.push(texto, texto)
  }

  return { where: condiciones.join(' AND '), params }
}

// Trae el catalogo de la empresa con los nombres de su clasificacion ya
// resueltos, para no tener que pedirlos aparte desde la pantalla.
// El LEFT JOIN de la subcategoria es a proposito: es opcional.
const findProductos = async (id_empresa, filtros = {}) => {

  const { where, params } = construirFiltro(id_empresa, filtros)

  const [rows] = await db.query(`
    SELECT p.id_producto, p.nombre, p.descripcion, p.unidad_medida, p.stock_minimo, p.activo,
           p.es_servicio, p.id_categoria_producto, p.id_subcategoria_producto,
           c.nombre AS categoria_nombre,
           s.nombre AS subcategoria_nombre
    FROM productos p
    JOIN categorias_producto c        ON c.id_categoria_producto = p.id_categoria_producto
    LEFT JOIN subcategorias_producto s ON s.id_subcategoria_producto = p.id_subcategoria_producto
    WHERE ${where}
    ORDER BY c.nombre, p.nombre
  `, params)

  return rows
}

// Busca un producto propio de la empresa (sirve para validar pertenencia).
//
// NO filtra por es_servicio a proposito: devuelve la columna y deja que
// decida el que llama. El controlador del catalogo la usa para rechazar el
// cruce entre las dos pantallas, y el de stock, para rechazar un servicio
// (que no tiene existencias). Son dos respuestas distintas al mismo dato.
const findProductoById = async (id_producto, id_empresa) => {

  const [rows] = await db.query(`
    SELECT p.id_producto, p.nombre, p.descripcion, p.unidad_medida, p.stock_minimo, p.activo,
           p.es_servicio, p.id_categoria_producto, p.id_subcategoria_producto
    FROM productos p
    WHERE p.id_producto = ? AND p.id_empresa = ?
  `, [id_producto, id_empresa])

  return rows[0] || null
}

const createProducto = async ({ nombre, descripcion, unidad_medida, stock_minimo,
                                id_categoria_producto, id_subcategoria_producto,
                                id_empresa, es_servicio = 0 }) => {

  const [result] = await db.query(`
    INSERT INTO productos
      (nombre, descripcion, unidad_medida, stock_minimo,
       id_categoria_producto, id_subcategoria_producto, id_empresa, es_servicio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [nombre, descripcion, unidad_medida, stock_minimo,
      id_categoria_producto, id_subcategoria_producto, id_empresa, es_servicio])

  return result.insertId
}

const updateProducto = async (id_producto, id_empresa,
                              { nombre, descripcion, unidad_medida, stock_minimo,
                                id_categoria_producto, id_subcategoria_producto }) => {

  await db.query(`
    UPDATE productos
    SET nombre = ?, descripcion = ?, unidad_medida = ?, stock_minimo = ?,
        id_categoria_producto = ?, id_subcategoria_producto = ?
    WHERE id_producto = ? AND id_empresa = ?
  `, [nombre, descripcion, unidad_medida, stock_minimo,
      id_categoria_producto, id_subcategoria_producto, id_producto, id_empresa])
}

const setActivoProducto = async (id_producto, id_empresa, activo) => {
  await db.query(
    'UPDATE productos SET activo = ? WHERE id_producto = ? AND id_empresa = ?',
    [activo, id_producto, id_empresa]
  )
}

module.exports = {
  findProductos, findProductoById, createProducto, updateProducto, setActivoProducto
}
