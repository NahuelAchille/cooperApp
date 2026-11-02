const db = require('../config/db')

// Articulacion: el buscador entre empresas.
//
// Una empresa aparece en el buscador si PARTICIPA: esta aprobada (activa) y
// tiene prendido el modulo de Articulacion. Y de lo que tiene en su catalogo
// se muestra solo lo que ella marco "Mostrar a otras empresas", con su rubro,
// activo, y de un modulo que tenga prendido: si apago Productos, sus
// productos no se ven aunque esten marcados (apagar un modulo esconde, no
// borra).
//
// Lo que NUNCA sale de aca hacia otra empresa: stock, costo, precio, ni nada
// de la plata. Las consultas eligen columna por columna a proposito: con un
// "SELECT p.*" bastaria con agregar una columna mañana para filtrarla sin que
// nadie se de cuenta.

// "Este modulo esta prendido para esta empresa", escrito una sola vez. Mismo
// criterio que modulo.model.js: si la empresa no tiene fila, vale el valor por
// defecto del catalogo. Recibe la expresion SQL de la clave del modulo.
const moduloPrendido = (claveSql) => `(
  SELECT COALESCE(em.activo, m.activo_por_defecto)
  FROM modulos m
  LEFT JOIN empresa_modulos em ON em.id_modulo = m.id_modulo AND em.id_empresa = e.id_empresa
  WHERE m.clave = ${claveSql}
) = 1`

// Que una empresa este en el buscador. Lo usan la busqueda y la ficha: si
// cada una lo escribiera a su manera, una empresa podria aparecer en la lista
// y dar "no encontrada" al entrar.
const PARTICIPA = `e.estado = 'activa' AND ${moduloPrendido("'articulacion'")}`

// Que un producto o servicio se muestre a las demas empresas.
const SE_MUESTRA = `
  p.activo = 1
  AND p.visible_empresas = 1
  AND p.id_rubro IS NOT NULL
  AND ${moduloPrendido("IF(p.es_servicio = 1, 'servicios', 'productos')")}`

// Escapa los comodines del LIKE: sin esto, buscar "50%" trae cualquier cosa.
const comoLike = (texto) => `%${texto.replace(/[%_\\]/g, '\\$&')}%`

// Busca lo que ofrecen las OTRAS empresas.
//
// Cada palabra tiene que aparecer en algun lado (nombre, descripcion, rubro o
// rubro general): asi "papel kraft" encuentra "Bolsas de papel kraft", y
// "kraft papel" tambien. Los acentos no importan, porque la base compara con
// utf8mb4_unicode_ci: "carton" encuentra "Cartón".
//
// Devuelve una fila por producto o servicio; agrupar por empresa y ordenar
// por cercania lo hace el controlador.
const buscar = async ({ palabras = [], id_rubro = null, id_empresa_propia }) => {

  const condiciones = [PARTICIPA, SE_MUESTRA, 'e.id_empresa <> ?']
  const params = [id_empresa_propia]

  for (const palabra of palabras) {
    condiciones.push('(p.nombre LIKE ? OR p.descripcion LIKE ? OR r.nombre LIKE ? OR rp.nombre LIKE ?)')
    const like = comoLike(palabra)
    params.push(like, like, like, like)
  }

  // Un rubro general trae tambien todo lo de sus especificos.
  if (id_rubro) {
    condiciones.push('(r.id_rubro = ? OR r.id_rubro_padre = ?)')
    params.push(id_rubro, id_rubro)
  }

  const [rows] = await db.query(`
    SELECT p.id_producto, p.nombre, p.es_servicio,
           r.nombre AS rubro_nombre, rp.nombre AS rubro_padre_nombre,
           e.id_empresa, e.nombre AS empresa_nombre,
           l.nombre AS localidad_nombre, l.latitud, l.longitud
    FROM productos p
    JOIN empresas e         ON e.id_empresa = p.id_empresa
    JOIN rubros r           ON r.id_rubro = p.id_rubro
    LEFT JOIN rubros rp     ON rp.id_rubro = r.id_rubro_padre
    LEFT JOIN localidades l ON l.id_localidad = e.id_localidad
    WHERE ${condiciones.join(' AND ')}
    ORDER BY p.nombre
  `, params)

  return rows
}

// La ficha de una empresa del buscador, con TODOS los datos de contacto y sus
// marcas de visibilidad: el controlador decide que se muestra. Devuelve null
// si la empresa no participa (no aprobada, o sin el modulo).
const findFicha = async (id_empresa) => {

  const [rows] = await db.query(`
    SELECT e.id_empresa, e.nombre, e.email, e.telefono, e.domicilio,
           e.mostrar_email, e.mostrar_telefono, e.mostrar_domicilio,
           l.nombre AS localidad_nombre, pr.nombre AS provincia_nombre,
           l.latitud, l.longitud
    FROM empresas e
    LEFT JOIN localidades l ON l.id_localidad = e.id_localidad
    LEFT JOIN provincias pr ON pr.id_provincia = l.id_provincia
    WHERE e.id_empresa = ? AND ${PARTICIPA}
  `, [id_empresa])

  return rows[0] || null
}

// Lo que una empresa muestra a las demas, agrupable por rubro.
const findLoQueOfrece = async (id_empresa) => {

  const [rows] = await db.query(`
    SELECT p.id_producto, p.nombre, p.descripcion, p.es_servicio,
           r.nombre AS rubro_nombre, rp.nombre AS rubro_padre_nombre
    FROM productos p
    JOIN empresas e     ON e.id_empresa = p.id_empresa
    JOIN rubros r       ON r.id_rubro = p.id_rubro
    LEFT JOIN rubros rp ON rp.id_rubro = r.id_rubro_padre
    WHERE p.id_empresa = ? AND ${SE_MUESTRA}
    ORDER BY COALESCE(rp.orden, r.orden), r.nombre, p.nombre
  `, [id_empresa])

  return rows
}

// Donde esta la propia empresa (para medir distancias) y cuanto muestra a
// las demas (para avisarle si todavia no aparece en el buscador).
const findEstadoPropio = async (id_empresa) => {

  const [rows] = await db.query(`
    SELECT e.id_localidad, l.nombre AS localidad_nombre, l.latitud, l.longitud,
           (SELECT COUNT(*) FROM productos p
            WHERE p.id_empresa = e.id_empresa AND ${SE_MUESTRA}) AS visibles
    FROM empresas e
    LEFT JOIN localidades l ON l.id_localidad = e.id_localidad
    WHERE e.id_empresa = ?
  `, [id_empresa])

  return rows[0] || null
}

module.exports = { buscar, findFicha, findLoQueOfrece, findEstadoPropio }
