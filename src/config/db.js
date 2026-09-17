const mysql = require('mysql2/promise')

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cooperApp'
})

// MariaDB de XAMPP viene SIN modo estricto. Sin el, la base no rechaza lo que
// no entra: un texto mas largo que su columna se guarda CORTADO y la app ni se
// entera. Asi se llego a crear un usuario cuyo email quedo cortado a la mitad:
// la cuenta existia y esa persona no podia iniciar sesion nunca.
//
// Se pide por conexion y no editando el my.ini de XAMPP a proposito: asi vale
// para todo el grupo sin que nadie tenga que configurar nada en su maquina.
//
// Si falla, se avisa y la app sigue andando: quedarse sin base de datos por no
// poder ajustar una opcion seria peor que el problema que evita.
// (El evento entrega la conexion "cruda", que no usa promesas: por eso el
// callback en vez de await.)
db.on('connection', (conexion) => {
  conexion.query(
    "SET SESSION sql_mode = CONCAT(@@sql_mode, ',STRICT_TRANS_TABLES')",
    (error) => {
      if (error) console.error('No se pudo activar el modo estricto de MySQL:', error.message)
    }
  )
})

module.exports = db
