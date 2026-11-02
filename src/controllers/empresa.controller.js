const empresaModel = require('../models/empresa.model')
const moduloModel = require('../models/modulo.model')
const categoriaModel = require('../models/categoria.model')
const motivoStockModel = require('../models/motivo-stock.model')
const { CATEGORIAS_INICIALES, MOTIVOS_STOCK_INICIALES } = require('../config/datos-iniciales')
const { validarLargos, LARGOS } = require('../services/validacion.service')
const { resolverLocalidad } = require('../services/ubicacion.service')

// Un telefono escrito como lo escribe la gente: "11 4623-1180", "(0220) 448
// 7730", "+54 9 11 ...". Se acepta eso y nada mas, sin exigir un formato fijo.
const TELEFONO_VALIDO = /^[0-9 +()\-]{6,30}$/

// Las casillas de "que ven las otras empresas". Si el campo no viene, queda
// como estaba: un pedido viejo o armado a mano no apaga nada sin querer.
const aCasilla = (valor, actual) => {
  if (valor === undefined) return actual
  return [true, 1, '1', 'true', 'on'].includes(valor) ? 1 : 0
}

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

    const largo = validarLargos(req.body, LARGOS.empresa)
    if (largo) {
      return res.status(400).json({ error: largo.error })
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

    // Lo nuevo de Articulacion (teléfono, localidad y qué se muestra) sigue la
    // regla de "un campo que no viene no se toca": un pedido viejo, o armado
    // a mano sin estos campos, no borra la localidad ni apaga nada.
    const actual = await empresaModel.findById(id_empresa)

    let telefono = actual.telefono
    if (req.body.telefono !== undefined) {
      telefono = typeof req.body.telefono === 'string' ? req.body.telefono.trim() || null : null
    }
    if (telefono && !TELEFONO_VALIDO.test(telefono)) {
      return res.status(400).json({ error: 'El teléfono sólo puede tener números, espacios, guiones, paréntesis y el signo +' })
    }

    const ubicacion = await resolverLocalidad(
      req.body.id_localidad === undefined ? actual.id_localidad : req.body.id_localidad
    )
    if (ubicacion.error) {
      return res.status(400).json({ error: ubicacion.error })
    }

    await empresaModel.update(id_empresa, {
      nombre: nombre.trim(),
      email: emailLimpio,
      federacion: federacion?.trim() || null,
      domicilio: domicilio?.trim() || null,
      telefono,
      ...ubicacion,
      mostrar_email:     aCasilla(req.body.mostrar_email, actual.mostrar_email),
      mostrar_telefono:  aCasilla(req.body.mostrar_telefono, actual.mostrar_telefono),
      mostrar_domicilio: aCasilla(req.body.mostrar_domicilio, actual.mostrar_domicilio),
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

    // Lo mismo con los motivos de movimiento de stock. Se cargan aunque el
    // modulo de Productos venga apagado: el dia que la empresa lo prenda, ya
    // los tiene listos y no arranca con una pantalla vacia.
    const cuantosMotivos = await motivoStockModel.contarMotivos(id_empresa)
    if (cuantosMotivos === 0) {
      await motivoStockModel.crearMotivosIniciales(id_empresa, MOTIVOS_STOCK_INICIALES)
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
