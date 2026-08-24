const bcrypt = require('bcrypt')
const userModel = require('../models/user.model')

const ID_ROL_ADMIN_COOP = 1
const ID_ROL_SUPERADMIN = 4

// Roles que el administrador de una cooperativa puede asignar a sus usuarios.
// No incluye admin_cooperativa ni superadmin: nadie se promueve a si mismo ni
// crea administradores desde esta pantalla.
const ROLES_ASIGNABLES = [2, 3]   // 2 = tesorero, 3 = operador

// Reglas de quien puede gestionar a quien. El administrador de una cooperativa
// puede tocar a los usuarios comunes de SU cooperativa, y a nadie mas.
// Devuelve null si esta permitido, o el error a responder si no lo esta.
const validarGestion = (solicitante, objetivo) => {

  if (objetivo.id === solicitante.id) {
    return { status: 400, error: 'No podés modificar tu propio usuario desde esta pantalla' }
  }

  if (objetivo.id_cooperativa !== solicitante.cooperativa.id) {
    return { status: 403, error: 'Ese usuario no pertenece a tu cooperativa' }
  }

  if (objetivo.id_rol === ID_ROL_ADMIN_COOP || objetivo.id_rol === ID_ROL_SUPERADMIN) {
    return { status: 403, error: 'No podés modificar a otro administrador' }
  }

  return null
}

exports.login = async (req, res) => {

  try {

    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' })
    }

    const user = await userModel.findByEmailWithContext(email)
    if (!user) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'Tu cuenta está desactivada' })
    }

    const esSuperadmin = user.rol === 'superadmin'
    if (!esSuperadmin) {

      if (user.cooperativa_estado === 'pendiente') {
        return res.status(403).json({ error: 'Tu cooperativa está pendiente de aprobación' })
      }

      if (user.cooperativa_estado === 'suspendida') {
        return res.status(403).json({ error: 'Tu cooperativa está suspendida' })
      }

    }

    const passwordOk = await bcrypt.compare(password, user.password_hash)
    if (!passwordOk) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }

    req.session.user = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol: user.rol,
      id_rol: user.id_rol,
      cooperativa: {
        id: user.id_cooperativa,
        nombre: user.cooperativa_nombre
      }
    }

    if (user.debe_cambiar_password) {
      return res.json({ redirect: '/pages/cambiar-password.html'})
    }

    res.json({ redirect: '/pages/dashboard.html'})

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error del servidor'})
  }
}

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/'))
}

exports.me = (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'No autenticado' })
  res.json(req.session.user)
}

exports.getUsuariosCooperativa = async (req, res) => {

  try {

    const { id: id_cooperativa } = req.session.user.cooperativa

    const usuarios = await userModel.findByCooperativa(id_cooperativa)
    res.json(usuarios)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al cargar usuarios' })
  }

}

exports.crearUsuario = async (req, res) => {

  try {
    const { nombre, apellido, email, dni, id_rol } = req.body
    const id_cooperativa = req.session.user.cooperativa.id

    if (!nombre || !apellido || !email || !dni || !id_rol) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' })
    }

    // Sin esto, un administrador de cooperativa podria crear un superadmin
    // mandando el pedido a mano, aunque la pantalla no le ofrezca esa opcion.
    if (!ROLES_ASIGNABLES.includes(Number(id_rol))) {
      return res.status(400).json({ error: 'El rol seleccionado no es válido' })
    }

    if (await userModel.findByEmail(email)) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' })
    }

    if (await userModel.findByDni(dni)) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese DNI' })
    }

    // Contraseña temporal = dni del usuario
    const hashedPassword = await bcrypt.hash(dni, 10)

    await userModel.createInterno({
      nombre, apellido, email, dni,
      password_hash: hashedPassword,
      id_rol,
      id_cooperativa,
      debe_cambiar_password: 1
    })

    res.status(201).json({ message: `Usuario creado. Contraseña temporal: ${dni}` })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear usuario' })
  }

}

exports.actualizarUsuario = async (req, res) => {

  try {

    const solicitante = req.session.user

    const objetivo = await userModel.findById(req.params.id)
    if (!objetivo) {
      return res.status(404).json({ error: 'El usuario no existe' })
    }

    const problema = validarGestion(solicitante, objetivo)
    if (problema) {
      return res.status(problema.status).json({ error: problema.error })
    }

    const { nombre, apellido, email, dni, id_rol } = req.body

    if (!nombre?.trim() || !apellido?.trim() || !email?.trim() || !dni?.trim() || !id_rol) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' })
    }

    const emailLimpio = email.trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
      return res.status(400).json({ error: 'El email no tiene un formato válido' })
    }

    if (!ROLES_ASIGNABLES.includes(Number(id_rol))) {
      return res.status(400).json({ error: 'El rol seleccionado no es válido' })
    }

    if (await userModel.findByEmailExcluyendo(emailLimpio, objetivo.id)) {
      return res.status(400).json({ error: 'Ya existe otro usuario con ese email' })
    }

    if (await userModel.findByDniExcluyendo(dni.trim(), objetivo.id)) {
      return res.status(400).json({ error: 'Ya existe otro usuario con ese DNI' })
    }

    await userModel.update(objetivo.id, {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: emailLimpio,
      dni: dni.trim(),
      id_rol: Number(id_rol)
    })

    res.json({ message: 'Usuario actualizado correctamente' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar el usuario' })
  }

}

// Baja y alta logica del usuario. Nunca se borra el registro: un usuario dado de
// baja no puede iniciar sesion, pero su historial queda.
exports.cambiarEstadoUsuario = async (req, res) => {

  try {

    const solicitante = req.session.user

    const objetivo = await userModel.findById(req.params.id)
    if (!objetivo) {
      return res.status(404).json({ error: 'El usuario no existe' })
    }

    const problema = validarGestion(solicitante, objetivo)
    if (problema) {
      return res.status(problema.status).json({ error: problema.error })
    }

    const activo = Number(req.body.activo)

    if (activo !== 0 && activo !== 1) {
      return res.status(400).json({ error: 'El estado indicado no es válido' })
    }

    await userModel.setActivo(objetivo.id, activo)

    res.json({
      message: activo
        ? `${objetivo.nombre} ${objetivo.apellido} puede volver a ingresar`
        : `${objetivo.nombre} ${objetivo.apellido} ya no puede ingresar al sistema`
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al cambiar el estado del usuario' })
  }

}

// Reseteo de contraseña.
// El superadmin resetea a los administradores de cooperativa.
// El administrador de cooperativa resetea a los usuarios de SU cooperativa.
// En los dos casos la contraseña vuelve a ser el DNI y hay que cambiarla al ingresar.
exports.resetearPassword = async (req, res) => {

  try {

    const solicitante = req.session.user

    const objetivo = await userModel.findById(req.params.id)
    if (!objetivo) {
      return res.status(404).json({ error: 'El usuario no existe' })
    }

    if (objetivo.id === solicitante.id) {
      return res.status(400).json({ error: 'Para cambiar tu propia contraseña usá la opción de cambio de contraseña' })
    }

    if (solicitante.rol === 'superadmin') {

      if (objetivo.id_rol !== ID_ROL_ADMIN_COOP) {
        return res.status(403).json({ error: 'Sólo podés resetear la contraseña de los administradores de cooperativa' })
      }

    } else {

      // admin_cooperativa
      if (objetivo.id_cooperativa !== solicitante.cooperativa.id) {
        return res.status(403).json({ error: 'Ese usuario no pertenece a tu cooperativa' })
      }

      if (objetivo.id_rol === ID_ROL_ADMIN_COOP || objetivo.id_rol === ID_ROL_SUPERADMIN) {
        return res.status(403).json({ error: 'No podés resetear la contraseña de otro administrador' })
      }

    }

    const hashedPassword = await bcrypt.hash(objetivo.dni, 10)
    await userModel.resetPassword(objetivo.id, hashedPassword)

    res.json({ message: `Contraseña reseteada. La nueva contraseña temporal es el DNI: ${objetivo.dni}` })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al resetear la contraseña' })
  }

}

exports.cambiarPassword = async (req, res) => {

  try {

    const { password_nuevo, password_confirm } = req.body
    const id = req.session.user.id

    if (!password_nuevo || !password_confirm) {
      return res.status(400).json({ error: 'Completar ambos campos' })
    }

    if (password_nuevo !== password_confirm) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' })
    }

    if (password_nuevo.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }

    const hashed = await bcrypt.hash(password_nuevo, 10)
    await userModel.updatePassword(id, hashed)

    res.json({ message: 'Contraseña actualizada correctamente', redirect: '/pages/dashboard.html' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al cambiar la contraseña' })
  }
  
}
