const { fechaDeHoy, parsearFecha } = require('./fecha.service')

// De que periodo habla un reporte.
//
// Existe por dos razones distintas:
//
// 1. Para quien usa la app: "¿como venimos este mes?" es una pregunta de un
//    toque, y contestarla armando dos fechas a mano es mucho pedir para un
//    publico que no vive adentro de una computadora. Los atajos resuelven los
//    tres casos que se preguntan siempre.
//
// 2. Para el sistema: que "este mes" signifique lo mismo en la pantalla, en
//    el total y en el archivo que se descargue (HU-54). Si cada uno lo
//    calculara por su cuenta, alcanzaria con que uno cuente el dia de hoy y el
//    otro no para que el reporte y su descarga digan numeros distintos.
//
// Todo se arma en hora LOCAL, nunca con toISOString(): despues de las 21:00
// en Argentina eso devuelve el dia siguiente. Es el mismo error que ya se
// arreglo una vez en el alta de movimientos.

const CLAVES = ['mes-actual', 'mes-anterior', 'anio-actual', 'personalizado']

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

const comoTexto = (fecha) => {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

const armar = (anio, mes, dia) =>
  `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

// Resuelve el periodo pedido. Devuelve { desde, hasta, etiqueta } o { error }.
//
// La etiqueta se calcula ACA y no en la pantalla: es el texto que va a
// encabezar el reporte y, manana, el nombre del archivo descargado. Si se
// escribiera en los dos lados, el dia que cambie uno el otro queda mintiendo.
const resolver = ({ periodo, desde, hasta } = {}) => {

  const clave = CLAVES.includes(periodo) ? periodo : 'mes-actual'
  const hoy = new Date()
  const anio = hoy.getFullYear()
  const mes = hoy.getMonth() + 1   // getMonth() cuenta desde 0

  if (clave === 'mes-actual') {
    return {
      desde: armar(anio, mes, 1),
      hasta: fechaDeHoy(),
      etiqueta: `${MESES[mes - 1]} de ${anio}, hasta hoy`
    }
  }

  if (clave === 'mes-anterior') {
    // Si estamos en enero, el mes anterior es diciembre del año pasado.
    const mesAnterior = mes === 1 ? 12 : mes - 1
    const anioDelMes = mes === 1 ? anio - 1 : anio
    // El dia 0 del mes siguiente es el ultimo del mes buscado. Contempla los
    // años bisiestos sin tener que saber cuantos dias tiene febrero.
    const ultimo = new Date(anioDelMes, mesAnterior, 0).getDate()
    return {
      desde: armar(anioDelMes, mesAnterior, 1),
      hasta: armar(anioDelMes, mesAnterior, ultimo),
      etiqueta: `${MESES[mesAnterior - 1]} de ${anioDelMes}`
    }
  }

  if (clave === 'anio-actual') {
    return {
      desde: armar(anio, 1, 1),
      hasta: fechaDeHoy(),
      etiqueta: `${anio}, hasta hoy`
    }
  }

  // --- personalizado ---
  // Las dos fechas son obligatorias: un reporte "desde el 5 de marzo" sin
  // cierre no es un periodo, y el total no se podria comparar contra nada.
  const inicio = parsearFecha(desde)
  const fin = parsearFecha(hasta)

  if (!inicio || !fin) {
    return { error: 'Elegí las dos fechas del período' }
  }
  if (inicio > fin) {
    return { error: 'La fecha de inicio es posterior a la de cierre' }
  }

  return {
    desde: inicio,
    hasta: fin,
    etiqueta: `del ${comoTexto(inicio)} al ${comoTexto(fin)}`
  }
}

module.exports = { resolver, CLAVES }
