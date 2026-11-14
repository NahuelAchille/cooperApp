# Auditoría de experiencia de usuario · CooperApp · final

**Fecha**: 14/11/2026 · **Al cerrar**: Sprint 13 (cubre la **HU-64**: textos y rótulos, ayudas
contextuales, contraste y tamaño de letra)
**Foco**: lo que nunca pasó por una auditoría de UX: la venta y la compra en un paso (Stock), el
buscador entre empresas y la ficha (Articulación), la pantalla del superadmin rehecha, los
*Primeros pasos* y los listados vacíos (HU-88), y el alta de movimientos con un solo desplegable
más *Anular y corregir* / *Cargar de nuevo* (HU-87). Además, una recomendación sobre **H-16**.

**Método**: recorrido real en el navegador, **todo a 375 px**, con la operadora (Silvia), el
tesorero (Roberto), la admin (Marta) de La Esperanza, el tesorero de Metalúrgica (Daniel), el
superadmin, y la admin de Huerta Norte recién aprobada (Elena). Cada pantalla se **midió** con un
script en la consola (no a ojo): ancho de cada tabla contra el contenedor, píxel del primer dato,
alto del encabezado, tamaño de cada texto, tamaño de cada botón, y la **relación de contraste de
cada texto visible** calculada con la fórmula de WCAG 2.1 (color del texto contra el fondo real,
sumando las capas semitransparentes). Donde el fondo es una imagen (el login) se muestrearon los
píxeles de la imagen detrás de cada texto.

Para no chocar con la auditoría de QA que corría al mismo tiempo, se levantó una **copia aparte**:
base `cooperApp_ux` creada desde los dos `.sql` y la app en el puerto 3002. **La base de siempre
(`cooperApp`) no se tocó.** Al terminar se borró `cooperApp_ux` y se cerró ese proceso. No se tocó
una sola línea de código ni se commiteó nada.

> Busca lo que **funciona pero confunde**. Los bugs van en una línea al final.
> Lo ya decidido (vocabulario de HU-84, tarjetas de HU-85, configuración de HU-86, filtros
> plegados, etc.) no se vuelve a reportar.
> Los hallazgos de este informe van numerados **F-01 a F-21** (F de *final*) para no
> confundirlos con los H-xx de los informes anteriores, sobre todo con **H-16**, que acá se
> responde aparte, en la sección 5.

**Umbrales de contraste usados** (WCAG 2.1 AA): **4,5 : 1** para texto normal y **3 : 1** para
texto grande (24 px, o 18,7 px en negrita). Para este público (35 a 55 años, cuando la vista de
cerca ya empezó a cansarse) 4,5 es el piso, no la meta.

---

## 1. Resumen ejecutivo

**Lo nuevo está bien pensado y se nota.** La venta en un paso es, probablemente, la mejor pantalla
de la app: pregunta *"¿Qué vendiste?"*, completa el precio, muestra el total mientras se escribe,
avisa *"Hay 5,50 kg y estás vendiendo 10. No alcanza."* **antes** de guardar, y el mensaje de
éxito dice exactamente qué pasó (*"Venta registrada: 1,5 kg de Queso cremoso por $ 18.750,00.
Quedan 4 kg."*). El desplegable único de HU-87 (*"¿En qué se fue la plata?"* y abajo *"Va en
Gastos fijos › Luz."*), los listados vacíos de HU-88, los *Primeros pasos* y la pantalla del
superadmin se entienden sin ayuda. Eso hay que no romperlo. Los tres problemas grandes son otros:

**1. "Anular y corregir" puede hacer desaparecer plata sin que nadie se entere.** El botón anula
el movimiento **en el momento** y después abre el formulario con los datos copiados. Si la
persona se arrepiente y toca **Cancelar** —lo más natural del mundo frente a un formulario—, el
gasto queda anulado, no hay otro en su lugar y **no aparece ningún aviso**. Lo probé con una luz
de $30.000: después de *Cancelar*, la luz ya no estaba en la lista ni en los totales. Para
encontrarla hay que saber que existe *Ver anulados*, que en el celular está escondido adentro de
*Filtros*. Es el único lugar de la app donde un clic "inofensivo" cambia el balance.

**2. El contraste no alcanza en lo que más se lee, empezando por la puerta de entrada.** En el
**login**, el texto blanco sobre la foto verde da entre **2,0 y 2,8 : 1**, las palabras *Email* y
*Contraseña* adentro de los campos **2,1 : 1**, y el link *Registrar mi empresa* (verde sobre
verde) **1,9 a 2,2 : 1**: menos de la mitad de lo mínimo. En el **tablero**, los títulos de los
casilleros (*Ingresos del mes*, *Balance del mes*) y la comparación con el mes anterior están en
gris `#aaa`: **2,32 : 1**, a 13 px. Y el gris "secundario" de la app (`#6c8a7a`, 23 usos en 10
archivos: categoría, unidad, descripción, localidad) da **3,78 : 1** a 12-13 px. Casi todo se
arregla cambiando **tres colores**, sin rediseñar nada.

**3. Hay números de plata que se contradicen en pantalla y nadie explica por qué.** En La
Esperanza el tablero dice *"Ingresos del mes: $ 616.750"* y Movimientos, a un toque, dice
*"INGRESOS: $ 891.750"*, sin decir que el segundo es **todo lo cargado desde siempre**. El
tablero compara contra el mes anterior en porcentaje: *"Egresos +2542% vs mes anterior"*, un
número que no le dice nada a un panadero. El casillero de **Ingresos** del tablero tiene la franja
**roja** (en Movimientos es verde, y el rojo es la plata que sale). Y lo mismo se llama
*Balance*, *Resultado* o *Deja* según la pantalla. Cada cosa sola es chica; juntas hacen que la
persona dude de los números, que es lo único que el sistema no se puede permitir.

**Sobre H-16 (dónde vive "cuánto deja cada servicio")**: la recomendación es **una sola puerta, en
Reportes**, con el atajo desde Servicios apuntando ahí, y sacar el panel de Movimientos. El
fundamento está en la sección 5.

---

## 2. Propuesta de vocabulario

Ordenada por cuánto confunde hoy. **Nada de esto toca la base**: el que más lejos llega toca los
datos que se siembran (`datos-iniciales.js` y `datos_de_prueba.sql`), no el esquema.

| Término actual | Dónde aparece | Problema | Propuesto | Qué hay que tocar |
|---|---|---|---|---|
| **"¿Cuánto te cuesta perder un kilo?"** (y *"costo"*, *"Lo que pagaste por unidad"*) | Alta de producto · compra en un paso · casilla de la compra | Desde el 26/10 ese campo **también** es lo que aparece escrito al comprar, y la compra lo actualiza. El rótulo habla sólo de perder: nadie que esté cargando su precio de compra lo va a reconocer. Tres nombres para el mismo dato | **"¿Cuánto te cuesta comprar un kilo? (opcional)"**, ayuda: *"Lo que le pagás vos al proveedor, no lo que lo vendés. Aparece escrito al registrar una compra y sirve para saber cuánta plata se va en roturas. Si no lo sabés, dejalo vacío."* | Sólo pantalla |
| **"Articulación"** | Menú · Módulos del sistema · casilla de Productos y Servicios (*"buscador de Articulación"*) · Mi empresa · aviso del tablero | Es una palabra del mundo cooperativo y de las políticas públicas. La propia pantalla ya se llama **"Buscar entre empresas"**: el menú dice una cosa y el título otra | **"Buscar empresas"** en el menú y en Módulos; *"el buscador de empresas"* en las ayudas | Sólo pantalla (la clave `articulacion` queda) |
| **Balance / Resultado / Deja / "Quedó a favor"** | Tablero y Movimientos (*Balance*) · Reportes (*Resultado*) · panel de servicios (*Deja*) | La misma cuenta, entró menos salió, con tres nombres. En el panel de servicios y en el reporte *Por servicio* —que muestran la misma tabla— la columna se llama *DEJA* en uno y *RESULTADO* en el otro | **"Resultado"** en los casilleros (con *"Quedó a favor / en contra"* abajo, como ya hace Reportes). *Deja / se lleva* queda sólo para servicios, donde es natural | Sólo pantalla |
| **Ingresos / Egresos** | Casilleros del tablero y de Movimientos · formulario de motivos (*"Ingreso — entra plata"*) | El alta, la columna del listado y Reportes ya dicen **Entró / Salió** (HU-84). Los casilleros que están justo arriba siguen en contable | **"Entró" / "Salió"** en los casilleros (*"Entró en el mes"*). En motivos: *"Entra plata" / "Sale plata" / "No mueve plata"* | Sólo pantalla |
| **"Ajustar stock" / "Otra entrada o salida" / "Registrar una entrada o una salida"** | Acciones rápidas del tablero · botón de Stock · título del cartel | Un mismo botón con tres nombres | **"Otra entrada o salida"** en los tres lugares | Sólo pantalla |
| **"Ajuste positivo (entrada)" / "Ajuste negativo (salida)"** | Motivos sembrados, lista de *Otra entrada o salida* | Para *"llegaron 20 kg que nos regalaron"* o *"contamos y había 3 de más"* hay que traducir a jerga contable | **"Corrección: había más"** / **"Corrección: había menos"** *(a validar con usuarios)* | Datos sembrados (`datos-iniciales.js`, `datos_de_prueba.sql`) |
| **"salida"** en el cartel de anular una venta | Stock → Entradas y salidas → Anular | Se registró una **venta**, y el cartel pregunta *"¿Anular la salida de 1,50 kg…?"* | *"¿Anular la **venta** de 1,5 kg…?"* (y *compra* para las compras) | Sólo pantalla |
| **"existencia"** | Cartel de anular (*"la existencia se recalcula sola"*), pestaña *Existencias*, tarjeta de Stock | Palabra de inventario. La persona piensa *"cuánto hay"* | Pestaña **"Cuánto hay"**; en el cartel: *"el queso vuelve al stock"* | Sólo pantalla |
| **"por unidad"** con productos por kilo | Venta (*"Precio por unidad"*), compra (*"Lo que pagaste por unidad"*), producto (*"A cuánto le cobrás una unidad"*) | El queso se vende por kilo; el campo del costo **sí** se adapta (*"perder un kilo"*) y el del precio no. Y las listas dicen *"hay 6 bolsa"*, *"hay 0 caja"*, *"60 unidad"* | **"Precio por kg"**, **"Lo que pagaste por kg"**; plurales: *"hay 6 bolsas"* | Sólo pantalla (más el plural en `unidades-medida.js`) |
| **"Motivos de movimiento de stock"** | Título de la pantalla | El menú dice *"Motivos de stock"* | **"Motivos de stock"** | Sólo pantalla |
| **"Categorías"** a secas | Botón de Movimientos (admin) | El nombre decidido en HU-84 tiene apellido | **"Categorías de movimientos"**, o el ícono del engranaje con ese texto como `title` si no entra | Sólo pantalla |
| **"Resetear contraseña"** | Superadmin, pestaña *Todas* | Anglicismo; no dice a qué vuelve | **"Volver a la contraseña inicial"** | Sólo pantalla |

---

## 3. Hallazgos, ordenados por severidad

Ninguno **bloquea**: todas las tareas se pudieron terminar. Pero hay varias **dudas caras**, que en
un sistema que maneja plata pesan más que un camino largo.

### GENERA DUDA

**F-01 · "Anular y corregir" + Cancelar = plata que desaparece sin aviso.**
*Dónde*: Movimientos → Anular → *Anular y corregir* → *Cancelar*. Tesorero y admin.
*Qué pasa*: el original se anula al tocar *Anular y corregir*; el formulario que se abre después
dice *"Copiamos los datos del movimiento anulado"*, pero su botón se sigue llamando *Cancelar*.
Probado con una luz de $30.000: después de *Cancelar*, la luz no está en la lista ni en el balance,
y no hubo ningún mensaje.
*Por qué confunde a ESTE usuario*: *Cancelar* significa *"dejá todo como estaba"*. Nadie de oficio
va a leer *"del movimiento anulado"* como *"el anterior ya no cuenta"*. Y el camino para
recuperarlo (*Filtros* → *Ver anulados* → *Cargar de nuevo*) está escondido en el celular.
*Qué propongo*, en orden de costo:
- **(chico)** En ese modo, el botón dice **"Dejarlo anulado sin cargar otro"**, y si se cierra sin
  registrar aparece un toast: *"La luz de $ 30.000 quedó anulada y no cargaste otro. Si fue sin
  querer, tocá Ver anulados → Cargar de nuevo."*
- **(medio, mejor)** Que *Anular y corregir* **no anule nada** hasta que se toque *Registrar* en el
  formulario nuevo (el servidor anula el viejo y crea el nuevo juntos). Así *Cancelar* vuelve a
  significar lo que significa.

**F-02 · El tesorero y el operador pueden cargar dos veces el pago de la misma compra.**
*Dónde*: Movimientos → Salió → la lista ofrece *"Compra de mercadería"*. Tesorero.
*Qué pasa*: desde el 26/10 el operador registra la compra **con su pago** desde Stock, y ese pago
cae justo en *Insumos › Compra de mercadería*. El tesorero —que es el que le paga al proveedor— no
entra a Stock, así que no ve el aviso *"¿Compraste mercadería? Cargala desde Registrar una
compra"* (ese aviso es sólo para el admin). Tiene la misma opción en su lista y nada le dice que
quizá ya está cargada.
*Por qué confunde*: para el tesorero *"le pagué al proveedor"* es su trabajo, y cargarlo es lo
correcto. El egreso queda duplicado y el balance da peor de lo que es.
*Qué propongo* (medio): cuando el tesorero elige un tipo que es el destino de un motivo de compra
o de venta, mostrar abajo: *"Si esto es mercadería, lo carga el depósito desde Registrar una
compra, y la plata se carga sola. Antes de seguir, fijate en la lista que no esté ya cargado."*
*(a validar con usuarios: depende de cómo se repartan el trabajo en cada empresa)*

**F-03 · Tres "ingresos" distintos en tres pantallas, sin decir de qué período.**
*Dónde*: Tablero (*"Ingresos del mes $ 616.750"*), Movimientos (*"INGRESOS $ 891.750"*), Reportes
(*"ENTRÓ"*, este mes). La Esperanza, admin y tesorero.
*Qué pasa*: los casilleros de Movimientos suman **todo lo cargado desde siempre** cuando no hay
filtro, pero no lo dicen. El panel de servicios, en la misma pantalla, **sí** lo dice (*"Todo lo
cargado hasta hoy"*).
*Por qué confunde*: la persona ve dos números distintos para *"lo que entró"* a un toque de
distancia y concluye que uno está mal.
*Qué propongo* (chico): una línea arriba de los tres casilleros, igual a la del panel: *"Todo lo
cargado hasta hoy"* sin filtro, *"Del 1/11 al 14/11"* con fechas. Sale de los mismos filtros que ya
se usan.

**F-04 · Los porcentajes del tablero no le dicen nada a nadie.**
*Dónde*: Tablero, casilleros de Ingresos y Egresos. Admin y tesorero.
*Qué pasa*: *"+124% vs mes anterior"*, *"+2542% vs mes anterior"*. Con un mes anterior chico, el
porcentaje se dispara; además el mes en curso va por la mitad y se compara contra uno completo.
*Por qué confunde*: un porcentaje de cuatro cifras parece un error, y *"vs"* no es castellano.
*Qué propongo* (chico): mostrar el monto, no el porcentaje: **"El mes pasado: $ 12.000"**. Que la
persona compare dos números de plata, que es lo que sabe hacer.

**F-05 · El casillero de Ingresos tiene la franja roja.**
*Dónde*: Tablero. Todos los roles con finanzas.
*Qué pasa*: Ingresos `#9c1919` (rojo), Egresos turquesa, Balance verde. En Movimientos es al revés:
ingresos verde, egresos rojo, y los montos también.
*Por qué confunde*: el rojo es *"perdí plata"* en todos lados, incluida la propia app.
*Qué propongo* (chico): los mismos colores que Movimientos (verde, rojo, azul para el resultado).

**F-06 · El costo del producto lo puede cambiar el operador desde una casilla que le habla de un
reporte que no ve.**
*Dónde*: Stock → Registrar una compra, cuando lo pagado difiere del costo. Operador.
*Qué pasa*: aparece **ya tildada** *"Guardar $ 9.000,00 como el costo de Queso cremoso (antes:
$ 8.200,00). Es el que usa el reporte de pérdidas."* El operador no entra a Reportes y no sabe qué
es *"el reporte de pérdidas"*.
*Por qué confunde*: la casilla está bien pensada (con inflación, lo último pagado es el costo
real), pero la frase está escrita para el admin.
*Qué propongo* (chico): *"Desde ahora, el queso nos cuesta $ 9.000 el kilo (antes $ 8.200)."*
Sin mencionar el reporte. Y el rótulo del producto, como dice la tabla de vocabulario.

**F-07 · En el historial de Stock la flecha para arriba significa que bajó.**
*Dónde*: Stock → Entradas y salidas (badges), Motivos de stock, casilleros de Movimientos. Todos.
*Qué pasa*: salida = `↑` en rojo al lado de *"−1,50 kg"*; entrada = `↓` en verde. Es coherente en
toda la app (la idea es *"sale de la caja"*), pero choca con el número que tiene al lado.
*Por qué confunde*: para cualquiera, una flecha para arriba es *"subió"*. En la misma tarjeta dice
`↑ Venta` y `−1,50`.
*Qué propongo* (chico): sacar la flecha del badge y dejar el signo del número, que ya lo dice todo;
o usar `+` y `−` en el badge. *(a validar con usuarios)*

**F-08 · El cartel de anular una venta habla de "salida" y de "existencia", y no ofrece corregir.**
*Dónde*: Stock → Entradas y salidas → Anular, sobre una venta. Operador.
*Qué pasa*: *"¿Anular la salida de 1,50 kg de Queso cremoso del 14/11/2026? No se borra: queda en
el historial marcado como anulado, y la existencia se recalcula sola. También se anula su cobro de
$ 18.750,00."* La última frase es excelente. Las dos primeras están en idioma de inventario. Y no
hay *Anular y corregir*: el operador que tipeó mal el precio tiene que anular y volver a cargar de
memoria, **sin poder ver lo que había cobrado** (el historial de Stock no muestra la plata, sólo
el toast de seis segundos al registrar).
*Qué propongo*: el texto, **chico**: *"¿Anular la venta de 1,5 kg de Queso cremoso del 14/11? No
se borra: queda en el historial como anulada, el queso vuelve al stock y también se anula el cobro
de $ 18.750."* El botón *Anular y corregir* de HU-87 también acá, **medio** (es el mismo patrón,
ya escrito). Que el operador vea lo cobrado en sus propias ventas es **decisión del grupo** (hoy
no ve plata a propósito, pero esa plata la cargó él).

**F-09 · El buscador se llama distinto en el menú y en la pantalla, y la ficha no dice qué hacer.**
*Dónde*: Articulación → ficha de una empresa. Los tres roles.
*Qué pasa*: el menú dice *Articulación*; la pantalla, *"Buscar entre empresas"* (ver vocabulario).
En la ficha, los contactos son un email y un teléfono sueltos, sin un verbo. El buscador está
**muy bien**: *"¿Qué necesitás?"*, el ejemplo en el campo, *"de la más cercana a la más lejana"*,
y cuando no encuentra nada sugiere otra palabra.
*Por qué confunde*: alguien que llega a la ficha de la papelera piensa *"¿y cómo le pido?"*, y
puede esperar un botón para mandarle un mensaje adentro de la app.
*Qué propongo* (chico): arriba de los contactos, *"Para comprarle o consultarle, escribile o
llamala: CooperApp no manda mensajes."* y los links como botones: **"Escribir un email"** /
**"Llamar"** (el `tel:` ya está y en el celular marca solo).

**F-10 · "Mi localidad no está" no tiene respuesta.**
*Dónde*: Mi empresa → Localidad (y el registro). Admin.
*Qué pasa*: la lista tiene 36 localidades del GBA y La Plata, cada una con *"(Buenos Aires)"*
repetido, y nada dice que es parcial. Una empresa de Luján la encuentra; una de Rosario no, y no
sabe si hizo algo mal.
*Qué propongo* (chico): ayuda abajo: *"Por ahora la lista tiene el Gran Buenos Aires y La Plata.
Si tu localidad no está, dejá Sin elegir: vas a aparecer igual en el buscador, pero sin la
distancia."* Y sacar el *"(Buenos Aires)"* de cada opción (agrupar por provincia con
`<optgroup>`).

**F-11 · "Corregir" se encuentra atrás de un botón rojo de prohibido.**
*Dónde*: Movimientos, tarea *"cargué mal un movimiento ayer, corregilo"*. Tesorero.
*Qué pasa*: la única acción de la fila es el ícono `fa-ban` rojo, *Anular*. *Anular y corregir*
existe (y está bien explicado adentro del cartel), pero para llegar hay que animarse a tocar lo
que parece *"borrar"*. Adentro del cartel, el botón lleno y rojo es *Anular* y el de corregir es
el de borde.
*Por qué confunde*: la persona busca *"editar"*; ve un prohibido rojo y duda.
*Qué propongo* (chico): `title` y texto del botón de la fila **"Anular o corregir"**; adentro del
cartel, *Anular y corregir* primero y como botón lleno (es lo que se usa la mayoría de las veces),
*Anular* después. El vocabulario de HU-84 no se toca: sigue siendo anular.

### HACE PERDER TIEMPO

**F-12 · El contraste del login, del tablero y del gris secundario.** Ver la sección 4 con los
números. Es lo que más afecta a este público, y lo que menos cuesta arreglar.

**F-13 · La tabla de Motivos de stock no entra en el celular.**
*Dónde*: Configuración → Motivos de stock, 375 px. Admin.
*Qué pasa*: **mide 606 px en un contenedor de 343**: es la única tabla de la app que no usa
`tabla-mobile.css`. Se cortan justo *"Qué le hace al dinero"* —incluida la línea *"Va a Insumos ›
Compra de mercadería"*, que es lo que hay que configurar para que la venta en un paso funcione—,
el estado y los botones.
*Qué propongo* (chico): ponerle `tabla-tarjetas` y los `data-label`, como al resto. Es el error que
el propio prompt dice que se repite.

**F-14 · En Stock, lo que más se usa está último y el primer dato quedó en el píxel 504.**
*Dónde*: Stock, 375 px. Operador.
*Qué pasa*: el encabezado verde tiene cuatro botones apilados —*Productos*, *Otra entrada o
salida*, *Registrar una compra*, *Registrar una venta*— y la venta, que es lo de todos los días,
va abajo de todo. El primer producto aparece en el **píxel 504**; después del arreglo de filtros
del 28/09 estaba en 404: los dos botones nuevos se comieron 100 px.
*Qué propongo* (medio): en el celular, **Vender** y **Comprar** lado a lado arriba (los dos
grandes), *Otra entrada o salida* abajo más chico, y *Productos* como link en el subtítulo.

**F-15 · Cada fila de Stock tiene cuatro íconos sin texto.**
*Dónde*: Stock → Existencias, tarjeta de cada producto. Operador.
*Qué pasa*: reloj (historial), camión (compra), carrito (venta), flechas (otra). Miden **42 × 38
px**, por debajo de los 44 recomendados para un dedo. El camión como *"compra"* no se adivina.
*Qué propongo* (medio): en la tarjeta del celular, **"Vender"** y **"Comprar"** con texto; reloj y
flechas pueden quedar como íconos. Todos de 44 px de alto.

**F-16 · "No alcanza" no dice qué hacer.**
*Dónde*: Registrar una venta, cuando la cantidad pasa lo que hay. Operador.
*Qué pasa*: *"Hay 5,50 kg y estás vendiendo 10. No alcanza."* El aviso en vivo es muy bueno; le
falta el paso siguiente (el mensaje del servidor sí lo tenía).
*Qué propongo* (chico): sumar *"Si en el depósito hay más, primero cargá lo que entró (Registrar
una compra u Otra entrada o salida)."*

**F-17 · El tablero del operador es, sobre todo, una lista de lo que no puede ver.**
*Dónde*: Tablero. Operador; y la empresa recién aprobada con módulos apagados.
*Qué pasa*: para Silvia, tres de los cuatro casilleros dicen *"Sin acceso"* y el bloque siguiente
*"Tu usuario no tiene acceso a los movimientos"*: todo eso ocupa la primera pantalla, y su
información (*Productos a reponer: 3*) queda en el cuarto casillero. En Huerta Norte, recién
aprobada, tres bloques avisan *"módulo no activo"*, y uno se lo dice así a la propia admin: *"El
administrador puede activarlo desde Módulos del sistema."* HU-88 alcanzó para explicar el guion;
lo que queda es que esos bloques están.
*Qué propongo* (medio): no dibujar los casilleros y bloques que ese rol o esa empresa no usan. A la
admin, una sola línea: *"Hay partes del sistema apagadas: Productos, Buscar empresas. Las prendés
en Módulos."*

### MOLESTA

**F-18 · El precio se escribe sin separador de miles.** En la venta y la compra el campo muestra
`12500` (es `type="number"`) mientras el total muestra `$ 125.000,00`. El total en vivo ataja el
cero de más, así que es menor; si se toca el campo, una línea abajo con *"= $ 12.500 el kg"*.

**F-19 · La distancia parece exacta.** *"a 2,3 km"* en la lista y la ficha, cuando es la distancia
entre centros de localidades (la aclaración está, pero abajo del mapa). Propongo *"a unos 2 km"*.

**F-20 · El encabezado ocupa dos renglones en el tablero y en Mi empresa.** Mide **107 px**; en el
resto de las pantallas, **64 px** en un renglón. El botón del menú baja a una segunda fila de
ancho completo.

**F-21 · Detalles.** El ejemplo de la descripción en el alta de movimientos dice *"Ej: Venta de
conservas"* también cuando se tocó *Salió* · en el superadmin, *"Ver datos"* tiene texto en
*Para aprobar* y es un ojo sin texto en *Todas* · *"Volver a stock"* en Motivos aparece también
cuando se llegó desde el menú de Configuración · en la ficha, el rubro general se repite en
mayúsculas arriba de cada grupo (*PAPEL, CARTÓN Y EMBALAJE ›* tres veces) · las etiquetas del
formulario de venta y compra no están atadas a sus campos (tocar *"Cantidad"* no pone el cursor en
el campo, y un lector de pantalla lo anuncia como *"0"*).

### Lo que está bien resuelto (para no romperlo)

- **La venta y la compra en un paso**: el total en vivo, el *"Hay 4 kg · después de la compra va a
  haber 24 kg"*, el aviso de *no alcanza* antes de guardar, el precio ya escrito y explicado
  (*"Si cobraste otro (un descuento, un precio por cantidad), cambialo"*), el mensaje de éxito, y
  el cartel de anular que dice *"También se anula su cobro de $ 18.750,00"*.
- **Otra entrada o salida** explica por qué la venta y la compra no están en su lista y a dónde ir.
- **El alta de movimientos de HU-87**: la pregunta cambia con el botón (*"¿De qué fue?"* / *"¿En qué
  se fue la plata?"*) y *"Va en Gastos fijos › Luz."* despeja el tipo repetido. La luz se carga en
  cinco toques.
- **Los vacíos de HU-88**: *"Todavía no cargaste ningún movimiento. Tocá Nuevo movimiento…"*, y el
  reporte vacío con *"Registrar el primero"*. Los *Primeros pasos* son cortos, tachan lo hecho y
  dicen que desaparecen.
- **El superadmin**: la tarjeta de la empresa pendiente tiene lo necesario para decidir (localidad,
  CUIT, contacto, administrador); *Rechazar* pide confirmación y explica que se puede deshacer;
  *Aprobar* no la pide (y está bien: se deshace) y el toast dice *"Elena Maldonado ya puede entrar
  con su email y su contraseña"*.
- **El buscador**: el ejemplo en el campo, el resultado ordenado y explicado, el *"no encontramos"*
  con una sugerencia concreta, y la ficha con *"La zona es aproximada"*.
- **Las tablas en el celular**: todas, **salvo Motivos**, entran a 375 px (medidas: Stock,
  Movimientos, Productos, Servicios, Usuarios y Superadmin 343/343; Reportes 309/309).

---

## 4. Contraste y tamaño de letra (HU-64), con números

Medido a 375 px, texto por texto. *Relación* es el contraste contra el fondo real.

| Dónde | Texto | Colores | Relación | Tamaño | ¿Pasa? |
|---|---|---|---|---|---|
| Login | *Inicio de sesión*, *¿No tenés cuenta?* | blanco sobre la foto | **2,0 – 2,8** | 16 – 28 px | No |
| Login | *Email*, *Contraseña* (adentro de los campos) | blanco sobre verde claro | **2,1** | 16 px | No |
| Login | *Registrar mi empresa* | `#198754` sobre la foto | **1,9 – 2,2** | 16 px negrita | No |
| Login | botón *Ingresar* | blanco sobre degradé `#19de75 → #128c4a` | **1,8** arriba · 2,7 al medio · 4,3 abajo | 16 px negrita | No |
| Tablero | títulos de casilleros, *"vs mes anterior"*, *"Sin acceso"* | `#aaa` sobre blanco | **2,32** | 12,8 – 13,6 px | No |
| Stock, Productos, Servicios, ficha, superadmin | categoría, unidad, descripción, localidad | `#6c8a7a` sobre blanco | **3,78** | 12,5 – 13,6 px | No |
| Stock | stock mínimo | `#8aa596` sobre blanco | **2,66** | 13,1 px | No |
| Productos, Servicios | el `—` de *"no avisa"* | `#b3c7bc` | **1,78** | 16 px | No (y lleva información) |
| Reportes | notas debajo de los casilleros, vacío | `#8b9a92` | **2,83 – 2,94** | 12,5 – 14,4 px | No |
| Reportes | *"Son la misma plata del período…"* | `#7d8c84` | **3,53** | 12,5 px | No |
| Primeros pasos | ayudas de cada paso | `#7a8a80` | **3,64** | 14 – 16 px | No |
| Franjas verdes de título | subtítulo blanco sobre el extremo claro | blanco sobre `#3a9e65` | **3,36** | 14 px | No |
| Stock, tablero | badge *Reponer* | `#b5650a` sobre `#fdf0dc` | **3,87** | 11,5 px | No |
| Movimientos | badge *Anulado* | `#777` sobre `#eee` | **3,86** | 12 px | No |
| Encabezado | iniciales del avatar | blanco sobre `#2d7a4f → #19de75` | **1,8** en el extremo claro | 12,8 px negrita | No |
| Reportes | botones de descarga apagados | `#aab5af` | 1,96 | 13,8 px | *(apagado: WCAG lo exime, pero tiene que leerse por qué)* |
| Bien | texto principal, verde de rótulos `#2d7a4f`, badge de categoría `#2d7a4f` sobre `#e4f2eb` | | 5,24 · 4,54 | | Sí |

**Qué propongo** (chico, casi todo es cambiar variables):
1. **Un solo gris secundario, `#4a6356` (6,54 : 1)**, en lugar de `#6c8a7a`, `#8aa596`, `#8b9a92`,
   `#7d8c84`, `#7a8a80` y `#aaa`. Sigue siendo verdoso, no cambia la paleta. Hoy hay **seis grises
   distintos** repartidos en archivos sueltos (`--texto-suave` en algunos, `--muted` en el tablero,
   el color escrito a mano en otros): conviene **una variable compartida en `base.css`**, como se
   hizo con `tabla-mobile.css`.
2. **Login**: una tarjeta oscura semitransparente detrás del formulario (por ejemplo
   `rgba(0, 0, 0, .35)`, o el verde `#1e5c3a`), con los campos en blanco y texto oscuro, y el link
   en blanco subrayado. La foto se queda.
3. **El degradé de las franjas** termina en un verde más oscuro (`#2f8456` en vez de `#3a9e65`), o
   se usa el verde liso. El del botón *Ingresar* y el del avatar, igual.
4. **Badges**: texto `#8a4b00` sobre el mismo fondo para *Reponer* (≈ 6 : 1) y `#555` para
   *Anulado*.

**Tamaño de letra.** Cantidad de textos **de menos de 14 px** por pantalla: Motivos 35, Productos
33, Stock 31, Reportes 26, Movimientos 22, ficha 16, Usuarios 15, tablero 14. Lo más chico es
**11,5 px**: los badges (*Reponer*, *Sin stock*, *Anulado*) y los títulos de columna de Reportes.
Propongo una regla escrita para el proyecto: **nada que tenga un dato va por debajo de 14 px; los
badges, 13 px como mínimo.** Es la regla que vuelve legible la app sin tocar el diseño.

**Tamaño de los botones.** Por debajo de 44 px: los cuatro íconos de cada fila de Stock (42 × 38),
el botón del menú del encabezado (41 × 35), los de la tarjeta del superadmin (38 de alto).

---

## 5. Recomendación sobre H-16: dónde vive "cuánto deja cada servicio"

**Recomendación: una sola puerta, en Reportes.** El atajo *"Cuánto deja cada uno"* de Servicios
lleva al reporte *Por servicio* con *Este mes* elegido, y el panel plegable sale de Movimientos.

**Lo que observé, que es la base de la recomendación:**

1. **Ya son dos tablas que no dicen lo mismo.** El panel arranca en *"Todo lo cargado hasta
   hoy"*; el reporte, en *"Este mes"*. Hoy, en Metalúrgica, coinciden ($152.000 la soldadura)
   **sólo porque todos los movimientos de servicios son de noviembre**: el 1/12 el panel va a
   seguir diciendo $152.000 y el reporte $0. Y la columna del resultado se llama *DEJA* en uno y
   *RESULTADO* en el otro. Dos puertas para la misma pregunta que contestan distinto es lo que
   el proyecto evitó en todos lados (el cálculo del stock escrito una vez, los totales del reporte
   salidos de las mismas filas).
2. **En el celular, el panel no tiene su período a la vista.** En Movimientos el panel va del
   píxel 521 al 975, y el período se elige **abajo**, adentro de *Filtros* plegado. Para contestar
   *"¿cuánto nos dejó la soldadura el mes pasado?"* hay que bajar más allá del panel, abrir
   *Filtros*, tocar *El mes pasado*, y volver a subir para ver qué cambió. En Reportes el período
   está **arriba de todo** y los números abajo: el orden en que se piensa la pregunta.
3. **El propio proyecto ya decidió dónde va esto.** La regla escrita es: *el listado de
   Movimientos es la pantalla de trabajo (se carga, se corrige, se anula); el reporte se mira, se
   imprime y se manda.* *"¿Cuál servicio conviene sostener?"* es una pregunta para mirar y para
   decidir, no para cargar. Y en Reportes además **se descarga**, que es lo que se le manda al
   contador o se lleva a una reunión.
4. **Moverlo no le quita nada a nadie.** Los dos lugares los ven los mismos roles (admin y
   tesorero); Reportes viene prendido de fábrica; y en Movimientos, elegir un servicio en los
   filtros **ya** muestra en los casilleros lo que dejó ese servicio (es el *"regalo"* de HU-48), así
   que la pregunta de un servicio solo sigue teniendo respuesta ahí.
5. **Contar toques**: *"¿cuánto nos dejó la soldadura el mes pasado?"* desde Servicios. Hoy, por
   Movimientos: atajo → bajar → *Filtros* → *El mes pasado* → subir (5 pasos y un scroll). Con la
   recomendación: atajo → *El mes pasado* (2 toques), con la tabla justo abajo.

**El único costo, y cómo se resuelve**: Reportes es un módulo opcional y Movimientos no. Si una
empresa tiene Servicios pero apagó Reportes, el atajo no tiene a dónde ir. Propuesta: en ese caso
el botón no se muestra al tesorero, y al admin se le muestra con una línea: *"Para ver cuánto deja
cada servicio, prendé Reportes en Módulos del sistema."*

**Qué hay que tocar** (chico a medio): sacar el panel y su script de `movimientos.html`; que
`reportes.html` acepte `?vista=servicio` (como Movimientos acepta `?ver=servicios`); cambiar el
link del botón en `servicios.html`. El endpoint `GET /movimientos/resumen-por-servicio` queda sin
pantalla: o se borra, o se deja documentado. La consulta del modelo no cambia, porque el reporte ya
la reusa.

**Por qué no "en los dos"**: es la opción de hoy y ya mostró el problema (punto 1). **Por qué no
"sólo en Movimientos"**: pierde la descarga y el período arriba, y contradice la regla de
trabajo/mirada.

**Lo que sigue a validar con usuarios** (no cambia la recomendación, pero conviene mirarlo): si una
persona real, parada en Servicios, toca *"Cuánto deja cada uno"* o va directo a Reportes. Si va a
Reportes sola, el atajo sobra.

---

## 6. Plan sugerido

Es la semana de la entrega y la defensa: está ordenado para que lo primero valga sólo, si no se
llega a todo. Los cuatro primeros son de una tarde.

1. **F-01** — el botón y el toast de *Anular y corregir* (chico). Es el único caso donde la plata
   desaparece sin aviso. Si hay tiempo, la versión que no anula hasta registrar (medio).
2. **Contraste** (sección 4): un gris compartido `#4a6356` en `base.css`, la tarjeta oscura del
   login, el final de los degradés y los dos badges (chico). Es lo que más gana este público.
3. **F-13** — `tabla-tarjetas` en Motivos de stock (chico).
4. **Vocabulario sólo de pantalla**: *Buscar empresas*, el rótulo del costo y la casilla de la
   compra (F-06), *Otra entrada o salida* en el tablero, *venta* en el cartel de anular (F-08) y
   *"No alcanza"* con el paso siguiente (F-16) (chico).
5. **Los números del tablero y de Movimientos**: el período arriba de los casilleros (F-03), monto
   en vez de porcentaje (F-04) y el color de Ingresos (F-05) (chico).
6. **H-16 (la decisión)**: el panel de servicios a Reportes, si el grupo está de acuerdo (chico a
   medio).
7. **F-11** — *"Anular o corregir"* y el orden de los botones del cartel (chico).
8. **Stock en el celular**: Vender y Comprar arriba y con texto en cada tarjeta, botones de 44 px
   (F-14, F-15) (medio).
9. **F-02** — el aviso al tesorero sobre la compra de mercadería (medio, *a validar*).
10. **Al backlog del año que viene**: la regla de 14 px, F-17 (tablero por rol), F-09 (verbos en la
    ficha), F-10 (localidad), F-18 a F-21.

---

## Bugs encontrados (no son de UX: van al chat de desarrollo)

- **Buscador con una letra**: aparece *"Escribí qué estás buscando (al menos 2 letras)"* **y
  debajo sigue el resultado de la búsqueda anterior** (*"No encontramos empresas…"*): dos mensajes
  que se contradicen.
- **Tablero a 375 px**: cuatro bloques (`#dashboard-charts`, `-movimientos`, `-stock`, `-matches`)
  miden 381 px; no hay scroll horizontal porque el documento lo recorta, pero quedan 6 px cortados
  del borde derecho.
- **Encabezado de dos renglones** en el tablero y en Mi empresa (107 px contra 64 en el resto):
  ver F-20; parece una regla de CSS de esas dos páginas, no una decisión.
- **Etiquetas sin `for`** en el formulario de venta y compra (F-21): los campos no tienen `id`.

## Notas para la próxima corrida

- **QA y UX al mismo tiempo**: las cookies de `localhost` **se comparten entre puertos**. Con la
  app de QA en `localhost:3000` y la de UX en `localhost:3002`, cada login de una sesión cerraba
  la de la otra. Se resolvió usando **`127.0.0.1:3002`** (otro host para el navegador). Conviene
  anotarlo en los dos prompts.
- **El script de medición** que se usó (contraste por texto, tablas, tamaños, botones) vale la pena
  guardarlo con los prompts: convierte *"se ve chico"* en un número que se puede volver a medir
  después de corregir.
- **No se reprobó en escritorio** con el mismo detalle: el contraste no depende del ancho, pero
  los tamaños de letra y la disposición en 1024+ sólo se miraron de pasada.

---

## Resultado de las correcciones (14/11/2026)

Corregido en el chat de desarrollo, siguiendo el plan de la sección 6. Lo que quedó sin hacer está
al final, con el porqué.

### Hallazgos

| | Qué se hizo |
|---|---|
| **F-01** | *Anular y corregir* **no anula nada** hasta *Guardar la corrección*: el servidor anula el viejo y crea el nuevo en un solo paso. *Cancelar* deja todo como estaba, y el formulario lo dice. Era la versión "media, mejor" de la propuesta. |
| **F-02** | Al elegir un tipo que es el destino de un motivo de venta o de compra, abajo aparece: *"Si esto es una compra de mercadería, se carga desde Stock con Registrar una compra y la plata se carga sola. Antes de seguir, fijate en la lista que no esté ya cargada."* Para todos los roles, no sólo el tesorero. |
| **F-03** | Arriba de los casilleros de Movimientos: *"Todo lo cargado hasta hoy"* o *"Del 1/11/2026 al 14/11/2026"*. |
| **F-04** | El panel dice *"El mes pasado: $ 12.000"* en vez del porcentaje. |
| **F-05** | Casilleros del panel: Entró verde, Salió rojo, Resultado azul, como Movimientos. |
| **F-06** | La casilla de la compra dice *"Desde ahora, Queso cremoso nos cuesta $ 9.000 por kg (antes $ 8.200)."*, sin mencionar el reporte. |
| **F-07** | Sin flechas en los badges del historial de Stock; en Motivos, `+ Entrada` / `− Salida`. Las flechas de *Entró / Salió* en Movimientos quedaron: ahí no hay un número con signo al lado. |
| **F-08** | El cartel dice *"¿Anular la venta de 3 unidades…? … y Agua mineral vuelve al stock"*, y tiene **Anular y corregir** (ventas y compras), con los datos de antes ya escritos (precio por unidad = monto / cantidad). |
| **F-09** | La ficha dice *"Para comprarle o consultarle, escribile o llamala: CooperApp no manda mensajes."* y tiene los botones **Escribir un email** y **Llamar**. |
| **F-10** | Localidades agrupadas por provincia (sin *"(Buenos Aires)"* repetido) y la ayuda de que la lista es parcial, en el registro y en Mi empresa. |
| **F-11** | El botón de la fila dice **Anular o corregir**; en el cartel, *Anular y corregir* va primero y lleno, *Sólo anular* después. |
| **F-12** | Contraste: ver abajo. |
| **F-13** | Motivos usa `tabla-tarjetas`: 375 px sin scroll. |
| **F-14** | En el celular, Vender y Comprar lado a lado arriba; *Otra entrada o salida* abajo; Productos y Motivos al final. El primer producto pasó del píxel 504 al 466. |
| **F-15** | En la tarjeta, **Comprar** y **Vender** con texto, y los cuatro botones de 44 px. |
| **F-16** | *"No alcanza. Si en el depósito hay más, primero cargá lo que entró (Registrar una compra, u Otra entrada o salida)."* |
| **F-17** | El panel no dibuja lo que el rol o la empresa no usan: el operador ve *reponer*, *alertas* y *buscar*. Al admin, una línea: *"Hay partes del sistema apagadas: Servicios. Las prendés en Módulos del sistema."* |
| **F-18** | Abajo del precio: *"= $ 12.500,00 por kg"*. |
| **F-19** | *"a unos 2 km"*, redondeado, en la lista y en la ficha. |
| **F-20** | Era `base.css`: le pone `width: 100%` a **todos** los botones. `#main-header button { width: auto }` en `header.css`: 64 px en el tablero y en Mi empresa. |
| **F-21** | Placeholder de la descripción según Entró/Salió · *Ver datos* con texto en *Todas* · *Volver a stock* sólo con `?desde=stock` · el rubro general una vez y los específicos adentro · etiquetas atadas a sus campos en la venta y la compra. |

### Contraste y tamaño de letra (F-12, sección 4)

- **Un solo gris de texto `#4a6356` (6,5:1)** en lugar de los seis que había (45 reemplazos, sólo
  donde eran color de texto; también las variables `--texto-suave` y `--muted`).
- **Login**: tarjeta oscura semitransparente detrás del formulario, campos blancos con texto oscuro,
  link blanco subrayado, error en amarillo. La foto queda.
- **Degradés**: las franjas terminan en `#2f8456` (antes `#3a9e65`); el botón *Ingresar*, los
  botones primarios y el avatar van de `#2d7a4f` a `#1e5c3a` (antes llegaban a `#19de75`).
- **Badges**: *Reponer* `#8a4b00`, *Anulado* `#555`, y **ninguno por debajo de 13 px** (21 reglas).
- **Botones** de la fila de Stock: 44 px. El menú del encabezado no se tocó (41 × 35).

### Vocabulario (sección 2)

Hecho: **Buscar empresas** (menú, Módulos —el nombre en `database.sql`—, títulos y ayudas; la clave
`articulacion` queda) · el costo del producto pregunta *"¿Cuánto te cuesta **comprar** un kilo?"*
y el precio dice la unidad · **Entró / Salió / Resultado** en los casilleros · en Motivos *Entra
plata / Sale plata / No mueve plata* · *Otra entrada o salida* en los tres lugares · *venta* y
*compra* en el cartel de anular · pestaña **Cuánto hay** · *"Precio por kg"* y **plurales** (*"6
bolsas"*, también en los mensajes del servidor) · *Motivos de stock* · *Categorías de
movimientos* · **Volver a la contraseña inicial** (superadmin y Usuarios, y el mensaje del servidor).

### H-16

Hecho como se recomendó: el panel salió de Movimientos, *Cuánto deja cada uno* lleva a
`reportes.html?vista=servicio`, el viejo `?ver=servicios` redirige ahí, y `GET
/movimientos/resumen-por-servicio` se sacó (Reportes usa la consulta del modelo directo). Sin
Reportes, el tesorero no ve el botón; el admin sí, y Reportes le dice que el módulo está apagado.

### Bugs del final

Buscador con una letra: se limpia el resultado anterior · tablero a 375 px: los bloques tomaban el
ancho de su contenido (`base.css` centra a los hijos de `main`) y la tabla tenía `min-width: 360px`;
ahora 375/375 · encabezado de dos renglones: F-20 · etiquetas sin `for`: F-21.

### Lo que NO se hizo, y por qué

- **Renombrar *Ajuste positivo / negativo*** a *"Corrección: había más / menos"*: el propio informe
  lo marca *a validar con usuarios*, y cambia datos sembrados que el manual y los Primeros pasos
  nombran.
- ~~**Que el operador vea lo cobrado en sus ventas** (parte de F-08)~~: **decidido por el grupo el
  14/11/2026, y hecho**: en *Entradas y salidas* cada venta o compra dice *"Cobrado: $ X"* o
  *"Pagado: $ X"*, también para el operador. Es el monto de cada operación, **nunca un total**: el
  panel, Movimientos y Reportes siguen siendo sólo de finanzas.
- **La regla de 14 px para todo dato**: se aplicó a los badges (13 px); el resto queda para el
  backlog, como el plan sugería.

**Probado**: todas las pantallas a 375 px sin nada fuera (tablero, Stock, Motivos, Mi empresa), el
encabezado de 64 px, el menú en un renglón a 1024 px con *Buscar empresas*, la vista *Por servicio*
abierta desde Servicios y desde el atajo viejo, el aviso de F-02, la ficha, el buscador, el login, y
diez pantallas en una pestaña nueva **sin errores de consola**.
