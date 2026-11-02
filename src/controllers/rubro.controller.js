const rubroModel = require('../models/rubro.model')

exports.getRubros = async (req, res) => {

  try {
    const rubros = await rubroModel.findRubros()
    res.json(rubros)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los rubros' })
  }
}
