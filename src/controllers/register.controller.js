const bcrypt = require('bcrypt')
const userModel = require('../models/user.model')
const empresaModel = require('../models/empresa.model')
const { validarLargos, LARGOS, mensajeDeDuplicado } = require('../services/validacion.service')

const DUPLICADOS_REGISTRO = [['cuit', 'Ya existe una empresa con ese CUIT'],
                             ['dni', 'Ya existe un usuario con ese DNI'],
                             ['email', 'Ya existe una cuenta con ese email']]

const ID_ROL_ADMIN = 1

const LARGO_MINIMO_PASSWORD = 6

// Devolver "Faltan datos obligatorios" no alcanza: la persona acaba de escribir
// once campos y no sabe cual quedo vacio. Con el nombre del campo puede ir
// directo a corregirlo, y la pantalla ademas lo pinta de rojo.
const CAMPOS_OBLIGATORIOS = [
  ['empresa_nombre', 'Nombre de la empresa'],
  ['empresa_cuit', 'CUIT'],
  ['empresa_email', 'Email de la empresa'],
  ['nombre', 'Nombre del administrador'],
  ['apellido', 'Apellido del administrador'],
  ['email', 'Email del administrador'],
  ['dni', 'DNI'],
  ['password', 'Contraseña']
]


const esEmailValido = (valor) => typeof valor === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())

// El front necesita saber QUE campo marcar, no solo el texto del error
const faltaObligatorio = (body) => {
  for (const [campo, etiqueta] of CAMPOS_OBLIGATORIOS) {
    const valor = body[campo]
    if (valor === undefined || valor === null || String(valor).trim() === '') {
      return { campo, etiqueta }
    }
  }
  return null
}

exports.registerEmpresa = async (req, res) => {

  try {

    const {empresa_nombre, empresa_email, empresa_cuit, empresa_federacion, empresa_domicilio,nombre, apellido, email, dni, password, password_confirm} = req.body

    const falta = faltaObligatorio(req.body)
    if (falta) {
      return res.status(400).json({ error: `Falta completar: ${falta.etiqueta}`, campo: falta.campo })
    }

    if (password !== password_confirm) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden', campo: 'password_confirm' })
    }

    if (password.length < LARGO_MINIMO_PASSWORD) {
      return res.status(400).json({ error: `La contraseña tiene que tener al menos ${LARGO_MINIMO_PASSWORD} caracteres`, campo: 'password' })
    }

    const largo = validarLargos(req.body, LARGOS.registro)
    if (largo) {
      return res.status(400).json({ error: largo.error, campo: largo.campo })
    }

    if (!esEmailValido(empresa_email)) {
      return res.status(400).json({ error: 'El email de la empresa no tiene un formato válido', campo: 'empresa_email' })
    }

    if (!esEmailValido(email)) {
      return res.status(400).json({ error: 'El email del administrador no tiene un formato válido', campo: 'email' })
    }

    if (!/^\d{11}$/.test(String(empresa_cuit).replace(/[-\s]/g, ''))) {
      return res.status(400).json({ error: 'El CUIT debe tener 11 dígitos', campo: 'empresa_cuit' })
    }

    if (!/^\d{7,9}$/.test(String(dni).replace(/[.\s]/g, ''))) {
      return res.status(400).json({ error: 'El DNI debe tener entre 7 y 9 dígitos', campo: 'dni' })
    }

    if (await empresaModel.findByEmail(empresa_email)) {
      return res.status(400).json({ error: 'Ya existe una empresa con ese email', campo: 'empresa_email' })
    }

    if (await empresaModel.findByCuit(empresa_cuit)) {
      return res.status(400).json({ error: 'Ya existe una empresa con ese CUIT', campo: 'empresa_cuit' })
    }

    if (await userModel.findByEmail(email)) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email', campo: 'email' })
    }

    if (await userModel.findByDni(dni)) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese DNI', campo: 'dni' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Empresa y administrador se crean juntos o no se crea ninguno: si el alta
    // del usuario falla, una empresa sin administrador queda inservible y ademas
    // deja ocupados el email y el CUIT.
    await empresaModel.createConAdmin(
      {
        nombre: empresa_nombre,
        email: empresa_email,
        cuit: empresa_cuit,
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

    // Si dos registros con el mismo dato entran al mismo tiempo, los dos pasan
    // los controles de arriba y la restriccion de la base frena al segundo.
    const repetido = mensajeDeDuplicado(error, DUPLICADOS_REGISTRO)
    if (repetido) return res.status(400).json({ error: repetido })

    res.status(500).json({ error: 'Error del servidor' })
  }
}
