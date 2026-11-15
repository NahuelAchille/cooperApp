const bcrypt = require('bcrypt')
const userModel = require('../models/user.model')
const { validarLargos, LARGOS, mensajeDeDuplicado, esEmailValido, limpiarDni, esDniValido, PASSWORD_MINIMO } = require('../services/validacion.service')
const { ROL, ROLES_ASIGNABLES } = require('../config/roles')

// Las claves unicas de usuarios, para poder explicar cual se repitio.
const DUPLICADOS_USUARIO = [['email', 'Ya existe un usuario con ese email'],
                            ['dni', 'Ya existe un usuario con ese DNI']]


// Reglas de quien puede gestionar a quien. El administrador de una empresa
// puede tocar a los usuarios comunes de SU empresa, y a nadie mas.
// Devuelve null si esta permitido, o el error a responder si no lo esta.
const validarGestion = (solicitante, objetivo) => {

  if (objetivo.id === solicitante.id) {
    return { status: 400, error: 'No podés modificar tu propio usuario desde esta pantalla' }
  }

  if (objetivo.id_empresa !== solicitante.empresa.id) {
    return { status: 403, error: 'Ese usuario no pertenece a tu empresa' }
  }

  if (objetivo.id_rol === ROL.ADMIN_EMPRESA || objetivo.id_rol === ROL.SUPERADMIN) {
    return { status: 403, error: 'No podés modificar a otro administrador' }
  }

  return null
}

exports.login = async (req, res) => {

  try {

    const { email, password } = req.body

    // Algo que no es texto (un número, una lista) le llegaba a bcrypt y daba
    // "Error del servidor" (QA de la entrega, B3).
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' })
    }

    const user = await userModel.findByEmailWithContext(email)
    if (!user) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'Tu usuario está dado de baja. Hablá con el administrador de tu empresa.' })
    }

    const esSuperadmin = user.rol === 'superadmin'
    if (!esSuperadmin) {

      if (user.empresa_estado === 'pendiente') {
        return res.status(403).json({ error: 'Tu empresa todavía no fue aprobada. Cuando la aprueben vas a poder entrar con este mismo email y contraseña.' })
      }

      if (user.empresa_estado === 'suspendida') {
        // En el panel del superadmin este estado se llama "Rechazada": misma palabra acá.
        return res.status(403).json({ error: 'Tu empresa fue rechazada. Si creés que es un error, comunicate con quien administra CooperApp.' })
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
      empresa: {
        id: user.id_empresa,
        nombre: user.empresa_nombre
      }
    }

    if (user.debe_cambiar_password) {
      return res.json({ redirect: '/pages/cambiar-password.html'})
    }

    // El superadmin no pertenece a ninguna empresa: el panel general le mostraba
    // cuatro casilleros vacios y dos avisos sobre "tu empresa". Va directo a lo suyo.
    if (user.rol === 'superadmin') {
      return res.json({ redirect: '/pages/superadmin.html'})
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
  // Si el administrador le volvió a la contraseña inicial con la sesión
  // abierta, la foto de la sesión no lo sabe: se mira el estado de ahora.
  res.json({ ...req.session.user, debe_cambiar_password: !!req.estadoSesion?.debe_cambiar_password })
}

exports.getUsuariosEmpresa = async (req, res) => {

  try {

    const { id: id_empresa } = req.session.user.empresa

    const usuarios = await userModel.findByEmpresa(id_empresa)
    res.json(usuarios)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al cargar usuarios' })
  }

}

exports.crearUsuario = async (req, res) => {

  try {
    const { nombre, apellido, email, dni, id_rol } = req.body
    const id_empresa = req.session.user.empresa.id

    if (!nombre || !apellido || !email || !dni || !id_rol) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' })
    }

    // Sin esto, un administrador de empresa podria crear un superadmin
    // mandando el pedido a mano, aunque la pantalla no le ofrezca esa opcion.
    if (!ROLES_ASIGNABLES.includes(Number(id_rol))) {
      return res.status(400).json({ error: 'Elegí un rol de la lista' })
    }

    // El mismo control que hace la edicion: sin esto entraba cualquier texto
    // como email y quedaba una cuenta con un dato de contacto inservible.
    if (!esEmailValido(String(email))) {
      return res.status(400).json({ error: 'El email no tiene un formato válido' })
    }

    // El DNI se guarda como se valida: sin puntos ni espacios. Si no, "41.111.111"
    // pasaba como otro DNI distinto de "41111111", y la contraseña temporal
    // quedaba con puntos: "tu contraseña es tu DNI" dejaba de ser cierto
    // (QA final, M1).
    const dniLimpio = limpiarDni(dni)
    if (!esDniValido(dniLimpio)) {
      return res.status(400).json({ error: 'El DNI debe tener entre 7 y 9 dígitos' })
    }

    const largo = validarLargos(req.body, LARGOS.usuario)
    if (largo) {
      return res.status(400).json({ error: largo.error })
    }

    if (await userModel.findByEmail(email)) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' })
    }

    if (await userModel.findByDni(dniLimpio)) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese DNI' })
    }

    // Contraseña temporal = dni del usuario
    const hashedPassword = await bcrypt.hash(dniLimpio, 10)

    await userModel.createInterno({
      nombre, apellido, email, dni: dniLimpio,
      password_hash: hashedPassword,
      id_rol,
      id_empresa,
      debe_cambiar_password: 1
    })

    res.status(201).json({ message: `Usuario creado. Su contraseña inicial es su DNI (${dniLimpio}): la va a cambiar la primera vez que entre.` })

  } catch (error) {
    console.error(error)

    const repetido = mensajeDeDuplicado(error, DUPLICADOS_USUARIO)
    if (repetido) return res.status(400).json({ error: repetido })

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

    // String(): un número o una lista en vez de texto daba 500 al hacer .trim()
    if ([nombre, apellido, email, dni].some(v => typeof v !== 'string' || !v.trim()) || !id_rol) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' })
    }

    const emailLimpio = email.trim()

    if (!esEmailValido(emailLimpio)) {
      return res.status(400).json({ error: 'El email no tiene un formato válido' })
    }

    if (!ROLES_ASIGNABLES.includes(Number(id_rol))) {
      return res.status(400).json({ error: 'Elegí un rol de la lista' })
    }

    const largo = validarLargos(req.body, LARGOS.usuario)
    if (largo) {
      return res.status(400).json({ error: largo.error })
    }

    if (await userModel.findByEmailExcluyendo(emailLimpio, objetivo.id)) {
      return res.status(400).json({ error: 'Ya existe otro usuario con ese email' })
    }

    // Mismo criterio que el alta: sin puntos ni espacios. La edición ni
    // siquiera revisaba el formato.
    const dniLimpio = limpiarDni(dni)
    if (!esDniValido(dniLimpio)) {
      return res.status(400).json({ error: 'El DNI debe tener entre 7 y 9 dígitos' })
    }

    if (await userModel.findByDniExcluyendo(dniLimpio, objetivo.id)) {
      return res.status(400).json({ error: 'Ya existe otro usuario con ese DNI' })
    }

    await userModel.update(objetivo.id, {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: emailLimpio,
      dni: dniLimpio,
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
// El superadmin resetea a los administradores de empresa.
// El administrador de empresa resetea a los usuarios de SU empresa.
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

      if (objetivo.id_rol !== ROL.ADMIN_EMPRESA) {
        return res.status(403).json({ error: 'Sólo podés volver a la contraseña inicial a los administradores de empresa' })
      }

    } else {

      // admin_empresa
      if (objetivo.id_empresa !== solicitante.empresa.id) {
        return res.status(403).json({ error: 'Ese usuario no pertenece a tu empresa' })
      }

      if (objetivo.id_rol === ROL.ADMIN_EMPRESA || objetivo.id_rol === ROL.SUPERADMIN) {
        return res.status(403).json({ error: 'No podés volver a la contraseña inicial a otro administrador' })
      }

    }

    const hashedPassword = await bcrypt.hash(objetivo.dni, 10)
    await userModel.resetPassword(objetivo.id, hashedPassword)

    res.json({ message: `Listo: la contraseña volvió a ser el DNI (${objetivo.dni}). Al entrar va a tener que elegir una nueva.` })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al volver a la contraseña inicial' })
  }

}

exports.cambiarPassword = async (req, res) => {

  try {

    const { password_nuevo, password_confirm } = req.body
    const id = req.session.user.id

    if (typeof password_nuevo !== 'string' || typeof password_confirm !== 'string' || !password_nuevo || !password_confirm) {
      return res.status(400).json({ error: 'Completar ambos campos' })
    }

    if (password_nuevo !== password_confirm) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' })
    }

    if (password_nuevo.length < PASSWORD_MINIMO) {
      return res.status(400).json({ error: `La contraseña debe tener al menos ${PASSWORD_MINIMO} caracteres` })
    }

    // Con la contraseña inicial alcanza la nueva: es el primer ingreso. Si la
    // contraseña ya es propia, hay que poner la actual: si no, cualquiera
    // sentado frente a una sesión abierta se la cambiaba y la dejaba afuera
    // (QA entrega 2, B2).
    if (!req.estadoSesion?.debe_cambiar_password) {
      const actual = req.body.password_actual
      const usuario = await userModel.findById(id)
      if (typeof actual !== 'string' || !actual || !usuario || !await bcrypt.compare(actual, usuario.password_hash)) {
        return res.status(400).json({ error: 'Para cambiar tu contraseña, escribí primero la que usás ahora' })
      }
    }

    const hashed = await bcrypt.hash(password_nuevo, 10)
    await userModel.updatePassword(id, hashed)

    res.json({ message: 'Contraseña actualizada correctamente', redirect: '/pages/dashboard.html' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al cambiar la contraseña' })
  }
  
}
