# Informe de QA — CooperApp

- **Fecha:** 13/09/2026
- **Sprint que se estaba cerrando:** Sprint 06 — "Cambio de rumbo: correcciones, renombrado y módulos activables" (período 14/09 al 20/09)
- **Alcance auditado:** todo lo implementado al cierre del Sprint 06 (ver CLAUDE.md sección 3): registro y aprobación de empresas, login y sesiones, cambio y reseteo de contraseñas, ABM de usuarios, control de acceso por rol, perfil de empresa, categorías y tipos de movimiento, movimientos (alta/listado/resumen/anulación), dashboard con datos reales, y activación de módulos por empresa.

## Conteo de hallazgos por severidad

| Severidad | Cantidad |
|---|---|
| CRÍTICO | 1 |
| ALTO | 3 |
| MEDIO | 4 |
| BAJO | 4 |
| **Total** | **12** |

Aparte, se listan candidatos de usabilidad (a validar con usuarios reales, no cuentan como hallazgos formales).

## Nota de método

El **navegador in-app resultó estar pegándole a otra instancia del backend** (ahí `elena` figuraba como empresa 29 / usuario 187, mientras que en la base recién sembrada es empresa 4 / usuario 24). Por eso las confirmaciones se hicieron donde se controlaba el entorno: **base de datos (`mysql.exe`) y API (`curl`) sobre el host**, que es donde aparecieron los problemas serios de este proyecto según la propia bitácora. En cada hallazgo se aclara si se confirmó ejecutándolo o quedó como sospecha / lectura de código.

El entorno se levantó recreando la base desde cero con `database.sql` + `datos_de_prueba.sql` y corriendo `node app.js`. Al terminar, la base se restauró a su estado original (4 empresas ids 1–4, 28 usuarios, 25 movimientos). No se modificó código ni datos de prueba.

---

## CRÍTICO

### C1 · XSS almacenado anónimo que se ejecuta en el navegador del superadmin

**Qué pasa:** cualquiera, sin estar logueado, registra una empresa y mete código JS en el nombre (o email, domicilio, federación). Cuando el **superadmin** abre su panel, ese código se ejecuta en su sesión.

**Reproducción (confirmada a nivel de almacenamiento + código):**
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "empresa_nombre":"<img src=x onerror=\"document.title=1\">Evil SA",
  "empresa_email":"evil@xss.test","empresa_cuit":"30999888777","empresa_matricula":"999888",
  "nombre":"Eve","apellido":"H","email":"eve@xss.test","dni":"98765432",
  "password":"hackme1","password_confirm":"hackme1"}' http://localhost:3000/users/register
```
Se verificó que el payload queda **crudo** en la base (`SELECT nombre FROM empresas` devuelve el `<img onerror>` textual). Y en `superadmin.html:161` el panel arma la tabla así:
```js
container.innerHTML = `... <td><strong>${c.nombre}</strong></td> <td>${c.cuit}</td> <td>${c.email}</td> ...`
```
Sin `esc()`. Lo mismo en `cargarTodas()` (`superadmin.html:211`) y `verDetalle()` (`superadmin.html:239`) — este último además vuelca `matricula`, `domicilio` y `federacion`, todos controlados por el atacante.

**Esperado:** el nombre se muestra como texto.
**Pasó:** se inyecta HTML/JS ejecutable.

**Por qué importa:** el superadmin es la cuenta más poderosa (aprueba empresas, resetea contraseñas de administradores). Un anónimo que le ejecuta JS puede, en nombre del superadmin y sin que se entere: aprobar empresas, resetear/robar contraseñas de admins, y leer los datos de contacto de todas las empresas. Es toma de control de la plataforma disparada desde un formulario público.

**Estado:** confirmado que el payload se guarda crudo (curl + DB) y que el código lo interpola sin escapar (lectura de código). No se pudo ver "explotar" en pantalla porque el navegador in-app pega a otra instancia; el mecanismo (`<img onerror>` dentro de `innerHTML`) es determinístico, no depende del entorno.

---

## ALTO

### A1 · `GET /users` no controla rol: cualquier operador ve DNI y estado de contraseña de toda la empresa

**Qué pasa:** el listado de usuarios sólo pide estar logueado, no un rol. Un operador (que no debería entrar a gestión de usuarios) obtiene el roster completo **con el DNI de cada uno y quién tiene contraseña temporal**.

**Reproducción (confirmada):**
```bash
# jorge = operador
curl -b jorge.txt http://localhost:3000/users
```
Devuelve 200 con `dni` y `debe_cambiar_password` de los 7 usuarios. En `user.routes.js:15`: `router.get('/', requireLogin, userController.getUsuariosEmpresa)` — falta `requireRol('admin_empresa')`.

**Esperado:** el operador no debería poder listar los usuarios de la empresa (no tiene esa función).
**Pasó:** obtiene el listado completo con datos personales y de seguridad.

**Por qué importa:** el DNI es dato personal y —peor— es la contraseña temporal (ver A2). Este endpoint le entrega al operador exactamente el mapa para tomar cuentas: quién tiene clave temporal y cuál es esa clave. (El dashboard lo usa sólo para contar usuarios activos, pero expone todo.)

**Estado:** confirmado ejecutándolo.

### A2 · Toma de cuentas nuevas o reseteadas (contraseña temporal = DNI, sin límite de intentos y sin bloqueo del cambio obligatorio)

**Qué pasa:** una cuenta recién creada o reseteada tiene como contraseña el DNI del usuario. Cruzando con A1, cualquiera de la empresa puede entrar como esa persona antes de su primer login.

**Reproducción (confirmada, end-to-end):**
```bash
# 1) Marta (admin) crea un tesorero -> "Contraseña temporal: 33444555"
# 2) jorge (operador) lee /users y ve ese DNI + debe_cambiar=1
# 3) jorge entra como el tesorero:
curl -c robo.txt -d '{"email":"nuevotes@laesperanza.com.ar","password":"33444555"}' \
     -H "Content-Type: application/json" http://localhost:3000/users/login   # -> redirect OK
# 4) con esa sesión accede a la plata (que como operador tenía prohibida):
curl -b robo.txt http://localhost:3000/movimientos/resumen   # -> 200, totales
# 5) cambia la contraseña sin conocer la anterior -> deja afuera al dueño real:
curl -b robo.txt -d '{"password_nuevo":"tomada123","password_confirm":"tomada123"}' \
     -H "Content-Type: application/json" http://localhost:3000/users/cambiar-password
```
Dos gaps que lo habilitan, ambos confirmados:
- **El cambio obligatorio es sólo un `redirect` del front.** La API no bloquea a un usuario con `debe_cambiar_password=1`: `claudia` (clave temporal) llamó a `/users` y `/users/me` con 200. Ver `user.controller.js:82` (login setea sesión completa y sólo sugiere la pantalla).
- **No hay límite de intentos de login** (además el DNI es semi-público).

Un caso puntual feo: cuando el **superadmin resetea a un admin_empresa**, ese admin queda con clave = su DNI, y su DNI es visible en el roster para los operadores de su propia empresa → un operador puede escalar a admin_empresa en la ventana entre el reseteo y el primer login del admin.

**Esperado:** una cuenta con contraseña temporal no debería ser usable por terceros ni operar por API sin antes cambiar la clave.
**Pasó:** se toma la cuenta con sólo conocer el DNI (que A1 expone), se opera con ese rol y se puede dejar afuera al dueño real.

**Por qué importa:** es escalada de privilegios y toma de cuentas dentro de la empresa, sobre un sistema que maneja plata. El atacante no necesita nada más que estar logueado con el rol más bajo.

**Estado:** confirmado ejecutándolo.

### A3 · Registro no atómico: una falla al guardar deja la empresa huérfana y "quema" su email/CUIT/matrícula

**Qué pasa:** el registro crea primero la empresa y después el usuario admin, sin transacción. Si el `INSERT` del usuario falla (error de base, o **se corta la conexión mientras guarda**), la empresa queda creada con 0 usuarios.

**Reproducción (confirmada):** se mandó un registro con datos de empresa válidos pero email de usuario de 200+ caracteres (rompe en el `INSERT usuarios`):
```bash
# empresa_email orphan@test.test, email de usuario de 200 chars
curl -X POST ... http://localhost:3000/users/register   # -> {"error":"Error del servidor"}
```
```sql
SELECT nombre, estado, (SELECT COUNT(*) FROM usuarios u WHERE u.id_empresa=e.id_empresa)
FROM empresas e WHERE email='orphan@test.test';
-- Orphan Test SA | pendiente | 0   <-- empresa sin admin
```
Reintentar el registro bien formado con el mismo email da `"Ya existe una empresa con ese email"`. Ver `register.controller.js:45-60`.

**Esperado:** si falla algo, no queda nada a medias.
**Pasó:** empresa fantasma, y el email/CUIT/matrícula (todos `UNIQUE`) quedan ocupados, así que el usuario legítimo no puede volver a registrarse. Si además el superadmin la aprueba, `activarUsuarioAdmin` no hace nada (no hay admin) → empresa aprobada a la que **nadie puede entrar nunca**.

**Por qué importa:** corrupción de integridad disparable por un corte de red durante el guardado, en el flujo de entrada al sistema. Encaja con el patrón que ya mordió a este proyecto (la API "responde" pero la base quedó inconsistente).

**Estado:** confirmado ejecutándolo.

---

## MEDIO

### M1 · Las fechas se muestran un día antes (zona horaria)

**Qué pasa:** el listado de movimientos y el dashboard muestran cada movimiento fechado **un día antes** del que se cargó.

**Causa:** `movimientos.html:379` y `dashboard.html:110` hacen `new Date(m.fecha).toLocaleDateString('es-AR')`. `new Date('2026-09-10')` se interpreta como medianoche **UTC**; en Argentina (UTC-3) eso es el 9 a las 21:00.

**Reproducción (confirmada a nivel de motor, la máquina está en UTC-3, offset 180):**
```bash
node -e "console.log(new Date('2026-09-10').toLocaleDateString('es-AR'))"  # -> 9/9/2026
```
**Esperado:** un movimiento cargado el 10/09 se muestra como 10/09.
**Pasó:** se muestra como 09/09.

**Por qué importa:** es plata con fecha. Un movimiento del día 1 se ve como el último día del mes anterior, lo que descoloca la lectura de "movimientos del mes". La fecha guardada en la base **está bien** (verificado); el error es sólo de visualización, por eso es MEDIO y no crítico. Ojo: el alta (`parsearFecha`, `fechaDeHoy`) sí está bien resuelta sin `Date`; el bug quedó únicamente en el render.

**Estado:** confirmado a nivel de motor (mismo offset que corre el navegador en AR). No se vio en pantalla por lo del navegador in-app.

### M2 · XSS almacenado en el listado de usuarios (misma empresa)

**Qué pasa:** `usuarios.html:280` vuelca `${u.nombre} ${u.apellido}`, `${u.email}` y `${u.dni}` a `innerHTML` **sin `esc()`** (la página ni siquiera define `esc`). Si un usuario se crea con un nombre tipo `<img onerror=...>`, se ejecuta cuando el admin abre la pantalla de Usuarios.

**Esperado:** los nombres se muestran como texto.
**Pasó:** interpolación directa a `innerHTML`, sin escapar.

**Por qué importa:** hoy el único rol que crea/edita usuarios es el admin, así que es mayormente auto-infligido (menor que C1). Pero es la misma clase de bug que ya arreglaron en `movimientos`/`dashboard` y quedó pendiente acá; se vuelve explotable en serio apenas se agregue auto-edición de perfil. Conviene llevar la función `esc()` también a esta pantalla y al superadmin.

**Estado:** confirmado por lectura de código (no hay `esc()` y la interpolación es directa).

### M3 · "Rechazar" empresa: sin confirmación, irreversible desde la UI, y se confunde con "suspendida"

**Qué pasa:** en el panel del superadmin, `rechazar()` (`superadmin.html:270`) dispara el `PUT .../rechazar` **sin ningún cartel de confirmación**, y setea el estado a `'suspendida'`. Una empresa rechazada desaparece de "Pendientes" y en "Todas" no tiene botón para volver a aprobarla (`cargarTodas` sólo muestra "Resetear contraseña").

**Esperado:** una acción que bloquea a toda una empresa debería confirmarse, y debería poder revertirse desde la interfaz.
**Pasó:** se ejecuta a un clic, sin aviso, y no hay camino de vuelta en la UI.

**Por qué importa:** rechazar bloquea el ingreso de todos los usuarios de esa empresa, es a un clic y sin aviso. Y como "rechazada" y "suspendida" son el mismo estado, no se distingue una empresa que nunca entró de una que fue dada de baja. Recuperarla sólo se puede por API o tocando la base.

**Estado:** confirmado por lectura de código (y se verificó que `aprobar` sí revierte una `suspendida` vía API, pero la UI no ofrece ese camino).

### M4 · `crearUsuario` no valida el formato del email

**Qué pasa:** al crear usuario se acepta cualquier cosa como email; `actualizarUsuario` sí valida.

**Reproducción (confirmada):**
```bash
curl -b marta.txt -X POST -H "Content-Type: application/json" \
  -d '{"nombre":"X","apellido":"Y","email":"esto no es un email","dni":"66778899","id_rol":3}' \
  http://localhost:3000/users    # -> "Usuario creado"
```
Quedó guardado `email = 'esto no es un email'`. Ver `user.controller.js:125` (sólo chequea presencia).

**Esperado:** rechazar un email con formato inválido, como hace la edición.
**Pasó:** se guarda el usuario con un email inválido.

**Por qué importa:** dato sucio en la base y, si a futuro el email se usa para algo, cuenta rota.

**Estado:** confirmado ejecutándolo.

---

## BAJO

### B1 · Cookie de sesión sin `SameSite`

**Qué pasa:** la cookie tiene `HttpOnly` pero no `SameSite`. Habilita CSRF en peticiones que cambian estado por GET, como `/users/logout`. Además el `secret` de sesión está hardcodeado en `app.js:13`.

**Por qué importa:** en un proyecto 100% local el riesgo es acotado, pero conviene fijar `sameSite:'lax'` y sacar el secret del código.

**Estado:** confirmado por inspección del header `Set-Cookie` y del código.

### B2 · Validación de tipo laxa en el monto

**Qué pasa:** `monto: true` se guarda como `1.00` (`Number(true)===1`).

**Por qué importa:** muy improbable desde la UI, pero la validación no rechaza booleanos. Ver `movimiento.controller.js:10`. (En cambio `-500`, `"abc"`, `""`, `0.001`, `[1,2]`, vacío y montos fuera de rango se rechazan bien; los decimales redondean correcto a 2.)

**Estado:** confirmado ejecutándolo.

### B3 · Sin límite de intentos de login

**Qué pasa:** no hay bloqueo ni retardo tras intentos fallidos.

**Por qué importa:** refuerza A2 (facilita adivinar/probar DNIs como contraseña temporal).

**Estado:** confirmado (no existe el mecanismo).

### B4 · Mensaje `"Error del servidor"` (500) poco orientativo

**Qué pasa:** cuando la matrícula excede `INT` (>2.147.483.647) o un campo supera el largo de la columna, la respuesta es un 500 genérico.

**Por qué importa:** no le dice al usuario qué corregir.

**Estado:** confirmado ejecutándolo.

---

## Usabilidad (candidatos — validar con usuarios reales, no con criterio propio)

Se marcan como sospechas a chequear con gente de oficio, 35-55 años, baja cultura digital:

- **Rechazar sin confirmación** (M3): una acción que bloquea a toda una empresa no debería ser un clic sin aviso.
- **"Error del servidor"** (B4) y en general los 500 no orientan a la persona sobre qué hacer.
- Bien resuelto y confirmado: la pantalla **distingue "módulo apagado" de "sin permiso"**, y los accesos rápidos de plata sólo se ofrecen a quien después puede usarlos.

---

## Lo que quedó bien probado (y aguantó)

- **Aislamiento entre empresas:** 13 intentos de tocar categorías, tipos, movimientos y usuarios de otra empresa con ids ajenos armados a mano → los 13 rebotan (404 / 403 / `[]`). Sólido.
- **Permisos por rol en la API** (salvo A1): superadmin, admin_empresa, tesorero y operador dan lo que corresponde en GET y en las mutaciones; escalar `id_rol` a 1 o 4 al crear usuario está bloqueado; tesorero/operador no pueden editar la empresa ni gestionar usuarios; sin sesión todo da 401.
- **Usuario dado de baja / empresa suspendida:** no pueden *loguearse de nuevo*. (Pero ojo: **con la sesión ya abierta siguen operando** hasta que expire —se probó: un tesorero dado de baja cargó y anuló movimientos, y el admin de una empresa suspendida cargó un movimiento—. No se subió a hallazgo formal porque es una decisión de diseño de sesiones en memoria, pero conviene tenerlo presente: la baja/suspensión no corta sesiones vivas.)
- **Cálculos:** el `/movimientos/resumen` coincide exacto con la suma real de la base; los anulados no suman; desactivar una categoría **no** borra sus totales históricos (correcto).
- **Fechas en el alta:** valida formato, bisiestos (29/02/2024 ok, 29/02/2025 rechazado), futuro y pasado lejano, todo sin depender de la zona horaria.
- **Enforcement de módulos del lado del servidor:** con `movimientos` apagado por SQL, `/movimientos` y `/categorias` dan 403 y la otra empresa sigue entrando.
- **Acentos y ñ:** guardan y leen bien de punta a punta (los "caracteres raros" son de la consola, no de la app; se verificaron los bytes en la base).

## Lo que NO se llegó a cubrir (honestidad)

- **Confirmación visual en el navegador** de C1 (ejecución del XSS) y M1 (fecha en pantalla): el navegador in-app pega a otra instancia del backend, así que ambos quedan confirmados por código + motor, no por captura. Se puede confirmar abriendo el navegador real contra `localhost:3000`.
- **Productos, Servicios, Reportes, Articulación:** no implementados, nada que probar.
- **Concurrencia real de dos pestañas** más allá del razonamiento (anular es idempotente; el doble-alta por doble clic no tiene protección, esperable sin clave de idempotencia).
- **Volumen/rendimiento** con muchos movimientos.

---

## Prioridad sugerida

Para no construir encima de cimientos torcidos: **C1** (escapar salida en el panel del superadmin), **A1 + A2** (restringir `GET /users` por rol y repensar la contraseña temporal / bloquear la API mientras `debe_cambiar_password=1`) y **A3** (transacción en el registro). Los tres tocan los cimientos sobre los que van a apoyarse Productos, Servicios y Reportes.


---

# Resultado de las correcciones (13/09/2026)

Cerrado en el chat de desarrollo el mismo día. Cada corrección se verificó
reproduciendo primero el hallazgo del informe.

| # | Hallazgo | Resultado |
|---|---|---|
| C1 | XSS almacenado en el panel del superadmin | **Corregido.** Verificado en el navegador: el payload no se ejecuta, 0 elementos inyectados en los tres vectores (pendientes, "todas" y modal de detalle) |
| A1 | `GET /users` sin control de rol | **Corregido.** Ahora exige `admin_empresa`; tesorero, operador y superadmin reciben 403 |
| A2 | Toma de cuentas con contraseña temporal | **Corregido en parte** (ver abajo) |
| A3 | Registro no atómico | **Corregido.** Empresa y administrador se crean en una transacción; el caso del informe ya no deja empresa huérfana y el email queda libre para reintentar |
| M1 | Fechas un día antes | **Falso positivo.** La API devuelve `2026-09-10T03:00:00.000Z`, no `2026-09-10`; con ese formato la fecha sale correcta. Verificado comparando pantalla contra base: coinciden |
| M2 | XSS en el listado de usuarios | **Corregido.** Escapado el listado y los modales de baja/reactivación |
| M3 | Rechazar sin confirmación e irreversible | **Corregido.** Pide confirmación explicando la consecuencia, y "Todas las empresas" ofrece *Habilitar de nuevo* |
| M4 | `crearUsuario` no valida el email | **Corregido.** Valida email y, de paso, DNI, igual que la edición |
| B1 | Cookie sin `SameSite` | **Corregido** el `SameSite` y el `httpOnly` explícito. El *secret* en el código va al backlog (HU-82) |
| B2 | `monto: true` se guardaba como 1.00 | **Corregido.** Sólo se aceptan números o texto numérico |
| B3 | Sin límite de intentos de login | **Al backlog (HU-81).** Ver abajo |
| B4 | Error 500 poco orientativo | **Corregido.** Matrícula, CUIT, DNI y emails se validan antes de tocar la base, con mensajes que dicen qué corregir |

## Subido de categoría respecto del informe

El informe mencionó, dentro de "lo que aguantó", que **un usuario dado de baja o de
una empresa suspendida sigue operando con la sesión abierta**, y lo dejó fuera de los
hallazgos formales por considerarlo una decisión de diseño.

**Se lo trató como hallazgo y se corrigió.** Si se da de baja a alguien es, casi
siempre, porque dejó la empresa o hubo un problema: que siga cargando y anulando
movimientos durante ocho horas es un agujero real en un sistema que maneja plata.
`requireLogin` ahora revalida contra la base en cada pedido el estado del usuario, el
de su empresa y si tiene contraseña pendiente de cambio.

## Encontrado durante la corrección (no estaba en el informe)

- **`superadmin.html` leía `dataset.coop` pero el atributo se llama `data-empresa`**
  desde el renombrado del 13/09. El nombre de la empresa salía vacío en el modal de
  reseteo de contraseña. Corregido.
- **El detalle de empresa metía el objeto entero en un atributo `onclick`**
  (`onclick="verDetalle(${JSON.stringify(c)...})"`). Además del XSS de C1, eso se
  rompe con cualquier comilla en el nombre. Reemplazado por pasar sólo el id.

## Lo que NO se corrigió, y por qué

**A2, segunda parte: la contraseña temporal sigue siendo el DNI.** Se cerró el vector
principal (un operador ya no puede leer el roster para conseguir DNIs, y una cuenta con
contraseña temporal no puede operar hasta cambiarla). Pero quien conozca el DNI de un
usuario recién creado todavía puede entrar antes que él y cambiarle la clave.

Reemplazarlo por un código al azar es la solución correcta desde la seguridad, **pero
cambia cómo trabaja la gente**: hoy el administrador dice "tu contraseña es tu DNI",
que para usuarios con poca experiencia digital es mucho más simple que transmitir un
código generado. Es una decisión de producto, no técnica, y la toma el equipo. Queda
como **HU-80**.

**B3, límite de intentos de login → HU-81.** Con A1 y A2 cerrados el vector principal
está cortado, y el sistema es 100% local sin exposición a internet. Implementarlo bien
requiere llevar estado de intentos, que es trabajo real sin beneficio inmediato en este
contexto.

**El *secret* de sesión hardcodeado → HU-82.** Sacarlo del código implica manejo de
configuración de entorno, que el proyecto deliberadamente no tiene. Sin deploy, el
riesgo es acotado.

## Regresión posterior a las correcciones

Se recreó la base desde cero y se verificó que nada de lo anterior se haya roto:

- Aislamiento entre empresas: 7 intentos con ids ajenos (movimientos, categorías,
  tipos, usuarios, reseteo y baja) → los 7 rebotan.
- Permisos por rol en las cinco áreas, y sin sesión todo 401.
- Validaciones de monto y fecha, cascada de categorías, control de módulos del lado
  del servidor, y alta de empresa con su configuración inicial.
- Integridad en la base: 0 montos en cero, 0 fechas futuras, 0 empresas sin
  administrador, 0 emails inválidos.
- Las nueve pantallas cargan sin errores de sintaxis, y el dashboard del tesorero ya
  no pide el listado de usuarios.
- Mobile a 375 px sin scroll horizontal.
