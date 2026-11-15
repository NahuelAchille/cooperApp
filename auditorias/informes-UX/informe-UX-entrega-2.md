# Auditoría de experiencia de usuario · CooperApp · entrega, segunda pasada

**Fecha**: 15/11/2026 · **Sobre**: `master` en `56e4bc6` (las correcciones de las auditorías de QA y
UX de la entrega).
**Foco**: de punta a punta otra vez. Las 42 tareas del prompt con cada rol, con atención a las
nuevas 37 a 42, que miran si lo corregido el 15/11 siguiendo `informe-UX-entrega.md` **resolvió**
lo reportado (sobre todo lo marcado *a validar*). Más todo "Qué mirar", las tres medidas (375, 800
y 1280 px) en cada pantalla y los archivos que salen (CSV abierto en Excel de verdad y el PDF).

**Método**:
- Las tareas, en el navegador, como cada persona: Silvia (operadora), Roberto (tesorero) y Marta
  (admin) de La Esperanza; Osvaldo (admin) y Daniel (tesorero) de Metalúrgica; el superadmin; y
  Elena, admin de Huerta Norte recién aprobada. Edge sin ventana manejado por un script propio
  (puerto de depuración 9377), con capturas de cada paso.
- Las medidas: 31 pantallas × 3 anchos con cinco usuarios (93 mediciones): ancho de la página y de
  cada tabla contra su contenedor, elementos que se pasan del borde, alto de la franja de título,
  píxel de la primera fila, texto de menos de 13 px. Más capturas a 800 y 375 px de cada una, y el
  ancho de los botones contra su texto donde la captura lo hizo sospechar.
- Los CSV, abiertos con **Excel 16 por COM** (separador `;`, decimal `,`), leyendo celda por celda
  el texto que muestra Excel y si lo tomó como número o como texto. Los PDF, abiertos en el visor
  de Edge y mirados como imagen.
- Los mensajes del servidor: el toast de cada acción y una búsqueda de las palabras viejas en los
  textos que devuelve la API.

**Entorno**: copia aparte, base `cooperApp_ux` (creada desde copias de los dos `.sql` con el `USE`
cambiado) y la app en el puerto 3002, siempre por `127.0.0.1`. La base `cooperApp`, el puerto 3000
y el puerto de depuración 9341 de QA no se tocaron. Al terminar se borró `cooperApp_ux` y se cerró
ese proceso (por PID). No se tocó código ni se commiteó nada.

> Busca lo que **funciona pero confunde**. Los bugs van en una línea al final.
> Lo ya decidido no se vuelve a reportar; donde la solución **no alcanzó**, se dice.
> Los hallazgos van numerados **G-01 a G-22**, para no confundirlos con los E-xx del informe
> anterior, los F-xx del final ni los H-xx de los primeros.

---

## 1. Resumen ejecutivo

**Las correcciones del 15/11 se notan y casi todas alcanzaron.** El tesorero ya no queda trabado
con la plata de una venta (el cartel le dice a quién pedírsela, con nombre), la venta avisa que *"la
plata ya quedó anotada en Movimientos"*, el rol dice qué hace, Stock tiene *Anular o corregir* e
*Historial* con texto, el menú marca dónde está uno, los archivos dicen las fechas y cuándo se
generaron, el PDF de pérdidas tiene el aviso en un recuadro, y la tablet ya no corta ninguna tabla.
**Ninguna de las 93 mediciones tiene scroll de costado.** Lo que queda tiene tres caras:

**1. En "Lo que se perdió", la pantalla dice lo contrario del aviso, dos renglones más arriba.**
Abajo de *¿Cómo querés verlo?* hay una nota que cambia con la vista. Al pasar a *Lo que se perdió*
la nota **no se actualiza**: queda la de la vista anterior. Lo más común es entrar desde *Uno por
uno* o desde el botón de Servicios, y entonces la pantalla dice **"Son la misma plata del período,
ordenada de distinta manera"**, y abajo, en el recuadro azul, **"Esta plata NO está en lo que salió
del balance"**. Es exactamente la confusión que la vista entera fue armada para evitar (tareas 25 y
42). En el PDF no pasa: el archivo está bien.

**2. "Por producto" sigue contestando otra pregunta (E-02 no alcanzó).** La nota que se agregó es
correcta, pero va en letra de 12 px, arriba de todo, y entre ella y la tabla quedan los tres
casilleros del período (*Entró $ 1.033.850*), que la tabla no suma. Y la tabla, ordenada por
*Resultado*, pone **al producto que más se vende —el queso, $ 178.250 cobrados— último y en rojo
(−$ 149.750)**. Además, en el mismo renglón conviven *"Entró $ 178.250"* (plata de ventas: salió
queso) y *"entraron 40 kg"* (queso comprado): el mismo verbo para dos cosas opuestas. A la pregunta
de la tarea 38, *"¿qué producto me conviene?"*, la pantalla sigue contestando *"el queso no"*. La
respuesta a la duda que dejó marcada el informe anterior es: **sí, *Vendido / Comprado* contestaría
mejor que *Resultado*.**

**3. Corregir sigue siendo distinto según qué y dónde.** En Stock, *Anular o corregir* abre un cartel
que pregunta *"¿Anular la compra…?"* con **dos botones rojos**, y recién la pantalla siguiente
explica que no se anula nada hasta guardar (en Movimientos, el mismo cartel ya lo explica). Una
**pérdida, un consumo o un ajuste mal cargados no se pueden corregir**: sólo *Anular*, y volver a
cargar a mano. Y al corregir una venta, el precio que aparece es el cobrado, pero la ayuda dice
**"Es el precio cargado en el producto"** (en el ejemplo, $ 11.000 cuando el producto vale
$ 12.500): Marta no sabe si está mirando lo que cobró o lo que cobra.

---

## 2. Propuesta de vocabulario

Ordenada por cuánto confunde hoy. *Ajuste positivo / negativo* sigue abierto a propósito (ver la
nota al final de la tabla).

| Término actual | Dónde aparece | Problema | Propuesto | Qué hay que tocar |
|---|---|---|---|---|
| **"Son la misma plata del período, ordenada de distinta manera"** | Reportes → *Lo que se perdió* (nota que quedó de la vista anterior) | Contradice el aviso de la misma pantalla | En esta vista, ninguna nota arriba (el recuadro ya explica) o *"Esto no es plata: es mercadería que se fue."* | Sólo pantalla (`reportes.html`) |
| **"Entró / Salió"** (columnas) junto a **"entraron 40 kg · salieron 16,5 kg"** | Reportes → *Por producto*, pantalla, CSV y PDF | El mismo verbo para la plata de una venta (sale mercadería) y para mercadería comprada (sale plata) | Columnas **"Vendido"** y **"Comprado"**; detalle *"compraste 40 kg · vendiste 14,5 kg · se perdieron 2 kg"* | Pantalla y servidor (el detalle y los archivos los arma el servidor). Sin cambio de base |
| **"Es el precio cargado en el producto"** | Stock → corregir una venta o una compra; también en el alta después de cambiar el precio | El número ya no es el del producto | Al corregir: *"Es lo que cobraste en la venta de antes (el precio del producto es $ 12.500)."* Si se cambió en el alta: *"El precio del producto es $ 12.500; acá va lo que cobraste."* | Sólo pantalla (`stock.html`) |
| **"Movimiento de dinero registrado y vinculado al movimiento de stock"** | Toast de *Completar la plata* (ventas y compras viejas) | *dinero*, *movimiento de stock*, *vinculado*: tres palabras que se sacaron de la vista | *"Listo: la plata de esta compra quedó anotada en Movimientos."* | Servidor (`stock.controller.js`) |
| **"Categoría y tipo \*"** | Ventana *Completar la plata* | Las demás pantallas preguntan *"¿En qué se fue la plata?" / "¿De qué fue la plata que entró?"* | Las mismas preguntas | Sólo pantalla |
| **"Contraseña inicial"** (botón) | Usuarios, admin | Es un sustantivo: no dice qué hace al tocarlo. El superadmin dice *"Volver a la contraseña inicial"* | **"Se olvidó la contraseña"** (o *"Volver a la inicial"*, como el botón del cartel) | Sólo pantalla |
| **"Sólo anular"** cuando no hay otra opción | Movimientos → plata de una venta, tesorero | *Sólo* tiene sentido al lado de *Anular y corregir*, que el tesorero no tiene | **"Anular igual"** | Sólo pantalla |
| **"Tu empresa está pendiente de aprobación"** | Login de una empresa recién registrada | No dice qué hacer ni cómo se va a enterar | *"Tu empresa todavía no fue aprobada. Cuando la aprueben vas a poder entrar con este mismo email y contraseña."* | Servidor |
| **"La existencia no puede ser negativa…"** | Stock, globito del estado *Revisar* | *existencia* salió de la vista (columna **Hay**) | *"Lo que hay no puede ser menos de cero: revisá las entradas y salidas."* | Sólo pantalla |
| **"Sin subcategoría"** (opción) | Nuevo producto → Subcategoría | La ayuda de abajo dice *"dejala en blanco"*, y no hay blanco: hay una opción con nombre | Ayuda: *"Es opcional: si no subdividís esta categoría, dejá «Sin subcategoría»."* | Sólo pantalla |
| **"El rol seleccionado no es válido"** | Servidor, alta y edición de usuarios | *Seleccionado*; el resto dice *Elegí* | *"Elegí un rol de la lista."* | Servidor |

**Sobre *Ajuste positivo / negativo*** (abierto a propósito): se suma una observación nueva, ver
G-06. Desde que el aviso de *No alcanza* quedó unificado, *Ajuste positivo* es la única salida cuando
el sistema dice que hay menos de lo que hay en el depósito, y **ningún texto la nombra**.

---

## 3. Hallazgos, ordenados por severidad

### BLOQUEA

Ninguno. Todas las tareas se terminan sin ayuda (la tabla de tareas está al final).

### GENERA DUDA

**G-01 · "Lo que se perdió" dice "Son la misma plata del período" arriba del aviso que dice que
NO lo es.**
- **Dónde**: Reportes → *Lo que se perdió*, admin y tesorero, cualquier ancho. También entrando
  directo por `reportes.html?vista=perdidas`.
- **Qué pasa**: la nota de abajo de *¿Cómo querés verlo?* no cambia al entrar a esta vista: queda la
  de la vista anterior. Probado: desde *Uno por uno* o entrando directo dice *"Son la misma plata del
  período, ordenada de distinta manera"*; desde *Por categoría*, *"…suma lo mismo que los totales del
  período"*; desde *Por producto*, el párrafo de productos, que termina *"Lo que se perdió de verdad
  está en «Lo que se perdió»"* (estando ahí).
- **Por qué confunde a este usuario**: la vista existe para que nadie reste esta plata del balance,
  y el texto que se lee primero, arriba, dice que es *la misma plata del período*. Marta no tiene cómo
  saber cuál de los dos textos manda. Es la pregunta clave de la tarea 25.
- **Propuesta**: en *Lo que se perdió*, sin nota debajo de las vistas (el recuadro azul ya lo explica)
  o con una propia: *"Esto no es plata del período: es mercadería que se fue."*
- **Cuesta**: chico. (También va como bug al final: la nota queda vieja.)

**G-02 · "Por producto": la nota no alcanzó; el más vendido sale último y en rojo (E-02).**
- **Dónde**: Reportes → *Por producto*, pantalla, CSV y PDF. Admin y tesorero. Tarea 38.
- **Qué pasa**:
  - La nota (*"Acá sólo está la plata de lo que vendiste y compraste… no es plata perdida"*) es
    correcta, pero va en 12,5 px gris arriba de todo, y entre ella y la tabla están los casilleros
    del período (*Entró $ 1.033.850 · Salió $ 935.900*) y el aviso de anulados. La tabla suma
    $ 435.850 y $ 586.900.
  - Orden por *Resultado*: arriba *Milanesas* (+$ 92.000), abajo *Queso cremoso* **−$ 149.750 en
    rojo**, que es el que más se vendió ($ 178.250).
  - En el mismo renglón: *"Entró $ 178.250"* (plata de las ventas) y *"entraron 40 kg"* (queso
    comprado).
  - *"Fideos: salieron 33 paquetes — Entró $ 42.000"*: los 33 incluyen 3 rotos. Quien divide para
    saber el precio llega a $ 1.272 en vez de $ 1.400.
- **Por qué confunde a este usuario**: Marta entra con *"¿qué me conviene?"*, ve el rojo al lado de su
  mejor producto y saca la conclusión equivocada antes de leer la nota. En el PDF la nota queda justo
  encima, en recuadro, y se lee mejor; en pantalla, no.
- **Propuesta** (responde la duda *a validar* del informe anterior):
  - Columnas **Vendido** y **Comprado**, sin restar, ordenadas por *Vendido*. Si se deja
    *Resultado*, en gris y no en rojo.
  - En esta vista, esconder los casilleros del período (como en *Lo que se perdió*) o reemplazarlos
    por los totales de la tabla: *"Vendido $ 435.850 · Comprado $ 586.900"*.
  - La nota en un recuadro arriba de la tabla, como en el PDF.
  - Detalle: *"compraste 40 kg · vendiste 14,5 kg · se perdieron 2 kg"*.
- **Cuesta**: medio (pantalla y la parte del servidor que arma el detalle y los archivos). Sin cambio
  de base.

**G-03 · Al corregir una venta, la ayuda dice que el precio es el del producto, y no lo es.**
- **Dónde**: Stock → *Anular o corregir* → *Anular y corregir* sobre una venta o una compra. Y en el
  alta, después de cambiar el precio.
- **Qué pasa**: se vendieron 2 kg de queso a $ 11.000 (el producto dice $ 12.500). Al corregirla, el
  campo trae **$ 11.000** —bien, es lo cobrado— y abajo dice *"Es el precio cargado en el producto. Si
  cobraste otro… cambialo"*. En el alta pasa lo mismo apenas se toca el número.
- **Por qué confunde a este usuario**: vino a corregir *un precio mal*. Si el texto le dice que $ 11.000
  es el precio del producto, puede creer que el producto quedó cambiado, o ir a Productos a
  "arreglarlo".
- **Propuesta**: ver la tabla de vocabulario; el texto según de dónde salió el número.
- **Cuesta**: chico (`stock.html`).

**G-04 · En Stock, el cartel de corregir pregunta "¿Anular…?" con dos botones rojos.**
- **Dónde**: Stock → *Entradas y salidas* → *Anular o corregir* (ventas y compras). Operador y admin.
  Tareas 5 y 21.
- **Qué pasa**: título *"Anular o corregir la compra"*; pregunta *"¿Anular la compra de 20 kg de Queso
  cremoso?"*; aviso *"También se anula su pago de $ 164.000"*; botones **Anular y corregir** y **Sólo
  anular**, los dos en rojo lleno. Que no se anula nada hasta guardar se dice recién en la ventana
  siguiente. En Movimientos el cartel se titula distinto (*"Anular movimiento"*) y sí lo explica antes
  (*"el de antes se anula recién cuando guardás la corrección"*).
- **Por qué confunde a este usuario**: Silvia viene a *arreglar*. Lo primero que ve es la pregunta de
  anular y el aviso de que se va la plata, y los dos botones tienen el color de lo que no tiene vuelta.
  Es la misma acción con dos carteles distintos según la pantalla.
- **Propuesta**: pregunta *"¿Qué querés hacer con la compra de 20 kg de Queso cremoso del 15/11?"*;
  **Corregir** en verde con la aclaración *"No se anula nada hasta que guardes la corrección"*; **Anular**
  en rojo, con el aviso de la plata. Mismo cartel en Movimientos.
- **Cuesta**: chico.

**G-05 · Una pérdida, un consumo o un ajuste mal cargados no se pueden corregir.**
- **Dónde**: Stock → *Entradas y salidas*, operador y admin. Tarea 5 hecha después de la 4.
- **Qué pasa**: las ventas y compras tienen *Anular o corregir*; todo lo de *Otra entrada o salida*
  tiene sólo **Anular**, y el cartel (*"Anular la salida"*) no menciona cómo volver a cargarla. En
  Movimientos, en cambio, **toda** fila que se puede tocar dice *Anular o corregir*.
- **Por qué confunde a este usuario**: si lo que cargó mal fue la rotura de recién (3 en vez de 4), no
  hay botón que diga corregir: tiene que adivinar que es anular y volver a empezar por *Otra entrada o
  salida*, y acordarse de qué había cargado.
- **Propuesta**: *Anular o corregir* también acá, con el formulario de *Otra entrada o salida* lleno con
  lo de antes, igual que la venta. Si no se hace, al menos el cartel: *"Si te equivocaste, anulala y
  cargala de nuevo desde Otra entrada o salida."*
- **Cuesta**: medio (el cartel solo, chico).

**G-06 · "No alcanza" ya no dice qué hacer cuando el sistema tiene menos de lo que hay.**
- **Dónde**: Stock → *Otra entrada o salida* y *Registrar una venta*, operador. Tarea 4 (*"se rompieron
  3 cajas"*; las Milanesas figuran con 0).
- **Qué pasa**: el aviso unificado en E-14 dice *"Hay 0 cajas y estás sacando 3. No alcanza. Si en el
  depósito hay más, primero cargá lo que entró (Registrar una compra, u Otra entrada o salida)"*, y el
  botón se apaga. Pero las cajas no *entraron*: estaban, y se rompieron. Lo que hay que hacer es
  corregir la cuenta con un **Ajuste positivo**, que el texto viejo del servidor nombraba y el nuevo no.
  Y estando ya en *Otra entrada o salida*, el consejo la manda… a *Otra entrada o salida*.
- **Por qué confunde a este usuario**: Silvia tiene las cajas rotas en la mano; el sistema le dice que
  no hay y le propone registrar una compra que no existió. O la inventa, o deja la rotura sin cargar.
- **Propuesta**: *"Hay 0 cajas y estás sacando 3. No alcanza. Si en el depósito hay más de lo que dice
  el sistema, primero corregí la cuenta: elegí «Ajuste positivo» con lo que falta, y después cargá la
  rotura."* (Si *Ajuste positivo* se renombra, el texto va con el nombre nuevo.)
- **Cuesta**: chico.

**G-07 · "Octubre entero" es honesto, pero deja la cuenta para la persona (tarea 40).**
- **Dónde**: Panel, admin y tesorero.
- **Qué pasa**: *"Entró en noviembre (hasta hoy) $ 1.033.850 · Octubre entero: $ 275.000"*. El texto ya
  no engaña (E-09 se aplicó), pero a mitad de mes la persona tiene que hacer sola la cuenta de si
  *viene bien*. Dos detalles más: el casillero del resultado dice *"Quedó a favor · Octubre: −$ 38.000"*
  (Metalúrgica): *a favor* habla de noviembre y el negativo de octubre, en la misma línea. Y a una
  empresa aprobada hoy le muestra *"Octubre entero: $ 0,00"* en los tres casilleros, como si en octubre
  no hubiera vendido nada.
- **Por qué confunde a este usuario**: la pregunta de la tarea 8 es *"¿cómo venimos?"*. El número del
  mes pasado entero no la contesta antes del día 25.
- **Propuesta** (**a validar con usuarios**, que es lo que el informe anterior dejó abierto):
  - Comparar contra los mismos días: *"Del 1 al 15 de octubre: $ 120.000"*, con *"Octubre entero:
    $ 275.000"* debajo, más chico.
  - El resultado en dos renglones: *"Quedó a favor"* y *"En octubre: −$ 38.000 (en contra)"*.
  - Sin la línea de octubre para una empresa que no existía en octubre.
- **Cuesta**: medio (cambia la cuenta del panel).

**G-08 · El cartel del tesorero ya dice a quién pedir; el único botón de color es el que no conviene
(tarea 37).**
- **Dónde**: Movimientos → *Anular* en la plata de una venta, tesorero.
- **Qué pasa**: el cartel es claro: *"Esta plata es de una venta de Stock, y se corrige desde ahí…
  Pedíselo a quien la cargó (Silvia Ferreyra) o al administrador."* E-01 quedó resuelto. Pero la
  pregunta de arriba sigue siendo *"¿Confirmás anular…?"*, el único botón con color es **Sólo anular**
  en rojo, y lo que pasa si la anula se dice con palabras de una pantalla que Roberto no ve (*"en Stock
  queda sin registrar el cobro"*).
- **Por qué confunde a este usuario**: Roberto entiende que tiene que pedírselo a Silvia, pero la
  pantalla le ofrece una sola acción, y es la que la deja peor.
- **Propuesta**: botón principal **"Entendido, se lo pido"** (cierra), y **"Anular igual"** como
  secundario. El aviso: *"Si la anulás acá, la venta queda como no cobrada y alguien la tiene que volver
  a cobrar desde Stock."*
- **Cuesta**: chico.

**G-09 · Nadie le avisa a la empresa que fue aprobada.**
- **Dónde**: registro, login y panel del superadmin. Tareas 29 y 34.
- **Qué pasa**: al registrarse dice *"Registro enviado. Tu empresa está pendiente de aprobación"*; al
  querer entrar antes, *"Tu empresa está pendiente de aprobación"*. Al aprobar, el superadmin ve *"Elena
  Maldonado ya puede entrar con su email y su contraseña"*, pero no se le pide que le avise (al resetear
  una contraseña, sí: *"Avisale por fuera del sistema"*). El sistema no manda correos.
- **Por qué confunde a este usuario**: Elena se registró y no sabe si mañana ya puede entrar, o en una
  semana, o si tiene que llamar a alguien. Va a probar todos los días, o ninguno.
- **Propuesta**: en el toast del superadmin, *"Avisale a Elena por fuera del sistema (su email:
  elena@…, teléfono de la empresa: …)"*. En el registro y el login, el texto de la tabla de vocabulario.
- **Cuesta**: chico.

**G-10 · "Contraseña inicial" no dice que es para cuando alguien se la olvidó.**
- **Dónde**: Usuarios, admin (y por contraste, el superadmin). Tarea 35 desde el lado del admin.
- **Qué pasa**: el botón de cada usuario dice **Contraseña inicial**. El cartel se titula *"Volver a la
  contraseña inicial"* y explica bien qué pasa, pero no dice que hay que avisarle a la persona (el del
  superadmin sí: *"Avisale por fuera del sistema"*).
- **Por qué confunde a este usuario**: *"Jorge se olvidó la contraseña"* no lleva a buscar un botón que
  se llama como un dato.
- **Propuesta**: botón **"Se olvidó la contraseña"**; en el cartel, *"Avisale a Jorge que entre con su
  DNI (28678901)."*
- **Cuesta**: chico.

**G-11 · Del panel a Movimientos, los mismos casilleros cambian de número.**
- **Dónde**: Panel → *Ver todos →* (Movimientos recientes) → Movimientos. Admin y tesorero.
- **Qué pasa**: el panel dice *Entró en noviembre $ 1.033.850*; Movimientos abre con *"Todo lo cargado
  hasta hoy"* y *Entró $ 1.308.850*. El rótulo existe (F-03), pero va en letra chica arriba de tres
  casilleros grandes que se llaman igual que los del panel.
- **Por qué confunde a este usuario**: un toque, y la plata que entró creció $ 275.000. Se lee como un
  error, no como otro período. **A validar con usuarios.**
- **Propuesta**: que *Ver todos* (y *Entró plata / Salió plata* del panel) abran Movimientos con *Este
  mes* puesto; o que Movimientos arranque siempre en *Este mes*, como Reportes.
- **Cuesta**: chico.

### HACE PERDER TIEMPO

**G-12 · "Completar la plata" de una venta o compra vieja hace hacer la cuenta a mano.**
- **Dónde**: Stock → *Entradas y salidas* → *Completar la plata* (las que quedaron *"Sin registrar el
  pago"*), admin.
- **Qué pasa**: la ventana pregunta *"Categoría y tipo"* (ya elegido, bien) y *"Monto: el total de la
  operación, no el precio por unidad"*. Es el formulario de antes de la venta en un paso: cantidad por
  precio, de cabeza. Al guardar: *"Movimiento de dinero registrado y vinculado al movimiento de stock"*.
  La misma fila tiene *Anular o corregir*, que sí arma la compra con cantidad, precio y total.
- **Por qué confunde a este usuario**: son 10 bolsas de pan; hay que multiplicar sin ver el precio. Es
  justo lo que la venta en un paso vino a sacar.
- **Propuesta**: que *Completar la plata* abra el mismo formulario de la compra con la cantidad fija
  (*"Lo que pagaste por bolsa"* y el total calculado). Y el texto de la tabla de vocabulario.
- **Cuesta**: medio.

**G-13 · El historial de un producto no dice cuánto hay ni cuánto entró y salió (tarea 3).**
- **Dónde**: Stock → *Historial* de un producto, operador.
- **Qué pasa**: *"¿Qué pasó con el queso este mes? ¿Por qué quedan tan pocos?"* El historial lista
  *+20, −2, −12,5, +20, −2* y dice *"5 entradas y salidas"*. Para saber cuánto entró, cuánto salió y
  cuánto hay hay que sumar a mano o volver a la otra pestaña.
- **Propuesta**: cuando el filtro es un solo producto, un renglón arriba de la lista: *"En el período:
  entraron 40 kg · salieron 16,5 kg. Hoy hay 23,5 kg."* Es la misma cuenta que ya hace la pestaña
  *Cuánto hay*.
- **Cuesta**: chico/medio.

**G-14 · La pista del servicio ayuda, pero hace hacer a mano lo que ya adivinó (tarea 39).**
- **Dónde**: Movimientos → *Entró plata*, tesorero de Metalúrgica, al elegir *Soldadura*.
- **Qué pasa**: aparece, grande y en naranja, *"¿Fue el servicio «Soldadura a domicilio»? Elegilo acá
  abajo para que cuente en «cuánto deja cada servicio»"*. Hay que abrir el desplegable y buscarlo entre
  siete. El naranja es el color de los avisos de cuidado.
- **Por qué confunde a este usuario**: E-06 quedó resuelto en lo importante: Daniel ya no cree que
  terminó. Pero el sistema le pregunta algo que ya sabe y le deja el trabajo.
- **Propuesta**: un botón en la pista, **"Sí, fue ese"**, que lo elige; y la pista en verde claro (es una
  sugerencia, no un problema).
- **Cuesta**: chico.

**G-15 · El botón ⇄ de cada producto en Stock sigue sin texto.**
- **Dónde**: Stock → *Cuánto hay*, cada fila, las tres medidas. Operador y admin.
- **Qué pasa**: *Historial*, *Comprar* y *Vender* tienen texto (E-19, E-20); el cuarto es sólo ⇄, y es
  *Otra entrada o salida*, que es donde se carga una rotura (tarea 4). En la tablet queda solo en un
  renglón propio debajo de los otros tres. Y el botón **Motivos** de la franja usa el mismo ⇄.
- **Propuesta**: texto **"Otra"** o **"Rotura u otra"**; o, si no entra, dejarlo sólo en la franja de
  arriba. Otro ícono para *Motivos* (por ejemplo, la lista).
- **Cuesta**: chico.

### MOLESTA

**G-16 · Celular: los botones de cada producto en Stock son más angostos que su palabra.** Medido a
375 px: *Historial* 88 px de texto en 80 de botón, *Comprar* 94 en 85, *Vender* 81 en 74. La palabra
toca el borde derecho y parece cortada. **Propuesta**: menos relleno o ícono arriba de la palabra en
esa medida. **Cuesta**: chico (CSS).

**G-17 · El panel se ve distinto de las demás pantallas, según el ancho.**
- A 1280 y 800, los botones de la franja (*+ Registrar una venta*, *+ Entró plata*…) son texto blanco
  sin borde: no parecen botones. A 375 sí tienen borde. En las demás pantallas siempre lo tienen.
- A 800 la franja del panel tiene esquinas redondeadas y margen; las demás van de borde a borde. *Ver
  reportes* queda solo en un segundo renglón.
- A 1280, *Productos a reponer* ocupa media pantalla con un número, y para Silvia y Roberto la columna
  derecha de abajo queda vacía (el bloque *Buscar empresas* tiene 250 px de blanco).
- **Cuesta**: chico (`dashboard.css`).

**G-18 · "Hay partes del sistema apagadas" no se puede cerrar.** En La Esperanza dice siempre
*"Servicios. Las prendés en Módulos del sistema"*, aunque la empresa no da servicios: invita a prender
algo que no se usa. En una empresa nueva repite el paso 1 de *Primeros pasos*. **Propuesta**: mostrarlo
sólo en la pantalla de Módulos, o con una X para no verlo más. **Cuesta**: chico.

**G-19 · El apagado de Productos avisa por los operadores, no por lo que pierde la propia admin (tarea
41).** El cartel se entiende y no asusta de más: nombra a los cuatro operadores y aclara que no se borra
nada. Dos detalles: dice que no van a tener *"nada para hacer"*, y les queda *Buscar empresas*; y no dice
que Marta deja de ver *Registrar una venta / compra* en el panel, Stock, *Por producto* y *Lo que se
perdió*. **Propuesta**: *"…sólo les va a quedar Buscar empresas. Vos también dejás de ver Stock, las
ventas y compras del panel y los reportes de productos."* **Cuesta**: chico.

**G-20 · Un movimiento sin descripción se titula "—".** En el celular, la tarjeta de la luz cargada sin
descripción tiene como título **—** (el tipo, *Luz*, va más abajo); en Reportes, la fila también. El
panel, en cambio, muestra *Luz*. **Propuesta**: usar el tipo cuando no hay descripción. **Cuesta**: chico.

**G-21 · El mismo catálogo en dos órdenes.** Productos ordena por categoría (Arroz, Bolsa, Fideos… Agua
al final); Stock y sus desplegables, alfabético (Agua primero). **Cuesta**: chico.

**G-22 · Detalles de texto y de forma.**
- *Otra entrada o salida*: la cantidad no muestra la unidad (la compra y la venta sí: *"20 kg"*), y el
  desplegable de producto no dice cuánto hay (los otros dos, sí).
- *Registrar una venta*: un producto nunca cargado dice *"Yerba mate 1kg (hay 0 paquetes)"*; en la
  tabla dice *Sin cargar*.
- *"Producto creado correctamente"*: no dice el paso siguiente (*"Cuando llegue, cargalo desde Stock"*).
- *"Resultado de noviembre"* sin *"(hasta hoy)"*, al lado de dos casilleros que lo tienen.
- Un servicio creado hoy aparece en el reporte de **octubre** con *"Sin movimientos en el período"*.
- La ventana *Corregir la compra* usa un recuadro celeste (el azul de Bootstrap) que no aparece en otro
  lado.
- Lo que se perdió: en pantalla el número va en el rojo de *Salió*; en el PDF, desde E-08, en gris. Lo
  que se decidió para el archivo valdría también para la pantalla.
- **Cuesta**: chico.

### Lo que está bien resuelto (para no romperlo)

- **Lo corregido el 15/11 que alcanzó**, verificado con la tarea que lo reportaba:
  - **E-01** (tarea 37): el tesorero ve *Anular* en la plata de una venta y un cartel que dice a quién
    pedírsela, con nombre. Termina la tarea sin ayuda (queda G-08, menor).
  - **E-05** (tarea 13): *"La plata ya quedó anotada en Movimientos: no hace falta cargarla de nuevo"*.
  - **E-07**: pantalla, CSV y PDF dicen *"del 1 al 15 de noviembre de 2026"* y *"Generado el
    15/11/2026"*.
  - **E-08** (tarea 42): **en el PDF el recuadro alcanza.** Va arriba, con letra normal, antes del
    número, y el número en negro. Quien lo recibe suelto lee primero que no está en el balance.
  - **E-10**: el rol dice *"Operador — el depósito: productos, stock, ventas y compras. No ve los totales
    de plata"*.
  - **E-11** (tarea 41): el cartel con los nombres se entiende y no asusta de más (queda G-19, menor).
  - **E-12 / E-21**: los carteles de módulo apagado y de falta de permiso dicen a quién pedir; a Elena,
    *"Lo prendés en Módulos del sistema"*.
  - **E-13, E-15, E-16, E-18, E-19, E-20, E-25, E-29**: el registro dice con qué email se entra; el menú
    marca dónde se está (también *Configuración*); el login tiene rótulos; *Ver lo que falta →* abre Stock
    filtrado; *Historial* con texto y atajos de período; *Editar / Dar de baja* con texto; *Volver a Mi
    empresa*; la bolsa de pan con una descripción de verdad.
  - **E-17 y E-28** (tarea 36): a 800 px ninguna tabla se corta (las del panel son de dos columnas) y
    **las tarjetas de a dos se leen bien**: Stock muestra cuatro productos por pantalla en vez de tres, y
    la etiqueta queda cerca del valor.
- **La venta y la compra en un paso** siguen siendo lo mejor de la app: el precio escrito, el total a la
  vista, *"Hay 5,5 kg · después de la compra va a haber 25,5 kg"*, el botón apagado si no alcanza.
- **Corregir en Movimientos**: *"El de antes se anula recién ahí: si cancelás, queda todo como estaba"*.
- **Primeros pasos y el reporte vacío** de una empresa nueva.
- **El buscador y la ficha**: *"a unos 2 km"*, *"CooperApp no manda mensajes"*, *Escribir un email* y
  *Llamar*, *"La zona es aproximada"*. Y la ficha propia avisa *"Esta es tu ficha: así la ven las otras
  empresas"*.
- **Por servicio**: los bloques *"Los que ofrecemos — deja $ 282.000"* / *"Los que contratamos — se lleva
  $ 18.000"*, y *"Sin movimientos en el período"* en lugar de un cero mudo.
- **Dar de baja un servicio**: *"Los movimientos que ya cargaste siguen mostrando este servicio y siguen
  contando en los reportes"* (tarea 19).
- **Los CSV en Excel**: números como números, fechas como fechas, acentos bien, nombre del archivo con
  empresa y período, la nota de cada vista en el archivo.
- **Ninguna pantalla con scroll de costado** a 375, 800 ni 1280, con ningún rol.

---

## 4. Plan sugerido

1. **G-01** (la nota de *Lo que se perdió*): un renglón. Es lo único que hoy contradice, en la misma
   pantalla, el mensaje más importante de los reportes.
2. **G-02** (*Por producto*): *Vendido / Comprado*, sin el rojo, y los casilleros fuera de esa vista.
   Es el número con el que alguien puede decidir mal qué dejar de comprar.
3. **G-03, G-04 y G-05** (corregir): textos y un cartel igual en las dos pantallas; después, *corregir*
   para lo de *Otra entrada o salida*. Conviene antes de RRHH, que va a tener su propio "me equivoqué".
4. **G-06** (*No alcanza*): un texto, y nombra *Ajuste positivo*. Llevarlo a la prueba con usuarios
   junto con el renombre que sigue abierto.
5. **El vocabulario de la sección 2**: una pasada de textos (*Completar la plata*, *Contraseña inicial*,
   *Sólo anular*, el toast con *dinero*).
6. **G-09 y G-10** (avisarle a la persona): dos textos que evitan que alguien quede esperando.
7. **G-12 y G-13** (completar la plata y el historial de un producto): reusan cuentas que ya existen.
8. **Para validar con una persona real** (el guion del prompt): G-07 (¿compara medio mes contra un mes
   entero?), G-11 (¿le sorprende que cambien los números?), G-02 (¿qué lee en *Por producto*?) y la
   salida con *Ajuste positivo* de G-06.
9. **Lo que puede esperar**: G-14 a G-22.

---

## Bugs encontrados (no son de UX: van al chat de desarrollo)

- **La nota de abajo de las vistas de Reportes no se actualiza al entrar a *Lo que se perdió***: queda
  la de la vista anterior, también entrando directo por `?vista=perdidas` (ver G-01).

Nada más. Todo lo que se cargó guardó lo que tenía que guardar, y los números de la pantalla, el CSV y
el PDF coinciden entre sí en las tres vistas descargadas.

---

## Notas para la próxima corrida

- **Las tareas, una por una** (toques contados desde el panel; la ventana cuenta como pantalla):

| # | Rol | ¿Sola? | Toques / pantallas | Dónde se frenó |
|---|---|---|---|---|
| 1 | operador | sí | 4 / 1 + ventana | — (*Registrar una compra* desde el panel) |
| 2 | operador | sí | 1 (*Ver lo que falta*) | — |
| 3 | operador | sí, con duda | 2 / 1 | no hay total del producto (G-13) |
| 4 | operador | con duda | 5 / 1 + ventana | *No alcanza* no nombra el ajuste (G-06); el ⇄ sin texto (G-15) |
| 5 | operador | sí si era una compra; con duda si era la rotura | 3 / 1 + 2 ventanas | G-04, G-05 |
| 6 | operador | sí | 6 / 1 + ventana | — |
| 7 | tesorero | sí | 4 / 1 + ventana | — |
| 8 | tesorero | con duda | 0 | G-07 |
| 9 | tesorero | sí | 3 / 1 + 2 ventanas | — |
| 10 | admin | sí | — | evaluada con Huerta Norte (29) |
| 11 | admin | sí | 7 / 1 + ventana | — (el rol ya dice qué hace) |
| 12 | admin | sí | 4 | — |
| 13 | admin | sí | 1 desde el panel o desde Stock | — (*la plata ya quedó anotada*) |
| 14 | admin | sí | 3 / 1 + ventana | G-19 |
| 15 | admin | sí | 5 / 1 + ventana | — |
| 16 | tesorero | sí | 6 | la pista (G-14) |
| 17 | tesorero | sí | 1 desde Servicios | — |
| 18 | tesorero | sí | 3 | — |
| 19 | admin | sí | 2 | — |
| 20 | — | se distinguen | — | — (el menú marca dónde está uno) |
| 21 | admin | sí, con duda | 3 | G-03, G-04 |
| 22 | admin | sí | 1 (*Ver reportes*) | — |
| 23 | admin | con duda | — | G-02 |
| 24 | admin | sí | 1 por archivo | — |
| 25 | admin | con duda en pantalla | 2 | G-01 |
| 26 | admin | sí | — | — |
| 27 | admin | sí | — | G-03 si se corrige una venta |
| 28 | operador | sí | — | — |
| 29 | admin nueva | sí | — | G-09 (antes de poder entrar), G-18 |
| 30 | admin nueva | sí | — | — |
| 31 | operador | sí | 3 desde el panel | — |
| 32 | admin | sí | 4 | — |
| 33 | — | sí en la ficha | — | — |
| 34 | superadmin | sí | 2 | G-09 |
| 35 | superadmin | sí | 3 | — (desde Usuarios, G-10) |
| 36 | tablet | sí | — | G-15, G-17; las tarjetas de a dos, bien |
| 37 | tesorero | sí | 2 | G-08 |
| 38 | admin | **no alcanza** | 2 | G-02 |
| 39 | tesorero | sí | 6 | G-14 |
| 40 | admin | a medias | 0 | G-07 |
| 41 | admin | sí | 3 | G-19 |
| 42 | — | **sí en el PDF** | — | la pantalla, no (G-01) |

- **Texto de menos de 13 px**: los rótulos de los casilleros de Reportes (*Entró*, *Salió*: 11,5 px), la
  nota de las vistas (12,5 px), las unidades del historial (12 px) y las ayudas de los formularios. Va con
  la regla de 14 px que sigue en el backlog: no se cuenta como hallazgo, pero G-02 es un caso donde pesa.
- **El *Monto* del CSV de movimientos sigue siempre positivo**, con el signo en *Entró / Salió*. Se dejó
  *a validar con el contador* en el informe anterior; sigue igual. Y la columna *Servicio* sale vacía
  para una empresa sin el módulo.
- **El entorno anduvo sin choques**: base `cooperApp_ux`, app en 3002 por `127.0.0.1`, Edge sin ventana
  en el 9377. Ojo: los dos `.sql` tienen `USE cooperApp;` adentro y hay que cambiarlo en las copias.
- **Lo que se cargó en la copia para recorrer** (y se borró con ella): una compra de 20 kg de queso, una
  venta de 2 kg a $ 11.000, la luz, el producto *Yerba mate 1kg*, el usuario Ramiro Paz, el servicio
  *Pintura de portones*, el pago de la compra de pan y Huerta Norte aprobada.


---

## Resultado de las correcciones (15/11/2026)

Se hicieron **los 22 y la tabla de vocabulario**, en el chat de desarrollo (pedido del usuario:
*"corregí todo"*). Lo que el informe marcaba *a validar* se hizo con su propuesta.

| Hallazgo | Qué se hizo |
|---|---|
| **G-01** | Cada vista pone su nota al entrar. En *Lo que se perdió* no va ninguna: el recuadro de abajo ya lo explica. |
| **G-02** | *Por producto*: columnas **Vendido** y **Comprado**, sin restar, ordenadas por lo vendido. Los casilleros del período se esconden y en su lugar va un recuadro con *"Vendido $ X · Comprado $ Y"* y la nota. Detalle *"vendiste 12,5 kg · compraste 20 kg · salieron sin venderse 2 kg"*. Igual en el CSV y el PDF. |
| **G-03** | La ayuda del precio dice de dónde salió el número: corrigiendo, *"Es lo que cobraste en la venta de antes (el precio del producto es $ X)"*; si se cambió, *"El precio del producto es $ X; acá va lo que cobraste"*. |
| **G-04** | El mismo cartel en Stock y en Movimientos: *"¿Qué querés hacer con…?"*, **Corregir** en verde (*"no se anula nada hasta que guardes"*) y **Anular** en rojo. |
| **G-05** | Todo se corrige: una pérdida, un consumo o un ajuste se abren en *Otra entrada o salida* con lo cargado, y la de antes se anula al guardar, en el mismo paso (`reemplaza` en `POST /productos/stock/movimientos`). |
| **G-06** | *No alcanza* nombra el **Ajuste positivo**: *"si fue una compra que no se cargó, registrala primero; si no, corregí la cuenta con un «Ajuste positivo» por lo que falta"*. |
| **G-07** | El panel compara contra **los mismos días** del mes anterior (*"Del 1 al 15 de octubre"*) y deja *"Octubre entero"* debajo, más chico; el resultado en dos renglones, cada uno con su *a favor / en contra*; sin línea de comparación si el mes anterior está vacío. |
| **G-08** | Al tesorero, en la plata de una venta: **"Entendido, se lo pido"** como botón principal y **"Anular igual"** aparte, con *"la venta queda como no cobrada"*. |
| **G-09** | El superadmin, al aprobar, lee *"Avisale por fuera del sistema (email o teléfono)"*; el registro y el login de una empresa pendiente dicen *"Cuando la aprueben vas a poder entrar con este mismo email y contraseña"*. |
| **G-10** | Botón **"Se olvidó la contraseña"**, y el cartel dice *"Avisale a Jorge que entre con su DNI (…)"*. |
| **G-11** | Desde el panel (*Ver todos*, *Entró / Salió plata*) Movimientos abre en **Este mes** (`?periodo=mes-actual`). |
| **G-12** | *Completar la plata* pide lo cobrado o pagado **por unidad** y muestra el total; las preguntas son las de siempre; el aviso dice *"Listo: la plata quedó anotada en Movimientos"*. |
| **G-13** | Con un producto elegido, el historial dice *"entraron X · salieron Y. Hoy hay Z"*. |
| **G-14** | La pista del servicio tiene **"Sí, fue ese"** y va en verde. |
| **G-15** | El cuarto botón dice **Otra**; *Motivos* tiene su propio ícono. |
| **G-16** | Ver B1 de QA: ícono arriba de la palabra en celular y tablet. |
| **G-17** | Las acciones del panel tienen borde en todos los anchos; en la tablet la franja va de borde a borde. |
| **G-18** | El aviso de módulos apagados tiene **"No mostrar más"** (vuelve si cambia lo apagado). |
| **G-19** | El cartel de apagar Productos dice que a los operadores les queda *Buscar empresas* y lo que deja de ver la propia admin. |
| **G-20** | Un movimiento sin descripción se titula con su tipo (*Luz*), en Movimientos y en Reportes. |
| **G-21** | Productos en orden alfabético, como Stock. |
| **G-22** | La cantidad de *Otra entrada o salida* dice la unidad y el desplegable cuánto hay; un producto nunca cargado dice *"sin cargar"*; *"Producto creado. Cuando llegue la mercadería, cargala desde Stock con «Registrar una compra»"*; *"Resultado de noviembre (hasta hoy)"*; el recuadro celeste de corregir pasó al verde; lo perdido va en gris oscuro también en pantalla. **Lo único que no se hizo**: que un servicio creado hoy no aparezca en el reporte de octubre, porque `productos` no guarda la fecha de alta (sería un cambio de esquema, y con los datos de prueba todos quedarían "creados hoy"). |

**Vocabulario**: *"Elegí un rol de la lista"*, *"Lo que hay no puede ser menos de cero"*, *"dejá «Sin
subcategoría»"*, *Anular igual*, *Se olvidó la contraseña* y el resto de la tabla.

**Probado**: por API (22 casos nuevos más las seis baterías anteriores), las 92 pantallas en tres
anchos sin errores ni nada que se salga de su bloque, y capturas mirando *Por producto*, Stock a
375 px, el cartel de corregir y el panel.
