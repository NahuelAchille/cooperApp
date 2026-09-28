// pdfkit se carga RECIEN CUANDO SE PIDE UN PDF, no al arrancar la app.
//
// El .gitignore del repo tiene node_modules, asi que los paquetes que se
// instalaron DESPUES de que se agregara esa linea no viajan en el pull. Con un
// require arriba de todo, a quien no corrio "npm install" no le fallaba la
// descarga: no le arrancaba la app entera, y el mensaje era un stack trace de
// Node antes de que el servidor levantara.
//
// Asi, el que no lo tenga instalado usa todo el sistema normalmente, el CSV
// tambien, y el unico que avisa es el boton del PDF, diciendo exactamente que
// hay que hacer.
let PDFDocument = null

const cargarPdfkit = () => {
  if (PDFDocument) return PDFDocument
  try {
    PDFDocument = require('pdfkit')
    return PDFDocument
  } catch (error) {
    const falta = new Error('FALTA_PDFKIT')
    falta.codigo = 'FALTA_PDFKIT'
    throw falta
  }
}

// Armado del PDF de un reporte (HU-54).
//
// Por que pdfkit y no otra cosa:
//
//   - Es JavaScript puro, SIN compilacion nativa. En este proyecto eso pesa:
//     node_modules esta commiteado y bcrypt, que si es nativo, ya obliga a
//     correr npm install cada vez que cambia la version de Node. Una libreria
//     mas con ese problema seria una trampa mas para el grupo.
//   - Funciona sin internet. Descartado puppeteer, que baja un Chromium entero
//     (unos 300 MB) para imprimir una pagina.
//   - Se genera EN EL SERVIDOR, con los mismos datos que alimentan la
//     pantalla. Hacerlo en el navegador (jsPDF por CDN) no costaba nada de
//     repositorio, pero volvia a formatear los numeros por su cuenta: dos
//     lugares que calculan lo mismo terminan discrepando, que es justo lo que
//     este modulo viene evitando desde HU-51.
//   - Se descarta tambien window.print(): el nombre del archivo lo decide el
//     navegador, y la historia pide el periodo EN EL NOMBRE. Un requisito que
//     depende de que navegador use cada uno no esta cumplido, y la DOD de este
//     proyecto exige validar en dos navegadores.
//
// El PDF se escribe DIRECTO A LA RESPUESTA (es un stream), asi que no se
// arma un archivo temporal en disco ni se junta todo en memoria.

const VERDE = '#2d7a4f'
const GRIS = '#6c7a72'
const ROJO = '#a01c1c'

const MARGEN = 40
const ANCHO_UTIL = 595.28 - MARGEN * 2   // A4 vertical menos los margenes

// Un numero de plata, con el formato de acá.
const plata = (valor) =>
  '$ ' + Number(valor || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fechaCorta = (valor) => {
  if (!valor) return ''
  const d = new Date(valor)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// Escribe el encabezado del reporte: quien, que y de cuando.
// El PDF termina impreso o en el mail de alguien, sin la app alrededor, asi
// que tiene que explicarse solo.
const encabezado = (doc, { empresa, titulo, periodo }) => {

  doc.fillColor(VERDE).fontSize(16).font('Helvetica-Bold').text(titulo, MARGEN, MARGEN)
  doc.moveDown(0.2)
  doc.fillColor('#1a2e23').fontSize(11).font('Helvetica').text(empresa)
  doc.fillColor(GRIS).fontSize(9).text('Período: ' + periodo.etiqueta)

  doc.moveDown(0.6)
  doc.moveTo(MARGEN, doc.y).lineTo(MARGEN + ANCHO_UTIL, doc.y)
     .strokeColor('#d8e6de').lineWidth(1).stroke()
  doc.moveDown(0.8)
}

// Los avisos que la pantalla muestra van tambien al PDF. Si en pantalla dice
// "hay 3 anulados que no entran" y el archivo no lo dice, el que recibe el
// archivo saca otra conclusion del mismo numero.
const avisos = (doc, textos) => {
  if (!textos.length) return
  doc.fontSize(8.5).fillColor('#6b5a2a').font('Helvetica-Oblique')
  textos.forEach(t => { doc.text(t, { width: ANCHO_UTIL }); doc.moveDown(0.2) })
  doc.font('Helvetica').moveDown(0.5)
}

// Los casilleros de totales, en una fila.
const totales = (doc, casilleros) => {
  if (!casilleros.length) return

  const ancho = ANCHO_UTIL / casilleros.length
  const y = doc.y

  casilleros.forEach((c, i) => {
    const x = MARGEN + ancho * i
    doc.fontSize(7.5).fillColor(GRIS).font('Helvetica-Bold')
       .text(c.etiqueta.toUpperCase(), x, y, { width: ancho - 8 })
    doc.fontSize(13).fillColor(c.color || '#1a2e23').font('Helvetica-Bold')
       .text(c.valor, x, y + 11, { width: ancho - 8 })
  })

  doc.y = y + 32
  doc.font('Helvetica').fillColor('#1a2e23')
  doc.moveDown(0.5)
}

// Una tabla. Las columnas llevan su ancho en porcentaje del ancho util, asi
// cada reporte reparte el espacio como le sirve.
//
// El salto de pagina se maneja a mano y REPITE EL ENCABEZADO: sin eso, a
// partir de la hoja 2 quedan columnas de numeros sin decir de que son.
const tabla = (doc, { columnas, filas }) => {

  const anchos = columnas.map(c => ANCHO_UTIL * c.ancho)
  const ALTO_FILA = 18
  const PIE_DE_PAGINA = 60

  const filaEncabezado = () => {
    const y = doc.y
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GRIS)
    let x = MARGEN
    columnas.forEach((c, i) => {
      doc.text(c.titulo.toUpperCase(), x, y, { width: anchos[i] - 6, align: c.align || 'left' })
      x += anchos[i]
    })
    doc.y = y + 12
    doc.moveTo(MARGEN, doc.y).lineTo(MARGEN + ANCHO_UTIL, doc.y)
       .strokeColor('#cfe0d6').lineWidth(1).stroke()
    doc.y += 4
    doc.font('Helvetica').fillColor('#1a2e23')
  }

  filaEncabezado()

  filas.forEach(fila => {
    // Si no entra la fila, hoja nueva y el encabezado otra vez.
    if (doc.y + ALTO_FILA > doc.page.height - PIE_DE_PAGINA) {
      doc.addPage()
      doc.y = MARGEN
      filaEncabezado()
    }

    const y = doc.y
    let x = MARGEN
    let alto = ALTO_FILA

    columnas.forEach((c, i) => {
      const valor = fila[i]
      const texto = valor && typeof valor === 'object' ? valor.texto : valor
      const color = valor && typeof valor === 'object' ? valor.color : null

      doc.fontSize(8.5).fillColor(color || '#1a2e23')
      doc.text(texto === null || texto === undefined ? '' : String(texto),
               x, y + 3, { width: anchos[i] - 6, align: c.align || 'left' })

      alto = Math.max(alto, doc.y - y + 3)
      x += anchos[i]
    })

    doc.y = y + alto
    doc.moveTo(MARGEN, doc.y).lineTo(MARGEN + ANCHO_UTIL, doc.y)
       .strokeColor('#eef4f0').lineWidth(0.5).stroke()
    doc.y += 2
  })
}

// El pie va en TODAS las hojas, al final: cuando se imprime y se sueltan las
// hojas sobre una mesa, hay que poder saber de que reporte es cada una.
const pieEnTodasLasHojas = (doc, { empresa, periodo }) => {

  const total = doc.bufferedPageRange().count

  for (let i = 0; i < total; i++) {
    doc.switchToPage(i)

    // OJO: el pie va DEBAJO del margen inferior, y pdfkit agrega una hoja
    // nueva sola cuando un texto se pasa de ese margen. Escribirlo sin esto
    // metia una hoja en blanco por cada pie -- el PDF salia con el doble de
    // paginas y el contador decia "hoja 1 de 1" porque se habia calculado
    // antes de que aparecieran.
    //
    // Se baja el margen a cero mientras se escribe el pie y se deja como
    // estaba, que es la unica forma de escribir ahi sin que salte de hoja.
    const margenOriginal = doc.page.margins.bottom
    doc.page.margins.bottom = 0

    doc.fontSize(7).fillColor(GRIS).font('Helvetica')
       .text(`${empresa} · ${periodo.etiqueta} · generado el ${fechaCorta(new Date())} · hoja ${i + 1} de ${total}`,
             MARGEN, doc.page.height - 30,
             { width: ANCHO_UTIL, align: 'center', lineBreak: false })

    doc.page.margins.bottom = margenOriginal
  }
}

// Arma el PDF y lo escribe en la respuesta. Devuelve el documento por si
// hiciera falta, pero el que llama no tiene que cerrarlo: ya se cierra aca.
const armarPDF = (res, { empresa, titulo, periodo, avisos: textos = [], casilleros = [], bloques = [] }) => {

  const PDFDoc = cargarPdfkit()

  // bufferPages hace falta para poder volver a cada hoja y escribirle el pie
  // cuando ya se sabe cuantas son.
  const doc = new PDFDoc({ size: 'A4', margin: MARGEN, bufferPages: true })
  doc.pipe(res)

  encabezado(doc, { empresa, titulo, periodo })
  avisos(doc, textos)
  totales(doc, casilleros)

  bloques.forEach((bloque, i) => {
    if (i > 0) doc.moveDown(1)
    if (bloque.titulo) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor(VERDE)
         .text(bloque.titulo.toUpperCase(), MARGEN, doc.y)
      doc.font('Helvetica').moveDown(0.3)
    }
    if (!bloque.filas.length) {
      doc.fontSize(9).fillColor(GRIS).text(bloque.vacio || 'No hay datos para este período.')
      doc.fillColor('#1a2e23')
      return
    }
    tabla(doc, bloque)
  })

  pieEnTodasLasHojas(doc, { empresa, periodo })
  doc.end()

  return doc
}

module.exports = { armarPDF, plata, fechaCorta, VERDE, ROJO, GRIS }
