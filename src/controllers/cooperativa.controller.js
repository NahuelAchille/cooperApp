const cooperativaModel = require('../models/cooperativa.model')

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
