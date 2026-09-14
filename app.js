const express = require('express')
const session = require('express-session')
const app = express()

const userRoutes = require('./src/routes/user.routes')
const empresaRoutes = require('./src/routes/empresa.routes')
const categoriaRoutes = require('./src/routes/categoria.routes')
const movimientoRoutes = require('./src/routes/movimiento.routes')
const moduloRoutes = require('./src/routes/modulo.routes')

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

app.listen(3000, () => console.log('Servidor corriendo en puerto 3000'))
