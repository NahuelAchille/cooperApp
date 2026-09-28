# Informe de QA — CooperApp

- **Fecha:** 28/09/2026
- **Sprints auditados:** **09 (Servicios completo)** y **10 (Reportes completo)**. Es la
  **HU-50**, que había quedado sin correr, más el Sprint 10 entero.
- **Alcance:** todo lo implementado al 28/09 (CLAUDE.md sección 3), con foco en lo que el
  propio prompt marcó: en el 09 el **cruce entre los dos catálogos**, y en el 10 que **los
  números cierren**.

## Conteo de hallazgos

| Severidad | Cantidad |
|---|---|
| CRÍTICO | 0 |
| ALTO | 1 |
| MEDIO | 2 |
| BAJO | 2 |
| **Total** | **5** |

**Los 5 están confirmados ejecutándolos.** Ninguno es sospecha ni lectura de código.

Es la corrida con menos hallazgos de las tres, y con ninguno crítico. Lo que más se atacó
—el cruce de catálogos y la aritmética de los reportes— **aguantó entero**: 13 intentos de
cruzar productos con servicios rebotan, y los totales del módulo de reportes cierran al peso
contra `SELECT` hechos a mano en las cinco vistas.

## Nota de método

Entorno levantado desde cero: `taskkill //F //IM node.exe` (verificado con `tasklist`, porque
`pkill` no sirve acá), base recreada con los dos `.sql`, `npm install` para tener pdfkit, y
`node app.js`. **La base se restauró al terminar** (4 empresas, 28 usuarios, 28 movimientos,
18 productos, 6 servicios, 23 movimientos de stock: idéntica al arranque). No se tocó una
línea de código ni de datos de prueba — verificado con `find -newermt`.

Se probó en los tres niveles: **base** (`mysql.exe`), **API** (`curl`, más un script de Node
con `Promise.all` para la concurrencia) y **navegador** (los 4 roles, escritorio y 375 px).
Los PDF se leyeron con `pypdf`, no mirándolos.

> **Los números de los reportes se verificaron siempre contra un `SELECT`, nunca contra otra
> pantalla.** Es la trampa que el propio prompt marca: si dos pantallas están mal de la misma
> manera, compararlas no lo muestra.

---

## ALTO

### A1 · En el CSV, todo resultado negativo se vuelve texto: Excel lo saltea al sumar y el total sale inflado

**Qué pasa:** la defensa contra inyección de fórmulas antepone un apóstrofe a cualquier celda
que empiece con `=`, `+`, `-` o `@`. Eso está bien para el texto que escribe la gente —y
funciona, ver la regresión—, pero **también le pega a la columna Resultado**, que empieza con
`-` cada vez que un rubro da pérdida. Con el apóstrofe, Excel deja de leer esa celda como
número.

El resultado es una columna mitad número y mitad texto, y **las de texto son exactamente las
negativas**.

**Reproducción (confirmada):** reporte agrupado por categoría de Metalúrgica, año 2026.

```bash
curl -b daniel.txt "http://localhost:3000/reportes/descargar?formato=csv&vista=categoria&periodo=personalizado&desde=2026-01-01&hasta=2026-12-31" -o c.csv
```

La columna Resultado del archivo:

```
Ventas                   616000,00      número
Trabajos a terceros      214954,00      número
QA sin tipos             0,00           número
Sueldos                  '-300000,00    <- TEXTO: Excel no lo suma
Insumos                  '-182000,00    <- TEXTO: Excel no lo suma
Servicios                '-101000,00    <- TEXTO: Excel no lo suma
```

Sumando la columna como la sumaría Excel (salteando las celdas de texto):

```
  resultado REAL       : 247.954     <- y es lo que dicen la pantalla y el PDF
  lo que suma Excel    : 830.954
  se infla en          : 583.000     <- exactamente los tres negativos
```

**Esperado:** que la columna se pueda sumar, que es la condición que el propio proyecto se
puso ("los números sumables"). La protección contra fórmulas tiene que aplicarse al texto que
escribe el usuario, no a un número que arma el sistema.
**Pasó:** los tres rubros que perdieron plata desaparecen de la suma, sin ningún aviso.

**Por qué importa:** es el único hallazgo que produce un número mal. Y tiene tres agravantes:

1. **Es silencioso.** No hay error, no hay celda vacía, no hay nada raro a la vista: los
   números se ven todos, bien escritos, uno abajo del otro. Sólo la suma está mal.
2. **El error va siempre para el mismo lado.** Lo que se saltea son las pérdidas, nunca las
   ganancias, así que el archivo siempre muestra a la empresa mejor de lo que está. Un error
   que a veces suma de más y a veces de menos se nota; uno que siempre favorece, no.
3. **El archivo es justamente lo que sale de la empresa.** Se manda al contador, al socio, al
   banco. Quien lo recibe no tiene la pantalla al lado para comparar — y si la tuviera, el
   hallazgo M1 le saca la otra manera de verificarlo.

Lo pongo en ALTO y no en CRÍTICO porque **el sistema calcula bien**: la pantalla, el PDF y la
base dicen 247.954. El número malo aparece recién cuando alguien usa el archivo como está
previsto que se use. Si el grupo prefiere tratarlo como crítico por el destino del archivo, me
parece defendible.

**Alcance:** las tres vistas agrupadas (categoría, producto, servicio) en CSV. La vista de
movimientos no se ve afectada (el monto va siempre positivo, el signo lo da la columna
"Entró / Salió") ni las pérdidas (siempre positivas). El PDF tampoco: ahí no hay que sumar nada.

**Estado:** confirmado ejecutándolo y midiendo la diferencia.

---

## MEDIO

### M1 · El CSV no trae los totales; el PDF sí

**Qué pasa:** las cinco vistas del CSV traen el encabezado de la empresa, el título, el
período y los avisos (anulados, pérdidas sin valorizar) — pero **ninguno de los tres
casilleros** que la pantalla muestra arriba de todo. El PDF sí los trae.

**Reproducción (confirmada):** el CSV del reporte por período de marzo, entero:

```
Alimentos La Esperanza S.R.L.
Movimientos del período
Período: del 01/03/2026 al 31/03/2026

Fecha;Descripción;Categoría;Tipo;Entró / Salió;Monto;Servicio
2026-03-15;...;Entró;11,00;
... (5 filas)
                                    <- el archivo termina acá
```

El PDF del mismo reporte, en cambio, arranca con:

```
ENTRÓ  $ 61.830,00
SALIÓ  $ 0,00
RESULTADO ...
```

**Esperado:** el archivo dice lo mismo que la pantalla — que es el criterio que el proyecto ya
aplicó bien a los avisos (*"si en pantalla dice que hay 3 anulados que no entran y el archivo
no lo dice, el que recibe el archivo saca otra conclusión del mismo número"*). El número
grande de la pantalla es, justamente, el número.
**Pasó:** el CSV obliga a que quien lo recibe se calcule el total por su cuenta.

**Por qué importa:** por sí solo sería una diferencia de formato discutible —un CSV es para
abrir en Excel y Excel suma—. **Lo que lo vuelve un hallazgo es que se combina con A1**: el
CSV no trae el total, y la única manera de obtenerlo (sumar la columna) es exactamente lo que
A1 rompe. Entre los dos, quien recibe un CSV agrupado **no tiene ninguna forma correcta de
saber el resultado del período**: ni leído ni calculado.

Conviene arreglarlos juntos y en este orden: primero A1, y después decidir si el total va
igual. Si va, hay que cuidar de no escribirlo con `-` adelante, o vuelve el mismo problema en
la fila que más se mira.

**Estado:** confirmado ejecutándolo, en las cinco vistas y en los dos formatos.

### M2 · Los datos de prueba arrancan con un stock en negativo, que es el estado que el sistema declara imposible

**Qué pasa:** `datos_de_prueba.sql` carga una pérdida de 4 unidades de *Bolsa de pan*, que
nunca tuvo una entrada. La existencia queda en **−4** apenas se importa la base, sin que nadie
toque nada.

**Reproducción (confirmada), sobre una base recién importada:**

```sql
SELECT p.nombre, COALESCE(SUM(CASE WHEN ms.anulado=1 THEN 0
       WHEN mo.efecto_stock='entrada' THEN ms.cantidad ELSE -ms.cantidad END),0) AS existencia
FROM productos p
LEFT JOIN movimientos_stock ms ON ms.id_producto=p.id_producto
LEFT JOIN motivos_stock mo ON mo.id_motivo_stock=ms.id_motivo_stock
WHERE p.es_servicio=0 GROUP BY p.id_producto HAVING existencia < 0;

-- Bolsa de pan | Alimentos La Esperanza S.R.L. | -4.00
```

Y la app lo muestra:

```
GET /productos/stock  ->  Bolsa de pan | existencia -4.00 bolsa | movimientos: 1
```

**Esperado:** los datos de prueba respetan las mismas reglas que la app. Por la API ese
movimiento **no se puede cargar**: el mismo intento devuelve *"No hay stock suficiente: hay 0
y estás sacando 4"*. El `.sql` entra directo a la tabla y se saltea el control.
**Pasó:** la base de demostración arranca en un estado que el sistema dice que no puede existir.

**Por qué importa:** no es código de producción, por eso no es más grave. Pero pega en tres
lugares que importan:

- **La demo.** Quien abra Stock en la presentación ve *"−4 bolsa"* en la pantalla que muestra
  el módulo con más cálculo del sistema. Y la app no ofrece ninguna explicación ni camino de
  vuelta: el rótulo al lado dice *"Sin stock"*, que contradice al número.
- **La confianza en el arreglo del Sprint 08.** El stock en negativo es exactamente lo que se
  corrigió con el candado de la fila del producto. Que la base de prueba arranque así invita a
  pensar que el arreglo no funcionó — y funciona: lo verifiqué con 8 pedidos simultáneos (ver
  la regresión).
- **El reporte de pérdidas.** Esa salida imposible entra igual en *"Lo que se perdió"*, donde
  además es el único producto sin costo cargado, así que es la fila que ilustra el caso de
  *"No se sabe"*. Conviene arreglarla sin perder ese caso de demostración: alcanza con
  cargarle antes una entrada.

**Estado:** confirmado, reproducido sobre una importación limpia.

---

## BAJO

### B1 · Anular dos veces el mismo movimiento de dinero a la vez contesta cuatro veces "anulado correctamente"

**Qué pasa:** el control de "ya estaba anulado" del movimiento de **dinero** lee y decide fuera
de la base, sin candado. Con pedidos simultáneos, los cuatro pasan el control y los cuatro
contestan que lo anularon.

**Reproducción (confirmada):** cuatro `PUT /movimientos/:id/anular` simultáneos desde dos
sesiones (marta y roberto):

```
[marta0]   200 {"message":"Movimiento anulado correctamente"}
[roberto1] 200 {"message":"Movimiento anulado correctamente"}
[marta2]   200 {"message":"Movimiento anulado correctamente"}
[roberto3] 200 {"message":"Movimiento anulado correctamente"}
```

En la tabla queda bien: `anulado = 1`, una sola fila, nada duplicado. Y **secuencialmente el
control funciona**: el segundo pedido devuelve *"El movimiento ya estaba anulado"*.

**Esperado:** uno anula y los otros tres reciben *"El movimiento ya estaba anulado"* — que es
lo que hace el equivalente en **stock**, probado en la misma corrida:

```
[silvia0] 200 {"existencia":13,"message":"Movimiento anulado. Fideos secos 500g queda en 13."}
[jorge1]  400 {"error":"Ese movimiento ya estaba anulado"}
[marta2]  400 {"error":"Ese movimiento ya estaba anulado"}
[silvia3] 400 {"error":"Ese movimiento ya estaba anulado"}
```

**Pasó:** en dinero contestan los cuatro que lo anularon ellos.

**Por qué importa:** **no hay daño en los datos** — la operación es idempotente y la existencia
no depende de esto—, por eso es BAJO. Lo que hay es un mensaje que dice que pasó algo que no
pasó: dos personas mirando la misma pantalla creen cada una que anuló ella. En un sistema de
plata, quién anuló qué es una pregunta que se hace.

Se reporta sobre todo porque es **el mismo patrón, en la otra pantalla**: el informe anterior
dice que este caso se encontró al corregir y se cerró, y quedó cerrado **en stock** y abierto
en dinero. Es exactamente el patrón que el prompt pide buscar, y el arreglo es el que ya está
escrito al lado.

**Estado:** confirmado ejecutándolo, y contrastado contra el comportamiento correcto en stock.

### B2 · Una fecha que no existe en el período personalizado dice "Elegí las dos fechas", que es lo que la persona acaba de hacer

**Qué pasa:** el período personalizado usa el mismo mensaje para "falta una fecha" y para "la
fecha no es un día del calendario".

**Reproducción (confirmada):**

```
periodo=personalizado                                -> "Elegí las dos fechas del período"   (correcto)
periodo=personalizado&desde=2026-09-01               -> "Elegí las dos fechas del período"   (correcto)
periodo=personalizado&desde=2026-02-30&hasta=2026-03-01 -> "Elegí las dos fechas del período"   <- las eligió
periodo=personalizado&desde=hola&hasta=chau          -> "Elegí las dos fechas del período"   <- las eligió
```

El caso de fechas invertidas, en cambio, **sí dice lo que pasa**: *"La fecha de inicio es
posterior a la de cierre"*.

**Esperado:** decir que esa fecha no existe, como ya hace el alta de movimientos (*"La fecha no
es válida"*), y a ser posible cuál de las dos.
**Pasó:** le pide a la persona que haga lo que ya hizo.

**Por qué importa:** es BAJO porque desde la pantalla se eligen con un selector de fecha y el
caso casi no se alcanza. Va igual porque **el mensaje describe mal lo que pasó** —no es que
falte una fecha, es que una no existe— y porque el propio módulo ya distingue bien el caso de
las fechas invertidas: la pieza está, sólo falta usarla en el otro camino.

**Estado:** confirmado ejecutándolo.

---

## Regresión de los informes anteriores

Se reprodujo el caso original de cada hallazgo corregido. **Los 20 siguen corregidos.**

### Los dos críticos de concurrencia del Sprint 08 — apretados más fuerte que la vez pasada

| Caso | Resultado |
|---|---|
| Dos operadores venden 6 kg cada uno de un producto que tiene 9 | **Cerrado.** Uno entra (queda en 3), el otro recibe *"No hay stock suficiente: hay 3 y estás sacando 6"*. En la tabla: **3,00** |
| **8 salidas simultáneas** de 10 sobre 60 de existencia | **Cerrado.** Entran exactamente 6, rebotan 2, y la existencia queda en **0,00**: nunca negativa, en ningún momento intermedio |
| 6 pedidos simultáneos del movimiento de dinero de la misma venta | **Cerrado.** Uno crea (201), cinco reciben *"Ese movimiento de stock ya tiene su movimiento de dinero registrado"*. En la tabla: **1 movimiento, $777** |

El candado de la fila del producto aguanta. Es el arreglo más importante que tiene el proyecto
y está sólido.

### El resto

| Hallazgo | Origen | Hoy |
|---|---|---|
| **A1** marca "$ cargado" con el dinero anulado | QA 07-08 | **Cerrado.** Anulado el dinero, la venta se puede volver a cargar (201) y vuelve a contar como "falta el $" |
| **M1** anular deja el producto en "Sin stock" para siempre | QA 07-08 | **Cerrado.** El contador excluye los anulados: Milanesas tiene 3 movimientos en la tabla y la API informa **2** |
| **M2** la cascada revive lo apagado a propósito | QA 07-08 | **Cerrado** en los dos árboles. La columna `baja_en_cascada` hace su trabajo: *Perecederos* sigue de baja después de bajar y subir la categoría |
| **M3** textos largos guardados cortados | QA 07-08 | **Cerrado.** Un email de 246 caracteres devuelve *"El email es demasiado largo: máximo 150 caracteres"* y no crea la empresa |
| **B1** stack trace en un JSON roto | QA 07-08 | **Cerrado.** Devuelve `{"error":"El pedido no tiene un formato válido"}` |
| **B2** stock mínimo 0,001 guardado como 0 | QA 07-08 | **Cerrado.** *"El stock mínimo es demasiado chico: usá al menos 0,01, o dejalo en 0 para no recibir avisos"* |
| **C1** XSS almacenado anónimo | QA 06 | **Cerrado**, y el patrón se buscó en todo lo nuevo (ver abajo) |
| **A1** `GET /users` sin rol · **A2** contraseña temporal · **A3** registro no atómico · **M2** XSS en usuarios · **M3** rechazar irreversible · **M4** email sin validar · **B2** `monto: true` · sesiones vivas tras la baja | QA 06 | **Todos cerrados** |
| **H-02** superadmin en un tablero ajeno · domicilio/federación vacíos | UX | **Cerrados** |

### El patrón del XSS en las pantallas nuevas

Es lo que más veces encontró algo (Sprint 06: se arregló en dos pantallas y quedó vivo en
otras dos). Se inyectó `<img src=x onerror=...>` en **categoría de servicios, subcategoría de
servicios, nombre y descripción de servicio, descripción de movimiento, categoría de
movimientos y motivo de stock**, y se abrieron las pantallas en el navegador contando
elementos inyectados:

```
servicios                    0      reportes · uno por uno      0
categorías de servicios      0      reportes · por categoría    0
movimientos                  0      reportes · por producto     0
                                    reportes · por servicio     0
                                    reportes · lo que se perdió 0
```

**Cero en las ocho**, con el payload visible como texto. Tercera corrida seguida en que el
patrón se aplica completo en lo nuevo.

---

## Lo que quedó bien probado (y aguantó)

### Servicios: el cruce entre los dos catálogos — 13 intentos, los 13 rebotan

Es lo que había que atacar, porque productos y servicios viven en las mismas tablas.

```
editar PRODUCTO desde /servicios/:id                -> "No se encontró el servicio"
editar SERVICIO desde /productos/:id                -> "No se encontró el producto"
dar de baja, en los dos sentidos                    -> idem
renombrar / dar de baja categoría, los dos sentidos -> "No se encontró la categoría"
ver subcategorías del otro catálogo                 -> "No se encontró la categoría"
dar de baja subcategoría, los dos sentidos          -> "No se encontró la subcategoría"
alta de servicio en categoría de productos          -> "Elegí una categoría válida"
alta de producto en categoría de servicios          -> "Elegí una categoría válida"
```

Que la fila sea de la empresa no alcanza: tiene que ser además del mismo lado. Está bien
resuelto.

**Y el resto del módulo:**
- **Un servicio no lleva stock:** cargarle un movimiento devuelve *"Los servicios no llevan
  stock"*, no aparece en la pantalla de Stock (5 filas, todas productos) y ningún producto
  aparece en Servicios (6 filas, todos servicios).
- **Unidad, stock mínimo y costo se fuerzan**, no se ignoran de palabra: un alta que manda
  `"unidad_medida":"kg", "stock_minimo":99, "costo_referencia":12345` queda en la tabla como
  **`NULL` / `0.00` / `NULL`**. Verificado con `mysql.exe`, no en la respuesta.
- **El nombre único es por catálogo:** un producto y un servicio pueden llamarse igual (los dos
  entran), dos servicios no (*"Ya existe un servicio con ese nombre en tu empresa"*).
- **Los roles van al revés que en Productos, y se respeta:** el admin arma, el **tesorero lee**
  (catálogo y árbol) y el **operador no entra** (403 en los dos). El tesorero no puede crear,
  editar ni dar de baja.

### El servicio de un movimiento (HU-48 y HU-49)

Los seis intentos de vincular mal rebotan: id de producto (*"Elegí un servicio válido"*),
servicio dado de baja, servicio de otra empresa, id inexistente, y desde una empresa sin el
módulo (*"El módulo de Servicios no está activo en tu empresa"*). El servicio de baja no se
ofrece en el alta.

**Apagar el módulo esconde, no borra:** con Servicios apagado, los 5 movimientos siguen
mostrando su servicio en el listado, el panel y el reporte devuelven vacío, y al reactivarlo
vuelve todo (8 servicios).

**El panel "Cuánto deja cada servicio" coincide exacto con el `SELECT`**, servicio por
servicio, con período y sin período. Los bordes entran: `desde=17` y `hasta=22` incluyen los
movimientos del 17 y del 22; un solo día devuelve sólo ese día. Un servicio sin movimientos en
el período **aparece igual, en cero** (los 7), que es el que hay que mirar. Un servicio dado de
baja sin movimientos **no** aparece, como está previsto.

### Reportes: la regla del módulo se cumple

**Los totales cierran con lo que se lista.** Sumando a mano la columna de montos de las 11
filas del reporte por período: `ingresos 899.000 / egresos 545.000`, idéntico a los tres
casilleros e idéntico al `SELECT`.

**Entre vistas también:** la suma del agrupado por categoría da **899.001 / 583.000**,
exactamente los totales del período. Producto (96.000) y servicio (283.000 / 18.000) son
subconjuntos y nunca se pasan.

**Los decimales.** Diez movimientos de $0,10 dan **exactamente 1**, mientras que la suma
ingenua con el `+` de JavaScript sobre las mismas filas da `0.9999999999999999`. La decisión de
sumar en centavos no era paranoia y funciona.

**Los tres atajos de período**, contra `SELECT` con las fechas puestas a mano: mes-actual
(01/09–28/09, 11 filas), mes-anterior (01/08–31/08, 1 fila), anio-actual (01/01–28/09, 22
filas). Los tres, exactos. Los bordes entran: un movimiento del 01/07 y otro del 31/07 aparecen
con `desde=01/07 hasta=31/07`, y cada uno solo con su propio día. **La descarga respeta el
mismo borde.**

**El período personalizado** rebota bien: sin fechas, con una sola, invertido (*"La fecha de
inicio es posterior a la de cierre"*), 30 de febrero y texto (ver B2 por el mensaje).

**Anular un movimiento del período**: desaparece de la lista (22 → 21 filas), deja de sumar
(899.001 → 769.001, exactamente los 130.000) y aparece el aviso `anulados_fuera: 1`.

**Una categoría sin tipos y una con tipos pero sin movimientos aparecen las dos, en cero** — el
`LEFT JOIN` que se corrigió al escribir el módulo sigue bien puesto.

**El reporte por producto** cuenta bien los movimientos sin el $, verificado fila por fila
contra la base: los motivos que **no** mueven plata (una pérdida) **no** cuentan como "falta el
$" (*Bolsa de pan*: 0), y un movimiento de dinero **anulado** deja de contar aunque el de stock
siga vivo (*Queso cremoso* pasa de `ing 5000 / sin el $ 2` a `ing 0 / sin el $ 3`). Y no cuela
servicios: el producto y el servicio homónimos que creé a propósito quedan cada uno de su lado.

### Las pérdidas valorizadas: no se mezclan con el balance

**La condición de la historia se cumple.** Con una pérdida de 30 kg ($54.000) cargada en el
período:

```
balance antes:    ing 873.000 | egr 329.000 | resultado 544.000
balance después:  ing 873.000 | egr 329.000 | resultado 544.000   <- no se movió
pérdidas antes:   94.850
pérdidas después: 148.850                                          <- subió exactamente 54.000
```

**Los dos cortes cierran entre sí** en las tres mediciones que hice (94.850 · 148.850 ·
152.350): por motivo y por producto dan siempre lo mismo, y lo mismo que el total.

**El criterio es estructural, no una lista de nombres:** un motivo nuevo llamado *"Se lo comió
el perro"*, con salida + ninguno, entra al reporte sin tocar nada.

**Un producto sin costo se cuenta aparte y nunca como $0**: en el CSV la celda va **vacía** con
el detalle *"4 bolsa · sin costo cargado"*, y en el PDF dice **"No se sabe"**. Los dos archivos
llevan el aviso *"1 salida no se pudo valorizar... NO están en el total: lo perdido es ese
número y algo más"*.

**El costo de referencia** rebota bien en los seis casos: `0` (*"Si no sabés cuánto cuesta,
dejá el campo vacío en vez de poner 0"*), negativo, `0,004` (redondea a 0 y da el mismo
mensaje), texto, `true` y un número enorme. Un texto numérico (`"1800"`) sí entra, y vacío
queda en `NULL`.

**La fecha del costo sólo se mueve si el costo cambió**, verificado en la tabla con dos
segundos de diferencia: renombrar el producto la deja en `00:21:45`; cambiar el costo la lleva
a `00:29:01`.

### La descarga

**Inyección de fórmulas: neutralizada, los cuatro vectores.** Movimientos cargados con `=1+1`,
`+HYPERLINK("http://x.test","click")`, `-1+2` y `@SUM(A1)` salen en el CSV como `'=1+1`,
`"'+HYPERLINK(""http://x.test"",""click"")"`, `'-1+2` y `'@SUM(A1)`. Las comillas y los punto y
coma de adentro del texto van escapados bien.

**El archivo cierra con la pantalla:** sumando la columna Monto del CSV da **55 en 5 filas**,
igual que los casilleros. Los totales del PDF (`ENTRÓ $61.830,00`) coinciden exacto con la
pantalla del mismo período.

**El CSV abre bien en Excel en español:** BOM presente (`efbbbf`), separador `;`, coma decimal
(`11,00`), fin de línea CRLF y acentos correctos.

**El PDF largo:** 60 movimientos dan **3 hojas**, con 22 + 26 + 12 = 60 filas, el encabezado
`FECHA DESCRIPCIÓN CATEGORÍA TIPO MONTO` repetido en las tres, numeración *"hoja 1 de 3"*,
*"2 de 3"*, *"3 de 3"* y **ninguna hoja en blanco** — la trampa de pdfkit está bien resuelta.

**El nombre del archivo** lleva empresa, vista y período, y cambia con los tres:
`metalurgica-del-oeste-s-a-movimientos-2026-09-01-a-2026-09-28.csv` /
`...-2026-08-01-a-2026-08-31.csv` / `...-categoria-...` / `...-perdidas-...pdf`.

**Una vista de un módulo apagado rechaza, no baja un archivo vacío:** los cuatro casos
(`producto` y `perdidas`, en CSV y PDF, con el módulo de productos apagado) devuelven **403**
con *"El módulo de productos no está activo en tu empresa"*.

### Seguridad, aislamiento y concurrencia

**Aislamiento entre empresas: 20 intentos con ids ajenos, los 20 rebotan** (producto, servicio,
categorías y subcategorías de los dos catálogos, motivo, movimiento de stock, tipo de
movimiento y servicio de un movimiento). Los reportes toman la empresa de la sesión: pasarle
`?id_empresa=1` o `?empresa=1` no cambia nada.

**Roles y módulos en reportes:** operador, operador de otra empresa y superadmin reciben 403;
con el módulo de reportes apagado, las cuatro rutas dan 403. Un criterio inventado
(`?por=inventado`) cae en categoría, y un formato o vista inventados caen en CSV de
movimientos — degradan, no rompen.

**Concurrencia, más allá de los dos casos conocidos:**
- **Registro simultáneo con el mismo email y CUIT** (4 pedidos): uno entra, tres reciben *"Ya
  existe una cuenta con ese email"*. En la tabla: **1 empresa, 1 usuario, 0 empresas sin
  administrador**.
- **Aprobar la misma empresa desde 4 sesiones del superadmin, 8 pedidos simultáneos**: la
  siembra queda exacta (**6 categorías, 15 tipos, 7 motivos, 5 módulos**), sin duplicados ni
  siembra parcial, y el administrador entra y carga su primer movimiento. Las claves únicas de
  la base sostienen esto aunque el control de JavaScript se pise.
- **Anular el mismo movimiento de stock 4 veces a la vez**: uno anula, tres rebotan, existencia
  correcta.

### Lo demás

**Productos y stock** siguen firmes: unidad de medida inventada rechazada; `%` y `_` escapados
en la búsqueda de productos **y en la de servicios** (0 resultados, no los 11); motivo
`entrada+ingreso` y `salida+egreso` rechazados; cambiar el efecto de un motivo ya usado
rechazado; sacar más de lo que hay rechazado.

**Navegador:** las pantallas nuevas cargan **sin un solo error de consola**. En **375 px** no
hay scroll horizontal en ninguna: las cinco vistas de reportes usan tablas de 309 px con el
formato de tarjetas, y servicios 343 px. Se heredó `tabla-mobile.css` sin escribir CSS nuevo,
que es para lo que se hizo.

---

## Lo que NO se llegó a cubrir (honestidad)

- **El CSV abierto en Excel de verdad.** A1 está confirmado a nivel de bytes del archivo (qué
  celdas llevan apóstrofe y cuáles no) y la consecuencia es el comportamiento conocido de Excel
  con el apóstrofe inicial, pero **no abrí el archivo en Excel**. Conviene que alguien lo haga
  y sume la columna Resultado antes de decidir la severidad definitiva. Es una prueba de dos
  minutos y despeja la única duda del hallazgo más grave del informe.
- **Volumen.** Lo más pesado que probé fueron 60 movimientos. `findExistencias` y el reporte
  por producto recorren todo el historial de stock: son los primeros candidatos a ponerse
  lentos, y no los medí.
- **Corte de la base en medio de un guardado.** No se simuló bajar MariaDB durante una
  transacción, que es justamente el escenario para el que se puso el candado.
- **Concurrencia sobre el catálogo**: editar el mismo producto o servicio desde dos pestañas, y
  crear dos servicios con el mismo nombre a la vez. Probé el equivalente en registro y
  aprobación —donde las claves únicas de la base lo sostienen— y el catálogo también tiene
  `UNIQUE (id_empresa, es_servicio, nombre)`, así que **es razonable esperar que aguante**,
  pero no lo ejecuté.
- **Navegadores.** Sólo el integrado. La DOD pide dos.
- **Articulación:** no implementada.

---

## Prioridad sugerida

1. **A1** — es el único que produce un número mal, y el arreglo es acotado: aplicar el escape
   de fórmulas sólo a los campos de texto, no a los numéricos que arma el sistema.
2. **M1** — decidirlo junto con A1: si el CSV va a llevar los totales, escribirlos de manera
   que se puedan sumar.
3. **M2** — cargarle una entrada a *Bolsa de pan* en `datos_de_prueba.sql` antes de la pérdida,
   cuidando de no perder el caso de demostración del producto sin costo.
4. **B1** — llevar el control del anular al mismo patrón que ya usa el stock.
5. **B2** — un mensaje.

Ninguno bloquea empezar Articulación.

## De paso (usabilidad, no es el foco de este informe)

- *Bolsa de pan* se muestra como **"−4 bolsa · Sin stock"**: el número contradice al rótulo y no
  hay nada que le diga a la persona cómo volver a cero. Es el mismo renglón que quedó anotado
  en el informe anterior, y ahora se ve de entrada porque viene en los datos de prueba (M2).

---

# Resultado de las correcciones (28/09/2026)

Los 5 hallazgos, corregidos y verificados ejecutándolos. A1 y M1 se arreglaron juntos y en el
orden que pedía el informe.

## ALTO · A1 · los números del CSV vuelven a ser números

El escape de fórmulas ahora distingue **quién escribió la celda**. `numero()`
(`src/services/exportar.service.js`) devuelve el valor envuelto en una marca (`NumeroCSV`), y
`celda()` lo deja pasar tal cual. El texto que escribe la gente sigue pasando por el apóstrofe.
No abre ningún agujero: lo arma `toFixed`, así que sólo puede traer dígitos, un signo y la coma.

Mismo caso del informe (Daniel, por categoría, 2026):

```
Sueldos;1 movimiento;0,00;300000,00;-300000,00      <- antes: '-300000,00
Insumos;2 movimientos;0,00;182000,00;-182000,00
Servicios;3 movimientos;0,00;101000,00;-101000,00

suma de la columna Resultado = 315.000 = "Resultado del período" del mismo archivo
```

**Regresión de la inyección:** `=1+1`, `+HYPERLINK(...)`, `-1+2` y `@SUM(A1)` cargados como
descripción siguen saliendo con apóstrofe, y las comillas siguen escapadas.

## MEDIO · M1 · el CSV trae los totales

Arriba de la tabla, después del período, van los mismos casilleros que muestra la pantalla, como
`rótulo;número` (se pueden usar en una fórmula y no llevan apóstrofe, que era el cuidado que
pedía el informe):

```
Entró en el período;898000,00
Salió en el período;583000,00
Resultado del período;315000,00
```

Van en **las cinco vistas**, porque la pantalla los muestra arriba de todas menos la de pérdidas.
En esa va el suyo: `Se fue en mercadería;22850,00`. Dicen "del período" a propósito: en las vistas
por producto y por servicio la tabla es **un pedazo** del período, y el total no es la suma de esa
tabla. El aviso de anulados también pasó a las vistas agrupadas.

**Encontrado al corregir:** el **PDF de las vistas agrupadas tampoco traía los casilleros**
(`casilleros: []`), aunque la pantalla sí los muestra. El informe lo había verificado sólo en la
vista de movimientos. Ahora el PDF agrupado arranca con `ENTRÓ $ 898.000,00 · SALIÓ $ 583.000,00 ·
RESULTADO $ 315.000,00`. Los totales salen de `datosDelPeriodo`, la misma función de la pantalla.

## MEDIO · M2 · Bolsa de pan arranca en 6, no en −4

En `datos_de_prueba.sql` se le cargó una **compra de 10 bolsas** el día anterior a la pérdida.
Sobre una importación limpia:

```
productos con existencia < 0:  ninguno
Bolsa de pan:                  6.00 bolsa · 2 movimientos   (pantalla de Stock: "6 bolsa")
```

**El caso de demostración se mantiene:** el reporte de pérdidas sigue mostrando la salida sin
costo (`sin_costo: 1`, "No se sabe" en el PDF). Ahora la base tiene **24** movimientos de stock
(antes 23).

## BAJO · B1 · anular dinero: uno anula, los demás se enteran

Se hace igual que en stock pero más simple: el `UPDATE` lleva `AND anulado = 0` y el modelo
devuelve si cambió la fila (`affectedRows`). La base decide en un solo paso quién anuló, sin
candado ni transacción. El control previo queda para el caso común.

```
4 PUT simultáneos (marta y roberto), tres veces seguidas:
  cada vuelta: 1 x 200 "Movimiento anulado correctamente"
               3 x 400 "El movimiento ya estaba anulado"
secuencial: el segundo sigue diciendo "El movimiento ya estaba anulado"
```

## BAJO · B2 · la fecha que no existe se llama por su nombre

`src/services/periodo.service.js` separa los dos casos:

```
sin fechas / con una sola            -> "Elegí las dos fechas del período"
desde=2026-02-30  /  desde=hola      -> "La fecha de inicio no es válida"
hasta=2026-02-31                     -> "La fecha de cierre no es válida"
invertidas                           -> "La fecha de inicio es posterior a la de cierre"  (sin cambios)
```

## De paso

El *"−4 bolsa · Sin stock"* del final del informe ya no aparece: venía sólo de los datos de
prueba (M2).

## Cómo se probó

Base recreada desde cero con los dos `.sql`, servidor reiniciado (`taskkill` + `tasklist`) y
verificado en los tres niveles: `mysql.exe` para la existencia y el estado de `anulado`, `curl` y
un script de Node con `Promise.all` para la concurrencia, `pypdf` para leer el PDF, y el navegador
para Stock y Reportes (sin errores de consola). **La base quedó recreada limpia al terminar.**

**Ojo al actualizar:** cambió `datos_de_prueba.sql`, así que el grupo tiene que **recrear la
base** para ver Bolsa de pan en 6.
