// Los filtros, plegados detrás de un botón en el celular (UX 28/09, H-05).
//
// En 375 px el encabezado, el título y el bloque de filtros se comían la
// pantalla entera: el primer dato aparecía en el píxel 653 en Stock y en el
// 716 en Servicios, sobre 812. Los filtros se usan de vez en cuando; la lista
// se mira siempre.
//
// CÓMO SE USA (en cualquier pantalla):
//   1. <link rel="stylesheet" href="/styles/filtros-plegables.css">
//   2. a la caja de filtros, la clase "filtros-plegables"
//   3. <script src="/components/filtros-plegables.js"></script> al final
//
// En 768 px o más no cambia nada: los filtros siguen a la vista.
//
// El botón dice cuántos filtros hay puestos. Sin eso, con los filtros
// plegados, una lista corta se lee como "hay pocos" cuando en realidad es
// "estoy filtrando".

(function () {

  // Cuántos campos de la caja tienen algo elegido.
  function contarPuestos(caja) {
    let puestos = 0
    caja.querySelectorAll('input, select').forEach(campo => {
      if (campo.type === 'checkbox' || campo.type === 'radio') {
        if (campo.checked) puestos++
      } else if (campo.type !== 'hidden' && campo.value) {
        puestos++
      }
    })
    return puestos
  }

  function preparar(caja) {
    const boton = document.createElement('button')
    boton.type = 'button'
    boton.className = 'btn-filtros'
    boton.setAttribute('aria-expanded', 'false')
    caja.before(boton)

    const pintar = () => {
      const puestos = contarPuestos(caja)
      const abierta = caja.classList.contains('abierto')
      boton.innerHTML =
        `<span><i class="fa-solid fa-sliders me-2"></i>Filtros` +
        (puestos ? ` <span class="filtros-puestos">${puestos} ${puestos === 1 ? 'puesto' : 'puestos'}</span>` : '') +
        `</span><i class="fa-solid ${abierta ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>`
      boton.setAttribute('aria-expanded', String(abierta))
      // Si la caja está escondida por la pantalla (d-none), el botón también:
      // un botón que despliega algo que no está es un botón que no hace nada.
      boton.classList.toggle('d-none', caja.classList.contains('d-none'))
    }

    boton.addEventListener('click', () => {
      caja.classList.toggle('abierto')
      pintar()
    })

    // Los cambios de la persona se ven al momento. Lo que cambia un botón de
    // la propia caja (Limpiar filtros) se ve apenas termina su propio click.
    caja.addEventListener('input', pintar)
    caja.addEventListener('change', pintar)
    caja.addEventListener('click', () => setTimeout(pintar, 0))

    // La pantalla muestra o esconde la caja cambiándole la clase.
    new MutationObserver(pintar).observe(caja, { attributes: true, attributeFilter: ['class'] })

    pintar()
    caja._pintarFiltros = pintar
  }

  document.querySelectorAll('.filtros-plegables').forEach(preparar)

  // Para cuando una pantalla cambia un filtro por código (por ejemplo, el
  // botón "ver el historial de este producto" de Stock): así el contador no
  // queda diciendo lo de antes.
  window.actualizarFiltrosPlegables = () =>
    document.querySelectorAll('.filtros-plegables').forEach(c => c._pintarFiltros && c._pintarFiltros())
})()
