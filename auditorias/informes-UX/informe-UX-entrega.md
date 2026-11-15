# Auditoría de experiencia de usuario · CooperApp · entrega

**Fecha**: 14/11/2026, a la noche · **Al cerrar**: el cuatrimestre, después de la revisión grande
del 14/11 (commit `453f870`: `comun.css`, la tablet, botones con texto, Productos y Servicios en
una sola página).
**Foco**: de punta a punta. Las 36 tareas del prompt con cada rol, todo "Qué mirar", las tres
medidas (375, 800 y 1280 px) en cada pantalla y los archivos que salen (CSV abierto en Excel de
verdad y el PDF).

**Método**:
- Las tareas, en el navegador, como cada persona: Silvia (operadora), Roberto (tesorero) y Marta
  (admin) de La Esperanza; Osvaldo (admin) y Daniel (tesorero) de Metalúrgica; el superadmin; y
  Elena, admin de Huerta Norte recién aprobada.
- Las medidas, con un script propio que maneja Edge sin ventana y **mide** cada pantalla con cada
  rol a 1280, 800 y 375 px (54 pantallas): ancho de cada tabla contra su contenedor, cualquier
  elemento que se pase del borde, barras de desplazamiento, píxel del primer dato, alto de la
  franja de título, textos de menos de 13 px y botones sin texto. Más capturas de cada una.
- Los CSV se abrieron con **Excel 16 por COM** (separador de lista `;`, decimal `,`) leyendo celda
  por celda qué tipo le asignó Excel a cada valor. Los PDF se abrieron en el visor de Edge y se
  leyó el texto con `pypdf`.
- Los mensajes del servidor, por `curl`, además del toast en pantalla.

**Entorno**: copia aparte, base `cooperApp_ux` (creada desde copias de los dos `.sql`) y la app en
el puerto 3002, siempre por `127.0.0.1`. La base `cooperApp` y el puerto 3000 de QA no se tocaron.
Al terminar se borró `cooperApp_ux` y se cerró ese proceso. No se tocó código ni se commiteó nada.

> Busca lo que **funciona pero confunde**. Los bugs van en una línea al final.
> Lo ya decidido no se vuelve a reportar; donde la solución **no alcanzó**, se dice.
> Los hallazgos van numerados **E-01 a E-29** (E de *entrega*), para no confundirlos con los F-xx
> del informe final ni con los H-xx de los anteriores.

---

## 1. Resumen ejecutivo

**La app se entiende mucho mejor que en septiembre, y casi todo lo que el prompt pedía mirar
está bien resuelto.** La venta y la compra en un paso, el alta de un movimiento con *Entró /
Salió*, el *Anular y corregir* de Movimientos (que ahora sí aclara que si cancelás no pasó nada),
los *Primeros pasos* de una empresa nueva, el reporte vacío, el aviso de *Lo que se perdió* en
pantalla, el *"No se sabe"* de la bolsa de pan, la ficha de empresa (*"CooperApp no manda
mensajes"* con *Escribir un email* y *Llamar*) y el superadmin se usan sin ayuda. **Ninguna de las
54 pantallas tiene scroll de costado** a 375, 800 ni 1280 px, y todas usan la misma letra. Los tres
problemas que quedan son de otro tipo:

**1. Un reporte que dice "es la misma plata" y no lo es.** En Reportes, abajo de *Uno por uno /
Por categoría / Por producto / Por servicio* dice *"Son la misma plata del período, ordenada de
distinta manera"*. Para *Por categoría* es cierto. Para *Por producto* no: arriba dice *Entró
$ 1.036.850* y la tabla suma $ 438.850, porque sólo lista la plata que vino de ventas y compras de
mercadería. Y la tabla muestra el **Queso cremoso con −$ 146.750**, cuando en el depósito quedan
23,5 kg que ya se pagaron: compraste más de lo que vendiste en el mes, no perdiste plata con el
queso. Una dueña que mira esa pantalla saca la conclusión de que el queso le hace perder plata y
deja de comprarlo. Es la pregunta 23 del prompt, y la respuesta es *"parecen reportes que no
cierran entre sí"*.

**2. Corregir algo está escondido detrás de la palabra que dice que no tiene vuelta.** En
Movimientos el botón de cada fila dice **"Anular o corregir"**. En Stock → *Entradas y salidas*
dice sólo **"Anular"**, y *Anular y corregir* aparece recién en el cartel. La regla decidida en
HU-84 es justamente que *Anular* no se deshace: Silvia, que vino a *arreglar* la carga de recién,
no tiene por qué apretar el botón que dice que va a romper algo. Y al tesorero le pasa algo peor:
si el movimiento mal cargado es la plata de una venta, el cartel le dice *"corregila desde Stock →
Entradas y salidas → Anular y corregir"*, pero **Roberto no tiene Stock**. Sólo puede *Sólo anular*,
que deja la venta *"Sin registrar el cobro"*. No puede terminar la tarea 9 sin que alguien le
explique a quién pedírsela.

**3. La tablet (800 px) quedó a medio camino, justo en el Panel.** Desde el 14/11 la tablet se ve
como el celular, y las pantallas con `tabla-mobile.css` andan bien. Pero el **Panel**, que es lo
primero que se abre, no: las tablas *Movimientos recientes* y *Alertas de stock* miden 360 px en
326 y **cortan la fecha a "14/" y el estado a "Sin stoc"**; la franja de *Acciones rápidas* se pasa
8 px del borde; el círculo con las iniciales mide 14 × 30 px (un óvalo con *MG* saliéndose). Y en
**Servicios** la franja de título mide **263 px**: el subtítulo queda en una columna de una palabra
por renglón porque los tres botones le comen el ancho. Es exactamente el error que se repite: una
tabla que no usa la hoja compartida.

---

## 2. Propuesta de vocabulario

Ordenada por cuánto confunde hoy. *Ajuste positivo / negativo* no está: sigue abierto a propósito
(ver la nota al final de la tabla).

| Término actual | Dónde aparece | Problema | Propuesto | Qué hay que tocar |
|---|---|---|---|---|
| **"Anular"** como único botón de cada fila | Stock → *Entradas y salidas* | En Movimientos el mismo botón dice *Anular o corregir*. Acá, quien quiere arreglar no encuentra la palabra | **"Anular o corregir"**, igual que Movimientos | Sólo pantalla (`stock.html`) |
| **"Son la misma plata del período, ordenada de distinta manera"** | Reportes, abajo de las vistas | Falso para *Por producto* y *Por servicio*, que son una parte | Que el texto cambie con la vista: *"Por producto: sólo la plata de ventas y compras de mercadería. Sueldos, luz y lo demás no aparecen acá."* | Sólo pantalla |
| **"dinero"** | Motivos de stock (subtítulo, pregunta *¿Qué le hace al dinero?*, columna, aviso); formulario de Stock (*"Este motivo no mueve dinero."*) | Todo el resto dice **plata**, y adentro de la misma pantalla conviven *"le hace al dinero"* y *"entra plata"* | **plata** (*"¿Qué le hace a la plata?"*, *"Este motivo no mueve plata."*) | Sólo pantalla |
| **"egresos del balance"** | CSV y PDF de *Lo que se perdió* | La pantalla ya dice *"lo que salió del balance"*; el archivo, que es lo que lee el contador, quedó con la palabra vieja | El mismo texto que la pantalla | Código (el texto lo arma el servidor) |
| **"Existencia"** | Columna de Stock; mensajes del servidor (*"la existencia real"*) | La pestaña dice *Cuánto hay*; *existencia* es palabra de contador | Columna **"Hay"**; en los mensajes, *"lo que hay de verdad en el depósito"* | Pantalla y mensajes del servidor |
| **"Contraseña temporal" / "Contraseña inicial" / "Volver a la contraseña inicial"** | Usuarios (estado, botón, alta), superadmin | Tres nombres para lo mismo. El alta dice *"La contraseña temporal será el DNI"*, el botón dice *Contraseña inicial* | Una: **contraseña inicial** (estado: *"Con la contraseña inicial"*) | Sólo pantalla (el toast del alta lo arma el servidor) |
| **"Operador" / "Tesorero"** (sin explicar) | Usuarios → *Nuevo usuario* → Rol | La tarea es *"dar de alta a alguien del depósito"* y ninguna opción dice *depósito* | Mantener los nombres y agregar qué hace: *"Operador (depósito: productos y stock)"*, *"Tesorero (la plata: movimientos y reportes)"* | Sólo pantalla |
| **"movimiento(s)"** en Stock | Historial (*"4 movimientos"*), formulario (*"después del movimiento queda…"*) | Lo decidido es que en Stock se dice *entradas y salidas*; *Movimientos* a secas es la plata | *"4 entradas y salidas"*, *"después de esta salida quedan…"* | Sólo pantalla |
| **"Otros ingresos"** (categoría) | Categorías de movimientos, filtros, reportes, CSV | Es un dato sembrado, pero lo ve todo el mundo y trae la palabra que se sacó de la vista | **"Otra plata que entra"** u **"Otras entradas"** | `datos-iniciales.js` y `datos_de_prueba.sql` (sin cambio de esquema). Las empresas ya creadas lo renombran a mano |
| **"tipo de movimiento"** | Servidor: *"El tipo de movimiento no es válido"* | El formulario pregunta *"¿En qué se fue la plata?"* | *"Elegí en qué se fue (o de qué fue) la plata"* | Servidor |
| **"Seleccioná" / "Elegí"**, **"Solo" / "Sólo"** | *Seleccioná un rol...* (Usuarios) contra *Elegí…* en todo lo demás; *Solo los que faltan* (Stock) contra *Sólo lo que entró* (Movimientos) | Pulido | *Elegí un rol*; una sola forma de *sólo* | Sólo pantalla |

**Sobre *Ajuste positivo / negativo*** (abierto a propósito): sumo una observación. En la tarea 1
(*"llegaron 20 kg de queso"*), si la persona no sabe cuánto se pagó, el único motivo de entrada
que le queda en *Otra entrada o salida* es **Ajuste positivo**. O sea: hoy *"ajuste"* es también
la puerta para *"entró mercadería que no compré yo"* (una devolución, algo que trajo el dueño).
Vale la pena llevar esa situación a la prueba con usuarios.

---

## 3. Hallazgos, ordenados por severidad

### BLOQUEA

**E-01 · El tesorero no puede corregir la plata de una venta, y el cartel lo manda a una pantalla
que no tiene.**
- **Dónde**: Movimientos, rol tesorero (Roberto). Cualquier fila que venga de una venta o una compra
  de Stock (*"Venta: 10 cajas de Milanesas de soja"*).
- **Qué pasa**: el botón de la fila dice *Anular o corregir*. El cartel dice: *"Esta plata es de
  una venta registrada en Stock. Si te equivocaste en el precio o la cantidad, corregila desde
  Stock → Entradas y salidas → Anular y corregir"*, y ofrece *Cancelar* y *Sólo anular*. Roberto no
  tiene Stock en el menú; si escribe la dirección, ve *"Tu usuario no tiene acceso al stock"*.
- **Por qué confunde a este usuario**: la tarea 9 es *"cargué mal un movimiento ayer, corregilo"*.
  El tesorero hace lo que dice el cartel, no encuentra Stock, y la única salida es *Sólo anular*,
  que deja la venta en Stock como *"Sin registrar el cobro"*: un problema nuevo que él no ve.
- **Propuesta**: según quién mira.
  - Para el tesorero: *"Esta plata es de una venta de Stock y se corrige desde ahí, junto con la
    mercadería. Pedíselo a quien la cargó (Silvia Ferreyra) o al administrador. Si la anulás acá,
    la venta queda sin cobrar."*
  - El botón de esas filas: **"Anular"** a secas para quien no puede corregirla.
- **Cuesta**: chico (un texto según el rol, en `movimientos.html`).

### GENERA DUDA

**E-02 · "Por producto" no cierra con los casilleros de arriba, y un negativo parece una pérdida.**
- **Dónde**: Reportes → *Por producto* (y en menor medida *Por servicio*). Admin y tesorero.
- **Qué pasa**: los casilleros dicen *Entró $ 1.036.850 · Salió $ 935.900*. La tabla de productos
  suma $ 438.850 y $ 586.900. Arriba sigue diciendo *"Son la misma plata del período, ordenada de
  distinta manera"*. Y el resultado por producto mezcla **comprar para tener stock** con
  **perder plata**: *Queso cremoso: entraron 40 kg · salieron 16,5 kg — Resultado −$ 146.750*.
  Lo mismo el Jamón (−$ 70.500) y el Agua (−$ 64.800). En el CSV y el PDF, igual.
- **Por qué confunde a este usuario**: *"¿qué producto me conviene?"* es la pregunta con la que
  alguien entra a esa vista. El número que contesta dice que los tres productos que más se venden
  dan pérdida. Y como la frase de arriba dice que es la misma plata, la diferencia con los
  casilleros se lee como un error del sistema.
- **Propuesta**: dos textos.
  - En lugar de la frase general, en esta vista: *"Acá sólo está la plata de lo que vendiste y
    compraste de cada producto. Sueldos, luz y lo demás no aparecen, por eso no suma lo de
    arriba."*
  - Arriba de la tabla: *"Si en el período compraste más de lo que vendiste, el resultado da
    negativo aunque la mercadería siga en el depósito: no es plata perdida. Lo que se perdió de
    verdad está en «Lo que se perdió»."*
  - Mismo aviso en el CSV y el PDF.
  - Y **a validar con usuarios**: si *"Resultado"* es la columna correcta para esta vista. Quizás
    *"Vendido"* y *"Comprado"*, sin resta, contestan mejor la pregunta.
- **Cuesta**: chico (textos); medio si se cambia la columna.

**E-03 · En Stock, corregir está escondido detrás de "Anular".**
- **Dónde**: Stock → *Entradas y salidas*. Operador y admin.
- **Qué pasa**: cada fila tiene un solo botón, **Anular**. Recién en el cartel aparecen *Anular y
  corregir* y *Sólo anular*. En Movimientos la misma situación tiene **"Anular o corregir"** en la
  fila.
- **Por qué confunde a este usuario**: la tarea 5 es *"me equivoqué en la carga de recién,
  arreglala"*. HU-84 le enseñó a Silvia que *Anular* no se deshace. Para encontrar el arreglo tiene
  que apretar justo el botón que dice que no hay vuelta atrás. Es la misma acción con dos nombres
  en dos pantallas.
- **Propuesta**: **"Anular o corregir"** en la fila, como en Movimientos. El cartel ya está bien.
- **Cuesta**: chico (`stock.html`).

**E-04 · Al corregir una compra, el formulario dice "Hay 5,5 kg" y la tabla de atrás dice 25,5.**
- **Dónde**: Stock → *Anular y corregir* sobre una compra o una venta.
- **Qué pasa**: el formulario calcula lo que habría **sin** el movimiento que se corrige. Es la
  cuenta correcta, pero se escribe igual que en un alta: *"Queso cremoso (hay 5,5 kg)"* y *"Hay
  5,5 kg · después de la compra va a haber 25,5 kg"*. Atrás, la tabla dice **25,5 kg**.
- **Por qué confunde a este usuario**: parece que el sistema perdió 20 kg al abrir el formulario.
- **Propuesta**: en modo corrección, *"Sin esta compra quedan 5,5 kg. Con la corrección va a haber
  25,5 kg."*
- **Cuesta**: chico.

**E-05 · El aviso de la venta no dice que la plata ya quedó cargada.**
- **Dónde**: Stock → *Registrar una venta*, admin (la tarea 13 pregunta justamente esto).
- **Qué pasa**: el toast dice *"Venta registrada: 2 kg de Queso cremoso por $ 25.000,00. Quedan 23,5
  kg."* y desaparece a los 6 segundos. En ningún momento, ni antes ni después, dice que esos
  $ 25.000 **ya están en Movimientos**.
- **Por qué confunde a este usuario**: Marta viene de cargar todo a mano en dos lugares. Si no se
  le dice, va a Movimientos a cargar la plata y la venta queda contada dos veces. Es justo el error
  que la venta en un paso vino a evitar.
- **Propuesta**: *"Venta registrada: 2 kg de Queso cremoso por $ 25.000,00. La plata ya quedó
  anotada en Movimientos: no hace falta cargarla de nuevo. Quedan 23,5 kg."* Lo mismo en la
  compra. Al operador, sin la parte de Movimientos, que no ve.
- **Cuesta**: chico (el texto lo arma el servidor).

**E-06 · "Cobramos un trabajo de soldadura": se pregunta dos veces y la segunda es opcional.**
- **Dónde**: Movimientos → *Entró plata*, tesorero de Metalúrgica (Daniel), tarea 16.
- **Qué pasa**: la primera pregunta (*"¿De qué fue la plata que entró?"*) ofrece **Soldadura**. La
  última (*"¿Este movimiento es de algún servicio? (opcional)"*) ofrece **Soldadura a domicilio**.
  Si Daniel elige *Soldadura* en la primera, cree que ya está. El movimiento no cuenta en
  *Reportes → Por servicio*, pero sí en *Por categoría*.
- **Por qué confunde a este usuario**: para él son la misma pregunta con dos palabras. La ayuda
  (*"La categoría y el tipo van igual"*) es correcta pero está al final, después de lo que ya
  contestó. Lo decidido (el servicio es el origen, no la clasificación) está bien. Lo que falta es
  que se note cuando las dos listas tienen la misma palabra.
- **Propuesta**: cuando el tipo elegido se llama parecido a un servicio, mostrar arriba del campo
  del servicio: *"¿Fue el servicio «Soldadura a domicilio»? Elegilo acá abajo para que cuente en
  «cuánto deja cada servicio»."* **A validar con usuarios**: puede que en una empresa real las dos
  listas no se pisen tanto como en los datos de prueba.
- **Cuesta**: chico/medio.

**E-07 · El archivo descargado dice "hasta hoy" y no dice qué día era hoy.**
- **Dónde**: Reportes → *Descargar para Excel* y *Descargar en PDF*, todas las vistas.
- **Qué pasa**: el CSV dice en la fila 3 *"Período: noviembre de 2026, hasta hoy"*, y **no tiene la
  fecha en ninguna celda** (está sólo en el nombre del archivo). El PDF dice lo mismo arriba y
  *"generado el 14/11/2026"* en el pie, en letra chica.
- **Por qué confunde a este usuario**: el contador abre el archivo una semana después y *"hoy"*
  ya es otro día. Y si alguien renombra el archivo, el CSV queda sin fecha.
- **Propuesta**: *"Período: del 1 al 14 de noviembre de 2026"* (y *"Este mes"* sólo en pantalla).
  En el CSV, además: *"Generado el 14/11/2026"*.
- **Cuesta**: chico (`periodo.service.js` ya arma la etiqueta).

**E-08 · El aviso de "Lo que se perdió" alcanza en pantalla; en el PDF queda más chico que el número
que explica.**
- **Dónde**: Reportes → *Lo que se perdió*, pantalla y PDF (tarea 25).
- **Qué pasa**:
  - **En pantalla, alcanza.** El aviso va arriba, en negrita (*"Esta plata NO está en lo que salió
    del balance"*), los casilleros del período se esconden, y la explicación (*"esa mercadería ya
    se pagó cuando se compró"*) es clara.
  - **En el PDF**, el mismo aviso va en itálica, chico y color tierra, y debajo el número *$ 29.300*
    va grande, en negrita y en **rojo**, el mismo rojo que *Salió* en los otros reportes. Y dice
    *"egresos"* (ver vocabulario).
- **Por qué confunde a este usuario**: el PDF es el que viaja suelto, sin la pantalla al lado. El
  que lo lee ve primero el número rojo, que en el resto de la app quiere decir *salió plata*.
- **Propuesta**: en el PDF, el aviso en un recuadro con la misma fuerza que el número y el mismo
  texto que la pantalla. **A validar con usuarios** si el rojo del número suma a la confusión; un
  gris oscuro lo separaría de *Salió*.
- **Cuesta**: chico (pdfkit).

**E-09 · El panel compara medio mes contra un mes entero, y no dice qué mes es.**
- **Dónde**: Panel general, admin y tesorero (tarea 8).
- **Qué pasa**: *"Entró en el mes $ 1.011.850 · El mes pasado: $ 275.000"*. El 14 de noviembre,
  *el mes* son 14 días y *el mes pasado* son 31. Ningún casillero dice *noviembre*. Y el
  **Resultado** no tiene comparación, que es justo lo que contesta *"¿cómo venimos?"*.
- **Por qué confunde a este usuario**: a fin de mes la comparación es justa; el día 5, cualquier
  mes *"viene peor"* que el anterior. Sin la palabra *noviembre*, tampoco queda claro de qué mes se
  habla.
- **Propuesta**:
  - Títulos *"Entró en noviembre (hasta hoy)"*.
  - Comparación *"Octubre entero: $ 275.000"*.
  - Agregarle *"Octubre: $ X"* al Resultado.
  - **A validar con usuarios** si conviene comparar contra *"del 1 al 14 de octubre"*.
- **Cuesta**: chico (textos); medio si cambia la cuenta.

**E-10 · Al dar de alta a alguien, el rol no dice qué hace.**
- **Dónde**: Usuarios → *Nuevo usuario*, admin (tarea 11).
- **Qué pasa**: *Rol: Seleccioná un rol... / Tesorero / Operador*. Nada dice que *Operador* es el
  depósito, ni qué ve cada uno.
- **Por qué confunde a este usuario**: Marta piensa *"el chico del depósito"*, no *"operador"*. Y no
  sabe que el operador **no** ve la plata: si quiere que alguien del mostrador vea las ventas del
  día, no tiene cómo enterarse de que no va a poder.
- **Propuesta**: *"Operador — el depósito: productos, stock, ventas y compras. No ve los totales de
  plata."* y *"Tesorero — la plata: movimientos y reportes. No entra al stock."*
- **Cuesta**: chico.

**E-11 · Apagar Productos deja a los operadores sin nada, y el admin no se entera.**
- **Dónde**: Configuración → *Módulos del sistema*, admin (tarea 14).
- **Qué pasa**: el interruptor apaga en el momento, con un toast claro (*"Módulo Productos
  desactivado. Los datos cargados se conservan."*). Del otro lado, Silvia entra y ve sólo *"Tu
  empresa no tiene prendido el módulo de Productos… pedíselo al administrador"* y el buscador.
- **Por qué confunde a este usuario**: la tarea es *"sacalo de en medio"*. Que se apague sin
  preguntar está bien (se deshace). Lo que falta es saber que tres personas de la empresa se quedan
  sin trabajo en el sistema.
- **Propuesta**: cuando el módulo es lo único que usa algún rol, un cartel antes de apagar:
  *"Silvia, Jorge y Claudia (operadores) sólo trabajan en Productos y Stock. Si lo apagás, no van
  a tener nada para hacer en el sistema. ¿Lo apagás igual?"* **A validar con usuarios.**
- **Cuesta**: medio.

**E-12 · El cartel de módulo apagado le habla al administrador en tercera persona, y es ella.**
- **Dónde**: Stock, Productos y Buscar empresas con el módulo apagado, admin (Elena, empresa nueva).
- **Qué pasa**: *"El módulo de Productos no está activo en tu empresa. El administrador puede
  activarlo desde Módulos del sistema."* (sin link). Lo lee Elena, que es la administradora.
- **Propuesta**: si quien mira es admin, *"Lo prendés en **Módulos del sistema**"* (con link). Si no
  lo es, *"Pedíselo a [nombre del admin]."* El panel ya tiene el link bien puesto (*"Las prendés en
  Módulos del sistema"*): es copiarlo.
- **Cuesta**: chico.

**E-13 · El registro pide dos emails y no dice con cuál se entra.**
- **Dónde**: Login → *Registrar mi empresa*.
- **Qué pasa**: *"Email de la empresa \*"* y, más abajo, en *Datos del administrador*, *"Email \*"*.
- **Por qué confunde a este usuario**: en una empresa chica son la misma persona. Después de la
  aprobación, ¿con cuál entra?
- **Propuesta**: *"Tu email (con este vas a entrar)"*, y en el de la empresa *"Email de contacto:
  el que ven las otras empresas. Puede ser el mismo."*
- **Cuesta**: chico.

**E-14 · Una salida que no alcanza recibe dos consejos distintos.**
- **Dónde**: Stock → *Otra entrada o salida* (tarea 4: *"se rompieron 3 cajas"*; el único producto
  en cajas tiene 0). También *Registrar una venta*.
- **Qué pasa**:
  - Antes de guardar, el formulario dice: *"Hay 0 cajas y estás sacando 3. No alcanza. Si en el
    depósito hay más, primero cargá lo que entró (Registrar una compra, u Otra entrada o
    salida)."*
  - Si igual se aprieta *Registrar* (el botón sigue prendido), el servidor dice: *"No alcanza…
    Si el sistema todavía no tiene la existencia real, cargala con un movimiento de «Ajuste
    positivo»."*
  - Quedan los dos a la vista, uno arriba del otro.
- **Por qué confunde a este usuario**: dos instrucciones diferentes para el mismo problema, una con
  *"existencia"* y *"movimiento"*.
- **Propuesta**: un solo texto, el del formulario. Y el botón *Registrar* apagado mientras diga
  *No alcanza*.
- **Cuesta**: chico.

**E-15 · El menú no marca dónde está uno, y Productos y Servicios son la misma página.**
- **Dónde**: menú principal, todos los roles, todas las medidas.
- **Qué pasa**: medido. Todos los links del menú tienen el mismo color (`#333`), el mismo peso y
  ningún subrayado, también el de la pantalla abierta. Lo único que dice dónde se está es la franja
  verde con el título.
- **Por qué confunde a este usuario**: la tarea 20 pregunta si alguien puede creer que está en
  Productos estando en Servicios. **No, si mira la franja**: tienen título, ícono y subtítulo
  propios, Productos tiene la columna *Unidad* y el botón *Stock*, y Servicios tiene *Cuánto deja
  cada uno*. Pero el menú, que es lo que se mira al cambiar de pantalla, no ayuda.
- **Propuesta**: marcar el link de la pantalla actual (verde y subrayado) desde `header.js`, que ya
  sabe la dirección.
- **Cuesta**: chico.

**E-16 · El login tiene campos de 144 px sin rótulo.**
- **Dónde**: login, a 1280 px. La tarjeta mide 440 px y los campos 144.
- **Qué pasa**: *Email* y *Contraseña* son sólo el texto gris de adentro del campo, que desaparece
  al escribir. *marta@laesperanza.com.ar* no entra en el ancho: se ve cortado mientras se escribe.
- **Por qué confunde a este usuario**: es la puerta de entrada. Quien escribe despacio y mira el
  teclado, al levantar la vista no sabe en qué campo está ni si escribió bien el email.
- **Propuesta**: rótulos arriba de cada campo (*Tu email*, *Tu contraseña*) y los campos al ancho de
  la tarjeta, como el botón.
- **Cuesta**: chico (`login.css`).

### HACE PERDER TIEMPO

**E-17 · Tablet (800 px): el Panel y la franja de Servicios.** Medido:
- **Panel**: *Movimientos recientes* y *Alertas de stock* miden **360 px en 326**. Se cortan la
  fecha (*"14/"*) y el estado (*"Sin stoc"*, *"Reponе"*), y aparece una barra de arrastre abajo de
  cada bloque. Son tablas del panel que no usan `tabla-mobile.css`: el error que el prompt pide
  reportar.
- **Banda *Acciones rápidas***: llega a 793 px con la página en 785. Queda pegada al borde
  derecho, sin margen.
- **Círculo de las iniciales**: **14 × 30 px**, un óvalo con *MG* saliéndose. A 375 y a 1280 está
  bien.
- **Franja de Servicios**: **263 px de alto**. El subtítulo *"Los servicios que tu empresa presta o
  contrata…"* queda en una columna de ~70 px, una palabra por renglón, porque los tres botones se
  quedan con el ancho. La de Productos, 139 px. El primer servicio aparece en el píxel 577.
- **Propuesta**: las dos tablas del panel con la hoja compartida; el avatar con ancho fijo; la
  franja de título con los botones **debajo** del título hasta 1023 px, como ya pasa a 375.
- **Cuesta**: medio (CSS en `dashboard.css`, `header.css` y `comun.css`).

**E-18 · "Ver todos" de Alertas de stock lleva a todo el stock, no a lo que falta.**
- **Dónde**: Panel, admin y operador (tarea 2).
- **Qué pasa**: el link va a `stock.html` con *"Todos los productos"*. Para ver sólo lo que falta
  hay que abrir el filtro *Mostrar* y elegir *"Solo los que faltan"*. El casillero *Productos a
  reponer* no es clickeable.
- **Propuesta**: que los dos lleven a Stock con el filtro de faltantes ya puesto.
- **Cuesta**: chico.

**E-19 · El historial de un producto: un ícono de reloj, sin "este mes".**
- **Dónde**: Stock, operador (tarea 3: *"¿qué pasó con el queso este mes?"*).
- **Qué pasa**: al historial de un producto se llega con un **ícono de reloj sin texto** (el
  primero de cada fila; el último, unas flechas, es *Otra entrada o salida*). Adentro, el filtro
  tiene *Desde* y *Hasta*, pero **no los atajos *Este mes / El mes pasado / Este año*** que
  Movimientos y Reportes sí tienen.
- **Por qué confunde a este usuario**: los botones con texto de cada fila son *Comprar* y *Vender*;
  el que contesta la pregunta es el único sin palabra. Y armar dos fechas para *"este mes"* es lo
  que los atajos vinieron a evitar.
- **Propuesta**: *"Historial"* con texto (a 375 ya hay lugar: los botones van en su propio renglón)
  y los mismos tres atajos de período.
- **Cuesta**: chico/medio.

**E-20 · Productos y Servicios: Editar y Dar de baja siguen siendo sólo un ícono.**
- **Dónde**: Productos y Servicios, en las tres medidas (lápiz verde y círculo rojo).
- **Qué pasa**: lo decidido dice que los íconos sueltos que quedan son de pantallas de
  configuración. Productos es una pantalla de todos los días del operador. En Usuarios, la misma
  acción dice *Editar* y *Dar de baja* con texto.
- **Propuesta**: *Editar* y *Dar de baja / Reactivar* con texto, como en Usuarios.
- **Cuesta**: chico.

**E-21 · Los carteles de "no tenés acceso" no dicen lo mismo.**

| Quién y dónde | Qué dice | A quién pedirle |
|---|---|---|
| Silvia en Reportes | *"Los reportes los ven el administrador y el tesorero de tu empresa. Si necesitás uno, pedíselo a ellos."* | Sí (está muy bien) |
| Silvia en Movimientos | *"No tenés permiso para ver los movimientos de la empresa."* | No |
| Roberto en Stock | *"Tu usuario no tiene acceso al stock."* | No |
| Login de alguien dado de baja | *"Tu cuenta está dada de baja"* | No |

- **Propuesta**: todos como el de Reportes. Por ejemplo: *"El stock lo trabajan el administrador y
  los operadores. Si necesitás ver algo, pedíselo a ellos."*, y *"Tu usuario está dado de baja.
  Hablá con el administrador de tu empresa."*
- **Cuesta**: chico.

### MOLESTA

**E-22 · Pantallas que se ven distintas de las demás** (regresión de `comun.css`):
- **Panel**: no tiene franja de título. La franja verde dice *"Acciones rápidas"*, así que es la
  única pantalla que no dice dónde se está.
- **Buscar empresas** a 1280: el subtítulo va a la **derecha** del título y no abajo, como en el
  resto.
- **Ficha de empresa**: la franja verde tiene sólo *"Volver a la búsqueda"*, sin título.
- **Mi empresa** a 375: título y subtítulo centrados. Todas las demás van a la izquierda.
- **Subtítulos**: Movimientos, Reportes y Usuarios ponen el nombre de la empresa; Productos, Stock,
  Servicios y la configuración, una explicación.
- **Propuesta**: Panel con franja *"Hola, Marta"* o *"Panel general"*, y las acciones abajo. El resto,
  como las demás.
- **Cuesta**: chico.

**E-23 · Barras de desplazamiento que no deberían estar.**
- La caja de pestañas de **Stock** mide 45 px en 43. Muestra una barrita vertical con flechas a la
  derecha de *Cuánto hay / Entradas y salidas*, **a cualquier ancho**.
- Las dos tablas del **Panel** a 1280 px miden 360 en 354, con barra horizontal abajo. A 800 px ver
  E-17.
- **Cuesta**: chico.

**E-24 · El PDF escribe los negativos de dos maneras.** En el mismo archivo: *"-$ 164.000,00"* (monto
de un movimiento) y *"$ -676.900,00"* (resultado por categoría). La pantalla siempre usa *"-$"*.
**Cuesta**: chico.

**E-25 · "Ver mi ficha" vuelve a una búsqueda que nunca se hizo.** Desde *Mi empresa → Ver mi ficha
como la ven las demás*, el único link de la ficha es *"Volver a la búsqueda"*. **Propuesta**:
*"Volver a Mi empresa"* cuando es la propia. **Cuesta**: chico.

**E-26 · Detalles de texto.**
- *"después del movimiento queda 12 paquetes"* → *quedan*.
- *"Dá de alta…"* (Primeros pasos) → *Da de alta…*
- *"Cargado el 14/11/2026"* abajo del costo no dice qué se cargó → *"Costo cargado el 14/11/2026"*.
- *"El tipo de movimiento no es válido"*: ver el vocabulario.
- **Cuesta**: chico.

**E-27 · El desplegable de producto de los formularios de Stock no sigue el orden de la tabla.** La
tabla va alfabética; el desplegable deja *Agua mineral 2L* al final (ordena por categoría sin
mostrarla). **Cuesta**: chico.

**E-28 · Tablet: una tarjeta por renglón, con la etiqueta lejos del valor.** A 800 px cada producto
o movimiento es una tarjeta de 720 px, con *EXISTENCIA* a la izquierda y *60 unidades* a 360 px a
la derecha. Se lee, pero el ojo viaja mucho y entran tres productos por pantalla. **A validar con
usuarios**: dos columnas de tarjetas entre 768 y 1023 px. **Cuesta**: medio.

**E-29 · Dato de prueba que parece del sistema.** *Bolsa de pan* tiene como descripción *"Sin
subcategoría"*. En Productos se lee como un rótulo del sistema, y sale así en la ficha pública que
ven las otras empresas. **Propuesta**: *"Pan del día, bolsa de 1 kg"*. **Cuesta**: chico
(`datos_de_prueba.sql`).

### Lo que está bien resuelto (para no romperlo)

- **La venta y la compra en un paso.**
  - El precio o el costo aparecen escritos y explicados (*"Es el precio cargado en el producto.
    Si cobraste otro… cambialo"*).
  - El total se ve mientras se escribe.
  - El aviso *"Hay 25,5 kg · después de la venta quedan 23,5 kg"* aparece antes de guardar.
  - Formulario vacío: *"Elegí qué vendiste."* y los campos marcados.
  - A 375 px la venta entra entera con el botón a la vista (y = 659 en 812).
- **El *Anular y corregir* de Movimientos.** *"El de antes se anula recién cuando guardás la
  corrección: si cancelás, queda todo como estaba."*, con los datos copiados (también la fecha
  original). Responde la tarea 21 sin dudas.
- **El alta de un movimiento.**
  - *"¿Qué pasó con la plata?"* con *Entró / Salió*.
  - *"¿En qué se fue la plata?"* con los tipos agrupados, y *"Va en Gastos fijos › Luz."*
  - Al admin que toca *Salió* le avisa *"¿Compraste mercadería? Cargala desde Registrar una
    compra"*.
  - La luz se carga en 4 toques desde el panel.
- **Lo que se perdió, en pantalla**: el aviso, los casilleros escondidos, el corte por motivo y por
  producto, el *"No se sabe"* con *"Cargales el costo desde Productos"*.
- **El costo y el precio en el producto**: *"¿Cuánto te cuesta comprar un kilo? (opcional)"*, con la
  unidad en la pregunta, y *"Si no lo sabés, dejalo vacío"*. Tarea 27 sin dudas.
- **Primeros pasos y vacíos.** La empresa nueva ve tres pasos, el de usuarios tachado porque ya los
  tenía, y el reporte vacío dice *"Cuando registres el primero vas a poder ver acá cómo te fue en el
  mes"* con un botón. El listado de Movimientos separa *"Todavía no cargaste ningún movimiento"* de
  *"No hay con estos filtros"*.
- **Dar de baja un servicio**: *"Los movimientos que ya cargaste siguen mostrando este servicio y
  siguen contando en los reportes."* Tarea 19 resuelta en una frase.
- **Dar de baja un producto con mercadería** avisa *"Todavía hay 18 unidades en el depósito"*.
- **Cuánto deja cada servicio.** El botón *"Cuánto deja cada uno"* en Servicios lleva a Reportes
  con la vista puesta. Los bloques *"Los que ofrecemos — deja $ 282.000"* y *"Los que contratamos —
  se lleva $ 18.000"*, y un servicio sin movimientos dice *"Sin movimientos en el período"* en
  lugar de un cero mudo.
- **El buscador y la ficha.** *"a unos 2 km"* en la lista, *"La zona es aproximada: es el centro de
  la localidad, no la dirección del local"* en la ficha, *"CooperApp no manda mensajes"* con
  *Escribir un email* y *Llamar*, y la búsqueda sin resultados que propone otra palabra.
- **El superadmin**: *Ver datos → Aprobar*, con toast *"…quedó aprobada. Elena Maldonado ya puede
  entrar con su email y su contraseña."*; *Volver a la contraseña inicial* con *"Avisale por fuera
  del sistema."*
- **Las ventanas no se cierran al tocar afuera**, y el operador **ve lo cobrado** (*"Cobrado:
  $ 92.000,00"*) sin ningún total.
- **Los CSV en Excel**: los números entran como números (no como texto), las fechas como fechas,
  los acentos bien, separados en columnas. El nombre del archivo lleva empresa y período.
- **El celular (375 px)**: ninguna tabla se corta, los filtros van plegados y las tarjetas de las
  tablas compartidas se leen bien.
- **El menú a 1024 px** entra en un renglón también con nueve opciones (Osvaldo).

---

## 4. Plan sugerido

1. **E-01 y E-03** (corregir en Stock y desde Movimientos): son textos y un rótulo. Arreglan la
   única tarea que alguien no puede terminar sola y la palabra que contradice lo decidido en
   HU-84.
2. **E-02** (*Por producto*): los dos textos ya, en pantalla y en los archivos. Si una dueña deja
   de comprar queso por este número, la app hizo daño.
3. **E-17** (tablet en el Panel y la franja de Servicios). Antes de sumar cualquier pantalla nueva:
   es el patrón que se repite (tabla sin la hoja compartida, franja con botones al costado).
4. **E-05 y E-07** (el aviso de la venta y la fecha en los archivos): chicos, y evitan una plata
   cargada dos veces y un archivo que no se sabe de cuándo es.
5. **El vocabulario de la sección 2**: *dinero* → *plata*, *existencia*, la contraseña con tres
   nombres, *egresos* en los archivos. Es una pasada de textos; conviene hacerla antes de RRHH,
   que va a copiar estas pantallas.
6. **E-21, E-12 y E-10** (carteles de acceso, módulo apagado y rol): mismos textos, mismo criterio.
7. **E-15 y E-22** (el menú marca dónde está uno y las pantallas desparejas): un cambio en
   `header.js` y unas líneas de `comun.css`.
8. **Para validar con una persona real** (el guion del prompt): E-02 (¿qué entiende de *Resultado*
   por producto?), E-06 (¿elige el servicio?), E-08 (¿resta las pérdidas?), E-09 (¿cómo compara los
   meses?) y la entrada sin compra (*Ajuste positivo*).
9. **Lo que puede esperar**: E-11, E-13, E-14, E-16, E-18 a E-20, E-23 a E-29.

---

## Bugs encontrados (no son de UX: van al chat de desarrollo)

Ninguno funcional. Todo lo que se probó guardó lo que tenía que guardar. Los números de la pantalla,
el CSV y el PDF coinciden entre sí en las cuatro vistas descargadas.

---

## Notas para la próxima corrida

- **Las tareas, una por una** (toques contados desde el panel; la ventana cuenta como pantalla):

| # | Rol | ¿Sola? | Toques / pantallas | Dónde se frenó |
|---|---|---|---|---|
| 1 | operador | sí | 4 / 1 + ventana | *Compra* u *Otra entrada*: si no sabe el precio, sólo queda *Ajuste positivo* |
| 2 | operador | sí | 0 (está en el panel) | *Ver todos* no filtra lo que falta (E-18) |
| 3 | operador | sí, con duda | 2 / 2 | ícono de reloj; sin *este mes* (E-19) |
| 4 | operador | sí | 6 / 1 + ventana | *Pérdida* para una rotura se entiende; el producto en cajas está en 0 (E-14) |
| 5 | operador | con duda | 4 / 2 + 2 ventanas | el arreglo está detrás de *Anular* (E-03); *"Hay 5,5"* (E-04) |
| 6 | operador | sí | 6 / 1 + ventana | — |
| 7 | tesorero | sí | 4 / 1 + ventana | — |
| 8 | tesorero | con duda | 0 | medio mes contra mes entero, sin nombre de mes (E-09) |
| 9 | tesorero | **no**, si es una venta | — | E-01 |
| 10 | admin | sí | — | La Esperanza ya está configurada; se evaluó con Huerta Norte (29) |
| 11 | admin | con duda | 7 / 1 + ventana | el rol (E-10) |
| 12 | admin | sí | 4 por producto | *"Cuando llegue a este número (o menos)"* contesta bien *"menos de 10"* |
| 13 | admin | sí, con duda | 1 desde el panel o desde Stock | no dice que la plata ya quedó (E-05) |
| 14 | admin | sí | 3 / 2 | no avisa a quién deja sin pantallas (E-11) |
| 15 | admin | sí | 5 / 1 + ventana | — |
| 16 | tesorero | con duda | 6 | *Soldadura* dos veces (E-06) |
| 17 | tesorero | sí | 1 desde Servicios | — (*sabía* que estaba en Reportes, pero el botón lo encuentra cualquiera) |
| 18 | tesorero | sí | 3 | — |
| 19 | admin | sí | 2 | — |
| 20 | — | se distinguen | — | el menú no marca dónde está uno (E-15) |
| 21 | admin | sí | 3 | — (el cartel de la venta explica por qué va a Stock) |
| 22 | admin | sí | 1 (*Ver reportes*) | — |
| 23 | admin | con duda | — | E-02 |
| 24 | admin | sí | 1 por archivo | E-07, E-08, E-24 |
| 25 | admin | sí en pantalla | 2 | el PDF (E-08) |
| 26 | admin | sí | — | — |
| 27 | admin | sí | — | — |
| 28 | operador | sí | — | el mensaje dice a quién pedirle |
| 29 | admin nueva | sí | — | E-12 |
| 30 | admin nueva | sí | — | — |
| 31 | operador | sí | 3 desde el panel | — |
| 32 | admin | sí | 4 | *sabía* que la casilla está en el producto; igual, *Mi empresa* lo dice. E-25 |
| 33 | — | sí en la ficha | — | en la lista sólo dice *"a unos"*; **a validar** si alcanza |
| 34 | superadmin | sí | 2 | — |
| 35 | superadmin | sí | 3 | — |
| 36 | tablet | con molestias | — | E-17, E-28 |

- **Los números del CSV van sin formato en Excel** (`1036850`, no `$ 1.036.850,00`). Están bien
  como números (se pueden sumar), y el formato de moneda no se puede fijar desde un CSV. Lo dejo
  anotado, no como hallazgo. El *Monto* del CSV de movimientos va **siempre positivo**, con el signo
  en la columna *Entró / Salió*. **A validar con el contador** si prefiere dos columnas
  (*Entró*, *Salió*) como en los agrupados, que se suman con un `SUMA`.
- **Choque de puertos con la sesión de QA**: el script de Edge sin ventana de esta auditoría usó al
  principio el puerto de depuración **9341**, el mismo que el `revisar.js` de QA. Por un rato se
  conectó al Edge de QA (le cambió de página y le borró las cookies). Se avisó a esa sesión y se
  pasó al 9377. **La próxima vez, que cada auditoría use su propio puerto de depuración**, además de
  su propia base y su propio puerto de app.
- **Lo que se cargó en la copia para recorrer** (y se borró con ella): una compra y una venta de
  queso, la luz, dos pérdidas, el usuario Ramiro Paz, Productos apagado y vuelto a prender, y Huerta
  Norte aprobada.

---

## Resultado de las correcciones (15/11/2026)

Se hicieron **los 29 y la tabla de vocabulario**, en el chat de desarrollo (pedido del usuario:
*"corregí todo"*). Los marcados *a validar con usuarios* se hicieron con la propuesta del informe:
si la prueba con una persona real dice otra cosa, se cambian.

| Hallazgo | Qué se hizo |
|---|---|
| **E-01** | En la plata de una venta, quien no entra a Stock (el tesorero) ve **Anular** y un cartel que dice que se corrige en Stock, **a quién pedírselo** (quien la cargó, con nombre, o el administrador) y que si la anula la venta queda sin cobrar. El admin, el link a *Entradas y salidas*. |
| **E-02** | Abajo de las vistas, el texto cambia con la vista. *Por producto* explica que es sólo la plata de ventas y compras y que **un negativo no es plata perdida**. Lo arma el servidor y va igual al CSV y al PDF. La columna sigue siendo *Resultado* (a validar). |
| **E-03** | En Stock, la fila de una venta o una compra dice **Anular o corregir**. El cartel se titula *Anular o corregir la venta*. |
| **E-04** | Corrigiendo: *"Sin esta compra, hay 5,5 kg · con la corrección va a haber 25,5 kg"*, y el desplegable dice *"(sin esta compra: 5,5 kg)"*. |
| **E-05** | El aviso de la venta y la compra dice *"La plata ya quedó anotada en Movimientos: no hace falta cargarla de nuevo"*. Al operador, sin nombrar Movimientos. El aviso dura más si el texto es largo. |
| **E-06** | Si el tipo elegido se parece a un servicio, arriba del campo: *"¿Fue el servicio «Soldadura a domicilio»? Elegilo acá abajo…"*. |
| **E-07** | El período dice las fechas (*"del 1 al 14 de noviembre de 2026"*), en pantalla y en los archivos. El CSV suma *"Generado el …"*. |
| **E-08** | Los avisos del PDF van en un recuadro, en letra normal, con el mismo texto que la pantalla (sin *"egresos"*). El número de pérdidas y sus filas, en gris oscuro, no en el rojo de *Salió*. |
| **E-09** | *"Entró en noviembre (hasta hoy)"*, *"Octubre entero: $ X"* y el resultado de octubre en el casillero del resultado. La cuenta no cambió (a validar si conviene comparar contra los mismos días). |
| **E-10** | El rol dice qué hace: *"Operador — el depósito: productos, stock, ventas y compras. No ve los totales de plata"*. |
| **E-11** | Antes de apagar Productos, si hay operadores activos, un cartel con sus nombres: no van a tener nada para hacer. Se puede apagar igual. |
| **E-12** | El aviso de módulo apagado: al admin, *"Lo prendés en Módulos del sistema"* con link; a los demás, *"pedíselo al administrador"*. Se arma una vez en `header.js`. |
| **E-13** | *"Tu email — con este vas a entrar"* y *"Email de contacto de la empresa — el que ven las otras empresas"*. |
| **E-14** | Un solo consejo para *No alcanza* (el del formulario, también en el servidor) y el botón apagado mientras no alcanza. |
| **E-15** | El menú marca la pantalla actual (verde y subrayado), también dentro de *Configuración*. |
| **E-16** | El login con rótulos (*Tu email*, *Tu contraseña*) y los campos y el botón al ancho de la tarjeta. |
| **E-17** | Las tablas del panel pasaron a dos columnas (la fecha y lo que hay van debajo del nombre); el círculo de las iniciales ya no se aplasta; la franja de acciones no se pasa del borde; hasta 1023 px los botones de cada franja van **debajo** del título (Servicios a 800 px: de 263 a 145 px). |
| **E-18** | *"Ver lo que falta →"* y *"Ver cuáles"* en el casillero llevan a Stock con el filtro de faltantes puesto (`stock.html?ver=faltantes`). |
| **E-19** | *Historial* con texto en cada fila, y los atajos *Este mes / El mes pasado / Este año* en *Entradas y salidas*. |
| **E-20** | *Editar* y *Dar de baja / Reactivar* con texto en Productos y Servicios. |
| **E-21** | Los carteles de "sin acceso" dicen quién lo hace y a quién pedírselo; el login de alguien dado de baja, *"Hablá con el administrador de tu empresa"*. |
| **E-22** | El panel tiene franja (*"Hola, Marta"*, *"Panel general · empresa"*) con las acciones; Buscar empresas con el subtítulo abajo; la ficha con título; Mi empresa con la franja común; los subtítulos de Movimientos, Reportes y Usuarios explican la pantalla. |
| **E-23** | Sin la barrita de las pestañas de Stock ni la de las tablas del panel. |
| **E-24** | Los negativos siempre *"-$ 164.000,00"* (`formatearPlata`). |
| **E-25** | La ficha propia, abierta desde Mi empresa, dice *"Volver a Mi empresa"*. |
| **E-26** | *quedan*, *Da de alta*, *Costo cargado el*, y el mensaje del tipo en palabras de la pantalla. |
| **E-27** | Los desplegables de producto de Stock, en orden alfabético. |
| **E-28** | De 768 a 1023 px las tarjetas van de a dos (a validar). |
| **E-29** | *Bolsa de pan*: *"Pan del día, bolsa de 1 kg"*. |

**Vocabulario**: *plata* en Motivos y en Stock; *"lo que salió del balance"* en los archivos;
columna **Hay** en Stock; una sola **contraseña inicial** (estado *"Con la contraseña inicial"*);
*"N entradas y salidas"* en el historial; **Otras entradas** en lugar de *Otros ingresos*
(`datos-iniciales.js` y los datos de prueba; las empresas ya creadas lo renombran a mano);
*Elegí*; una sola forma de *sólo*.

**Probado**: por API los mensajes y los archivos (CSV con *Generado el* y la nota, PDF leído con
`pypdf` y mirado como imagen); las 92 pantallas en 1280, 800 y 375 px midiendo lo que se pasa
dentro de cada bloque, el avatar y el alto de las franjas; y capturas mirando el panel a 800 y a
1280, el login, Stock, Servicios a 800, la ficha propia y el cartel del tesorero.
