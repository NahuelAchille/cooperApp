// Unidades en las que se mide un producto.
//
// Es una lista cerrada a proposito, no un campo de texto libre: si cada uno
// escribe lo suyo termina habiendo "kg", "Kg", "kilo" y "kilos" conviviendo,
// y despues no hay forma de sumar el stock ni de agrupar un reporte.
//
// Se guarda la CLAVE en la base y se muestra la etiqueta en pantalla, asi
// cambiar como se lee no obliga a tocar los datos ya cargados.

const UNIDADES_MEDIDA = [
  { clave: 'unidad',   etiqueta: 'Unidad',     plural: 'unidades', entera: true },
  { clave: 'kg',       etiqueta: 'Kilogramo' },
  { clave: 'g',        etiqueta: 'Gramo' },
  { clave: 'litro',    etiqueta: 'Litro',      plural: 'litros' },
  { clave: 'ml',       etiqueta: 'Mililitro' },
  { clave: 'metro',    etiqueta: 'Metro',      plural: 'metros' },
  { clave: 'caja',     etiqueta: 'Caja',       plural: 'cajas',    entera: true },
  { clave: 'paquete',  etiqueta: 'Paquete',    plural: 'paquetes', entera: true },
  { clave: 'bolsa',    etiqueta: 'Bolsa',      plural: 'bolsas',   entera: true },
]

const CLAVES_UNIDADES = UNIDADES_MEDIDA.map(u => u.clave)

// "6 bolsas", no "6 bolsa" (UX final). kg, g y ml no cambian. La pantalla
// tiene la misma lista de plurales, en views/components/unidades.js.
const nombreUnidad = (cantidad, clave) => {
  if (!clave) return ''
  if (Number(cantidad) === 1) return clave
  return UNIDADES_MEDIDA.find(u => u.clave === clave)?.plural || clave
}

// Las que se cuentan (entera: true) no aceptan medias: "1,5 unidades" de una
// gaseosa no existe. Las que se pesan o se miden, sí (2,5 kg).
const esEntera = (clave) => !!UNIDADES_MEDIDA.find(u => u.clave === clave)?.entera

module.exports = { UNIDADES_MEDIDA, CLAVES_UNIDADES, nombreUnidad, esEntera }
