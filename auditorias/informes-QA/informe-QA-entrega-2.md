# Informe de QA — CooperApp · segunda auditoría de la entrega

- **Fecha:** 15/11/2026
- **Qué se auditó:** el sistema completo, en `master` en el commit `56e4bc6` (las correcciones de las
  auditorías de QA y UX de la entrega), más los dos prompts actualizados sin commitear. Foco:
  - la **regresión** contra todos los informes anteriores, sobre todo `informe-QA-entrega.md`, que se
    corrigió entero el 15/11;
  - la sección **"LO QUE CAMBIÓ EL 15/11/2026"** de *Qué probar*: el rol revisado en cada pedido, la
    unidad fija, editar sin mandar un campo, el registro sólo con texto, los mensajes nuevos, los
    archivos (fechas en el período, *"Generado el"*, la nota de la vista, los *"-$"*), los atajos
    `stock.html?ver=…`, el tesorero en Movimientos, el aviso antes de apagar Productos y lo compartido
    (`header.js`, `comun.css`, `tabla-mobile.css`);
  - después, el resto del prompt.

## Conteo de hallazgos

| Severidad | Cantidad |
|---|---|
| CRÍTICO | 0 |
| ALTO | 0 |
| MEDIO | 1 |
| BAJO | 3 |
| **Total** | **4** |

**Los 4 están confirmados ejecutándolos.**

En resumen: **los nueve hallazgos de la entrega siguen corregidos, y nada de lo que cambió el 15/11
rompió algo que pierda plata o muestre datos de otra empresa.** El cambio de rol vale desde el pedido
siguiente en las 16 rutas de finanzas y stock, los reportes cierran contra `SELECT`, los archivos
nuevos no rompen las columnas, y no entra XSS en ninguna de las piezas nuevas.

- **El medio (M1)** es la regla nueva de la unidad fija (M2 de la entrega), **saltada con dos pedidos
  a la vez**: si la primera mercadería de un producto entra mientras alguien le cambia la unidad, pasan
  las dos cosas. Queda *"2,5 cajas"*, y es el mismo resto que no se puede sacar nunca. Pasó en **15 de
  15 vueltas**. Es otra vez el patrón consultar-decidir-escribir.

## Nota de método

**El entorno:**
- MariaDB de XAMPP, base `cooperApp`. Se recreó desde los dos `.sql` al empezar, antes del recorrido
  de pantallas, antes de la regresión que cambia datos y al terminar.
- Al empezar había otra copia de la app escuchando en el 3000. **Se mató por PID** (`taskkill //PID`)
  y se levantó una nueva con `node app.js`, con el log en un archivo. **No se tocaron** la base
  `cooperApp_ux` ni la app del 3002 (la auditoría de UX corría al mismo tiempo).
- Edge sin ventana en el **puerto de depuración 9341**, con un perfil propio. UX usaba el 9377 y no
  hubo interferencia.
- **Al terminar, la app quedó corriendo en el 3000** contra la base recreada limpia.

**Tres niveles:**
- **Base** (`mysql.exe` y `mysql2` desde los scripts).
- **API**: scripts de Node con `fetch`, logueados con cada rol, y `Promise.all` para la concurrencia.
  Se reusaron como regresión los 15 scripts de la auditoría anterior, más 12 nuevos para lo del 15/11.
  Quedaron en el scratchpad de la sesión, fuera del repo.
- **Navegador**: una copia de `pp2/scripts-capturas/revisar-pantallas.js`, con una expresión que
  mide tres cosas: lo que se pasa de la pantalla, **lo que se pasa de su bloque** (un hijo más ancho
  que su padre) y las barras de desplazamiento internas. **97 recorridos por ancho, en 1280, 800 y
  375 px**: once usuarios (los cuatro roles, la contraseña temporal y sin sesión) y todas las páginas,
  también las que no les corresponden, más los atajos nuevos. Además se hicieron 24 vistas para el
  XSS, 16 para la contraseña temporal, 8 para las piezas nuevas y 15 con el módulo apagado.

**No se tocó código, esquema, pantallas ni datos de prueba.** Lo único escrito en el repo es este
informe y la fila del registro en `prompt-testeo-QA.md`.

---

## MEDIO

### M1 · La unidad fija se saltea con dos pedidos a la vez: queda "2,5 cajas" y ese resto no se puede sacar

**Qué pasa:** `actualizarProducto` (`producto.controller.js:335` y `:366`) lee el producto con su
`cantidad_movimientos` y decide en JavaScript si la unidad se puede cambiar. Recién después escribe.
La entrada, la compra y la venta pasan por `conProductoTrabado()` (`SELECT … FOR UPDATE`), pero la
edición del producto no lo hace. Por eso hay una ventana entre la lectura y el `UPDATE`:

1. La edición lee **0 movimientos** y decide que la unidad se puede cambiar.
2. En ese momento entra la compra. Valida la cantidad con la unidad vieja: 2,5 kg se puede.
3. La edición escribe `caja`.

**Reproducción (confirmada por API y en la tabla):** un producto recién creado en kg, y los dos
pedidos al mismo tiempo con `Promise.all`:

```
Silvia (operador): POST /productos/stock/compras  { id_producto, cantidad: 2.5, precio_unitario: 100 }  -> 201
Marta (admin):     PUT  /productos/:id            { nombre, id_categoria_producto, unidad_medida: "caja" } -> 200
en la tabla: unidad_medida = 'caja', y un movimiento de 2,50 vivo
```

Pasó en **5 de 5 vueltas** con la compra y en **10 de 10** con *Otra entrada o salida* (Ajuste
positivo). Después:

```
POST /productos/stock/ventas       cantidad 2    -> 201 "Quedan 0,5 cajas"
POST /productos/stock/movimientos  Pérdida 0,5   -> 400 "se cuenta por cajas: escribí un número entero"
POST /productos/stock/ventas       cantidad 1    -> 400 "No alcanza: hay 0,5 cajas"
PUT  /productos/:id                unidad "kg"   -> 400 "ya tiene entradas o salidas cargadas, su unidad no se puede cambiar"
historial: "2.00 caja Venta", "2.50 caja Compra"   (era una compra de 2,5 kg)
```

**Esperado:** una de las dos cosas tiene que rebotar, como pasa cuando los pedidos llegan de a uno.
**Pasó:** entran las dos. El producto queda exactamente en el estado que M2 de la entrega quería
impedir: el historial dice *cajas* donde hubo kilos, y queda media caja que no sale nunca. Tampoco hay
vuelta atrás: la unidad ya no se puede corregir, porque el producto tiene movimientos, y anularlos
no alcanza (la cuenta incluye los anulados). Lo único que queda es dar el producto de baja y cargarlo
de nuevo.

**Por qué es MEDIO:** hacen falta dos personas en el mismo segundo. Pero el caso es el natural: el
admin acaba de crear el producto y corrige la unidad mal elegida, mientras el operador recibe la
primera mercadería de ese producto. El daño no se ve: nadie recibe un error, y el stock queda trabado
para siempre. Es el mismo patrón que dio los dos críticos del Sprint 08.

**Pista:** que la edición, cuando cambia la unidad, haga la lectura del conteo y el `UPDATE` adentro
de `conProductoTrabado()` (o con un `SELECT … FOR UPDATE` sobre la fila del producto), igual que las
entradas y las salidas.

---

## BAJO

### B1 · En el celular, el texto de "Historial", "Comprar" y "Vender" se sale de su botón en Stock

**Qué pasa:** en *Cuánto hay*, cada tarjeta tiene tres botones con texto: *Historial* (con texto
desde el 15/11, UX E-19), *Comprar* y *Vender*. En 375 px no entran en el renglón, y el texto queda
pegado al borde derecho del botón o cortado por él.

**Reproducción (confirmada en el navegador, medida y vista en una captura):** Marta, `stock.html`, a
375 px. El `<span class="texto-boton">` termina entre 5 y 8 px **después** del borde de su botón:

```
SPAN.texto-boton > BUTTON.btn-mini   120 / 113   (Historial)
SPAN.texto-boton > BUTTON.btn-mini   216 / 208   (Comprar)
SPAN.texto-boton > BUTTON.btn-mini   297 / 292   (Vender)
```

En la captura, *"Comprar"* se ve cortado contra el borde y *"Historial"* y *"Vender"* lo tocan. Pasa
en todas las tarjetas y con todos los usuarios que entran a Stock (Marta, Silvia, Osvaldo, Fabián,
Norma). En 800 y 1280 px no pasa.

**Por qué es BAJO:** es cosmético. Los botones siguen andando y la página no tiene scroll de costado.
Va porque es justo lo que el prompt pide medir (*lo que se pasa dentro de cada bloque*), y porque es
la pantalla que el operador usa parado en el depósito.

### B2 · Cambiar la contraseña no pide la actual, aunque no sea la contraseña inicial

**Qué pasa:** `POST /users/cambiar-password` sólo pide `password_nuevo` y `password_confirm`, y
funciona con cualquier sesión. La pantalla existe sólo para la contraseña inicial (`header.js`
manda ahí únicamente cuando `debe_cambiar_password`), pero el servidor no pide esa condición.

**Reproducción (confirmada por API):**

```
Roberto (tesorero, contraseña propia, sin cambio pendiente):
POST /users/cambiar-password { password_nuevo: "otra1234", password_confirm: "otra1234" } -> 200 "Contraseña actualizada"
```

**Esperado:** que pida la contraseña actual, o que sólo acepte el cambio cuando la persona está con la
contraseña inicial.
**Pasó:** cualquiera que se siente frente a una sesión abierta (la compu del depósito, una pestaña
que alguien no cerró) le cambia la contraseña a esa persona y la deja afuera.

**Por qué es BAJO:** hace falta acceso a una sesión ya abierta, y el admin puede volver a la
contraseña inicial. No figura en *"lo que ya está decidido"* y no apareció en los informes anteriores.

### B3 · El operador puede recibir un mensaje que lo manda a Movimientos

**Qué pasa:** el 15/11 se cuidó que la venta y la compra no le nombren Movimientos al operador
(*"La plata ya quedó anotada: no hace falta cargarla en otro lado"*). Pero queda un mensaje que sí lo
hace: `stock.controller.js:341`.

**Reproducción (confirmada por API):**

```
Fabián (operador de Metalúrgica): POST /productos/stock/ventas { id_producto: <un servicio>, ... }
-> 400 "Los servicios no pasan por el stock: su cobro se registra desde Movimientos"
```

**Por qué es BAJO:** la pantalla del operador nunca le ofrece un servicio, así que hay que armar el
pedido a mano. Va porque el prompt pide revisar que el operador *nunca* reciba un mensaje que nombre
Movimientos, y es el único que quedó.

---

## Regresión de los informes anteriores

Se reprodujo el caso original de cada hallazgo corregido. **Todos siguen corregidos.**

| Hallazgo | Origen | Hoy |
|---|---|---|
| **A1** el rol viejo en la sesión | QA entrega | **Cerrado.** Roberto pasado a operador con la sesión abierta: 403 en las 15 rutas de finanzas (alta, anular, corregir, resumen, período, categorías, tipos, los tres reportes y las dos descargas), y sí puede vender. Silvia pasada a tesorera: 201/200 en finanzas y 403 en Stock. `/users/me` y el menú muestran el rol nuevo. Ver *Observaciones* para `id_rol` |
| **M1** login en vez de cambiar la contraseña | QA entrega | **Cerrado en las 16 pantallas**: Claudia termina siempre en `cambiar-password.html` con la sesión viva |
| **M2** cambiar la unidad de un producto usado | QA entrega | **Cerrado de a un pedido**: con movimientos rebota (admin y operador), y `KG`, `" kg "`, `null`, `""`, lista y objeto dan *"Elegí una unidad válida"*. **Con dos pedidos a la vez, no** (M1 de este informe) |
| **B1** detalle de venta cortado | QA entrega | 201 caracteres → *"puede tener hasta 200"* |
| **B2** editar sin un campo lo borraba | QA entrega | **Cerrado.** Con sólo el nombre no cambian ni el mínimo, ni la subcategoría, ni el costo, ni la fecha del costo, ni el precio. El costo igual, como `"50.00"` o como `50`, no mueve la fecha. `null` o `""` sí borran el costo y su fecha, a propósito. Ver *Observaciones* para dos casos de borde |
| **B3** contraseña que no es texto | QA entrega | 400 en el login (número, lista, objeto, `{$gt:""}`), en el cambio (número, lista, objeto, texto + lista) y en el registro |
| **B4** registro con objetos | QA entrega | 400 con *"tiene que ser un texto"* y el campo, en los nueve campos. El CUIT y el DNI como número entran limpios |
| **B5** monto enorme | QA entrega | *"El monto es demasiado grande"* en Movimientos. Venta o compra con un total que no entra en `DECIMAL(14,2)` → *"El total de la compra es demasiado grande"* |
| **B6** lo creado en una categoría de baja | QA entrega | **Cerrado en tipos y en subcategorías**: nace con `baja_en_cascada = 1` y vuelve con la categoría. Si después se la da de baja a mano, ya no vuelve (correcto) |
| Descarga con formato o vista inventados | QA entrega (obs.) | 400 |
| Mínimo entero en lo que se cuenta | QA entrega (obs.) | *"El stock mínimo se cuenta en cajas: escribí un número entero"* |
| **C1** *Anular y corregir* la plata de una venta | QA final | 400 *"corregila desde Stock"*, también como tesorero |
| **A1/M1** CUIT con guiones, DNI con puntos | QA final | Se guardan limpios y el duplicado se detecta con y sin separadores |
| **B1** aprobar una empresa inexistente | QA final | 404 |
| **B3** campos de Mi empresa | QA final | Sin los campos opcionales no cambia nada. Los raros rebotan con su mensaje |
| **F-01** corregir que anulaba antes de guardar | UX final | Corregir con monto malo o fecha futura: 400, y el original sigue vivo (en la tabla) |
| **C1** anular una venta deja su plata | Venta y compra | Cerrado. 8 carreras de *anular desde Stock* contra *cargar el cobro*: nunca queda stock anulado con plata viva |
| **B1–B4** costo, precio enorme, camino genérico, categoría de baja | Venta y compra | Tres compras a la vez × 5: el costo queda en la última. El resto rebota con su mensaje |
| **C1/C2** dos ventas a la vez, el mismo cobro dos veces | QA 07-08 | 8 ventas de 2 kg sobre 9 kg con tres usuarios: entran 4, queda 1,00. Completar la plata dos veces: la segunda rebota |
| **M1/M2** *"Sin stock"* para siempre, cascada que revive | QA 07-08 | Anular el único movimiento deja el producto en *"Sin cargar"*. La cascada trae sólo las marcadas |
| **A1/M1** negativos y totales del CSV | QA 09-10 | Los números del sistema salen sin apóstrofe, las fórmulas con apóstrofe, y los totales están arriba |
| **C1/M2** XSS del superadmin y de usuarios | QA 06 | Cerrados, y el patrón no volvió en ningún lado (ver abajo) |
| **A1–A3**, sesión tras la baja | QA 06 | `GET /users` 403 salvo el admin. Con la contraseña temporal, 403 en todo salvo `/users/me`, el cambio y `/localidades`. 4 registros con el mismo CUIT a la vez: 1 fila. Baja con la sesión abierta: 401 en el pedido siguiente |

### El patrón del XSS, también en lo nuevo

Se repitió la siembra de la auditoría anterior: producto visible, categorías, tipo, descripción,
motivo, detalle de una entrada y de una venta, usuario, Mi empresa y una empresa registrada. Se
abrieron **24 vistas**, y además las **piezas nuevas del 15/11**, con
`<img src=x onerror="window.__xss++">` en:

- el **nombre de Marta**, para el *"Hola, Marta"* del panel (va con `textContent`);
- el **nombre y el apellido de un operador**, para el **aviso antes de apagar Productos**, que arma
  la lista desde `/users`;
- el mismo operador como **autor de una venta**, para el cartel del tesorero (*"Pedíselo a quien la
  cargó (…)"*);
- el **nombre de un servicio** que contiene el del tipo, para la **pista del servicio** del alta de
  movimiento;
- el **detalle de la venta**, para el historial de Stock con `?ver=historial`.

**`window.__xss` quedó en 0 y no hubo ningún `img[onerror]` en ninguna.** La carga aparece como texto
en todas.

---

## Lo que quedó bien probado (y aguantó)

### Lo que cambió el 15/11

- **El rol en cada pedido** (ver la regresión). **Con 30 altas en vuelo** mientras se cambiaba el rol,
  entraron todas: los pedidos ya habían pasado el control. La ventana es de milisegundos y no se cuenta
  como hallazgo. **Baja y reactivación con la sesión abierta:** si la persona pide algo mientras está de
  baja, la sesión se corta y ya no vuelve. Si no pide nada en el medio, sigue andando, que es lo
  esperado. **Contraseña inicial con la sesión abierta:** 403 con `debe_cambiar_password`.
- **La unidad fija**, de a un pedido: ver la regresión. Para un **servicio**, la unidad mandada se
  ignora (queda `NULL` y `0,00` en la tabla). Un producto con **sólo movimientos anulados** tampoco
  puede cambiarla: ver *Observaciones*.
- **Los mensajes:** la venta y la compra dicen *"La plata ya quedó anotada en Movimientos"* al admin y
  *"La plata ya quedó anotada: no hace falta cargarla en otro lado"* al operador. *No alcanza* tiene un
  solo consejo, en la venta y en *Otra salida*. Ver B3.
- **Los archivos**, en La Esperanza y Metalúrgica, para las cinco vistas, los tres atajos y un período
  personalizado, en CSV y PDF:
  - **BOM**, CRLF, `;`, y las mismas columnas en cada renglón de datos (7 en movimientos, 5 en los
    agrupados, 3 en pérdidas). *"Generado el 15/11/2026"* y la nota de la vista van en una sola celda
    y **no rompen las columnas**: el texto con comillas, punto y coma y salto de línea sale bien
    escapado. Los **totales cierran contra `SELECT`**: en una empresa con 72 movimientos (11 con
    fórmulas y comillas), cada fila del CSV coincide con la base y la suma da exactamente los
    casilleros.
  - **Las fechas del período**, también con el reloj simulado: el día 1 (*"1 de noviembre de 2026"*),
    el 1 de enero, enero a mitad de mes, el 1 de febrero, el mes pasado bisiesto (*"febrero de 2028"*,
    hasta el 29), el 31 de diciembre y uno personalizado (*"del 31/10/2026 al 01/11/2026"*).
  - **Los negativos** van *"-$"* en el PDF (resultado y montos de *Salió*) y en `formatearPlata`.
  - **PDF largo:** 3 hojas, ninguna en blanco, con el encabezado repetido y *"hoja 3 de 3"*. En
    pérdidas, el aviso va en el recuadro y los montos sin el rojo.
  - Una vista de un módulo apagado da **403**. Un formato o una vista inventados dan **400**.
- **Los atajos `stock.html?ver=faltantes` y `?ver=historial`:** cambian el filtro y la pestaña, solos y
  combinados con `?vender=1` y `?comprar=1` (se abre la venta o la compra). **El tesorero** ve el aviso
  de permiso y no se le abre nada. **Con Productos apagado**, el admin ve *"Lo prendés en Módulos del
  sistema"* y el operador *"pedíselo al administrador"*, sin abrir ningún formulario.
- **El tesorero en Movimientos:** en la plata de una venta, el botón dice *Anular*. El cartel no
  muestra *Anular y corregir* ni su ayuda, no tiene ningún link y nombra a quien la cargó. Por API,
  corregir esa plata da 400, y anular o corregir la venta en Stock da 403. Anularla desde Movimientos
  deja vivo el stock (*"Sin registrar el cobro"*). Al admin, el cartel lo manda a Stock.
- **El aviso antes de apagar Productos:** con operadores activos, aparece con sus nombres, también si
  la contraseña es la inicial, y sin los dados de baja. *"No, dejarlo prendido"* deja el módulo
  prendido. **Sin operadores** (Papelera) y **con todos los operadores dados de baja** (El Amanecer),
  apaga sin preguntar.
- **El encabezado** marca la pantalla actual en las 97 vistas, también *Servicios* y sus categorías,
  que son la misma página que Productos.
- **El registro:** ver la regresión. Una compra o venta con `cantidad × precio` fuera de `DECIMAL(14,2)`
  da *"demasiado grande"*, no *"Error al registrar"*.

### Seguridad y aislamiento

- **La misma matriz de 27 GET** con cinco perfiles y sin sesión: coincide con la de la auditoría
  anterior. Sin sesión, todo da 401 salvo `/localidades`.
- **31 pedidos de Marta con ids de Metalúrgica:** todos 403, 404 o 400.
- **20 cruces entre catálogos** de Productos y Servicios: rebotan todos. Los roles de Servicios
  están al revés que en Productos, por API y en la pantalla, entrando por las dos direcciones.
- **Módulos apagados:** las rutas de Reportes y de Productos rechazan, y también la descarga de
  pérdidas. Movimientos no se apaga, un módulo inventado da 404 y el operador no puede apagar.

### Datos y cálculos

- **Existencias:** la API contra un `SELECT`, producto por producto, en las cuatro empresas con stock:
  ninguna diferencia, también en `cantidad_movimientos`.
- **Reportes contra `SELECT`**, en La Esperanza y Metalúrgica con los tres atajos: el período cierra
  con sus filas, *por categoría* cierra con el período, *por producto* y *por servicio* coinciden fila
  por fila, y en *pérdidas* los dos cortes cierran entre sí.
- **Decimales:** en una empresa recién registrada y aprobada, diez ingresos de $ 0,10 y tres egresos
  de $ 0,10 dan **1,00 / 0,30 / 0,70** exactos en el resumen, el reporte, el agrupado y el CSV.
  `0,1 × 3` guarda `0,30`, y `0,01 × 0,01` rebota con *"da $ 0"*.
- **La lista de 25 valores raros** contra el monto, la cantidad y el precio de la venta y de la compra:
  igual que en la auditoría anterior.
- **Los datos de prueba:** en La Esperanza, las 11 ventas y compras con plata dicen en el historial lo
  mismo que en Movimientos. El operador ve *"Cobrado / Pagado: $ X"* en 12 de 18 filas, y nunca
  *"Sin registrar el cobro"*.

### Dos pedidos al mismo tiempo (cinco vueltas cada uno, mirado en la tabla)

Las nueve carreras de la auditoría anterior dan lo mismo: 8 ventas sobre 9 kg, dos *Anular y corregir*,
corregir contra anular, corregir contra anular la plata, completar contra corregir, corregir una compra
contra vender, tres compras con la casilla del costo, dos correcciones de la misma plata, y anular una
entrada contra vender. Más las nuevas: **anular desde Stock contra cargar el cobro** (8 vueltas, cero
cobros vivos de ventas anuladas), **30 altas contra un cambio de rol**, **cambiar la unidad contra la
primera entrada** (M1), **3 aprobaciones** de la misma empresa (6 categorías, 15 tipos, 7 motivos, 5
módulos), **3 altas con el mismo email** y **4 registros con el mismo CUIT** (1 fila cada uno).

**Al final: cero filas de stock anuladas con plata viva y cero productos en negativo.** Las únicas
ventas o compras vivas sin plata son las cinco de los datos de prueba.

### Articulación

Ninguna clave privada en la búsqueda ni en la ficha. El Amanecer no manda su teléfono. Comodines,
una letra, 150 caracteres, seis palabras y `<script>` no rompen nada. Un rubro raro da 400, y una ficha
rara, pendiente o inexistente da 404.

### Las pantallas, en tres anchos

**97 recorridos en cada ancho (1280, 800 y 375 px): cero errores de JavaScript, cero errores de
consola, cero scroll horizontal, cero barras de desplazamiento internas y ninguna pantalla en
*"Cargando..."*.** Sin sesión, todas van al login. El superadmin que abre el panel va a su pantalla.
Cada rol ve su aviso en lo que no le toca. **Lo único que se sale de su bloque** es B1. En 800 px las
tarjetas de a dos no desbordan.

---

## Observaciones que no llegan a hallazgo

- **`/users/me` devuelve el `id_rol` viejo** después de un cambio de rol (`"rol":"operador","id_rol":2`):
  `requireLogin` pone al día `rol`, pero no `id_rol`. Ninguna pantalla lo usa, así que no tiene efecto.
  Va anotado porque el próximo que lo use va a leer el dato equivocado.
- **`cantidad_movimientos` dice dos cosas distintas.** En `/productos` cuenta **todos** los movimientos,
  también los anulados, y con eso se traba la unidad. En `/productos/stock` cuenta **sólo los
  vigentes**, y con eso se decide *"Sin cargar"*. Un producto cuyo único movimiento se anuló aparece en
  Stock como *"Sin cargar"*, pero no deja cambiar la unidad: el mensaje dice *"ya tiene entradas o
  salidas cargadas"*. El historial muestra el anulado, así que no miente. Mismo nombre, dos sentidos.
- **"Lo que no viene se completa con lo que ya tiene" también trae lo que ya no vale.** Editar sólo el
  nombre de un producto rebota si su subcategoría está de baja (*"Esa subcategoría está dada de baja"*)
  o si es de una unidad entera con un mínimo decimal anterior a la regla (*"El stock mínimo se cuenta
  en cajas"*, cargado por SQL). La pantalla manda todos los campos, así que pasaba igual antes del
  15/11.
- **Un DNI mandado como número con decimales** (`4111111.5`) se guarda como `41111115` (se le saca el
  punto, como a cualquier separador de miles), y esa pasa a ser la contraseña inicial. Sólo se llega
  armando el pedido a mano.
- En el registro, `empresa_localidad: [2]` se acepta como la localidad 2, y un `empresa_telefono` se
  ignora (el registro no lo pide). Sin efecto.
- En la herramienta: los `<th>` escondidos de las tablas que se vuelven tarjetas aparecen como
  *"fuera de su bloque"*. Se excluyeron de la medición (son falsos positivos, como en el informe
  anterior), y por eso los anchos de 800 y 375 se corrieron de nuevo.

## Lo que NO se llegó a cubrir (honestidad)

- **Cortar la base en medio de una transacción.** El MariaDB de XAMPP lo comparte la auditoría de UX
  (`cooperApp_ux`), así que bajarlo le cortaba su trabajo.
- **Un segundo navegador.** Sólo Edge sin ventana. **A ojo se miró una sola captura**, la de B1. Lo
  demás se midió por script: errores, anchos, desbordes, textos y botones.
- **Los modales en 375 px**, uno por uno. Se abrieron la venta, la compra, el cartel de anular, el
  aviso de apagar Productos y el alta de movimiento, pero el desborde se midió sólo con la página
  abierta, no adentro de cada modal ya armado.
- **Editar el mismo producto desde dos pestañas** (el último gana, como antes). Tampoco la variante de
  M1 al revés: cambiar a kg una unidad entera mientras entra mercadería.
- **El PDF de pérdidas, por producto y por servicio, con muchas filas**: se leyeron los cortos.
- **El mapa** de la ficha (Leaflet): no se forzó el tooltip.
- **Una persona real** usando la app: no es de QA, pero sigue sin hacerse (HU-64 y HU-65).

---

## Prioridad sugerida

1. **M1.** Es la regla nueva saltada por concurrencia, y deja un stock trabado sin vuelta atrás. El
   arreglo es meter la decisión de la unidad adentro del candado del producto, como ya hacen las
   entradas y las salidas.
2. **B2.** Decidir si el cambio de contraseña pide la actual o queda sólo para la contraseña inicial.
3. **B1 y B3.** Lo cosmético y el mensaje que quedó.

## De paso (usabilidad, no es el foco de este informe)

- *Sin ejecutar, por lectura de `movimientos.html`*: si la empresa apagó Productos, al **admin** el
  cartel de la plata de una venta le dice *"Pedíselo a quien la cargó o al administrador"*. Es el texto
  del tesorero, porque `puedeIrAStock()` mira también el módulo.


---

## Resultado de las correcciones (15/11/2026)

Se corrigieron **los 4**, en el chat de desarrollo. Nada fue al backlog.

| Hallazgo | Qué se hizo |
|---|---|
| **M1** la unidad fija salteada con dos pedidos | Cambiar la unidad pasa por `conProductoTrabado()`: se cuentan los movimientos y se escribe adentro del candado del producto. Y del otro lado, el candado ahora devuelve la fila trabada con su unidad, y la entrada, la venta y la compra vuelven a mirar *"lo que se cuenta va entero"* adentro. Una de las dos rebota siempre. |
| **B1** el texto se salía de los botones de Stock | Hasta 1023 px los cuatro botones de cada producto (*Historial, Comprar, Vender, Otra*) se reparten el renglón con el ícono arriba de la palabra. |
| **B2** cambiar la contraseña sin la actual | Con la contraseña inicial alcanza la nueva (es el primer ingreso). Con una propia, hay que mandar `password_actual` y tiene que coincidir. |
| **B3** el operador recibía un mensaje que nombra Movimientos | Al operador, *"Los servicios no pasan por el stock."*, sin nombrar una pantalla que no tiene. |

**Probado**: un script nuevo de 22 casos, con **ocho vueltas de la carrera de M1** (compra y ajuste,
alternados) sin que entren las dos nunca, más las seis baterías anteriores, todas bien; y las 92
pantallas en 1280, 800 y 375 px midiendo lo que se pasa dentro de cada bloque: cero errores.
