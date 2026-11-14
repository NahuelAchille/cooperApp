# Lo que quedó para más adelante · CooperApp

Qué quedó sin hacer al cierre del cuatrimestre (noviembre de 2026), por qué, y **cómo
conviene encararlo** si el proyecto sigue el año próximo. Son propuestas de diseño
pensadas para que encajen con lo que ya está hecho, no decisiones tomadas: cada una
tiene marcado **qué tiene que decidir el grupo** antes de programar.

Las historias están en el backlog (`Backlog_CooperApp_2026.xlsx`, hoja *Product
Backlog*, sección *Backlog futuro*) con el mismo número que se usa acá.

> Antes de leer esto conviene tener a mano el [modelo de datos](modelo-de-datos.md):
> todo lo nuevo se cuelga de esas tablas.

---

## Índice

1. [Cómo agregar un módulo nuevo sin romper nada](#1-cómo-agregar-un-módulo-nuevo-sin-romper-nada) (leer primero)
2. [Recursos humanos](#2-recursos-humanos-hu-68-a-hu-70): vacaciones, órdenes médicas, calendario
3. [Chat entre empresas](#3-chat-entre-empresas-hu-73)
4. [Correos: recuperar la contraseña y verificar el email](#4-correos-recuperar-la-contraseña-y-verificar-el-email-hu-71-y-hu-72)
5. [Seguridad](#5-seguridad-hu-80-a-hu-82): contraseña temporal, intentos de ingreso, clave de sesión
6. [Una persona en varias empresas](#6-una-persona-en-varias-empresas-hu-78)
7. [Registro de auditoría](#7-registro-de-auditoría-hu-79)
8. [Copias de seguridad](#8-copias-de-seguridad-hu-77)
9. [Limpieza pendiente de la base](#9-limpieza-pendiente-de-la-base)
10. [Lo que ya se hizo y estaba en esta lista](#10-lo-que-ya-se-hizo-y-estaba-en-esta-lista)

---

## 1. Cómo agregar un módulo nuevo sin romper nada

El sistema ya tiene cinco módulos, y cada uno agregó lo mismo. Esta es la lista; saltear
un paso es la manera más rápida de abrir un agujero.

**En la base** (`database.sql`)
- Una fila en `modulos` con su `clave`, si es `opcional` y si viene prendido de
  fábrica (`activo_por_defecto`). Las empresas que ya existen **no necesitan nada**:
  sin fila en `empresa_modulos`, vale el de fábrica.
- Toda tabla nueva lleva `id_empresa` (salvo que sea una lista común a todas), `activo`
  si sus filas se dan de baja, o `anulado` si son movimientos que no se borran.
- Si la tabla nueva apunta a otra, revisar el **orden de los `DELETE`** de
  `datos_de_prueba.sql` y correrlo dos veces seguidas.

**En el servidor**
- Cada ruta, en este orden: `requireLogin`, `requireRol(...)`, `requireModulo('clave')`.
  Esconder el botón no alcanza: el pedido se puede armar a mano.
- Toda consulta filtra por `req.session.user.empresa.id`, nunca por un id que mande la
  pantalla. Si una fila cuelga de otra, se controla que la de arriba sea de la empresa.
- Si el código **consulta algo, decide y después escribe** (¿alcanza?, ¿ya existe?,
  ¿ya está aprobado?), va en una transacción con `SELECT ... FOR UPDATE`. Ver
  `conProductoTrabado()` en `stock.model.js`.
- Validar los largos con `validacion.service.js` y las fechas con `fecha.service.js`.

**En la pantalla**
- Llamar `await cargarHeader()` y usar `moduloActivo('clave')` para el aviso de módulo
  apagado, distinto del de falta de permiso.
- Agregar la opción al menú en `components/header.html` y `header.js`.
- Todo texto que venga de la base pasa por `esc()` antes de ir a `innerHTML`.
- Las tablas usan `tabla-mobile.css` y las cajas de filtros `filtros-plegables`.
  **Medir** en 375 px que no haya scroll de costado.
- Respetar el vocabulario: **Anular** lo que no se deshace, **Dar de baja / Reactivar**
  lo que sí.

**Al terminar**
- Sumar el módulo a los datos de prueba, a `usuario de prueba.txt`, a la sección *Qué
  probar* de `auditorias/prompt-testeo-QA.md`, al manual de usuario y al modelo de datos.

---

## 2. Recursos humanos (HU-68 a HU-70)

**Por qué quedó afuera**: es el módulo más grande y el único que no toca la plata ni la
mercadería. Con siete sprints por delante se priorizó lo que hace al registro económico
y a la articulación (decisión del grupo, septiembre de 2026).

**Qué tiene que hacer**: que un empleado pida vacaciones o avise una ausencia, adjunte
una orden médica o un certificado de estudio, que alguien lo apruebe, y que se vea un
calendario de quién falta.

### Propuesta

Un módulo nuevo, `rrhh`, **apagado de fábrica**.

**Tablas**

| Tabla | Qué guarda |
|---|---|
| `tipos_ausencia` | Por empresa: *Vacaciones*, *Enfermedad*, *Examen*… Cada uno dice si **descuenta días del saldo** y si **pide un comprobante**. Es la misma idea que los motivos de stock: el comportamiento se configura, no se programa |
| `ausencias` | Quién, qué tipo, desde, hasta, cuántos días, `estado` (`pendiente`, `aprobada`, `rechazada`, `anulada`), quién la aprobó y cuándo |
| `ausencia_archivos` | El comprobante: nombre original, nombre en el disco, tipo y tamaño |
| `saldos_vacaciones` | Por persona y por año: los días que le corresponden. Lo usado **no se guarda: se calcula** sumando las ausencias aprobadas, igual que la existencia del stock |

**Quién hace qué**: cualquier usuario de la empresa pide para sí mismo; el
**administrador** aprueba o rechaza. Si el grupo quiere que lo haga otra persona, es un
rol nuevo (`personal`) que se agrega a `roles` y a las rutas.

**Los comprobantes** (HU-69) son **datos de salud**, y eso cambia todo:
- Se guardan en una carpeta **fuera de `src/views`** (por ejemplo `archivos/`), porque
  todo lo que está en `src/views` se sirve a cualquiera que sepa la dirección. Se
  entregan por una ruta que controla quién pide.
- Los ve **sólo la persona y quien aprueba**. Nunca el resto de la empresa.
- Se aceptan PDF y fotos, con un tamaño máximo, y se guardan con un nombre generado (no
  el que manda la persona).
- Agregar la carpeta al `.gitignore`.

**El calendario** (HU-70): una consulta por período de las ausencias aprobadas, pintada
como lista por semana en el celular y como grilla en la computadora.

### Lo que tiene que decidir el grupo
- ¿Quién aprueba: el administrador o un rol nuevo?
- ¿Cuántos días de vacaciones corresponden y cómo se cargan? La ley de contrato de
  trabajo los calcula por antigüedad: **hay que investigarlo** antes de automatizarlo.
  Lo más simple es que el administrador cargue el número de cada persona por año.
- ¿Hace falta? Fue la parte que más se discutió si correspondía a este producto.

---

## 3. Chat entre empresas (HU-73)

**Por qué quedó afuera**: no es parte del mínimo, y competía con lo que sí lo era. La
ficha de cada empresa ya muestra su email y su teléfono, que alcanzan para contactarla.

### Propuesta

Mensajes simples entre dos empresas que tengan **Articulación prendido**, que se
empiezan desde la ficha de la otra.

| Tabla | Qué guarda |
|---|---|
| `conversaciones` | Las dos empresas (`id_empresa_a`, `id_empresa_b`, una sola conversación por par) y cuándo fue el último mensaje |
| `mensajes` | La conversación, la empresa y el usuario que escribió, el texto, cuándo, y si la otra empresa ya lo leyó |

- **Sin WebSockets**: la pantalla pregunta cada 15 o 30 segundos si hay mensajes nuevos
  (*polling*). Es más simple, alcanza para este uso y no agrega nada al servidor.
- El texto pasa por `esc()`: es el mismo camino que el XSS que se cerró en el Sprint 06,
  con la diferencia de que acá lo escribe **otra empresa**.
- Un aviso de *mensajes sin leer* en el encabezado.

### Lo que tiene que decidir el grupo
- ¿Quién de la empresa lee y contesta: todos o sólo el administrador?
- ¿Se puede bloquear a una empresa?

---

## 4. Correos: recuperar la contraseña y verificar el email (HU-71 y HU-72)

**Por qué quedó afuera**: el proyecto corre **todo en local**, y mandar un correo de
verdad necesita un servicio de afuera (una cuenta de correo con sus claves). Se
reemplazó por el **reseteo de contraseña por el administrador**, que ya funciona.

### Propuesta

- Usar la librería `nodemailer` con la configuración del servidor de correo leída de
  variables de entorno (nunca escrita en el código).
- **Para probar en local**, un programa que atrapa los correos en vez de mandarlos (por
  ejemplo *Mailpit*): se ven en el navegador y no sale nada a internet.
- Tabla `tokens` con el usuario, un código al azar **guardado cifrado**, para qué sirve
  (`recupero` o `verificacion`), cuándo vence y si ya se usó. Un código sirve una sola
  vez y por poco tiempo.
- El recupero **siempre** contesta *"si el email existe, te mandamos un correo"*, exista
  o no: si no, sirve para averiguar quién está registrado.
- La verificación (HU-72): el superadmin no puede aprobar una empresa que no confirmó su
  email.

### Lo que tiene que decidir el grupo
- Si el proyecto se instala en algún servidor. **Si sigue siendo sólo local, esto no
  tiene sentido** y el reseteo por el administrador es la solución correcta.

---

## 5. Seguridad (HU-80 a HU-82)

Salieron de la auditoría de QA del Sprint 06. No son urgentes mientras el sistema corra
en una sola computadora, pero **son obligatorios antes de ponerlo en un servidor**.

| Historia | Hoy | Propuesta |
|---|---|---|
| **HU-80** Contraseña temporal | Es el DNI de la persona. Cualquiera que lo sepa puede entrar antes que ella | Un código al azar de 8 caracteres que el administrador ve **una sola vez** y que vence en 48 horas. **Decidir con el grupo**: "tu contraseña es tu DNI" es mucho más fácil de explicar a este público |
| **HU-81** Intentos de ingreso | Se pueden probar contraseñas sin límite | Contar los intentos fallidos por email: después de 5 seguidos, esperar 15 minutos. El mensaje dice cuánto falta, no si el email existe |
| **HU-82** Clave de las sesiones | Está escrita en `app.js` (`cooperapp_secret`) | Leerla de una variable de entorno, **con el valor de hoy como respaldo** para que el arranque local no cambie |

---

## 6. Una persona en varias empresas (HU-78)

Hoy cada usuario pertenece a una sola empresa (`usuarios.id_empresa`).

### Propuesta
- Tabla `usuario_empresas` (usuario, empresa, rol): **el rol pasa a ser por empresa**,
  porque alguien puede ser administrador en una y tesorero en otra.
- Al entrar, si tiene más de una, elige con cuál trabajar; la sesión guarda esa. Un
  selector en el menú del avatar para cambiar.
- **Es el cambio más delicado de esta lista**: toca la sesión, `requireLogin`,
  `requireRol` y cada consulta que hoy lee la empresa de la sesión. Hacerlo con la
  auditoría de QA a mano.

---

## 7. Registro de auditoría (HU-79)

Hoy se sabe **quién cargó** cada movimiento (`id_usuario`), pero no quién lo anuló, quién
dio de baja un producto ni quién cambió una configuración.

### Propuesta
- Tabla `auditoria`: empresa, usuario, fecha y hora, qué tabla, qué fila, qué acción
  (`anular`, `dar_de_baja`, `reactivar`, `editar`, `aprobar`…) y un detalle en texto.
- Se escribe **adentro de la misma transacción** que la acción: si la acción no se
  guarda, el registro tampoco.
- Empezar por lo que importa: anulaciones, bajas, cambios de rol y aprobaciones.
- Una pantalla de sólo lectura para el administrador.

---

## 8. Copias de seguridad (HU-77)

### Propuesta
- Un script `backup.bat` que corra `mysqldump` (viene con XAMPP) y guarde un archivo
  con la fecha en el nombre, conservando los últimos 30.
- Programarlo con el **Programador de tareas de Windows** una vez por día.
- **Probar la restauración**: una copia que nunca se restauró no está probada.
- Las copias van **fuera del repositorio** y fuera de la carpeta del proyecto.

---

## 9. Limpieza pendiente de la base

Columnas y tablas que existen pero ningún código usa (detalle en el
[modelo de datos](modelo-de-datos.md#lo-que-existe-pero-no-se-usa)):

- tablas `permisos` y `rol_permisos` (los permisos están en las rutas);
- `empresas.id_pais`;
- `usuarios.fecha_nacimiento`, `domicilio` y `codigo_postal`.

Sacarlas obliga a todo el grupo a recrear la base: **conviene hacerlo junto con el
primer cambio de esquema** del año próximo, no por separado.

---

## 10. Lo que ya se hizo y estaba en esta lista

Para que nadie las vuelva a programar:

| Historia | Cómo se resolvió |
|---|---|
| **HU-74** Ver en un mapa dónde están las otras empresas | La ficha de cada empresa muestra su zona en un mapa (Leaflet + OpenStreetMap, sin clave), y el buscador ordena por cercanía (Articulación, 02/11/2026) |
| **HU-75** Elegir provincia y localidad de una lista | La empresa elige su localidad de una lista de 36; la provincia sale de ella (02/11/2026). Ampliar la lista es agregar filas a `database.sql` |
| **HU-76** Campos heredados del modelo cooperativo | Se sacaron la matrícula (16/09/2026), la cantidad de trabajadores por género y las tablas `sector` y `tipos_empresa` (14/11/2026). La federación quedó como *"Cámara o federación a la que pertenece"*, opcional |
