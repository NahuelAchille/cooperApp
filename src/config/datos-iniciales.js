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

// Motivos de movimiento de stock con los que arranca una empresa.
//
// Son los seis casos que aparecen en cualquier deposito. Cada uno trae su
// impacto ya resuelto, que es la parte dificil de pensar: la empresa los usa
// tal cual, los renombra o arma los suyos.
//
// Lo que conviene mirar con atencion es la columna del dinero:
//   - Compra y Venta mueven plata, y son los unicos.
//   - Consumo interno saca mercaderia para usarla en la propia empresa: no se
//     vende ni se compra nada, asi que no hay movimiento de dinero.
//   - Perdida y Robo sacan mercaderia sin que entre ni salga plata. La perdida
//     economica existe, pero no es un egreso: se ve valorizada en un reporte.
//   - El ajuste es para cuando el conteo real no coincide con el sistema. Va
//     partido en dos (positivo y negativo) porque un mismo motivo no puede a
//     veces sumar y a veces restar: el efecto es fijo, si no el historial
//     queda imposible de interpretar.
const MOTIVOS_STOCK_INICIALES = [
  { nombre: 'Compra',           efecto_stock: 'entrada', efecto_dinero: 'egreso'  },
  { nombre: 'Venta',            efecto_stock: 'salida',  efecto_dinero: 'ingreso' },
  { nombre: 'Consumo interno',  efecto_stock: 'salida',  efecto_dinero: 'ninguno' },
  { nombre: 'Pérdida',          efecto_stock: 'salida',  efecto_dinero: 'ninguno' },
  { nombre: 'Robo',             efecto_stock: 'salida',  efecto_dinero: 'ninguno' },
  { nombre: 'Ajuste positivo',  efecto_stock: 'entrada', efecto_dinero: 'ninguno' },
  { nombre: 'Ajuste negativo',  efecto_stock: 'salida',  efecto_dinero: 'ninguno' },
]

module.exports = { CATEGORIAS_INICIALES, MOTIVOS_STOCK_INICIALES }
