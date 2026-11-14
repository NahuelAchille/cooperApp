# Manual de uso · CooperApp

Cómo se usa CooperApp, contado para la persona que lo usa todos los días. Está
ordenado por **lo que querés hacer**: buscá tu caso en el índice y seguí los pasos.

> Si sos del equipo y querés instalarlo, eso está en el [README](../README.md).
> Si querés saber cómo está armada la base de datos, en el [modelo de datos](modelo-de-datos.md).

---

## Índice

- [Antes de empezar: quién puede hacer qué](#antes-de-empezar-quién-puede-hacer-qué)
- **Entrar**
  - [Registrar mi empresa](#registrar-mi-empresa)
  - [Entrar por primera vez](#entrar-por-primera-vez)
  - [Me olvidé la contraseña](#me-olvidé-la-contraseña)
- **La plata**
  - [Cargar algo que entró o salió](#cargar-algo-que-entró-o-salió)
  - [Ver lo que entró y salió](#ver-lo-que-entró-y-salió)
  - [Me equivoqué en un movimiento](#me-equivoqué-en-un-movimiento)
- **La mercadería**
  - [Cargar un producto](#cargar-un-producto)
  - [Registrar una venta](#registrar-una-venta)
  - [Registrar una compra](#registrar-una-compra)
  - [Registrar una rotura, un robo o un ajuste](#registrar-una-rotura-un-robo-o-un-ajuste)
  - [Ver cuánto hay y qué hay que reponer](#ver-cuánto-hay-y-qué-hay-que-reponer)
  - [Me equivoqué en una venta o una compra](#me-equivoqué-en-una-venta-o-una-compra)
- **Los servicios**
  - [Cargar un servicio](#cargar-un-servicio)
  - [Saber cuánto me deja cada servicio](#saber-cuánto-me-deja-cada-servicio)
- **Los números**
  - [Sacar un reporte](#sacar-un-reporte)
  - [Saber cuánto perdí](#saber-cuánto-perdí)
- **Otras empresas**
  - [Buscar quién me vende algo](#buscar-quién-me-vende-algo)
  - [Que otras empresas me encuentren](#que-otras-empresas-me-encuentren)
- **Para el administrador**
  - [Dar de alta a alguien que trabaja conmigo](#dar-de-alta-a-alguien-que-trabaja-conmigo)
  - [Prender o apagar partes del sistema](#prender-o-apagar-partes-del-sistema)
  - [Armar mis categorías](#armar-mis-categorías)
  - [Armar los motivos de stock](#armar-los-motivos-de-stock)
  - [Cambiar los datos de mi empresa](#cambiar-los-datos-de-mi-empresa)
- **Para el administrador de la plataforma**
  - [Aprobar una empresa nueva](#aprobar-una-empresa-nueva)
- [Palabras que usa el sistema](#palabras-que-usa-el-sistema)
- [Si algo no aparece](#si-algo-no-aparece)

---

## Antes de empezar: quién puede hacer qué

Cada persona entra con su propio email y su contraseña, y ve **sólo lo que le toca**.
Si no ves una opción del menú, casi siempre es por esto, no por un error.

| Si sos… | Podés |
|---|---|
| **Administrador** de la empresa | Todo: la plata, la mercadería, los servicios, los reportes, el buscador, las personas y la configuración |
| **Tesorero** | La plata: cargar movimientos, ver el balance y sacar reportes. También ver los servicios |
| **Operador** (depósito o mostrador) | La mercadería: productos, stock, ventas y compras. **De la plata sólo registra la de sus ventas y compras**: no ve el balance |

Además, cada empresa **prende sólo las partes del sistema que usa** (ver
[Prender o apagar partes del sistema](#prender-o-apagar-partes-del-sistema)). Una
parte apagada no aparece en el menú de nadie.

> **En el celular**, el menú está detrás del botón de las tres rayitas, arriba a la
> derecha. Las listas se ven como tarjetas, una abajo de la otra.

---

## Entrar

### Registrar mi empresa

1. Entrá a la página de inicio y tocá **Registrar mi empresa**.
2. Completá los **datos de la empresa** (nombre, email, CUIT y, si querés, el
   domicilio, la localidad y la cámara o federación a la que pertenece).
3. Completá los **datos del administrador**, que sos vos: nombre, apellido, DNI,
   email y una contraseña de 6 caracteres o más.
4. Tocá **Registrar**.

La empresa queda **esperando aprobación**: todavía no podés entrar. Cuando el
administrador de la plataforma la aprueba, ya podés ingresar con tu email y tu
contraseña.

> Si falta un dato o hay algo mal escrito, el formulario no se cierra: te marca en
> rojo qué campo corregir.

### Entrar por primera vez

Si el administrador de tu empresa te dio de alta, tu **contraseña es tu DNI**.

1. Entrá con tu email y tu DNI.
2. El sistema te pide que **elijas una contraseña nueva**. Hasta que no la cambies no
   podés hacer otra cosa.

### Me olvidé la contraseña

El sistema no manda correos. **Pedíselo al administrador de tu empresa**: en
*Usuarios* aprieta **Resetear contraseña** y tu contraseña vuelve a ser tu DNI.
Al entrar, el sistema te pide una nueva.

Si sos el administrador de la empresa y te olvidaste la tuya, se lo pedís al
administrador de la plataforma.

---

## La plata

Es la parte de **Movimientos**: todo lo que entró y salió de la caja.

### Cargar algo que entró o salió

*Administrador o tesorero.*

1. Andá a **Movimientos** y tocá **Nuevo movimiento** (o, desde el panel de inicio,
   **Registrar ingreso** o **Registrar egreso**).
2. Contestá **¿Qué pasó con la plata?**: **Entró** o **Salió**.
3. Elegí la **categoría** y el **tipo** (por ejemplo, *Gastos fijos › Luz*).
4. Escribí el **monto**, la **fecha** y, si querés, una descripción.
5. Si esa plata vino de un servicio que prestás o contratás, elegilo al final, en
   **¿Este movimiento es de algún servicio?** Casi siempre queda vacío.
6. Tocá **Registrar**.

> **¿Vendiste o compraste mercadería?** No la cargues acá: usá
> [Registrar una venta](#registrar-una-venta) o
> [Registrar una compra](#registrar-una-compra), que descuentan o suman el stock y
> registran la plata en un solo paso.

### Ver lo que entró y salió

En **Movimientos** ves la lista, lo último cargado arriba, y tres números: lo que
**entró**, lo que **salió** y el **balance** (la diferencia).

Con los **filtros** elegís el período (*Este mes*, *El mes pasado*, *Este año* o
fechas a mano), sólo lo que entró o sólo lo que salió, una categoría o un servicio.
Los números de arriba se recalculan con lo que filtraste.

> En el celular los filtros están detrás del botón **Filtros**, que dice cuántos
> tenés puestos.

### Me equivoqué en un movimiento

Los movimientos **no se borran ni se editan: se anulan**. Tocá el botón de
**Anular** en esa fila y confirmá.

- Un movimiento anulado **no suma en ningún total**, pero queda en la lista (con
  **Ver anulados**) para que se sepa qué pasó.
- **Anular no se puede deshacer.** Si te equivocaste, anulalo y cargalo de nuevo bien.

---

## La mercadería

Son las partes de **Productos** (qué vendés) y **Stock** (cuánto hay).

### Cargar un producto

*Administrador u operador.*

1. Andá a **Productos** y tocá **Nuevo producto**.
2. Escribí el **nombre**, elegí la **categoría** (y la subcategoría, si usás) y la
   **unidad de medida** (unidad, kg, litro…).
3. Opcionales, pero conviene completarlos:
   - **Precio de venta**: aparece ya escrito cuando registrás una venta.
   - **Stock mínimo**: cuando quedan menos que eso, el sistema te avisa que hay que
     reponer. En 0 no avisa.
   - **¿Cuánto te cuesta perder uno?** (el costo): sirve para saber cuánta plata se
     fue en roturas y robos.
4. Tocá **Guardar**.

> Si no aparece ninguna categoría para elegir, el administrador tiene que crearlas
> primero (ver [Armar mis categorías](#armar-mis-categorías)).

Un producto que ya no vendés no se borra: se **da de baja** y lo podés
**reactivar** cuando quieras.

### Registrar una venta

*Administrador u operador.* Descuenta la mercadería **y** registra la plata que
entró, en un solo paso.

1. Andá a **Stock** y tocá **Registrar una venta** (o el botón del carrito en la
   fila del producto, o desde el panel de inicio).
2. Contestá **¿Qué vendiste?**, **cuánto** y el **precio por unidad**. Si el producto
   tiene precio cargado, ya aparece escrito; si cobraste otro (un descuento), cambialo.
3. Revisá el **total de la venta**, la fecha y, si querés, el detalle (cliente,
   remito…).
4. Tocá **Registrar la venta**.

No se puede vender más de lo que hay: si el stock no alcanza, el sistema te dice
cuánto hay.

> Si el formulario dice que falta configurar **dónde cae la plata**, el administrador
> tiene que hacerlo una vez en [Motivos de stock](#armar-los-motivos-de-stock).

### Registrar una compra

*Administrador u operador.* Suma la mercadería **y** registra la plata que salió.

1. En **Stock**, tocá **Registrar una compra** (o el botón del camión en la fila).
2. Contestá **¿Qué compraste?**, **cuánto** y **lo que pagaste por unidad**. Aparece
   escrito el costo que tenía el producto.
3. Si pagaste un precio distinto, aparece tildada la casilla **Guardar $… como el
   costo**: así el costo del producto queda al día. Destildala si fue una compra rara.
4. Tocá **Registrar la compra**.

### Registrar una rotura, un robo o un ajuste

*Administrador u operador.* Para todo lo que entra o sale **sin ser una venta ni una
compra**: una rotura, un robo, consumo propio, mercadería vencida, o corregir el stock
cuando contaste y no coincide.

1. En **Stock**, tocá **Otra entrada o salida**.
2. Elegí el **producto**, el **motivo** (por ejemplo *Rotura* o *Ajuste positivo*) y
   la **cantidad**.
3. Tocá **Registrar**.

> **La primera vez** que cargás un producto, su stock está en *Sin cargar*. Para
> poner lo que ya tenías en el depósito, usá un **Ajuste positivo** con esa cantidad.

### Ver cuánto hay y qué hay que reponer

En **Stock**, la pestaña **Existencias** muestra cuánto hay de cada producto y, si
hace falta, un cartel:

| Cartel | Qué quiere decir |
|---|---|
| **Sin cargar** | Nunca se le cargó nada. Ver la nota de arriba |
| **Sin stock** | Tuvo y se terminó |
| **Reponer** | Hay menos que el stock mínimo |
| **Revisar** | La cuenta dio negativa, algo se cargó mal: revisá sus entradas y salidas |
| *(sin cartel)* | Hay suficiente |

El panel de inicio también muestra cuántos productos hay que reponer. La pestaña
**Entradas y salidas** es el historial: qué entró, qué salió, por qué y quién lo
cargó.

### Me equivoqué en una venta o una compra

En **Stock → Entradas y salidas**, tocá **Anular** en esa fila.

- **Se anula también su plata.** El cartel te dice cuánta plata se va antes de
  confirmar.
- La existencia se corrige sola.
- No se puede anular una entrada si esa mercadería ya se vendió (el stock quedaría
  negativo): primero hay que anular las ventas posteriores.
- **Anular no se puede deshacer.**

---

## Los servicios

Un servicio es algo que tu empresa **presta o contrata** y que no se guarda en un
depósito: un flete, una reparación, un mantenimiento.

### Cargar un servicio

*Administrador.* En **Servicios**, tocá **Nuevo servicio**, escribí el nombre, elegí
la categoría y guardá. Un servicio no lleva unidad ni stock.

Después, cada vez que cargues una plata que vino de ese servicio, elegilo en
**¿Este movimiento es de algún servicio?** (ver
[Cargar algo que entró o salió](#cargar-algo-que-entró-o-salió)).

### Saber cuánto me deja cada servicio

*Administrador o tesorero.* En **Servicios**, tocá **Cuánto deja cada uno**: te lleva
a Movimientos con la lista de servicios, lo que cobraste, lo que pagaste y lo que
**deja** cada uno en el período, del que más deja al que menos.

---

## Los números

### Sacar un reporte

*Administrador o tesorero.*

1. Andá a **Reportes**.
2. Elegí **¿De qué período?**: *Este mes*, *El mes pasado*, *Este año* u *Otras
   fechas*.
3. Elegí **¿Cómo querés verlo?**: *Uno por uno*, *Por categoría*, *Por producto* o
   *Por servicio*.
4. Para guardarlo o mandarlo, tocá **Descargar para Excel** o **Descargar en PDF**.
   El archivo lleva el nombre de la empresa y el período.

Los movimientos **anulados no entran** en el reporte, y el reporte avisa cuántos son.

### Saber cuánto perdí

En **Reportes**, elegí **Lo que se perdió**. Muestra cuánta plata se fue en
mercadería que salió sin venderse (roturas, robos, consumo, ajustes), valuada a lo que
costó, **por motivo** y **por producto**.

- **No se resta del balance**: esa mercadería ya se pagó cuando se compró.
- Los productos **sin costo cargado** se cuentan aparte: el total es *"ese número y
  algo más"*. Para que no pase, cargales el costo.

---

## Otras empresas

Es la parte de **Articulación**.

### Buscar quién me vende algo

1. Andá a **Articulación** (o usá el buscador del panel de inicio).
2. En **¿Qué necesitás?** escribí lo que buscás, por ejemplo *papel*. Si querés,
   elegí un **rubro**.
3. Aparecen las empresas que lo ofrecen, **de la más cercana a la más lejana**.
4. Tocá una para ver su **ficha**: dónde está, qué ofrece, cómo contactarla y un mapa
   aproximado de su zona.

> Para que el orden por cercanía funcione, tu empresa tiene que tener cargada su
> **localidad** (en *Mi empresa*).

### Que otras empresas me encuentren

*Administrador.*

1. En **Productos** o **Servicios**, editá lo que querés ofrecer, tildá **Mostrar a
   otras empresas** y elegí su **rubro**.
2. En **Mi empresa**, elegí **qué ven las otras empresas en tu ficha**: el email, el
   teléfono y el domicilio. La localidad se ve siempre.
3. Con **Ver mi ficha como la ven las demás** podés controlar cómo quedó.

**Las otras empresas nunca ven** tu stock, tus costos, tus precios ni nada de tu plata.

---

## Para el administrador

### Dar de alta a alguien que trabaja conmigo

1. Andá a **Usuarios** y tocá **Nuevo usuario**.
2. Completá nombre, apellido, email y DNI, y elegí su **rol**: *tesorero* u
   *operador*.
3. Guardá y **avisale que su contraseña es su DNI**. Al entrar, el sistema le pide
   una nueva.

Desde la misma lista podés **editar** sus datos, **resetear** su contraseña o **darlo
de baja** (deja de poder entrar en el momento). Una baja se puede **reactivar**.

### Prender o apagar partes del sistema

En **Configuración → Módulos del sistema** prendés o apagás cada parte:
*Productos*, *Servicios*, *Reportes* y *Articulación*. *Movimientos* no se puede apagar:
es la base.

**Apagar no borra nada**: sólo lo esconde del menú. Si lo volvés a prender, está todo
como lo dejaste.

### Armar mis categorías

En **Configuración** están las de cada parte:

- **Categorías de movimientos**: cómo se ordena la plata. Cada categoría es de lo
  que entra o de lo que sale, y adentro tiene **tipos** (por ejemplo *Gastos fijos* →
  *Luz*, *Gas*, *Internet*). La empresa arranca con unas cuantas ya cargadas.
- **Categorías de productos** y **de servicios**: cómo se ordena tu catálogo. Las
  subcategorías son opcionales.

Lo que ya no usás se **da de baja** (no se borra). Si das de baja una categoría, se
van con ella sus tipos o subcategorías; al reactivarla vuelven, **menos los que
habías dado de baja vos antes**.

### Armar los motivos de stock

En **Configuración → Motivos de stock** están las razones por las que se mueve la
mercadería. Cada motivo dice:

- **¿Qué le hace al stock?**: suma (entrada) o resta (salida).
- **¿Qué le hace al dinero?**: entra plata, sale plata o nada.
- Si mueve plata, **¿en qué categoría de movimientos va esa plata?** Se elige una
  sola vez, y por eso al vender no hay que clasificar nada.

Por ejemplo: *Venta* resta stock y entra plata; *Compra* suma stock y sale plata;
*Rotura* resta stock y no mueve plata.

> Una vez que un motivo se usó, ya no se puede cambiar si suma o resta (cambiaría
> todo el historial). El nombre y la categoría de la plata, sí.

### Cambiar los datos de mi empresa

En el menú de tu nombre (arriba a la derecha), **Mi empresa**: el nombre, el email de
contacto, el teléfono, el domicilio, la **localidad** y qué ven las otras empresas. El
CUIT no se puede cambiar.

---

## Para el administrador de la plataforma

### Aprobar una empresa nueva

Entrás a **Empresas**. En la pestaña **Para aprobar** están las que se registraron.

1. Tocá **Ver datos** para ver dónde está y cómo contactarla.
2. Tocá **Aprobar**. Desde ese momento su administrador puede entrar, y la empresa
   arranca con categorías y motivos de stock ya cargados.
3. Si no corresponde, **Rechazar**: nadie de esa empresa puede entrar. No se borra
   nada, y desde **Todas** se puede **Habilitar de nuevo**.

En **Todas** también podés **resetear la contraseña** del administrador de una
empresa: vuelve a ser su DNI.

---

## Palabras que usa el sistema

| Palabra | Qué quiere decir |
|---|---|
| **Entró / Salió** | Plata que entró a la caja o salió de ella |
| **Movimiento** | Un registro de plata (en *Movimientos*) |
| **Entradas y salidas** | Los registros de mercadería (en *Stock*) |
| **Anular** | Un movimiento ya cargado deja de contar. **No se deshace** |
| **Dar de baja / Reactivar** | Dejar de usar algo (un producto, una categoría, una persona) y volver a usarlo. **Sí se deshace** |
| **Existencia** | Cuánto hay de un producto ahora |
| **Stock mínimo** | Debajo de esto, el sistema avisa que hay que reponer |
| **Costo** | Lo que te cuesta a vos una unidad |
| **Precio de venta** | Lo que le cobrás al cliente por una unidad |
| **Motivo** | Por qué entra o sale mercadería |
| **Módulo** | Una parte del sistema que se prende o se apaga |
| **Rubro** | La lista común que usan todas las empresas para encontrarse en el buscador |

---

## Si algo no aparece

| Lo que pasa | Por qué | Qué hacer |
|---|---|---|
| No veo una opción en el menú | Tu rol no la usa, o esa parte está apagada en tu empresa | Preguntale al administrador |
| La pantalla dice que *el módulo no está activo* | La empresa no tiene esa parte prendida | El administrador la prende en *Módulos del sistema* |
| La pantalla dice que *no tenés permiso* | Tu rol no puede hacer eso | Lo hace otra persona de la empresa |
| No puedo entrar y la empresa es nueva | Todavía no la aprobaron | Esperá la aprobación |
| No hay categorías para elegir | No se crearon, o están dadas de baja | El administrador las arma en *Configuración* |
| La venta dice que falta configurar dónde cae la plata | El motivo de venta no tiene categoría | El administrador la elige en *Motivos de stock* |
| No puedo vender: dice que no alcanza el stock | Se está vendiendo más de lo que hay | Revisá la existencia o cargá lo que entró |
| Todo aparece vacío de golpe | La sesión quedó vieja | Cerrá sesión y volvé a entrar |
