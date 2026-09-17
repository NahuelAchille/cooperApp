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
    ['federacion', 'La cámara o federación', 255]
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

module.exports = { validarLargos, LARGOS, mensajeDeDuplicado }
