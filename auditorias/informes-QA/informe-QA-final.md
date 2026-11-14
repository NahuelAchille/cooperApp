# Informe de QA — CooperApp · auditoría final (HU-67)

- **Fecha:** 14/11/2026
- **Qué se auditó:** el sistema completo, en `master` hasta el commit `ebc7663`, con foco en lo
  que entró desde la auditoría de la venta y la compra (02/11) y nunca pasó por QA:
  - **Articulación**: buscador, ficha, mapa, "Mostrar a otras empresas", contactos que decide
    el servidor, `/rubros` y `/localidades`.
  - **La pantalla del superadmin rehecha** (`superadmin.html`): pestañas *Para aprobar* /
    *Todas*, aprobar, rechazar, habilitar de nuevo, resetear contraseña.
  - **Lo que se sacó**: trabajadores por género, `sector`, `tipos_empresa`,
    `registerCoop.html` y `registerUser.html`.
  - **HU-88**: listados vacíos y *Primeros pasos* en el panel de inicio.
  - **HU-87**: el desplegable único de tipo (`GET /categorias/tipos`), *Anular y corregir* y
    *Cargar de nuevo*.
  - **`node_modules` fuera de git**: se instaló con `npm install` antes de levantar la app.
- **Más:** la regresión contra los cuatro informes anteriores de QA.

## Conteo de hallazgos

| Severidad | Cantidad |
|---|---|
| CRÍTICO | 1 |
| ALTO | 1 |
| MEDIO | 1 |
| BAJO | 3 |
| **Total** | **6** |

**Los 6 están confirmados ejecutándolos.** Ninguno es sospecha ni lectura de código.

En resumen: **lo nuevo de Articulación y del superadmin aguantó todo lo que se le tiró**. No
sale nada privado hacia otra empresa, cada condición de "quién aparece" esconde de verdad, los
contactos los recorta el servidor y el XSS no entra en ninguna de las pantallas nuevas. **Los
dos hallazgos que importan están en otra parte**:

- **El crítico (C1) sale de HU-87.** *Anular y corregir* vuelve a cargar la plata de una venta
  **sin atarla a la venta**. Es el mismo tipo de problema que el C1 del 02/11: la plata y la
  mercadería dejan de moverse juntas.
- **El alto (A1) es viejo y nunca se había visto.** El registro rebota con *"Error del
  servidor"* si el CUIT se escribe con guiones, que es como lo escribe todo el mundo.

## Nota de método

**El entorno:**
- MariaDB de XAMPP. La base se recreó desde los dos `.sql` antes de empezar.
- Se corrió `npm install` (instaló 108 paquetes, avisó por `bcrypt` y no pasó nada).
- La app se levantó con `PORT=3010 node app.js`. **En el 3000 ya había otra copia
  corriendo**, que no es de esta auditoría, y no se tocó.
- Al terminar se mató sólo el proceso del 3010 (por PID, verificado con `netstat`).

**Cómo se dejó todo:**
- La base quedó **recreada limpia**: 5 empresas, 29 usuarios, 28 movimientos, 24 movimientos
  de stock, 28 productos y 25 motivos.
- **No se tocó código, SQL, pantallas ni datos de prueba.** Lo único escrito es este informe y
  la fila del registro en `prompt-testeo-QA.md`.
- `npm install` dejó `package-lock.json` marcado como modificado, sólo por los finales de
  línea. Se restauró con `git checkout`. Ver *Observaciones*.

**Tres niveles:**
- **Base** (`mysql.exe`).
- **API**: scripts de Node con `fetch`, logueados con cada rol, y `Promise.all` para la
  concurrencia.
- **Navegador**: el integrado. Admin, superadmin y una empresa recién aprobada, en escritorio
  y en 375 px. Se contaron por script los elementos inyectados y la consola.

---

## CRÍTICO

### C1 · "Anular y corregir" sobre la plata de una venta la vuelve a cargar suelta, y la misma venta termina cobrada dos veces

**Qué pasa:** HU-87 le puso *Anular y corregir* a todo movimiento de Movimientos, y *Cargar de
nuevo* a todo movimiento anulado. **También a los ingresos y egresos que nacieron de una venta
o de una compra.** Pasa esto:

1. El movimiento original se anula, pero la venta sigue viva en Stock. Eso es lo decidido:
   anular la plata no anula el stock.
2. La copia se guarda por `POST /movimientos`, como un ingreso común, **sin atarse a la
   venta** (`movimientos_stock.id_movimiento` sigue apuntando al anulado).
3. En el historial de Stock la venta pasa a decir **"Sin registrar el cobro"**, aunque el cobro
   existe.
4. Si el admin hace lo que esa marca le pide (registrar el cobro desde el historial), **la
   misma venta queda con dos ingresos vivos**.

**Reproducción (confirmada en los tres niveles):** Marta (admin de La Esperanza), sobre la plata
de una venta de 2 kg de Jamón que cargó Silvia por $ 34.000:

```
movimientos.html → anular "Venta: 2 kg de Jamón cocido · QA carrera 3" → "Anular y corregir"
   el formulario se abre con Entró · Ventas › Venta minorista · $ 34000 · 13/11/2026
   y la descripción de la venta. Se corrige el monto a 30000 → Registrar
POST /productos/stock/movimientos/28/dinero  { id_tipo: Venta minorista, monto: 30000 }
   (lo que ofrece la marca "Sin registrar el cobro")       -> 201
```

En la tabla:

```
movimientos
id   monto      anulado  descripcion
34   34000.00   1        Venta: 2 kg de Jamón cocido · QA carrera 3   <- el original
52   30000.00   0        Venta: 2 kg de Jamón cocido · QA carrera 3   <- la copia, suelta
53   30000.00   0        NULL                                          <- el cobro desde Stock

movimientos_stock
id   anulado  id_movimiento
28   0        53            (antes del último paso: 34, el anulado)
```

**Una venta de 2 kg suma $ 60.000 en el balance.** Y el problema empieza antes del segundo paso.
Con sólo *Anular y corregir*:
- el agrupado **por categoría** de Reportes cuenta la copia;
- el agrupado **por producto** no la cuenta, y dice *"movimientos sin la plata registrada"*.

Los dos reportes cuentan cosas distintas de la misma venta, y la pantalla de Stock dice que
falta un cobro que ya está.

**Lo mismo pasa con *Cargar de nuevo*** sobre la plata anulada de una venta (es la misma
función, `abrirCopia`), y con el egreso de una compra.

**Qué no avisa nada:**
- El cartel de anular no dice que ese movimiento viene de una venta.
- El formulario de la copia muestra *"¿Vendiste mercadería? Cargala desde Registrar una
  venta"*, que en este contexto empuja a cargarla otra vez.

**Esperado:** que corregir la plata de una venta no la separe de la venta.
**Pasó:** la copia nace huérfana y el sistema invita a cargar el cobro de nuevo.

**Por qué es CRÍTICO:** es plata contada dos veces, en silencio, por un camino que el sistema
ofrece en cada fila. Corregir un precio mal tipeado de una venta es el uso más común de
*Anular y corregir*. Que el stock siga vivo al anular la plata **está decidido** (02/11). Esto
es una forma nueva de explotar esa decisión, que el prompt pide reportar: antes, la única
manera de volver a cargar esa plata era desde el historial de Stock, que la ata a la venta.

**Cómo se resuelve es decisión del grupo.** Algunas opciones:
- no ofrecer *Anular y corregir* ni *Cargar de nuevo* en la plata que tiene una venta o una
  compra detrás, y mandar a corregirla desde Stock;
- que la copia se ate a la misma venta;
- que el cartel lo avise.

**Estado:** confirmado en el navegador (el circuito entero desde la pantalla), por API y en la
tabla.

---

## ALTO

### A1 · El registro rebota con "Error del servidor" si el CUIT se escribe con guiones o espacios

**Qué pasa:** `register.controller.js` valida el CUIT **sacándole guiones y espacios**
(`String(empresa_cuit).replace(/[-\s]/g, '')`), así que `30-71555666-1` pasa la validación.
Pero después **usa el valor original** para buscar el duplicado y para el `INSERT`, y la
columna `empresas.cuit` es `BIGINT`. En modo estricto el `INSERT` rebota y la persona recibe
*"Error del servidor"*. No se marca ningún campo y no se dice qué cambiar.

**Reproducción (confirmada en el navegador y por API):**

```
formulario de registro de login.html, CUIT "30-71555666-1", todo lo demás bien
   -> "Error del servidor" adentro del cartel, ningún campo marcado
POST /users/register  empresa_cuit "30-70000001-1"   -> 500 "Error del servidor"
                      empresa_cuit "30 70000002 2"   -> 500
                      empresa_cuit "30-67788990-0"   -> 500   (el CUIT de Huerta Norte:
                                                               ni siquiera dice que ya existe)
                      empresa_cuit "30677889900"     -> 400 "Ya existe una empresa con ese CUIT"
```

**Lo bueno:** la transacción del registro (A3 del Sprint 06) funciona. Con el 500 no queda ni
la empresa ni el usuario, y el email no queda tomado. Verificado en la tabla.

**Esperado:** que guarde el CUIT limpio, ya que la validación lo acepta así.
**Pasó:** el registro no se puede completar con el formato en que se escribe un CUIT
(XX-XXXXXXXX-X, el de la constancia de AFIP), y el mensaje no da ninguna pista.

**Por qué es ALTO:** es la puerta de entrada del producto, la usa gente que no es de sistemas,
y falla con el formato más común del dato. El ejemplo del campo (`20123456789`) es la única
pista, y no alcanza: nadie relaciona *"Error del servidor"* con los guiones.

---

## MEDIO

### M1 · El DNI con puntos se guarda con puntos: el duplicado no se detecta y la contraseña temporal queda con puntos

**Qué pasa:** es el mismo patrón que A1. El DNI se valida sin puntos ni espacios
(`replace(/[.\s]/g, '')`) y se guarda **tal cual**, en el registro y en el alta de usuarios.

**Reproducción (confirmada por API y en la tabla):**

```
POST /users  dni "41111111"     -> 201 "Contraseña temporal: 41111111"
POST /users  dni "41.111.111"   -> 201 "Contraseña temporal: 41.111.111"   (otro email)
POST /users  dni "41 111 111"   -> 201 "Contraseña temporal: 41 111 111"
POST /users/register  dni "40.000.003"  -> 201, en la tabla queda "40.000.003"
```

Quedan **tres usuarios con el mismo DNI**, aunque el sistema dice que el DNI es único (*"Ya
existe un usuario con ese DNI"*).

**Esperado:** el DNI guardado sin separadores, y el duplicado detectado.
**Pasó:**
- El control de duplicados se saltea con un punto.
- La contraseña temporal pasa a ser el DNI **con puntos**. *"Tu contraseña es tu DNI"* (la
  razón por la que se eligió, ver HU-80) deja de ser cierto si la persona lo escribe sin
  puntos.
- El reseteo vuelve a poner el DNI con los puntos, así que la próxima vez pasa lo mismo.

**Por qué es MEDIO:** no rompe nada por sí solo. Pero deja gente sin poder entrar con la regla
que se le explicó, y es justo el público que no va a probar *"a ver si era con puntos"*.

---

## BAJO

### B1 · Aprobar o rechazar una empresa que no existe contesta "Empresa aprobada correctamente"

**Reproducción (confirmada):** como superadmin, `PUT /empresas/9999/aprobar`, `/abc/aprobar`,
`/-1/aprobar` y `/0/aprobar` → **200 "Empresa aprobada correctamente"**. Con `rechazar` pasa lo
mismo: *"Empresa rechazada"*.

Por dentro, `prepararEmpresaNueva` intenta crear módulos y categorías para una empresa que no
existe. La clave foránea lo frena y el error queda en la consola. En `empresa_modulos` no queda
ninguna fila de una empresa inexistente (verificado).

**Por qué es BAJO:** la pantalla nunca manda un id que no esté en la lista. Va porque es un
mensaje que miente sobre lo que pasó, y porque el superadmin es el rol con más poder.

### B2 · "Primeros pasos" vuelve a aparecer, y Movimientos dice "Todavía no cargaste ningún movimiento", si el único movimiento se anuló

**Qué pasa:** el cuadro dice *"Este cuadro desaparece cuando cargues tu primer movimiento"*, y
según `CLAUDE.md` desaparece *"para siempre"*. Pero `cargarPrimerosPasos` pregunta
`/movimientos?limit=1`, que **no trae los anulados**.

**Reproducción (confirmada en el navegador):** QA Empresa 4, recién aprobada:
1. Cargar un ingreso: el cuadro desaparece.
2. Anularlo y recargar el panel: **el cuadro vuelve**.
3. En Movimientos, el listado vacío dice *"Todavía no cargaste ningún movimiento"*, con uno
   cargado y anulado.

**Por qué es BAJO:** no toca datos, y para quien anuló su único movimiento la ayuda no estorba.
Va porque el mensaje del listado dice algo que no es cierto.

### B3 · "Un campo que no viene no se toca" vale sólo para lo nuevo: editar sin la descripción o sin el domicilio los borra, y un nombre numérico da 500

**Qué pasa:** la regla se aplicó a los campos de Articulación (`visible_empresas`, `id_rubro`,
`telefono`, `id_localidad`, las casillas), y esos sí se conservan (verificado). **Los campos
de antes no la siguen**, y dos de ellos ahora se muestran a otras empresas.

**Reproducción (confirmada por API y en la tabla):**

```
PUT /productos/:id   sin "descripcion"           -> 200, descripcion queda NULL
PUT /empresas/mi-empresa  sin "domicilio"        -> 200, domicilio queda NULL
PUT /empresas/mi-empresa  telefono: 1146273345   -> 200, el teléfono queda NULL
                                                    (un número en vez de texto: se borra
                                                     sin aviso)
PUT /empresas/mi-empresa  nombre: 123            -> 500 "Error al actualizar los datos..."
                          federacion: 123        -> 500
                          domicilio: ["x"]       -> 500
```

**Por qué es BAJO:** la pantalla manda siempre todos los campos y siempre como texto. Sólo se
llega armando el pedido a mano. Va porque la descripción y el domicilio son ahora lo que otra
empresa lee en la ficha, y porque la regla que el proyecto se puso queda a medias.

---

## Regresión de los informes anteriores

Se reprodujo el caso original de cada hallazgo corregido que se pudo reproducir. **Todos los
que se probaron siguen corregidos.**

| Hallazgo | Origen | Hoy |
|---|---|---|
| **C1** XSS almacenado en el panel del superadmin | QA 06 | **Cerrado, también en la pantalla rehecha.** Una empresa registrada con `<img onerror>` en el nombre, el domicilio, la federación y el nombre y apellido del admin: **0 inyectados** en *Para aprobar*, *Todas*, el detalle, el cartel de resetear y el aviso de "quedó aprobada" |
| **A1** `GET /users` sin rol | QA 06 | **Cerrado.** 403 para operador y tesorero |
| **A2** el cambio de contraseña obligatorio | QA 06 | **Cerrado, también en las rutas nuevas.** Claudia (contraseña temporal) recibe 403 en `/articulacion/buscar`, `/rubros`, `/modulos`, `/categorias/tipos`, `/empresas/mi-empresa` y `/productos` |
| **A3** el registro no atómico | QA 06 | **Cerrado.** Los registros que rebotan con 500 (A1 de este informe) no dejan empresa ni usuario. 4 registros iguales a la vez: 1 × 201, 3 × *"Ya existe una cuenta con ese email"*, 1 fila |
| **M3** rechazar sin confirmar y sin vuelta atrás | QA 06 | **Cerrado.** Rechazar pide confirmación y explica que se puede volver a habilitar; *Todas* muestra *Rechazada* con *Habilitar de nuevo* |
| **B2** `monto: true` · sesión viva tras la baja · empresa suspendida | QA 06 | **Cerrados.** `true` rebota. Jorge, dado de baja con la sesión abierta, recibe 401 en el buscador. Norma, con su empresa recién rechazada, recibe 403 *"Tu empresa no está activa"* y no puede volver a entrar |
| **B1** cookie sin `SameSite` | QA 06 | **Cerrado** (`sameSite: 'lax'`) |
| **C1** dos ventas a la vez dejan el stock en negativo | QA 07-08 | **Cerrado.** 8 ventas de 2 kg sobre 9 kg de Jamón: entran 4, rebotan 4, queda **1,00**. 6 ventas de 1,5 sobre 5,5 de Queso: entran 3, queda **1,00**. **0 productos en negativo** |
| **C2** el mismo cobro varias veces | QA 07-08 | **Cerrado.** 6 pedidos de dinero sobre la misma venta vieja: 1 × 201, 5 × 400, **1 movimiento** en la tabla |
| **B1** JSON roto · **B2** stock mínimo 0,001 | QA 07-08 | **Cerrados** |
| **M2** Bolsa de pan en −4 | QA 09-10 | **Cerrado** (arranca en 6) |
| **A1/M1** CSV con los totales y las fórmulas | QA 09-10 | **Cerrados.** El CSV trae *"Entró en el período"* / *"Salió en el período"*, y `=1+1`, `+HYPERLINK(...)`, `-1` y `@SUM(A1)` salen con apóstrofe |
| **B1** anular el mismo dinero a la vez | QA 09-10 | **Cerrado.** 3 a la vez: 1 × 200, 2 × *"ya estaba anulado"* |
| **C1** anular una venta deja su plata viva | Venta y compra | **Cerrado.** Anular la misma venta desde Stock 3 veces a la vez: 1 × 200 *"También se anuló su cobro"*, 2 × 400. En la tabla, stock y plata anulados. Anular la plata desde Movimientos y la venta desde Stock a la vez: los dos quedan anulados |
| **B2** precio enorme · **B3** el camino genérico | Venta y compra | **Cerrados.** La compra a $ 20.000.000.000 rebota con 400 (ya no 500). Venta y compra por `POST /productos/stock/movimientos` rebotan con el mensaje que manda al botón correcto |
| El total en centavos | Venta y compra | `0,1 × 3` guarda **0,30** |

**No se re-verificaron:**
- **M1** (*"Sin stock"* para siempre) y **M2** (la cascada que revive bajas) de 07-08;
- **B1** (el costo con dos compras a la vez) de la venta y la compra;
- **M2** (XSS en `usuarios.html`) y **M4** (formato del email al crear un usuario) del 06.

Ninguno de esos lugares cambió desde su corrección.

### El patrón del XSS en lo nuevo

Se cargó `<img src=x onerror=...>` en:
- **otra empresa**: el nombre de un producto visible, su descripción (con un `<script>`), el
  nombre de la empresa y su domicilio (con `mostrar_domicilio` prendido);
- **el registro**: una empresa nueva, para el superadmin;
- **una categoría y un tipo de dinero**, para el desplegable con `<optgroup>` de HU-87.

Se contaron los elementos inyectados:

```
articulacion.html (resultado de la búsqueda)                0
empresa-ficha.html (título, contacto, lo que ofrece)        0   el <title> de la pestaña lo muestra como texto
  · tooltip del círculo del mapa (forzado con mouseover)    escapado (&lt;img ...)
  · link tel: y mailto:                                     sólo números / el email
superadmin.html (las dos pestañas, detalle, cartel, aviso)  0
movimientos.html (optgroup, la ayuda "Va en...", filtro)    0
```

**Cero en todas.** El teléfono además no deja pasar nada que no sean números, espacios, `+`,
`-` y paréntesis.

---

## Lo que quedó bien probado (y aguantó)

### Articulación: no se abre de más

**No sale nada privado.** Se buscaron `precio`, `costo`, `stock`, `cuit`, `monto`,
`existencia`, `usuario`, `dni` y `password` en las respuestas de la búsqueda y de dos fichas,
**con productos que tienen precio y costo cargados** (Chapa galvanizada: $ 32.000 / $ 24.000).
**Ninguno aparece.**

**El contacto lo recorta el servidor.** Textil El Amanecer tiene `mostrar_telefono = 0`: su
ficha trae sólo el email, **el teléfono no viene en la respuesta**. Metalúrgica, con los tres
prendidos, trae los tres. `mostrar_email: "no"` lo apaga.

**Quién aparece:** cada condición se probó por separado sobre Papelera Castelar, mirando la
búsqueda **y** la ficha:

| Condición | Búsqueda | Ficha |
|---|---|---|
| producto dado de baja | desaparece | desaparece de *Lo que ofrece* |
| `id_rubro = NULL` (por SQL) | desaparece | desaparece |
| módulo Productos apagado | desaparece | *Lo que ofrece* vacío |
| módulo Articulación apagado | desaparece | 404 |
| empresa rechazada (suspendida) | desaparece | 404 |
| re-aprobada | vuelve | vuelve |
| Servicios apagado en Metalúrgica | *"soldadura"* pasa de 1 a 0 | quedan sólo los productos |

**Roles:** admin, tesorero y operador buscan. Superadmin: 403. Sin sesión: 401. Con
Articulación apagado en la propia empresa: 403. `/localidades` sin sesión trae nombres y
provincia, **sin coordenadas**; `/rubros` sin sesión, 401.

**La búsqueda:**
- `%`, `_`, `%%` y una letra rebotan o no traen nada.
- 150 caracteres y 6 palabras no rompen nada.
- `carton` encuentra *Cartón*, `PAPEL` encuentra *papel*, y `kraft papel` encuentra *Bolsas
  de papel kraft*.
- Lo que no se muestra (Queso, Jamón, Electrodo, Retazos, Gaseosa de baja, Mantenimiento) no
  aparece.
- `id_rubro` inexistente, texto, `-1`, `1.5`, `0` y `1e2` rebotan con *"No se encontró el
  rubro"*. `q[]=` y `q` repetido rebotan con el mensaje de *"escribí qué buscás"*.

**La ficha:**
- La propia se ve (`esLaPropia: true`, sin distancia).
- Una pendiente, una inexistente, `abc`, `-1`, `3abc` y un número de 20 cifras dan 404.

**La distancia** coincide con Haversine hecho a mano entre los centros de las localidades:
Ituzaingó–Castelar **2,27 → 2,3 km**, Ituzaingó–Merlo **5,62 → 5,6 km**.

**"Un campo que no viene no se toca"** se cumple para los campos de Articulación:
- en un producto, `visible_empresas` e `id_rubro` se conservan;
- en Mi empresa, `telefono`, `id_localidad` y las tres casillas se conservan;
- la provincia sale de la localidad.

Mostrar sin rubro rebota en el alta y en la edición; un rubro inventado o `"21abc"` rebota. Los
campos viejos no siguen la regla: es B3.

### El superadmin

**Permisos:**
- `GET /empresas` y `aprobar`: 403 para un admin de empresa, 401 sin sesión.
- El superadmin resetea admins (y su sesión siguiente queda bloqueada hasta cambiar la
  contraseña), pero no a un tesorero (403), ni a sí mismo (400), ni a un id inexistente
  (404).
- Un admin no resetea a un usuario de otra empresa (403).

**Aprobar a la vez:** 3, 4 y 6 aprobaciones simultáneas de la misma empresa, desde dos sesiones,
dejan siempre **6 categorías, 15 tipos, 7 motivos y 5 módulos**. No hay nada duplicado.

**Rechazar y habilitar de nuevo:**
- Respeta los módulos que la empresa había apagado (Reportes y Productos siguen apagados
  después).
- No reactiva a un usuario dado de baja (Héctor sigue de baja).

**En el navegador:** las dos pestañas con sus contadores, el detalle, aprobar desde el
detalle, rechazar (con su cartel), *Habilitar de nuevo* y el cartel de reseteo. El CUIT se ve
con guiones. **En 375 px** la tabla se vuelve tarjetas y no hay scroll horizontal. Sin errores
de consola.

### HU-87: el desplegable único

**`GET /categorias/tipos`:**
- Admin y tesorero: 200. Operador y superadmin: 403. Contraseña temporal: 403. Sin sesión: 401.
  Con el módulo de Movimientos apagado (por SQL): 403.
- Trae **lo mismo que el `SELECT`** (9 tipos usables en La Esperanza) y **ningún id de otra
  empresa**.
- Al dar de baja una categoría, sus tipos salen de la lista, y cargar con uno de ellos rebota.

**Entró / Salió:** al cambiar de *Entró* a *Salió* el desplegable se rearma. Un tipo de la
otra naturaleza no puede quedar elegido. Además el servidor saca la naturaleza del tipo, no de
lo que diga el pedido (verificado mandando `naturaleza: egreso` con un tipo de ingreso: se
guarda como ingreso, que es lo que el tipo dice).

**Anular y corregir, en un movimiento común:**
- Copia Entró/Salió, el tipo, el monto, **la fecha original** y la descripción, con el aviso
  de que se copiaron.
- Registrado con otro monto: en la tabla, el original queda anulado y el corregido vigente.
- No quedan fondos grises trabados (0 `modal-backdrop` después).
- En 375 px el formulario copiado entra entero (8 a 367 px).

### HU-88

- Una empresa recién aprobada ve **Primeros pasos** con los pasos según sus módulos.
- Los casilleros de Productos dicen *"Módulo no activo"*.
- Movimientos y Stock vacíos dicen por dónde empezar.
- Con un filtro puesto aparece *Limpiar filtros*.
- El caso del movimiento anulado es B2.

### Lo que se sacó

- `grep` en `src/`, `app.js` y los dos `.sql`: no queda ninguna referencia a
  `cantidadMujer`, `id_sector`, `tipos_empresa`, `registerCoop` ni `validatePassword`, salvo
  el comentario que cuenta por qué se sacaron.
- `registerCoop.html`, `registerUser.html` y `registerStyles.css` dan 404.
- **Todos los `src` y `href` locales de las 19 páginas responden 200** (se pidieron uno por
  uno).
- La base se creó dos veces desde cero con los dos `.sql` (al empezar y al terminar), sin
  error. **No** se corrió `datos_de_prueba.sql` dos veces seguidas sobre la misma base.

### Lo demás

**Reportes:**
- Los tres atajos de período, contra `SELECT`: la suma de las filas da **exactamente** los
  totales en los tres.
- Se cuentan los anulados que quedan afuera.

**La descarga:**
- El CSV lleva el período en el nombre.
- El PDF se descarga.
- Con Reportes apagado, la descarga da 403 (no un archivo vacío).

**Los dos catálogos no se cruzan:**
- Editar o dar de baja un producto por `/servicios/:id` y al revés: 404.
- Un servicio con una categoría de productos: rebota.
- Stock o una venta sobre un servicio: rebota con su mensaje.
- Un servicio creado mandando unidad, mínimo, costo y precio: en la tabla quedan `NULL`, `0`,
  `NULL` y `NULL`.

**Movimientos:**
- Las fechas rebotan donde corresponde: 30/02, antes del 2000, mañana, texto, vacía.
- Pasan el 29/02/2024 y hoy.

---

## Observaciones que no llegan a hallazgo

- **`npm install` deja `package-lock.json` como modificado** en `git status`, aunque el
  contenido no cambió (sólo los finales de línea; git avisa *"LF will be replaced by CRLF"*).
  Alguien del grupo lo puede commitear sin querer. Se restauró con `git checkout`.
- **El monto acepta notaciones raras**: `"1e3"` se guarda como $ 1.000, `"0x10"` como $ 16 y
  `" 10 "` como $ 10. La pantalla no las manda. Es la misma familia que los arrays del informe
  anterior.
- **La ficha de una empresa que participa pero no muestra nada se puede abrir por id**, con su
  email y su teléfono. La pantalla lo contempla (*"Por ahora no muestra ningún producto ni
  servicio"*) y la empresa prendió Articulación ella misma, así que parece buscado. Se anota
  porque es el único caso donde los contactos salen sin que la empresa aparezca en ninguna
  búsqueda.
- **La ficha acepta `1.0`, `1e0`, `0x3` y `" 3"`** como id (`Number()`). Trae la empresa que
  corresponde, sin efecto.
- La copia de la app que estaba en el **puerto 3000** sigue corriendo y apunta a la misma base.

## Lo que NO se llegó a cubrir (honestidad)

- **Corte de la base en medio de una transacción.** No se bajó MariaDB. Sí se vio que el 500 del
  registro (A1) deshace todo.
- **Un segundo navegador.** Sólo el integrado.
- **`perfil-empresa.html` y el bloque "Mostrar a otras empresas" de Productos y Servicios en el
  navegador.** Se probaron por API, no la pantalla.
- **El PDF largo** (60 movimientos, encabezado repetido, numeración). Sólo se vio que se
  descarga.
- **Las pérdidas valorizadas y los agrupados por producto y por servicio contra `SELECT`.** Sólo
  se cruzó el reporte por período.
- **375 px del panel de inicio con Primeros pasos** y de Stock vacío: se miró el texto, no se
  midió el ancho.
- Los hallazgos viejos listados arriba como *no re-verificados*.

---

## Prioridad sugerida

1. **C1.** Primero hay que **decidir** qué pasa al corregir la plata de una venta o una compra
   desde Movimientos, y después escribirlo. Mientras tanto, cada corrección de precio de una
   venta deja dos versiones de la misma plata.
2. **A1.** Es la puerta de entrada y se arregla en el mismo lugar que M1: guardar lo mismo que
   se validó.
3. **M1.** Lo mismo con el DNI, en el registro y en el alta y la edición de usuarios.
4. **B1.** Que aprobar y rechazar digan 404 si la empresa no existe.
5. **B2.** Que Primeros pasos y el listado vacío cuenten los anulados.
6. **B3.** Extender la regla de "un campo que no viene no se toca", o al menos rechazar los
   tipos que no son texto.

## De paso (usabilidad, no es el foco de este informe)

- Una empresa *Rechazada* en el panel del superadmin, al intentar entrar, lee *"Tu empresa está
  suspendida"*: son dos palabras para el mismo estado.
- *Habilitar de nuevo* no pide confirmación, a diferencia de *Rechazar*.

---

## Resultado de las correcciones (14/11/2026)

Corregido en el chat de desarrollo. **Los 6 hallazgos están cerrados**, más una observación.
Nada va al backlog.

| Hallazgo | Qué se hizo |
|---|---|
| **C1** Anular y corregir la plata de una venta | La plata de una venta o una compra **no se corrige desde Movimientos**: el cartel no ofrece *Anular y corregir* ni *Cargar de nuevo*, explica que se corrige desde Stock, y el servidor lo rechaza (`POST /movimientos/:id/corregir` mira `de_stock`). En Stock se agregó **Anular y corregir** para ventas y compras: anula la vieja con su plata y carga la nueva **en la misma transacción**, adentro del candado del producto (`reemplaza` en `POST /productos/stock/ventas` y `/compras`). |
| **A1** CUIT con guiones | Se guarda el CUIT **limpio**, el mismo que se valida. El duplicado se detecta con guiones o espacios. |
| **M1** DNI con puntos | Igual en el registro, el alta y la edición de usuarios (la edición ni validaba el formato). La contraseña temporal queda sin puntos. |
| **B1** Aprobar una empresa que no existe | `aprobar` y `rechazar` contestan **404** si el id no es de una empresa. |
| **B2** Primeros pasos y anulados | El panel cuenta los anulados (`incluirAnulados=true`), y el listado vacío de Movimientos dice *"los que cargaste están anulados"* en vez de *"todavía no cargaste nada"*. |
| **B3** Campos que se borran | Mi empresa: federación, domicilio y teléfono siguen la regla *"lo que no viene no se toca"*; un número se acepta como texto y una lista se rechaza con 400. Productos: la descripción se conserva si no viene. Un nombre numérico en usuarios o empresa da 400, no 500. |
| Observación: montos raros | Servicio nuevo `aNumero()` en `validacion.service.js`: sólo números o texto como `1500` / `1500.50`. `1e3`, `0x10` y `" 10 "` rebotan. Lo usan los montos de Movimientos, la venta, la compra y los importes del producto. |
| De paso: *"Rechazada"* vs *"suspendida"* | Al entrar a una empresa rechazada dice *"Tu empresa fue rechazada"*, la palabra del panel. |
| De paso: *Habilitar de nuevo* sin confirmar | **No se cambió, a propósito**: se deshace (se puede volver a rechazar), igual que *Aprobar*, que UX evaluó bien sin confirmación. |

**Encontrado al corregir**: UX llegó por otro camino al mismo botón (F-01): *Anular y corregir*
anulaba **antes** de abrir el formulario, y *Cancelar* dejaba la plata anulada sin reemplazo. Ahora
no anula nada hasta guardar: el servidor anula y crea en un solo paso (`movimientoModel.corregir`).

**Probado**: 42 casos por API con un script de Node (corregir común, ya anulado, con datos malos —el
original sigue vivo—, **dos correcciones a la vez** —una 201 y otra 400—, el operador, la plata de
una venta, la venta corregida y su existencia, corregir cambiando el producto, una venta como compra,
una compra achicada por debajo de lo vendido; registro con CUIT y DNI con separadores y sus
duplicados; alta y edición de usuarios; los cuatro ids falsos; la empresa rechazada; los campos que
no vienen y los que no son texto; los montos raros), la base, y el circuito en el navegador
(cancelar una corrección no toca el total; corregir una venta como operador desde Stock).
