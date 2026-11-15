# Informe de QA — CooperApp · auditoría de la entrega

- **Fecha:** 14/11/2026
- **Qué se auditó:** el sistema completo, en `master` en el commit `453f870` (las cuatro tandas de la
  revisión del 14/11: arreglos de uso, limpieza, unificación de lo duplicado y `comun.css`), con
  foco en lo que todavía no había pasado por QA:
  - las validaciones unificadas (`validacion.service.js`: `leerDecimal`, `aNumero`, topes, DNI,
    CUIT, `limpiarNombre`, `config/roles.js`);
  - **Productos y Servicios como una sola página**, por las dos direcciones y con cada rol;
  - la sesión desde el encabezado (`header.js`: sin sesión al login, con la contraseña temporal a
    cambiarla);
  - las ayudas compartidas (`components/util.js`, `esc()` única) y `comun.css`;
  - *Anular y corregir* en Movimientos y en Stock, con pedidos simultáneos.
- **Más:** la regresión contra los cinco informes de QA y los tres de UX, y todas las secciones de
  *"Qué probar"* del prompt.

## Conteo de hallazgos

| Severidad | Cantidad |
|---|---|
| CRÍTICO | 0 |
| ALTO | 1 |
| MEDIO | 2 |
| BAJO | 6 |
| **Total** | **9** |

**Los 9 están confirmados ejecutándolos** (B6 se ejecutó en subcategorías; en los tipos de
movimiento se vio el mismo código, sin ejecutar).

En resumen: **no apareció nada que pierda plata ni que muestre datos de otra empresa.** Todo lo que
mueve plata o stock aguantó las carreras (nueve escenarios, cinco vueltas cada uno, cero filas
desparejas y cero productos en negativo), los reportes cierran contra `SELECT` en las cinco vistas
y los tres atajos, y el XSS no entra en ninguna pantalla. **Lo que hay que arreglar antes de
entregar está en la sesión**:

- **El alto (A1)** es un pariente del hallazgo del Sprint 06 que nunca se cerró del todo: si el
  admin le **cambia el rol** a alguien, la sesión abierta de esa persona sigue con el rol viejo
  hasta 8 horas. Un tesorero pasado a operador sigue cargando y anulando plata.
- **El medio M1 es de la tanda 1**: *"con la contraseña temporal, a cambiarla"* se cumple en 4
  pantallas de 16. En las otras 12 la persona termina en el login.

## Nota de método

**El entorno:**
- MariaDB de XAMPP, base `cooperApp`, recreada desde los dos `.sql` al empezar, antes del recorrido
  de pantallas y al terminar.
- `node_modules` ya estaba instalado. La app corrió con `node app.js` en el **puerto 3000**. Al
  empezar había otra copia escuchando en el 3000 (código de antes): se mató **por PID** con
  `taskkill //PID` (no por nombre, porque en el 3002 corría la auditoría de UX, que no se tocó, ni
  su base `cooperApp_ux`).
- **Al terminar, la app quedó corriendo en el 3000** contra la base recreada limpia.

**Tres niveles:**
- **Base** (`mysql.exe` y `mysql2` desde los scripts).
- **API**: 14 scripts de Node con `fetch`, logueados con cada rol, y `Promise.all` para la
  concurrencia. Quedaron en el scratchpad de la sesión, fuera del repo.
- **Navegador**: Edge sin ventana con una copia de `pp2/scripts-capturas/revisar-pantallas.js`
  (más usuarios y una expresión que mide). **71 recorridos por ancho, en 1280, 800 y 375 px**: once
  usuarios (los cuatro roles, la contraseña temporal y sin sesión) y todas las páginas, también las
  que no les corresponden. Además 25 vistas para el XSS y 16 para la contraseña temporal.

**Interferencia con la auditoría de UX:** entre las ~18:00 y las 18:25 su Edge sin ventana usó el
mismo puerto de depuración (9341) y se conectó al de esta auditoría: le navegó la pestaña y le
borró las cookies. Eso explica una primera corrida de pantallas donde las sesiones se cortaban
solas, que **se descartó**. Después de que UX se mudó de puerto se repitieron la prueba de M1 y el
recorrido en 375 px (18:33): **dieron exactamente lo mismo** (M1 en las mismas 12 pantallas, y el
recorrido sin problemas). Los hallazgos por API no dependen del navegador.

**No se tocó código, esquema, pantallas ni datos de prueba.** Lo único escrito en el repo es este
informe y la fila del registro en `prompt-testeo-QA.md`.

---

## ALTO

### A1 · Cambiar el rol de alguien no cambia su sesión abierta: un tesorero pasado a operador sigue cargando y anulando plata

**Qué pasa:** `requireLogin` vuelve a mirar la base en cada pedido, pero sólo para tres cosas: si
el usuario está activo, si su empresa está activa y si tiene que cambiar la contraseña. **El rol
no lo mira.** `requireRol` decide con `req.session.user.rol`, que es la foto que quedó al iniciar
sesión. Y `/users/me` también devuelve el rol de la sesión, así que el menú sigue mostrando lo de
antes.

**Reproducción (confirmada por API y en la tabla):**

```
1. Roberto (tesorero de La Esperanza) tiene la sesión abierta.
2. Marta, admin: PUT /users/3  { ..., id_rol: 3 }            -> 200 "Usuario actualizado"
   en la tabla: roles.nombre de Roberto = 'operador'
3. Con la sesión vieja de Roberto:
   GET  /users/me                    -> 200 { "rol": "tesorero", ... }
   POST /movimientos  monto 99999    -> 201   (en la tabla: id 183, $ 99.999, id_usuario 3)
   GET  /movimientos/resumen         -> 200   (el balance entero)
   GET  /reportes/descargar csv      -> 200   (el archivo)
   PUT  /movimientos/1/anular        -> 200   (en la tabla: el ingreso de $ 350.000 anulado)
```

Al revés pasa lo mismo: Silvia (operador) pasada a tesorera sigue cargando ventas con la sesión
vieja, y no ve finanzas hasta volver a entrar.

**Esperado:** que el cambio de rol valga desde el próximo pedido, como ya pasa con la baja.
**Pasó:** la persona conserva los permisos viejos hasta que cierra sesión o pasan 8 horas.

**Por qué es ALTO:** es saltear un control de permisos sobre la plata. El caso de uso es justamente
el que importa: a alguien se le saca el acceso a finanzas **porque ya no tiene que tenerlo** (cambió
de puesto, o hay desconfianza), y sigue pudiendo cargar ingresos inventados y anular los reales. El
Sprint 06 cerró este mismo agujero para la **baja** (*"Usuario dado de baja → se corta la sesión.
Antes seguía operando hasta ocho horas"*); el cambio de rol quedó afuera.

**Pista:** `estadoDeSesion` ya trae la fila del usuario en cada pedido. Si trajera también el rol,
`requireLogin` podría actualizar `req.session.user.rol` (o cortar la sesión si cambió).

---

## MEDIO

### M1 · Con la contraseña temporal, 12 de 16 pantallas mandan al login en vez de a cambiar la contraseña

**Qué pasa:** `cargarHeader()` (tanda 1) hace bien su parte: si `/users/me` dice
`debe_cambiar_password`, manda a `cambiar-password.html` y devuelve `null`. Pero casi todas las
páginas, al recibir ese `null`, hacen otra redirección:

```js
usuarioActual = await cargarHeader()
if (!usuarioActual || usuarioActual.error) {
  window.location.href = '/pages/login.html'      // pisa la de cambiar-password
```

La segunda asignación de `location.href` gana, y la persona termina en el login **con la sesión
todavía abierta**.

**Reproducción (confirmada en el navegador):** Claudia (operador con la contraseña inicial), entrando
directo a cada pantalla:

| Va a cambiar la contraseña | Va al login |
|---|---|
| dashboard, usuarios, perfil-empresa | movimientos, configuracion-categorias, configuracion-categorias-producto, configuracion-modulos, configuracion-motivos-stock, productos, servicios, stock, reportes, articulacion, empresa-ficha, configuracion-categorias-servicio (y superadmin) |

En todos los casos `/users/me` sigue dando 200: la sesión no se cortó, sólo la pantalla mandó al
lugar equivocado.

**Esperado:** lo que dice la tanda 1 y el prompt: *"con la contraseña temporal, a cambiarla"*.
**Pasó:** en 12 pantallas aparece el login. Si la persona vuelve a entrar, ahí sí la manda a
cambiarla, así que no queda trabada; pero ve un login que no pidió.

**Por qué es MEDIO:** no expone nada (el servidor sigue bloqueando todo con 403), pero es
exactamente el flujo de una cuenta nueva: el admin le pasa el link de Stock al operador nuevo, el
operador entra con su DNI y la app le vuelve a pedir el login. Para este público, eso se lee como
*"la contraseña no anduvo"*.

**Pista:** las páginas pueden quedarse con `if (!usuarioActual) return`: `cargarHeader()` ya
redirige en los dos casos.

### M2 · Cambiar la unidad de un producto con movimientos reinterpreta su historial, y puede dejar un resto que no se puede sacar

**Qué pasa:** la unidad de medida de un producto se puede cambiar aunque ya tenga movimientos. Las
cantidades guardadas no cambian, así que el historial se relee con la unidad nueva. Si la nueva es
de las que se cuentan enteras (unidad, caja, paquete, bolsa), lo fraccionario que había queda en el
stock **y ningún camino lo deja sacar**.

**Reproducción (confirmada por API):**

```
POST /productos  "QA cambia unidad", kg
POST /productos/stock/movimientos  Ajuste positivo 2,5            -> hay 2,5 kg
PUT  /productos/:id  unidad_medida: "caja"                         -> 200
GET  /productos/stock/movimientos  -> "2.50 caja · Ajuste positivo" (eran kilos)
POST /productos/stock/ventas  cantidad 2                           -> 201 "Quedan 0,5 cajas"
POST /productos/stock/movimientos  Pérdida 0,5                     -> 400 "se cuenta por cajas: escribí un número entero"
POST /productos/stock/ventas  cantidad 1                           -> 400 "No alcanza: hay 0,5 cajas"
```

Anular la entrada de 2,5 tampoco se puede: dejaría el stock en negativo. **Esas 0,5 cajas quedan
para siempre**, y el producto no llega nunca a *"Sin stock"*.

**Esperado:** una de dos, a decidir: que no se pueda cambiar la unidad de un producto con
movimientos (es la misma regla que ya tienen los motivos: *"el efecto de un motivo ya usado no se
puede cambiar, reinterpretaría todo el historial"*), o al menos que no se pueda pasar a una unidad
entera con existencia fraccionaria.
**Pasó:** se cambia sin aviso.

**Por qué es MEDIO:** el caso de corregir la unidad mal elegida al crear el producto es común
(*"kg"* por *"caja"*). Las cantidades no se pierden, pero el historial dice algo que no pasó y, con
la regla nueva de *"lo que se cuenta va entero"*, el stock puede quedar trabado.

---

## BAJO

### B1 · El detalle de una venta o una compra de más de 200 caracteres se corta en silencio

**Qué pasa:** `registrarOperacion` (`stock.controller.js`) hace
`req.body.descripcion.trim().slice(0, 200)`. La regla de la tanda 1 es la contraria:
*"un detalle o una descripción de más de 255 caracteres se rechaza, no se corta"*. Y en *Otra
entrada o salida*, en Movimientos y en *Completar la plata* se cumple.

**Reproducción (confirmada en la tabla):**

```
POST /productos/stock/ventas   descripcion de 201 caracteres -> 201; en la tabla: 200
POST /productos/stock/ventas   descripcion de 300 caracteres -> 201; en la tabla: 200
POST /productos/stock/compras  descripcion de 300 caracteres -> 201; en la tabla: 200
POST /productos/stock/movimientos  (otra salida) 256         -> 400 "El detalle es muy largo"
```

**Por qué es BAJO:** la pantalla tiene `maxlength="200"` en `#op-detalle`, así que desde el
formulario no se llega. Va porque contradice la regla que el proyecto se puso, y porque los otros
tres caminos del mismo dato se comportan distinto.

### B2 · Editar un producto sin mandar el costo, el precio, el mínimo o la subcategoría los borra

**Qué pasa:** es el B3 de la auditoría final, que se arregló para la descripción y quedó a medias.

**Reproducción (confirmada en la tabla):** un producto con mínimo 5, costo 50, precio 90 y
subcategoría. `PUT /productos/:id { nombre, id_categoria_producto, unidad_medida }`:

```
stock_minimo             5.00   -> 0.00
id_subcategoria_producto 3      -> NULL
costo_referencia         50.00  -> NULL
costo_actualizado_en     (hoy)  -> NULL
precio_venta             90.00  -> NULL
```

**Por qué es BAJO:** la pantalla manda siempre todos los campos. Sólo se llega armando el pedido a
mano. Va porque se pierde también la **fecha del costo**, que es lo que el reporte de pérdidas usa
para avisar que un costo es viejo.

### B3 · Una contraseña que no es texto da "Error del servidor" (500)

**Reproducción (confirmada por API):**

```
POST /users/login            { email: "jorge@...", password: 123 }                 -> 500 "Error del servidor"
POST /users/cambiar-password { password_nuevo: 1234567, password_confirm: 1234567 } -> 500
POST /users/register         { ..., password: 1234567, password_confirm: 1234567 }  -> 500
```

En la consola del servidor: `bcrypt: data must be a string`. `password.length` de un número es
`undefined`, así que el control del mínimo no lo frena.

**Por qué es BAJO:** la pantalla manda texto. Va por la misma familia que los 500 del B3 anterior:
un pedido raro tiene que dar un 400 que diga qué está mal.

### B4 · El registro público guarda un nombre enviado como objeto como "[object Object]"

**Reproducción (confirmada en la tabla):** `POST /users/register` (sin sesión) con
`nombre: { a: 1 }` → **201**, y en `usuarios.nombre` queda `[object Object]`. Con
`empresa_nombre: 123` queda `"123"`; con `empresa_federacion: ["x"]`, `"x"`. El superadmin ve esos
textos en *Para aprobar*.

En *Mi empresa* y en usuarios esto ya se arregló (*"un nombre numérico da 400, no 500"*, B3 de la
auditoría final): `nombre: 123` da 400. El registro, que es el único formulario **sin sesión**,
quedó afuera.

**Por qué es BAJO:** sólo armando el pedido a mano, y la empresa queda pendiente hasta que el
superadmin la mira.

### B5 · Un monto demasiado grande en Movimientos dice "debe ser un número mayor a cero"

**Reproducción (confirmada por API):** `POST /movimientos` con `monto: 1000000000000` (un centavo
más que lo que entra en `DECIMAL(14,2)`) o `1e300` → 400 *"El monto debe ser un número mayor a
cero"*. La venta, la compra y *Completar la plata*, con el mismo valor, dicen *"es demasiado
grande"*.

**Por qué es BAJO:** es un mensaje que no dice lo que pasa, en el borde de lo posible. Va porque el
prompt pide que todos los campos numéricos se comporten igual ante el mismo valor.

### B6 · Una subcategoría creada dentro de una categoría de baja no vuelve al reactivar la categoría

**Qué pasa:** el alta contesta *"Subcategoría creada, pero queda de baja **porque su categoría está
dada de baja**"*. Pero nace con `baja_en_cascada = 0`, que es la marca de *"la dio de baja el
admin a propósito"*. Al reactivar la categoría, la cascada no la trae.

**Reproducción (confirmada en la tabla):**

```
categoría "QA casc" con A (activa) y B (dada de baja a mano)
dar de baja la categoría      -> A: activo 0, baja_en_cascada 1 · B: 0, 0
crear C en la categoría       -> 201 "queda de baja porque su categoría está dada de baja"
                                 C: activo 0, baja_en_cascada 0
reactivar la categoría        -> A: 1 · B: 0 · C: 0      <- C no vuelve
```

**Esperado:** que C vuelva con la categoría, como dice el mensaje.
**Por qué es BAJO:** se reactiva a mano en un paso. Va porque el mensaje promete otra cosa.
**Sin ejecutar, por lectura del código:** `crearTipo` en `categoria.controller.js` hace lo mismo
con los tipos de movimiento (`createTipo` tampoco marca `baja_en_cascada`).

---

## Regresión de los informes anteriores

Se reprodujo el caso original de cada hallazgo corregido. **Todos siguen corregidos.**

| Hallazgo | Origen | Hoy |
|---|---|---|
| **C1** XSS en el panel del superadmin · **M2** XSS en usuarios | QA 06 | **Cerrados, y el patrón no volvió en ningún lado** (ver abajo) |
| **A1** `GET /users` sin rol | QA 06 | 403 para tesorero, operador, superadmin y contraseña temporal |
| **A2** saltear el cambio obligatorio | QA 06 | 403 en todo salvo `/users/me`, `/localidades` y el cambio de contraseña, también con la sesión abierta cuando el admin la vuelve a la inicial |
| **A3** registro no atómico | QA 06 | 4 registros con el mismo CUIT a la vez: 1 × 201, 3 × 400, 1 fila. 3 con el mismo DNI: 1 × 201, 0 empresas huérfanas |
| **M4** email al crear usuario · **B2** `monto: true` | QA 06 | Rebotan |
| Sesión viva tras la baja | QA 06 | Cerrado: 401 en el pedido siguiente. **El cambio de rol no** (A1) |
| **C1** dos ventas a la vez · **C2** el mismo cobro varias veces | QA 07-08 | 8 ventas de 2 kg sobre 9 kg con tres usuarios: entran 4, queda **1,00** |
| **M1** *"Sin stock"* para siempre · **M2** la cascada que revive bajas | QA 07-08 | Cerrados: anular el único movimiento deja `cantidad_movimientos` en 0 (*"Sin cargar"*), y la cascada trae sólo las marcadas (ver B6 para el caso nuevo) |
| **B1** JSON roto · **B2** mínimo 0,001 | QA 07-08 | 0,001 → *"demasiado chico"*; 0,005 → 0,01 |
| **A1** negativos del CSV · **M1** totales en el CSV | QA 09-10 | El CSV trae *Entró / Salió / Resultado*; las fórmulas salen con apóstrofe y los números del sistema no |
| **M2** Bolsa de pan en −4 | QA 09-10 | Arranca en 6 |
| **B1** anular el mismo dinero a la vez · **B2** fecha inexistente | QA 09-10 | Cerrados (*"La fecha de inicio no es válida"* para el 30/02) |
| **C1** anular una venta deja su plata | Venta y compra | Cerrado, también corrigiendo y anulando a la vez |
| **B1** costo con compras a la vez · **B2** precio enorme · **B3** camino genérico · **B4** categoría de baja | Venta y compra | 3 compras a la vez × 5 vueltas: el costo queda siempre en la última (333). El resto rebota con su mensaje |
| **C1** *Anular y corregir* la plata de una venta | QA final | `POST /movimientos/:id/corregir` sobre plata de stock → 400 *"corregila desde Stock"* |
| **A1** CUIT con guiones · **M1** DNI con puntos | QA final | Se guardan limpios y el duplicado se detecta con y sin separadores |
| **B1** aprobar una empresa inexistente | QA final | 404 (`9999`, `abc`) |
| **B3** campos que se borran en Mi empresa | QA final | Cerrado: sin `federacion`, `domicilio`, `telefono`, localidad ni casillas, no cambia nada. **En productos quedó a medias** (B2) |
| Montos raros (`1e3`, `0x10`, `" 10 "`) | QA final | Rebotan en los diez campos numéricos (ver abajo) |
| **F-01** *Anular y corregir* que anulaba antes de guardar | UX final | Corregir con datos malos o fecha futura: 400 y **el original sigue vivo** (en la tabla) |
| Bugs de UX de 09-15 y 09-28 | UX | Contraseña de 3 caracteres: rebota (mínimo 6). Pan en −4: cerrado. Descargas en reporte vacío: no se re-verificó en pantalla |

### El patrón del XSS, en todas las pantallas

Se cargó `<img src=x onerror="window.__xss++">` en: nombre y descripción de un producto visible
para otras empresas, categoría de producto, categoría y tipo de movimiento, descripción de un
movimiento, nombre de un motivo, detalle de una entrada y de una venta, nombre y apellido de un
usuario, federación y domicilio de *Mi empresa* (con el domicilio visible), y una empresa
registrada con todo eso en sus campos.

Se abrieron **25 vistas** (las 10 de Marta, las pestañas de Stock y de Reportes, el cartel de
*Anular o corregir*, el alta de movimiento con el desplegable, la venta, la ficha propia y la
ajena, el buscador, el panel del operador y las dos pestañas del superadmin con *Ver datos*).
**`window.__xss` quedó en 0 y no hubo ningún `img[onerror]` en ninguna.** La carga aparece como
texto en todas. `esc()` es una sola y funciona.

---

## Lo que quedó bien probado (y aguantó)

### Seguridad y aislamiento

- **27 GET con cinco perfiles** (tesorero, operador, superadmin, contraseña temporal, admin) y sin
  sesión: la matriz coincide con lo decidido. Sin sesión todo da 401 salvo `/localidades`.
- **31 pedidos de Marta con ids de Metalúrgica** (anular, corregir, editar, dar de baja, tipos,
  subcategorías, motivos, stock, dinero, venta con `reemplaza` ajeno, usuarios): todos 403, 404 o
  400. Ninguno tocó nada.
- Módulos apagados: Reportes, Productos (incluida la descarga de pérdidas) y Servicios rechazan con
  403; `movimientos` no se puede apagar; un módulo inventado da 404; el operador no puede apagar.
- Usuarios: el admin no se puede editar, dar de baja ni resetear a sí mismo; `id_rol` 1
  (admin_empresa) y 4 rebotan; 3 altas con el mismo email a la vez dejan 1 fila.
- Empresa rechazada: 403 con la sesión abierta y *"Tu empresa fue rechazada"* al entrar; habilitada
  de nuevo, entra.

### Productos y Servicios, la misma página

- **20 cruces** con el admin de Metalúrgica (editar, dar de baja, categorías, subcategorías,
  altas con la categoría del otro catálogo, stock, venta y compra sobre un servicio): **todos
  rebotan**.
- Un servicio creado con unidad, mínimo, costo y precio queda en la tabla con `NULL`, `0,00`,
  `NULL`, `NULL`.
- Producto y servicio pueden llamarse igual; dos servicios no (tampoco con mayúsculas).
- `/productos` no trae servicios, `/servicios` no trae productos y Stock no trae servicios.
- **Roles por API y en la pantalla**, entrando por las dos direcciones: el tesorero lee Servicios
  sin ningún botón de edición (sólo *Cuánto deja cada uno* y *Limpiar filtros*) y ve el aviso en
  las categorías; el operador ve *"Tu usuario no tiene acceso al catálogo de servicios"* y sí
  trabaja Productos; el admin ve los dos. Con el módulo apagado (La Esperanza), las dos pantallas
  de servicios dicen que el módulo no está activo.

### Las validaciones unificadas

La misma lista de **25 valores** (vacío, `null`, 0, −5, 0,001, 0,004, 0,005, `"1e3"`, `1e3`
numérico, `"0x10"`, `" 10 "`, `"10,5"`, `"10.5"`, `true`, `[1]`, `{}`, `"Infinity"`, `"-0"`,
`"007"`, los dos topes y un centavo más, `1e300`) contra **diez campos**: monto de movimiento,
cantidad y precio de la compra, cantidad y precio de la venta, cantidad de *Otra entrada o salida*,
monto de *Completar la plata*, y mínimo, costo y precio del producto.

**Se comportan igual**: los mismos valores rebotan en todos, 0,005 redondea a 0,01 en todos, cada
campo respeta su tope de columna, y lo que pasa se guarda tal cual (verificado en la tabla). Las
dos diferencias son las esperadas (costo y precio vacíos son `NULL`; el mínimo vacío es 0) más el
mensaje de B5.

- **Lo que se cuenta va entero**: 1,5 unidades rebota en la venta, la compra, *Otra entrada o
  salida* y la corrección de una venta. Ver M2 para el agujero.
- **Textos largos**: 256 caracteres rebotan en Movimientos, *Otra entrada o salida* y *Completar la
  plata*; 255 entran. Ver B1 para la venta y la compra.

### Dos pedidos al mismo tiempo (cinco vueltas cada uno, mirado en la tabla)

| Escenario | Resultado |
|---|---|
| 8 ventas de 2 kg sobre 9 kg, tres usuarios | 4 entran, queda 1,00 |
| Dos *Anular y corregir* de la misma venta | 1 × 201, 1 × *"ya estaba anulada"*; una sola venta viva con su plata |
| Corregir y anular la misma venta | uno gana; nunca quedan dos vivas ni plata suelta |
| Corregir la venta y anular su plata desde Movimientos | la vieja queda anulada con su plata, la nueva viva con la suya |
| Completar la plata de una venta vieja y corregirla a la vez | el cobro completado se anula con la corrección; 0 cobros sueltos |
| Corregir una compra a menos y vender a la vez | nunca negativo (la corrección rebota) |
| Tres compras con la casilla del costo | el costo queda en el precio de la última |
| Dos correcciones de la misma plata (y con una anulación) | 1 × 201 y el resto 400; un solo movimiento vivo |
| Anular una entrada y vender a la vez | nunca negativo |
| Aprobar la misma empresa 3 veces a la vez | 6 categorías, 15 tipos, 7 motivos, 5 módulos |

**Al final: cero filas de stock anuladas con plata viva, y cero productos en negativo.** Las únicas
ventas o compras vivas sin plata son las de los datos de prueba (ver *Observaciones*).

### Reportes, contra `SELECT`

En **La Esperanza y Metalúrgica**, con **los tres atajos**:
- Período: las filas suman exactamente los casilleros, y los casilleros dan lo mismo que el
  `SELECT`; los anulados que quedan afuera se cuentan bien; orden cronológico.
- **Por categoría cierra exactamente** con el período, y aparecen todas las categorías.
- **Por producto**, producto por producto, igual al `SELECT` que sube por el movimiento de stock, y
  nunca se pasa del total.
- **Por servicio**, servicio por servicio, igual al `SELECT`; aparecen los que no movieron nada.
- **Pérdidas**: el total, la cantidad y los sin costo coinciden con el `SELECT`, y los cortes por
  motivo y por producto cierran entre sí.

**Decimales**: en una empresa recién aprobada, diez ingresos de $ 0,10 y tres egresos de $ 0,10 dan
**1,00 / 0,30 / 0,70** exactos en el reporte, en el resumen de Movimientos y en el CSV.

Período personalizado: sin fechas, con una sola, invertido, 30/02 y texto rebotan con su mensaje;
el mismo día como desde y hasta entra.

### La descarga

- **CSV**: los bytes empiezan con el **BOM** (`EF BB BF`), los renglones con CRLF, separador `;` y
  coma decimal. El nombre lleva la empresa y el período, y cambia con el período.
- **Fórmulas**: `=1+1`, `+HYPERLINK(...)`, `-1` y `@SUM(A1)` salen con apóstrofe. Con un
  tabulador, un retorno o un espacio adelante se guardan recortados y también salen con
  apóstrofe. Un texto con `;`, comillas y salto de línea sale entre comillas, bien escapado.
- **PDF largo** (más de 70 filas): **3 hojas, ninguna en blanco**, con el encabezado de la tabla repetido
  en la 2 y la 3 y el pie en las tres. Leído con `pypdf`.
- Una vista de un módulo apagado da **403**, no un archivo vacío.

### Articulación

- Ninguna clave privada en la búsqueda ni en la ficha (precio, costo, stock, CUIT, monto,
  usuario, DNI): las claves son sólo nombre, localidad, distancia, contacto, ubicación y lo que
  ofrece.
- El Amanecer (`mostrar_telefono = 0`): **el teléfono no viene en la respuesta**.
- Búsqueda: `%`, `_`, una letra, 150 caracteres, 6 palabras y `<script>` no rompen nada;
  `carton` encuentra *Cartón*. Rubro inventado, texto, −1 y `1e2` rebotan.
- Ficha: `abc`, −1, una pendiente, 0, 20 cifras, `1.5`, `3abc` y una inexistente dan 404.
- Superadmin 403, contraseña temporal 403, sin sesión 401.

### Mi empresa

Sin `federacion`, `domicilio`, `telefono`, localidad ni casillas, **no cambia nada** (comparado
columna por columna en la tabla). Nombre numérico o lista, email malo, teléfono con letras o con
HTML, localidad inventada, federación como objeto y domicilio de 256 rebotan con su mensaje. El
CUIT no se puede cambiar desde ahí. Tesorero y operador: 403.

### Los datos de prueba

En La Esperanza, **las 11 ventas y compras con plata dicen en el historial de Stock exactamente el
monto que tienen en Movimientos** (fila por fila, `dinero_monto` contra `movimientos.monto`). El
operador recibe esos montos (13 de 20 filas) y en la pantalla se pintan como *"Cobrado / Pagado:
$ X"*.

### Las pantallas, en tres anchos

**71 recorridos en cada ancho (1280, 800 y 375 px): cero errores de JavaScript, cero errores de
consola y cero scroll horizontal.** Con eso queda probado que ninguna página quedó sin JavaScript
por volver a declarar `esc` o `formatMoneda`. Además:
- Sin sesión, todas van al login. El superadmin que abre el panel va a su pantalla.
- Cada rol ve su aviso en lo que no le toca (*"Tu usuario no tiene acceso al catálogo de
  productos"*, *"Sólo el administrador..."*, *"No tenés permiso para ver los movimientos"*).
- Los atajos `?vender=1`, `?comprar=1`, `?nuevo=ingreso` abren su formulario, y el viejo
  `?ver=servicios` lleva a `reportes.html?vista=servicio`.
- Ninguna pantalla se quedó en *"Cargando..."*.

---

## Observaciones que no llegan a hallazgo

- **Metalúrgica tiene cuatro operaciones vivas sin su plata** en los datos de prueba (tres compras
  y una venta: ids 17, 19, 21 y 24 de `movimientos_stock`). El prompt dice *"una venta de
  Metalúrgica"*. No es un error de la app; conviene que el prompt lo diga entero.
- **`datos_de_prueba.sql` tiene `USE cooperApp;` adentro** (línea 36), igual que `database.sql`.
  Quien levante una segunda copia con otra base (como pide el prompt cuando QA y UX corren juntas)
  e importe ahí los datos con `mysql ... cooperApp_otra < datos_de_prueba.sql`, **está
  reseteando la base de siempre**. Se vio leyendo el archivo, no se ejecutó.
- La descarga con **formato o vista inventados** (`formato=xls`, `vista=inventada`) no rebota:
  entrega el CSV de movimientos. Es silencioso pero no miente: el nombre del archivo dice
  *movimientos*.
- **`mostrar_email: "si"`** se guarda como 0: las casillas sólo aceptan el booleano `true`. La
  pantalla manda booleanos.
- `id_rol: "3"` e `id_rol: [3]` se aceptan y se guardan como 3. Sin efecto.
- Un producto que se cuenta por unidades acepta un **stock mínimo de 1,5**. Sin efecto práctico.
- En la herramienta: el script de pantallas marca como *"fuera"* los `<th>` de las tablas que en
  el celular se vuelven tarjetas (están escondidos con clip). Son falsos positivos; el scroll
  horizontal medido es 0.

## Lo que NO se llegó a cubrir (honestidad)

- **Cortar la base en medio de una transacción.** No se bajó MariaDB.
- **Un segundo navegador.** Sólo Edge sin ventana. **Ni una captura se miró a ojo**: las pantallas
  se midieron por script (errores, ancho, textos, botones), no se inspeccionaron visualmente.
- **Los modales en 375 px** (venta, compra, alta de movimiento, *Anular o corregir*): se abrió el
  cartel de anular y los atajos que abren formularios, pero no se midió el ancho de cada modal.
- **El PDF de pérdidas, por producto y por servicio** con muchas filas: sólo se leyó el largo de
  movimientos y el corto por categoría.
- **El mapa** de la ficha (Leaflet): se excluyó de la medición y no se forzó el tooltip.
- **Editar el mismo producto desde dos pestañas** a la vez (el último gana; no se midió).
- B6 en los tipos de movimiento: visto en el código, no ejecutado.
- **Una persona real** usando la app: no es de QA, pero sigue sin hacerse (HU-64 y HU-65).

---

## Prioridad sugerida

1. **A1.** Es el único que saltea un permiso sobre la plata. Que `requireLogin` traiga también el
   rol (ya lee la fila del usuario en cada pedido) y lo actualice o corte la sesión.
2. **M1.** Es el primer contacto de cada usuario nuevo con la app. Se arregla sacando una línea
   repetida en doce páginas.
3. **M2.** Decidir la regla (no cambiar la unidad de un producto usado, o no pasar a una unidad
   entera con resto) y escribirla en el servidor.
4. **B1, B2, B6.** Lo que quedó a medias de reglas que el proyecto ya decidió.
5. **B3, B4, B5.** Mensajes de los pedidos raros.

## De paso (usabilidad, no es el foco de este informe)

- El alta de una subcategoría dentro de una categoría de baja la crea igual, de baja, en vez de
  avisar antes. Junto con B6, la persona termina con una subcategoría escondida que no sabe que
  existe.

---

## Resultado de las correcciones (15/11/2026)

Se corrigieron **los 9**, en el chat de desarrollo. Nada fue al backlog.

| Hallazgo | Qué se hizo |
|---|---|
| **A1** rol viejo en la sesión | `estadoDeSesion` trae también el rol, y `requireLogin` pone al día `req.session.user.rol` en cada pedido. El cambio vale desde el pedido siguiente, como la baja; `/users/me` y el menú muestran el rol nuevo. |
| **M1** login en vez de cambiar la contraseña | Las 11 páginas que redirigían otra vez quedaron con `if (!usuarioActual) return`: `cargarHeader()` ya manda al login o a cambiar la contraseña. |
| **M2** cambiar la unidad con movimientos | **Decidido: no se puede**, la misma regla que el efecto de un motivo ya usado. El servidor lo rechaza con un mensaje que dice qué hacer, el listado trae `cantidad_movimientos` y el formulario deja la unidad fija con la explicación. |
| **B1** detalle de venta cortado | Se rechaza con *"puede tener hasta 200 caracteres"*, no se corta. |
| **B2** editar un producto borraba campos | Lo que no viene (unidad, mínimo, costo, precio, categoría, subcategoría) se completa con lo que ya tiene el producto y se valida igual. La fecha del costo no se toca. |
| **B3** contraseña que no es texto | 400 en el login, el cambio de contraseña y el registro. |
| **B4** registro con objetos | El registro acepta sólo texto en cada campo (el CUIT y el DNI también como número) y dice qué campo está mal. |
| **B5** monto enorme | *"El monto es demasiado grande"*, como en la venta y la compra. |
| **B6** subcategoría o tipo creados en una categoría de baja | Nacen con `baja_en_cascada = 1` y vuelven con la categoría. Corregido también en los tipos de movimiento. |

**Observaciones que también se resolvieron:**
- La descarga con formato o vista inventados da **400** (también `vista=toString`, que pasaba por
  ser una propiedad heredada del objeto).
- El **stock mínimo** de lo que se cuenta (unidad, caja, paquete, bolsa) tiene que ser entero.
- `USE cooperApp;` en `datos_de_prueba.sql` y las cuatro operaciones de Metalúrgica sin plata
  quedaron anotadas en el prompt de QA (el archivo no se cambió: el grupo lo usa así).

**Probado**: un script nuevo con 30 casos (los 9 hallazgos y las observaciones), más las cuatro
baterías anteriores (16, 26, 13 y 9 casos), todas bien; y el recorrido de las 92 pantallas en
1280, 800 y 375 px, ahora midiendo también lo que se pasa **dentro** de cada bloque: sin errores de
consola, sin scroll de costado y sin barras de desplazamiento.
