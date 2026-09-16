// Manejo de fechas del sistema, en un solo lugar.
//
// Estaban escritas dentro de movimiento.controller.js y las necesita tambien
// el stock. Copiarlas era pedir que el dia que se corrija un error en una, la
// otra se quede con el error: las dos que estan aca se escribieron justamente
// para arreglar dos bugs de zona horaria.

// Fecha de hoy en hora local, como AAAA-MM-DD. Se arma a mano y no con
// toISOString(), que trabaja en UTC: en Argentina (UTC-3) devolveria el dia
// siguiente a partir de las 21:00.
const fechaDeHoy = () => {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
}

// Valida una fecha en formato AAAA-MM-DD y que sea un dia real del calendario.
// No usa Date para comparar, asi no depende de la zona horaria.
const parsearFecha = (valor) => {

  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null

  const [anio, mes, dia] = valor.split('-').map(Number)
  if (mes < 1 || mes > 12) return null

  // El dia 0 del mes siguiente es el ultimo del mes buscado: sirve para saber
  // cuantos dias tiene, contemplando los años bisiestos.
  const diasDelMes = new Date(anio, mes, 0).getDate()
  if (dia < 1 || dia > diasDelMes) return null

  return valor
}

// Fecha mas vieja que acepta el sistema. Sin un piso se cargaban movimientos
// en 1900; sin techo (hoy), uno fechado en el futuro tapaba para siempre los
// "movimientos recientes" del dashboard, que ordena por fecha descendente.
const FECHA_MINIMA = '2000-01-01'

// Valida que la fecha exista y este dentro del rango permitido.
// Devuelve { fecha } o { error }.
const validarFechaDeCarga = (valor) => {

  const fecha = parsearFecha(valor)
  if (!fecha) {
    return { error: 'La fecha no es válida' }
  }

  // Las fechas en AAAA-MM-DD se comparan bien como texto, sin convertirlas.
  if (fecha < FECHA_MINIMA) {
    return { error: `La fecha no puede ser anterior al ${FECHA_MINIMA.split('-').reverse().join('/')}` }
  }
  if (fecha > fechaDeHoy()) {
    return { error: 'La fecha no puede ser posterior a hoy' }
  }

  return { fecha }
}

// Pasa a AAAA-MM-DD una fecha que viene de la base.
//
// El driver de MySQL devuelve las columnas DATE como objetos Date, no como
// texto. Un String(fecha) sobre eso da "Mon Sep 15 2026 00:00:00 GMT-0300" y
// cortarle los primeros 10 caracteres devuelve "Mon Sep 15", que MySQL guarda
// despues como 0000-00-00. Por eso se arma a mano, y en hora local: usar
// toISOString() correria el dia en Argentina.
const aFechaISO = (valor) => {

  if (valor instanceof Date) {
    return `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, '0')}-${String(valor.getDate()).padStart(2, '0')}`
  }

  // Si ya viene como texto (AAAA-MM-DD o AAAA-MM-DDTHH:mm), alcanza el corte.
  return parsearFecha(String(valor).slice(0, 10))
}

module.exports = { fechaDeHoy, parsearFecha, validarFechaDeCarga, aFechaISO, FECHA_MINIMA }
