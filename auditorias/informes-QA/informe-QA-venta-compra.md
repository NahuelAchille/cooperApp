# Informe de QA — CooperApp

- **Fecha:** 02/11/2026
- **Qué se auditó:** el commit `89e2bcb` (*venta y compra en un solo paso*, 25 y 26/10/2026),
  que es lo único nuevo desde la auditoría de los Sprints 09-10 (28/09). Más la regresión
  contra los tres informes anteriores.
- **Alcance:** `POST /productos/stock/ventas` y `/compras` (`registrarOperacion` y la tabla
  `OPERACIONES`), el destino de la plata de cada motivo (`motivos_stock.id_tipo`,
  `validarTipo`), el precio de venta (`limpiarPrecio`), la casilla del costo
  (`actualizar_costo`), el formulario único de `stock.html`, los avisos de `movimientos.html`,
  los atajos `?vender=1` / `?comprar=1` y la configuración inicial al aprobar una empresa.

## Conteo de hallazgos

| Severidad | Cantidad |
|---|---|
| CRÍTICO | 1 |
| ALTO | 0 |
| MEDIO | 0 |
| BAJO | 5 |
| **Total** | **6** |

**Los 6 están confirmados ejecutándolos.** Ninguno es sospecha ni lectura de código.

Lo que el commit hace **lo hace bien**: los dos movimientos nacen juntos y atados, el total en
centavos coincide con la cuenta exacta, el candado del producto aguanta 8 ventas simultáneas, y
el operador no ganó ningún acceso a finanzas fuera de estas dos rutas. **El crítico no está en
lo que se escribió, sino en lo que el commit cambió alrededor**: una decisión vieja (*anular el
stock no anula la plata*) se apoyaba en que el operador no tocaba finanzas, y eso dejó de ser
cierto.

## Nota de método

Entorno desde cero: MariaDB de XAMPP, base recreada con los dos `.sql`, `node app.js`, y al
terminar `taskkill //F //IM node.exe` (verificado con `tasklist`). **La base se restauró al
terminar** (4 empresas, 28 usuarios, 28 movimientos, 24 movimientos de stock, 24 productos, 25
motivos: igual que al arrancar). **No se tocó código, SQL, pantallas ni el prompt.** El
`Backlog_CooperApp_2026.xlsx` figura modificado en `git status`, pero no por esta auditoría.

Tres niveles: **base** (`mysql.exe`), **API** (scripts de Node con `fetch` y `Promise.all`
para la concurrencia, logueados con cada rol) y **navegador** (operador, admin y tesorero,
escritorio y 375 px, consola y XSS contados con un script).

---

## CRÍTICO

### C1 · Una venta que el operador anula deja su plata en el balance, y nadie la ve

**Qué pasa:** el operador registra una venta con un error (tipeó 10 en vez de 1), la anula
desde el historial de stock —que es lo que la app le ofrece— y la vuelve a cargar bien. La
mercadería queda bien. **La plata de la venta equivocada sigue viva como ingreso.** El operador
no la puede anular (no entra a Movimientos), y en el historial de stock la fila anulada ya no
muestra ninguna marca de dinero, ni para él ni para el administrador.

**Reproducción (confirmada):** Silvia (operadora de La Esperanza), Arroz a $2.600:

```
POST /productos/stock/ventas   cantidad 10, precio 2600   -> 201, total $26.000
PUT  /productos/stock/movimientos/49/anular               -> 200 "Movimiento anulado. Arroz largo fino queda en 29,9.
                                                              Ojo: este movimiento tenía un movimiento de dinero asociado,
                                                              que sigue vigente. Si también hay que darlo de baja, se anula
                                                              desde Movimientos."
PUT  /movimientos/52/anular   (la misma Silvia)           -> 403 "Sin permiso para realizar esta acción"
POST /productos/stock/ventas   cantidad 1, precio 2600    -> 201, total $2.600
```

En la tabla:

```
id_mov_stock  cantidad  stock_anulado  id_movimiento  monto     dinero_anulado
49            10.00     1              52             26000.00  0      <- la venta que no pasó
50             1.00     0              53              2600.00  0      <- la buena
```

Y el resumen de Movimientos del día (admin) **sube $28.600** por una venta real de $2.600.

En la pantalla:
- **Operador:** al confirmar la anulación el cartel le dice *"se hace desde Movimientos"*, una
  pantalla en la que no puede entrar.
- **Administrador:** en el historial de stock la fila sale como *"Anulado"* y nada más:
  `stock.html` esconde la marca del dinero en las filas anuladas (`${m.anulado ? '' : marcaDinero}`).
  En Movimientos aparece como un ingreso más, *"Venta: 10 kg de Arroz largo fino · error de
  tipeo"*, sin nada que diga que esa venta se anuló.
- **Reportes:** el agrupado **por categoría** la suma (está en *Ventas › Venta minorista*) y el
  agrupado **por producto no** (llega a la plata subiendo por el stock no anulado). Los dos
  dicen cosas distintas sobre la misma venta y ninguno avisa.

**Lo mismo pasa con la compra**: una compra anulada deja un egreso que no ocurrió.

**Esperado:** que lo que el sistema muestra como plata sea plata que pasó. Una venta anulada
es una venta que no pasó.
**Pasó:** el balance queda inflado, en silencio, en el uso más común que tiene la anulación
—corregir un error de tipeo—, por el rol que ahora registra la mayoría de las ventas.

**Por qué es CRÍTICO, aunque venga de una decisión tomada:** en *"lo que ya está decidido"* el
prompt dice que anular el stock no anula el dinero *"a propósito (el cobro pudo ser real
aunque la mercadería se haya cargado mal, y un operador no tiene permiso para tocar
finanzas)"*. Las dos razones dejaron de valer para este camino:

1. **Venta y dinero ahora nacen juntos, del mismo formulario y con el mismo número.** No hay
   un cobro aparte que pueda haber sido real: si la cantidad estaba mal, el monto (cantidad ×
   precio) también.
2. **El operador ahora sí crea la plata**, pero sigue sin poder deshacerla. Antes no podía
   generar el problema; ahora lo genera y no lo puede ver ni arreglar.

Es justamente *"una forma nueva de explotar"* lo decidido, que el prompt pide reportar. Cómo se
resuelve es **decisión del grupo**, no técnica (por ejemplo, si anular una venta hecha por el
camino nuevo anula también su plata en la misma transacción, o si eso lo decide quien tenga
permiso de finanzas). Lo que no puede quedar es que nadie se entere.

**Estado:** confirmado en los tres niveles (API, tabla y pantalla del operador y del admin).

---

## BAJO

### B1 · Dos compras simultáneas del mismo producto dejan como costo el precio que no es el último

**Qué pasa:** la decisión de *"¿cambió el costo?"* se toma **antes** del candado
(`costoAnterior !== precio.valor`, fuera de `conProductoTrabado`). Con dos compras juntas, la
segunda decide con el costo viejo, no con el que acaba de guardar la primera. Es el patrón
consultar-decidir-escribir que el prompt pide buscar.

**Reproducción (confirmada, 9 de 10 vueltas):** Electrodo con costo $18.500. A la vez: Osvaldo
compra a $20.000 y Fabián a $18.500, los dos con la casilla tildada.

```
A (20000): costoActualizado = true
B (18500): costoActualizado = false   <- leyó 18.500 antes de que A guardara
la última en entrar es B (id más alto), y el costo queda en 20.000
```

**Esperado:** que el costo quede en lo último que se pagó, que es lo que promete la casilla.
**Pasó:** queda en el precio de la compra anterior.

**Por qué es BAJO:** hacen falta dos compras del mismo producto en el mismo segundo, y no
mueve plata: sólo deja corrido el costo que valoriza las pérdidas.

### B2 · Una compra con un precio por unidad de más de $ 9.999.999.999,99 y la casilla tildada da "Error al registrar la compra"

**Qué pasa:** la compra acepta precios hasta $ 999.999.999.999,99 (`parsearMonto`), pero
`productos.costo_referencia` es `DECIMAL(12,2)` (hasta $ 9.999.999.999,99). Con la casilla
tildada —que en la pantalla viene tildada de fábrica cuando el precio cambia—, el `UPDATE` del
costo rebota en modo estricto.

**Reproducción (confirmada):**

```
compras  cantidad 0,01  precio 20.000.000.000  actualizar_costo true   -> 500 "Error al registrar la compra"
         (consola: ER_WARN_DATA_OUT_OF_RANGE en costo_referencia)
lo mismo sin la casilla                                                 -> 201, total $ 200.000.000
```

**Lo bueno:** la transacción funciona — con el 500 no queda ni el movimiento de stock, ni el de
dinero, ni el costo (contados en la tabla antes y después).
**Lo malo:** el mensaje no dice qué pasó, y los límites no coinciden: el precio de venta del
producto rechaza el mismo número con *"El precio de venta es demasiado grande"*.

**Por qué es BAJO:** un precio unitario de diez mil millones no es un caso real.

### B3 · El servidor sigue aceptando ventas y compras por el formulario genérico

**Qué pasa:** la pantalla sacó los motivos de venta y de compra de *"Otra entrada o salida"*
(son *"dos caminos para lo mismo, y uno dejaba la venta a medias"*), pero
`POST /productos/stock/movimientos` los sigue aceptando.

**Reproducción (confirmada):**

```
operador:  movimientos  motivo Venta (5)   -> 201, propuesta: null   (queda "Sin registrar el cobro")
admin:     movimientos  motivo Compra (2)  -> 201, con la propuesta de dinero de siempre
```

**Esperado:** si la regla es que una venta va con su plata, que el servidor lo diga, no sólo la
pantalla.
**Por qué es BAJO:** sólo se llega armando el pedido a mano, y el resultado es un estado que el
sistema ya conoce y sabe completar (la venta *"Sin registrar el cobro"* del historial).

### B4 · "Falta decir en qué categoría" cuando la categoría está dicha pero dada de baja

**Qué pasa:** si el admin da de baja la categoría de dinero a la que apunta el motivo Venta, la
venta rebota con *"Falta decir en qué categoría de ingresos van las ventas de "Venta""* (al
admin) y *"Falta configurar..."* (al operador). El formulario de `stock.html` dice lo mismo
antes de que la persona complete nada.

**Reproducción (confirmada):** `PUT /categorias/1/estado {activo:false}` y vender → mensaje de
arriba. El motivo sigue teniendo `id_tipo = 2`, y la pantalla de Motivos sí lo dice bien: *"Va
a Ventas › Venta minorista, que está dada de baja"*.

**Esperado:** que diga que la categoría elegida está dada de baja, como ya hace Motivos.
**Por qué es BAJO:** el link lleva al lugar correcto y ahí se entiende. Va porque el mensaje
describe mal lo que pasó: no falta nada, hay algo dado de baja.

### B5 · `usuario de prueba.txt` no se enteró de la venta ni de la compra

**Qué pasa:** el archivo que el grupo usa después de un pull dice *"Actualizado: 27/09/2026"* y
describe al operador como *"El deposito: catalogo y stock... NO ve la plata"*. No menciona los
botones de venta y compra, el precio de venta, la casilla del costo, que el operador ahora
registra plata, ni que hay que **recrear la base** por las dos columnas nuevas.

**Por qué es BAJO:** no es código. Va porque es exactamente el problema que el proyecto ya tuvo
el 16/09 con este mismo archivo, y porque quien pruebe con él va a creer que el operador
cargando un ingreso es un bug.

---

## Regresión de los informes anteriores

Se reprodujo el caso original de cada hallazgo corregido que toca lo que cambió este commit.
**Todos siguen corregidos.**

| Hallazgo | Origen | Hoy |
|---|---|---|
| **C1** dos salidas simultáneas dejan el stock negativo | QA 07-08 | **Cerrado, y también por el camino nuevo.** 8 ventas de 2 kg sobre 9 kg de Jamón: entran 4, rebotan 4, queda en **1,00**. 8 salidas genéricas de 10 sobre 60: entran 6, quedan **0,00**. Venta + salida + anular entrada a la vez sobre Queso: cada una decide con lo que dejó la anterior, nunca negativo |
| **C2** la misma venta se cobra seis veces | QA 07-08 | **Cerrado.** 6 pedidos de dinero sobre la misma venta: 1 × 201, 5 × 400; **1 movimiento de $777** en la tabla. Y sobre una venta del camino nuevo (que nace atada) rebota *"ya tiene su movimiento de dinero registrado"* |
| **A1** "$ cargado" con el dinero anulado | QA 07-08 | **Cerrado.** Anulado el dinero de una venta nueva, se puede volver a cargar por el camino viejo (201) |
| **M1** / **M2** / **B1** / **B2** | QA 07-08 | **Cerrados**: el JSON roto devuelve *"El pedido no tiene un formato válido"*, el stock mínimo 0,001 rebota, y las existencias de los **19 productos** coinciden con el `SELECT` (0 diferencias, 0 negativos) |
| **M2** Bolsa de pan en −4 | QA 09-10 | **Cerrado.** Arranca en 6 |
| **A1** / **M1** CSV con negativos como texto y sin totales | QA 09-10 | **Cerrados.** `Sueldos;...;-150000,00` sin apóstrofe, y `Entró en el período;470277,00` arriba |
| **B1** anular el mismo dinero 4 veces | QA 09-10 | **Cerrado.** 1 × 200, 3 × *"El movimiento ya estaba anulado"* |
| **B2** fecha que no existe | QA 09-10 | **Cerrado.** *"La fecha de inicio no es válida"* |
| **A1** `GET /users` · **B2** `monto: true` · sesión viva tras la baja · cambio de contraseña obligatorio | QA 06 | **Cerrados.** El operador recibe 403 en `/users`; `monto: true` rebota; Ramón vende, se lo da de baja y **la venta siguiente da 401** con la sesión abierta; Claudia (contraseña temporal) no puede vender (*"Tenés que cambiar tu contraseña"*) |

**No se re-verificó** M3 de 07-08 (textos largos en el registro): el pedido de prueba no armó
bien los campos del registro y el caso no toca este commit.

### El patrón del XSS en lo nuevo

Se cargaron `<img src=x onerror=...>` en el **nombre de un producto**, el **detalle** de una
compra y de una venta, el **nombre de dos motivos** (uno de venta, uno de compra sin destino),
y en la **categoría y el tipo de dinero** a los que apunta el motivo. Se contaron los elementos
inyectados y la variable que dispara el payload:

```
stock.html (formulario de venta y de compra abiertos)   0
  · la lista de productos y de motivos                  texto
  · el aviso "Falta configurar ... de <motivo>"         texto (pasa por esc)
  · la casilla "Guardar $ 70 como el costo de <prod>"   texto (textContent)
movimientos · dashboard · motivos · productos
reportes · categorías de movimientos                    0 en las seis
```

**Cero en todas**, con el payload visible como texto. El toast del servidor (que trae el
nombre del producto) también pasa por `esc`.

### La inyección de fórmulas en la plata nueva

La descripción del movimiento de dinero **arranca con el nombre del motivo**, que escribe el
admin. Un motivo llamado `=HYPERLINK("http://x.test","c")...` sale en el CSV como
`"'=HYPERLINK(""http://x.test"",""c"")..."`: neutralizado. El `=1+1` del detalle queda en el
medio de la celda, así que no se ejecuta.

---

## Lo que quedó bien probado (y aguantó)

### El operador no ganó nada más que estas dos rutas

| Pedido del operador | Resultado |
|---|---|
| `GET /movimientos`, `/movimientos/resumen`, `POST /movimientos`, `PUT /movimientos/:id/anular` | 403 |
| `GET /categorias`, `GET /reportes/periodo` | 403 |
| `POST /productos/stock/movimientos/:id/dinero` (el camino viejo) | 403 |
| `PUT /productos/motivos/:id` (cambiar a dónde va la plata) | 403 |
| `GET /productos/motivos` | 200 (ya lo tenía; ahora trae además el nombre de la categoría de dinero) |
| `POST /productos/stock/ventas` y `/compras` | 201 |

**Y los demás:** tesorero y superadmin, 403 en las dos rutas; sin sesión, 401; una cuenta con
contraseña temporal, bloqueada; **otra empresa** vendiendo o comprando un producto ajeno, 404;
una Venta de otra empresa como `id_motivo_stock`, rebota. Con el módulo de productos apagado,
403; con el de movimientos apagado (por SQL, porque la app no deja), 403.

En `movimientos.html` el aviso *"¿Vendiste mercadería?"* / *"¿Compraste mercadería?"* le aparece
al admin con Entró / Salió y **no** al tesorero, que no entra a Stock.

### Lo que queda guardado de verdad

Cada operación deja **dos filas atadas** (`movimientos_stock.id_movimiento`), con la misma
fecha, el mismo usuario y el destino que dice el motivo: la venta en *Ventas › Venta
minorista* (ingreso), la compra en *Insumos › Compra de mercadería* (egreso). La descripción
del dinero se arma sola: *"Venta: 1 kg de Arroz largo fino · QA t1"*. **Cero movimientos de
dinero huérfanos** después de las pruebas de concurrencia.

**El total en centavos:** `0,1 × 3` guarda **0,30**. Además se comparó la fórmula del servidor
contra la cuenta exacta con enteros grandes en **2 millones de combinaciones al azar** de
cantidad y precio: **cero diferencias**. La pantalla usa la misma cuenta y muestra el mismo
total. El resumen del día de la app coincide al centavo con el `SELECT`.

### Las validaciones

Cantidad 0, negativa, 0,004, texto y `true` rebotan; más de lo que hay rebota diciendo cuánto
hay. Precio vacío, 0, negativo, 0,004, texto, `true`, `"Infinity"` y enorme rebotan. Un total
que da $0 (0,01 × 0,01) rebota. Fecha futura, anterior al 2000, 30 de febrero y vacía rebotan.
Producto inexistente, de baja, servicio o de otra empresa rebotan. Un motivo de compra en una
venta, una pérdida, uno de baja o uno ajeno rebotan.

**La casilla del costo:** sólo el booleano `true` la activa (`"true"` y `1` no); si lo pagado es
igual al costo, **ni la fecha se mueve**; en una venta se ignora; una compra rechazada no
cambia el costo; con el producto sin costo, lo carga. Con dos motivos de venta, sin elegir uno
rebota *"Elegí qué tipo de venta es"*, y elegido el segundo, la plata va al tipo de ese.

**El destino de la plata (`validarTipo`):** tipo de otra empresa, de otra naturaleza,
inexistente y dado de baja rebotan; en un motivo que no mueve plata se fuerza `NULL` aunque se
mande uno (verificado en la tabla); el efecto de un motivo ya usado sigue sin poder cambiarse.

**La empresa nueva:** al aprobar Huerta Norte, sus motivos Venta y Compra quedan apuntando a
*Ventas › Venta minorista* y *Insumos › Compra de mercadería*, de la naturaleza correcta.

### La pantalla

Como operador, el circuito completo desde el botón: `?vender=1` abre la venta, el producto
trae su precio, el total se calcula al escribir, el aviso de configuración apaga el botón, y la
compra con la casilla guarda los dos movimientos y el costo nuevo (3 × $70 = **$210**, costo en
**$70**, verificados en la tabla). Pasar de compra a venta no deja la casilla colgada. **En 375
px** el formulario entra sin scroll horizontal (diálogo de 8 a 367 px). **Sin errores de
consola.**

---

## Observaciones que no llegan a hallazgo

- **Arrays donde va un número:** `cantidad: [5]` y `precio_unitario: [100]` entran como 5 y 100,
  e `id_tipo: "1abc"`, `true` o `[1]` caen en el tipo 1. Guardan lo que se quiso decir y la
  pantalla nunca los manda; se anota porque es la misma familia que el `monto: true` del
  Sprint 06.
- **`PUT /productos/motivos/:id` sin `id_tipo` lo borra.** La pantalla lo manda siempre, así que
  sólo pasa armando el pedido a mano.
- **El detalle de más de 200 caracteres se corta sin avisar** por la API. La pantalla tiene
  `maxlength="200"`.

## Lo que NO se llegó a cubrir (honestidad)

- **El PDF** de un reporte con ventas del camino nuevo: se miró sólo el CSV.
- **La anulación de la compra** por el operador se razonó igual que la venta (mismo código), pero
  se reprodujo sólo la venta.
- **Corte de la base en medio de la transacción.** Sí se vio que un error adentro (B2) deshace
  todo; no se simuló bajar MariaDB.
- **Un segundo navegador.** Sólo el integrado.
- **El registro con un email de 246 caracteres** (M3 de 07-08), por lo dicho arriba.

---

## Prioridad sugerida

1. **C1** — antes de que el grupo siga usando la venta desde el mostrador. Primero hay que
   **decidir** qué tiene que pasar con la plata al anular una venta o una compra del camino
   nuevo, y recién después escribirlo.
2. **B1** — mover la comparación del costo adentro del candado: es el mismo arreglo que ya
   tiene el stock al lado.
3. **B2** — que el límite del precio de compra coincida con el de la columna del costo, o que
   el mensaje lo diga.
4. **B3** — que el servidor también saque los motivos de venta y compra del camino genérico.
5. **B4** — un mensaje.
6. **B5** — actualizar `usuario de prueba.txt`.

## De paso (usabilidad, no es el foco de este informe)

- Con dos motivos de compra (en Metalúrgica, uno de prueba), *"¿Qué tipo de compra?"* aparece
  vacío al abrir; una persona apurada no sabe cuál elegir si los nombres se parecen.

---

# Resultado de las correcciones (02/11/2026)

Los 6 hallazgos, corregidos y verificados ejecutándolos. **C1 se decidió antes de escribir
código**: no era un problema técnico sino una regla de negocio, y la eligió el usuario.

## CRÍTICO · C1 · anular una venta o una compra anula también su plata

**Decisión del grupo (02/11):** una venta es una sola cosa. Si se anula, se anula la mercadería
**y** la plata, en el mismo paso, la anule quien la anule. Reemplaza a la decisión vieja de que
*"anular el stock no anula el dinero"*: sus dos razones dejaron de valer con la venta en un paso
(el monto sale de cantidad × precio, así que si la cantidad estaba mal la plata también, y el
operador ya crea la plata). Se descartaron *"sólo el admin anula"* (traba al operador en el error
más común) y *"queda como está pero se ve"* (no le saca el problema a nadie).

En `anularMovimiento` (`stock.controller.js`), adentro del candado del producto, la fila del
movimiento de stock se lee con `FOR UPDATE` junto con su plata, y si la plata sigue viva se anula
con la misma conexión (`movimientoModel.anular` ahora acepta un `ejecutor`). O pasan las dos cosas
o ninguna: si anular deja el stock en negativo, rebota y la plata no se toca.

El mismo caso del informe (Silvia, Arroz a $2.600):

```
POST ventas cantidad 10            -> 201, total $ 26.000
PUT  .../25/anular   (Silvia)      -> 200 "Movimiento anulado. Arroz largo fino queda en 38.
                                          También se anuló su cobro de $ 26.000,00."
POST ventas cantidad 1             -> 201, total $ 2.600

id_mov_stock  cantidad  stock_anulado  id_movimiento  monto     dinero_anulado
25            10.00     1              29             26000.00  1      <- antes: 0
26             1.00     0              30              2600.00  0
```

El resumen del día suma sólo lo que pasó. También se probó la compra (*"También se anuló su pago
de $ 3.600,00"*), la anulación doble (400), una venta cuya plata ya se había anulado desde
Movimientos (no avisa nada de más), una venta del camino viejo con el cobro cargado aparte (se
lleva sus $ 999), y una compra ya vendida que no se puede anular (400, su plata queda viva).

**Encontrado al corregir: la misma carrera, del otro lado.** `registrarDineroDeMovimiento` no
miraba si el movimiento de stock estaba anulado *adentro* de su candado. Anular una venta y
cargarle el cobro al mismo tiempo podía dejar un cobro vivo colgado de una venta anulada. Ahora
rebota con *"Ese movimiento de stock está anulado"*. 10 vueltas con `Promise.all` (Marta anula,
Roberto carga el cobro): a veces gana uno, a veces el otro, y en la tabla quedan **cero ventas
anuladas con plata viva y cero plata sin su movimiento de stock**.

**En la pantalla** (`stock.html`):
- El cartel de anular dice *"También se anula su cobro de $ 7.800,00"* antes de confirmar
  (verificado en el navegador como Silvia, y en la tabla después de apretar).
- **Lo que quedó de antes:** las ventas anuladas antes de este arreglo siguen con la plata viva.
  A finanzas (admin y tesorero) esas filas ahora le muestran *"El cobro sigue en Movimientos"*,
  así se pueden encontrar. El operador no la ve. Probado con un dato viejo simulado por SQL.
- El operador ahora ve el monto de una venta en el cartel de anular. Es plata que carga él.

## BAJO · B1 · el costo se decide adentro del candado

La comparación *"¿cambió el costo?"* pasó adentro de `conProductoTrabado`, leyendo el costo con la
conexión de la transacción (`productoModel.costoActual`, con `FOR UPDATE`). El caso del informe,
10 vueltas (Osvaldo a $ 20.000 y Fabián a $ 18.500, a la vez, con la casilla):

```
B1: 10 de 10 con el costo de la última compra      <- antes: fallaba 9 de 10
```

## BAJO · B2 · el precio por unidad tiene el tope de la columna del costo

`parsearMonto` recibe ahora el tope, y la venta y la compra le pasan el de `DECIMAL(12,2)`, el
mismo del precio de venta y del costo del producto:

```
compra 20.000.000.000 con casilla    -> 400 "El costo es demasiado grande"   <- antes: 500
compra 20.000.000.000 sin casilla    -> 400 "El costo es demasiado grande"
venta  20.000.000.000                -> 400 "El precio es demasiado grande"
compra 9.999.999.999,99 (el tope)    -> 201
```

Se aplicó también a la venta, aunque no reventaba: un precio por unidad que no entra como precio
del producto no es un precio real, y así los dos dicen lo mismo.

## BAJO · B3 · el servidor también saca la venta y la compra del camino genérico

`registrarMovimiento` reconoce un motivo de venta o de compra por lo que hace (`esMotivoDe`, el
mismo criterio de `registrarOperacion`) y lo rechaza diciendo a dónde ir:

```
operador, motivo Venta   -> 400 "\"Venta\" es un motivo de venta: se registra con el botón
                                 \"Registrar una venta\", que carga la mercadería y su cobro juntos."
admin, motivo Compra     -> 400 (lo mismo, con "su pago")
operador, motivo Pérdida -> 201 (sigue andando)
```

**De paso:** como los únicos motivos que mueven plata son los de venta y compra (entrada + ingreso
y salida + egreso no se pueden guardar), la *propuesta* de dinero que devolvía ese camino quedó
imposible. Se sacó del controlador y de la pantalla, con un comentario. El cartel del dinero sigue,
para completar las ventas viejas *"Sin registrar el cobro"* del historial.

## BAJO · B4 · "dada de baja" en vez de "falta decir"

El servidor y `stock.html` separan los dos casos, con las palabras de la pantalla de Motivos:

```
categoría dada de baja, admin    -> "Las ventas de "Venta" van a Ventas › Venta minorista, que está
                                     dada de baja. Reactivala, o elegí otra categoría en
                                     Configuración › Motivos de stock."
categoría dada de baja, operador -> "... Pedile al administrador que lo arregle en Motivos de stock."
motivo sin categoría (por SQL)   -> "Falta decir en qué categoría de ingresos van las ventas..."  (sin cambios)
```

En el navegador, como Marta, `?vender=1` con la categoría de baja muestra el aviso nuevo y el
botón queda apagado. Reactivada la categoría, la venta entra.

## BAJO · B5 · `usuario de prueba.txt` al día

Actualizado al 02/11: las dos columnas nuevas del esquema, un bloque *"CAMBIOS DEL 25/10 AL
02/11"* arriba de todo (los botones, que **el operador registra plata y no es un error**, el
precio de venta, el destino de la plata del motivo, que anular se lleva la plata, y que hay que
recrear la base), el rol del operador corregido, y una sección **"VENTA Y COMPRA EN UN SOLO
PASO"** con qué probar. De paso: *"Falta el $"* → *"Sin registrar el cobro"*, la pestaña
*"Movimientos"* de Stock → *"Entradas y salidas"*, Motivos de stock está en *Configuración* (no en
el menú del usuario), y el reporte por producto explica que las ventas *"sin el $"* son de antes
del 25/10.

## Lo que no se tocó

Las tres *"observaciones que no llegan a hallazgo"* (arrays donde va un número, `PUT
/productos/motivos/:id` sin `id_tipo`, el detalle de más de 200 caracteres) y el *"¿Qué tipo de
compra?"* vacío con dos motivos quedan como estaban: no eran parte del pedido.

## Cómo se probó

Servidor reiniciado con `taskkill` y verificado con `tasklist` después de cada tanda. Tres niveles:
`mysql.exe` para el estado de `anulado` de los dos lados, el costo y los huérfanos; scripts de Node
con `fetch` y `Promise.all` logueados como Silvia, Marta, Roberto, Osvaldo y Fabián; y el navegador
(cartel de anular como operadora, marca de los datos viejos y aviso de la categoría de baja como
admin, sin errores de consola de la app). **La base quedó recreada limpia al terminar.**

**Ojo al actualizar:** no cambió el esquema ni los datos de prueba. No hace falta recrear la base
por esta corrección (sí por la venta y la compra, si alguien no lo hizo todavía).
