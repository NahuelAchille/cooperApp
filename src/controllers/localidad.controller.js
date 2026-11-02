const localidadModel = require('../models/localidad.model')

// Las coordenadas no viajan: la pantalla sólo necesita el nombre para el
// desplegable. Las usa el servidor para calcular distancias.
exports.getLocalidades = async (req, res) => {

  try {
    const localidades = await localidadModel.findLocalidades()
    res.json(localidades)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener las localidades' })
  }
}
