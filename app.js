const express = require('express')
const session = require('express-session')
const app = express()

const userRoutes = require('./src/routes/user.routes')
const cooperativaRoutes = require('./src/routes/cooperativa.routes')
const categoriaRoutes = require('./src/routes/categoria.routes')
const movimientoRoutes = require('./src/routes/movimiento.routes')

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(session({
  secret: 'cooperapp_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 horas
}))
app.get('/', (req, res) => res.redirect('/pages/login.html'))

app.use(express.static('src/views'))

app.use('/users', userRoutes)
app.use('/cooperativas', cooperativaRoutes)
app.use('/categorias', categoriaRoutes)
app.use('/movimientos', movimientoRoutes)

app.listen(3000, () => console.log('Servidor corriendo en puerto 3000'))
