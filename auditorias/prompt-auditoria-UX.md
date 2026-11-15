# Auditoría de experiencia de usuario · CooperApp

> Prompt reusable para revisar la app desde el punto de vista de quien la usa.
> Creado el 15/09/2026, después de que el grupo probara la app y la encontrara poco intuitiva.
> Actualizado el 14/11/2026, al cerrar el cuatrimestre: lo decidido en la auditoría final y en
> la revisión de ese día, tareas nuevas (el buscador, corregir, la tablet) y, al final, el
> **guion para la prueba con una persona real**, que es lo que falta hacer.

---

## Cómo se usa

1. **Abrí un chat NUEVO**, parado en la carpeta `pp2` (así se carga solo el `CLAUDE.md`).
   Va en otro chat por lo mismo que el testeo de QA: quien programó ya sabe dónde está cada
   cosa, y eso es justamente lo que impide ver que está mal puesta.
2. **Antes de pegar el prompt, completá la sección "Lo que ya observamos"** con lo que hayan
   notado vos y el grupo. Eso vale más que cualquier heurística: es gente real usándolo.
3. **Copiá el prompt de abajo entero** y pegalo.
4. Cuando termine, **traé el informe al chat de desarrollo** para que se aplique ahí.
   El que audita no cambia: si toca la app sobre la marcha, se pierde el registro de qué
   confundía y por qué.
5. **Guardá el informe** en `cooperApp/auditorias/informes-UX/`, con el nombre
   `informe-UX-AAAA-MM-DD.md`. Va adentro del repo: es lo que le llega al grupo.
6. Anotá el resultado en el registro del final de este archivo.

**Cuándo conviene correrlo**: cada dos o tres sprints, y sí o sí antes de una entrega.
Cuanto más tarde se renombra algo, más lugares hay que tocar. Con el cuatrimestre cerrado,
antes de otra corrida de este prompt vale más la prueba con una persona real (ver el guion
al final): el chat ya marcó lo que podía marcar.

**En qué se diferencia del testeo de QA**: el de QA busca cosas que **fallan**; este busca
cosas que **funcionan pero confunden**. Un botón que hace exactamente lo que promete puede ser
un problema de UX si nadie entiende para qué está ahí. Los dos son necesarios y no se pisan.

**Lo que esto NO reemplaza**: sentar a una persona de una empresa real adelante de la app y
mirarla sin ayudarla. Un chat puede marcar candidatos y detectar incoherencias; no puede
decirte qué entiende alguien que nunca vio el sistema. Un integrante del grupo tiene contacto
con cooperativas y una fundación: esa es la prueba que vale.

---

## Lo que ya observamos

*(Completar antes de cada corrida. Esto es lo más valioso del prompt: son datos reales.)*

- **15/09/2026, prueba informal con el grupo**: la app no resultó intuitiva. De ahí salió la
  auditoría del 15/09, con 26 hallazgos.
- Lo que se notó y **ya se corrigió** (ver abajo la lista de lo decidido): la palabra
  "categorías" significaba dos cosas, "movimientos" también, y la configuración vivía escondida
  abajo del nombre del usuario.
- **14/11/2026, revisión con capturas de todas las pantallas** (no con personas): las
  pantallas parecían de dos programas distintos (dos letras, tres verdes, márgenes
  distintos), la tablet cortaba las tablas, muchos botones eran sólo un ícono, y las ventanas
  se cerraban al tocar afuera. Se corrigió todo (ver lo decidido).
- *(agregar acá lo que vayan notando: dónde se trabaron, qué buscaron y no encontraron,
  qué botón apretaron esperando otra cosa)*

### Lo que ya está decidido: NO lo reportes de nuevo

Esto se auditó, se discutió en grupo y ya está aplicado. Volver a proponerlo gasta lugar en el
informe. Lo que sí sirve es decir si la solución **no alcanzó**, con el recorrido que lo muestre.

- **El vocabulario se unificó (HU-84, 16/09).** Dos palabras para dos ideas: **Anular** un
  movimiento ya registrado —plata o stock, no se deshace— y **Dar de baja / Reactivar** todo lo
  demás, que sí se deshace. Un ícono para cada una y una sola forma de escribir el estado
  (*Anulado*, *Activo*, *De baja*). Los **módulos** son la excepción a propósito: ahí se sigue
  diciendo *activar* y *desactivar*, porque un interruptor no es dar de baja un registro.
- **"Naturaleza" desapareció de la vista**: ahora son dos botones, *Entró* y *Salió*, bajo la
  pregunta *"¿Qué pasó con la plata?"*.
- **Las pantallas de categorías tienen apellido**: *Categorías de movimientos* y *Categorías de
  productos* (y ahora *de servicios*).
- **Toda la configuración está junta (HU-86)**, en un desplegable del menú principal visible
  sólo para el admin. En el menú del avatar quedaron sólo *Mi empresa* y *Cerrar sesión*.
- **Los listados entran en el celular y en la tablet (HU-85)**: por debajo de 1024 px cada fila
  es una tarjeta (hasta el 14/11 el corte era 768 y en una tablet las tablas se cortaban).
  Hay una hoja compartida, `styles/tabla-mobile.css`. Si encontrás una tabla que **no** la use
  y se corte, eso sí reportalo: es el error que se repite.
- **La matrícula se sacó del sistema** (era del mundo cooperativo). La federación se quedó,
  rotulada *"Cámara o federación a la que pertenece"*, y siempre fue opcional.
- **Un reporte no es el listado de Movimientos con fechas.** El listado es la pantalla de
  trabajo (se carga, se corrige, se anula, lo último arriba); el reporte se mira, se imprime y
  se manda: sin botones de acción, en orden cronológico y sin lo anulado. Que sean dos
  pantallas es a propósito.
- **Las pérdidas valorizadas no se suman al balance**, y los casilleros del período se esconden
  en esa vista para no invitar a restarlos. Lo que sí vale reportar es si el aviso **no
  alcanza** para que se entienda.
- **El costo de un producto es opcional y vacío significa "no lo sé"**, no cero. Un 0 escrito a
  mano se rechaza a propósito.
- **Los tres atajos de período** (este mes, el mes pasado, este año) existen para no tener que
  armar dos fechas a mano. *Otras fechas* queda para el caso raro.
- **Un servicio no pregunta unidad de medida ni stock mínimo**: no se guarda en ningún lado.
- **El servicio de un movimiento es opcional y va último** en el formulario: la mayoría de los
  movimientos (la luz, el alquiler, un sueldo) no salen de ningún servicio. La pregunta es
  *"¿Este movimiento es de algún servicio?"*.
- **La categoría de dinero de la luz y el gas es "Gastos fijos", no "Servicios"** (28/09):
  *Servicios* es el nombre de un módulo, y la categoría y el servicio de un movimiento no pueden
  llamarse igual. Vale también para la siembra de las empresas nuevas.
- **Los servicios se comparan por bloque, no en un ranking único** (28/09): un bloque por
  categoría del servicio (*Los que ofrecemos*, *Los que contratamos*), con lo que deja cada uno.
  Lo que se contrata no compite con lo que se vende.
- **Los filtros van plegados detrás de un botón en el celular** (28/09): hay un patrón
  compartido, `components/filtros-plegables.js` + `styles/filtros-plegables.css`. Igual que con
  las tablas: si encontrás una caja de filtros que **no** lo use y se coma la pantalla, eso sí
  reportalo.
- **Los atajos de período también están en Movimientos** (28/09), con las mismas fechas que
  Reportes.
- **El aviso *"Sin registrar el cobro"* del historial de stock no lo ve el operador** (28/09):
  no puede resolverlo. Lo cobrado, en cambio, lo ven todos (ver abajo).

**Resuelto en la auditoría final (14/11/2026)**: *cuánto deja cada servicio* vive **sólo en
Reportes**, vista *Por servicio* (H-16); el módulo se llama **Buscar empresas** en todo lo que se
ve; los casilleros dicen **Entró / Salió / Resultado**; *Anular y corregir* no anula nada hasta
guardar; el gris de texto es uno solo (`#4a6356`, 6,5:1) y ningún badge baja de 13 px.

**Decidido por el grupo (14/11/2026)**: el operador **ve lo cobrado o pagado en cada venta o compra**
(en *Entradas y salidas*), pero **ningún total de la empresa**: ni los casilleros del panel, ni
Movimientos, ni Reportes. No lo reportes como falta de información.

**Aplicado en la revisión del 14/11/2026** (bitácora de CLAUDE.md, (13) a (15)):
- **Una sola hoja de estilos para todo** (`styles/comun.css`): una letra, un verde, la misma
  franja de título y los mismos márgenes. **Si una pantalla se ve distinta de las demás, eso sí
  reportalo**: es una regresión, no una elección.
- *Plata que entra / Plata que sale* en Categorías de movimientos y en Motivos de stock (ya no
  *ingresos / egresos*); *Entró plata / Salió plata* en las acciones rápidas del panel.
- Las ventanas con formulario **no se cierran al tocar afuera**: sólo con *Cancelar* o la X.
- Botones con texto donde eran sólo un ícono (Usuarios, el historial de Stock, Comprar y
  Vender en cada producto). Los íconos sueltos que quedan son de pantallas de configuración.
- *Reponer* aparece al **llegar** al stock mínimo, y así lo dice el formulario.
- Lo que se cuenta (unidades, cajas, paquetes, bolsas) no acepta medias.
- Sin sesión, al login; con la contraseña inicial, a elegir una propia.
- Productos y Servicios son la **misma pantalla**, que muestra lo de cada uno: si algo de
  Productos aparece en Servicios (o al revés), eso sí reportalo.

- Desde el 15/11 (auditoría de la entrega): el panel tiene franja con saludo y los meses por
  nombre; el menú marca la pantalla actual; *Anular o corregir* en las ventas y compras de
  Stock; *Historial* con texto y atajos de período; cada rol dice qué hace; un solo aviso de
  *No alcanza*; *Por producto* explica que no es toda la plata; en la tablet las tarjetas van de
  a dos y los botones de la franja debajo del título.
- Desde la segunda vuelta (15/11, `57627ad`): *Por producto* con **Vendido / Comprado**;
  corregir es el mismo cartel en Stock y en Movimientos (**Corregir** en verde, **Anular** en
  rojo) y vale también para roturas y ajustes; el panel compara contra los mismos días; *Se
  olvidó la contraseña*; *Entendido, se lo pido* para el tesorero; el aviso de módulos
  apagados se puede cerrar. **Un servicio creado hoy sigue apareciendo en reportes de meses
  anteriores**: no hay fecha de alta, ya está anotado.

**Lo que sigue abierto a propósito** (anotado en el informe final): renombrar *Ajuste positivo /
negativo* (*a validar con usuarios*) y la regla de 14 px para todo dato (backlog). Si los ves,
sumá lo que observes, no los vuelvas a describir.

---

## El prompt

````text
Quiero que audites la experiencia de usuario de este proyecto. Ya leíste
CLAUDE.md, que tiene el contexto completo: leelo antes de empezar, con
atención a la sección 2 (el producto) y a la 3 (qué está implementado).

## Tu objetivo

Encontrar todo lo que funciona pero confunde, cansa o hace dudar a quien usa
la app. No busques errores: de eso se ocupa el testeo de QA, que se corre
aparte. Acá el foco es otro.

La pregunta que guía todo es: ¿una persona que no es de sistemas puede hacer
su trabajo con esto sin que alguien le explique al lado?

## Quiénes lo usan (esto define qué es grave)

- Personas de 35 a 55 años, de oficio, con BAJA experiencia digital. No son
  usuarios de software: son panaderos, costureras, soldadores.
- La ventaja competitiva de este producto es la SIMPLICIDAD, no la cantidad de
  funciones. Frente a un ERP, lo único que este sistema puede ofrecer es que
  se entienda. Si no se entiende, no tiene razón de existir.
- Se usa también desde el celular.
- Cuatro roles, y cada uno ve un sistema distinto:
  · admin_empresa → configura todo y además opera
  · tesorero → sólo la plata
  · operador → sólo el depósito (catálogo y stock)
  · superadmin → sólo aprobar empresas, no pertenece a ninguna

Un operador de depósito y un tesorero no tienen por qué entender el sistema
completo: cada uno tiene que entender SU parte. Evaluá cada rol por separado.

## Regla más importante: NO CAMBIES NADA

Tu trabajo es observar y proponer, no modificar. No toques código, ni HTML, ni
CSS, ni textos. Si ves algo urgente, anotalo y seguí.

Podés crear datos de prueba para recorrer la app, siempre que al final dejes
la base como la encontraste (se resetea con datos_de_prueba.sql).

## Método: usá la app, no leas el código

Leer el código te dice cómo está armado. Usarlo te dice cómo se siente. Abrí
el navegador y HACÉ las tareas, con cada rol, de principio a fin.

Las credenciales de todos los usuarios están en "usuario de prueba.txt".

Para cada tarea, registrá:
- Cuántos clicks y cuántas pantallas hicieron falta.
- En qué momento tuviste que parar a pensar dónde ir.
- Qué palabra de la pantalla no dice lo que la persona tiene en la cabeza.
- Qué dato te pidió el sistema que la persona no tiene a mano en ese momento.

Si una tarea la resolviste porque YA SABÍAS dónde estaba (por haber leído el
código o el CLAUDE.md), marcalo: eso es exactamente lo que el usuario real no
va a saber.

## Las tareas a recorrer

Hacelas como si fueras esa persona, no como quien conoce el sistema.

COMO OPERADOR (silvia@laesperanza.com.ar)
1. "Llegaron 20 kg de queso, cargalos."
2. "¿De qué nos estamos quedando sin stock?"
3. "¿Qué pasó con el queso este mes? ¿Por qué quedan tan pocos?"
4. "Se rompieron 3 cajas, sacalas del sistema."
5. "Me equivoqué en la carga de recién, arreglalo."
6. "Agregá un producto nuevo que empezamos a vender."

COMO TESORERO (roberto@laesperanza.com.ar)
7. "Pagamos la luz, cargalo."
8. "¿Cómo venimos este mes comparado con el anterior?"
9. "Cargué mal un movimiento ayer, corregilo."

COMO ADMIN (marta@laesperanza.com.ar)
10. "Entrá por primera vez y dejá el sistema listo para que tu equipo trabaje."
11. "Dá de alta a alguien del depósito."
12. "Quiero que el sistema me avise cuando queden menos de 10 kg de algo."
13. "Vendimos mercadería: quiero que quede registrada la venta Y la plata." (Desde el
    25/10 es un solo formulario: *Registrar una venta*. ¿Se encuentra desde el panel y desde
    Stock? ¿Queda claro que la plata ya quedó cargada?)
14. "Nunca vamos a usar productos, sacalo de en medio."

SERVICIOS — usá Metalúrgica del Oeste, que es la única empresa que lo tiene
prendido: osvaldo@metaloeste.com.ar (admin) y daniel@metaloeste.com.ar (tesorero)
15. Como admin: "Empezamos a ofrecer pintura de portones, cargalo."
16. Como tesorero: "Cobramos un trabajo de soldadura, cargá la plata y dejá
    anotado que vino de ahí."
17. Como tesorero: "¿Cuál de los servicios que ofrecemos nos conviene sostener?"
    La respuesta vive en Reportes, vista *Por servicio*, y desde Servicios hay un
    botón *"Cuánto deja cada uno"* que lleva ahí. ¿Se llega sin saberlo? ¿Se
    entiende el número?
18. Como tesorero: "¿Cuánto nos dejó la soldadura el mes pasado?"
19. Como admin: "Dejamos de ofrecer un servicio." ¿Qué pasa con la plata que ya
    había generado? ¿Queda claro que no se borra?
20. Un servicio es un producto sin stock, y desde el 14/11 son la misma pantalla.
    Mirá Productos y Servicios uno después del otro: ¿se distinguen? ¿O alguien
    puede creer que está en una estando en la otra?
21. Como admin: "Me equivoqué en el monto de un movimiento de ayer, arreglalo."
    Y lo mismo con una venta de Stock. *Anular y corregir* abre el formulario con
    los datos de antes y no anula nada hasta guardar: ¿se entiende que si cancelás
    no pasó nada? ¿Y por qué la plata de una venta no se corrige desde Movimientos?

REPORTES — es el que MÁS se lee y menos se toca.
Todo lo demás del sistema se usa para cargar; esto se usa para entender. Un
número que no se entiende no sirve aunque esté bien calculado.
22. Como Marta: "Quiero ver cómo nos fue este mes." ¿Llegás? ¿En cuántos pasos?
23. "¿En qué se nos está yendo la plata?" — hay cuatro maneras de mirar el
    mismo período. ¿Se entiende que son el mismo dinero agrupado distinto, o
    parecen cuatro reportes que no cierran entre sí?
24. "Mandale esto al contador." Bajá el CSV y el PDF. **Abrí el CSV con Excel
    de verdad**, no lo mires en el editor. ¿Se entiende el archivo solo, sin la
    app al lado? ¿Sabés de qué empresa y de qué período es?
25. "¿Cuánta plata se nos va en roturas?" — la vista *Lo que se perdió*.
    **La pregunta clave: ¿queda claro que esa plata NO está en los egresos?**
    La pantalla lo explica con un aviso; evaluá si alcanza, o si alguien igual
    va a intentar restar ese número del balance.
26. En esa misma vista, mirá "Bolsa de pan": dice **"No se sabe"** en vez de
    $0, porque no tiene costo cargado. ¿Se entiende por qué, y qué hacer?
27. Como Marta, en Productos, editá un producto: están *"Precio de venta"* y
    *"¿Cuánto te cuesta comprar un kilo?"* (la pregunta dice la unidad). ¿Se
    entiende cuál es cuál? ¿Y que dejarlos vacíos es una respuesta válida?
28. Como Silvia (operador): entrá a Reportes. ¿El mensaje te deja claro por qué
    no podés y a quién pedirle?

COMO EMPRESA NUEVA (aprobá Huerta Norte desde el superadmin y entrá con su admin)
29. Los primeros cinco minutos: todo vacío. ¿La app te dice qué hacer primero,
    o te deja solo frente a pantallas en blanco?
30. Entrá a Reportes con la empresa recién aprobada: todavía no cargó nada.
    ¿El reporte vacío explica qué va a aparecer ahí, o es una hoja en blanco
    con tres ceros?

BUSCAR EMPRESAS — el único lugar donde una empresa ve a otra
31. Como Silvia: "Necesitamos cajas de cartón. ¿Quién cerca las vende?" Buscá,
    elegí una y averiguá cómo contactarla. ¿Queda claro que CooperApp no manda
    mensajes y que hay que escribirle o llamarla?
32. Como Marta: "Quiero que otras empresas vean que vendemos queso." ¿Encontrás
    dónde se marca? ¿Y cómo ve tu ficha otra empresa?
33. ¿Se entiende que la distancia es aproximada (entre localidades, no entre
    direcciones)?

COMO SUPERADMIN (superadmin@cooperapp.com)
34. "Hay una empresa esperando aprobación: revisala y aprobala."
35. "Al administrador de El Amanecer se le olvidó la contraseña."

EN UNA TABLET (800 px de ancho)
36. Repetí la 2, la 8 y la 13. ¿Algo queda incómodo o lejos? Desde el 15/11 las
    tarjetas van de a dos en la tablet: ¿se lee mejor o se amontona?

LO QUE SE CAMBIÓ EL 15/11 SIGUIENDO LA AUDITORÍA DE LA ENTREGA
Varias cosas se hicieron con la propuesta del informe anterior y quedaron marcadas
*a validar*. No las des por buenas: fijate si **resolvieron** lo que se reportó.
37. Como Roberto (tesorero): "La venta de milanesas se cargó a un precio mal,
    arreglalo." ¿Entendés qué hacer y a quién pedírselo?
38. Como Marta, en Reportes → *Por producto*: "¿Qué producto me conviene?" ¿La nota
    de arriba alcanza para no leer el negativo del queso como una pérdida? ¿*Resultado*
    es la columna correcta, o *Vendido / Comprado* contestaría mejor?
39. Como Daniel (tesorero de Metalúrgica): "Cobramos un trabajo de soldadura." ¿La
    pista que aparece arriba del campo del servicio ayuda o molesta?
40. En el panel: "¿Cómo venimos este mes?" ¿Se entiende *"Octubre entero"* contra un
    mes que va por la mitad?
41. Como Marta: "Sacá Productos de en medio." ¿El cartel con los nombres de los
    operadores se entiende? ¿Asusta de más?
42. Abrí el PDF de *Lo que se perdió* suelto, sin la app: ¿el recuadro alcanza para no
    restarlo del balance?

LO QUE SE CAMBIÓ EN LA SEGUNDA VUELTA (15/11, `57627ad`)
De nuevo: no lo des por bueno, fijate si resolvió lo que reportó la vuelta anterior
(`informes-UX/informe-UX-entrega-2.md`).
43. Como Silvia: "Cargué la rotura de recién con 3 y eran 4, arreglalo." (antes no se podía
    corregir, sólo anular.)
44. Como Marta, en *Por producto*: "¿Qué producto me conviene?" ¿*Vendido / Comprado* sin
    restar contesta la pregunta, o ahora falta algo?
45. En el panel, a mitad de mes: "¿Cómo venimos?" ¿Se entiende *"Del 1 al 15 de octubre"*
    contra el mes que va?
46. Como Marta: "Jorge se olvidó la contraseña." ¿Encontrás el botón y sabés qué decirle?
47. Como Marta, en Stock: una compra vieja dice *"Sin registrar el pago"*. Completala. ¿Tuviste
    que hacer alguna cuenta de cabeza?

## Qué mirar, más allá de las tareas

VOCABULARIO
La ronda grande ya se hizo (HU-84, ver arriba lo decidido). Ahora el trabajo es
otro: **verificar que el vocabulario decidido se haya respetado en todo**, y
buscar lo que quedó afuera.
- Recorré todas las pantallas y fijate si usan las palabras que se decidieron
  (*Entró / Salió*, *Plata que entra / sale*, *Anular*, *Dar de baja /
  Reactivar*, *Buscar empresas*) o si volvieron a aparecer las viejas.
- **Mirá también los mensajes del servidor, no sólo los botones.** El toast
  muestra lo que contesta la API: ya pasó de tener el botón renombrado y la
  respuesta diciendo lo de antes. Se ve mejor por `curl` que en la pantalla,
  donde el toast pasa y se va.
- Buscá las palabras que quedan sin revisar: "efecto", "módulo", "existencia",
  "naturaleza" (sigue en la API y en la base, ¿se filtra a alguna pantalla?),
  y las etiquetas nuevas de Servicios.
- ¿Alguna palabra significa dos cosas? (La categoría de la luz y el gas ya se
  llama *Gastos fijos*, para no chocar con el módulo *Servicios*.)

Para cada una proponé un nombre y explicá por qué. Importa que la propuesta
distinga sin alargar: "Categorías de productos" y "Categorías de movimientos"
resuelve la ambigüedad pero son etiquetas largas para un menú de celular.

NAVEGACIÓN Y ARQUITECTURA
- ¿Dónde vive cada cosa y por qué ahí? La configuración ya se agrupó en el menú
  principal (HU-86): lo que hay que mirar ahora es si **se encuentra**, y si el
  desplegable no quedó demasiado largo al sumarle Servicios.
- *"Cuánto deja cada servicio"* se decidió que viva sólo en Reportes (H-16), con un
  botón desde Servicios. Lo que vale mirar es si **se encuentra** sin saberlo.
- ¿El menú principal refleja cómo la persona piensa su trabajo, o cómo está
  organizado el código?
- ¿Cuántos clicks cuesta lo que se hace todos los días, contra lo que se hace
  una vez por año?
- ¿Se puede volver? ¿Se sabe dónde está uno parado?

LO QUE PASA CUANDO ALGO SALE MAL
- Cada mensaje de error: ¿dice qué pasó, por qué, y qué hacer ahora?
- ¿Alguno culpa al usuario o usa palabras del sistema?
- Cuando falta un permiso o un módulo, ¿queda claro a quién pedirle qué?

PANTALLAS VACÍAS
- Cada listado sin datos: ¿explica qué va a aparecer ahí y cómo cargar lo
  primero, o es un cartel gris que no ayuda?

FORMULARIOS
- ¿Qué campos son obligatorios y se entiende por qué?
- ¿Hay campos que el usuario no sabe cómo completar? (la matrícula ya se sacó;
  buscá los que queden)
- ¿Los valores por defecto ahorran trabajo o hay que corregirlos siempre?
- ¿Se puede deshacer? ¿Avisa antes de algo irreversible?
- Campos **opcionales**: ¿se entiende que se pueden dejar vacíos, o parecen
  obligatorios y frenan a alguien que no sabe qué poner? (la subcategoría de un
  producto y el servicio de un movimiento son los dos casos que hay)

NÚMEROS QUE HAY QUE INTERPRETAR
El sistema ya muestra cuentas, no sólo datos cargados. Mirá cada una como quien
no sabe de dónde salió:
- El balance del mes y su comparación con el anterior.
- La existencia de un producto (que no está guardada, se calcula).
- "Cuánto deja cada servicio". ¿Se entiende qué es "Deja"? ¿Y un número
  negativo? ¿Y un cero, que puede significar "no movió nada" o "empató"?
- ¿Queda claro **de qué período** habla cada número que está en pantalla?
- Cuando dos números de la misma pantalla no coinciden porque miran cosas
  distintas, ¿se explica, o parece que el sistema se equivocó?
- **El caso más difícil del sistema hoy**: las pérdidas valorizadas NO están en
  los egresos del balance, a propósito. Son dos números grandes de plata en la
  misma app que **no suman entre sí y está bien que no sumen**. Hay un aviso
  que lo explica y los casilleros del período se esconden en esa vista.
  ¿Alcanza? ¿O alguien va a intentar restarlos igual? Esto es lo que más vale
  la pena mirar con alguien real adelante.
- **"No se sabe" contra "$0"**: un producto sin costo cargado no vale cero, no
  se sabe cuánto vale, y el reporte lo dice así. ¿Se entiende la diferencia, o
  se lee como que el sistema no calculó bien?
- Los avisos de lo que **queda afuera** de un número (los movimientos anulados,
  las salidas sin valorizar): ¿se leen como una explicación o como un error?
- **Un archivo descargado se lee sin la app al lado.** Abrí el CSV y el PDF
  como los va a abrir el contador: ¿se entiende de qué empresa, de qué período
  y qué queda afuera de cada total?

CONSISTENCIA
- La misma acción, ¿se hace igual en todas las pantallas? (íconos, colores,
  posición de los botones, si abre modal o cambia de página)
- Los estados (activo, anulado, de baja): ¿se muestran siempre de la misma
  forma? Esto se unificó en HU-84: lo que hay que buscar es dónde **no** se
  respetó, sobre todo en las pantallas nuevas.
- Productos y Servicios son casi la misma pantalla. ¿Las diferencias que tienen
  están donde corresponde, o hay una que quedó distinta porque sí?

CELULAR (375 px) Y TABLET (800 px)
- ¿Qué se rompe, qué queda lejos del pulgar, qué obliga a hacer zoom?
- **Medí cada tabla**, no la mires nomás: `document.querySelector('table').scrollWidth`
  contra `window.innerWidth`. Ya pasó dos veces que una tabla que parecía corta
  se cortara justo en la columna que uno vino a mirar, y la barra para arrastrar
  está abajo de todo, así que uno se entera al final.
- ¿Cuánto espacio hay que recorrer antes de ver el primer dato? (encabezado +
  título + filtros).
- Hasta 1023 px la app se ve como en el celular (menú desplegable, tablas como
  tarjetas). Mirá si en 800 px eso se siente bien o desaprovecha la pantalla.

## Restricciones (respetalas al proponer)

- Todo corre en LOCAL. Nada de servicios externos.
- HTML, CSS y JS planos, con Bootstrap 5 y FontAwesome por CDN. NO propongas
  React, Vue, Tailwind ni ningún framework nuevo.
- Respetá el patrón MVC que ya tiene el proyecto.
- Los módulos del cuatrimestre están terminados y el proyecto lo continúa otro
  equipo el año próximo: lo que propongas va al backlog para ellos. Una
  propuesta que implique rehacer todo no sirve, por buena que sea; marcá bien
  cuánto cuesta cada cosa.
- Si un cambio obliga a tocar la base de datos (renombrar una tabla o una
  columna), decilo explícitamente: eso obliga a todo el grupo a recrearla y
  pesa en la decisión.

## Entregable

Un informe con estas cuatro partes:

1. RESUMEN EJECUTIVO (media carilla)
   Los tres problemas más grandes, en lenguaje llano. Si el grupo lee sólo
   esto, tiene que quedarse con lo importante.

2. PROPUESTA DE VOCABULARIO
   Una tabla: término actual | dónde aparece | problema | término propuesto |
   qué hay que tocar (sólo pantalla / también código / también base de datos).
   Ordenada por cuánto confunde hoy, no por cuánto cuesta arreglarla.

3. HALLAZGOS, ordenados por severidad
   Para cada uno:
   - Qué confunde, en una frase.
   - Dónde pasa (pantalla y rol).
   - Por qué confunde a ESTE usuario (no "a un usuario" en abstracto).
   - Qué proponés, concreto. Si es un texto, escribí el texto nuevo.
   - Cuánto cuesta: chico (un texto o un ícono) / medio (reordenar una
     pantalla) / grande (mover cosas de lugar en varias pantallas).

   Severidades, en términos de experiencia:
   - BLOQUEA: la persona no puede terminar su tarea sin que alguien le explique.
   - HACE PERDER TIEMPO: la termina, pero por el camino largo o después de
     equivocarse.
   - GENERA DUDA: la termina, pero no está segura de haber hecho lo correcto.
     (Ojo: en un sistema que maneja plata y stock, la duda es cara.)
   - MOLESTA: cosmético o de pulido.

4. PLAN SUGERIDO
   Qué conviene hacer primero (antes de sumar módulos nuevos, como RRHH, porque
   cada pantalla que se suma multiplica el costo de renombrar), qué conviene
   validar antes con una persona real, y qué puede esperar. Máximo 10 ítems,
   ordenados.

Sé concreto y honesto: si algo te parece un problema pero no estás seguro de
que lo sea para el usuario real, marcalo como "a validar con usuarios" en vez
de afirmarlo. Y si algo está bien resuelto, decilo: sirve para no romperlo
después.

## Qué NO hacer

- No propongas funcionalidades nuevas: esto es sobre lo que ya existe.
- No propongas rediseños visuales completos ni cambios de paleta. El verde
  institucional y el estilo general se quedan.
- No reportes bugs: si encontrás uno, anotalo aparte en una línea al final y
  seguí con lo tuyo.
- No digas "mejorar la usabilidad" sin decir exactamente qué cambiar.

## Para arrancar

Levantá MariaDB de XAMPP, recreá la base desde cero con los dos .sql y poné la
app a andar: `npm install` y después `npm start` desde cooperApp/
(`node_modules` no viaja en el repo). Si manejás Edge sin ventana, usá un puerto de
depuración propio: el 14/11 QA y UX usaron el mismo y uno le manejaba el navegador al otro.
Si ya hay otra copia de la app andando
(otra base y otro puerto), entrá por `127.0.0.1`: las cookies de `localhost` se
comparten entre puertos y una sesión pisa a la otra.

Para mirar todas las pantallas de un vistazo hay capturas recientes en
`cooperApp/capturas-pantalla/`, y el script que las saca está en
`pp2/scripts-capturas/`. Sirven para comparar pantallas entre sí; no
reemplazan usar la app.

Después abrí el navegador y empezá por el operador, que es el rol más acotado y
el que más claro deja si la app se entiende sin conocer el resto del sistema.

Y para los reportes, cambiá de sombrero: ahí no estás cargando datos, estás
tratando de entender un número que alguien más calculó. Es la única parte del
sistema que se usa para decidir, no para registrar.
````

---

## Qué hacer con el informe

1. **Separá lo que es opinión de lo que es evidencia.** Si el informe dice "esto confunde"
   sin un recorrido que lo muestre, es una hipótesis: anotala para validar con gente real.
2. **Lo que se va a duplicar, se arregla antes de duplicarlo.** Es lo que enseñó la auditoría
   del 15/09: tres historias que estaban planificadas para el Sprint 13 arreglaban justo lo que
   el módulo siguiente iba a copiar, así que se adelantaron. Antes de mandar algo al final,
   preguntate si lo que viene después lo copia.
3. **Decidí en grupo los nombres.** Un renombre no es una decisión técnica: si el equipo no
   está de acuerdo, el nombre nuevo no se sostiene en la documentación ni en la defensa.
4. **Si el arreglo es un patrón, escribilo una vez.** `tabla-mobile.css` salió así: una hoja
   compartida en vez de corregir cinco pantallas. Las que vinieron después la heredaron gratis.
5. **Lo que no se aplica, al backlog.** En `datos.py`, dentro de la épica E10 (Calidad, UX y
   Documentación). Ese script vive en `pp2/scripts-backlog/`, fuera del repo.
6. **Anotalo en el registro de acá abajo**, y sumá a "Lo que ya está decidido" lo que se haya
   aplicado, para que la próxima corrida no lo vuelva a reportar.

---

## Registro de auditorías

| Fecha | Al cerrar | Hallazgos | Qué se aplicó |
|---|---|---|---|
| 15/09/2026 | Sprint 08 | 26 hallazgos (4 bloquean, 8 hacen perder tiempo, 8 generan duda, 6 molestan) + 16 términos a renombrar + 3 bugs. Informe en `informes-UX/informe-UX-2026-09-15.md` | **16/09**: los 4 que bloquean (H-01 a H-04) + se sacó la matrícula del sistema + el largo mínimo de contraseña + 1 bug encontrado al corregir. El resto, al backlog: HU-84 a HU-88 en el Sprint 13. El vocabulario queda para decidir en grupo. Detalle al final del informe |
| 16/09/2026 | *(sin auditoría nueva: se aplicó lo pendiente de la anterior)* | — | **HU-84** (vocabulario, decidido por el grupo), **HU-85** (listados como tarjetas en el celular, con hoja compartida) y **HU-86** (configuración agrupada en el menú principal). Las tres estaban planificadas para el Sprint 13 y se adelantaron al 09, porque arreglaban justo lo que el módulo de Servicios iba a duplicar |
| 28/09/2026 | **Sprints 09 y 10 juntos** (Servicios completo · Reportes completo) | 17 hallazgos (2 bloquean, 4 hacen perder tiempo, 8 generan duda, 3 molestan) + 9 términos + 3 bugs. Informe en `informes-UX/informe-UX-2026-09-28.md` | **28/09: el plan entero**, incluido lo que se sugería dejar para el Sprint 13, menos H-16 (a validar con usuarios). Encontrado al corregir: la categoría de dinero "Servicios" venía en la **siembra de toda empresa nueva**, no sólo en la demo. Dos patrones compartidos nuevos: `filtros-plegables` (Stock pasó de 653 a 404 px para el primer dato) y los bloques por categoría en el ranking de servicios. Detalle al final del informe. Lo verificado que **sí** alcanzó: HU-84 (también en los mensajes del servidor), HU-85 (ninguna tabla se corta a 375 px, lo nuevo lo heredó gratis), HU-86 y los módulos sin pantalla. Lo grueso ahora está **en los archivos que salen**, no en las pantallas |
| 14/11/2026 | **Sprint 13, auditoría final** (HU-64). Foco en lo nunca auditado: venta y compra en un paso, buscador y ficha de empresas, superadmin rehecho, Primeros pasos y vacíos (HU-88), alta con un desplegable y *Anular y corregir* (HU-87) | 21 hallazgos, numerados **F-01 a F-21** (0 bloquean, 11 generan duda, 6 hacen perder tiempo, 4 molestan) + 12 términos + tabla de contraste medida texto por texto + 4 bugs + **recomendación sobre H-16: una sola puerta, en Reportes**. Informe en `informes-UX/informe-UX-final.md`. Lo más grave: *Anular y corregir* + *Cancelar* deja la plata anulada sin aviso (F-01); el login entre 1,9 y 2,8 : 1 y seis grises distintos por debajo de 4,5 : 1; la tabla de Motivos de stock no entra a 375 px (606 en 343). Corrida en una copia aparte (`cooperApp_ux`, puerto 3002) porque QA usaba la base y el puerto de siempre: **las cookies de `localhost` se comparten entre puertos**, hay que usar `127.0.0.1` | **14/11: los 21 corregidos**, más el contraste, el vocabulario y H-16 (una sola puerta, en Reportes). Afuera a propósito: *Ajuste positivo/negativo* (a validar con usuarios) y la regla de 14 px. Ese mismo día, una revisión visual con capturas de todas las pantallas unificó los estilos (`comun.css`) y la tablet. Detalle al final del informe |
| 14/11/2026 (noche) | **Entrega, de punta a punta**, después de la revisión del 14/11 (`453f870`: `comun.css`, tablet, botones con texto, Productos y Servicios en una página). Las 36 tareas con siete usuarios, 54 pantallas medidas a 1280, 800 y 375 px con un script, el CSV abierto en Excel por COM y el PDF | 29 hallazgos, numerados **E-01 a E-29** (1 bloquea, 15 generan duda, 5 hacen perder tiempo, 8 molestan) + 11 términos + 0 bugs. Informe en `informes-UX/informe-UX-entrega.md`. Lo más grave: el tesorero no puede corregir la plata de una venta y el cartel lo manda a Stock, que no tiene (E-01); *Por producto* dice ser "la misma plata" y no cierra con los casilleros, y un producto comprado y no vendido aparece con resultado negativo (E-02); en Stock corregir está detrás de "Anular" (E-03); el Panel a 800 px corta sus dos tablas y la franja de Servicios mide 263 px (E-17). Ninguna pantalla con scroll de costado. Corrida en `cooperApp_ux` / puerto 3002; **ojo: el puerto de depuración de Edge (9341) chocó con el de QA**, usar uno propio | **15/11: los 29 y el vocabulario, corregidos**. Los *a validar* (E-02 la columna *Resultado*, E-06, E-08 el gris, E-09 la comparación, E-11, E-28 las tarjetas de a dos) se hicieron con la propuesta del informe: son lo primero para llevar a la prueba con una persona real. Detalle al final del informe |
| 15/11/2026 | **Entrega, segunda pasada**, sobre `56e4bc6` (las correcciones de la auditoría de la entrega). Las 42 tareas (con las nuevas 37 a 42, que miran si lo corregido resolvió lo reportado) con siete usuarios, 93 mediciones (31 pantallas × 1280, 800 y 375 px), el CSV abierto en Excel por COM y el PDF mirado como imagen | 22 hallazgos, numerados **G-01 a G-22** (0 bloquean, 11 generan duda, 4 hacen perder tiempo, 7 molestan) + 11 términos + 1 bug. Informe en `informes-UX/informe-UX-entrega-2.md`. **Alcanzaron**: E-01, E-05, E-07, E-08 en el PDF, E-10 a E-13, E-15 a E-21, E-25, E-28 (las tarjetas de a dos se leen bien). **No alcanzaron**: E-02 (*Por producto* sigue poniendo al más vendido último y en rojo; *Vendido / Comprado* contestaría mejor) y, en pantalla, E-08: en *Lo que se perdió* la nota de arriba queda la de la vista anterior y dice *"Son la misma plata del período"* (G-01). Además: corregir sigue distinto entre Stock y Movimientos, y lo de *Otra entrada o salida* no se corrige (G-04, G-05); al corregir una venta la ayuda dice que el precio es el del producto (G-03). Ninguna pantalla con scroll de costado. Corrida en `cooperApp_ux` / puerto 3002 / Edge en el 9377, sin choques con QA | **15/11: los 22 y el vocabulario, corregidos**, menos el servicio creado hoy en el reporte de octubre (no hay fecha de alta: cambio de esquema). Detalle al final del informe |
| 15/11/2026 (2) | **Entrega, tercera pasada**, sobre `57627ad` (las correcciones de la segunda). Las 47 tareas (con las nuevas 43 a 47) con siete usuarios, 99 mediciones (33 pantallas × 1280, 800 y 375 px), el CSV abierto en Excel por COM y los PDF mirados como imagen | 20 hallazgos, numerados **H3-01 a H3-20** (0 bloquean, 6 generan duda, 3 hacen perder tiempo, 11 molestan) + 12 términos + 0 bugs. Informe en `informes-UX/informe-UX-entrega-3.md`. **Alcanzaron**: G-01, G-03 a G-05 (tarea 43: corregir una rotura anda), G-07 (tarea 45), G-08 a G-14 (tareas 46 y 47 sin cuentas de cabeza), G-16 a G-19, G-21. **No alcanzaron del todo**: G-02 (lo de *Por producto* no llegó a *Por servicio*, que sigue con los casilleros del período sobre una tabla que no los suma; y *Vendido / Comprado* lado a lado se restan igual de cabeza), G-06 (el texto nombra el *Ajuste positivo*, pero una rotura con el sistema en 0 sigue costando dos viajes), G-20 (en los archivos el movimiento sin descripción sigue sin título). Nuevos: el login no dice qué hacer si uno se olvidó la contraseña; la admin ve *Anular o corregir* en la plata de una venta y el cartel no la lleva a corregir; *Agregala acá* pierde lo escrito en el formulario. Ninguna pantalla con scroll de costado. Corrida en `cooperApp_ux` / puerto 3002 / Edge en el 9377, sin choques con QA | **15/11: los 20 y el vocabulario, corregidos** (ver el final del informe) |

*(Completar después de cada corrida.)*

---

## Guion para la prueba con una persona real

Es la prueba que vale, y la única que quedó sin hacer en el cuatrimestre (HU-64 y HU-65).
No hace falta un chat: hace falta una persona del perfil (de 35 a 55 años, de oficio, que no
sea de sistemas) y media hora.

**Antes**
1. Recreá la base con los dos `.sql` y levantá la app. Usá la computadora donde corre: desde un
   celular hace falta estar en la misma red wifi y entrar por la IP de la compu, no por `localhost`.
2. Entrá vos con el usuario que le toque y dejala en el panel de inicio. No le muestres nada.
3. Tené papel a mano. Si se puede, pedile permiso para grabar la pantalla (no la cara).

**Qué decirle** (y nada más)
> *"Estamos probando un programa, no a vos. Si algo no se entiende, es culpa del programa.
> Pensá en voz alta: decí lo que buscás y lo que esperás que pase. No te voy a ayudar,
> porque quiero ver dónde se traba el programa."*

**Las tareas** (de a una, leídas en voz alta, sin decir dónde está nada)

| Si es del depósito (entrá como Silvia) | Si maneja la plata (entrá como Roberto o Marta) |
|---|---|
| "Vendiste 2 kilos de queso a $ 12.500 el kilo. Cargalo." | "Pagaste la luz: $ 32.000. Cargalo." |
| "¿De qué te estás quedando sin mercadería?" | "¿Cómo te fue este mes comparado con el anterior?" |
| "Llegaron 20 kilos de queso que pagaste $ 8.000 el kilo. Cargalo." | "Cargaste mal un monto ayer: arreglalo." |
| "Se rompieron 3 paquetes de fideos. Sacalos." | "Mandale a tu contador lo de este mes." |
| "Te equivocaste en la venta de recién: arreglala." | "¿Cuánta plata se te fue en mercadería rota este mes?" |
| "Necesitás cajas de cartón: buscá quién te las vende cerca." | "Necesitás cajas de cartón: buscá quién te las vende cerca." |

**Qué anotar en cada tarea**
- ¿La terminó? ¿Sola, con una pista, o no pudo?
- **Dónde se frenó**: en qué pantalla, mirando qué. Los silencios largos valen oro.
- **Qué palabra no entendió** o leyó como otra cosa (anotá la palabra exacta que usó ella).
- **Qué tocó esperando otra cosa.**
- Cuánto tardó, más o menos.

**Reglas para el que mira**
- **No ayudes.** Si se traba más de dos minutos, dale una pista mínima ("¿dónde buscarías?")
  y anotá que la necesitó.
- No expliques el sistema ni defiendas una decisión mientras prueba.
- Al final, preguntale: *"¿Qué fue lo más difícil?"* y *"¿Lo usarías en tu negocio? ¿Por
  qué?"*. Anotá las respuestas con sus palabras.

**Después**
- Pasá lo anotado a la sección **"Lo que ya observamos"** de este archivo, con la fecha y el
  perfil de la persona (oficio y edad aproximada, sin el nombre).
- Lo que se trabó dos personas en el mismo lugar ya no es una opinión: es un problema. Va al
  backlog con prioridad, aunque el chat de UX no lo haya visto.
- Con eso, **HU-64 y HU-65 quedan validadas de verdad** (hoy figuran como hechas sin esa
  prueba: está anotado en `datos.py`).
