// Plural de las unidades de medida, del lado de la pantalla: "1 caja",
// "6 cajas". Es el espejo de nombreUnidad en src/config/unidades-medida.js
// (que lo usa el servidor para sus mensajes): si se agrega una unidad allá,
// va también acá.
//
// Se usa con <script src="/components/unidades.js"></script> en cada pantalla
// que muestre cantidades (hoy Stock y el panel de inicio). Antes la tabla
// estaba copiada adentro de stock.html y el panel decía "15 paquete".
const PLURALES = { unidad: 'unidades', litro: 'litros', metro: 'metros', caja: 'cajas', paquete: 'paquetes', bolsa: 'bolsas' }

// "kg" no cambia; lo que no tiene plural cargado, tampoco.
function nombreUnidad (cantidad, clave) {
  if (!clave) return ''
  return Number(cantidad) === 1 ? clave : (PLURALES[clave] || clave)
}
