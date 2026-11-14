# CooperApp

Aplicación web para que una empresa (de un monotributista a una PyME) lleve su
**plata**, su **mercadería** y sus **servicios** en un solo lugar, y encuentre a
otras empresas cercanas que le ofrecen lo que necesita.

Trabajo práctico de **Prácticas Profesionalizantes 2** · Tecnicatura Superior en
Desarrollo de Software · Centro Regional Universitario Ituzaingó · 2026.
Grupo 3 · ABZ: Aguilera Maximiliano, Hoyos Franco, Delipetro Ezequiel y Achille Nahuel.

> El proyecto nació para cooperativas y en septiembre de 2026 pasó a apuntar a
> empresas en general. El grupo decidió **mantener el nombre `CooperApp`**
> (noviembre de 2026), así que el nombre de la app y el de la base (`cooperApp`)
> quedan como están.

**Todo corre en tu computadora** (`localhost`). No hay servidor en internet ni hace
falta ninguna cuenta ni clave de un servicio externo.

---

## Qué hace

El sistema se arma por **módulos**: el administrador de cada empresa prende sólo
los que usa, y el menú muestra eso.

| Módulo | Qué hace |
|---|---|
| **Movimientos** | La plata: lo que entró y lo que salió, con categorías propias. Es la base y no se apaga |
| **Productos** | Catálogo con categorías y subcategorías, stock calculado, avisos de reposición, y la venta y la compra en un solo paso |
| **Servicios** | Lo mismo que Productos pero sin stock, y cuánta plata deja cada servicio |
| **Reportes** | Por período, agrupado por categoría, producto o servicio, lo que se perdió, y descarga en CSV y PDF |
| **Articulación** | Un buscador entre empresas: escribís "papel" y aparecen las que lo ofrecen, de la más cercana a la más lejana |

Hay cuatro roles: **administrador de la empresa**, **tesorero** (la plata),
**operador** (el depósito) y **superadmin** (la plataforma: aprueba las empresas
que se registran; no pertenece a ninguna).

---

## Qué necesitás tener instalado

| Programa | Versión probada | Para qué |
|---|---|---|
| [Node.js](https://nodejs.org) | 24.19 | Corre la aplicación |
| [XAMPP](https://www.apachefriends.org) | 8.2.12 (trae MariaDB 10.4) | La base de datos. Sólo se usa **MySQL**: Apache no hace falta |
| [Git](https://git-scm.com) | cualquiera | Bajar el proyecto |

En XAMPP el usuario `root` tiene que quedar **sin contraseña**, que es como viene
de fábrica. Si le pusiste una, cambiala en `src/config/db.js`.

---

## Instalación, la primera vez

Los comandos son para la terminal de Windows (`cmd`) o Git Bash, parado en la
carpeta del proyecto.

### 1. Bajar el proyecto

```
git clone https://github.com/NahuelAchille/cooperApp.git
cd cooperApp
```

### 2. Instalar las librerías — no te lo saltees

```
npm install
```

Baja las librerías que usa la app (Express, `mysql2`, `bcrypt`,
`express-session` y `pdfkit`) a una carpeta `node_modules`. **Esa carpeta no viaja
en git** (desde noviembre de 2026): la lista de qué bajar y en qué versión está en
`package.json` y `package-lock.json`. Sin este paso la app no arranca y dice
`Cannot find module`.

Al terminar puede mostrar dos avisos que **son normales y no hay que hacerles
caso**: uno de `allow-scripts` sobre `bcrypt` (ya viene compilado para Windows, no
necesita nada más) y otro que dice que hay *vulnerabilities*. **No corras
`npm audit fix`**: cambia versiones de las librerías por su cuenta.

### 3. Prender MySQL

Abrí el **XAMPP Control Panel** y apretá **Start** en la fila de **MySQL**. Tiene
que quedar en verde.

### 4. Crear la base de datos

```
"C:\xampp\mysql\bin\mysql.exe" -u root < database.sql
"C:\xampp\mysql\bin\mysql.exe" -u root < datos_de_prueba.sql
```

- `database.sql` crea la base `cooperApp` con sus tablas, las listas fijas
  (localidades, rubros, módulos) y el usuario superadmin.
- `datos_de_prueba.sql` carga cinco empresas de ejemplo con sus usuarios,
  movimientos, productos, servicios y stock. Es opcional, pero sin eso no hay nada
  para mirar.

En Git Bash la ruta se escribe `/c/xampp/mysql/bin/mysql.exe`, sin comillas.

### 5. Levantar la aplicación

```
npm start
```

Cuando diga `Servidor corriendo en puerto 3000`, abrí
**http://localhost:3000** en el navegador. Para apagarla, `Ctrl + C` en esa misma
terminal.

---

## Usuarios para entrar

| Quién | Email | Contraseña |
|---|---|---|
| **Superadmin** (aprueba empresas) | `superadmin@cooperapp.com` | `password` |
| Administradora de La Esperanza (la empresa más completa) | `marta@laesperanza.com.ar` | `esperanza123` |

Todos los demás usuarios de prueba, qué tiene cada empresa y qué conviene probar
están en **[`usuario de prueba.txt`](usuario%20de%20prueba.txt)**.

Una empresa nueva se registra desde la pantalla de inicio, queda **pendiente**, y
el superadmin la aprueba desde su panel. Recién ahí su administrador puede entrar.

---

## Después de cada `git pull`

1. **`npm install`**, por si alguien sumó una librería.
2. **Si cambió `database.sql`**, hay que **borrar la base y crearla de nuevo**:
   `database.sql` no borra nada, así que importarlo encima de una base vieja falla
   a medias y deja tablas viejas mezcladas con las nuevas.
   ```
   "C:\xampp\mysql\bin\mysql.exe" -u root -e "DROP DATABASE cooperApp;"
   "C:\xampp\mysql\bin\mysql.exe" -u root < database.sql
   "C:\xampp\mysql\bin\mysql.exe" -u root < datos_de_prueba.sql
   ```
   Esto borra todo lo que hayas cargado a mano.
3. **Reiniciar la app** (`Ctrl + C` y `npm start` otra vez). Se cierran las
   sesiones abiertas: hay que volver a entrar.

Si sólo querés **volver los datos de prueba a como estaban**, sin tocar las
tablas, alcanza con correr `datos_de_prueba.sql` de nuevo.

---

## Si algo no anda

| Lo que ves | Qué pasa | Qué hacer |
|---|---|---|
| `Cannot find module 'express-session'` (o `mysql2`, o `bcrypt`) | Faltan librerías | `npm install` |
| Al entrar dice *"Error del servidor"* | Casi siempre es la base. **La app arranca igual aunque la base no ande**: el problema recién aparece al primer pedido, y el detalle está en la terminal donde corre la app | Mirar esa terminal (las tres filas que siguen) |
| `ECONNREFUSED ... 3306` en la terminal | MySQL está apagado | Start en XAMPP |
| `Unknown database 'cooperApp'` en la terminal | No se creó la base | Paso 4 |
| `Table ... doesn't exist` o `Unknown column` en la terminal | La base es de una versión anterior | Borrarla y crearla de nuevo (ver arriba) |
| `EADDRINUSE ... 3000` | Ya hay otra copia de la app prendida | Cerrar esa terminal, o `taskkill /F /IM node.exe` (apaga **todos** los programas de Node) |
| Entrás y todo aparece vacío | Corriste `datos_de_prueba.sql` con la sesión abierta y cambiaron los números internos de las empresas | Cerrar sesión y volver a entrar |
| El botón del PDF dice que falta una librería | No se corrió `npm install` después del pull | `npm install` y reiniciar la app. El resto del sistema anda igual |
| Acentos rotos al probar con `curl` o `mysql` desde Git Bash | Es la consola, no la app | Escribir el texto en un archivo y pasárselo |

---

## Cómo está armado el código

**Stack**: Node.js + Express 5 · MariaDB/MySQL con `mysql2` · sesiones con
`express-session` · contraseñas con `bcrypt` · PDF con `pdfkit` · del lado de la
pantalla, HTML, CSS y JavaScript sin framework, con Bootstrap 5 y Font Awesome por
CDN. Sin ORM.

Sigue el patrón **MVC**:

```
cooperApp/
├── app.js                  arranca el servidor y monta las rutas
├── database.sql            el esquema y las listas fijas
├── datos_de_prueba.sql     las empresas de ejemplo (se puede correr muchas veces)
└── src/
    ├── config/             conexión a la base y datos que carga el sistema
    ├── routes/             qué dirección atiende quién, y con qué permisos
    ├── middlewares/        los controles que van antes: sesión, rol y módulo
    ├── controllers/        las reglas y las validaciones
    ├── models/             las consultas SQL (siempre con parámetros)
    ├── services/           lo que comparten varios controladores (fechas, archivos, distancias)
    └── views/              lo que se ve: HTML que le pide los datos a la API con fetch
        ├── pages/          una pantalla por archivo
        ├── components/     el encabezado y las piezas que usan varias pantallas
        └── styles/         una hoja por pantalla, más las compartidas
```

Toda ruta que necesita permiso pasa por tres controles, en este orden:

```js
router.get('/', requireLogin, requireRol('admin_empresa', 'operador'), requireModulo('productos'), ctrl.listar)
```

- **`requireLogin`**: hay sesión, el usuario sigue activo y su empresa no está
  suspendida (se revisa contra la base en cada pedido).
- **`requireRol`**: la persona tiene permiso para esto.
- **`requireModulo`**: la empresa tiene prendido ese módulo.

Esconder un botón en la pantalla no alcanza: los controles van siempre del lado
del servidor.

### Dos variables opcionales

Sirven para levantar una segunda copia de la app al mismo tiempo, por ejemplo
para probar algo sin pisar la base de otra persona. Casi nunca hacen falta.

| Variable | Qué cambia | Si no se pone |
|---|---|---|
| `PORT` | El puerto | `3000` |
| `DB_NAME` | La base de datos | `cooperApp` |

---

## Más documentación

| Dónde | Qué hay |
|---|---|
| [`docs/manual-de-usuario.md`](docs/manual-de-usuario.md) | **El manual de uso**, ordenado por lo que la persona quiere hacer: registrar la empresa, cargar plata, vender, comprar, sacar reportes, buscar otras empresas, configurar |
| [`docs/lo-que-falta.md`](docs/lo-que-falta.md) | **Lo que quedó para más adelante** y cómo encararlo (recursos humanos, chat, correos, seguridad), con la lista de pasos para agregar un módulo nuevo sin romper nada |
| [`docs/modelo-de-datos.md`](docs/modelo-de-datos.md) | **El modelo de datos**: qué guarda cada tabla, cómo se relacionan, cómo se calculan el stock y el balance, y cómo cambiar el esquema sin romper nada |
| [`usuario de prueba.txt`](usuario%20de%20prueba.txt) | Todos los usuarios de prueba, qué tiene cada empresa y qué probar |
| [`auditorias/`](auditorias/) | Las auditorías de calidad (QA) y de experiencia de uso (UX): los prompts para correrlas y los informes de cada sprint |
| `Backlog_CooperApp_2026.xlsx` | El backlog: historias, tareas y sprints |
| `ABZ.CooperApp Validación de idea - versión 2 (empresas)` (`.pdf` y `.docx`) | **La validación de idea vigente** (noviembre de 2026): el producto para empresas, qué cambió respecto de la primera y por qué. El `.docx` es para editarla |
| `ABZ.CooperAppValidaciónDeIdeaDeProductoDeSoftware (1).pdf` | La primera validación de idea (agosto de 2026), cuando el producto era para cooperativas. Se conserva como historia |
