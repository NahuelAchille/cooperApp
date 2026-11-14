// Ayudas de pantalla que usan todas las páginas.
//
// Estaban copiadas adentro de cada página: esc() 18 veces, el aviso verde 13,
// y los formatos de plata, cantidad y fecha de a tres o cuatro, con variantes
// que daban distinto ("2,5" en una pantalla y "2,50" en otra; "8/11/2026" en
// Movimientos y "08/11/2026" en Stock). Una copia que se arregla deja a las
// otras con el error (revisión de código, 14/11/2026).
//
// Se carga en cada página ANTES de su propio <script>:
//
//     <script src="/components/util.js"></script>
//
// y la página NO vuelve a definir estas funciones: una página que declara
// `const esc` además de esta da error de sintaxis y se queda sin JavaScript.

// Neutraliza lo que trae un dato cargado por una persona antes de meterlo en
// innerHTML: sin esto, un nombre con <img onerror=...> ejecuta código.
function esc (texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// El aviso flotante de arriba: verde si salió bien, rojo si no.
function mostrarToast (mensaje, esError = false) {
  const toast = document.createElement('div')
  toast.setAttribute('role', 'status')
  toast.style = `position:fixed;top:24px;left:50%;transform:translateX(-50%);background:${esError ? '#a01c1c' : '#2d7a4f'};` +
    'color:white;padding:14px 24px;border-radius:10px;z-index:9999;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,0.2);max-width:92vw'
  toast.innerHTML = `<i class="fa-solid ${esError ? 'fa-circle-exclamation' : 'fa-circle-check'} me-2"></i>${esc(mensaje)}`
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 6000)
}

// Muestra un error adentro de un formulario (el div arranca con d-none).
function mostrarError (div, mensaje) {
  div.textContent = mensaje
  div.classList.remove('d-none')
}

// "$ 8.200,00". Es el mismo formato que usan los mensajes del servidor.
const formatoMoneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
function formatMoneda (valor) {
  return formatoMoneda.format(Number(valor) || 0)
}

// "5" cuando son 5 (no "5,00"), "12,5" o "2,75" cuando tiene decimales.
// Igual que formatearCantidad del servidor (services/formato.service.js).
function formatearCantidad (valor) {
  return String(Math.round(Number(valor) * 100) / 100).replace('.', ',')
}

// Una fecha de la base ("2026-11-08" o "2026-11-08T03:00:00.000Z") como
// "08/11/2026". Se corta del texto en vez de pasarla por Date, que la correría
// por la zona horaria y de noche mostraría el día siguiente.
function formatearFecha (valor) {
  const [anio, mes, dia] = String(valor).slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

// Hoy, como "2026-11-14", en hora de acá (toISOString es UTC y después de las
// 21 da el día siguiente).
function fechaDeHoy () {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
}
