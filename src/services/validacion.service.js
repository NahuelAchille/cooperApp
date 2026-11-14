// Validaciones compartidas entre controladores.

// Controla que ningun texto pase el largo de su columna.
//
// Hace falta hacerlo a mano: MariaDB de XAMPP viene sin modo estricto, y sin
// el la base NO rechaza lo que no entra, lo guarda CORTADO. Asi se llego a
// crear un usuario con el email cortado a la mitad: la cuenta existia y esa
// persona no podia iniciar sesion nunca, con su email y su DNI ya ocupados.
//
// La app ademas pide modo estricto al conectarse (src/config/db.js), pero eso
// cambia el sintoma: sin este control la base tiraria un error y la persona
// veria "Error del servidor" en vez de saber que campo acortar.
//
// Recibe el cuerpo del pedido y una lista de [campo, etiqueta, maximo].
// Devuelve { campo, error } o null.
const validarLargos = (body, definiciones) => {

  for (const [campo, etiqueta, maximo] of definiciones) {
    const valor = body[campo]
    if (typeof valor === 'string' && valor.trim().length > maximo) {
      return { campo, error: `${etiqueta} es demasiado largo: máximo ${maximo} caracteres` }
    }
  }

  return null
}

// Los largos de las columnas que se cargan desde algun formulario.
// Si se cambia el VARCHAR en database.sql, hay que cambiarlo aca.
const LARGOS = {
  empresa: [
    ['nombre', 'El nombre de la empresa', 100],
    ['email', 'El email', 150],
    ['domicilio', 'El domicilio', 255],
    ['federacion', 'La cámara o federación', 255],
    ['telefono', 'El teléfono', 30]
  ],
  usuario: [
    ['nombre', 'El nombre', 100],
    ['apellido', 'El apellido', 100],
    ['email', 'El email', 150],
    ['dni', 'El DNI', 20]
  ],
  registro: [
    ['empresa_nombre', 'El nombre de la empresa', 100],
    ['empresa_email', 'El email de la empresa', 150],
    ['empresa_domicilio', 'El domicilio', 255],
    ['empresa_federacion', 'La cámara o federación', 255],
    ['nombre', 'El nombre', 100],
    ['apellido', 'El apellido', 100],
    ['email', 'El email', 150],
    ['dni', 'El DNI', 20]
  ]
}

// Traduce el error de clave repetida de MySQL a un mensaje para la persona.
//
// Los controladores ya preguntan "¿existe este email?" antes de insertar, pero
// entre la pregunta y el INSERT puede meterse otro pedido: dos altas del mismo
// email al mismo tiempo pasaban las dos el control, y la segunda moria con un
// "Error al crear usuario" que no ayudaba en nada. La restriccion UNIQUE de la
// base es la que decide de verdad; esto sirve para contarlo bien.
//
// Devuelve el mensaje, o null si el error es otro (y entonces es un 500 real).
const mensajeDeDuplicado = (error, campos) => {

  if (!error || error.code !== 'ER_DUP_ENTRY') return null

  const detalle = String(error.sqlMessage || '')

  for (const [clave, mensaje] of campos) {
    if (detalle.includes(clave)) return mensaje
  }

  return 'Ya existe un registro con esos datos'
}

// Convierte un monto o una cantidad en número aceptando sólo lo que una
// persona escribe: un número, o un texto como "1500" o "1500.50". Number()
// solo aceptaba también "1e3" (1000), "0x10" (16) y " 10 " (QA final,
// observación): ningún formulario los manda, pero un pedido armado a mano
// guardaba un monto que nadie escribió. Lo que no sirve devuelve NaN.
const aNumero = (valor) => {
  if (typeof valor === 'number') return valor
  if (typeof valor !== 'string' || !/^-?\d+(\.\d+)?$/.test(valor)) return NaN
  return Number(valor)
}

// Lo que entra en las columnas de la base: DECIMAL(12,2) para cantidades,
// stock mínimo, costo y precio; DECIMAL(14,2) para los montos de plata.
const TOPE_12_2 = 9999999999.99
const TOPE_14_2 = 999999999999.99

// La lectura común de un número que escribe la persona, con 2 decimales.
// Había cinco validadores que repetían estos mismos pasos, y uno (el stock
// mínimo) se había quedado con Number() en vez de aNumero(): "1e3" entraba
// ahí y rebotaba en los demás (revisión de código, 14/11/2026). Ahora los
// cinco leen acá y sólo deciden lo propio de su campo (si va vacío, si acepta
// cero, el tope y las palabras del mensaje).
//
// Devuelve:
//   { vacio: true }          no vino nada
//   { noEsNumero: true }     un booleano, un objeto, "1e3", "abc"...
//   { numero, valor }        lo escrito y lo redondeado a 2 decimales.
//
// Se redondea ANTES de que cada campo compare contra cero: si no, un 0,001
// pasa el control de "mayor que cero" y se guarda como 0,00.
const leerDecimal = (valor) => {
  if (valor === undefined || valor === null || valor === '') return { vacio: true }
  if (typeof valor !== 'number' && typeof valor !== 'string') return { noEsNumero: true }
  const numero = aNumero(valor)
  if (!Number.isFinite(numero)) return { noEsNumero: true }
  return { numero, valor: Math.round(numero * 100) / 100 }
}

// Reglas de texto que repetían varios controladores (revisión de código,
// 14/11/2026): una copia que se arregla deja a las otras con el error.

// Un nombre de categoría, tipo, subcategoría o motivo: texto, recortado, no
// vacío y que entre en la columna. Devuelve el texto limpio o null.
const limpiarNombre = (valor, maximo = 80) => {
  if (typeof valor !== 'string') return null
  const limpio = valor.trim()
  if (!limpio || limpio.length > maximo) return null
  return limpio
}

const esEmailValido = (valor) => typeof valor === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())

// El DNI y el CUIT se guardan como se validan: sin puntos, guiones ni espacios.
const limpiarDni = (valor) => String(valor ?? '').replace(/[.\s]/g, '')
const esDniValido = (limpio) => /^\d{7,9}$/.test(limpio)
const limpiarCuit = (valor) => String(valor ?? '').replace(/[-\s]/g, '')
const esCuitValido = (limpio) => /^\d{11}$/.test(limpio)

// El mínimo de una contraseña (registro y cambio de contraseña).
const PASSWORD_MINIMO = 6

module.exports = {
  validarLargos, LARGOS, mensajeDeDuplicado, aNumero, leerDecimal, TOPE_12_2, TOPE_14_2,
  limpiarNombre, esEmailValido, limpiarDni, esDniValido, limpiarCuit, esCuitValido, PASSWORD_MINIMO
}
