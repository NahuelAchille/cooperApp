// Con que arranca una empresa cuando la plataforma la aprueba.
//
// La idea es que el administrador pueda empezar a cargar movimientos el
// primer dia, sin tener que definir toda la clasificacion antes de poder
// usar el sistema. Nada de esto es definitivo: todo se renombra, se desactiva
// y se amplia desde "Clasificacion de movimientos".
//
// Se usan terminos genericos a proposito (por ejemplo "Impuestos nacionales"
// en vez del nombre del organismo de turno), para que no envejezcan.

const CATEGORIAS_INICIALES = [
  { nombre: 'Ventas',         naturaleza: 'ingreso', tipos: ['Venta mayorista', 'Venta minorista'] },
  { nombre: 'Otros ingresos', naturaleza: 'ingreso', tipos: ['Intereses', 'Otros'] },
  { nombre: 'Sueldos',        naturaleza: 'egreso',  tipos: ['Sueldos del personal', 'Cargas sociales'] },
  { nombre: 'Servicios',      naturaleza: 'egreso',  tipos: ['Luz', 'Gas', 'Agua', 'Internet', 'Alquiler'] },
  { nombre: 'Insumos',        naturaleza: 'egreso',  tipos: ['Compra de mercadería'] },
  { nombre: 'Impuestos',      naturaleza: 'egreso',  tipos: ['Impuestos nacionales', 'Ingresos brutos', 'Tasas municipales'] },
]

module.exports = { CATEGORIAS_INICIALES }
