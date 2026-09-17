# Auditoría de experiencia de usuario · CooperApp

**Fecha**: 15/09/2026 · **Al cerrar**: Sprint 08 (stock, motivos y anulación)
**Método**: recorrido real en el navegador con los 4 roles, escritorio y 375 px.
Base recreada desde `datos_de_prueba.sql` antes de empezar y **restaurada al terminar**.
No se tocó una sola línea de código.

> Esto busca lo que **funciona pero confunde**. Los bugs van en una línea al final.

---

## 1. Resumen ejecutivo

**La app está bien construida y mal rotulada.** Las funciones andan, las validaciones
son buenas y hay pantallas explicadas con un cuidado que no se ve seguido (los motivos de
stock, los módulos, el modal de anulación). El problema no es que falten cosas: es que
el sistema le habla al usuario en su propio idioma técnico y lo deja parado en lugares
donde no hay nada que hacer. Tres cosas, por orden de gravedad:

**1. La puerta de entrada está rota.** Una empresa nueva llena los 12 campos del registro,
aprieta "Enviar registro" y **el formulario entero desaparece**, con todo lo que escribió,
mientras un cartelito se asoma tres segundos arriba a la derecha diciendo "Faltan datos
obligatorios de la empresa". Sin decir cuál. El campo que falta es **Matrícula**, que no
está marcado como obligatorio y que **una S.R.L. no tiene**: es un dato del mundo
cooperativo que quedó del proyecto anterior. O sea: el primer contacto de una PyME con el
producto es un formulario que la rechaza por no tener algo que no existe, sin decirle qué.
Y el superadmin, que es quien recibe esas altas, entra al sistema y aterriza en un tablero
vacío que le dice *"El módulo de Movimientos no está activo en tu empresa"* — él no tiene
empresa — con su única pantalla de trabajo escondida abajo de su propio nombre.

**2. En el celular, las dos pantallas centrales no muestran lo que importa.** La tabla de
Stock mide 529 px metida en 343 px: **"Reponer" / "Sin stock" y los botones quedan fuera de
la pantalla**. La de Movimientos mide 791 px en los mismos 343: **la columna MONTO arranca en
el píxel 514**, o sea 171 px más allá del borde. El tesorero abre su lista de movimientos
en el teléfono y no ve un solo importe hasta que descubre que se puede arrastrar de costado.
Y lo que sí ocupa lugar es lo que menos se usa: CATEGORÍA, NATURALEZA y CARGADO POR se
llevan más ancho que el MONTO. Es una app que se usa desde el celular mostrando en el
celular todo menos el dato.

**3. La misma cosa tiene cuatro nombres y vive en tres lugares.** No es sólo "categorías"
repetida: es que **`configuracion-categorias.html` y `configuracion-categorias-producto.html`
son la misma pantalla** — el mismo árbol de dos niveles, los mismos tres iconitos, la misma
baja en cascada — con distinto título, distinto subtítulo, distinto botón de volver y
distinto lugar donde encontrarlas. Una se abre desde un botón adentro de Movimientos, la
otra desde el menú de abajo del nombre del usuario. Lo mismo pasa con "dar de baja",
que según la pantalla se llama *dar de baja*, *desactivar*, *anular*, *inactiva* o
*dado de baja*, con cinco íconos distintos. La persona no puede aprender una regla y
aplicarla en otro lado, que es exactamente lo que hace que un sistema se sienta simple.

Lo más caro de estos tres es el vocabulario, porque cada pantalla nueva que se escribe con
el nombre viejo es un lugar más para cambiar. Los otros dos se arreglan con trabajo acotado.

---

## 2. Propuesta de vocabulario

Ordenada por cuánto confunde hoy, no por lo que cuesta.

| Término actual | Dónde aparece | Problema | Término propuesto | Qué hay que tocar |
|---|---|---|---|---|
| **Naturaleza** | Columna y filtro en Movimientos; primer campo del alta | Jerga pura. Es lo primero que se le pregunta al tesorero para cargar la luz. Además la columna es redundante: el MONTO ya dice `-$` en rojo | **Sacar la columna** de la tabla y el filtro pasa a **"Mostrar"** con *Todos / Sólo lo que entró / Sólo lo que salió*. En el alta, reemplazar los 3 desplegables por uno solo (ver hallazgo #6) | Sólo pantalla |
| **Matrícula** | Registro público (obligatoria) y Mi empresa | Concepto cooperativo. Una S.R.L. no la tiene, y es obligatoria sin estar marcada | **Volverla opcional** y rotularla *"Matrícula (si tu empresa tiene)"*. Si se quiere un dato registral obligatorio, el CUIT ya está | Pantalla + código (validación); la columna se puede dejar |
| **Federación** | Registro y Mi empresa | Ídem, sin explicación | *"Cámara o federación a la que pertenece (opcional)"* | Sólo pantalla |
| **Categorías** (de plata) / **Categorías de productos** | Botón "Configurar categorías" en Movimientos · menú del usuario · botón "Categorías" en Productos | Dos pantallas iguales, cuatro nombres entre botón y título | **"Rubros de dinero"** y **"Rubros de productos"**. Distinguen sin alargar y despegan la palabra del otro uso. Si el grupo prefiere no inventar: *"Categorías de dinero"* / *"Categorías de productos"*, siempre las dos con apellido, nunca "Categorías" sola | Pantalla (títulos, botones, menú). La base no se toca |
| **Movimientos** (plata) / **Movimientos** (stock) | Menú · Stock (pestaña y botón) · historiales | Misma palabra, dos cosas. El operador y el tesorero usan "movimiento" para cosas distintas y nunca se cruzan, pero el admin ve las dos | Plata: dejar **"Movimientos"**. Stock: **"Entradas y salidas"** (pestaña, botón "Registrar entrada o salida", título del historial) | Sólo pantalla |
| **Tipo** | Columna en Movimientos · nivel 2 del árbol de dinero | Genérico. Hay "tipo de movimiento", "tipo de empresa", "unidad"… | **"Detalle"** o, mejor, fusionar con Categoría y mostrar *"Servicios › Luz"* en una sola columna (lo que ya hace bien el modal "Registrar el dinero") | Sólo pantalla |
| **Efecto en el stock** / **Efecto en el dinero** | Columnas y campos en Motivos de stock | "Efecto" es jerga — y la propia pantalla ya escribió la versión llana dos renglones más arriba | **"Qué le hace al stock"** / **"Qué le hace al dinero"**, que es el texto que ya está en el recuadro verde | Sólo pantalla |
| **Anular / Dar de baja / Desactivar / Inactiva / Dado de baja** | Movimientos · Stock · Productos · Usuarios · las dos de categorías · Motivos | Cinco palabras y cinco íconos para dos ideas | Dos palabras, fijas: **"Anular"** para un movimiento ya registrado (plata o stock) y **"Dar de baja"** para todo lo demás (producto, usuario, categoría, motivo). Estado: **"Activo" / "De baja"**, siempre igual. Un ícono por acción en toda la app | Sólo pantalla |
| **Módulos del sistema** | Menú del usuario · título de pantalla | "Módulo" es palabra de software; "del sistema" suena a configuración de la plataforma, no de la empresa | **"Qué usa mi empresa"** — que es casi el subtítulo que ya tiene ("Elegí qué partes del sistema usa tu empresa") | Sólo pantalla |
| **Usuarios / Gestión de usuarios / Usuarios de la empresa** | Menú principal · menú del usuario · título | Tres nombres para una pantalla, con dos accesos distintos | **"Usuarios"** en los tres lados, y **sacarlo del menú del usuario**: ya está en el menú principal | Sólo pantalla |
| **Motivos / Motivos de stock / Motivos de movimiento de stock** | Botón en Productos · menú del usuario · título | Tres nombres | **"Motivos"** en todos lados, y moverlo de Productos a **Stock**, que es donde se usan | Sólo pantalla |
| **Ajustar stock** | Acción rápida del tablero | "Ajustar" es corregir. Lo que el operador hace todos los días es cargar lo que llegó y lo que salió | **"Registrar entrada o salida"**, y que abra el formulario directo (hoy sólo lleva al listado) | Sólo pantalla |
| **Ver reporte** | Acción rápida del tablero | Lleva a Movimientos, y Reportes no existe todavía | **"Ver todos los movimientos"** | Sólo pantalla |
| **Falta el $** | Historial de stock | Nadie explicó qué es ni qué hacer. Y al operador, que no entra a finanzas, no le sirve para nada | **"Sin registrar el cobro"** / **"Sin registrar el pago"**, con globito explicativo. **Y no mostrarlo al operador** | Pantalla + un `if` de rol |
| **Unidad**: "kg / paquete" vs "Kilogramo / Paquete" | Stock muestra la clave, Productos la etiqueta | La misma columna escrita de dos maneras | Una sola: la etiqueta corta en minúscula (*kg*, *paquete*) en los dos lados | Sólo pantalla |
| **"juan@coop.com"** | Placeholder del alta de usuario | Quedó "coop" del renombrado a empresas | `juan@miempresa.com`, como el resto | Sólo pantalla |
| **Composición del grupo de trabajo** (Mujeres / Varones / Diversidades) | Mi empresa | Vocabulario del mundo cooperativo/INAES. Nadie explica para qué se pide y nada lo usa | Decidir en grupo si se queda. Si se queda, un renglón que diga para qué es; si no, sacarlo | Pantalla (+ base si se saca) |

**Nada de esto obliga a recrear la base**, salvo que se decida borrar los campos de
composición del grupo. Matrícula y federación se quedan como columnas: sólo cambia el
rótulo y la obligatoriedad.

---

## 3. Hallazgos

### BLOQUEA

**H-01 · El registro de empresa se cierra y borra todo cuando algo falta**
*Dónde*: pantalla de login → "Registrar mi empresa". *Rol*: cualquiera, sin sesión.
Al apretar "Enviar registro" con un campo obligatorio vacío, el modal **se cierra**, los 12
campos desaparecen de la vista y un `toast` rojo aparece **arriba a la derecha, atrás de
donde estaba el modal**, durante unos segundos: *"Faltan datos obligatorios de la empresa"*.
No dice cuál. El único campo que faltaba era **Matrícula**.
*Por qué confunde a este usuario*: una persona de 50 años que acaba de escribir 12 datos ve
desaparecer la pantalla entera y no llega a leer un cartel que se va solo. La conclusión
razonable es "se colgó" o "ya lo mandé". Es el primer minuto con el producto.
*Qué proponer*: (a) **el modal no se cierra si hay error**; (b) marcar el campo que falta
en rojo y nombrarlo: *"Falta completar: Matrícula"*; (c) poner `*` en los obligatorios, como
hace el resto de la app; (d) volver Matrícula opcional (ver vocabulario). El texto que ya
existe adentro del modal —*"El registro quedará pendiente de aprobación hasta que un
administrador de la plataforma valide la empresa"*— está bien escrito pero hoy nunca se lee
porque el modal se cierra antes.
*Costo*: chico.

**H-02 · El superadmin entra a un tablero que no es suyo y le miente**
*Dónde*: tablero, apenas inicia sesión. *Rol*: superadmin.
Aterriza en el panel general con cuatro casilleros vacíos, la barra de "Acciones Rápidas"
sin una sola acción, y dos mensajes: *"El módulo de Movimientos no está activo en tu
empresa"* y *"El módulo de Productos no está activo en tu empresa"*. **El superadmin no
pertenece a ninguna empresa.** Su única pantalla de trabajo ("Panel administración") está
en el desplegable de abajo de su nombre, junto a "Cerrar sesión"; el menú principal sólo
tiene "Panel general".
*Por qué confunde*: quien administra la plataforma —y quien haga la demo del proyecto—
ve primero una pantalla rota que le habla de una empresa que no tiene. Y tiene que buscar
su trabajo abajo de su propio nombre, en cada ingreso.
*Qué proponer*: que el superadmin **entre directo a `superadmin.html`**, y que "Empresas"
esté en el menú principal. Si se quiere dejar el tablero accesible, que muestre lo suyo:
cuántas empresas hay, cuántas pendientes.
*Costo*: chico (un redirect según rol y un `<li>` en el menú).

**H-03 · Tres opciones del menú principal no van a ningún lado**
*Dónde*: menú superior. *Rol*: todos. **Servicios**, **Reportes** y **Articulación**
tienen `href="#"`: se aprietan y no pasa absolutamente nada.
Peor: en "Módulos del sistema" el admin **puede prenderlos**, y la descripción le promete
*"Reportes por período, categoría, producto y servicio, con descarga"*. Prende Servicios,
aparece "Servicios" en el menú, lo aprieta, no pasa nada. **Reportes viene prendido de
fábrica**, así que todas las empresas lo tienen.
*Por qué confunde*: para alguien con poca experiencia digital, un botón que no reacciona
no significa "todavía no está": significa "está fallando" o "lo estoy apretando mal".
Y en el caso de Reportes lo va a buscar, porque es lo que más le sirve.
*Qué proponer*: o **sacar del menú y del listado de módulos lo que no existe** hasta que
exista, o llevarlos a una pantalla que diga *"Este módulo todavía no está disponible.
Lo estamos construyendo."* con el mismo diseño del resto. Lo que no puede quedar es el
`#`. Mínimo inmediato: apagar Reportes por defecto.
*Costo*: chico.

**H-04 · El operador no puede terminar un alta si le falta la categoría**
*Dónde*: Productos → Nuevo producto. *Rol*: operador.
"Categoría" es obligatoria y el desplegable sólo trae las que ya existen. El operador **no
tiene permiso** para crear categorías (es del admin). Si el producto nuevo no entra en
ninguna, la pantalla no ofrece salida ni dice a quién pedirle qué: simplemente no se puede
guardar.
*Por qué confunde*: el operador es el del depósito, el que recibe mercadería nueva. Se
queda trabado sin entender si es un problema del sistema o de él.
*Qué proponer*: debajo del desplegable, cuando el rol es operador: *"¿No está la categoría
que necesitás? Pedísela al administrador de tu empresa."* Al admin, en ese mismo lugar, un
enlace directo a la pantalla de categorías.
*Costo*: chico.

### HACE PERDER TIEMPO

**H-05 · En el celular, las tablas esconden justo la columna que importa**
*Dónde*: Stock (existencias y movimientos), Movimientos, Productos. *Rol*: todos, a 375 px.
Medido: en Stock la tabla ocupa **529 px dentro de 343 px visibles**; ESTADO arranca en el
361 y ACCIONES en el 462, o sea que **"Reponer" / "Sin stock" y los dos botones de cada
fila están enteramente fuera de la pantalla**. En Movimientos es peor: **791 px en 343**, y
**MONTO arranca en el 514**. La barra de arrastre horizontal está abajo de todo, después de
ocho filas: uno se entera de que hay más columnas recién cuando llegó al final.
*Por qué confunde*: es la pantalla que el operador mira parado en el depósito con el
teléfono en la mano. Ve la lista, no ve el aviso. El tesorero ve sus movimientos y no ve
los importes.
*Qué proponer*: por debajo de 768 px, **dejar de usar tabla y dibujar cada fila como una
tarjeta**: nombre arriba, existencia grande, la chapita de estado al lado y los dos botones
abajo. El patrón ya existe en la app: es exactamente lo que hace el bloque "Alertas de
stock" del tablero, que en 375 px se ve perfecto. Mientras tanto, **sacar en celular las
columnas que no se necesitan** (CATEGORÍA, NATURALEZA, CARGADO POR) libera 190 px de los
450 que faltan.
*Costo*: medio (una hoja de estilos y el `render` de tres listados).

**H-06 · Para cargar la luz hay que contestar tres desplegables encadenados**
*Dónde*: Movimientos → Nuevo movimiento. *Rol*: tesorero y admin.
El formulario pide **Naturaleza → Categoría → Tipo**, cada uno bloqueado hasta contestar el
anterior ("Elegí la naturaleza primero", "Elegí la categoría primero"). Son tres decisiones
para decir "pagué la luz".
**Lo notable es que la app ya resolvió esto mejor en otro lado**: el modal "Registrar el
dinero" que sale después de una venta de stock usa **un solo desplegable** —"Categoría y
tipo"— con las opciones escritas *"Ventas › Venta minorista"*, filtradas por naturaleza, y
una ayuda que dice *"Se muestran solo las categorías de ingresos"*. Es la misma decisión en
un tercio de los pasos.
*Qué proponer*: llevar ese desplegable único al alta de movimientos. Queda: *¿entró o
salió?* (dos botones grandes, no un `select`), *¿de qué?* (un desplegable), *¿cuánto?*,
*¿cuándo?*. Tres campos en vez de cinco.
*Costo*: medio (una pantalla), y se reusa código que ya existe y está probado.

**H-07 · Corregir un movimiento obliga a escribirlo de nuevo**
*Dónde*: Movimientos y Stock. *Rol*: todos.
No hay "editar": si uno se equivocó en el monto o en la cantidad, tiene que anular y cargar
otra vez desde cero. Los dos modales de anulación lo explican bien (*"Si fue un error,
cargá el movimiento correcto de nuevo"*), así que la regla contable se entiende — pero
después la persona queda sola frente a un formulario en blanco.
*Qué proponer*: no cambiar la regla (la anulación lógica está bien). Después de anular,
**abrir el formulario ya cargado con los datos del movimiento anulado**, para que sólo haya
que corregir lo que estaba mal. Un botón *"Anular y cargar de nuevo"*.
*Costo*: chico.

**H-08 · Toda la configuración está abajo del nombre del usuario**
*Dónde*: menú del avatar. *Rol*: admin.
Ahí conviven "Mi empresa", "Gestión de usuarios", "Categorías de productos", "Motivos de
stock", "Módulos del sistema" y "Cerrar sesión". El menú del avatar es, en cualquier
programa, *mis cosas y salir*. Nadie busca ahí cómo clasifica sus productos.
Y no hay un criterio: **"Motivos de stock" está en el avatar y también como botón en
Productos, pero no está en Stock**, que es la única pantalla donde se usan. Las categorías
de dinero, en cambio, **no están en el avatar**: sólo como botón adentro de Movimientos.
*Qué proponer*: un solo lugar, **"Configuración"**, en el menú principal, visible sólo para
el admin, con las cuatro pantallas adentro. En el avatar quedan "Mi empresa", "Mi
contraseña" y "Cerrar sesión". Los botones de atajo pueden seguir en cada pantalla, pero
en la que corresponde: Motivos en Stock, no en Productos.
*Costo*: medio (tocar el `header.js`, que ya está unificado — por suerte es un solo archivo).

**H-09 · El listado vacío le echa la culpa a un filtro que nadie tocó**
*Dónde*: Movimientos (y los demás listados). *Rol*: cualquiera, empresa nueva.
Una empresa recién aprobada entra a Movimientos y lee: *"No hay movimientos para los
filtros elegidos"*. No eligió ningún filtro. El mensaje la manda a revisar los filtros en
vez de a cargar su primer movimiento.
En el tablero pasa parecido: de los seis bloques, tres dicen alguna versión de "no hay
nada" (*"Todavía no hay movimientos"*, *"El módulo de Productos no está activo"*, *"Módulo
en desarrollo"*) y **ninguno dice por dónde empezar**.
*Qué proponer*: separar los dos casos. Sin datos: *"Todavía no registraste ningún
movimiento."* + botón **"Registrar el primero"**. Con filtros puestos: el mensaje actual +
"Limpiar filtros". Y en el tablero de una empresa nueva, un bloque de arranque: *"Para
empezar: 1) revisá tus categorías, 2) dá de alta a tu equipo, 3) cargá tu primer
movimiento"*, con los tres enlaces.
*Costo*: chico los mensajes, medio el bloque de arranque.

**H-10 · El aviso de "sólo el admin puede modificar esto" está abajo de todo**
*Dónde*: Mi empresa. *Rol*: tesorero y operador.
La pantalla muestra el formulario completo con aspecto de editable. Los campos están
deshabilitados, pero el cartel que lo explica —*"Sólo el administrador de la empresa puede
modificar estos datos"*— está **al final, después de hacer scroll**. La persona intenta
escribir, no pasa nada, y no sabe por qué.
*Qué proponer*: mover el cartel **arriba de todo**, antes del primer campo, y darles a los
campos aspecto de sólo lectura (sin recuadro).
*Costo*: chico.

**H-11 · La lista de productos está ordenada de dos maneras distintas**
*Dónde*: Stock vs. Productos vs. los desplegables. *Rol*: operador y admin.
La tabla de Stock va en orden alfabético (*Agua mineral, Arroz, Bolsa de pan…*). La de
Productos y **todos los desplegables** van por categoría y después por nombre, pero sin
mostrar la categoría: la lista **parece** alfabética y "Agua mineral 2L" queda último, sin
razón visible. El operador que busca el agua en el desplegable mira arriba y no la
encuentra.
*Qué proponer*: alfabético en todos lados. Si se quiere agrupar por categoría en los
desplegables, usar `<optgroup>` para que el corte se vea.
*Costo*: chico.

**H-12 · "Ingresos" es un número distinto según la pantalla**
*Dónde*: tablero vs. Movimientos. *Rol*: tesorero y admin.
El tablero dice *"Ingresos del mes: $ 598.000"*. Movimientos dice *"INGRESOS: $ 873.000"*,
sin aclarar de qué período (son todos los movimientos, incluido agosto). Dos pantallas, dos
verdades, el mismo rótulo.
Y para la pregunta *"¿cómo venimos contra el mes pasado?"* no hay respuesta directa: el
tablero muestra un porcentaje pero no el número anterior, y en Movimientos hay que poner
Desde y Hasta a mano, anotar, y repetir para el otro mes.
*Qué proponer*: rotular los totales de Movimientos con el período que están sumando
(*"Total del período filtrado"*, o directo *"Todos los movimientos"*), y agregar en los
filtros un atajo **"Este mes / Mes pasado"** en vez de obligar a cargar dos fechas.
*Costo*: chico el rótulo, medio el atajo.

### GENERA DUDA

**H-13 · Al operador le muestran tres casilleros de plata vacíos**
*Dónde*: tablero. *Rol*: operador.
Silvia ve "Ingresos del mes", "Egresos del mes" y "Balance del mes" con una rayita y **sin
ninguna explicación**. Recién abajo, en otro bloque, dice *"Tu usuario no tiene acceso a los
movimientos"*.
Lo llamativo es que **el caso inverso ya está resuelto**: al tesorero, el casillero de
"Productos a reponer" le dice *"Sin acceso"*; y a una empresa sin el módulo prendido le dice
*"Módulo no activo"*. Falta hacer lo mismo en los tres de plata.
*Por qué confunde*: una rayita donde debería haber plata se lee como "la empresa está en
cero" o "no cargó nada", no como "esto no es para vos".
*Qué proponer*: poner *"Sin acceso"* en los tres, igual que en el otro. Mejor todavía: no
mostrarlos, y que el operador vea en su lugar los datos de su trabajo.
*Costo*: chico.

**H-14 · Las flechas dicen lo contrario de lo que dice el número al lado**
*Dónde*: Stock (historial y motivos), Movimientos (totales y filtro de categorías).
Una entrada se marca con **↓** y una salida con **↑**. En el historial eso queda al lado de
la cantidad: *"↓ Compra … **+20** kg"* y *"↑ Pérdida … **−2** kg"*. La flecha para abajo
acompaña a un más y la flecha para arriba a un menos.
Además, en el filtro de categorías de Movimientos las opciones aparecen como *"↓ Ventas"* y
*"↑ Insumos"*, con la flecha sola, sin ninguna referencia que explique qué significa.
*Por qué confunde*: es una convención de depósito ("baja a la estantería"), pero el público
son 35-55 años sin costumbre de sistemas, y al lado tienen un signo que dice lo contrario.
*Qué proponer*: quedarse con **una sola señal**. El signo y el color ya alcanzan
(`+20 kg` en verde, `−2 kg` en rojo): sacar las flechas. En los desplegables, palabras:
*"Ventas (entra plata)"*, como ya se hace bien en los motivos, que dicen *"Compra (entrada)"*.
*Costo*: chico.

**H-15 · El cartel de anular un movimiento de plata no dice cuál**
*Dónde*: Movimientos → Anular. *Rol*: tesorero y admin.
Pregunta *"¿Confirmás anular el movimiento -$ 32.000,00 · Luz?"*. En la lista de prueba hay
**dos movimientos de -$32.000 de Luz**, uno del 9/9 y otro del 15/9: el cartel no permite
distinguirlos. El equivalente de stock **sí lo hace bien**: *"¿Anular la entrada de 20 kg de
Queso cremoso del 15/09/2026?"*.
*Qué proponer*: copiar el de stock — agregar la fecha y la descripción.
*Costo*: chico.

**H-16 · Se muestran dos mensajes de error distintos para el mismo problema**
*Dónde*: Stock → Registrar movimiento, cuando no alcanza el stock.
Aparecen los dos, uno abajo del otro: un recuadro rojo con *"Hay **0 caja** y estás sacando
3. No alcanza."* y, más abajo y más chico, *"No hay stock suficiente: hay 0 y estás sacando
3. Si el sistema todavía no tiene la existencia real, cargala con un movimiento de 'Ajuste
positivo'."* El segundo es el que dice qué hacer, y es el menos visible.
Además el botón "Registrar" **queda habilitado** aunque el formulario ya sabe que no se
puede.
*Qué proponer*: un solo mensaje, el que explica la salida, en el recuadro rojo. Y
deshabilitar "Registrar" mientras el aviso esté.
*Costo*: chico.

**H-17 · Al operador le avisan que el movimiento genera plata, y no puede hacer nada**
*Dónde*: Stock. *Rol*: operador.
Al elegir "Venta" el formulario dice *"Este motivo genera un ingreso de dinero"*, y después
del alta el historial marca el movimiento con la chapita naranja **"Falta el $"**. El
operador **no tiene acceso a finanzas**: no se le ofrece cargar nada y no puede resolverlo.
En el historial de queso de la empresa de prueba, tres de cuatro movimientos aparecen
marcados así.
*Por qué confunde*: una marca de advertencia sobre el propio trabajo, que uno no puede
sacar, se lee como "hiciste algo mal".
*Qué proponer*: al operador, no mostrar ni el aviso ni la chapita. Si se quiere que avise a
alguien, que el texto sea accionable: *"Avisale al tesorero para que registre el cobro"*.
Y renombrar la chapita (ver vocabulario).
*Costo*: chico.

**H-18 · Aprobar una empresa no pregunta nada; rechazarla sí**
*Dónde*: Panel del superadmin.
"Aprobar" es un clic y listo: la empresa desaparece de pendientes, se le siembran
categorías y módulos, y sus cinco usuarios pueden entrar. "Rechazar", que está al lado y es
más reversible, **sí abre un cartel de confirmación** bien escrito.
Además, ni una ni otra avisan que **la empresa no se entera**: no hay correo, así que
alguien tiene que llamarla por teléfono.
*Qué proponer*: confirmación también en Aprobar, con el nombre de la empresa, y un renglón:
*"La empresa no recibe un aviso automático. Avisale vos a [admin] que ya puede entrar."*
*Costo*: chico.

**H-19 · "Operador" y "Tesorero" no dicen qué hace cada uno**
*Dónde*: Usuarios → Nuevo usuario. *Rol*: admin.
El desplegable ofrece "Tesorero" y "Operador", sin una palabra de explicación. Para dar de
alta a alguien del depósito hay que saber de antemano que eso es "Operador" — una palabra
que puede significar cualquier cosa. Si se elige mal, la persona entra y ve un menú que no
es el suyo.
Tampoco se explica por qué no se puede crear otro administrador (está bien que no se pueda,
pero nada lo dice).
*Qué proponer*: describir el rol en la misma opción: *"Tesorero — carga y consulta el
dinero"*, *"Operador — carga productos y stock del depósito"*. Y un renglón: *"Para que otra
persona sea administradora, pedilo al administrador de la plataforma."*
*Costo*: chico.

**H-20 · No hay dónde cambiarse la propia contraseña, ni qué hacer si se olvida**
*Dónde*: menú del avatar y pantalla de login. *Rol*: todos.
El menú del avatar no tiene "Mi contraseña": una vez que pasó el cambio obligatorio del
primer ingreso, no hay forma de cambiarla. Y el login no tiene *"¿Olvidaste tu
contraseña?"* — como el recupero por correo no existe a propósito, no hay nada que le diga
a la persona que la solución es pedírsela a su administrador.
*Qué proponer*: en el login, un renglón fijo: *"¿Olvidaste tu contraseña? Pedísela al
administrador de tu empresa."* (y al superadmin, para los admins). En el avatar, agregar
"Mi contraseña", que reusa el formulario del cambio obligatorio que ya existe.
*Costo*: chico el del login, medio el otro.

### MOLESTA

**H-21 · Iconitos sin rótulo en las pantallas más delicadas.** Usuarios usa lápiz / llave /
persona tachada; Productos usa lápiz / ojo tachado; Stock usa relojito / doble flecha;
Categorías usa `+` / lápiz / ojo tachado. **Cuatro vocabularios de íconos** y ningún texto.
Los de Stock sí tienen `title` (aparece el globito), los de las categorías no. Y el mismo
"dar de baja" es un ojo tachado en un lado y una persona tachada en otro. → Un ícono por
acción en toda la app, `title` en todos, y en escritorio texto al lado en los destructivos.
*Costo*: chico.

**H-22 · El bloque "Matches" ocupa un tercio del tablero para decir "Módulo en
desarrollo".** Mientras tanto, "Movimientos recientes" queda apretado en 250 px: las
descripciones se parten en tres renglones y la fecha se corta ("13/…"). → Sacar el bloque
hasta que el módulo exista y repartir el ancho entre los dos que sí tienen datos.
*Costo*: chico.

**H-23 · El registro de empresa es lo menos legible de la app.** Es la única pantalla con
campos verdes sobre fondo verde y texto de ayuda en verde claro; todo el resto son tarjetas
blancas. Para 35-55 años es justo al revés de lo que conviene. → Usar el mismo estilo de
tarjeta blanca que el resto de los formularios.
*Costo*: chico.

**H-24 · "+2542% vs mes anterior".** Cuando el mes anterior fue casi cero, el porcentaje da
números absurdos que no significan nada y asustan. → Cuando el mes anterior es 0 o muy
chico, mostrar el número (*"mes anterior: $ 12.000"*) en vez del porcentaje.
*Costo*: chico.

**H-25 · Detalles de redacción.** *"18 paquete"*, *"0 caja"*, *"Hay 0 caja"*: falta el
plural. *"Nombre de la empresa \*"* con asterisco en un formulario de sólo lectura. El
producto recién creado no queda a la vista (la lista no salta hasta él ni lo resalta). El
botón de limpiar filtros de Movimientos es un ícono verde sin rótulo, mientras que en Stock
y Productos el mismo botón dice "Limpiar filtros".
*Costo*: chico.

**H-26 · En el celular, el encabezado se come la primera pantalla.** Logo, "CooperApp",
el menú en fila y la chapa con el nombre ocupan ~490 px de los 812 del teléfono; sumando el
encabezado verde de cada pantalla, **el primer dato aparece pasados los 900 px**. En Stock
hay que bajar casi dos pantallas para ver el primer producto. → Encabezado compacto en
celular: logo chico a la izquierda, menú en un botón de hamburguesa, avatar a la derecha,
todo en una fila.
*Costo*: medio.

---

## Lo que está bien resuelto (no romperlo)

- **La pantalla de Motivos de stock** es el mejor texto explicativo de la app: el recuadro
  verde define qué es un motivo, distingue los dos efectos y da el ejemplo difícil (pérdida
  y robo sacan mercadería pero no mueven plata). Es el modelo a copiar en las otras
  pantallas de configuración, que no tienen nada parecido.
- **El modal "Registrar el dinero"** después de una venta: explica por qué apareció, usa un
  solo desplegable con el camino completo (*"Ventas › Venta minorista"*), trae el detalle
  escrito, aclara *"El total de la operación, no el precio por unidad"* —que anticipa un
  error real— y el botón secundario dice *"Ahora no"* en vez de "Cancelar". Es la mejor
  pantalla del sistema. *(Lo único que falta: decir qué pasa si se elige "Ahora no".)*
- **La vista previa del formulario de stock**: *"Hay 5,50 kg · después del movimiento queda
  25,50 kg"*, actualizada mientras se escribe. Elimina la duda antes de que aparezca.
- **Los dos carteles de anulación** explican que no se borra nada y qué hacer después.
- **Módulos del sistema**: descripciones en castellano llano, el aviso de que los datos se
  conservan, el candado en el módulo base, el menú que se actualiza en el momento, y el
  único botón "Volver al panel" de toda la app. El apagado es completo y prolijo: se ocultan
  también las pantallas de configuración asociadas.
- **Las ayudas del alta de producto**: *"En qué se mide: por unidad, por kilo, por litro…"*,
  *"Cuando baje de acá, el sistema avisa. En 0 no avisa."*, *"Es opcional: si no subdividís
  esta categoría, dejala en blanco."* Así se escribe para este público.
- **Los cuatro estados de existencia** (con *"Sin cargar"* separado de *"Sin stock"*) y el
  botón de historial por producto, que responde sola la pregunta "¿por qué quedan tan
  pocos?". La cuenta se lee entera: +20 −2 −12,50 +20.
- **Los subtítulos de las pantallas** de Stock, Productos y Categorías, que dicen en una
  línea para qué sirve cada una.
- **Los modales en celular**: una pregunta por renglón, botones grandes. Ahí el mobile first
  se nota.

---

## 4. Plan sugerido

**Antes de programar el Sprint 09 (Servicios).** El módulo de Servicios va a duplicar
pantallas de Productos: cada nombre que hoy esté mal se copia a un lugar más.

1. **Cerrar la puerta de entrada** (H-01): que el modal de registro no se cierre con error,
   que diga qué campo falta, asteriscos en los obligatorios, y Matrícula opcional.
2. **Sacar del menú lo que no existe** (H-03): Servicios, Reportes y Articulación fuera —
   o a una pantalla de "en construcción". Reportes, apagado por defecto en el catálogo.
3. **Mandar al superadmin a su panel** (H-02): redirect por rol y "Empresas" en el menú.
4. **Decidir el vocabulario en grupo** (tabla de la sección 2) y aplicarlo de una sola vez
   en las pantallas que ya existen. Empezar por *naturaleza*, *categorías* y la familia
   *anular / dar de baja / desactivar*. Esto es una decisión de equipo, no técnica: si no
   hay acuerdo, el nombre nuevo no se sostiene en la defensa.
5. **Unificar dónde vive la configuración** (H-08): un "Configuración" en el menú principal
   con las cuatro pantallas; el avatar queda para "Mi empresa", "Mi contraseña" y "Salir".
   Es un solo archivo (`header.js`), y conviene hacerlo antes de sumar Servicios.
6. **Arreglar el celular en los tres listados** (H-05, H-26): tarjeta en vez de tabla por
   debajo de 768 px, y encabezado compacto. Es lo más caro de la lista y lo que más se nota.
7. **Simplificar el alta de movimientos** (H-06): un desplegable en vez de tres, copiando
   el que ya funciona en "Registrar el dinero".

**Puede esperar al Sprint 13 (UX y cierre).**

8. Vacíos con salida (H-09) y el bloque de arranque para la empresa nueva.
9. Consistencia fina: "Sin acceso" en los casilleros del operador (H-13), flechas (H-14),
   confirmación de aprobar (H-18), el cartel de anular con fecha (H-15), error duplicado
   (H-16), orden alfabético (H-11), un solo juego de íconos (H-21).
10. Pulido: "Matches" fuera del tablero (H-22), estilo del registro (H-23), el porcentaje
    absurdo (H-24), plurales y asteriscos sueltos (H-25).

---

## A validar con usuarios reales

Esto un chat no lo puede responder, y es lo que más vale del contacto que tiene el grupo
con cooperativas y la fundación:

- Si **"rubro"** funciona mejor que "categoría" para gente de oficio, y si "categoría de
  dinero / de productos" alcanza o hace falta un nombre distinto.
- Si el árbol de **dos niveles** (categoría → subcategoría) se entiende, o si con uno solo
  la mayoría estaría cómoda.
- Si el operador entiende que **la existencia sale de sumar los movimientos** o espera
  poder escribir "hay 20" directo.
- Si los **campos de composición del grupo** (mujeres / varones / diversidades) tienen
  sentido para una PyME o si sólo lo tenían para una cooperativa.
- **Cuántos productos** maneja de verdad una empresa chica: si son 200, el buscador y los
  filtros dejan de alcanzar y hace falta paginado.

---

## Bugs encontrados de paso (no es el foco de esta auditoría)

- **El registro público acepta una contraseña de 3 caracteres** (`123`). No hay largo
  mínimo ni se comunica ninguna regla.
- **La pantalla de Usuarios muestra el DNI de todos en la tabla**, y el DNI es la
  contraseña temporal. Junto con la columna que dice quién tiene contraseña temporal,
  alcanza para entrar a esas cuentas mirando la pantalla por encima del hombro. El acceso
  a la API ya está cerrado a `admin_empresa`; lo que queda es la exposición visual.
- `superadmin.html` y las pantallas de configuración **siguen en el HTML para todos los
  roles** (ocultas por CSS). No es explotable por sí solo, pero conviene saberlo.

---

# Resultado de las correcciones (16/09/2026)

Se aplicó la **primera tanda**: los cuatro hallazgos que bloquean, más la decisión sobre
la matrícula. Lo demás quedó cargado en el backlog (`datos.py`, épica E10).

## Lo que se corrigió

**Decisión de producto: la matrícula se saca del sistema.** Era el número de inscripción en
el INAES, un dato del mundo cooperativo. Con el producto apuntando a empresas en general
—de un monotributista a una PyME— la mayoría no tiene ninguna, y el dato registral que sí
tienen todos es el CUIT, que ya se pide y ya es único. No se volvió opcional: se sacó
entera, de la pantalla de registro, del perfil de la empresa, del panel del superadmin, del
modelo, del controlador y de la tabla `empresas`. Dejar una columna muerta era garantizar
que alguien la volviera a mostrar más adelante.
**La federación se queda**, porque una PyME sí puede pertenecer a una cámara, pero pasó a
llamarse *"Cámara o federación a la que pertenece"* y su marcador de posición dice qué hacer
si no pertenece a ninguna. Siempre fue opcional.

**H-01 · El registro ya no se cierra ni borra lo escrito.** El modal se cierra **sólo** si el
registro salió bien. Cuando algo falta, el aviso aparece **adentro del formulario**, arriba
de todo, diciendo qué campo es (*"Falta completar: DNI"*); el campo se marca, la pantalla
baja hasta él y el aviso se borra apenas la persona lo corrige. Los obligatorios llevan `*` y
hay un renglón que lo explica. Cada error del servidor viaja ahora con el nombre del campo
que lo causó, así que también los errores de formato y de duplicado marcan el campo.
De paso se cerró el bug del final del informe: **el registro exigía cualquier contraseña**,
y ahora pide 6 caracteres como mínimo, que es lo que ya exigía el cambio de contraseña.

**H-02 · El superadmin entra a su panel.** Al iniciar sesión va directo a `superadmin.html`,
y si llega al panel general por la dirección, lo desvía. En su menú principal ahora está
**"Empresas"** —dejó de estar escondido abajo de su propio nombre— y desapareció "Panel
general", que le hablaba de una empresa que no tiene.

**H-03 · Se acabaron los botones que no reaccionan.** Servicios, Reportes y Articulación
llevan a una pantalla real que explica qué va a hacer ese módulo, aclara que **no es un
error de la persona**, y ofrece volver. Es un solo archivo (`en-construccion.html`) para los
tres, con el mismo diseño que el resto del sistema.
Además **Reportes dejó de venir prendido de fábrica**: era el módulo que más le interesa a
cualquier empresa y toda empresa nueva lo encontraba en el menú sin nada atrás.

**H-04 · El operador ya no queda trabado.** Debajo del desplegable de categoría del alta de
producto hay un renglón que cambia según quién esté: al operador le dice a quién pedirle la
categoría que falta; al administrador le da el enlace para ir a crearla. Y distingue el caso
de que **no haya ninguna categoría cargada**, que es el que deja el alta imposible.

**Bug encontrado al corregir, no estaba en el informe.** En el panel del superadmin, el
detalle de una empresa mostraba **Domicilio y Cámara o federación siempre vacíos**, aunque
estuvieran cargados: el modal lee siempre de la lista de "todas las empresas" —también cuando
se abre desde Pendientes— y esa consulta no traía esas dos columnas. Es justo la pantalla
donde se decide aprobar una empresa con los datos a la vista. Corregido en el `SELECT`.

## Cómo se probó

Base recreada desde cero con los dos `.sql`, en los tres niveles que usa el proyecto:

- **Base**: la tabla `empresas` ya no tiene `matricula`, las cuatro empresas de prueba entran
  sin ella, y el catálogo de módulos tiene Reportes en 0.
- **API**: registro con cada campo obligatorio vacío (devuelve el nombre del campo),
  contraseña de 3 caracteres (rebota), **alta completa sin matrícula** (entra), aprobación de
  esa empresa nueva con su siembra intacta (5 módulos, 6 categorías, 15 tipos), y el redirect
  de los cuatro roles al iniciar sesión.
- **Navegador**: registro con error (el modal queda abierto y no se pierde nada) y registro
  completo de una empresa sin matrícula; el superadmin desviado a su panel; el detalle de la
  empresa sin matrícula y con la federación rotulada; el operador viendo su ayuda de
  categoría; y la pantalla de módulo en construcción. Todo en escritorio y en 375 px.

## Lo que quedó en el backlog

Cargado en `datos.py` como historias nuevas del **Sprint 13** (épica E10, Calidad y UX):

| HU | Qué abarca | Hallazgos |
|---|---|---|
| HU-84 | Vocabulario unificado, decidido en grupo | Sección 2 completa, H-21 |
| HU-85 | Listados como tarjeta en celular y encabezado compacto | H-05, H-26 |
| HU-86 | Configuración en un solo lugar del menú principal | H-08 |
| HU-87 | Alta de movimiento en menos pasos y corrección sin recargar | H-06, H-07 |
| HU-88 | Pantallas vacías con salida y primeros pasos | H-09, H-13 |

Los demás (H-10 a H-12, H-14 a H-20, H-22 a H-25) entran dentro de HU-64, que ya existía en
el Sprint 13 y cubre la revisión de textos, rótulos y ayudas de todas las pantallas.

**El vocabulario va primero y es decisión del grupo**, no técnica: mientras no se acuerde, cada
pantalla nueva —empezando por Servicios, que duplica las de Productos— suma un lugar más donde
corregirlo después.

**Ojo al actualizar**: cambió el esquema (se fue una columna), así que **todo el grupo tiene
que recrear la base**.
