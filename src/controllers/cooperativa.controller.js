const cooperativaModel = require('../models/cooperativa.model')

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
    const pendientes = await cooperativaModel.findPendientes()
    res.json(pendientes)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener cooperativas pendientes' })
  }

}

exports.getAll = async (req, res) => {

  try {
    const cooperativas = await cooperativaModel.findAll()
    res.json(cooperativas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener cooperativas' })
  }
}

exports.getMiCooperativa = async (req, res) => {

  try {
    const id_cooperativa = req.session.user.cooperativa?.id

    // El superadmin administra la plataforma, no una cooperativa
    if (!id_cooperativa) {
      return res.status(404).json({ error: 'Tu usuario no pertenece a ninguna cooperativa' })
    }

    const cooperativa = await cooperativaModel.findById(id_cooperativa)
    if (!cooperativa) {
      return res.status(404).json({ error: 'No se encontró la cooperativa' })
    }

    res.json(cooperativa)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los datos de la cooperativa' })
  }

}

exports.actualizarMiCooperativa = async (req, res) => {

  try {

    const id_cooperativa = req.session.user.cooperativa.id
    const { nombre, email, federacion, domicilio } = req.body

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la cooperativa es obligatorio' })
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'El email es obligatorio' })
    }

    const emailLimpio = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
      return res.status(400).json({ error: 'El email no tiene un formato válido' })
    }

    if (await cooperativaModel.findByEmailExcluyendo(emailLimpio, id_cooperativa)) {
      return res.status(400).json({ error: 'Ya existe otra cooperativa registrada con ese email' })
    }

    const cantidadTrabajadores = aCantidad(req.body.cantidadTrabajadores)
    const cantidadDiversidad   = aCantidad(req.body.cantidadDiversidad)
    const cantidadHombre       = aCantidad(req.body.cantidadHombre)
    const cantidadMujer        = aCantidad(req.body.cantidadMujer)

    if ([cantidadTrabajadores, cantidadDiversidad, cantidadHombre, cantidadMujer].includes(undefined)) {
      return res.status(400).json({ error: 'Las cantidades deben ser números enteros de cero o más' })
    }

    await cooperativaModel.update(id_cooperativa, {
      nombre: nombre.trim(),
      email: emailLimpio,
      federacion: federacion?.trim() || null,
      domicilio: domicilio?.trim() || null,
      cantidadTrabajadores,
      cantidadDiversidad,
      cantidadHombre,
      cantidadMujer
    })

    // La sesion guarda el nombre de la cooperativa: hay que refrescarlo
    // para que el header no siga mostrando el nombre viejo.
    req.session.user.cooperativa.nombre = nombre.trim()

    res.json({ message: 'Datos actualizados correctamente' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar los datos de la cooperativa' })
  }

}

exports.aprobar = async (req, res) => {

  try {
    const { id } = req.params

    await cooperativaModel.updateEstado(id, 'activa')
    await cooperativaModel.activarUsuarioAdmin(id)
    res.json({ message: 'Cooperativa aprobada correctamente' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al aprobar la cooperativa' })
  }

}

exports.rechazar = async (req, res) => {

  try {
    const { id } = req.params
    
    await cooperativaModel.updateEstado(id, 'suspendida')
    res.json({ message: 'Cooperativa rechazada' })
    
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al rechazar la cooperativa' })
  }

}
