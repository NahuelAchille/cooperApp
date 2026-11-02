const localidadModel = require('../models/localidad.model')

// Valida la localidad que eligio una empresa. La usan el registro y "Mi
// empresa", asi que esta escrita una sola vez.
//
// Es OPCIONAL: la lista arranca con el Gran Buenos Aires, y una empresa de
// otro lado no puede quedar sin poder registrarse por no encontrar la suya.
// Sin localidad igual aparece en el buscador, pero al final y sin distancia.
//
// Devuelve { id_localidad, id_provincia } o { error }. La provincia sale de
// la localidad: no se elige aparte, asi no pueden contradecirse.
const resolverLocalidad = async (valor) => {

  if (valor === undefined || valor === null || valor === '') {
    return { id_localidad: null, id_provincia: null }
  }

  const localidad = await localidadModel.findLocalidadById(Number(valor) || 0)
  if (!localidad) {
    return { error: 'No se encontró la localidad elegida' }
  }

  return { id_localidad: localidad.id_localidad, id_provincia: localidad.id_provincia }
}

module.exports = { resolverLocalidad }
