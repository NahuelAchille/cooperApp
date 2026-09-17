const express = require('express')
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

app.use(express.urlencoded({ extended: true }))
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

app.listen(3000, () => console.log('Servidor corriendo en puerto 3000'))
