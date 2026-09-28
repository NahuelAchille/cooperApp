// Armado de los archivos que se descargan (HU-54).
//
// Los datos NO se consultan aca: llegan ya armados, los mismos que alimentan
// la pantalla. Es la regla que ordena todo el modulo de reportes -- si el
// archivo hiciera su propia consulta, el dia que una cambie el PDF diria un
// numero y la pantalla otro, y nadie se enteraria hasta que alguien compare.

// =====================================================================
// EL NOMBRE DEL ARCHIVO
// =====================================================================

// Deja un texto apto para un nombre de archivo en cualquier sistema.
// Sin acentos, sin espacios y sin los caracteres que Windows prohibe
// (\ / : * ? " < > |), que si no el navegador guarda cualquier cosa.
const paraNombreDeArchivo = (texto) =>
  String(texto)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // saca los acentos
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 40)

// El periodo VA EN EL NOMBRE, que es lo que pide la historia: sin eso, tres
// descargas del mismo reporte quedan como "reporte", "reporte(1)" y
// "reporte(2)" en la carpeta de Descargas, y despues no se sabe cual es cual.
const nombreDeArchivo = ({ empresa, vista, periodo, extension }) =>
  [paraNombreDeArchivo(empresa), paraNombreDeArchivo(vista),
   periodo.desde, 'a', periodo.hasta].join('-') + '.' + extension

// =====================================================================
// CSV
// =====================================================================

// Se arma para que ABRA BIEN EN EXCEL EN ESPAÑOL, que es donde lo van a
// abrir. Dos cosas que no son opcionales:
//
//   1. El separador es PUNTO Y COMA, no coma. Excel en configuracion regional
//      española usa la coma como separador DECIMAL, asi que con comas de
//      separador mete todo en una sola columna.
//   2. Los numeros van con COMA decimal, por lo mismo: con punto, Excel lee
//      "1234.50" como texto y despues no se puede sumar la columna.
//
// Y el archivo arranca con BOM (﻿): sin eso Excel abre el UTF-8 como si
// fuera latin1 y "Metalúrgica" se ve "MetalÃºrgica". Es el mismo problema de
// juego de caracteres que ya mordio en la base.

const SEPARADOR = ';'

// Caracteres con los que Excel arranca una FORMULA. Una celda que empieza
// asi no se muestra: se ejecuta.
const ARRANQUE_DE_FORMULA = ['=', '+', '-', '@', '\t', '\r']

// Envuelve un valor para que el CSV no se rompa Y no se ejecute.
//
// Lo segundo importa tanto como lo primero. Si alguien carga un movimiento con
// la descripcion "=1+1", Excel no la muestra: la CALCULA. Y con funciones como
// HYPERLINK o DDE se puede llegar a sacar datos de la planilla o a pedirle al
// que la abre que corra algo. El texto lo escribe cualquier usuario de la
// empresa, y el archivo lo abre el administrador: es el mismo camino que el
// XSS almacenado del Sprint 06, en otra salida.
//
// Se le antepone un apostrofe, que es la marca de "esto es texto" de Excel: se
// ve el contenido tal cual y no se evalua nada.
const celda = (valor) => {
  if (valor === null || valor === undefined) return ''

  let texto = String(valor)

  if (ARRANQUE_DE_FORMULA.includes(texto.charAt(0))) {
    texto = "'" + texto
  }

  // Si trae el separador, comillas o un salto de linea, va entre comillas y
  // las comillas de adentro se duplican. Es el escape estandar del formato.
  if (texto.includes(SEPARADOR) || texto.includes('"') || texto.includes('\n') || texto.includes('\r')) {
    return '"' + texto.replace(/"/g, '""') + '"'
  }
  return texto
}

// Un numero como lo espera Excel en español: coma decimal y sin separador de
// miles (el de miles lo pone Excel al mostrarlo, y si viene en el archivo lo
// lee como texto).
const numero = (valor) => {
  if (valor === null || valor === undefined) return ''
  return Number(valor).toFixed(2).replace('.', ',')
}

// Una fecha como AAAA-MM-DD. Excel la reconoce y ademas ordena bien como
// texto, que es lo que pasa si la configuracion regional no la interpreta.
const fecha = (valor) => {
  if (!valor) return ''
  const d = new Date(valor)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Arma el CSV a partir de un encabezado y las filas ya resueltas.
//
// Las lineas van con \r\n, que es lo que espera Excel en Windows.
const armarCSV = ({ titulo, empresa, periodo, avisos = [], encabezado, filas }) => {

  const lineas = []

  // Un encabezado de tres lineas antes de la tabla: que empresa, que reporte y
  // de que periodo. El archivo sale de la app y termina en el mail de alguien;
  // sin esto es una grilla de numeros sin contexto.
  lineas.push(celda(empresa))
  lineas.push(celda(titulo))
  lineas.push(celda('Período: ' + periodo.etiqueta))

  // Los avisos que la pantalla muestra tambien van al archivo: si en pantalla
  // dice "hay 3 anulados que no entran" y el archivo no, el que recibe el
  // archivo saca otra conclusion.
  avisos.forEach(a => lineas.push(celda(a)))

  lineas.push('')   // una fila en blanco separa el encabezado de la tabla
  lineas.push(encabezado.map(celda).join(SEPARADOR))
  filas.forEach(f => lineas.push(f.map(celda).join(SEPARADOR)))

  return '﻿' + lineas.join('\r\n')
}

module.exports = { armarCSV, nombreDeArchivo, numero, fecha, paraNombreDeArchivo }
