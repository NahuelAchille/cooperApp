// El bloque "Mostrar a otras empresas" de los formularios de Productos y de
// Servicios (Articulacion).
//
// Lo que una empresa ofrece en el buscador entre empresas sale de su propio
// catalogo: cada producto o servicio lleva una casilla para mostrarlo y el
// rubro de la lista comun donde va. Es el mismo bloque en las dos pantallas,
// asi que esta escrito una sola vez, igual que los filtros plegables.
//
// Sólo aparece si la empresa tiene prendido el modulo de Articulacion. Si no
// aparece, datos() devuelve {} y el servidor deja esos campos como estaban:
// apagar el modulo no le borra a nadie lo que habia elegido mostrar.
//
// COMO SE USA (despues de cargarHeader, que es el que sabe los modulos):
//   1. En el formulario:   <div id="bloque-articulacion"></div>
//   2. La hoja:            <script src="/components/articulacion-catalogo.js"></script>
//   3. Al iniciar:         await BloqueArticulacion.preparar()
//   4. Al abrir el modal:  BloqueArticulacion.llenar(producto)   // null si es alta
//   5. Al guardar:         const error = BloqueArticulacion.validar()
//                          body: { ...lo demas, ...BloqueArticulacion.datos() }

(function () {

  let visible = false
  let rubros = []


  // El desplegable va de general a especifico: cada rubro general es un grupo
  // y se puede elegir el general mismo, si ninguno especifico le calza.
  function opcionesDeRubros() {
    const generales = rubros.filter(r => r.id_rubro_padre === null)
    return '<option value="">Elegí un rubro</option>' + generales.map(g => `
      <optgroup label="${esc(g.nombre)}">
        <option value="${g.id_rubro}">${esc(g.nombre)} (en general)</option>
        ${rubros.filter(r => r.id_rubro_padre === g.id_rubro)
                .map(r => `<option value="${r.id_rubro}">${esc(r.nombre)}</option>`).join('')}
      </optgroup>`).join('')
  }

  function alCambiarCasilla() {
    const marcada = document.getElementById('art-visible').checked
    document.getElementById('art-bloque-rubro').classList.toggle('d-none', !marcada)
  }

  async function preparar(contenedorId = 'bloque-articulacion') {
    const contenedor = document.getElementById(contenedorId)
    visible = !!contenedor && typeof moduloActivo === 'function' && moduloActivo('articulacion')
    if (!visible) return

    rubros = await fetch('/rubros').then(r => r.ok ? r.json() : [])

    contenedor.innerHTML = `
      <div class="border rounded p-3 mt-3" style="background:#f6fbf8;">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="art-visible">
          <label class="form-check-label fw-bold" for="art-visible" style="color:#2d7a4f;">
            <i class="fa-solid fa-handshake me-1"></i>Mostrar a otras empresas
          </label>
        </div>
        <div class="form-text mb-2">
          Aparece en el buscador de empresas con su nombre, su descripción y su rubro.
          Nunca se muestran el stock, el costo ni el precio.
        </div>
        <div id="art-bloque-rubro" class="d-none">
          <label class="form-label">¿En qué rubro va? *</label>
          <select class="form-select" id="art-rubro">${opcionesDeRubros()}</select>
          <div class="form-text">
            Es una lista común a todas las empresas: así te encuentran aunque cada una llame distinto a sus cosas.
          </div>
        </div>
      </div>`

    document.getElementById('art-visible').addEventListener('change', alCambiarCasilla)
  }

  function llenar(producto) {
    if (!visible) return
    document.getElementById('art-visible').checked = !!producto?.visible_empresas
    document.getElementById('art-rubro').value = producto?.id_rubro ?? ''
    alCambiarCasilla()
  }

  // Devuelve el texto del error, o null si esta bien.
  function validar() {
    if (!visible) return null
    if (document.getElementById('art-visible').checked && !document.getElementById('art-rubro').value) {
      return 'Para mostrarlo a otras empresas, elegí en qué rubro va.'
    }
    return null
  }

  function datos() {
    if (!visible) return {}
    return {
      visible_empresas: document.getElementById('art-visible').checked,
      id_rubro: document.getElementById('art-rubro').value || null
    }
  }

  window.BloqueArticulacion = { preparar, llenar, validar, datos }
})()
