const moduloModel = require('../models/modulo.model')

// Corta el paso a las rutas de un modulo que la empresa tiene apagado.
//
// Esconder la opcion del menu no alcanza: el menu es HTML y cualquiera puede
// escribir la direccion a mano o armar el pedido por su cuenta. Esto lo
// rechaza del lado del servidor, que es el unico lugar donde vale.
//
// Va SIEMPRE despues de requireLogin, porque necesita saber de que empresa es
// el usuario. Se usa igual que requireRol:
//
//     router.get('/', requireLogin, requireModulo('productos'), controlador.listar)
//
exports.requireModulo = (clave) => async (req, res, next) => {

  try {
    // El superadmin no pertenece a ninguna empresa, asi que no tiene modulos:
    // sus rutas propias no llevan este control.
    const id_empresa = req.session.user?.empresa?.id
    if (!id_empresa) {
      return res.status(403).json({ error: 'Sin permiso para realizar esta acción' })
    }

    if (!await moduloModel.estaActivo(id_empresa, clave)) {
      return res.status(403).json({
        error: 'Este módulo no está activo en tu empresa. El administrador puede activarlo desde Módulos del sistema.'
      })
    }

    next()

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error del servidor' })
  }
}
