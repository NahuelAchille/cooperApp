const articulacionModel = require('../models/articulacion.model')
const rubroModel = require('../models/rubro.model')
const { distanciaKm } = require('../services/distancia.service')

// Articulacion: el buscador entre empresas (diseño del usuario, 02/11/2026).
// Se escribe lo que se necesita -- por ejemplo "papel" -- y aparecen las
// empresas que lo ofrecen, de la mas cercana a la mas lejana. Al entrar a una
// se ve su ficha: lo que ofrece y los datos de contacto que eligio mostrar.

const MAXIMO_PALABRAS = 5
const MAXIMO_LARGO = 100

// Las empresas sin ubicacion van al final, y entre las que estan a la misma
// distancia (por ejemplo, de la misma localidad), por nombre.
const porCercania = (a, b) => {
  if (a.distancia_km === null && b.distancia_km !== null) return 1
  if (a.distancia_km !== null && b.distancia_km === null) return -1
  if (a.distancia_km !== b.distancia_km) return a.distancia_km - b.distancia_km
  return a.nombre.localeCompare(b.nombre, 'es')
}

exports.buscar = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id

    const texto = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, MAXIMO_LARGO) : ''

    // Palabras de una sola letra no sirven para buscar: "a" o "y" traerian
    // todo el catalogo de todas las empresas.
    const palabras = texto.split(/\s+/).filter(p => p.length >= 2).slice(0, MAXIMO_PALABRAS)

    let id_rubro = null
    if (req.query.id_rubro) {
      const rubro = await rubroModel.findRubroById(Number(req.query.id_rubro) || 0)
      if (!rubro) {
        return res.status(400).json({ error: 'No se encontró el rubro elegido' })
      }
      id_rubro = rubro.id_rubro
    }

    if (!palabras.length && !id_rubro) {
      return res.status(400).json({ error: 'Escribí qué estás buscando (al menos 2 letras) o elegí un rubro' })
    }

    const propia = await articulacionModel.findEstadoPropio(id_empresa)
    const filas = await articulacionModel.buscar({ palabras, id_rubro, id_empresa_propia: id_empresa })

    // Una fila por producto -> una tarjeta por empresa, con lo que coincidio.
    const porEmpresa = new Map()
    for (const f of filas) {
      if (!porEmpresa.has(f.id_empresa)) {
        porEmpresa.set(f.id_empresa, {
          id_empresa: f.id_empresa,
          nombre: f.empresa_nombre,
          localidad: f.localidad_nombre,
          distancia_km: distanciaKm(propia, f),
          coincidencias: []
        })
      }
      porEmpresa.get(f.id_empresa).coincidencias.push({
        nombre: f.nombre,
        es_servicio: f.es_servicio,
        rubro: f.rubro_padre_nombre ? `${f.rubro_padre_nombre} › ${f.rubro_nombre}` : f.rubro_nombre
      })
    }

    const resultados = [...porEmpresa.values()].sort(porCercania)

    res.json({
      // Sin localidad propia no hay desde donde medir: la pantalla lo avisa,
      // en vez de mostrar un orden que parece por cercania y no lo es.
      conUbicacion: !!propia?.id_localidad,
      resultados
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al buscar entre las empresas' })
  }
}

exports.getFicha = async (req, res) => {

  try {
    const id_empresa = req.session.user.empresa.id
    const id = Number(req.params.id)

    // La propia SI se puede ver: es la forma de saber como te ven las demas.
    const ficha = Number.isInteger(id) ? await articulacionModel.findFicha(id) : null
    if (!ficha) {
      return res.status(404).json({ error: 'Esa empresa no está en el buscador' })
    }

    const propia = await articulacionModel.findEstadoPropio(id_empresa)
    const ofrece = await articulacionModel.findLoQueOfrece(id)

    // El contacto sale de lo que la empresa eligio mostrar, decidido ACA y no
    // en la pantalla: si el dato viajara y la pantalla lo escondiera, igual
    // estaria en la respuesta para cualquiera que la mire.
    const contacto = {}
    if (ficha.mostrar_email) contacto.email = ficha.email
    if (ficha.mostrar_telefono && ficha.telefono) contacto.telefono = ficha.telefono
    if (ficha.mostrar_domicilio && ficha.domicilio) contacto.domicilio = ficha.domicilio

    res.json({
      id_empresa: ficha.id_empresa,
      nombre: ficha.nombre,
      localidad: ficha.localidad_nombre,
      provincia: ficha.provincia_nombre,
      esLaPropia: ficha.id_empresa === id_empresa,
      distancia_km: ficha.id_empresa === id_empresa ? null : distanciaKm(propia, ficha),
      contacto,
      // El centro de la localidad, para el mapa. No es la direccion.
      ubicacion: ficha.latitud !== null && ficha.longitud !== null
        ? { latitud: Number(ficha.latitud), longitud: Number(ficha.longitud) }
        : null,
      ofrece: ofrece.map(p => ({
        nombre: p.nombre,
        descripcion: p.descripcion,
        es_servicio: p.es_servicio,
        rubro: p.rubro_padre_nombre ? `${p.rubro_padre_nombre} › ${p.rubro_nombre}` : p.rubro_nombre
      }))
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener la ficha de la empresa' })
  }
}

// Lo que la pantalla necesita para avisarle a la empresa por que no la
// encuentran: sin localidad no se la ordena por cercania, y sin nada marcado
// "Mostrar a otras empresas" no aparece en ninguna busqueda.
exports.getMiEstado = async (req, res) => {

  try {
    const propia = await articulacionModel.findEstadoPropio(req.session.user.empresa.id)

    res.json({
      tieneLocalidad: !!propia?.id_localidad,
      localidad: propia?.localidad_nombre || null,
      visibles: Number(propia?.visibles || 0)
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener el estado de la empresa en el buscador' })
  }
}
