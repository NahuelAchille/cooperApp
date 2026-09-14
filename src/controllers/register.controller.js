const bcrypt = require('bcrypt')
const userModel = require('../models/user.model')
const empresaModel = require('../models/empresa.model')

const ID_ROL_ADMIN = 1

// El CUIT y la matricula van a columnas numericas: si vienen fuera de rango,
// la base tira un error feo y el usuario ve "Error del servidor" sin saber
// que corregir. Se validan antes para poder decirle que pasa.
const MAX_MATRICULA = 2147483647   // lo que entra en un INT

const esEmailValido = (valor) => typeof valor === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())

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

    if (!esEmailValido(empresa_email)) {
      return res.status(400).json({ error: 'El email de la empresa no tiene un formato válido' })
    }

    if (!esEmailValido(email)) {
      return res.status(400).json({ error: 'El email del administrador no tiene un formato válido' })
    }

    if (!/^\d{11}$/.test(String(empresa_cuit).replace(/[-\s]/g, ''))) {
      return res.status(400).json({ error: 'El CUIT debe tener 11 dígitos' })
    }

    const matricula = Number(empresa_matricula)
    if (!Number.isInteger(matricula) || matricula <= 0 || matricula > MAX_MATRICULA) {
      return res.status(400).json({ error: 'La matrícula debe ser un número entero positivo' })
    }

    if (!/^\d{7,9}$/.test(String(dni).replace(/[.\s]/g, ''))) {
      return res.status(400).json({ error: 'El DNI debe tener entre 7 y 9 dígitos' })
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

    const hashedPassword = await bcrypt.hash(password, 10)

    // Empresa y administrador se crean juntos o no se crea ninguno: si el alta
    // del usuario falla, una empresa sin administrador queda inservible y ademas
    // deja ocupados el email, el CUIT y la matricula.
    await empresaModel.createConAdmin(
      {
        nombre: empresa_nombre,
        email: empresa_email,
        cuit: empresa_cuit,
        matricula,
        federacion: empresa_federacion,
        domicilio: empresa_domicilio
      },
      {
        nombre, apellido, email, dni,
        password_hash: hashedPassword,
        id_rol: ID_ROL_ADMIN
      }
    )

    res.status(201).json({ message: 'Registro enviado. Tu empresa está pendiente de aprobación' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error del servidor' })
  }
}
