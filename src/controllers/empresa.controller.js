const empresaModel = require('../models/empresa.model')
const moduloModel = require('../models/modulo.model')
const categoriaModel = require('../models/categoria.model')
const { CATEGORIAS_INICIALES } = require('../config/datos-iniciales')

// Convierte un campo de cantidad del formulario a numero.
// Devuelve null si vino vacio, o undefined si el valor no sirve.
const aCantidad = (valor) => {

  if (valor === undefined || valor === null || valor === '') return null

  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero < 0) return undefined

  return numero
}

exports.getPendientes = async (req, res) => {

  try {
    const pendientes = await empresaModel.findPendientes()
    res.json(pendientes)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener empresas pendientes' })
  }

}

exports.getAll = async (req, res) => {

  try {
    const empresas = await empresaModel.findAll()
    res.json(empresas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener empresas' })
  }
}

exports.getMiEmpresa = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa?.id

    // El superadmin administra la plataforma, no una empresa
    if (!id_empresa) {
      return res.status(404).json({ error: 'Tu usuario no pertenece a ninguna empresa' })
    }

    const empresa = await empresaModel.findById(id_empresa)
    if (!empresa) {
      return res.status(404).json({ error: 'No se encontró la empresa' })
    }

    res.json(empresa)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los datos de la empresa' })
  }

}

exports.actualizarMiEmpresa = async (req, res) => {

  try {

    const id_empresa = req.session.user.empresa.id
    const { nombre, email, federacion, domicilio } = req.body

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la empresa es obligatorio' })
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'El email es obligatorio' })
    }

    const emailLimpio = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
      return res.status(400).json({ error: 'El email no tiene un formato válido' })
    }

    if (await empresaModel.findByEmailExcluyendo(emailLimpio, id_empresa)) {
      return res.status(400).json({ error: 'Ya existe otra empresa registrada con ese email' })
    }

    const cantidadTrabajadores = aCantidad(req.body.cantidadTrabajadores)
    const cantidadDiversidad   = aCantidad(req.body.cantidadDiversidad)
    const cantidadHombre       = aCantidad(req.body.cantidadHombre)
    const cantidadMujer        = aCantidad(req.body.cantidadMujer)

    if ([cantidadTrabajadores, cantidadDiversidad, cantidadHombre, cantidadMujer].includes(undefined)) {
      return res.status(400).json({ error: 'Las cantidades deben ser números enteros de cero o más' })
    }

    await empresaModel.update(id_empresa, {
      nombre: nombre.trim(),
      email: emailLimpio,
      federacion: federacion?.trim() || null,
      domicilio: domicilio?.trim() || null,
      cantidadTrabajadores,
      cantidadDiversidad,
      cantidadHombre,
      cantidadMujer
    })

    // La sesion guarda el nombre de la empresa: hay que refrescarlo
    // para que el header no siga mostrando el nombre viejo.
    req.session.user.empresa.nombre = nombre.trim()

    res.json({ message: 'Datos actualizados correctamente' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar los datos de la empresa' })
  }

}

// Deja la empresa lista para trabajar desde el primer dia: prende los modulos
// basicos y le carga una clasificacion de movimientos para arrancar.
//
// Va aparte y con su propio try/catch a proposito: si algo de esto falla, la
// empresa TIENE que quedar aprobada igual. Es preferible que el administrador
// arme sus categorias a mano antes que dejarla sin poder entrar.
const prepararEmpresaNueva = async (id_empresa) => {

  try {
    await moduloModel.activarPorDefecto(id_empresa)

    // Si ya tiene categorias, no se toca: puede ser una empresa que se
    // rechazo y se volvio a aprobar, y armo lo suyo en el medio.
    const cuantas = await categoriaModel.contarCategorias(id_empresa)
    if (cuantas === 0) {
      await categoriaModel.crearCategoriasIniciales(id_empresa, CATEGORIAS_INICIALES)
    }

  } catch (error) {
    console.error('No se pudo preparar la configuración inicial de la empresa', id_empresa, error)
  }
}

exports.aprobar = async (req, res) => {

  try {
    const { id } = req.params

    await empresaModel.updateEstado(id, 'activa')
    await empresaModel.activarUsuarioAdmin(id)
    await prepararEmpresaNueva(id)

    res.json({ message: 'Empresa aprobada correctamente' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al aprobar la empresa' })
  }

}

exports.rechazar = async (req, res) => {

  try {
    const { id } = req.params
    
    await empresaModel.updateEstado(id, 'suspendida')
    res.json({ message: 'Empresa rechazada' })
    
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al rechazar la empresa' })
  }

}
