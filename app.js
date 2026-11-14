const express = require('express')
const path = require('path')
const session = require('express-session')
const app = express()

const userRoutes = require('./src/routes/user.routes')
const empresaRoutes = require('./src/routes/empresa.routes')
const categoriaRoutes = require('./src/routes/categoria.routes')
const movimientoRoutes = require('./src/routes/movimiento.routes')
const moduloRoutes = require('./src/routes/modulo.routes')
const categoriaProductoRoutes = require('./src/routes/categoria-producto.routes')
const productoRoutes = require('./src/routes/producto.routes')
const motivoStockRoutes = require('./src/routes/motivo-stock.routes')
const stockRoutes = require('./src/routes/stock.routes')
const servicioRoutes = require('./src/routes/servicio.routes')
const categoriaServicioRoutes = require('./src/routes/categoria-servicio.routes')
const reporteRoutes = require('./src/routes/reporte.routes')
const rubroRoutes = require('./src/routes/rubro.routes')
const localidadRoutes = require('./src/routes/localidad.routes')
const articulacionRoutes = require('./src/routes/articulacion.routes')

app.use(express.json())
app.use(session({
  secret: 'cooperapp_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8,  // 8 horas
    httpOnly: true,              // el JavaScript de la pagina no puede leerla
    sameSite: 'lax'              // no viaja en pedidos que vengan de otro sitio
  }
}))
app.get('/', (req, res) => res.redirect('/pages/login.html'))

// Productos y Servicios comparten la pantalla: un servicio es un producto sin
// stock, en las mismas tablas. Cada dirección entrega la misma página, y la
// página se arma según la dirección por la que se entró (revisión de código,
// 14/11/2026: eran dos copias de cientos de líneas que había que corregir dos
// veces). Van ANTES del static: Express usa la primera que coincide.
const pagina = (archivo) => (req, res) => res.sendFile(path.join(__dirname, 'src', 'views', 'pages', archivo))
app.get('/pages/servicios.html', pagina('productos.html'))
app.get('/pages/configuracion-categorias-servicio.html', pagina('configuracion-categorias-producto.html'))

app.use(express.static('src/views'))

app.use('/users', userRoutes)
app.use('/empresas', empresaRoutes)
app.use('/categorias', categoriaRoutes)
app.use('/movimientos', movimientoRoutes)
app.use('/modulos', moduloRoutes)

// El orden importa: Express elige la primera ruta que coincide, asi que el
// arbol de clasificacion (mas especifico) va ANTES que el catalogo.
app.use('/productos/categorias', categoriaProductoRoutes)
app.use('/productos/motivos', motivoStockRoutes)
app.use('/productos/stock', stockRoutes)
app.use('/productos', productoRoutes)

// Servicios: mismo criterio de orden que arriba, el arbol antes que el
// catalogo. Comparten las tablas y los controladores con productos -- un
// servicio es un producto sin stock -- y por eso NO hay rutas de stock aca.
app.use('/servicios/categorias', categoriaServicioRoutes)
app.use('/servicios', servicioRoutes)

app.use('/reportes', reporteRoutes)

// Articulacion: el buscador entre empresas, y las dos listas comunes que usa
// (rubros y localidades).
app.use('/rubros', rubroRoutes)
app.use('/localidades', localidadRoutes)
app.use('/articulacion', articulacionRoutes)

// Ultimo de todos: recoge lo que ningun controlador atajo.
//
// Sin esto contestaba el manejador por defecto de Express, que devuelve una
// pagina HTML con el stack trace completo: la ruta absoluta del disco, la
// estructura de carpetas y las versiones de las librerias, en una API que
// declara devolver JSON siempre. Y el front, que hace res.json() sobre la
// respuesta, reventaba con un error que no decia nada.
//
// El caso mas facil de provocar es un JSON mal escrito contra cualquier
// endpoint, incluso el registro publico, sin sesion.
app.use((err, req, res, next) => {

  console.error(err)

  // Cuerpo que no es JSON valido: es culpa del pedido, no del servidor.
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'El pedido no tiene un formato válido' })
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El pedido es demasiado grande' })
  }

  res.status(500).json({ error: 'Error del servidor' })
})

// PORT es opcional, por el mismo motivo que DB_NAME en config/db.js: una
// segunda copia de la app no puede usar el mismo puerto. Sin ponerlo, es 3000.
const PUERTO = Number(process.env.PORT) || 3000
app.listen(PUERTO, () => console.log(`Servidor corriendo en puerto ${PUERTO}`))
