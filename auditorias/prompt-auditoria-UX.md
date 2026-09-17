# Auditoría de experiencia de usuario · CooperApp

> Prompt reusable para revisar la app desde el punto de vista de quien la usa.
> Creado el 15/09/2026, después de que el grupo probara la app y la encontrara poco intuitiva.

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

**Cuándo conviene correrlo**: cada dos o tres sprints, y sí o sí antes del Sprint 13, que es
el de UX y cierre. Cuanto más tarde se renombra algo, más lugares hay que tocar.

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
- **Los listados entran en el celular (HU-85)**: por debajo de 768 px cada fila es una tarjeta.
  Hay una hoja compartida, `styles/tabla-mobile.css`. Si encontrás una tabla que **no** la use
  y se corte, eso sí reportalo: es el error que se repite.
- **La matrícula se sacó del sistema** (era del mundo cooperativo). La federación se quedó,
  rotulada *"Cámara o federación a la que pertenece"*, y siempre fue opcional.
- **Reportes y Articulación llevan a una pantalla que explica que están en construcción**, no a
  un botón muerto.
- **Un servicio no pregunta unidad de medida ni stock mínimo**: no se guarda en ningún lado.
- **El servicio de un movimiento es opcional y va último** en el formulario: la mayoría de los
  movimientos (la luz, el alquiler, un sueldo) no salen de ningún servicio.

**Lo que quedó medido y sin resolver, y sigue abierto**: en Stock y en Servicios los **filtros
ocupan casi una pantalla** en el celular (288 px en Stock, más que el encabezado y el título
juntos). Colapsarlos detrás de un botón *"Filtros"* está propuesto y sin decidir. Si lo ves,
confirmalo con medidas en vez de volver a describirlo.

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
13. "Vendimos mercadería: quiero que quede registrada la venta Y la plata."
14. "Nunca vamos a usar productos, sacalo de en medio."

SERVICIOS — usá Metalúrgica del Oeste, que es la única empresa que lo tiene
prendido: osvaldo@metaloeste.com.ar (admin) y daniel@metaloeste.com.ar (tesorero)
15. Como admin: "Empezamos a ofrecer pintura de portones, cargalo."
16. Como tesorero: "Cobramos un trabajo de soldadura, cargá la plata y dejá
    anotado que vino de ahí."
17. Como tesorero: "¿Cuál de los servicios que ofrecemos nos conviene sostener?"
    Esta es la que más interesa: la respuesta existe, pero está en otra pantalla
    que la de Servicios. ¿Se llega? ¿En cuántos pasos? ¿Se entiende el número?
18. Como tesorero: "¿Cuánto nos dejó la soldadura el mes pasado?"
19. Como admin: "Dejamos de ofrecer un servicio." ¿Qué pasa con la plata que ya
    había generado? ¿Queda claro que no se borra?
20. Un servicio es un producto sin stock, y comparten pantallas casi iguales.
    Mirá Productos y Servicios uno después del otro: ¿se distinguen? ¿O alguien
    puede creer que está en una estando en la otra?

COMO EMPRESA NUEVA (aprobá Huerta Norte desde el superadmin y entrá con su admin)
21. Los primeros cinco minutos: todo vacío. ¿La app te dice qué hacer primero,
    o te deja solo frente a pantallas en blanco?

## Qué mirar, más allá de las tareas

VOCABULARIO
La ronda grande ya se hizo (HU-84, ver arriba lo decidido). Ahora el trabajo es
otro: **verificar que el vocabulario decidido se haya respetado en todo**, y
buscar lo que quedó afuera.
- Recorré las pantallas nuevas (Servicios y sus categorías, el panel de "cuánto
  deja cada servicio") y fijate si usan las palabras que se decidieron o si
  volvieron a aparecer las viejas.
- **Mirá también los mensajes del servidor, no sólo los botones.** El toast
  muestra lo que contesta la API: ya pasó de tener el botón renombrado y la
  respuesta diciendo lo de antes. Se ve mejor por `curl` que en la pantalla,
  donde el toast pasa y se va.
- Buscá las palabras que quedan sin revisar: "efecto", "módulo", "existencia",
  "naturaleza" (sigue en la API y en la base, ¿se filtra a alguna pantalla?),
  y las etiquetas nuevas de Servicios.
- ¿Alguna palabra nueva significa dos cosas? "Servicios" es ahora un módulo del
  sistema **y** una categoría de egresos en los datos de prueba (donde están la
  luz y el gas). ¿Confunde?

Para cada una proponé un nombre y explicá por qué. Importa que la propuesta
distinga sin alargar: "Categorías de productos" y "Categorías de movimientos"
resuelve la ambigüedad pero son etiquetas largas para un menú de celular.

NAVEGACIÓN Y ARQUITECTURA
- ¿Dónde vive cada cosa y por qué ahí? La configuración ya se agrupó en el menú
  principal (HU-86): lo que hay que mirar ahora es si **se encuentra**, y si el
  desplegable no quedó demasiado largo al sumarle Servicios.
- **El caso más claro para revisar**: la pregunta "cuánto deja cada servicio" se
  la hace alguien parado en la pantalla de Servicios, pero la respuesta vive en
  Movimientos, atrás de un botón. Hay un atajo que lleva hasta ahí. ¿Alcanza?
  ¿O el panel debería estar en Servicios, con su propio selector de período?
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

CONSISTENCIA
- La misma acción, ¿se hace igual en todas las pantallas? (íconos, colores,
  posición de los botones, si abre modal o cambia de página)
- Los estados (activo, anulado, de baja): ¿se muestran siempre de la misma
  forma? Esto se unificó en HU-84: lo que hay que buscar es dónde **no** se
  respetó, sobre todo en las pantallas nuevas.
- Productos y Servicios son casi la misma pantalla. ¿Las diferencias que tienen
  están donde corresponde, o hay una que quedó distinta porque sí?

CELULAR (375 px)
- ¿Qué se rompe, qué queda lejos del pulgar, qué obliga a hacer zoom?
- **Medí cada tabla**, no la mires nomás: `document.querySelector('table').scrollWidth`
  contra `window.innerWidth`. Ya pasó dos veces que una tabla que parecía corta
  se cortara justo en la columna que uno vino a mirar, y la barra para arrastrar
  está abajo de todo, así que uno se entera al final.
- ¿Cuánto espacio hay que recorrer antes de ver el primer dato? (encabezado +
  título + filtros). Es lo que queda abierto en Stock y en Servicios.

## Restricciones (respetalas al proponer)

- Todo corre en LOCAL. Nada de servicios externos.
- HTML, CSS y JS planos, con Bootstrap 5 y FontAwesome por CDN. NO propongas
  React, Vue, Tailwind ni ningún framework nuevo.
- Respetá el patrón MVC que ya tiene el proyecto.
- Quedan 4 sprints y el equipo son 4 estudiantes: una propuesta que implique
  rehacer todo no sirve, por buena que sea. El Sprint 13, que es el de UX, es
  además la semana de la entrega final y la defensa.
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
   Qué conviene hacer ya (antes de seguir programando módulos nuevos, porque
   cada pantalla que se suma multiplica el costo de renombrar) y qué puede
   esperar al Sprint 13. Máximo 10 ítems, ordenados.

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
app a andar (node app.js desde cooperApp/). Después abrí el navegador y empezá
por el operador, que es el rol más acotado y el que más claro deja si la app
se entiende sin conocer el resto del sistema.
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
   Documentación), que ya tiene su lugar en el Sprint 13. Ese script vive en
   `pp2/scripts-backlog/`, fuera del repo.
6. **Anotalo en el registro de acá abajo**, y sumá a "Lo que ya está decidido" lo que se haya
   aplicado, para que la próxima corrida no lo vuelva a reportar.

---

## Registro de auditorías

| Fecha | Al cerrar | Hallazgos | Qué se aplicó |
|---|---|---|---|
| 15/09/2026 | Sprint 08 | 26 hallazgos (4 bloquean, 8 hacen perder tiempo, 8 generan duda, 6 molestan) + 16 términos a renombrar + 3 bugs. Informe en `informes-UX/informe-UX-2026-09-15.md` | **16/09**: los 4 que bloquean (H-01 a H-04) + se sacó la matrícula del sistema + el largo mínimo de contraseña + 1 bug encontrado al corregir. El resto, al backlog: HU-84 a HU-88 en el Sprint 13. El vocabulario queda para decidir en grupo. Detalle al final del informe |
| 16/09/2026 | *(sin auditoría nueva: se aplicó lo pendiente de la anterior)* | — | **HU-84** (vocabulario, decidido por el grupo), **HU-85** (listados como tarjetas en el celular, con hoja compartida) y **HU-86** (configuración agrupada en el menú principal). Las tres estaban planificadas para el Sprint 13 y se adelantaron al 09, porque arreglaban justo lo que el módulo de Servicios iba a duplicar |
| *pendiente* | **Sprint 09** (módulo de Servicios completo) | — | Lo que más conviene mirar: que el vocabulario decidido se haya respetado en las pantallas nuevas, y si "cuánto deja cada servicio" se encuentra y se entiende |

*(Completar después de cada corrida.)*
