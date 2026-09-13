const bcrypt = require('bcrypt')
const userModel = require('../models/user.model')
const empresaModel = require('../models/empresa.model')

const ID_ROL_ADMIN = 1

exports.registerEmpresa = async (req, res) => {

  try {

    const {empresa_nombre, empresa_email, empresa_cuit, empresa_matricula, empresa_federacion, empresa_domicilio,nombre, apellido, email, dni, password, password_confirm} = req.body

    if (!empresa_nombre || !empresa_email || !empresa_cuit || !empresa_matricula) {
      return res.status(400).json({ error: 'Faltan datos obligatorios de la empresa' })
    }

    if (!nombre || !apellido || !email || !dni || !password) {
      return res.status(400).json({ error: 'Faltan datos obligatorios del administrador' })
    }

    if (password !== password_confirm) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' })
    }

    if (await empresaModel.findByEmail(empresa_email)) {
      return res.status(400).json({ error: 'Ya existe una empresa con ese email' })
    }

    if (await empresaModel.findByCuit(empresa_cuit)) {
      return res.status(400).json({ error: 'Ya existe una empresa con ese CUIT' })
    }

    if (await empresaModel.findByMatricula(empresa_matricula)) {
      return res.status(400).json({ error: 'Ya existe una empresa con esa matrícula' })
    }

    if (await userModel.findByEmail(email)) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' })
    }

    if (await userModel.findByDni(dni)) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese DNI' })
    }

    const id_empresa = await empresaModel.create({
      nombre: empresa_nombre,
      email: empresa_email,
      cuit: empresa_cuit,
      matricula: empresa_matricula,
      federacion: empresa_federacion,
      domicilio: empresa_domicilio
    })

    const hashedPassword = await bcrypt.hash(password, 10)
    await userModel.create({
      nombre, apellido, email, dni,
      password_hash: hashedPassword,
      id_rol: ID_ROL_ADMIN,
      id_empresa
    })

    res.status(201).json({ message: 'Registro enviado. Tu empresa está pendiente de aprobación' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error del servidor' })
  }
}
