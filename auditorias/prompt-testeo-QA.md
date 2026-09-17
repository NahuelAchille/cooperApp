# Testeo de QA · CooperApp

> Prompt reusable para auditar el proyecto al cierre de cada sprint.
> Creado el 13/09/2026, al cerrar el Sprint 06.
> Actualizado el 16/09/2026: se sumaron Productos y Stock, la regresión contra
> los informes anteriores, y la usabilidad pasó a la auditoría de UX.

---

## Cómo se usa

1. **Abrí un chat NUEVO**, parado en la carpeta `pp2` (así se carga solo el `CLAUDE.md`).
   Que sea otro chat es importante: si lo hacés en el mismo donde se programó, arrastra las
   suposiciones de quien escribió el código, incluidas las equivocadas. La gracia es que
   alguien mire con ojos frescos lo que el otro dio por bueno.
2. **Copiá el prompt de abajo entero** y pegalo.
3. Cuando termine, **traé el informe al chat de desarrollo** para que se corrija ahí.
   El que testea no arregla: si arregla sobre la marcha, se mezclan los cambios y se pierde
   el registro de qué falló.
4. **Guardá el informe** en `cooperApp/auditorias/informes-QA/`, con el nombre
   `informe-QA-sprint-NN.md`. Va adentro del repo: es lo que le llega al grupo.
5. Anotá el resultado en el registro del final de este archivo.

**Cuándo conviene correrlo**: al cerrar cada sprint, antes de empezar el siguiente. El costo
de un error crece cuanto más tarde aparece, y cada módulo nuevo se construye encima del
anterior.

**Qué NO cubre esto**: la usabilidad. Eso tiene su propio prompt
(`prompt-auditoria-UX.md`) y se corre en otro chat, porque busca otra cosa: lo que
**funciona pero confunde**. Son dos revisiones distintas y conviene no mezclarlas, si no
cada una hace mal la mitad de la otra.
Y ni una ni otra reemplazan la validación real: que una persona que no es de sistemas
entienda la pantalla se prueba sentándola adelante y mirándola sin ayudarla.

**Mantenimiento** (esto se olvidó entre el Sprint 06 y el 08, y se notó): cuando se sume
un módulo nuevo (Reportes, Articulación), **agregalo a la sección "Qué probar"**.
Si no, el testeo siguiente prueba a fondo lo viejo y pasa por arriba lo recién escrito, que
es justo lo que menos se miró. Lo mismo con la lista de "lo que ya está decidido": cada
hallazgo que se manda al backlog se agrega ahí, para que el informe siguiente no lo repita.

---

## El prompt

````text
Quiero que actúes como QA y audites este proyecto de forma exhaustiva. Ya
leíste CLAUDE.md, que tiene el contexto completo: leelo antes de empezar.

## Tu objetivo

Encontrar errores AHORA, antes de que se construya más encima. El proyecto va
a seguir creciendo (Servicios, Reportes, Articulación) sobre lo que ya existe,
así que cualquier cosa torcida en los cimientos se va a multiplicar. Y crece
copiando: Servicios se escribe a partir de Productos, así que un error que hoy
está en uno solo mañana está en dos.

## Regla más importante: NO ARREGLES NADA

Tu trabajo es encontrar y reportar, no corregir. No modifiques código, ni
esquema, ni datos de prueba. Si encontrás algo grave, reportalo y seguí.
El usuario decide después qué se arregla y en qué orden.

La única excepción: podés crear datos de prueba para probar algo, siempre que
al final dejes la base como la encontraste (se resetea con datos_de_prueba.sql).

## Método: no confíes en leer el código

Leer el código te dice qué INTENTA hacer. Probarlo te dice qué HACE. Verificá
todo ejecutando, en tres niveles:

1. BASE DE DATOS: consultá las tablas con mysql.exe para ver qué quedó
   realmente guardado. Varios de los peores errores de este proyecto aparecieron
   acá: la API decía "guardado correctamente" y en la tabla había otra cosa.
2. API con curl: logueate con cada rol y pegale a los endpoints directamente.
   Esto saltea el navegador y prueba lo que alguien podría hacer armando el
   pedido a mano. Acá aparecieron los problemas de permisos.
3. NAVEGADOR: abrí la app y usala. Mirá también la consola y la pestaña de red.

Un hallazgo sin reproducir ejecutándolo no es un hallazgo: es una sospecha.
Marcá claramente cuáles confirmaste y cuáles no.

## Quiénes lo van a usar (esto define qué es grave)

- Empresas, de PyMEs a grandes. Cada empresa ve SÓLO sus datos.
- Cuatro roles: admin_empresa, tesorero, operador, superadmin.
- Gente que no es de sistemas. Un mensaje de error confuso es un error real.
- Se usa desde el celular: probá todo en 375 px de ancho.
- Maneja PLATA. Un número mal calculado o un movimiento que se pierde es lo
  más grave que puede pasar, más que cualquier problema visual.

## Lo que ya sabemos y está decidido: NO lo reportes de nuevo

Esto ya se auditó, se discutió y el equipo decidió postergarlo a propósito.
Reportarlo otra vez gasta lugar en el informe sin agregar nada:

- La contraseña temporal es el DNI. Se sabe que no es un dato secreto. Cambiarlo
  es decisión de producto, no técnica: "tu contraseña es tu DNI" es mucho más
  simple de transmitir para este público. Está como HU-80.
- No hay límite de intentos de login. HU-81.
- La clave de firma de sesiones está escrita en el código. Sin deploy, el riesgo
  es acotado. HU-82.
- `node_modules` está commiteado en el repo. Se sabe; sacarlo obliga a todo el
  grupo a correr `npm install`.
- El registro de una empresa NO avisa por correo cuando se aprueba: el proyecto
  es 100% local a propósito y el aviso es por teléfono.
- Anular un movimiento de stock NO anula su movimiento de dinero: es a
  propósito (el cobro pudo ser real aunque la mercadería se haya cargado mal, y
  un operador no tiene permiso para tocar finanzas). La app lo avisa.
- No hay paginado en ningún listado. Se sabe; con el volumen de una PyME chica
  todavía no molesta.
- Productos y servicios **comparten las mismas tablas** (`productos` y
  `categorias_producto`), separados por la columna `es_servicio`. No es un
  descuido: un servicio es un producto sin stock. Lo que sí hay que probar es
  que los dos catálogos no se mezclen (ver la sección de Servicios).
- Un servicio **no tiene unidad de medida ni stock mínimo**: se guardan en NULL
  y en 0 a propósito, porque no se guarda en ningún lado. Que la API los ignore
  si se los mandan es lo correcto, no un bug.
- El panel *"Cuánto deja cada servicio"* **no toma los filtros de naturaleza,
  categoría ni servicio**, sólo el período. Es a propósito: un resultado
  necesita lo que entró y lo que salió. El panel lo avisa en pantalla.
- El servicio de un movimiento es su **origen, no su clasificación**. La
  categoría y el tipo siguen siendo obligatorios. Que un movimiento no tenga
  servicio es el caso normal.

Si encontrás una forma NUEVA de explotar alguna de estas, eso sí reportalo.

## Antes de empezar: regresión de lo ya reportado

Leé los informes que ya existen en `cooperApp/auditorias/informes-QA/` y en
`cooperApp/auditorias/informes-UX/`, y
hacé dos cosas con cada hallazgo que figure como corregido:

1. **Verificá que siga corregido.** Reproducí el caso original.
2. **Buscá el MISMO error en las pantallas que se sumaron después.**

El punto 2 es el que más veces encontró algo: en el Sprint 06 el XSS almacenado
se corrigió en `movimientos.html` y `dashboard.html`, y quedó vivo en
`superadmin.html` y `usuarios.html`. Mismo bug, otras pantallas, porque se
arregló donde se lo vio y no donde estaba el patrón. Cada módulo nuevo copia
código del anterior, así que copia también sus errores.

## Qué probar

Cubrí todo lo implementado (ver CLAUDE.md sección 3). Prestá atención especial a:

SEGURIDAD Y AISLAMIENTO (lo más crítico)
- Que un usuario de una empresa no pueda ver ni tocar NADA de otra: probá
  todos los endpoints pasando ids ajenos a mano.
- Que ningún rol pueda hacer lo que no le corresponde, armando el pedido
  directo sin pasar por la pantalla.
- Qué pasa con un usuario dado de baja que tenía la sesión abierta.
- Qué pasa con un usuario de una empresa que es suspendida.
- La contraseña temporal es el DNI, que no es un dato secreto: ¿qué tan
  expuesta queda una cuenta nueva antes del primer cambio?
- ¿Se puede saltear el cambio de contraseña obligatorio?
- Textos del usuario que se muestran en pantalla: ¿se ejecutan como código?
- Módulos desactivados: ¿las rutas rechazan de verdad o sólo desaparece el menú?

DATOS Y CÁLCULOS
- Montos: decimales, redondeo, valores enormes, negativos, texto, vacío.
- Fechas: bordes de mes, años bisiestos, futuro, pasado lejano.
- Que los totales de la pantalla coincidan con la suma real de la base.
- Anulaciones: que el movimiento anulado no sume en ningún lado.
- Acentos y ñ en todos los campos, guardados y leídos.

PRODUCTOS (Sprint 07)
- Cascada de bajas del árbol: al desactivar una categoría se van sus
  subcategorías, y al reactivarla vuelven. Probá los dos sentidos.
- ¿Se puede crear o activar una subcategoría dentro de una categoría de baja?
- ¿Se puede clasificar un producto nuevo en una categoría desactivada?
- La unidad de medida es una lista cerrada: ¿la API acepta una clave inventada?
- Stock mínimo decimal: 0,001 (¿se guarda en 0?), y qué significa el 0.
- Búsqueda: probá con "%" y con "_", que son comodines del LIKE.
- Los 11 filtros del catálogo, solos y combinados.

STOCK (Sprint 08) — es el módulo con más cálculo, miralo con lupa
- LA EXISTENCIA NO ESTÁ GUARDADA, se calcula sumando los movimientos no
  anulados. Compará la existencia que muestra la app contra un SELECT que la
  sume a mano, producto por producto. Si dan distinto, es CRÍTICO.
- Anular una entrada que dejaría el stock en negativo: tiene que rebotar.
- Sacar más de lo que hay: tiene que rebotar.
- Que anular corrija la existencia solo, sin tocar nada más.
- Motivos: ¿se puede guardar entrada+ingreso o salida+egreso? No se debe.
- ¿Se puede cambiar el efecto de un motivo que YA tiene movimientos? No se debe:
  daría vuelta la interpretación de todo el historial.
- Los cuatro estados de existencia: "sin cargar" (nunca tuvo movimientos) tiene
  que distinguirse de "sin stock" (tuvo y quedó en cero), en el listado, en el
  filtro de faltantes y en el dashboard, con el mismo criterio en los tres.
- El vínculo stock → dinero: registrá una venta, aceptá el movimiento de dinero,
  y después intentá crearlo OTRA VEZ para el mismo movimiento de stock (por la
  API, no por la pantalla). Tiene que rebotar: ese vínculo es lo único que impide
  cargar la misma venta dos veces.
- Al anular un movimiento de stock, el de dinero NO se anula solo: verificá que
  efectivamente siga vivo y que la app lo avise.
- El operador NO tiene acceso a finanzas: probá que no pueda crear el movimiento
  de dinero armando el pedido a mano.

SERVICIOS (Sprint 09) — el módulo más nuevo, y el que comparte tablas con otro
Un servicio es un producto sin stock: viven en las MISMAS tablas (`productos` y
`categorias_producto`), separados por la columna `es_servicio`. Eso es lo que hay
que atacar: todo lugar donde un id de producto pueda pasar por uno de servicio.
- Editar un PRODUCTO desde `/servicios/:id`, y un SERVICIO desde `/productos/:id`.
  Lo mismo con `/:id/estado`. Que sea de la empresa NO alcanza: tiene que ser
  además del mismo lado del catálogo.
- Lo mismo con las categorías y las subcategorías: renombrar o dar de baja una de
  productos desde `/servicios/categorias/...`, y al revés.
- Dar de alta un servicio usando una categoría de PRODUCTOS (y viceversa).
- Cargarle un movimiento de stock a un servicio, por la API. No se debe.
- ¿Aparecen servicios en la pantalla de Stock, o productos en la de Servicios?
- Mandar `unidad_medida` y `stock_minimo` al crear un servicio: tienen que
  terminar en NULL y en 0 en la tabla, no en lo que se mandó. Verificalo con
  `mysql.exe`, no en la respuesta.
- El nombre único es por catálogo: un producto y un servicio PUEDEN llamarse
  igual; dos servicios no. Probá los dos casos.
- Roles: acá están al revés que en Productos. El catálogo lo arma el admin, el
  TESORERO sólo lee y el OPERADOR no entra. Probá los tres por API.

EL SERVICIO DE UN MOVIMIENTO DE DINERO (HU-48 y HU-49)
- Vincular un movimiento a un id de PRODUCTO en vez de un servicio: no se debe.
- Vincular a un servicio de OTRA empresa, y a uno dado de baja: no se debe.
- Mandar `id_servicio` desde una empresa que NO tiene el módulo: no se debe.
- Un servicio dado de baja tiene que seguir apareciendo en el FILTRO del listado
  (sus movimientos existen) pero NO en el alta. Verificá los dos.
- Apagar el módulo de servicios con movimientos ya vinculados: el dato tiene que
  seguir viéndose, no desaparecer. Apagar un módulo esconde, no borra.
- El panel "Cuánto deja cada servicio": compará sus números contra un SELECT
  hecho a mano, servicio por servicio, con y sin período. Es una cuenta nueva.
- Un servicio SIN movimientos en el período tiene que aparecer igual, en cero.
  Si desaparece, es un bug: es justamente el que hay que mirar.
- Un servicio dado de baja aparece en el panel sólo si en el período movió algo.
- Fechas del período: el borde exacto (un movimiento del mismo día que "desde"
  o que "hasta") tiene que entrar.

FLUJOS COMPLETOS
- Registro de empresa → aprobación → alta de usuarios → carga de movimientos.
- Rechazo de una empresa: ¿se puede revertir? ¿qué pasa con sus usuarios?
- Reseteo de contraseñas, en las dos direcciones que existen.
- Activación y desactivación de módulos, y qué pasa con los datos ya cargados.
- Configuración inicial al aprobar: ¿qué pasa si se aprueba dos veces?

DOS PEDIDOS AL MISMO TIEMPO (acá aparecieron los dos críticos del Sprint 08)
Todo lo que se prueba de a un pedido por vez anda bien. Los errores más graves
que tuvo este proyecto sobrevivieron a eso y aparecieron recién mandando DOS
pedidos juntos, que es lo que pasa cuando hay dos personas trabajando, dos
pestañas abiertas o dos dispositivos.
- Buscá el patrón CONSULTAR - DECIDIR - ESCRIBIR: donde el código lee algo,
  decide en JavaScript y después guarda, entre esos dos momentos se mete el
  otro pedido. Mandalos simultáneos (Promise.all desde un script de Node) y
  fijate si los dos pasaron el control.
- Los dos casos ya conocidos, corregidos el 16/09, que ahora son regresión: dos
  ventas del mismo producto a la vez dejaban el stock en negativo, y dos
  pedidos del movimiento de dinero de la misma venta creaban dos cobros.
- Probalo también en: anular lo mismo dos veces, dar de alta dos veces el mismo
  email o CUIT, aprobar la misma empresa desde dos sesiones, editar el mismo
  producto desde dos pestañas.
- Mirá el resultado EN LA TABLA, no en la respuesta: el síntoma es un número
  mal, no un error. Nadie recibe un mensaje de que algo salió mal.

ESTADOS RAROS
- Empresa sin categorías, sin movimientos, sin usuarios.
- Categoría desactivada con movimientos históricos.
- Qué pasa si se corta la conexión a la base mientras se guarda algo.

## Qué NO hacer

- No propongas cambios de alcance ni funcionalidades nuevas.
- No propongas deploys, hosting ni servicios externos: el proyecto es 100% local.
- No reportes preferencias de estilo de código como si fueran errores.
- No audites la usabilidad. Eso tiene su propia revisión, con su propio prompt
  (`prompt-auditoria-UX.md`) y en otro chat, porque busca otra cosa: lo que
  funciona pero confunde. Si de paso ves algo que confunde, anotalo en UNA LÍNEA
  al final y seguí con lo tuyo. Un mensaje de error que miente sobre lo que pasó
  sí es un bug y va en el informe; uno que dice la verdad pero se entiende mal,
  no.

## Entregable

Un informe ordenado POR SEVERIDAD, no por orden de aparición. Para cada hallazgo:

- Qué pasa, en una frase.
- Pasos exactos para reproducirlo (comando o clicks).
- Qué esperabas y qué pasó.
- Por qué importa para el usuario real de este sistema.
- Si lo confirmaste ejecutándolo o es una sospecha.

Severidades:
- CRÍTICO: pérdida o corrupción de datos, plata mal calculada, o alguien ve
  datos de otra empresa.
- ALTO: una función no anda, o se puede saltear un control de permisos.
- MEDIO: anda pero confunde al usuario, o falla en un caso borde.
- BAJO: cosmético o muy improbable.

Al final: qué áreas quedaron bien probadas y cuáles no llegaste a cubrir.
Ser honesto sobre lo que no probaste vale más que inflar la lista.

## Trampas del entorno (están en CLAUDE.md, no te confundas)

- **`pkill` NO mata el servidor.** Desde Git Bash, `pkill -f "node app.js"` dice
  que sí y no hace nada: son procesos de Windows. El viejo se queda con el
  puerto y **seguís probando el código de antes**. Si algo "no funciona" y el
  código se ve bien, o si algo "funciona" después de un cambio que no deberías
  haber visto todavía, sospechá de esto primero. Usá
  `taskkill //F //IM node.exe` y verificá con
  `tasklist //FI "IMAGENAME eq node.exe"` que no quedó ninguno.
- La consola de Git Bash rompe los acentos al mostrarlos. Si ves caracteres
  raros, verificá los bytes reales antes de reportarlo como error: ya nos pasó
  de perseguir un fantasma.
- Al re-ejecutar datos_de_prueba.sql cambian los ids autoincrementales. No
  uses ids fijos en tus scripts de prueba: buscalos cada vez.
- Para importar el esquema hay que borrar la base primero (database.sql no
  tiene DROP).
- LAS FECHAS SE VERIFICAN EN LA TABLA, NUNCA EN LA PANTALLA. El driver devuelve
  las columnas DATE como objetos Date de JavaScript, y ya pasó que una fecha se
  guardara como 0000-00-00 sin que se viera nada raro en la app. Si probás algo
  que guarda una fecha, andá a mirar qué quedó con mysql.exe.

Arrancá levantando MariaDB de XAMPP, recreando la base desde cero con los dos
.sql, y poniendo la app a andar.

Después, en este orden: primero la regresión de lo ya reportado (es rápida y te
deja ver qué patrones se repiten), después seguridad y aislamiento, que es lo
más crítico, y después el módulo más nuevo, que es el que menos ojos tuvo
encima.
````

---

## Qué hacer con el informe

1. **Leelo entero antes de arreglar nada.** A veces tres hallazgos distintos son la misma
   causa, y conviene verlo antes de empezar.
2. **Ordenar por severidad, no por facilidad.** Lo CRÍTICO va primero aunque cueste más.
3. **Separar lo que es error de lo que es decisión de producto.** Si el informe dice que
   algo "debería funcionar distinto", eso lo decide el equipo, no el testeo.
4. **Lo que no se arregla, al backlog.** Un hallazgo real que se posterga tiene que quedar
   escrito como historia en `pp2/scripts-backlog/datos.py` (ojo: ese script está fuera
   del repo), si no se pierde.
5. **Anotarlo en el registro de acá abajo**, para saber qué se probó y cuándo.

---

## Registro de testeos

| Fecha | Al cerrar | Hallazgos | Qué se corrigió |
|---|---|---|---|
| 13/09/2026 | Sprint 06 | 12 (1 crítico, 3 altos, 4 medios, 4 bajos) | 10 corregidos · 1 falso positivo (M1) · 3 al backlog (HU-80, 81, 82). Se sumó un hallazgo que el informe no formalizó: sesiones vivas tras dar de baja a un usuario |
| 16/09/2026 | **Sprints 07 y 08** (juntos: el 07 nunca se había corrido) | 8 (2 críticos, 1 alto, 3 medios, 2 bajos), todos confirmados ejecutándolos. Informe en `informes-QA/informe-QA-sprints-07-08.md` | **Los 8 corregidos**, ninguno al backlog, + 2 encontrados al corregir. Los dos críticos eran el mismo error de concurrencia (consultar-decidir-escribir) y se cerraron con una transacción que traba la fila del producto. Detalle al final del informe |
| *pendiente* | **Sprint 09** (vocabulario, listados en celular, configuración agrupada y todo el módulo de Servicios) | — | Es **HU-50** del backlog. Servicios comparte tablas con Productos, así que lo que más conviene atacar es el cruce entre los dos catálogos |

*(Completar después de cada corrida.)*
