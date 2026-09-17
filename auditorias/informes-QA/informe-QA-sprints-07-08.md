# Informe de QA — CooperApp

- **Fecha:** 16/09/2026
- **Sprints auditados:** **07 (Productos)** y **08 (Stock)**, que nunca habían pasado por QA.
  El 08 se había cerrado con auditoría de **UX**, que mira otra cosa.
- **Alcance:** todo lo implementado al 16/09 (CLAUDE.md sección 3), con foco en Stock —el
  módulo con más cálculo del sistema— y en la regresión de los informes anteriores
  (`informe-QA-sprint-06.md` y `informe-UX-2026-09-15.md`).

## Conteo de hallazgos

| Severidad | Cantidad |
|---|---|
| CRÍTICO | 2 |
| ALTO | 1 |
| MEDIO | 3 |
| BAJO | 2 |
| **Total** | **8** |

**Los 8 están confirmados ejecutándolos.** Ninguno es sospecha ni lectura de código.

## Nota de método

Base recreada desde cero con los dos `.sql` y **restaurada al terminar** (4 empresas, 28
usuarios, 25 movimientos, 18 productos, 18 movimientos de stock: idéntica al arranque).
No se tocó una línea de código ni de datos de prueba —verificado con `find -newermt`.

Se probó en los tres niveles: **base** (`mysql.exe`), **API** (`curl`, más un script de Node
para las pruebas de concurrencia) y **navegador** (los 4 roles, escritorio y 375 px).

> **Lo que hizo la diferencia en esta corrida fue el nivel de concurrencia.** Todo lo que se
> prueba de a un pedido por vez anduvo bien. Los dos hallazgos críticos aparecieron recién al
> mandar **dos pedidos al mismo tiempo**, que es lo que pasa cuando hay dos operadores en el
> depósito o dos pestañas abiertas. El prompt de QA ya pedía probar "dos pestañas haciendo
> cosas contradictorias"; conviene que eso deje de ser el último ítem de la lista.

---

## CRÍTICO

### C1 · Dos operadores vendiendo a la vez dejan el stock en negativo

**Qué pasa:** la regla "una salida no puede dejar el stock en negativo" se controla leyendo la
existencia y después insertando, sin transacción ni bloqueo. Si dos pedidos entran al mismo
tiempo, **los dos leen la misma existencia, los dos pasan el control y los dos guardan**.

**Reproducción (confirmada):** Jamón cocido tenía **9 kg**. Silvia y Jorge —dos operadores
reales de La Esperanza— registran una venta de **6 kg cada uno**, simultáneas:

```
[silvia] 201 {"existencia":-3,"message":"Movimiento registrado. Jamón cocido queda en -3."}
[jorge]  201 {"existencia":-3,"message":"Movimiento registrado. Jamón cocido queda en -3."}
```

```sql
SELECT COALESCE(SUM(CASE WHEN ms.anulado=1 THEN 0
                         WHEN mo.efecto_stock='entrada' THEN ms.cantidad
                         ELSE -ms.cantidad END),0)
FROM productos p
LEFT JOIN movimientos_stock ms ON ms.id_producto=p.id_producto
LEFT JOIN motivos_stock mo ON mo.id_motivo_stock=ms.id_motivo_stock
WHERE p.id_producto = <jamón>;
-- -3.00
```

En la pantalla de Stock el producto queda listado como **"-3 kg · Sin stock"**.

**Esperado:** el segundo pedido rebota con "No hay stock suficiente", como rebota cuando se
manda solo (eso sí funciona: probado, devuelve 400).
**Pasó:** los dos entran, el stock queda en −3 y **el propio mensaje de éxito anuncia el
número negativo** que el sistema dice que no puede existir.

**Por qué importa:** con 2 pedidos alcanza, y La Esperanza tiene 4 operadores y Metalúrgica 6,
todos cargando desde el celular. No hace falta nada raro: dos personas despachando el mismo
producto al mismo tiempo. Y el daño no se ve —nadie recibe un error—, así que el número queda
mal hasta que alguien cuente a mano. En un depósito un stock negativo no significa "falta
mercadería": significa que el sistema dejó de ser una fuente confiable.

**Estado:** confirmado ejecutándolo, con 2 pedidos y con 6 (con 6 quedó en −61).

---

### C2 · La misma venta se cobra seis veces: el vínculo anti-duplicado no aguanta dos pedidos juntos

**Qué pasa:** `POST /productos/stock/movimientos/:id/dinero` evita cargar dos veces el mismo
cobro mirando si el movimiento de stock ya tiene `id_movimiento`. Es la misma lectura-y-después-
escritura de C1: **con pedidos simultáneos todos ven el campo vacío y todos crean su propio
movimiento de dinero.**

**Reproducción (confirmada):** una venta de stock, seis pedidos simultáneos de `/dinero` de
$777 cada uno:

```
[0] 201 {"id_movimiento":28, ...}   [3] 201 {"id_movimiento":33, ...}
[1] 201 {"id_movimiento":29, ...}   [4] 201 {"id_movimiento":32, ...}
[2] 201 {"id_movimiento":30, ...}   [5] 201 {"id_movimiento":31, ...}
```

Los seis entraron. En la base:

```sql
SELECT COUNT(*), SUM(monto) FROM movimientos WHERE descripcion='RACE' AND anulado=0;
-- 6 | 4662.00

SELECT id_movimiento_stock, id_movimiento FROM movimientos_stock WHERE id_movimiento_stock=24;
-- 24 | 31        <-- sólo uno queda atado; los otros cinco quedan sueltos
```

Y los seis cuentan en el balance (`GET /movimientos/resumen` devolvió `total_ingresos`
inflado en los $4.662 completos).

**Esperado:** uno entra (201) y los demás reciben *"Ese movimiento de stock ya tiene su
movimiento de dinero registrado"* —que es exactamente lo que devuelve cuando los pedidos van
de a uno: probado, rebota bien.
**Pasó:** seis ingresos por la misma venta, **$4.662 de plata que no existe** sumando al
balance, y cinco de ellos **huérfanos**: no se llega a ellos desde el stock, así que el
historial muestra una sola venta con su "$ cargado" y nadie tiene por dónde descubrir el resto.

**Por qué importa:** el propio CLAUDE.md dice que ese vínculo "es lo único que impide cargar la
misma venta dos veces". No impide nada apenas hay dos pedidos juntos: dos pestañas del admin,
o el admin y el tesorero mirando la misma venta. Es plata inventada en el balance —lo más
grave que puede pasar en este sistema— y queda invisible, porque un movimiento suelto no se
distingue de uno cargado a mano.

> El botón de la pantalla sí se deshabilita al enviar, así que un doble clic **en la misma
> pestaña** está cubierto. Lo que no está cubierto es más de una pestaña, más de un dispositivo
> o más de una persona.

**Estado:** confirmado ejecutándolo.

**C1 y C2 son el mismo error escrito dos veces**, y el mismo que va a copiarse a Servicios:
consultar, decidir en JavaScript y recién después escribir. Conviene resolver los dos juntos
—una transacción que bloquee la fila, o dejar que la base imponga la regla— y dejar el patrón
anotado, porque el Sprint 09 arranca copiando de acá.

---

## ALTO

### A1 · Si se anula el movimiento de dinero, la venta queda sin cobro y el sistema dice que lo tiene

**Qué pasa:** el vínculo mira si existe `id_movimiento`, **no si ese movimiento sigue vivo**.
Anulado el movimiento de dinero (caso típico: se cargó el monto equivocado), el de stock queda
marcado como cobrado para siempre y **no hay forma de volver a registrarlo**.

**Reproducción (confirmada):**

```bash
# 1) venta de stock + su movimiento de dinero
POST /productos/stock/movimientos/69/dinero  {"monto":1234.567}  -> 201, id_movimiento 87

# 2) el tesorero se da cuenta del error y lo anula desde Movimientos
PUT /movimientos/87/anular                   -> {"message":"Movimiento anulado correctamente"}

# 3) quiere volver a cargarlo bien
POST /productos/stock/movimientos/69/dinero  {"monto":5000}
-> {"error":"Ese movimiento de stock ya tiene su movimiento de dinero registrado"}
```

```sql
SELECT ms.anulado AS stock, m.anulado AS dinero, m.monto
FROM movimientos_stock ms JOIN movimientos m ON m.id_movimiento=ms.id_movimiento
WHERE ms.id_movimiento_stock=69;
-- stock 0 | dinero 1 | 1234.57      <- la venta está viva, el cobro anulado
```

Y en el historial de Stock (`stock.html:558`) la marca se decide así:

```js
const marcaDinero = !mueveDinero ? ''
  : m.id_movimiento
    ? '... $ cargado'      // <- entra por acá aunque el movimiento esté anulado
    : '... Falta el $'
```

**Esperado:** anulado el dinero, la venta vuelve a figurar como **"Falta el $"** y se puede
cargar de nuevo.
**Pasó:** figura como **"$ cargado"** con el cobro anulado, y el camino de vuelta está cerrado.

**Por qué importa:** la marca "Falta el $" existe justamente para que un cobro no se olvide y
"después descuadre" —así está escrito en el código—. Acá la marca **miente**: dice que el
dinero está cargado cuando no está. El único arreglo posible es cargar el movimiento a mano
desde Movimientos, que queda suelto, sin vínculo y expuesto a C2. Equivocarse en el monto al
cargar una venta no es un caso raro: es el más común.

**Estado:** confirmado ejecutándolo.

---

## MEDIO

### M1 · Anular el único movimiento de un producto lo deja marcado "Sin stock" para siempre

**Qué pasa:** los cuatro estados de existencia distinguen *"Sin cargar"* (nunca tuvo
movimientos) de *"Sin stock"* (tuvo y quedó en cero). El contador que los separa **incluye los
movimientos anulados**, así que un producto al que se le cargó algo por error y se anuló deja
de ser "nuevo" aunque no le quede nada.

En `stock.model.js`:

```sql
COUNT(ms.id_movimiento_stock) AS cantidad_movimientos   -- cuenta también los anulados
```

El `SUMA_STOCK` de dos líneas más arriba sí los ignora.

**Reproducción (confirmada):** *Bolsa de pan*, 0 movimientos.

```
antes:    existencia 0 | movs 0 | estado "nuevo"   -> "Sin cargar" (gris)
cargo una entrada de 10 y la anulo
después:  existencia 0 | movs 1 | estado "sin"     -> "Sin stock" (rojo)
```

Y se propaga a los tres lugares que usan el criterio: el listado, el filtro *"Solo los que
faltan"* y el **dashboard**, donde el producto pasa a contar como "a reponer":

```
productos a reponer: Bolsa de pan, Fideos secos 500g, Milanesas de soja, Queso cremoso
                     ^^^^^^^^^^^^ no debería estar
```

**Esperado:** anular deja el producto **exactamente como estaba**. Ese es el argumento por el
que la existencia se calcula en vez de guardarse.
**Pasó:** la existencia sí vuelve a 0, pero el estado no vuelve: queda en alerta permanente.

**Por qué importa:** es el caso que motivó separar los cuatro estados —"sin esa distinción, una
empresa que recién carga su catálogo vería todo en rojo"—. Basta un movimiento mal cargado y
anulado para volver a ese ruido, sin forma de sacarlo. El arreglo es acotado: contar sólo los
no anulados, igual que hace la suma.

**Estado:** confirmado ejecutándolo.

### M2 · Reactivar una categoría revive las subcategorías (y los tipos) que el admin había dado de baja a propósito

**Qué pasa:** la baja y el alta en cascada van a todas las hijas sin distinguir por qué estaban
de baja. Si el admin desactivó una sola subcategoría a propósito, y más tarde desactiva y
reactiva la categoría entera, **esa subcategoría vuelve sola**.

**Reproducción (confirmada), en los DOS árboles:**

*Categorías de productos:*

```
1) baja sólo "Congelados"  -> Perecederos 1 | No perecederos 1 | Congelados 0
2) baja y alta de "Alimentos"
3) resultado               -> Perecederos 1 | No perecederos 1 | Congelados 1   <- volvió
```

*Categorías de movimientos (mismo bug, otra pantalla):*

```
1) baja sólo "Venta mayorista" -> Venta mayorista 0 | Venta minorista 1
2) baja y alta de "Ventas"
3) resultado                   -> Venta mayorista 1 | Venta minorista 1         <- volvió
```

**Esperado:** reactivar la categoría devuelve lo que la cascada bajó, no lo que el admin había
bajado por su cuenta.
**Pasó:** vuelve todo, y el sistema no avisa.

**Por qué importa:** una subcategoría o un tipo que se dieron de baja porque ya no se usan
reaparecen en los desplegables de alta sin que nadie los toque, y quien los ve ahí los vuelve a
usar. Es una configuración que se deshace sola. **Y es el caso de "mismo bug, otra pantalla"
que el prompt pide buscar**: está en los dos árboles, y el Sprint 09 va a escribir un tercero.

**Estado:** confirmado ejecutándolo, en los dos árboles.

### M3 · Los textos largos se guardan cortados, sin avisar: se crean cuentas a las que nadie puede entrar

**Qué pasa:** MariaDB de XAMPP corre **sin `STRICT_TRANS_TABLES`**:

```
@@sql_mode = NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION
```

Sin modo estricto, un texto más largo que su columna **se guarda cortado en vez de fallar**. El
registro de empresa (`register.controller.js`) valida formato, duplicados, CUIT, DNI y largo de
contraseña, pero **no valida el largo de ningún texto**.

**Reproducción (confirmada):** registro con un email de administrador de 246 caracteres.

```
-> {"message":"Registro enviado. Tu empresa está pendiente de aprobación"}
```

```sql
SELECT LENGTH(email), RIGHT(email,10) FROM usuarios WHERE email LIKE 'aaaa%';
-- 150 | aaaaaaaaaa      <- cortado a 150; se perdió el "@t.com"
```

**Esperado:** rechazarlo con un mensaje que diga qué acortar, como hacen Productos y Motivos
(que sí validan largo y devuelven "máximo 120 caracteres").
**Pasó:** la empresa queda creada, el usuario también, y **su email guardado no es el que
escribió ni siquiera es un email**: nunca va a poder iniciar sesión, y el CUIT y el email de la
empresa quedan ocupados. La misma puerta vale para nombre, apellido, nombre de empresa,
domicilio y federación.

**Por qué importa:** es el formulario público, el primer contacto con el producto, y falla en
silencio: el mensaje dice que salió bien. Vale para todo el grupo, porque todos corren el mismo
XAMPP. Se cierra de dos maneras y conviene hacer las dos: validar el largo en el controlador
(como ya se hace en Productos) y poner la base en modo estricto.

**Estado:** confirmado ejecutándolo y verificando los bytes en la tabla.

---

## BAJO

### B1 · Un JSON mal formado devuelve el stack trace completo, con las rutas del disco

**Qué pasa:** no hay manejador de errores propio, así que responde el de Express por defecto.

**Reproducción (confirmada), sin sesión, contra el registro público:**

```bash
curl -X POST -H "Content-Type: application/json" -d '{"roto":' http://localhost:3000/users/register
```

```html
<pre>SyntaxError: Unexpected end of JSON input<br>    at JSON.parse (&lt;anonymous&gt;)<br>
   at parse (C:\Users\edeli\Desktop\Personal\Tecnicatura Sup. en Desarrollo de Software\2\pp2\
   cooperApp\node_modules\body-parser\lib\types\json.js:72:19)<br> ...
```

**Esperado:** `{"error":"..."}`, que es el contrato que declara el proyecto ("la API devuelve
JSON").
**Pasó:** HTML con la ruta absoluta del disco, la estructura de carpetas y las versiones de las
librerías. Además rompe el contrato: el front hace `res.json()` sobre eso y revienta.

**Por qué importa:** local el riesgo es acotado, y por eso es BAJO. Pero son cuatro líneas
(`app.use((err, req, res, next) => ...)` al final de `app.js`), aplica a **todos** los endpoints
de una sola vez, y evita que cada módulo nuevo lo herede.

**Estado:** confirmado ejecutándolo, con y sin sesión.

### B2 · Un stock mínimo de 0,001 se guarda como 0, que significa lo contrario

**Qué pasa:** `limpiarStockMinimo` redondea a 2 decimales y acepta todo lo que no sea negativo.
0,001 redondea a **0**, y 0 significa *"no me avises"*.

**Reproducción (confirmada):**

```bash
POST /productos  {"nombre":"QA min","unidad_medida":"kg","stock_minimo":0.001}
-> {"id_producto":38,"message":"Producto creado correctamente"}
```

```sql
SELECT nombre, stock_minimo FROM productos WHERE nombre='QA min';
-- QA min | 0.00
```

**Esperado:** o se rechaza (como hace el monto de un movimiento, que con 0,001 devuelve "tiene
que ser mayor que cero"), o se avisa que quedó en 0.
**Pasó:** se acepta en silencio y el producto queda **sin aviso de reposición**, que es lo
opuesto de lo que la persona quiso.

**Por qué importa:** improbable de tipear, y el valor termina siendo el de arranque, por eso es
BAJO. Se anota porque es la misma familia del bug del monto en 0 que ya mordió al proyecto, y
porque los dos controladores resuelven el mismo caso de forma distinta.

**Estado:** confirmado ejecutándolo.

---

## Regresión de los informes anteriores

Se reprodujo el caso original de cada hallazgo marcado como corregido. **Todos siguen
corregidos**, y —lo más importante— **se buscó el mismo patrón en las pantallas que se sumaron
después**.

| Hallazgo | Original | Hoy |
|---|---|---|
| **C1** XSS almacenado anónimo (superadmin) | Sprint 06 | **Sigue cerrado.** Empresa registrada con `<img onerror>` en nombre, domicilio y federación: en el navegador, **0 elementos inyectados** en los tres vectores (pendientes, "todas" y modal de detalle); el payload se ve como texto |
| **A1** `GET /users` sin control de rol | Sprint 06 | **Sigue cerrado.** Operador → 403 |
| **A2** cuenta con contraseña temporal opera por API | Sprint 06 | **Sigue cerrado.** Claudia loguea pero `/productos` → 403 con `debe_cambiar_password` |
| **A3** registro no atómico | Sprint 06 | **Sigue cerrado.** Un alta que falla por DNI inválido no deja empresa huérfana (0 filas) |
| **M2** XSS en listado de usuarios | Sprint 06 | **Sigue cerrado** |
| **M3** rechazar irreversible | Sprint 06 | **Sigue cerrado.** Rechazar → `suspendida`, el admin no entra, y volver a aprobar la reactiva |
| **M4** email sin validar al crear usuario | Sprint 06 | **Sigue cerrado** |
| **B2** `monto: true` | Sprint 06 | **Sigue cerrado** |
| Sesiones vivas tras la baja | Sprint 06 (subido) | **Sigue cerrado.** Usuario dado de baja y empresa suspendida cortan la sesión en el pedido siguiente |
| **H-02** superadmin en un tablero ajeno | UX | **Corregido.** Entra directo a `superadmin.html`; "Empresas" está oculto para `admin_empresa` |
| Domicilio/federación vacíos en el detalle | UX | **Corregido.** Los dos llegan al modal |

**Búsqueda del patrón en las pantallas nuevas (lo que en el Sprint 06 se había escapado):** se
inyectó `<img src=x onerror=...>` en nombre de categoría de producto, nombre y descripción de
producto, nombre de motivo, descripción de movimiento de stock y nombre de usuario, y se
abrieron las pantallas en el navegador contando elementos inyectados:

```
productos               0    categorias-producto   0    dashboard   0
stock (existencias)     0    motivos               0    usuarios    0
stock (historial)       0
```

**Cero en las siete.** Los toasts también escapan (`esc(mensaje)`), que es el vector nuevo —los
mensajes del servidor traen el nombre del producto adentro—. Esta vez el patrón se aplicó
completo, no sólo donde se lo había visto.

---

## Lo que quedó bien probado (y aguantó)

**Aislamiento entre empresas — 20 intentos con ids ajenos, los 20 rebotan.** Producto, motivo,
movimiento de stock, categoría y subcategoría de producto, tipo de movimiento y movimiento de
dinero de otra empresa: `404` / `[]`, y nada quedó tocado en la base. Es sólido.

**Permisos por rol.** Tesorero fuera del stock y del catálogo (403), operador fuera de finanzas
(403 al pedir el movimiento de dinero armándolo a mano), operador fuera de módulos y de motivos,
`admin_empresa` no puede aprobar empresas, escalada de `id_rol` bloqueada, sin sesión todo 401.

**Módulos del lado del servidor.** Con `productos` apagado, las **6 rutas** del módulo dan 403
(GET y POST), la otra empresa sigue entrando normal, y `movimientos` no se deja apagar.

**Validaciones de stock, de a un pedido por vez.** Salida mayor al stock rebota; salida exacta
entra; anular una entrada que dejaría negativo rebota con el mensaje que explica qué hacer;
anular dos veces rebota; motivo `entrada+ingreso` y `salida+egreso` rechazados; cambiar el
efecto de un motivo ya usado rechazado (dice cuántos movimientos tiene); producto y motivo de
baja rechazados; cantidad 0,001 y negativa rechazadas.

**El cálculo de existencias coincide exacto con la base**, producto por producto, comparado
contra un `SELECT` escrito a mano. Y `/movimientos/resumen` coincide al peso antes y después de
anular (873.000 → 523.000, igual que la suma real).

**Cascada del árbol de productos**, salvo M2: al bajar la categoría se van las subcategorías, al
reactivarla vuelven, no se puede activar una subcategoría dentro de una categoría de baja, una
subcategoría creada ahí nace inactiva y avisa, y no se puede clasificar un producto nuevo en una
categoría desactivada.

**Fechas — verificadas en la tabla, nunca en la pantalla.** 29/02/2024 entra, 29/02/2025
rechazada, 31/09 rechazada, mes 13 rechazado, futuro rechazado, anterior a 2000 rechazada,
formato `dd/mm/aaaa` rechazado. Lo que se guardó es exactamente lo que se mandó. El movimiento
de dinero que sale de una venta **hereda la fecha correcta** (probado con 01/03/2024, que es el
caso que antes daba `0000-00-00`): `aFechaISO` hace su trabajo.

**Búsqueda y filtros.** `%` y `_` van escapados: buscar "%" devuelve 0 productos, no los 10.
Unidad de medida inventada rechazada. Los filtros por categoría, subcategoría y estado responden
bien, y el filtro no deja ver productos de otra empresa.

**Acentos y símbolos.** `Ñandú € ½ señal áéíóú` guarda y vuelve idéntico, verificado en bytes
(`C391` Ñ, `E282AC` €, `C2BD` ½).

**Flujo completo de alta.** Registro → aprobación → siembra (6 categorías, 15 tipos, 7 motivos,
5 módulos) → el admin entra. **Aprobar dos veces no duplica nada.** Rechazar y volver a aprobar
tampoco.

**Navegador:** las 7 pantallas cargan **sin un solo error de consola**, en escritorio y en 375 px.

---

## Lo que NO se llegó a cubrir (honestidad)

- **Concurrencia más allá de los dos casos de C1 y C2.** Quedaron sin probar de a dos: anular y
  registrar sobre el mismo movimiento, aprobar la misma empresa desde dos sesiones, y editar el
  mismo producto desde dos pestañas. Dado que los dos que sí probé fallaron, **conviene asumir
  que el patrón se repite** donde haya consulta-decisión-escritura.
- **Volumen.** No se probó con miles de movimientos. `findExistencias` hace `LEFT JOIN` a todo
  el historial de stock y agrupa: es el candidato natural a ponerse lento primero.
- **Corte de la base en medio de un guardado.** No se simuló bajar MariaDB durante un `INSERT`.
- **Navegadores.** Sólo el navegador integrado. La DOD pide dos.
- **Reportes, Servicios y Articulación:** no implementados, nada que probar.

---

## Prioridad sugerida

1. **C1 y C2 juntos** — son el mismo error y el Sprint 09 lo va a copiar. Decidir el patrón
   (transacción con bloqueo de fila, o dejar que la base imponga la regla con una restricción) y
   dejarlo escrito antes de empezar Servicios.
2. **A1** — un cambio chico: mirar si el movimiento de dinero está anulado, en el `if` del
   controlador y en la marca del historial.
3. **M1** — una palabra en el `COUNT`.
4. **M2** — está en los dos árboles; arreglar los dos, o el tercero nace con el bug.
5. **M3, B1, B2** — acotados, y B1 aplica a toda la API de una sola vez.

## De paso (usabilidad, no es el foco de este informe)

- Cuando el stock queda en negativo, la pantalla muestra **"-3 kg · Sin stock"**: el número
  contradice al rótulo y no hay nada que le diga a la persona cómo volver a cero.

---

# Resultado de las correcciones (16/09/2026)

**Los 8 hallazgos corregidos**, ninguno al backlog. Se sumaron 2 que aparecieron al corregir.

## CRÍTICOS · C1 y C2 se arreglaron juntos, porque eran el mismo error

El informe lo dijo bien: *consultar, decidir en JavaScript y recién después escribir*. Entre la
consulta y la escritura se mete el otro pedido. Es un error de **patrón**, no de línea, así que
la corrección también es de patrón.

**El candado ahora es la fila del producto.** En `stock.model.js` hay una sola función,
`conProductoTrabado(producto, empresa, decidir)`, que abre una transacción, hace
`SELECT ... FOR UPDATE` sobre la fila del producto, cuenta la existencia **adentro** del candado
y recién ahí deja decidir. Todo lo que puede mover el stock de un producto pasa por ahí: el alta
de movimientos y la anulación. El segundo pedido no lee un número viejo: espera a que el primero
termine.

La regla de negocio la sigue escribiendo el controlador (le pasa la función `decidir`), así el
modelo se queda con el SQL, como en el resto del proyecto.

**Para C2, el mismo criterio sobre el movimiento de stock**: `registrarDineroDeMovimiento` abre
la transacción, traba la fila con `FOR UPDATE`, mira si ya tiene cobro, y crea el movimiento de
dinero y el vínculo **adentro de la misma transacción**. `movimientoModel.create` ahora acepta
una conexión para poder participar de ella.

**Probado con la misma reproducción del informe:**

```
C1 · Jamón cocido, 9 kg. Silvia y Jorge venden 6 kg cada uno, simultáneos:
  [silvia] 400 No hay stock suficiente: hay 3 y estás sacando 6...
  [jorge]  201 Movimiento registrado. Jamón cocido queda en 3.
  existencia real en la base: 3.00           (antes: -3.00)

C1 · 6 pedidos de 1 kg sobre 3 disponibles:
  entran exactamente 3, rebotan 3, existencia real: 0.00     (antes: -61)

C2 · 6 pedidos de /dinero simultáneos sobre la misma venta:
  [0] 201 · los otros cinco: 400 "ya tiene su movimiento de dinero registrado"
  movimientos de dinero en la base: 1 por $777      (antes: 6 por $4.662)
```

## ALTO · A1 · la marca dejó de mentir

El control miraba si **existía** un `id_movimiento`, no si ese movimiento seguía vivo. Ahora las
dos consultas del modelo traen `m.anulado AS dinero_anulado` con un `LEFT JOIN`, y eso se usa en
cuatro lugares: la condición que deja cargar el dinero, la marca del historial, el botón "$" de
la fila y el aviso del modal de anulación.

Una venta cuyo cobro se anuló vuelve a figurar **"Falta el $"**, con su botón para cargarlo de
nuevo. Verificado por API y en el navegador: la fila del 16/09 pasó de *"$ cargado"* (verde) a
*"Falta el $"* (naranja) con el botón otra vez disponible, y el segundo cobro quedó bien
vinculado ($5.000; el anulado de $1.234,57 quedó anulado y sin vínculo, que es lo correcto).

## MEDIOS

**M1 · una palabra en el `COUNT`, como decía el informe.** Pasó a
`SUM(CASE WHEN ms.id_movimiento_stock IS NOT NULL AND ms.anulado = 0 THEN 1 ELSE 0 END)`, el
mismo criterio que ya usaba `SUMA_STOCK` dos líneas más arriba.

```
Bolsa de pan:  estado inicial        -> "Sin cargar"
  entrada de 10 cargada              -> "Sin stock"   (tiene movimientos)
  esa entrada anulada                -> "Sin cargar"  (antes quedaba "Sin stock" para siempre)
```

**M2 · la cascada ahora distingue POR QUÉ una hija está de baja.** No se puede resolver sin
guardar ese dato, así que hay una columna nueva —`baja_en_cascada`— en `tipos_movimiento` y en
`subcategorias_producto`:

- al **bajar** la categoría se marcan sólo las hijas que estaban activas (las que ya estaban de
  baja quedan con la marca en 0);
- al **reactivarla** vuelven sólo las que tienen la marca en 1;
- al bajar o subir una hija **por su cuenta**, la marca vuelve a 0: es una decisión del
  administrador y la cascada no la deshace.

Arreglado en **los dos árboles a la vez**, que es lo que el informe pedía. Verificado en los dos:

```
Productos:    baja sólo "Congelados"      -> baja y alta de "Alimentos" -> Congelados sigue en 0
Movimientos:  baja sólo "Venta mayorista" -> baja y alta de "Ventas"    -> sigue en 0
```

**M3 · se cerró de las dos maneras**, como recomendaba el informe.

1. **La app pide modo estricto al conectarse** (`src/config/db.js`, evento `connection` del
   pool). Se hace por conexión y no editando el `my.ini` de XAMPP a propósito: así vale para
   todo el grupo sin que nadie configure nada en su máquina. Verificado:
   `sql_mode = IGNORE_SPACE,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,...`
2. **Se valida el largo antes**, en `src/services/validacion.service.js`, con la lista de largos
   de cada columna. Va en el registro público, en el alta y la edición de usuarios y en el perfil
   de la empresa. El control va igual que el modo estricto porque cambian el síntoma: sin él la
   base tiraría un error y la persona vería "Error del servidor" en vez de saber qué acortar.

```
email de 246 caracteres  -> "El email es demasiado largo: máximo 150 caracteres"
nombre de empresa de 150 -> "El nombre de la empresa es demasiado largo: máximo 100 caracteres"
empresas basura creadas: 0 · usuarios con el email cortado: 0
```

## BAJOS

**B1 · manejador de errores al final de `app.js`**, como sugería el informe. Distingue el cuerpo
mal formado (400, es culpa del pedido) del error real del servidor (500), y siempre devuelve
JSON. Aplica a todos los endpoints de una vez.

```
un JSON cortado  ->  {"error":"El pedido no tiene un formato válido"}
                     (antes: el stack trace completo, en HTML, con las rutas del disco)
```

**B2 · el stock mínimo que redondea a 0 se rechaza.** El 0 es delicado porque significa lo
contrario que un número chico ("no me avises"), así que aceptar 0,001 en silencio dejaba al
producto sin aviso, lo opuesto de lo que la persona quiso. El mensaje ofrece las dos salidas:
*"usá al menos 0,01, o dejalo en 0 para no recibir avisos"*. El 0 sigue valiendo.

## Encontrado al corregir (no estaba en el informe)

El informe avisó que **conviene asumir que el patrón se repite donde haya
consulta-decisión-escritura**. Se probaron los tres casos que habían quedado pendientes:

1. **Anular el mismo movimiento dos veces a la vez**: las dos respondían *"Movimiento anulado"*,
   como si cada una hubiera hecho el trabajo. No corrompe nada (`anulado = 1` es idempotente),
   pero el mensaje miente. El control pasó a hacerse **adentro del candado**: ahora una anula y
   la otra dice *"Ese movimiento ya estaba anulado"*.
2. **Dos altas de usuario con el mismo email a la vez**: una entraba y la otra moría con un
   **500 "Error al crear usuario"**. La restricción `UNIQUE` de la base es la que decide de
   verdad; faltaba contarlo bien. Nueva función `mensajeDeDuplicado()` que traduce el
   `ER_DUP_ENTRY` al mensaje que corresponde, usada en el alta de usuarios y en el registro
   público. Ahora la segunda devuelve **400 "Ya existe un usuario con ese email"**.
3. **Aprobar la misma empresa dos veces**: sigue siendo idempotente (6 categorías, 15 tipos,
   7 motivos, 5 módulos, sin duplicar).

## De paso (el punto de usabilidad del final del informe)

El *"-3 kg · Sin stock"* que contradecía al rótulo **ya no se puede producir**: con C1 corregido,
el stock no llega a negativo por ningún camino.

## Regresión posterior a las correcciones

Base recreada desde cero, re-ejecutable, y verificada en los tres niveles:

- **Permisos**: 10 controles de rol, los 10 como corresponde. **Aislamiento**: 5 intentos con
  ids de otra empresa, los 5 rebotan con 404.
- **Validaciones que ya andaban** (el riesgo del modo estricto era romper algo que antes pasaba
  en silencio): salida mayor al stock, cantidad 0,001, 29/02/2025, fecha futura, motivo
  entrada+ingreso, escalada de rol, `%` en la búsqueda, unidad inventada. Las 8 siguen bien.
- **Acentos y símbolos con modo estricto**: `Cámara Ñandú €½` guardado y leído idéntico,
  verificado en bytes (`C3A1`, `C391`, `E282AC`, `C2BD`).
- **Totales**: `/movimientos/resumen` coincide al peso con la suma hecha a mano en SQL.
- **Flujo completo**: registro → aprobación → siembra → el admin nuevo carga su primer
  movimiento. Aprobar dos veces no duplica nada.
- **Navegador**: las 7 pantallas cargan **sin un solo error de consola** y todos los pedidos
  dan 200.

**Ojo al actualizar**: hay **una columna nueva en dos tablas** (`baja_en_cascada`), así que
**todo el grupo tiene que recrear la base**.
