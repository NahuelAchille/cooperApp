const userModel = require('../models/user.model')

// Lo unico que puede hacer alguien con contraseña temporal: ver quien es y
// cambiarla. Todo lo demas espera.
const RUTAS_CON_PASSWORD_TEMPORAL = ['/users/me', '/users/cambiar-password']

exports.requireLogin = async (req, res, next) => {

  if (!req.session.user) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  try {
    // La sesion es una foto del momento del login. Entre medio al usuario lo
    // pueden dar de baja, pueden suspender su empresa o pueden resetearle la
    // contraseña, asi que hay que mirar como esta AHORA y no confiar en la foto.
    const estado = await userModel.estadoDeSesion(req.session.user.id)

    if (!estado || !estado.activo) {
      return req.session.destroy(() =>
        res.status(401).json({ error: 'Tu cuenta fue dada de baja. Hablá con el administrador de tu empresa.' })
      )
    }

    // El superadmin no pertenece a ninguna empresa: no tiene estado que mirar.
    if (estado.empresa_estado && estado.empresa_estado !== 'activa') {
      return req.session.destroy(() =>
        res.status(403).json({ error: 'Tu empresa no está activa en este momento.' })
      )
    }

    // El cambio obligatorio no puede ser solo una pantalla: sin esto, una
    // cuenta con contraseña temporal opera normalmente armando los pedidos
    // a mano, sin pasar nunca por el cambio.
    if (estado.debe_cambiar_password && !RUTAS_CON_PASSWORD_TEMPORAL.includes(req.originalUrl.split('?')[0])) {
      return res.status(403).json({
        error: 'Tenés que cambiar tu contraseña antes de usar el sistema.',
        debe_cambiar_password: true
      })
    }

    next()

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error del servidor' })
  }
}

exports.requireRol = (...roles) => (req, res, next) => {

  if (!req.session.user || !roles.includes(req.session.user.rol)) {
    return res.status(403).json({ error: 'Sin permiso para realizar esta acción' })
  }
  next()
}
