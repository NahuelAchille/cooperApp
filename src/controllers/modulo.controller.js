const moduloModel = require('../models/modulo.model')

// Lista los modulos con el estado que tienen en la empresa del usuario.
// Lo consulta cualquier usuario logueado, porque el menu necesita saber que
// mostrar. El superadmin no pertenece a ninguna empresa: no tiene modulos.
exports.getModulos = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa?.id
    if (!id_empresa) return res.json([])

    const modulos = await moduloModel.findByEmpresa(id_empresa)
    res.json(modulos)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los módulos' })
  }
}

// Prende o apaga un modulo. Solo el administrador de la empresa.
exports.cambiarEstadoModulo = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const { clave } = req.params

    const modulo = await moduloModel.findByClave(clave)
    if (!modulo) {
      return res.status(404).json({ error: 'No se encontró el módulo' })
    }

    const activo = req.body.activo ? 1 : 0

    // Los modulos no opcionales son la base del sistema: no se apagan.
    if (!modulo.opcional && !activo) {
      return res.status(400).json({ error: `El módulo ${modulo.nombre} no se puede desactivar` })
    }

    await moduloModel.setActivo(id_empresa, modulo.id_modulo, activo)

    res.json({
      message: activo
        ? `Módulo ${modulo.nombre} activado`
        : `Módulo ${modulo.nombre} desactivado. Los datos cargados se conservan.`
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al cambiar el estado del módulo' })
  }
}
