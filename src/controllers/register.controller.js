const bcrypt = require('bcrypt')
const userModel = require('../models/user.model')
const cooperativaModel = require('../models/cooperativa.model')

const ID_ROL_ADMIN = 1

exports.registerCooperativa = async (req, res) => {

  try {

    const {coop_nombre, coop_email, coop_cuit, coop_matricula, coop_federacion, coop_domicilio,nombre, apellido, email, dni, password, password_confirm} = req.body

    if (!coop_nombre || !coop_email || !coop_cuit || !coop_matricula) {
      return res.status(400).json({ error: 'Faltan datos obligatorios de la cooperativa' })
    }

    if (!nombre || !apellido || !email || !dni || !password) {
      return res.status(400).json({ error: 'Faltan datos obligatorios del administrador' })
    }

    if (password !== password_confirm) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' })
    }

    if (await cooperativaModel.findByEmail(coop_email)) {
      return res.status(400).json({ error: 'Ya existe una cooperativa con ese email' })
    }

    if (await cooperativaModel.findByCuit(coop_cuit)) {
      return res.status(400).json({ error: 'Ya existe una cooperativa con ese CUIT' })
    }

    if (await cooperativaModel.findByMatricula(coop_matricula)) {
      return res.status(400).json({ error: 'Ya existe una cooperativa con esa matrícula' })
    }

    if (await userModel.findByEmail(email)) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' })
    }

    if (await userModel.findByDni(dni)) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese DNI' })
    }

    const id_cooperativa = await cooperativaModel.create({
      nombre: coop_nombre,
      email: coop_email,
      cuit: coop_cuit,
      matricula: coop_matricula,
      federacion: coop_federacion,
      domicilio: coop_domicilio
    })

    const hashedPassword = await bcrypt.hash(password, 10)
    await userModel.create({
      nombre, apellido, email, dni,
      password_hash: hashedPassword,
      id_rol: ID_ROL_ADMIN,
      id_cooperativa
    })

    res.status(201).json({ message: 'Registro enviado. Tu cooperativa está pendiente de aprobación' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error del servidor' })
  }
}
