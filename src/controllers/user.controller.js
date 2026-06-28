const bcrypt = require('bcrypt')
const userModel = require('../models/user.model')

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

    const passwordOk = await bcrypt.compare(password, user.contraseña)
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
      contraseña: hashedPassword,
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
