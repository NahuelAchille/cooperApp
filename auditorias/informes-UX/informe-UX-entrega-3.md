# Auditoría de experiencia de usuario · CooperApp · entrega, tercera pasada

**Fecha**: 15/11/2026 · **Sobre**: `master` en `57627ad` (las correcciones de la segunda vuelta).
**Foco**: de punta a punta otra vez. Las 47 tareas del prompt con cada rol, con atención a las
nuevas 43 a 47, que miran si lo corregido siguiendo `informe-UX-entrega-2.md` **resolvió** lo
reportado. Más todo "Qué mirar", las tres medidas (375, 800 y 1280 px) en cada pantalla y los
archivos que salen (CSV abierto en Excel de verdad y el PDF).

**Método**:
- Las tareas, en el navegador, como cada persona: Silvia (operadora), Roberto (tesorero) y Marta
  (admin) de La Esperanza; Osvaldo (admin) y Daniel (tesorero) de Metalúrgica; el superadmin; y
  Elena, admin de Huerta Norte recién aprobada. Edge sin ventana manejado por un script propio
  (puerto de depuración 9377), tocando los botones de la pantalla, con capturas de cada paso y
  los avisos (toasts) registrados al aparecer.
- Las medidas: 33 pantallas × 3 anchos con seis usuarios (99 mediciones): ancho de la página y de
  cada tabla contra su contenedor, elementos que se salen del borde, alto de la franja de título,
  píxel de la primera fila, texto de menos de 13 px. Capturas a 800 y 375 px de cada una.
- Los CSV, abiertos con **Excel 16 por COM**, leyendo celda por celda el texto que muestra y si lo
  tomó como número o como texto. Los PDF, abiertos en el visor de Edge y mirados como imagen.
- Los mensajes del servidor: el toast de cada acción y una búsqueda de las palabras viejas en los
  textos que devuelven los controladores.

**Entorno**: copia aparte, base `cooperApp_ux` (creada desde copias de los dos `.sql` con el `USE`
cambiado) y la app en el puerto 3002, siempre por `127.0.0.1`. La base `cooperApp`, el puerto 3000
y el 9341 de QA no se tocaron. Al terminar se borró `cooperApp_ux` y se cerraron la app y el Edge
propios por PID. No se tocó código ni se commiteó nada.

> Busca lo que **funciona pero confunde**. Los bugs van en una línea al final.
> Lo ya decidido no se vuelve a reportar; donde la solución **no alcanzó**, se dice.
> Los hallazgos van numerados **H3-01 a H3-20**, para no confundirlos con los G-xx de la segunda
> pasada, los E-xx de la primera, los F-xx del final ni los H-xx de los primeros.

---

## 1. Resumen ejecutivo

**La segunda vuelta alcanzó casi entera.** Corregir ya es igual en todos lados y vale para una
rotura (tarea 43: se corrige en tres toques y el cartel dice *"si cancelás, no pasa nada"*);
*Completar la plata* pide el precio por bolsa y calcula el total (tarea 47, sin cuentas de
cabeza); el panel compara contra *"Del 1 al 15 de octubre"* (tarea 45, se entiende); *Se olvidó
la contraseña* se encuentra y el cartel dice qué decirle a Jorge (tarea 46); *Lo que se perdió* ya
no tiene la nota que lo contradecía; el tesorero tiene *Entendido, se lo pido*. **Ninguna de las
99 mediciones tiene scroll de costado** y no apareció ningún bug. Lo que queda tiene tres caras:

**1. Lo que se arregló en "Por producto" no se llevó a "Por servicio", y "Por producto" sigue sin
contestar "¿qué me conviene?".** En *Por servicio* siguen arriba los tres casilleros del período
(*Entró $ 983.000*) sobre una tabla que suma $ 367.000, con una nota en letra chica que dice que
no cierran: es exactamente lo que G-02 sacó de *Por producto*. Y en *Por producto*, *Vendido /
Comprado* sin restar ya no pinta de rojo al queso, pero deja los dos números en la misma fila
(*vendido $ 178.250 · comprado $ 328.000*): Marta los resta de cabeza igual. La pantalla contesta
*"qué se vende más"*, no *"qué me conviene"* (tarea 44).

**2. Hay caminos que se cortan en el último paso.** El login, ante una contraseña olvidada, sólo
dice *"Email o contraseña incorrectos"*: Jorge no tiene cómo saber que el administrador se la
puede volver a la inicial. La admin, en Movimientos, ve **Anular o corregir** en la plata de una
venta, y el cartel no tiene *Corregir*: le dicta *"Stock → Entradas y salidas → Anular o
corregir"* sin un botón que la lleve. Y el link *"Agregala acá"* de los formularios de producto y
de servicio saca de la ventana y **pierde lo que se escribió**, justo lo que las ventanas
estáticas vinieron a evitar.

**3. Una rotura con el sistema en cero sigue costando dos viajes.** *No alcanza* ahora nombra el
*Ajuste positivo* (G-06 alcanzó en el texto), pero para cargar *"se rompieron 3 cajas"* con
Milanesas en 0 hay que cambiar el motivo, cargar el ajuste, volver a abrir la ventana y cargar la
rotura; y el texto dice *"(en Otra entrada o salida)"* estando ya ahí.

---

## 2. Propuesta de vocabulario

Ordenada por cuánto confunde hoy. *Ajuste positivo / negativo* sigue abierto a propósito.

| Término actual | Dónde aparece | Problema | Propuesto | Qué hay que tocar |
|---|---|---|---|---|
| **"Email o contraseña incorrectos"** (y nada más) | Login | No dice qué hacer si uno se la olvidó | Agregar: *"Si te olvidaste la contraseña, pedile al administrador de tu empresa que te la vuelva a la inicial (tu DNI)."* | Pantalla (`login.html`) |
| **"Lo que se perdió"** (vista) | Reportes, pantalla, CSV y PDF | Incluye el **consumo interno** (el arroz para el comedor), que nadie llama "perder" | **"Lo que salió sin venderse"**, o dejar el nombre y sumar *"roturas, robos, vencimientos, consumo propio y ajustes"* debajo del título. **A validar con usuarios** | Pantalla y servidor (título de los archivos) |
| **"Otra"** (botón de cada producto) | Stock → *Cuánto hay* | No evoca lo que se carga ahí, que es sobre todo una rotura | **"Rotura u otra"** | Pantalla (`stock.html`) |
| **"Precio por kg"** | *Registrar una venta* | La compra dice *"Lo que pagaste por kg"*; la ayuda de la venta dice *"acá va lo que cobraste"* | **"Lo que cobraste por kg"** | Pantalla |
| **"La categoría y el tipo van igual."** | Nuevo movimiento → servicio | Ya no hay ningún campo que se llame *categoría* ni *tipo*: arriba dice *"¿De qué fue la plata que entró?"* | *"Igual tenés que decir arriba de qué fue la plata."* | Pantalla |
| **"…no se pudo valorizar, porque esos productos…"** | *Lo que se perdió*, pantalla, CSV y PDF | *valorizar* es jerga; con 1 salida dice *esos productos*; no nombra cuál | *"A 1 salida (Bolsa de pan) no le pudimos poner precio: el producto no tiene cargado cuánto cuesta."* | Servidor y pantalla |
| **"Volver a la contraseña inicial"** (botón) | Superadmin → *Todas* | En Usuarios la misma acción se llama *Se olvidó la contraseña* (G-10) | **"Se olvidó la contraseña"** | Pantalla (`superadmin.html`) |
| **"…y Milanesas de soja vuelve al stock"** | Cartel de *Anular* una pérdida | Suena a que el producto había desaparecido | *"…y las 3 cajas vuelven a contarse en lo que hay."* | Pantalla |
| **"Ahora no"** | *Completar la plata* | Todas las demás ventanas dicen *Cancelar* | **"Cancelar"** | Pantalla |
| **"Movimiento registrado correctamente"** | Toast del alta en Movimientos | Las ventas y compras ya dicen *"Listo: la plata quedó anotada…"* | *"Listo: quedó anotado."* | Servidor |
| **"…genera un ingreso, así que hay que elegir una categoría de ingresos"** | Servidor, *Completar la plata* armando el pedido a mano | *ingreso* salió de la vista; `motivo-stock.controller.js` ya lo dice bien | *"Con este motivo entra plata: elegí de qué fue la plata que entró."* | Servidor (`stock.controller.js`, sólo se ve armando el pedido) |
| **"Error al registrar el movimiento de dinero / de stock"** | Servidor, cuando algo falla | *movimiento de dinero / de stock* es el nombre técnico | *"No se pudo guardar. Probá de nuevo en un rato."* | Servidor (sólo ante errores) |

---

## 3. Hallazgos, ordenados por severidad

### BLOQUEA

Ninguno. Todas las tareas se terminan sin ayuda (la tabla está al final).

### GENERA DUDA

**H3-01 · "Por servicio" sigue mostrando los casilleros del período sobre una tabla que no los suma
(lo de G-02 no llegó).**
- **Dónde**: Reportes → *Por servicio*, admin y tesorero de Metalúrgica, pantalla (en el CSV y el
  PDF van como *"Entró en el período"*). Tarea 17.
- **Qué pasa**: arriba, *ENTRÓ $ 983.000 · SALIÓ $ 545.000 · RESULTADO $ 438.000*; abajo, la tabla:
  *Los que ofrecemos — deja $ 367.000*, *Los que contratamos — se lleva $ 18.000*. La explicación
  (*"…por eso no suma lo mismo que los totales del período"*) va en 12,5 px gris arriba de los
  botones. En *Por producto*, desde G-02, los casilleros se esconden y en su lugar va un recuadro
  con los totales de la propia tabla.
- **Por qué confunde a este usuario**: Daniel viene de *"Cuánto deja cada uno"*. Lo primero que ve en
  grande es *Resultado $ 438.000*, y ningún servicio ni bloque suma eso. Es la misma pregunta de
  E-02/G-02 (*"¿por qué no cierra?"*), en la vista de al lado.
- **Propuesta**: la misma solución que *Por producto*: sin casilleros del período en esta vista, y un
  recuadro *"Los que ofrecemos dejaron $ 367.000 · Los que contratamos se llevaron $ 18.000. Acá sólo
  está la plata que se cargó diciendo de qué servicio salió."*
- **Cuesta**: chico (el patrón ya está escrito para *Por producto*).

**H3-02 · "Por producto" ya no engaña, pero no contesta "¿qué me conviene?" (tarea 44).**
- **Dónde**: Reportes → *Por producto*, admin y tesorero, pantalla, CSV y PDF.
- **Qué pasa**: *Queso cremoso — Vendido $ 178.250 · Comprado $ 328.000*, en la misma fila, una al
  lado de la otra, ordenadas por lo vendido. La nota dice *"No se restan a propósito"*. El detalle
  (*vendiste 14,5 kg · compraste 40 kg*) es claro.
- **Por qué confunde a este usuario**: la pregunta de Marta es cuál deja más. Con los dos números lado
  a lado, los resta igual (−$ 149.750) y llega a la misma conclusión que el rojo de antes, ahora sin
  que nadie se lo diga. La vista contesta bien otra pregunta: *qué se vende más*.
- **Propuesta** (**a validar con usuarios**):
  - Que el título prometa lo que la tabla contesta: *"Lo que vendiste y compraste de cada producto"*
    en vez de *"Totales por producto"*, y el botón *Por producto* sin cambio.
  - Si la pregunta *qué me conviene* tiene que tener respuesta, una columna **"Te dejó (aprox.)"** =
    lo vendido − (cantidad vendida × costo de referencia), con *"No se sabe"* si no hay costo, igual
    que en *Lo que se perdió*. Los dos datos ya están cargados.
- **Cuesta**: chico (el título); medio (la columna, en pantalla y en los archivos). Sin cambio de base.

**H3-03 · El login no dice qué hacer si uno se olvidó la contraseña.**
- **Dónde**: Login, cualquier usuario. Es la tarea 46 vista desde el lado de Jorge.
- **Qué pasa**: con la contraseña mal, *"Email o contraseña incorrectos"*. No hay ningún texto ni link
  sobre olvidarla. La salida existe (el admin la vuelve a la inicial, G-10) pero sólo la conoce el
  admin.
- **Por qué confunde a este usuario**: Jorge prueba tres veces, no sabe si el sistema lo bloqueó, ni a
  quién pedir, ni que su DNI va a volver a servir. Probablemente deja de usarlo.
- **Propuesta**: debajo de *Ingresar*: *"¿Te olvidaste la contraseña? Pedile al administrador de tu
  empresa que te la vuelva a la inicial (tu DNI)."* Y lo mismo dentro del mensaje de error.
- **Cuesta**: chico.

**H3-04 · La admin ve "Anular o corregir" en la plata de una venta, y el cartel no tiene Corregir ni
la lleva a donde se corrige.**
- **Dónde**: Movimientos, admin (Marta), en cualquier fila *Venta: … · …* cargada desde Stock. Tarea
  21, segunda mitad.
- **Qué pasa**: la fila dice **Anular o corregir**. El cartel explica *"corregila desde Stock →
  Entradas y salidas → Anular o corregir"* y ofrece sólo **Cancelar** y **Anular**. Para corregir
  hay que cerrar, ir a Stock, cambiar de pestaña y buscar la fila entre 20. (Al tesorero se le
  muestra *Anular* en la fila y *Entendido, se lo pido* en el cartel: ese caso quedó bien.)
- **Por qué confunde a este usuario**: el botón prometió *corregir* y el cartel le da una dirección de
  tres pasos para dictar de memoria. El único botón de color es el que deja la venta *"sin registrar
  el cobro"*.
- **Propuesta**: en el cartel, un botón **"Corregir en Stock"** que abra `stock.html?ver=historial`
  con el producto filtrado (o directo el cartel de esa venta); y en la fila, *"Anular o corregir"*
  sólo si se puede hacer desde ahí.
- **Cuesta**: chico (el link); medio (abrir el cartel de esa venta en Stock).

**H3-05 · "Lo que se perdió" incluye el consumo interno.**
- **Dónde**: Reportes → *Lo que se perdió*, pantalla, CSV y PDF. Tarea 25.
- **Qué pasa**: *¿Por qué se fue? — Pérdida $ 38.450 · Consumo interno $ 3.600*; *¿Qué se fue? — Arroz
  largo fino, 2 kg* (el detalle en Stock: *"Para el comedor del personal"*). La definición
  (*sale mercadería y no mueve plata*) es la decidida; lo que se cuestiona es el nombre.
- **Por qué confunde a este usuario**: para Marta el arroz del comedor no *se perdió*: se usó. Al ver
  *Lo que se perdió $ 42.050* piensa en roturas y robos, y el número es más grande que eso. Y el
  aviso amarillo y la vista de pérdidas del PDF hablan de *"mercadería que se fue sin venderse"*,
  que es la frase justa.
- **Propuesta** (**a validar con usuarios**): renombrar la vista **"Lo que salió sin venderse"**, o
  dejar *Lo que se perdió* con un subtítulo *"Roturas, robos, vencimientos, consumo propio y
  ajustes"*.
- **Cuesta**: chico (pantalla y título de los archivos).

**H3-06 · Dar de alta a alguien del depósito pide un email que quizás no tiene.**
- **Dónde**: Usuarios → *Nuevo usuario*, admin. Tarea 11.
- **Qué pasa**: Nombre, Apellido, **Email**, DNI y Rol, sin ayuda en el email. El rol se explica bien
  (*"Operador — el depósito…"*) y la contraseña también (*"es el DNI"*).
- **Por qué confunde a este usuario**: es el dato que la persona no tiene a mano. Un operario de 50
  años puede no tener email, o no saber cuál usa. Marta no sabe si puede inventar uno, usar el suyo
  o el de la empresa, y el email es con lo que esa persona va a entrar.
- **Propuesta** (**a validar con usuarios**): ayuda debajo del campo: *"Es con lo que va a entrar al
  sistema. Puede ser cualquiera que la persona recuerde; no le llegan correos."*
- **Cuesta**: chico.

### HACE PERDER TIEMPO

**H3-07 · Cargar una rotura cuando el sistema dice que no hay obliga a dos viajes (G-06 alcanzó en el
texto, no en el camino).**
- **Dónde**: Stock → *Otra* / *Otra entrada o salida*, y *Corregir* de una salida. Operador. Tareas 4
  y 43.
- **Qué pasa**: Milanesas en 0, *Pérdida 3*: *"Hay 0 cajas y estás sacando 3. No alcanza. Si en el
  depósito hay más: si fue una compra que no se cargó, registrala primero; si no, corregí la cuenta
  con un «Ajuste positivo» por lo que falta (en Otra entrada o salida)."* El botón se apaga. Hay que
  cambiar el motivo a *Ajuste positivo*, registrar, volver a abrir la ventana, elegir *Pérdida*,
  escribir 3 y el detalle otra vez. Lo mismo al corregir una rotura de 3 a 4 cuando la cuenta da
  justo.
- **Por qué confunde a este usuario**: son dos condiciones en una oración, y la indicación *"(en Otra
  entrada o salida)"* la manda al lugar donde ya está. Silvia termina, pero después de leer dos veces
  y repetir la carga.
- **Propuesta**: texto en dos renglones: *"Hay 0 cajas y estás sacando 3: no alcanza."* / *"Si las
  cajas estaban y el sistema no las tenía, primero cargá un «Ajuste positivo» de 3 y después la
  rotura."* Y, mejor, un botón **"Cargar primero el ajuste de 3"** que haga el ajuste y deje la
  rotura lista para registrar.
- **Cuesta**: chico (el texto); medio (el botón).

**H3-08 · "Agregala acá" saca del formulario y se pierde lo que se escribió.**
- **Dónde**: *Nuevo producto*, *Editar producto* y *Nuevo servicio*, admin, debajo de *Categoría*.
- **Qué pasa**: *"¿Falta la categoría que necesitás? Agregala acá."* es un link común a
  `configuracion-categorias-…html`. Las ventanas con formulario no se cierran con un toque afuera
  (decidido el 14/11) justamente para no perder lo cargado, pero este link las cierra navegando.
- **Por qué confunde a este usuario**: es justo el momento en que se escribió el nombre, la
  descripción, el precio y el costo, y recién al final se descubre que falta la categoría. Al
  volver, la ventana está vacía.
- **Propuesta**: abrir la pantalla de categorías en otra pestaña (`target="_blank"`) con el texto
  *"Agregala acá (se abre aparte; después tocá Actualizar la lista)"*, o subir *Categoría* al
  principio del formulario, antes del nombre.
- **Cuesta**: chico.

**H3-09 · En el celular, las descargas de Reportes quedan al final de la lista.**
- **Dónde**: Reportes a 375 px, admin y tesorero. Tarea 24 desde el teléfono.
- **Qué pasa**: con 19 movimientos, *Descargar para Excel* está en el píxel **5.058** (seis pantallas y
  media de scroll). Se movió ahí a propósito (H-06, 28/09: *"uno entra a mirar"*); el costo crece con
  cada movimiento del mes.
- **Por qué confunde a este usuario**: *"mandale esto al contador"* se hace desde el teléfono. Sin saber
  que los botones existen, se ve el período, los casilleros y una lista larga, y nada que diga que
  se puede descargar.
- **Propuesta** (**a validar con usuarios**): dejar los botones abajo, pero agregar un link chico
  **"Descargar ↓"** al lado de *Período: del 1 al 15…* que baje hasta ellos; o ponerlos debajo de los
  casilleros (el número ya se vio).
- **Cuesta**: chico.

### MOLESTA

**H3-10 · "Anular o corregir" se ve distinto en Stock y en Movimientos.** Mismo nombre y mismo
cartel desde G-04, pero el botón de la fila en Stock es **rojo con un lápiz** y en Movimientos **gris
con el ícono de prohibido**. Y el cartel del tesorero sobre la plata de una venta se titula *"Anular
o corregir"* sin opción de corregir. Rojo es el color de lo que no tiene vuelta, y lo que más se hace
con ese botón es corregir. **Propuesta**: en las dos pantallas, botón verde contorneado con el lápiz;
el cartel del tesorero titulado *"Anular la plata de una venta"*. **Cuesta**: chico.

**H3-11 · Un movimiento sin descripción sigue sin título en los archivos (G-20 llegó a la pantalla).**
En el PDF la luz cargada sin descripción dice **"—"** y en el CSV la celda va vacía; en la pantalla
dice *Luz*. **Propuesta**: el tipo cuando no hay descripción, también en `reporte` CSV y PDF.
**Cuesta**: chico (servidor).

**H3-12 · En Servicios aparece un texto de Productos.** *Mostrar a otras empresas* dice *"Nunca se
muestran el stock, el costo ni el precio"*; un servicio no tiene ninguno de los tres. Es el caso que
el prompt pide reportar (algo de Productos en Servicios). **Propuesta**: *"Aparece en el buscador de
empresas con su nombre, su descripción y su rubro. Nunca se muestra cuánto cobrás."* **Cuesta**:
chico.

**H3-13 · El superadmin sigue con "Volver a la contraseña inicial".** En Usuarios el botón ya es
*Se olvidó la contraseña* y el cartel dice *"que entre con su DNI (28678901)"*; el del superadmin no
muestra el DNI y dice *"administrador"* para Norma. **Propuesta**: mismo botón y mismo cartel que
Usuarios, con el DNI. **Cuesta**: chico.

**H3-14 · Usuarios: botones que no aplican y que se parten.** *Se olvidó la contraseña* aparece
también en Héctor (de baja) y en Claudia (que todavía tiene la inicial). A 1280 px, con el texto
largo, los tres botones de cada fila van en dos renglones (*Dar de baja* solo abajo). **Propuesta**:
esconder *Se olvidó la contraseña* en esos dos casos; los botones en un renglón (columna más ancha o
*Editar* como ícono con texto en el celular). **Cuesta**: chico.

**H3-15 · El panel dice dos veces lo mismo.** *Productos a reponer 2 · 1 sin stock · Ver cuáles* y,
justo abajo, *Alertas de stock* con los mismos dos productos y *Ver lo que falta →*. Para Silvia es
casi todo su panel. A 1280, el operador ve el casillero a media pantalla y el tercio derecho vacío;
en una empresa nueva, *Movimientos recientes* es un bloque alto vacío. A 375, los dos botones de la
franja de Silvia tienen distinta altura (*Registrar una compra* parte en dos renglones).
**Propuesta**: dejar uno solo (el bloque con la lista, con el número en el título: *"Para reponer
(2)"*). **Cuesta**: chico (`dashboard`).

**H3-16 · En Excel, la descripción se ve cortada.** El CSV se abre bien (números como números,
fechas como fechas, acentos bien), pero todas las columnas quedan en el ancho de fábrica (≈ 10
caracteres). *"Compra: 20 kg de Queso cremoso · Compra semanal"* está en la B y la C tiene la
categoría, así que se ve *"Compra: 20"*. Lo mismo el *Detalle* de *Por producto* y de *Lo que se
perdió*. **Propuesta**: llevar las columnas de texto largo (*Descripción*, *Detalle*) al final: Excel
deja que un texto se vea entero si la celda de al lado está vacía. **A validar con el contador.**
**Cuesta**: chico (servidor).

**H3-17 · Tablet (800 px): los filtros no se pliegan y la franja de Stock ocupa 184 px.** Entre 768 y
1023 las tablas ya son tarjetas y el menú es el del celular, pero la caja de filtros va abierta (en
*Entradas y salidas* el primer dato aparece en el píxel 603). La franja de Stock va en dos renglones
de botones (184 px). Las tarjetas de a dos se leen bien. **Propuesta**: plegar los filtros hasta
1023, como el resto del patrón. **Cuesta**: chico (CSS de `filtros-plegables`).

**H3-18 · El botón "Otra" de cada producto no dice para qué es (G-15 a medias).** Ya tiene texto, pero
*Otra* al lado de *Vender* y *Comprar* se lee como *"otra venta"*. Lo que se carga ahí casi siempre es
una rotura. **Propuesta**: *"Rotura u otra"* (ver vocabulario). **Cuesta**: chico.

**H3-19 · La comparación del panel da dos números y no dice si es mejor o peor (tarea 45).** *"Del 1 al
15 de octubre"* contra *"noviembre (hasta hoy)"* **se entiende** (G-07 alcanzó). Pero *Salió $ 951.900
· Del 1 al 15 de octubre: $ 12.000* deja la comparación para la persona, y el casillero *Resultado*
no tiene la línea *Octubre entero* que sí tienen los otros dos. **Propuesta** (**a validar con
usuarios**): una palabra al final, *"más que en los mismos días de octubre"* / *"menos que…"*.
**Cuesta**: chico.

**H3-20 · Detalles de texto y de forma.**
- *Registrar una compra / venta*: debajo del precio se repite lo escrito (*"= $ 8.200,00 por kg"*).
- *Completar la plata*: el campo del precio no tiene el *$* de adelante que tienen la venta y la
  compra; el desplegable usa *"Insumos › Compra de mercadería"* y el alta de Movimientos, grupos.
- *Otra entrada o salida*: el ejemplo del *Detalle* es *"remito, cliente, quién lo retiró…"* también
  para una pérdida.
- *Stock mínimo* no dice la unidad (*"Cantidad (en cajas)"* sí la dice).
- *Primeros pasos* tiene un hueco blanco abajo; el buscador del panel a 375 corta su ejemplo
  (*"papel, fletes, te"*).
- Motivos de stock usa ⇄ en la franja, el mismo ícono de *Otra entrada o salida* (G-15 lo cambió en
  Stock).
- **Cuesta**: chico.

### Lo que está bien resuelto (para no romperlo)

- **Lo corregido en la segunda vuelta que alcanzó**, verificado con la tarea que lo reportaba:
  - **G-01** (tarea 25): en *Lo que se perdió* ya no hay nota arriba; manda el recuadro azul.
  - **G-04 y G-05** (tarea 43): *"¿Qué querés hacer con la salida de 3 cajas…?"*, **Corregir** en verde
    con *"Si cancelás, no pasa nada"*, el formulario lleno, y *"Salida corregida: la de antes quedó
    anulada. De Bolsa de pan hay ahora 5 bolsas"*. La de antes queda en el historial tachada.
  - **G-03**: corrigiendo una compra, *"Es lo que pagaste en la compra de antes (el costo del producto
    es $ 8.200)"*; en una venta con otro precio, *"El precio del producto es $ 12.500; acá va lo que
    cobraste"*.
  - **G-07** (tarea 45): *"Del 1 al 15 de octubre"* en negrita y *"Octubre entero"* chico debajo.
  - **G-08** (tarea 37): al tesorero, **Entendido, se lo pido** como botón principal y *"la venta queda
    como no cobrada"*.
  - **G-09** (tarea 34): *"Avisale por fuera del sistema (elena@huertanorte.com.ar o al 11 4451-9022)"*.
  - **G-10** (tarea 46): *Se olvidó la contraseña* → *"Avisale a Jorge Maidana que entre con su DNI
    (28678901)"* → *"Listo: la contraseña volvió a ser el DNI…"*.
  - **G-11**: *Salió plata* del panel abre Movimientos en *Este mes* y los casilleros coinciden con el
    panel.
  - **G-12** (tarea 47): *"Lo que pagaste por bolsa · Se multiplica por 10 bolsas · Total: $ 15.000"* y
    *"Listo: la plata quedó anotada en Movimientos"*. Ninguna cuenta de cabeza.
  - **G-13** (tarea 3): *"En total: entraron 40 kg · salieron 14,5 kg. Hoy hay 25,5 kg."*
  - **G-14** (tarea 39): la pista en verde con **Sí, fue ese**, y el servicio queda guardado.
  - **G-16, G-17, G-18, G-19, G-21**: ícono arriba de la palabra en el celular, botones del panel con
    borde, *No mostrar más*, el cartel de apagar Productos (*"Vos también dejás de ver Stock…"*),
    Productos en orden alfabético.
- **La venta y la compra en un paso** siguen siendo lo mejor de la app: *"Hay 5,5 kg · después de la
  compra va a haber 25,5 kg"* y *"La plata ya quedó anotada: no hace falta cargarla en otro lado"*.
- **Los avisos de los archivos**: el PDF de *Lo que se perdió* abre con el recuadro, *No se sabe* en
  gris, pie con empresa, período, fecha y hoja. El CSV en Excel: números como números, fechas como
  fechas, la nota de cada vista adentro.
- **Primeros pasos y los vacíos** de una empresa recién aprobada (*"Todavía no cargaste ningún
  movimiento… Registrar el primero"*).
- **El buscador y la ficha**: *"a unos 2 km"*, *"CooperApp no manda mensajes"*, *Escribir un email* /
  *Llamar*, *"La zona es aproximada"*.
- **Dar de baja un servicio** (tarea 19): *"Los movimientos que ya cargaste siguen mostrando este
  servicio y siguen contando en los reportes."*
- **Ninguna pantalla con scroll de costado** a 375, 800 ni 1280, con ningún rol, y ninguna tabla más
  ancha que su caja.

---

## 4. Plan sugerido

1. **H3-01** (*Por servicio* sin los casilleros del período): copiar lo que ya se hizo en *Por
   producto*. Es la vista donde Daniel decide qué servicio sostener.
2. **H3-03 y H3-04** (caminos que se cortan): un texto en el login y un botón *Corregir en Stock*.
   Son los dos lugares donde la persona sabe qué quiere y la pantalla no la lleva.
3. **H3-08** (*Agregala acá* pierde lo escrito): un atributo en un link, en dos formularios.
4. **H3-07** (la rotura con el sistema en cero): primero el texto; el botón de *ajuste primero*
   después, con usuarios.
5. **H3-10, H3-13, H3-14, H3-18** y la tabla de vocabulario: una pasada de textos y colores para que
   la misma acción se vea igual en todos lados.
6. **H3-11 y H3-16** (los archivos): el tipo cuando no hay descripción y las columnas largas al final.
7. **H3-12, H3-15, H3-17, H3-20**: pulido.
8. **Para la prueba con una persona real** (el guion del prompt): H3-02 (*¿qué lee en Vendido /
   Comprado?*), H3-05 (*¿el arroz del comedor "se perdió"?*), H3-06 (*¿tiene email el del depósito?*),
   H3-09 (*¿encuentra la descarga en el teléfono?*), H3-19, y el renombre de *Ajuste positivo* que
   sigue abierto.

---

## Bugs encontrados (no son de UX: van al chat de desarrollo)

Ninguno. Todo lo que se cargó guardó lo que tenía que guardar (verificado en la tabla: la compra, la
rotura y su ajuste, la corrección de la pérdida, la luz corregida, el servicio de la soldadura, la
plata de la compra de pan), y los números de la pantalla, el CSV y el PDF coinciden entre sí en las
cuatro vistas descargadas.

---

## Notas para la próxima corrida

- **Las tareas, una por una** (toques contados desde el panel; la ventana cuenta como pantalla):

| # | Rol | ¿Sola? | Toques / pantallas | Dónde se frenó |
|---|---|---|---|---|
| 1 | operador | sí | 4 / 1 + ventana | — |
| 2 | operador | sí | 1 (*Ver lo que falta*) | — |
| 3 | operador | sí | 2 / 1 | — (G-13 alcanzó) |
| 4 | operador | con duda | 9 / 1 + 2 ventanas | sistema en 0: dos viajes (H3-07); *Otra* (H3-18) |
| 5 | operador | sí | 4 / 1 + 2 ventanas | — |
| 6 | operador | sí | 6 / 1 + ventana | — |
| 7 | tesorero | sí | 4 / 1 + ventana | — |
| 8 | tesorero | sí | 0 | H3-19 (menor) |
| 9 | tesorero | sí | 4 / 1 + 2 ventanas | — |
| 10 | admin | sí | — | evaluada con Huerta Norte (29) |
| 11 | admin | sí, con duda | 7 / 1 + ventana | el email (H3-06) |
| 12 | admin | sí | 4 | — |
| 13 | admin | sí | 1 desde el panel | — |
| 14 | admin | sí | 3 / 1 + ventana | — |
| 15 | admin | sí | 5 / 1 + ventana | *Agregala acá* si falta la categoría (H3-08) |
| 16 | tesorero | sí | 6 | — (*Sí, fue ese*) |
| 17 | tesorero | con duda | 1 desde Servicios | los casilleros (H3-01) |
| 18 | tesorero | sí | 3 | — |
| 19 | admin | sí | 2 | — |
| 20 | — | se distinguen | — | texto de Productos en Servicios (H3-12) |
| 21 | admin | sí el movimiento; **con duda** la venta | 3 / 6 | H3-04 |
| 22 | admin | sí | 1 (*Ver reportes*) | — |
| 23 | admin | sí | — | H3-01 en *Por servicio* |
| 24 | admin | sí en compu; lento en el teléfono | 1 por archivo | H3-09, H3-16 |
| 25 | admin | sí | 2 | el nombre de la vista (H3-05) |
| 26 | admin | sí | — | *valorizar* (vocabulario) |
| 27 | admin | sí | — | — |
| 28 | operador | sí | — | — |
| 29 | admin nueva | sí | — | — |
| 30 | admin nueva | sí | — | — |
| 31 | operador | sí | 3 desde el panel | — |
| 32 | admin | sí | 4 | — |
| 33 | — | sí en la ficha | — | — |
| 34 | superadmin | sí | 2 | — |
| 35 | superadmin | sí | 3 | el nombre del botón (H3-13) |
| 36 | tablet | sí | — | filtros abiertos (H3-17); tarjetas de a dos, bien |
| 37 | tesorero | sí | 2 | — |
| 38 | admin | a medias | 2 | H3-02 |
| 39 | tesorero | sí | 6 | — |
| 40 | admin | sí | 0 | — |
| 41 | admin | sí | 3 | — |
| 42 | — | sí en el PDF | — | — |
| 43 | operador | sí | 4 / 1 + 2 ventanas | sólo si la cuenta no da (H3-07) |
| 44 | admin | **a medias** | 2 | H3-02 |
| 45 | admin | sí | 0 | H3-19 (menor) |
| 46 | admin | sí | 2 / 1 + ventana | el otro lado: el login (H3-03) |
| 47 | admin | sí | 3 / 1 + ventana | — |

- **Alto de la franja de título a 375 px**: Stock 246, Servicios 258, Productos 210, Movimientos 184;
  el resto entre 106 y 160. Con los filtros plegados, el primer producto de Stock aparece en el píxel
  438 y el primer movimiento en 599-649: se puede vivir. En Reportes, el primer renglón está entre el
  978 y el 1.156 (período, vistas y casilleros antes).
- **Texto de menos de 13 px**: entre 11 y 16 elementos por vista de Reportes (rótulos de casilleros,
  notas, detalles). Va con la regla de 14 px del backlog: no se cuenta como hallazgo.
- **El *Monto* del CSV de movimientos sigue siempre positivo**, con el signo en *Entró / Salió*
  (anotado *a validar con el contador* desde la primera pasada).
- **El entorno anduvo sin choques**: base `cooperApp_ux`, app en 3002 por `127.0.0.1`, Edge sin ventana
  en el 9377. En Git Bash, los argumentos que empiezan con `/pages/…` se convierten en rutas de
  Windows: usar `MSYS_NO_PATHCONV=1`.
- **Lo que se cargó en la copia para recorrer** (y se borró con ella): una compra de 20 kg de queso,
  un ajuste positivo y una rotura de 3 cajas de Milanesas, la pérdida de pan corregida de 4 a 5, la
  luz (y su corrección a $ 33.000), una venta de 2 kg de queso a $ 11.000, *Dulce de leche*, el
  usuario Ramiro Paz, el pago de la compra de pan, la contraseña de Jorge, una soldadura de $ 85.000
  y Huerta Norte aprobada.


---

## Resultado de las correcciones (15/11/2026)

Se hicieron **los 20 y la tabla de vocabulario**, en el chat de desarrollo (pedido del usuario:
*"corregí todo"*). Lo marcado *a validar* se hizo con la propuesta del informe.

| Hallazgo | Qué se hizo |
|---|---|
| **H3-01** | *Por servicio*, igual que *Por producto*: sin casilleros del período, y un recuadro con lo que dejaron los que se ofrecen y se llevaron los que se contratan, más la nota. En el CSV y el PDF, esos mismos totales. |
| **H3-02** | *Por producto* se titula *"Lo que vendiste y compraste de cada producto"* y suma la columna **"Te dejó (aprox.)"**: lo cobrado menos lo que costó lo vendido, con el costo de referencia; *"No se sabe"* sin costo, *"—"* sin ventas cobradas. También en el CSV y el PDF. |
| **H3-03** | Debajo de *Ingresar*: *"¿Te olvidaste la contraseña? Pedile al administrador de tu empresa que te la vuelva a la inicial: tu DNI."* |
| **H3-04** | A la admin, en la plata de una venta: **Corregir en Stock**, que abre el historial de ese producto con el cartel de esa venta. |
| **H3-05** | *Lo que se perdió* dice debajo *"Roturas, robos, vencimientos, consumo propio y ajustes: todo lo que salió sin venderse"*, también en los archivos. El nombre se quedó (a validar). |
| **H3-06** | El email del alta: *"Es con lo que va a entrar al sistema. Puede ser cualquiera que la persona recuerde: no le llegan correos."* |
| **H3-07** | *No alcanza* en dos renglones, y el botón **"Cargar primero el ajuste de N"**, que lo registra y deja la rotura lista. |
| **H3-08** | *Agregala acá* se abre en otra pestaña, y *actualizá la lista* trae las categorías nuevas sin cerrar el formulario. |
| **H3-09** | En el celular, *Descargar ↓* al lado del período baja a las descargas. |
| **H3-10** | *Anular o corregir* verde con el lápiz en las dos pantallas; al tesorero, el cartel se titula *"Anular la plata de una venta"*. |
| **H3-11** | Sin descripción, el tipo, también en el CSV y el PDF. |
| **H3-12** | En Servicios: *"Nunca se muestra cuánto cobrás."* |
| **H3-13** | El superadmin: *Se olvidó la contraseña* y *"Avisale a … que entre con su DNI (…)"*. |
| **H3-14** | *Se olvidó la contraseña* no aparece en alguien de baja ni en quien todavía tiene la inicial; los botones en un renglón en la computadora. |
| **H3-15** | El panel ya no repite lo que falta: queda el bloque *"Para reponer (N)"*. A 375 los botones de la franja tienen la misma altura. |
| **H3-16** | En los CSV el texto largo va al final (*Descripción*, *Detalle*), así Excel lo deja ver entero. |
| **H3-17** | Los filtros se pliegan hasta 1023 px. |
| **H3-18** | **"Rotura u otra"**. |
| **H3-19** | La comparación dice *"(ahora, más que esos días)"* o *"menos"*; el resultado suma *"Octubre entero"*. |
| **H3-20** | El precio *"como se lee"* sólo de mil para arriba; *Completar la plata* con el *$* y el desplegable agrupado; el ejemplo del detalle según lo que se carga; el stock mínimo dice la unidad; sin el hueco de *Primeros pasos*; el ejemplo del buscador más corto. |

**Vocabulario**: *"Lo que cobraste por unidad"* en la venta; *"Igual tenés que decir arriba de qué fue la
plata"*; sin *valorizar* (*"A 1 salida (Bolsa de pan) no le pudimos poner precio"*); *"…vuelven a
contarse en lo que hay"*; *Cancelar* en vez de *Ahora no*; *"Listo: quedó anotado."*; los errores del
servidor dicen *"No se pudo guardar. Probá de nuevo en un rato."*

**Probado**: 16 casos nuevos por API más las siete baterías anteriores, las 92 pantallas en tres
anchos, y capturas mirando *Por producto*, *Por servicio* y el panel.
