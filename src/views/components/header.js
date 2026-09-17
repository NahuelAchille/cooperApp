// Carga del encabezado, compartida por todas las pantallas.
//
// Antes cada pagina repetia este mismo bloque, y cada vez que cambiaba una
// regla habia que tocarlo en siete lugares. Ahora la pagina llama:
//
//     const user = await cargarHeader()
//
// y recibe el usuario ya consultado, asi no vuelve a pedir /users/me.
//
// Que se muestra en el menu depende de dos cosas distintas:
//   - el ROL     -> que puede hacer esta persona
//   - el MODULO  -> que contrato esta empresa
// Las dos tienen que dar bien para que la opcion aparezca.

// Los modulos de la empresa quedan guardados aca despues de cargar el
// encabezado, para que las pantallas puedan preguntar sin volver a pedirlos.
let modulosEmpresa = []

// ¿Esta empresa tiene prendido este modulo? Usar DESPUES de cargarHeader().
function moduloActivo(clave) {
  return modulosEmpresa.some(m => m.clave === clave && m.activo)
}

async function cargarHeader() {

  const html = await fetch('/components/header.html').then(r => r.text())
  document.getElementById('header').innerHTML = html

  const user = await fetch('/users/me').then(r => r.json()).catch(() => null)
  if (!user || user.error) return null

  // --- Datos de la persona ---
  document.getElementById('user-avatar').textContent = (user.nombre[0] + user.apellido[0]).toUpperCase()
  document.getElementById('user-nombre').textContent = `${user.nombre} ${user.apellido}`
  document.getElementById('dropdown-empresa').textContent = user.empresa?.nombre || ''

  const esAdmin = user.rol === 'admin_empresa'
  const esFinanzas = esAdmin || user.rol === 'tesorero'

  const mostrar = (id) => document.getElementById(id)?.classList.remove('d-none')

  // --- Por rol ---
  // Toda la configuracion es del administrador de la empresa: son reglas del
  // sistema, no datos del dia a dia. Va junta en el menu principal.
  if (esAdmin) {
    mostrar('nav-usuarios')
    mostrar('nav-configuracion')
  }
  // El superadmin administra la plataforma, no una empresa: su pantalla de
  // trabajo va en el menu principal, no escondida abajo de su propio nombre.
  // Y el panel general no es suyo -- le hablaba de "tu empresa", que no tiene.
  if (user.rol === 'superadmin') {
    mostrar('nav-empresas')
    document.getElementById('nav-panel-general')?.classList.add('d-none')
    // Tampoco tiene "Mi empresa": al apretarlo se comia un
    // "Tu usuario no pertenece a ninguna empresa". Mismo caso que el panel
    // general, que le hablaba de una empresa que no tiene.
    document.getElementById('item-mi-empresa')?.classList.add('d-none')
  }

  // --- Por modulo contratado (y rol) ---
  // El superadmin no pertenece a ninguna empresa: no tiene modulos y su menu
  // se queda solo con lo de la plataforma.
  if (user.empresa?.id) {
    modulosEmpresa = await fetch('/modulos').then(r => r.ok ? r.json() : []).catch(() => [])

    if (moduloActivo('movimientos') && esFinanzas) mostrar('nav-movimientos')
    // La clasificacion del dinero es parte del modulo de movimientos: si la
    // empresa no lo tiene, no hay nada que clasificar.
    if (moduloActivo('movimientos') && esAdmin) mostrar('cfg-categorias')
    // El catalogo lo trabaja el deposito (operador) y lo arma el admin.
    // El tesorero no entra: lo suyo es el dinero.
    const esCatalogo = esAdmin || user.rol === 'operador'
    if (moduloActivo('productos') && esCatalogo) {
      mostrar('nav-productos')
      mostrar('nav-stock')
    }
    // El arbol del catalogo y los motivos de stock: el operador los usa pero
    // no los arma.
    if (moduloActivo('productos') && esAdmin) {
      mostrar('cfg-categorias-producto')
      mostrar('cfg-motivos-stock')
    }
    // El catálogo de servicios lo arma el admin y lo consulta el tesorero,
    // que es quien después dice de dónde viene cada ingreso o egreso. El
    // operador no entra: un servicio no pasa por el depósito.
    if (moduloActivo('servicios') && esFinanzas) mostrar('nav-servicios')
    if (moduloActivo('servicios') && esAdmin) mostrar('cfg-categorias-servicio')
    if (moduloActivo('reportes') && esFinanzas) mostrar('nav-reportes')
    if (moduloActivo('articulacion')) mostrar('nav-articulacion')
  } else {
    modulosEmpresa = []
  }

  // --- La hamburguesa del celular ---
  // El menú arranca cerrado (lo decide el CSS por debajo de 768 px). Acá sólo
  // se prende y se apaga la clase.
  const botonMenu = document.getElementById('btn-menu')
  const nav = document.getElementById('main-nav')

  botonMenu?.addEventListener('click', () => {
    const abierto = nav.classList.toggle('abierto')
    botonMenu.setAttribute('aria-expanded', String(abierto))
    botonMenu.querySelector('i').className = abierto ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'
  })

  // Al elegir una opción el menú se cierra solo. Sin esto queda abierto
  // tapando la pantalla a la que se acaba de entrar.
  nav?.addEventListener('click', (evento) => {
    if (evento.target.closest('a') && !evento.target.closest('.dropdown-toggle')) {
      nav.classList.remove('abierto')
      botonMenu?.setAttribute('aria-expanded', 'false')
      if (botonMenu) botonMenu.querySelector('i').className = 'fa-solid fa-bars'
    }
  })

  return user
}
