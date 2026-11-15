# Informe de QA — CooperApp · tercera auditoría de la entrega

- **Fecha:** 15/11/2026
- **Qué se auditó:** el sistema completo, en `master` en el commit `57627ad` (las correcciones de la
  segunda vuelta de auditorías), más el prompt de QA actualizado sin commitear. Foco:
  - la **regresión** contra todos los informes anteriores, sobre todo `informe-QA-entrega-2.md`, que se
    corrigió entero el 15/11;
  - la sección **"LO QUE CAMBIÓ EN LA SEGUNDA VUELTA"** de *Qué probar*: el cambio de unidad bajo el
    candado, corregir cualquier entrada o salida (`reemplaza`), la contraseña actual, *Por producto* con
    Vendido / Comprado, *Completar la plata* con el total calculado, el panel contra los mismos días y
    `movimientos.html?periodo=`;
  - después, el resto del prompt.

## Conteo de hallazgos

| Severidad | Cantidad |
|---|---|
| CRÍTICO | 0 |
| ALTO | 0 |
| MEDIO | 2 |
| BAJO | 4 |
| **Total** | **6** |

**Los 6 están confirmados ejecutándolos.** Los dos medios se confirmaron por API y también en la
pantalla.

En resumen: **los cuatro hallazgos de la segunda vuelta siguen corregidos, y lo que cambió en
`57627ad` no pierde plata ni muestra datos de otra empresa.** El candado de la unidad aguanta las
carreras (las dos cosas nunca entran juntas), corregir una entrada o salida rebota en todos los cruces
y en las cuatro carreras, la contraseña actual se pide bien, y *Por producto* cierra contra `SELECT`
fila por fila, en la pantalla, el CSV y el PDF.

- **M1** no es nuevo de `57627ad`, pero nunca se había reportado: **una pestaña de Productos abierta
  pisa el costo que dejó una compra**. La casilla del costo actualiza el producto, y si el admin tenía
  la pantalla de Productos abierta desde antes y guarda cualquier cambio, el costo vuelve al viejo. Además
  la fecha del costo queda como recién actualizada, así que el aviso de *"costo viejo"* tampoco aparece.
- **M2** es nuevo: el resumen del historial de un producto (*"En total: entraron… · salieron…"*) suma
  sólo las filas del filtro. Con un motivo elegido dice, por ejemplo, *"entraron 0 kg"* cuando
  entraron 20.

## Nota de método

**El entorno:**
- MariaDB de XAMPP, base `cooperApp`. Se recreó desde los dos `.sql` al empezar, antes del recorrido
  de pantallas y al terminar.
- Al empezar había otra copia de la app escuchando en el 3000 (PID 9752). **Se mató por PID** y se
  levantó una nueva con `node app.js`, con el log en un archivo. **No se tocaron** la base
  `cooperApp_ux` ni la app del 3002 (la auditoría de UX corría al mismo tiempo).
- Edge sin ventana en el **puerto de depuración 9341**, con un perfil propio. UX usaba el 9377 y no
  hubo interferencia.
- **Al terminar, la app quedó corriendo en el 3000** contra la base recreada limpia.

**Tres niveles:**
- **Base** (`mysql.exe` y `mysql2` desde los scripts).
- **API**: scripts de Node con `fetch`, logueados con cada rol, y `Promise.all` para la concurrencia.
  Se reusaron como regresión los 14 scripts de la primera auditoría de la entrega, más 11 nuevos para lo
  de `57627ad`. Quedaron en el scratchpad de la sesión, fuera del repo.
- **Navegador**: una copia de `revisar-pantallas.js` con una expresión que mide lo que se pasa de la
  pantalla, **lo que se sale de su bloque** (un hijo más ancho que su padre) y las barras de
  desplazamiento internas. **134 recorridos en 1280 y en 800 px, y 71 en 375 px** (ver *Lo que NO se
  llegó a cubrir*). Además, 12 recorridos que manejan la pantalla (corregir una rotura, completar la
  plata, el panel, el resumen del historial, cambiar la contraseña, Por producto, la pestaña vieja de
  Productos) y 29 vistas para el XSS.
- **El reloj simulado** para el panel: `periodo.service.js` con la fecha cambiada, en diez días
  distintos (el 1, el 15, el 30, el 31, el 29 de marzo, el 1 de enero).

**No se tocó código, esquema, pantallas ni datos de prueba.** Lo único escrito en el repo es este
informe y la fila del registro en `prompt-testeo-QA.md`.

---

## MEDIO

### M1 · Una pestaña de Productos abierta pisa el costo que dejó una compra, y la fecha queda como nueva

**Qué pasa:** la pantalla de Productos guarda la lista en `window.productosCargados` al abrirse, y el
formulario de *Editar* se llena con esa lista, no con lo que hay en la base. Al guardar manda **todos**
los campos, también el costo. Si entre medio una compra actualizó el costo con la casilla *"Guardar $X
como el costo de este producto"*, la edición lo vuelve al valor viejo. El servidor ve un costo
"distinto" y le pone la fecha de hoy (`costoCambio` → `costo_actualizado_en = NOW()`).

**Reproducción en la pantalla (confirmada):** Marta abre `productos.html`. Mientras tanto se registra una
compra de Queso cremoso a $ 8.977 con la casilla tildada. Después Marta toca *Editar* en Queso cremoso,
cambia sólo la descripción y guarda.

```
antes:                    costo 8200.00
compra con la casilla:    "Compra registrada... costoActualizado=true"   -> costo 8977.00
en el formulario:         8200          (el de la lista cargada al abrir)
después de guardar:       costo 8200.00, costo_actualizado_en = 2026-11-15 17:18 (ahora)
```

**Por API (confirmado en la tabla):** lo mismo con un producto nuevo (costo 100). Silvia lo compra a
120 con `actualizar_costo: true` y la tabla queda en 120. Después Marta manda el `PUT /productos/:id` con
los campos que había leído antes, como hace la pantalla, y la tabla vuelve a 100 con la fecha de ese
momento.

**Esperado:** que guardar una descripción no cambie un costo que la persona no tocó. Se podría mandar
sólo lo que cambió (*"un campo que no viene no se toca"* ya existe en el servidor), o avisar que el
producto cambió desde que se abrió el formulario.
**Pasó:** el costo actualizado por la compra se pierde sin que nadie se entere. Y como la fecha queda
como de hoy, desaparece la única señal que tenía el administrador de que el costo podía estar viejo
(*"hace más de medio año…"*).

**Por qué es MEDIO:** no hace falta que sea al mismo tiempo. Alcanza con que la pantalla de Productos
quede abierta mientras el operador recibe mercadería, que es lo normal en una PyME con una compu en la
oficina. El costo es lo que valoriza *"Lo que se perdió"*, y la casilla del costo existe justamente para
que no quede atrasado con la inflación. Es el patrón *"el último que guarda gana"*: el prompt pedía
probar *"editar el mismo producto desde dos pestañas"* y no se había cubierto en ninguna auditoría.

**Lo mismo, en menor medida:** cualquier campo que otro haya cambiado mientras la pestaña estaba abierta
vuelve al valor viejo (precio, mínimo, nombre). El costo es el único que el sistema cambia solo, y por
eso es el que más fácil se pierde.

### M2 · El resumen del historial de un producto dice "En total" pero suma sólo el filtro

**Qué pasa:** en Stock → *Entradas y salidas*, al elegir un producto aparece el resumen nuevo (UX entrega
2, G-13): *"En total: entraron X · salieron Y. Hoy hay Z"*. El resumen suma las filas que trae la lista
(`stock.html`, `cargarMovimientos`), y la lista respeta **todos** los filtros. Con un motivo elegido,
los números son sólo los de ese motivo, pero el texto sigue diciendo *"En total"*.

**Reproducción en la pantalla (confirmada):** Marta, `stock.html?ver=historial`.

```
Producto = Queso cremoso                    -> "En total: entraron 20 kg · salieron 14,5 kg. Hoy hay 5,5 kg."   (3 filas)
Producto = Queso cremoso, Motivo = Venta    -> "En total: entraron 0 kg · salieron 12,5 kg. Hoy hay 5,5 kg."    (1 fila)
en la tabla: Compra 20,00 · Venta 12,50 · Pérdida 2,00
```

**Esperado:** que el resumen diga lo mismo que la base, o que aclare que es sólo lo del filtro (como ya
hace con las fechas: *"En el período"*).
**Pasó:** *"En total: entraron 0 kg"* de un producto al que entraron 20 kg. Encima, *"Hoy hay 5,5 kg"*
al lado de *"entraron 0 · salieron 12,5"* no cierra: la persona no puede reconstruir la existencia con
los números que tiene adelante.

**Por qué es MEDIO:** es un número que dice algo falso sobre el stock, en la pantalla que el operador usa
para entender por qué hay lo que hay. Pasa con cualquier filtro de motivo, también de a un clic. No se
pierde nada en la base.

---

## BAJO

### B1 · `movimientos.html?periodo=` con comillas deja la pantalla en "Cargando..." para siempre

**Qué pasa:** `movimientos.html` arma un selector con lo que viene en la dirección, sin escaparlo:
`document.querySelector(`.btn-atajo[data-periodo="${periodoPedido}"]`)`. Si el valor tiene una comilla
o un corchete, el selector no es válido, la función tira una excepción y el resto de la carga no corre.

**Reproducción (confirmada en el navegador, en 1280, 800 y 375 px):**

```
/pages/movimientos.html?periodo=%22%5D      (es decir: periodo="] )
EXCEPCION: SyntaxError: Failed to execute 'querySelector' on 'Document':
           '.btn-atajo[data-periodo=""]"]' is not a valid selector.
la tabla queda en "Cargando..." y no se puede usar
```

Con un período que no existe (`?periodo=inventado`) o con `personalizado` anda bien: carga el listado
normal.

**Por qué es BAJO:** hay que escribir la dirección a mano. No se ejecuta nada (no es un XSS): sólo deja
la pantalla trabada hasta recargar sin ese parámetro. Va porque el prompt pide probar el parámetro con
un período inventado, y es la única de las direcciones con parámetros que se rompe así (`stock.html?ver=`
y `reportes.html?vista=` comparan el texto, no arman un selector).

### B2 · Corregir una entrada como salida dice "hay -8 kg"

**Qué pasa:** en la corrección de *Otra entrada o salida*, si la original es una **entrada** de la que ya
salió parte, y la corrección es una **salida**, la cuenta de *"lo que hay sin la de antes"* da negativa
y el mensaje la muestra así. El servidor rebota bien (no queda nada negativo), pero el mensaje dice algo
imposible.

**Reproducción (confirmada por API y en la pantalla):** un producto con un *Ajuste positivo* de 10 kg y
un *Consumo interno* de 8 kg. Se corrige el ajuste eligiendo un motivo de salida, 1 kg:

```
API:      400 "No alcanza: hay -8 kg y estás sacando 1 kg. Si en el depósito hay más: ..."
pantalla: "Sin esta salida, hay -8 kg y estás sacando 1. No alcanza. ..."
```

En la pantalla además dice *"Sin esta salida"* cuando lo que se está corrigiendo es una entrada (el
texto sale del motivo nuevo, no del original).

**Esperado:** lo mismo que hace la corrección de una entrada a menos: *"de esa entrada ya salieron 8 kg"*.
**Por qué es BAJO:** el control funciona, no se guarda nada malo. Es un mensaje que no se entiende, en
un caso raro (cambiar una entrada por una salida).

### B3 · Una venta o compra que entra mientras cambia la unidad describe la plata con la unidad vieja

**Qué pasa:** el arreglo de M1 de la segunda vuelta funciona: la unidad se vuelve a mirar adentro del
candado y las dos cosas nunca quedan rotas. Pero `registrarOperacion` arma **la descripción de la plata
y el mensaje** antes del candado, con la unidad que leyó al principio. Si la unidad cambió en el medio, el
movimiento de stock queda en la unidad nueva y el de plata cuenta otra cosa.

**Reproducción (confirmada por API y en la tabla, 8 de 8 vueltas):** un producto nuevo en *caja*, y a la
vez `PUT /productos/:id` a *kg* (Marta) y `POST /productos/stock/compras` de 3 (Silvia). Entran los dos,
que es lo correcto (primero cambió la unidad y 3 kg es válido), pero:

```
productos.unidad_medida = kg      movimientos_stock.cantidad = 3.00
movimientos.descripcion = "Compra: 3 cajas de QA uni 17 …"
```

**Esperado:** que la plata diga *"3 kg"*, como el stock.
**Por qué es BAJO:** hacen falta dos personas en el mismo segundo y un producto sin ningún movimiento.
Los números están bien; lo que no coincide es el texto de Movimientos con el del historial de Stock.

**Al revés (kg → caja contra la primera compra de 2,5 kg):** 16 de 16 vueltas, siempre entra una sola
de las dos. M1 de la segunda vuelta sigue cerrado.

### B4 · La pantalla de cambiar contraseña, abierta con una contraseña propia, no tiene salida

**Qué pasa:** desde `57627ad`, con una contraseña propia el servidor pide `password_actual`. Pero
`cambiar-password.html` sólo tiene los campos *nueva* y *repetila*, dice *"Entraste con la contraseña
inicial (tu DNI)"* aunque no sea así, y no revisa si la persona tiene que cambiarla. Si alguien llega
(con *Atrás* después de cambiarla, o escribiendo la dirección), completa el formulario y recibe:

```
"Para cambiar tu contraseña, escribí primero la que usás ahora"
```

…y en la pantalla no hay dónde escribirla.

**Reproducción (confirmada en el navegador):** Marta (contraseña propia) abre `cambiar-password.html`,
escribe una nueva dos veces y guarda: 400, el mensaje de arriba, 2 campos en la pantalla.

**Por qué es BAJO:** la regla del servidor es la correcta, y *"no hay pantalla para cambiarla fuera del
primer ingreso"* está decidido. Lo que falla es que la pantalla que sí existe no lo sabe: dice algo que
no es cierto (*"entraste con la contraseña inicial"*) y pide algo que no se puede hacer. Lo más simple es
que la pantalla mande al panel si `debe_cambiar_password` es falso.

---

## Regresión de los informes anteriores

Se reprodujo el caso original de cada hallazgo corregido. **Todos siguen corregidos.**

| Hallazgo | Origen | Hoy |
|---|---|---|
| **M1** la unidad fija salteada con dos pedidos | QA entrega 2 | **Cerrado.** Cambiar kg → caja contra la primera compra de 2,5 kg (8 vueltas) y contra la primera entrada de 2,5 kg (8 vueltas, alternando el orden): siempre entra una sola. Una pestaña vieja que manda la unidad de antes, después de una compra, rebota. Tres pedidos a la vez (cambiar la unidad, comprar y editar el nombre con la unidad vieja), 30 vueltas: ninguna rota. Ver B3 |
| **B1** texto fuera de los botones de Stock | QA entrega 2 | **Cerrado.** En 375 px no se sale nada de su bloque en Stock, con Marta, Silvia, Osvaldo, Fabián y Norma |
| **B2** cambiar la contraseña sin la actual | QA entrega 2 | **Cerrado** (ver *Lo que cambió*). Ver B4 |
| **B3** el operador recibe "Movimientos" | QA entrega 2 | **Cerrado.** Venta y compra de un servicio como operador: *"Los servicios no pasan por el stock."* |
| **A1** el rol viejo en la sesión | QA entrega | **Cerrado.** Roberto pasado a operador: 403 en Movimientos, resumen, descarga, anular, y también en *Por producto*; puede corregir una entrada de stock. Vuelto a tesorero: 403 en Stock en el pedido siguiente |
| **M1** login en vez de cambiar la contraseña | QA entrega | **Cerrado**: Claudia termina en `cambiar-password.html` en los tres anchos |
| **M2** cambiar la unidad de un producto usado | QA entrega | **Cerrado.** Con un movimiento (también si está anulado), rebota; `KG`, `" kg "`, `Caja` y `"caja "` dan *"Elegí una unidad de medida válida"* |
| **B1–B6** detalle cortado, campos que se borraban, tipos raros, monto enorme, lo creado en una categoría de baja | QA entrega | Cerrados (detalle de 201 → *"hasta 200"*; las mismas respuestas que en la segunda vuelta) |
| **C1** *Anular y corregir* la plata de una venta | QA final | 400 *"corregila desde Stock"* |
| **A1/M1/B1/B3** CUIT, DNI, aprobar inexistente, Mi empresa | QA final | Cerrados: CUIT con guiones y DNI con puntos se guardan limpios, aprobar `9999` y rechazar `abc` dan 404 |
| **C1** anular una venta deja su plata | Venta y compra | Cerrado. Las 9 carreras de plata y stock, 5 vueltas cada una: cero filas de stock anuladas con plata viva |
| **B1–B4** | Venta y compra | Tres compras a la vez con la casilla: el costo queda en la última. Lo demás rebota con su mensaje |
| **C1/C2** dos ventas a la vez, el mismo cobro dos veces | QA 07-08 | 8 ventas de 2 kg sobre 9 kg: entran 4, queda 1,00. Completar la plata dos veces: la segunda rebota |
| **A1/M1** negativos y fórmulas del CSV | QA 09-10 | Las fórmulas salen con apóstrofe (`'=1+1`, `'@SUM(A1)`), los números del sistema sin él |
| **C1/M2** XSS, sesión tras la baja, `GET /users` | QA 06 | Cerrados (ver abajo y la matriz de seguridad) |

### El patrón del XSS, también en lo nuevo

Se repitió la siembra de las auditorías anteriores (`<img src=x onerror="window.__xss++">` en el
producto visible, categorías, tipo, descripción, motivo, detalle de una entrada y de una venta, usuario
y empresa) y se abrieron **29 vistas**, entre ellas las piezas nuevas de `57627ad`:

- el formulario de **corregir una entrada o salida**, con el nombre del producto en el desplegable
  (*"(sin esta: …)"*) y el aviso de corrección;
- el **resumen del historial** con el producto elegido;
- *Por producto* con su recuadro de **Vendido / Comprado** y la nota;
- el cartel del **tesorero** sobre la plata de una venta (*"Entendido, se lo pido"*);
- el **superadmin** con una empresa registrada con el email de admin
  `<img/src=x/onerror=window.__xss=1>@x.com` (el registro lo acepta: ver *Observaciones*), en la lista,
  *Todas* y *Ver datos*.

**`window.__xss` quedó en 0 y no hubo ningún `img[onerror]` en ninguna.** La carga aparece como texto
en todas.

---

## Lo que quedó bien probado (y aguantó)

### Lo que cambió en la segunda vuelta

- **Corregir cualquier entrada o salida** (`reemplaza` en `POST /productos/stock/movimientos`):
  - corregir 10 → 7: la vieja anulada, la nueva viva, existencia 7 (en la tabla);
  - corregir una ya anulada, una de otro producto, una de otra empresa, una venta y una compra: rebotan
    con su mensaje;
  - `reemplaza` = `"abc"`, `[1]`, `true`, `false`, `0`, `-1`, `1.5`, `{"id_movimiento_stock":1}`, `"  "`,
    `99999999`: rebotan todos y no anulan nada;
  - corregir una entrada a menos de lo que ya salió rebota (*"de esa entrada ya salieron 8 kg"*); a
    justo lo que salió entra y deja 0; una salida a más de lo que hay rebota, a justo lo que hay entra;
  - 1,5 en una caja, fecha futura y detalle de 300: rebotan **y la original sigue viva**;
  - el **tesorero**: 403 (corregir y anular); el operador corrige;
  - **las cuatro carreras** (5 vueltas cada una, mirado en la tabla): dos correcciones de la misma
    (entra una, la otra *"ya estaba anulado"*), corregir contra anular (gana uno), corregir a 3 contra
    vender 8 (la venta rebota con *"hay 3 kg"*), corregir una salida 2 → 9 contra otra salida de 5 (la
    corrección rebota). **Cero productos en negativo.**
  - Por la venta y la compra, `reemplaza` con un ajuste, una compra en una venta o al revés: rebota
    (*"Ese movimiento no es una venta"*).
  - **En la pantalla:** *Anular o corregir* sobre una Pérdida abre *"Corregir la salida"*, con el
    producto fijo, la cantidad, el motivo y la fecha de la original, y *"Sin esta salida, hay 10 bolsas ·
    con la corrección quedan 5"*. Al guardar: *"Salida corregida: la de antes quedó anulada"*.
- **La contraseña actual:** con la inicial alcanza la nueva (y `debe_cambiar_password` pasa a 0). Con una
  propia: sin la actual, mal, vacía, `123`, `["…"]`, `{"$gt":""}`, `true`, `null` y el DNI viejo dan 400;
  la buena da 200 y se puede entrar con la nueva. Mandar el `id` de otro usuario en el cuerpo no cambia
  la de nadie más (el servidor usa la de la sesión). Con la sesión abierta, si el admin vuelve a alguien
  a la contraseña inicial, esa persona la cambia sin la actual (correcto). El superadmin también necesita
  la suya. Ver B4.
- **Por producto**, en La Esperanza y Metalúrgica con los tres atajos: cada fila coincide con un `SELECT`
  en lo cobrado, lo pagado y las cuatro cantidades del detalle (*vendiste, compraste, salieron sin
  venderse, entraron sin comprar*); el orden es por lo vendido; **Vendido y Comprado de la pantalla, del
  CSV (renglones de totales y suma de filas) y del PDF dan lo mismo** (por ejemplo, $ 413.870,00 y
  $ 423.550,00 en la pantalla y en la API). El CSV tiene 4 columnas en cada fila; el PDF de 131 productos
  tiene 6 hojas, numeradas, sin ninguna en blanco. La pantalla esconde *Resultado* y los casilleros del
  período, y al pasar a *Lo que se perdió* y a *Por categoría* la nota cambia (G-01 de UX sigue bien).
- **Completar la plata:** el servidor sigue validando el monto como antes (vacío, 0, negativo, 0,004,
  `1e3`, `0x10`, `" 10 "`, `"10,5"`, `true`, `[1]`, `{}`, `"Infinity"` rebotan; el tope entra y uno más
  dice *"demasiado grande"*). No confía en la cuenta de la pantalla, y la segunda vez para el mismo
  movimiento rebota. En la pantalla: *"Lo que pagaste por bolsa"*, *"Se multiplica por 10 bolsas"*, y el
  total se recalcula en centavos (0,335 → $ 3,40; negativo → $ 0,00 y no manda nada).
- **El panel contra los mismos días:** con el reloj simulado, el 15/11 compara contra el 1 al 15 de
  octubre y muestra *"Octubre entero"*; el 31/12 contra noviembre entero (30 días) sin repetir el
  *"entero"*; el 29 y el 31 de marzo contra el 1 al 28 de febrero; en 2028, contra el 29; el 1 de enero,
  *"El 1 de diciembre"*. **En la pantalla, contra `SELECT`:** Marta, *"Del 1 al 15 de octubre:
  $ 275.000,00"* (entró) y *"$ 12.000,00"* (salió), resultado *"$ 263.000,00 (a favor)"*: es lo que da la
  base. **Una empresa recién aprobada** (sin nada el mes anterior) y la Papelera (sin nada) no muestran
  comparación.
- **`movimientos.html?periodo=`:** `mes-actual`, `mes-anterior`, `personalizado` e `inventado` cargan
  bien; combinado con `nuevo=ingreso` / `nuevo=egreso` abre el alta; Silvia (operador) ve el aviso de
  permiso. Ver B1.

### Seguridad y aislamiento

- **La matriz de 27 GET** con cinco perfiles y sin sesión: igual que en las dos auditorías anteriores.
  Sin sesión, todo 401 salvo `/localidades`.
- **31 pedidos de Marta con ids de Metalúrgica:** todos 403, 404 o 400.
- **Los cruces entre catálogos** de Productos y Servicios (20): rebotan todos. Los roles de Servicios, al
  revés que en Productos.
- **Módulos apagados**, **suspendida / rechazada / habilitada de nuevo**, **alta con rol superadmin**
  (*"Elegí un rol de la lista"*): igual que antes.

### Datos y cálculos

- **Reportes contra `SELECT`**, en La Esperanza y Metalúrgica con los tres atajos: el período cierra con
  sus filas, *por categoría* cierra con el período, *por producto* y *por servicio* coinciden fila por
  fila, y en *pérdidas* los dos cortes cierran entre sí.
- **Decimales:** diez ingresos de $ 0,10 y tres egresos de $ 0,10 dan 1,00 / 0,30 / 0,70 exactos en el
  resumen, el reporte y el CSV.
- **La lista de 25 valores raros** contra los diez campos numéricos: igual que en las auditorías
  anteriores.
- **Los datos de prueba:** en La Esperanza, cada venta y compra con plata dice en el historial lo mismo
  que en Movimientos (0 diferencias).

### Dos pedidos al mismo tiempo (mirado en la tabla)

Las nueve carreras de la primera auditoría de la entrega dan lo mismo (8 ventas sobre 9 kg, dos *Anular
y corregir*, corregir contra anular, corregir contra anular la plata, completar contra corregir, corregir
una compra contra vender, tres compras con la casilla del costo, dos correcciones de la misma plata,
anular una entrada contra vender). Más las nuevas: **las cuatro de `reemplaza`** y **tres de la unidad**
(ver arriba), y **3 aprobaciones**, **3 altas con el mismo email**, **4 registros con el mismo CUIT** y
**3 con el mismo DNI** (1 fila cada uno). **Al final: cero filas de stock anuladas con plata viva y cero
productos en negativo.** Las únicas ventas o compras vivas sin plata son las cinco de los datos de prueba.

### Articulación

Ninguna clave privada en la búsqueda ni en la ficha. El Amanecer no manda su teléfono. Comodines, una
letra, 150 caracteres, seis palabras y `<script>` no rompen nada. Una ficha rara, pendiente o inexistente
da 404.

### Las pantallas, en tres anchos

**1280 y 800 px (134 recorridos cada uno) y 375 px (71): cero errores de JavaScript, cero errores de
consola, cero scroll horizontal, cero barras internas y nada que se salga de su bloque**, salvo
`?periodo="]` (B1). Doce usuarios (los cuatro roles en cuatro empresas, la contraseña temporal y sin
sesión), todas las páginas, también las que no les corresponden, y los atajos (`?vender`, `?comprar`,
`?ver=faltantes|historial`, `?vista=…`, `?periodo=…&nuevo=…`). Las únicas *"salidas de bloque"* que
marcó la medición son los formularios dentro de un `.row` de Bootstrap (los 8 px del margen negativo de
la grilla): falsos positivos, se excluyeron.

---

## Observaciones que no llegan a hallazgo

- **`/users/me` sigue devolviendo el `id_rol` viejo** después de un cambio de rol (`"rol":"operador",
  "id_rol":2`). Ya estaba anotado en la segunda vuelta; ninguna pantalla lo usa.
- **El registro acepta un email como `<img/src=x/onerror=…>@x.com`**: `esEmailValido` sólo pide algo
  sin espacios, una arroba y un punto. No pasa nada (`esc()` lo muestra como texto en las tres vistas
  del superadmin), pero es un email que no existe y que queda como usuario de la cuenta.
- **Cambiar la contraseña no corta las otras sesiones de esa persona**: una segunda sesión abierta sigue
  andando con la contraseña vieja. Si alguien la cambió porque sospecha que otro la usó, el otro sigue
  adentro hasta que venza la sesión.
- **Un formulario abierto antes de que cambie la unidad** carga la cantidad en la unidad nueva: el
  operador ve *"Cantidad (en cajas)"*, el admin pasa el producto (sin movimientos) a kg, y la compra de
  3 entra como 3 kg. No es una carrera de milisegundos sino de un formulario abierto, y la regla de la
  unidad se respeta (el producto todavía no tenía movimientos). Es el mismo patrón que M1.
- **Un mensaje con *ingreso / egreso*** quedó en `POST /productos/stock/movimientos/:id/dinero` con una
  categoría de la otra naturaleza: *"El motivo "Compra" genera un egreso, así que hay que elegir una
  categoría de egresos"*. Sólo armando el pedido: la pantalla ofrece la categoría correcta.
- **`cantidad_movimientos` sigue diciendo dos cosas** (con o sin los anulados), como se anotó en la
  segunda vuelta.

## Lo que NO se llegó a cubrir (honestidad)

- **375 px, completo.** El recorrido de 375 px con la lista entera (134) iba muy lento (más de 30
  segundos por pantalla) y se cortó a los 25. Se completó con una lista reducida de 46: cada rol en sus
  pantallas y todos los atajos nuevos. Quedaron sin medir en 375 px algunas combinaciones de usuario y
  página que no le corresponden (avisos de permiso), que en 1280 y 800 dieron bien.
- **Cortar la base en medio de una transacción.** El MariaDB de XAMPP lo comparte la auditoría de UX
  (`cooperApp_ux`), así que bajarlo le cortaba su trabajo.
- **Un segundo navegador.** Sólo Edge sin ventana, y ninguna captura mirada a ojo: todo se midió por
  script (errores, anchos, desbordes, textos y botones).
- **Los modales en 375 px**, uno por uno: se midió la página con el modal abierto en los atajos
  (`?vender`, `?comprar`, `?nuevo`), no el de corregir ni el de completar la plata.
- **Abrir los CSV en Excel.** Se miraron los bytes (BOM, `;`, CRLF, columnas por renglón), no el
  programa.
- **El mapa** de la ficha (Leaflet): no se forzó el tooltip.
- **Una persona real** usando la app: no es de QA, pero sigue sin hacerse (HU-64 y HU-65).

---

## Prioridad sugerida

1. **M1.** Es plata que se valoriza mal sin que nadie se entere, y le saca al administrador la única
   señal de que el costo podía estar viejo. Lo más chico: que el formulario de Productos mande sólo lo
   que la persona tocó (el servidor ya respeta *"lo que no viene no se toca"*), o que lo vuelva a pedir al
   abrir *Editar*.
2. **M2.** Que el resumen del historial sume sin el filtro de motivo (o lo diga).
3. **B4 y B2.** Dos mensajes que piden o dicen algo imposible.
4. **B1 y B3.** El parámetro sin escapar y la descripción de la plata en la carrera.


---

## Resultado de las correcciones (15/11/2026)

Se corrigieron **los 6**, en el chat de desarrollo. Nada fue al backlog.

| Hallazgo | Qué se hizo |
|---|---|
| **M1** una pestaña vieja pisaba el costo de una compra | *Editar* pide el producto de nuevo al abrir (no usa la lista que quedó cargada), y al guardar manda **sólo lo que la persona cambió** (más el nombre). El servidor ya dejaba como estaba lo que no viene: el costo y su fecha no se tocan si nadie los cambió. |
| **M2** el resumen del historial decía "En total" con un filtro | Dice de qué habla: *"Con el motivo «Venta»…"*, *"En el período…"* o *"En total…"*, y *"Hoy hay X en total"* aparte. |
| **B1** `?periodo=` con comillas trababa Movimientos | El atajo se busca comparando el texto, no armando un selector. |
| **B2** corregir una entrada por una salida decía "hay -8 kg" | En el servidor y en la pantalla: *"De esa entrada ya salieron 8 kg: no se puede corregir así"*. La pantalla nombra lo de antes por lo que era (*"sin la entrada de antes"*). |
| **B3** la plata de una venta con la unidad vieja | La descripción de la plata y el mensaje se arman adentro del candado, con la unidad que vale ahí. |
| **B4** cambiar la contraseña sin salida | La pantalla es para la contraseña inicial: con una propia, va al panel; sin sesión, al login. |

**Probado**: un script nuevo con 16 casos (el costo con la pestaña vieja, el "hay -8", **6 vueltas de la
carrera de B3**, los reportes, los mensajes) más las siete baterías anteriores, todas bien; y las 92
pantallas en 1280, 800 y 375 px midiendo lo que se pasa dentro de cada bloque: cero errores.
