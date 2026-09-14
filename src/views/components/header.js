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
  if (esAdmin) {
    mostrar('nav-usuarios')
    mostrar('item-usuarios')
    mostrar('item-modulos')
  }
  if (user.rol === 'superadmin') mostrar('item-superadmin')

  // --- Por modulo contratado (y rol) ---
  // El superadmin no pertenece a ninguna empresa: no tiene modulos y su menu
  // se queda solo con lo de la plataforma.
  if (user.empresa?.id) {
    modulosEmpresa = await fetch('/modulos').then(r => r.ok ? r.json() : []).catch(() => [])

    if (moduloActivo('movimientos') && esFinanzas) mostrar('nav-movimientos')
    // El catalogo lo trabaja el deposito (operador) y lo arma el admin.
    // El tesorero no entra: lo suyo es el dinero.
    const esCatalogo = esAdmin || user.rol === 'operador'
    if (moduloActivo('productos') && esCatalogo) mostrar('nav-productos')
    // Armar el arbol del catalogo es del admin; el operador solo lo usa.
    if (moduloActivo('productos') && esAdmin) mostrar('item-categorias-producto')
    if (moduloActivo('servicios') && esFinanzas) mostrar('nav-servicios')
    if (moduloActivo('reportes') && esFinanzas) mostrar('nav-reportes')
    if (moduloActivo('articulacion')) mostrar('nav-articulacion')
  } else {
    modulosEmpresa = []
  }

  return user
}
