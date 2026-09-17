// De cual de los dos catalogos viene este pedido.
//
// Productos y servicios comparten las tablas y comparten los controladores:
// un servicio es un producto sin stock. Lo unico que cambia es de que lado
// del catalogo se esta parado, y eso lo fija la RUTA, no el cuerpo del
// pedido. Es a proposito: si viniera en el body, alguien armando el pedido a
// mano podria cargar un servicio desde la pantalla de productos y viceversa.
//
// Se usa asi, en las rutas de servicios:
//
//     router.post('/', requireLogin, ..., marcarServicio, ctrl.crearProducto)
//
// Las rutas de productos no ponen nada: sin la marca, req.esServicio queda en
// undefined y el controlador trabaja con el catalogo de productos.

const marcarServicio = (req, res, next) => {
  req.esServicio = true
  next()
}

// 1 o 0 listo para la consulta.
const flagServicio = (req) => req.esServicio ? 1 : 0

// Los mensajes de la API tienen que nombrar lo que la persona esta mirando:
// si la pantalla dice "Nuevo servicio" y el toast contesta "Producto creado",
// el rotulo no sirve de nada. Es lo mismo que se corrigio al unificar el
// vocabulario (HU-84), donde los botones ya decian una cosa y el servidor
// seguia contestando otra.
const rotulo = (req) => req.esServicio
  ? { Uno: 'Servicio', uno: 'servicio', varios: 'servicios' }
  : { Uno: 'Producto', uno: 'producto', varios: 'productos' }

module.exports = { marcarServicio, flagServicio, rotulo }
