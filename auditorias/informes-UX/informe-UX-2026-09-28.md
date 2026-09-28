# Auditoría de experiencia de usuario · CooperApp

**Fecha**: 28/09/2026 · **Al cerrar**: Sprints 09 y 10 (Servicios completo · Reportes completo)
**Método**: recorrido real en el navegador con los cuatro roles y las tres empresas activas,
escritorio y 375 px, más los archivos descargados abiertos por fuera de la app.
Base recreada desde cero con los dos `.sql` antes de empezar y **restaurada al terminar**.
`npm install` corrido, así que el PDF se generó de verdad.
No se tocó una sola línea de código.

> Esto busca lo que **funciona pero confunde**. Los bugs van en una línea al final.
> Lo que ya estaba decidido (HU-84, HU-85, HU-86, matrícula, etc.) no se vuelve a reportar:
> abajo hay una sección corta que dice si la solución alcanzó o no.

---

## 1. Resumen ejecutivo

**Las pantallas nuevas son las mejores del sistema. Los archivos que salen de ellas, no.**
Reportes es, de lejos, lo mejor escrito que tiene la app: *"¿De qué período?"*, *"¿Cómo querés
verlo?"*, *"Uno por uno"*, *"Lo que se perdió"*, *"¿Por qué se fue?"*. Está en el idioma de la
persona y no en el del sistema. Y la parte más difícil —explicar que la mercadería perdida **no**
está en los egresos— está resuelta con un cuidado que no se ve seguido: el aviso lo dice, los
casilleros del período se esconden en esa vista, y el producto sin costo dice *"No se sabe"* en
vez de $0. Eso hay que no romperlo. Los tres problemas grandes son otros:

**1. El archivo que se manda al contador no se sostiene solo, y en un caso miente.**
El reporte *Por producto* de La Esperanza muestra los siete productos en **$0,00**. En pantalla
hay una explicación en gris abajo de cada nombre (*"2 movimientos sin el $ cargado"*). **El PDF
la borra**: el contador recibe una hoja con el logo de la empresa, el período y siete productos
en cero, sin una palabra que diga por qué. Y en el CSV de *Lo que se perdió* los dos cortes del
mismo dinero —por motivo y por producto— quedan uno abajo del otro **en la misma columna**: quien
selecciona la columna en Excel ve **$45.700**, exactamente el doble de los $22.850 que dice el
reporte. Además el CSV no trae ningún total, y el apóstrofe que protege contra fórmulas convierte
todos los resultados negativos en texto, así que la columna no se puede sumar ni formatear. El
PDF está mucho mejor que el CSV en todo lo demás, y el CSV tiene una frase mejor que la pantalla
(dice *"no está en los egresos del balance"* en vez de *"en los totales de arriba"*). Hoy cada
uno de los tres dice una cosa distinta.

**2. El sistema no distingue un servicio que la empresa VENDE de uno que PAGA, y el reporte los
ordena juntos.** La pantalla lo dice en su propio subtítulo —*"los servicios que tu empresa presta
o contrata"*— pero no hay campo para eso: lo único que los separa es el nombre de una categoría
que cada empresa inventa. Resultado concreto: en *Cuánto deja cada servicio*, ordenado de mejor a
peor, el último es **Flete de materiales con −$18.000**, que no es un servicio que anduvo mal sino
uno que la empresa contrata. Para la pregunta que la funcionalidad existe para contestar —*¿cuál
conviene sostener?*— la respuesta que da la pantalla es la equivocada. En el celular es peor: ahí
quedan sólo dos columnas, *Servicio* y *Deja*, así que del flete se ve nada más que un número rojo.

**3. Las mismas palabras significan cosas distintas en la misma fila.** Metalúrgica tiene
**"Trabajos a terceros"** como categoría de dinero *y* como categoría de servicios, las dos con
una hija llamada **"Soldadura"**. Y tiene **"Servicios"** como categoría de egresos (donde están
la luz y el gas) mientras *Servicios* es el nombre del módulo y de la opción del menú. En la fila
de un movimiento real conviven *Categoría: Trabajos a terceros*, *Tipo: Soldadura* y
*servicio: Soldadura a domicilio*, sin nada que diga cuál es cuál. Es exactamente lo que el
`CLAUDE.md` decidió evitar —*"Productos y Servicios NO son categorías del dinero"*— deshecho por
los datos de ejemplo, que son los que el grupo va a mostrar en la defensa. Y en el formulario de
carga, abajo del botón **Salió**, la última pregunta es **"¿Salió de un servicio?"**: la misma
palabra, dos sentidos, a ocho renglones de distancia.

---

## 2. Propuesta de vocabulario

La ronda grande (HU-84) se respetó y se verificó, incluidos los mensajes del servidor. Lo que
sigue es lo que quedó afuera o apareció con los módulos nuevos. Ordenado por cuánto confunde.

| Término actual | Dónde aparece | Problema | Término propuesto | Qué hay que tocar |
|---|---|---|---|---|
| **"¿Salió de un servicio?"** | Alta de movimiento, último campo | Ocho renglones más arriba **Salió** significa *la plata se fue*. Para un ingreso, la pregunta contradice el botón que se acaba de apretar | **"¿Este movimiento es de algún servicio?"** (opcional). Neutral respecto de la dirección | Sólo pantalla |
| **"Trabajos a terceros"** / **"Servicios"** como categoría de dinero | Datos de prueba de Metalúrgica: categorías de movimiento | Chocan con la categoría de servicios homónima y con el nombre del módulo. En una fila aparecen las dos con el mismo texto | En los datos de ejemplo, renombrar las de dinero a **"Ventas de servicios"** y **"Gastos fijos"**. No es cosmético: es lo que se ve en la demo | Sólo `datos_de_prueba.sql` |
| **"Servicios contratados"** / **"Trabajos a terceros"** como categorías de servicio | Catálogo de servicios, alta y filtros | Las dos se leen para los dos lados (*¿contratado por mí o a mí?*, *¿trabajo que doy o que hago?*). Y son lo único que separa lo que se vende de lo que se paga | **"Los que ofrecemos"** y **"Los que contratamos"**. Dicen quién paga sin que haya que pensarlo | Sólo `datos_de_prueba.sql` (son categorías de la empresa) |
| **"Efecto en el stock"** / **"Efecto en el dinero"** | Motivos de stock (columnas y campos) | *Efecto* es jerga — y el recuadro verde de esa misma pantalla ya escribió la versión llana | **"Qué le hace al stock"** / **"Qué le hace al dinero"**, que es el texto que ya está arriba | Sólo pantalla *(venía del informe anterior, sigue abierto)* |
| **"¿Cuánto te cuesta perder uno?"** | Alta y edición de producto | *Uno* de qué. El queso se mide en **kilos** y su descripción dice *"Horma entera"*: quien lea "uno" puede cargar el precio de la horma y dejar todo el reporte de pérdidas mal por un factor | Interpolar la unidad: **"¿Cuánto te cuesta perder un kilo?"**, *"…una caja"*, *"…un paquete"*. El sistema ya sabe la unidad | Sólo pantalla |
| **"Falta el $"** | Historial de entradas y salidas | Sigue mostrándose **al operador**, que no entra a finanzas y no puede resolverlo. En La Esperanza sale en 5 de las 8 primeras filas | **"Sin registrar el cobro"**, y **no mostrarlo al operador** | Pantalla + un `if` de rol *(venía del informe anterior)* |
| **"ENTRÓ / SALIÓ"** | Panel *Cuánto deja cada servicio* (columnas de plata) **y** columna de dirección del listado | En la misma pantalla, arriba son importes y abajo es una etiqueta de dirección | En el panel: **"Cobramos"** / **"Pagamos"**. Deja *Entró/Salió* para la dirección | Sólo pantalla |
| **"Volver a productos"** | Botón de Motivos de stock | HU-86 movió el atajo de Motivos a **Stock**; el botón de volver sigue apuntando a Productos. Se entra por una puerta y se sale por otra | **"Volver a stock"** | Sólo pantalla |
| **"Sin stock"** sobre una existencia negativa | Stock y tablero | `Bolsa de pan` figura en **−4** con la chapita *Sin stock*. El número es imposible según las reglas del propio sistema y la etiqueta dice otra cosa | Que una existencia negativa se marque aparte (**"Revisar"**) y no como *Sin stock*. La causa está en los datos de prueba (ver bugs) | Pantalla + `datos_de_prueba.sql` |
| **"salieron 14,50"** | Reporte *Por producto*, columna Detalle | Los números van sin unidad, y en la misma columna conviven kilos, paquetes y unidades | **"salieron 14,50 kg"**. La unidad ya está en el producto | Sólo pantalla |

**Nada de esto toca la base de datos.** Cuatro de las nueve filas se arreglan en
`datos_de_prueba.sql`, que es un archivo de ejemplo: el costo es escribirlo, no migrar nada.

---

## 3. Hallazgos

### BLOQUEA

**H-01 · El PDF del reporte por producto dice que la empresa no facturó nada, y no aclara nada**
*Dónde*: Reportes → *Por producto* → Descargar en PDF. *Rol*: admin y tesorero.
En pantalla, cada producto muestra abajo del nombre el detalle *"entraron 72 · salieron 12 ·
2 movimientos sin el $ cargado"*, que es la explicación de por qué la columna de plata da $0.
**El PDF no incluye esa columna.** El archivo que sale tiene el nombre de la empresa, el período,
siete filas de producto y **$ 0,00** en las tres columnas de dinero, sin una sola palabra de
explicación ni el aviso del movimiento anulado que sí aparece en las otras vistas.
*Por qué confunde a este usuario*: es el único documento que sale del sistema y se lee lejos de
él. Quien lo recibe no tiene cómo saber que el cero significa *"esas ventas todavía no tienen el
cobro cargado"* y no *"no se vendió nada"*. Y quien lo manda tampoco se entera, porque en su
pantalla la explicación estaba.
*Qué proponer*: (a) llevar la columna *Detalle* al PDF, como ya la lleva el CSV; (b) cuando
**todas** las filas dan $0, un aviso arriba de la tabla, en el archivo y en la pantalla:
*"Ninguna de las salidas de este período tiene el cobro cargado, por eso todas las filas dan $0.
El dinero de una venta se carga desde Stock, al registrar la salida."*; (c) repetir el aviso de
anulados en las cinco vistas, como ya se hace en pantalla.
*Costo*: chico.

**H-02 · El CSV de pérdidas suma el doble si alguien selecciona la columna**
*Dónde*: Reportes → *Lo que se perdió* → Descargar para Excel.
El archivo pone los dos cortes uno abajo del otro **en la misma columna "Cuánto costó"**:
primero *Por qué se fue* (Pérdida 19.250 + Consumo interno 3.600) y después *Qué se fue*
(Queso 16.400 + Arroz 3.600 + Fideos 2.850). Los dos suman $22.850 cada uno, así que la columna
entera suma **$45.700**. Lo único que los distingue es una columna *Bloque* a la izquierda.
*Por qué confunde*: seleccionar una columna y mirar la suma abajo es lo primero que hace
cualquiera en Excel. El reporte dice $22.850 y el archivo del mismo reporte dice $45.700.
*Qué proponer*: dos archivos, o —más simple y sin cambiar el botón— **una fila de TOTAL al final
de cada bloque y dos filas en blanco entre ellos**, más una línea de encabezado por bloque. Y
poner el total del reporte ($22.850) como fila propia, que hoy no está en ningún CSV.
*Costo*: chico.

### HACE PERDER TIEMPO

**H-03 · El ranking de servicios mezcla lo que la empresa vende con lo que paga**
*Dónde*: Movimientos → *Cuánto deja cada servicio*, y Reportes → *Por servicio*. *Rol*: tesorero y admin.
Ordenado por resultado, queda: Soldadura $152.000 · Corte $130.000 · tres en $0 ·
**Flete de materiales −$18.000**. El flete es un servicio que Metalúrgica **contrata**, no uno
que ofrece. La tabla no muestra la categoría, así que nada lo distingue.
*Por qué confunde a este usuario*: la pantalla existe para contestar *"¿cuál conviene sostener?"*,
y lo que muestra abajo de todo, en rojo, es algo que no se puede dejar de ofrecer porque no se
ofrece. En el celular la tabla se reduce a *Servicio* y *Deja*, o sea justo a la columna que
confunde las dos cosas.
*Qué proponer*: partir la tabla en dos bloques con el mismo estilo que usa *Lo que se perdió* para
sus dos cortes: **"Lo que ofrecemos"** y **"Lo que contratamos"**, cada uno con su orden. Los
datos ya alcanzan: la categoría del servicio está cargada. Si se prefiere no tocar la estructura,
como mínimo **mostrar la categoría** en una columna. *(La alternativa —un campo "lo ofrecemos / lo
contratamos" en el servicio— es funcionalidad nueva y queda fuera del alcance de esta auditoría.)*
*Costo*: medio.

**H-04 · La pregunta "¿cuánto dejó el mes pasado?" cae en la única pantalla sin atajos de período**
*Dónde*: Movimientos, panel de servicios. *Rol*: tesorero.
Reportes tiene *Este mes / El mes pasado / Este año / Otras fechas*, que es de lo mejor que tiene
la app. El panel *Cuánto deja cada servicio* vive en **Movimientos**, que sólo tiene *Desde* y
*Hasta* a mano. Para contestar *"¿cuánto nos dejó la soldadura el mes pasado?"* hay que escribir
dos fechas.
*Qué proponer*: los mismos tres botones en el filtro de Movimientos. El servicio que calcula las
fechas y arma la etiqueta ya existe (`periodo.service.js`) y lo usa Reportes.
*Costo*: chico.

**H-05 · En el celular hay que bajar tres cuartos de pantalla antes de ver el primer dato**
*Dónde*: Stock y Servicios. *Rol*: operador y admin. **Medido a 375 px**:

| Pantalla | Primer dato aparece en | Alto de pantalla |
|---|---|---|
| Stock | **y = 653 px** | 812 px |
| Servicios | **y = 716 px** | 812 px |

Ninguna tabla se corta de costado —`tabla-mobile.css` funciona y las cinco vistas de Reportes
también entran (309 px en 309)—, pero el encabezado, el título verde y el bloque de filtros se
comen la pantalla entera antes de la primera fila.
*Qué proponer*: es lo que ya estaba **medido y sin decidir** en el informe anterior. Confirmado y
un poco peor en Servicios. Colapsar los filtros detrás de un botón *"Filtros"* por debajo de
768 px recupera ~290 px. Como es el mismo bloque en cinco pantallas, conviene una clase compartida,
igual que se hizo con `tabla-mobile.css`.
*Costo*: medio (una vez, para todas).

**H-06 · Los botones de descarga están antes de los números que uno viene a mirar**
*Dónde*: Reportes, en celular. A 375 px los dos botones quedan entre el título y el primer
casillero, que aparece recién en **y = 723 px**; la primera fila de la tabla, en **y = 1170**.
*Por qué confunde*: uno entra a Reportes a *mirar*, no a descargar. La decisión de mandar el
archivo viene después de ver el número, no antes.
*Qué proponer*: en celular, los dos botones abajo de los casilleros de totales (o al final).
*Costo*: chico.

### GENERA DUDA

**H-07 · Las cuatro vistas no dicen que son la misma plata, y una de ellas no lo es**
*Dónde*: Reportes, selector *¿Cómo querés verlo?*. *Rol*: admin y tesorero.
Los cuatro botones se ven iguales: *Uno por uno · Por categoría · Por producto · Lo que se perdió*.
Los tres primeros son el mismo dinero del mismo período agrupado distinto —y se verificó que
cierran: $398.000 + $200.000 = $598.000, los egresos $180.000 + $90.000 + $47.000 = $317.000—.
**El cuarto es otra cosa**: mercadería, que a propósito no suma con el resto.
Pasar de *Uno por uno* a *Por categoría* deja los tres casilleros **exactamente iguales**, que es
la prueba de que cierran, pero nada lo dice: quien no se fija puede pensar que la página no se
actualizó, y quien mira *Por producto* ve $598.000 arriba y $0 en todas las filas.
*Qué proponer*: separar el cuarto botón del grupo —una línea y un rótulo propio, *"Además:"*— y
poner bajo los tres primeros una línea: *"Las tres son la misma plata del período, ordenada de
distinta manera."*
*Costo*: chico.

**H-08 · El aviso más importante del sistema señala algo que en esa pantalla no está**
*Dónde*: Reportes → *Lo que se perdió*.
El aviso dice: *"**Esta plata no está en los totales de arriba.** Los egresos son plata que salió
de la caja; esto es mercadería que se fue sin venderse…"*. Pero en esa vista **los casilleros de
totales están escondidos**, justamente para que nadie los reste. Así que el aviso apunta a un
lugar vacío y hay que acordarse de la otra solapa para entenderlo.
Lo llamativo: **el CSV y el PDF ya dicen la frase correcta** — *"Esta plata NO está en los egresos
del balance"*. La versión buena existe, sólo que no es la que está en pantalla.
*Qué proponer*: usar en la pantalla el texto que ya usan los archivos. Es copiar una frase de un
lado al otro.
*Costo*: chico.

**H-09 · Dar de baja un servicio no dice qué pasa con la plata que ya generó**
*Dónde*: Servicios → Dar de baja. *Rol*: admin.
El cartel dice: *"No se borra: deja de estar disponible para operar, pero sigue en el listado y se
puede reactivar cuando quieras."* Correcto sobre el servicio; **no dice nada sobre los movimientos**.
Se verificó que el comportamiento es el bueno: *Soldadura a domicilio* quedó como
**"(de baja)"** en el panel y **conservó sus $226.000**. Sólo que el admin no lo sabe al decidir.
*Por qué confunde*: quien está por dar de baja el servicio que trajo $226.000 necesita saber que
no se lleva la historia con él. En un sistema de plata, *"no se borra"* a secas no alcanza.
*Qué proponer*: una línea más: *"Los movimientos que ya cargaste siguen mostrando este servicio y
siguen contando en los reportes."*
*Costo*: chico.

**H-10 · "No se sabe" se convierte en una celda vacía en el CSV**
*Dónde*: Reportes → *Lo que se perdió* → Descargar para Excel.
En pantalla y en el PDF, `Bolsa de pan` dice **"No se sabe"** — que es el punto entero de la
decisión de diseño. En el CSV esa celda sale **vacía**. En Excel una celda vacía en una columna de
plata se lee como nada, y si alguien suma la columna aporta cero en silencio.
*Qué proponer*: escribir `No se sabe` también en el CSV. Que quede como texto está bien: es lo que
es.
*Costo*: chico.

**H-11 · En el reporte agrupado, los resultados negativos son texto y no números**
*Dónde*: los CSV de *Por categoría*, *Por producto* y *Por servicio*.
La protección contra fórmulas antepone un apóstrofe a todo lo que empieza con `-`, y en estos
archivos eso es **cada resultado negativo**: `'-180000,00` (verificado en los bytes: `27 2d`).
En Excel eso deja la columna *Resultado* como texto, así que no se puede sumar ni formatear.
*Por qué confunde*: el botón dice *"Descargar para Excel"*. La protección es correcta para lo que
escribe la gente (nombres, descripciones); aplicada a un número calculado por el sistema no
protege de nada, porque `-180000` no puede ser una fórmula.
*Qué proponer*: escapar sólo los campos de texto y dejar los numéricos sin tocar.
*Costo*: chico.

**H-12 · El reporte vacío de una empresa nueva la manda a probar otros períodos**
*Dónde*: Reportes, empresa recién aprobada. *Rol*: admin.
Con Huerta Norte recién aprobada: tres casilleros en $0,00 y la tabla dice
*"No hubo movimientos en este período. Probá con otro."* Pero **no hay ningún período con algo**:
la empresa nunca cargó nada. La persona va a probar los tres botones y volver al mismo cartel.
*Por qué confunde*: la app ya sabe hacer esta distinción en otro módulo — en Stock separa
*"Sin cargar"* (nunca tuvo movimientos) de *"Sin stock"* (tuvo y quedó en cero), y esa decisión
está documentada como una de las buenas del Sprint 08. Acá falta la misma idea.
*Qué proponer*: si la empresa no tiene **ningún** movimiento cargado: *"Todavía no cargaste ningún
movimiento. Cuando registres el primero vas a poder ver acá cómo te fue en el mes."* + botón
*"Registrar el primero"*. Dejar *"Probá con otro"* para cuando sí hay movimientos fuera del período.
*Costo*: chico.

**H-13 · Al operador no se le dice a quién pedirle el reporte**
*Dónde*: Reportes. *Rol*: operador.
Dice *"Tu usuario no tiene acceso a los reportes de la empresa."* Dice qué, no dice qué hacer.
La corrección equivalente ya se aplicó en otra pantalla —el alta de producto ahora dice *"¿Falta
la categoría que necesitás?"* con salida—, así que el patrón existe.
*Qué proponer*: *"Los reportes los ven el administrador y el tesorero de tu empresa. Si necesitás
uno, pedíselo."*
*Costo*: chico.

**H-14 · "¿Cuánto te cuesta perder uno?" no dice de qué unidad habla**
*Dónde*: Productos, alta y edición. *Rol*: admin.
El texto de ayuda es de lo mejor de la app: *"Lo que te costó a vos una unidad, no lo que la
vendés. Sirve para saber cuánta plata te llevan las roturas y los faltantes. Si no lo sabés,
dejalo vacío."* Contesta las tres preguntas. Pero el campo dice **"uno"** y el queso se mide en
**kilos**, con la descripción *"Horma entera"* debajo. Quien cargue el precio de una horma en vez
del de un kilo deja mal todo el reporte de pérdidas y nada se lo avisa.
*Qué proponer*: interpolar la unidad en la etiqueta y en la ayuda.
*Costo*: chico.

### MOLESTA

**H-15 · El menú principal se parte en dos líneas.** Con Servicios y Reportes prendidos, el admin
tiene 8 opciones más *Configuración* y el nombre del usuario: a 1024 px el menú **envuelve** y
*Reportes* y *Configuración* caen a un segundo renglón. En Servicios los tres botones del
encabezado también se parten. → Es el precio de haber sumado dos módulos; conviene mirarlo antes
de sumar Articulación, que agrega el noveno. *Costo*: medio.

**H-16 · El panel de servicios repite información que ya está en el reporte.** *Cuánto deja cada
servicio* (en Movimientos) y *Totales por servicio* (en Reportes) son la misma tabla con las
mismas columnas. No está mal tener dos puertas, pero conviene decidir cuál es la principal: hoy
la de Movimientos es la que tiene el atajo desde Servicios, y la de Reportes es la que se puede
descargar. *(a validar con usuarios)* *Costo*: chico si se decide, medio si se unifica.

**H-17 · Detalles.** El botón de limpiar filtros de Movimientos sigue siendo un ícono verde sin
rótulo mientras en Stock, Productos, Servicios y Reportes el mismo botón dice *"Limpiar filtros"*
· la columna *Acciones* se muestra llena de guiones para los roles que sólo leen (el tesorero en
Servicios) · el desplegable de servicios del alta de movimiento va ordenado por categoría sin
mostrarla, así que parece desordenado — es el mismo patrón que ya estaba anotado para productos ·
en el reporte por producto los números del detalle van sin unidad.

---

## Lo que ya estaba decidido: ¿alcanzó?

| Decisión | ¿Se respetó? |
|---|---|
| **HU-84, vocabulario** | **Sí, y también en el servidor.** Verificado por `curl`: *"Servicio dado de baja"*, *"Servicio reactivado"*, *"Producto dado de baja"*, *"Movimiento anulado correctamente"*, *"Categoría dada de baja (sus tipos también)"*. Era el punto que casi se escapa la vez pasada y esta vez está bien |
| **"Naturaleza" fuera de la vista** | **Sí.** *"¿Qué pasó con la plata?"* con dos botones, la columna *Entró / Salió* y el filtro *Mostrar*. La palabra no se filtró a ninguna pantalla nueva. Lo único que quedó cerca es *"¿Salió de un servicio?"* (ver vocabulario) |
| **HU-85, listados en el celular** | **Sí, y lo nuevo lo heredó gratis.** Medido: las cinco vistas de Reportes a 309 px en 309, Servicios y Stock a 343 en 343, el panel de servicios baja solo a dos columnas. **Ninguna tabla se corta.** Es el mejor ejemplo de que escribir el arreglo como patrón compartido funcionó |
| **HU-86, configuración junta** | **Sí**, y con Servicios adentro el desplegable quedó en cinco opciones, todavía legible. Una sola cosa quedó a mitad de camino: *Motivos* se movió de Productos a Stock pero su botón de volver sigue diciendo *"Volver a productos"* |
| **Módulos sin pantalla** | **Sí.** No quedó un solo `href="#"`: Articulación va a la pantalla de en construcción y Reportes ya tiene la suya |
| **Los tres atajos de período** | **Sí, y son de lo mejor de Reportes.** Lo que falta es que existan también en Movimientos (H-04) |
| **Pérdidas fuera del balance** | **Casi.** La decisión se respetó entera —aviso, casilleros escondidos, *"No se sabe"*— pero el texto de la pantalla apunta a los casilleros que esa misma vista esconde (H-08) |
| **Filtros que ocupan una pantalla en el celular** | **Sigue abierto**, y medido: 653 px en Stock, **716 px en Servicios** (H-05) |
| Lo que fue al backlog el 16/09 (HU-87/88) | **Sigue abierto**, como estaba previsto: los tres casilleros de plata en blanco para el operador, las flechas ↓/↑ invertidas, el aviso de anular sin fecha, el orden de los desplegables, *"Falta el $"* al operador, el porcentaje absurdo (*"+1334% vs mes anterior"*) |

---

## Lo que está bien resuelto (no romperlo)

- **Toda la pantalla de Reportes.** *"¿De qué período?"* / *"¿Cómo querés verlo?"* / *"Uno por
  uno"* / *"¿Por qué se fue?"* / *"¿Qué se fue?"* / *"Quedó a favor"* / *"Quedó igual"*. Es la
  primera pantalla del sistema donde no hay que traducir una sola palabra. Y *"Descargar para
  Excel"* en vez de *"Descargar CSV"* es exactamente la decisión correcta para este público.
- **El aviso de los anulados**: *"un movimiento anulado es uno que no pasó"*. Explica un concepto
  contable en siete palabras.
- **"No se sabe" en vez de $0** para un producto sin costo, con el motivo al lado (*"sin costo
  cargado"*) y qué hacer arriba (*"Cargales el costo desde Productos"*). Es la decisión más fina
  del módulo y en pantalla y en PDF está perfecta.
- **Esconder los casilleros del período en la vista de pérdidas.** Es una decisión de diseño que
  cuesta explicar y previene el error más caro que puede cometer quien lea el reporte.
- **"Sin movimientos en el período"** debajo de cada servicio en cero. Contesta sola la pregunta
  *¿este cero es "no movió nada" o "empató"?*, que es la que más cuesta.
- **El PDF**: totales, avisos, montos con signo, pie con empresa, período, fecha de generación y
  *"hoja 1 de 1"*. Se sostiene solo. El nombre del archivo con empresa y período también.
- **El formulario de servicio**: no pregunta unidad ni stock mínimo, y ofrece *"¿Falta la
  categoría que necesitás? Agregala acá"*, que es la corrección H-04 del informe anterior aplicada
  y extendida.
- **El servicio dado de baja que sigue en el panel marcado "(de baja)"** con su plata intacta.
- **El tesorero en Servicios**: ve la lista y *Cuánto deja cada uno*, sin un solo botón de edición.
  Cada rol ve su parte.
- **Productos y Servicios se distinguen** (título, ícono, y las columnas *Unidad* y *Stock mínimo*
  que sólo tiene Productos), así que la tarea 20 no encontró el problema que se temía.

---

## 4. Plan sugerido

**Antes de seguir con Articulación** (que suma la novena opción al menú y otra pantalla que copia
patrones). Los cuatro primeros son todos "chico" y son los que más daño evitan.

1. **Arreglar lo que sale en los archivos** (H-01, H-02, H-10, H-11): la columna *Detalle* y el
   aviso en el PDF por producto, los totales y la separación de bloques en el CSV, *"No se sabe"*
   en el CSV, y escapar sólo texto. Es lo único del sistema que se lee sin la app al lado.
2. **Poner en la pantalla la frase que ya usan los archivos** (H-08): *"no está en los egresos del
   balance"*. Una línea.
3. **Separar el cuarto botón de las vistas** y decir que las tres primeras son la misma plata (H-07).
4. **Renombrar en `datos_de_prueba.sql`** las categorías que chocan: *Trabajos a terceros* y
   *Servicios* del lado del dinero, y *Servicios contratados* / *Trabajos a terceros* del lado de
   los servicios. Es el archivo de la demo: hoy enseña lo contrario de lo que el proyecto decidió.
5. **"¿Este movimiento es de algún servicio?"** en vez de *"¿Salió de un servicio?"* (vocabulario).
6. **Partir el ranking de servicios en dos bloques** (H-03), reusando el patrón de dos cortes que
   ya tiene *Lo que se perdió*.
7. **Los tres atajos de período en Movimientos** (H-04), reusando `periodo.service.js`.

**Puede esperar al Sprint 13.**

8. **Los filtros colapsables en el celular** (H-05), como clase compartida para las cinco
   pantallas — mismo criterio que `tabla-mobile.css`. Y los botones de descarga abajo (H-06).
9. **Los avisos que faltan**: qué pasa con la plata al dar de baja un servicio (H-09), a quién
   pedirle el reporte (H-13), el reporte vacío de la empresa nueva (H-12), la unidad en el campo
   de costo (H-14).
10. **Lo que quedó del informe anterior** (HU-87/88) más los detalles de H-17 y el botón *"Volver
    a productos"* de Motivos.

---

## A validar con usuarios reales

- **Lo más importante de todo**: si alguien que recibe el PDF de *Lo que se perdió* entiende que
  esos $22.850 no se restan del balance. El aviso está bien escrito, pero es un párrafo, y el
  número está en rojo y grande. No hay forma de saber desde un chat si el párrafo gana.
- Si *"Deja"* se entiende como *"lo que te quedó"*, y si un número negativo ahí se lee como
  *"perdimos plata con ese servicio"* o como *"eso lo pagamos nosotros"*.
- Si *"Uno por uno"* se entiende sin explicación (yo diría que sí, pero es una apuesta).
- Si alguien con un negocio chico sabe cuánto le cuesta un kilo de queso, o si el costo de
  referencia va a quedar vacío en la práctica y el reporte de pérdidas siempre va a decir
  *"y algo más"*.
- Si separar *"lo que ofrecemos"* de *"lo que contratamos"* es algo que la gente ya tiene en la
  cabeza, o si mezclarlos no les molesta tanto como me parece a mí.

---

## Bugs encontrados de paso (no es el foco de esta auditoría)

- **`datos_de_prueba.sql` deja `Bolsa de pan` en existencia −4.** Le carga una *Pérdida* de 4
  bolsas sin ninguna entrada previa. La API rechaza una salida que deje el stock en negativo, así
  que es un estado que el sistema no permite crear pero que sus propios datos de ejemplo crean. Se
  ve en el tablero y en Stock apenas se entra, con la chapita *Sin stock* sobre un número
  negativo. Encima es el producto que la demo usa para mostrar *"No se sabe"* en el reporte de
  pérdidas, o sea que el caso más lindo del módulo está apoyado en un dato imposible.
- El CSV escribe `'-180000,00` con el apóstrofe visible (ver H-11): funcionalmente es la
  protección contra inyección de fórmulas haciendo su trabajo sobre un campo donde no hace falta.
- Los botones de descarga quedan habilitados en un reporte vacío: bajan un archivo con cero filas.
