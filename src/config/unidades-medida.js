// Unidades en las que se mide un producto.
//
// Es una lista cerrada a proposito, no un campo de texto libre: si cada uno
// escribe lo suyo termina habiendo "kg", "Kg", "kilo" y "kilos" conviviendo,
// y despues no hay forma de sumar el stock ni de agrupar un reporte.
//
// Se guarda la CLAVE en la base y se muestra la etiqueta en pantalla, asi
// cambiar como se lee no obliga a tocar los datos ya cargados.

const UNIDADES_MEDIDA = [
  { clave: 'unidad',   etiqueta: 'Unidad' },
  { clave: 'kg',       etiqueta: 'Kilogramo' },
  { clave: 'g',        etiqueta: 'Gramo' },
  { clave: 'litro',    etiqueta: 'Litro' },
  { clave: 'ml',       etiqueta: 'Mililitro' },
  { clave: 'metro',    etiqueta: 'Metro' },
  { clave: 'caja',     etiqueta: 'Caja' },
  { clave: 'paquete',  etiqueta: 'Paquete' },
  { clave: 'bolsa',    etiqueta: 'Bolsa' },
]

const CLAVES_UNIDADES = UNIDADES_MEDIDA.map(u => u.clave)

module.exports = { UNIDADES_MEDIDA, CLAVES_UNIDADES }
