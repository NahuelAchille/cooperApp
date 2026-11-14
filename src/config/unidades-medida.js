// Unidades en las que se mide un producto.
//
// Es una lista cerrada a proposito, no un campo de texto libre: si cada uno
// escribe lo suyo termina habiendo "kg", "Kg", "kilo" y "kilos" conviviendo,
// y despues no hay forma de sumar el stock ni de agrupar un reporte.
//
// Se guarda la CLAVE en la base y se muestra la etiqueta en pantalla, asi
// cambiar como se lee no obliga a tocar los datos ya cargados.

const UNIDADES_MEDIDA = [
  { clave: 'unidad',   etiqueta: 'Unidad',     plural: 'unidades' },
  { clave: 'kg',       etiqueta: 'Kilogramo' },
  { clave: 'g',        etiqueta: 'Gramo' },
  { clave: 'litro',    etiqueta: 'Litro',      plural: 'litros' },
  { clave: 'ml',       etiqueta: 'Mililitro' },
  { clave: 'metro',    etiqueta: 'Metro',      plural: 'metros' },
  { clave: 'caja',     etiqueta: 'Caja',       plural: 'cajas' },
  { clave: 'paquete',  etiqueta: 'Paquete',    plural: 'paquetes' },
  { clave: 'bolsa',    etiqueta: 'Bolsa',      plural: 'bolsas' },
]

const CLAVES_UNIDADES = UNIDADES_MEDIDA.map(u => u.clave)

// "6 bolsas", no "6 bolsa" (UX final). kg, g y ml no cambian. La pantalla de
// La pantalla tiene la misma lista de plurales, en views/components/unidades.js.
const nombreUnidad = (cantidad, clave) => {
  if (!clave) return ''
  if (Number(cantidad) === 1) return clave
  return UNIDADES_MEDIDA.find(u => u.clave === clave)?.plural || clave
}

module.exports = { UNIDADES_MEDIDA, CLAVES_UNIDADES, nombreUnidad }
