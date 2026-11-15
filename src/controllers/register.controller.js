const bcrypt = require('bcrypt')
const userModel = require('../models/user.model')
const empresaModel = require('../models/empresa.model')
const { validarLargos, LARGOS, mensajeDeDuplicado, esEmailValido, limpiarDni, esDniValido, limpiarCuit, esCuitValido, PASSWORD_MINIMO } = require('../services/validacion.service')
const { ROL } = require('../config/roles')
const { resolverLocalidad } = require('../services/ubicacion.service')

const DUPLICADOS_REGISTRO = [['cuit', 'Ya existe una empresa con ese CUIT'],
                             ['dni', 'Ya existe un usuario con ese DNI'],
                             ['email', 'Ya existe una cuenta con ese email']]

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

const TEXTOS_REGISTRO = [...CAMPOS_OBLIGATORIOS,
  ['empresa_federacion', 'Cámara o federación'],
  ['empresa_domicilio', 'Domicilio'],
  ['password_confirm', 'Repetir contraseña']]
const PUEDEN_SER_NUMERO = ['empresa_cuit', 'dni']

const noEsTextoEnRegistro = (body) => {
  for (const [campo, etiqueta] of TEXTOS_REGISTRO) {
    const valor = body[campo]
    if (valor === undefined || valor === null || typeof valor === 'string') continue
    if (PUEDEN_SER_NUMERO.includes(campo) && typeof valor === 'number') continue
    return { campo, etiqueta }
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

    // Es el único formulario sin sesión: un nombre mandado como objeto se
    // guardaba como "[object Object]" y una contraseña numérica rompía bcrypt
    // (QA de la entrega, B3 y B4). El CUIT y el DNI pueden venir como número.
    const noEsTexto = noEsTextoEnRegistro(req.body)
    if (noEsTexto) {
      return res.status(400).json({ error: `"${noEsTexto.etiqueta}" tiene que ser un texto`, campo: noEsTexto.campo })
    }

    if (password !== password_confirm) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden', campo: 'password_confirm' })
    }

    if (password.length < PASSWORD_MINIMO) {
      return res.status(400).json({ error: `La contraseña tiene que tener al menos ${PASSWORD_MINIMO} caracteres`, campo: 'password' })
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

    // Se guarda LO MISMO que se valida: el CUIT sin guiones ni espacios y el
    // DNI sin puntos ni espacios. Antes se validaba limpio y se guardaba como
    // venía: un CUIT con guiones (el formato de la constancia de AFIP) rebotaba
    // con "Error del servidor" (la columna es un número), y un DNI con puntos
    // se colaba como si fuera otro, con la contraseña temporal con puntos
    // (QA final, A1 y M1).
    const cuitLimpio = limpiarCuit(empresa_cuit)
    const dniLimpio = limpiarDni(dni)

    if (!esCuitValido(cuitLimpio)) {
      return res.status(400).json({ error: 'El CUIT debe tener 11 dígitos', campo: 'empresa_cuit' })
    }

    if (!esDniValido(dniLimpio)) {
      return res.status(400).json({ error: 'El DNI debe tener entre 7 y 9 dígitos', campo: 'dni' })
    }

    if (await empresaModel.findByEmail(empresa_email)) {
      return res.status(400).json({ error: 'Ya existe una empresa con ese email', campo: 'empresa_email' })
    }

    if (await empresaModel.findByCuit(cuitLimpio)) {
      return res.status(400).json({ error: 'Ya existe una empresa con ese CUIT', campo: 'empresa_cuit' })
    }

    if (await userModel.findByEmail(email)) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email', campo: 'email' })
    }

    if (await userModel.findByDni(dniLimpio)) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese DNI', campo: 'dni' })
    }

    // Opcional: la lista no tiene todas las localidades del país, y nadie
    // puede quedar sin registrarse por eso. Se completa después en Mi empresa.
    const ubicacion = await resolverLocalidad(req.body.empresa_localidad)
    if (ubicacion.error) {
      return res.status(400).json({ error: ubicacion.error, campo: 'empresa_localidad' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Empresa y administrador se crean juntos o no se crea ninguno: si el alta
    // del usuario falla, una empresa sin administrador queda inservible y ademas
    // deja ocupados el email y el CUIT.
    await empresaModel.createConAdmin(
      {
        nombre: empresa_nombre,
        email: empresa_email,
        cuit: cuitLimpio,
        federacion: empresa_federacion,
        domicilio: empresa_domicilio,
        ...ubicacion
      },
      {
        nombre, apellido, email, dni: dniLimpio,
        password_hash: hashedPassword,
        id_rol: ROL.ADMIN_EMPRESA
      }
    )

    res.status(201).json({ message: 'Registro enviado. Tu empresa todavía no fue aprobada. Cuando la aprueben vas a poder entrar con este mismo email y contraseña.' })

  } catch (error) {
    console.error(error)

    // Si dos registros con el mismo dato entran al mismo tiempo, los dos pasan
    // los controles de arriba y la restriccion de la base frena al segundo.
    const repetido = mensajeDeDuplicado(error, DUPLICADOS_REGISTRO)
    if (repetido) return res.status(400).json({ error: repetido })

    res.status(500).json({ error: 'Error del servidor' })
  }
}
