-- Los acentos del archivo se interpretan bien sin necesidad de pasar opciones
-- en la linea de comandos. Importar simplemente con:  mysql -u root < database.sql
SET NAMES utf8mb4;

-- El juego de caracteres va explicito: sin esto MariaDB usa el del servidor
-- (latin1 en XAMPP), que no cubre simbolos como el euro ni emojis.
CREATE DATABASE IF NOT EXISTS cooperApp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cooperApp;

-- =============================================
-- ROLES Y PERMISOS
-- =============================================

CREATE TABLE roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  activo TINYINT(1) DEFAULT 1
);

CREATE TABLE permisos (
  id_permiso INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE rol_permisos (
  id_rol INT NOT NULL,
  id_permiso INT NOT NULL,
  PRIMARY KEY (id_rol, id_permiso),
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol),
  FOREIGN KEY (id_permiso) REFERENCES permisos(id_permiso)
);

-- =============================================
-- UBICACIÓN
-- =============================================

CREATE TABLE pais (
  id_pais INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL
);

CREATE TABLE provincias (
  id_provincia INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  id_pais INT NOT NULL,
  FOREIGN KEY (id_pais) REFERENCES pais(id_pais)
);

-- Las coordenadas son las del CENTRO de la localidad, aproximadas. Sirven
-- para ordenar el buscador entre empresas por cercania (Articulacion) sin
-- depender de ningun servicio externo: la empresa elige su localidad de una
-- lista y la distancia se calcula entre localidades. Es aproximado a
-- proposito -- dos empresas de la misma localidad quedan igual de cerca --
-- porque marcar un pin en un mapa es mucho pedir a este publico.
CREATE TABLE localidades (
  id_localidad INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  id_provincia INT NOT NULL,
  latitud  DECIMAL(9,6) NULL,
  longitud DECIMAL(9,6) NULL,
  FOREIGN KEY (id_provincia) REFERENCES provincias(id_provincia)
);

-- =============================================
-- EMPRESAS
-- =============================================

CREATE TABLE empresas (
  id_empresa INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  cuit BIGINT NOT NULL UNIQUE,
  -- El 14/11/2026 se sacaron otros restos del planteo para cooperativas: las
  -- tablas "sector" y "tipos_empresa" (nunca se cargaron ni las uso ninguna
  -- pantalla) con sus columnas, y la cantidad de trabajadores por genero
  -- (cantidadTrabajadores, cantidadMujer, cantidadHombre, cantidadDiversidad),
  -- un dato que informa el sector cooperativo y que la app no usaba para nada.
  -- La matricula se saco el 16/09/2026: era un dato del mundo cooperativo
  -- (numero de inscripcion en el INAES) y el producto ahora apunta a empresas
  -- en general. Una S.R.L., un monotributista o un negocio chico no tienen.
  -- El dato registral obligatorio es el CUIT, que ya esta arriba.
  -- Opcional: la camara o federacion a la que pertenece la empresa, si es que
  -- pertenece a alguna. Nunca fue obligatorio.
  federacion VARCHAR(255),
  domicilio VARCHAR(255),
  telefono VARCHAR(30),
  -- Que datos de contacto ven las OTRAS empresas en su ficha del buscador
  -- (Articulacion). El email y el telefono vienen prendidos: son el contacto
  -- comercial, y una ficha sin contacto no sirve para nada. El domicilio viene
  -- apagado, porque puede ser una casa particular; la localidad se ve siempre.
  mostrar_email     TINYINT(1) NOT NULL DEFAULT 1,
  mostrar_telefono  TINYINT(1) NOT NULL DEFAULT 1,
  mostrar_domicilio TINYINT(1) NOT NULL DEFAULT 0,
  id_pais INT,
  id_localidad INT,
  id_provincia INT,
  estado ENUM('pendiente', 'activa', 'suspendida') DEFAULT 'pendiente',
  FOREIGN KEY (id_pais) REFERENCES pais(id_pais),
  FOREIGN KEY (id_provincia) REFERENCES provincias(id_provincia),
  FOREIGN KEY (id_localidad) REFERENCES localidades(id_localidad)
);

-- =============================================
-- USUARIOS
-- =============================================

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  dni VARCHAR(20) NOT NULL UNIQUE,
  fecha_nacimiento DATE,
  id_rol INT NOT NULL,
  domicilio VARCHAR(255),
  codigo_postal VARCHAR(10),
  activo TINYINT(1) DEFAULT 1,
  debe_cambiar_password TINYINT(1) DEFAULT 0,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_empresa INT,
  FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

-- =============================================
-- FINANZAS (movimientos: ingresos y egresos)
-- =============================================
--
-- La clasificacion tiene tres niveles:
--   1. Naturaleza  -> ingreso / egreso   (fija, va como ENUM en la categoria)
--   2. Categoria   -> agrupa movimientos (ej: "Sueldos", "Ventas")   [ABM por empresa]
--   3. Tipo        -> el detalle dentro de una categoria (ej: "Luz")  [ABM por empresa]
--
-- Un movimiento apunta al TIPO (la hoja); la categoria y la naturaleza se
-- deducen subiendo por las claves foraneas.

-- Nivel 2: categorias. Cada empresa arma las suyas, colgadas de una naturaleza.
CREATE TABLE categorias_movimiento (
  id_categoria   INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(80) NOT NULL,
  naturaleza     ENUM('ingreso', 'egreso') NOT NULL,
  id_empresa INT NOT NULL,
  activo         TINYINT(1) DEFAULT 1,
  FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  UNIQUE (id_empresa, naturaleza, nombre)
);

-- Nivel 3: tipos. Cuelgan de una categoria.
CREATE TABLE tipos_movimiento (
  id_tipo      INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(80) NOT NULL,
  id_categoria INT NOT NULL,
  activo       TINYINT(1) DEFAULT 1,
  -- Guarda POR QUE este tipo quedo de baja: 1 si se fue arrastrado al dar de
  -- baja su categoria, 0 si lo dio de baja el administrador a proposito.
  -- Al reactivar la categoria vuelven solo los que se fueron en cascada: sin
  -- esta marca volvian todos, incluidos los que el admin habia apagado el mes
  -- pasado, y la configuracion se deshacia sola.
  baja_en_cascada TINYINT(1) DEFAULT 0,
  FOREIGN KEY (id_categoria) REFERENCES categorias_movimiento(id_categoria),
  UNIQUE (id_categoria, nombre)
);

-- El movimiento en si. El monto siempre es positivo: el signo lo da la
-- naturaleza de la categoria. Los movimientos no se borran: se anulan.
-- Sobre id_servicio: de donde salio esta plata. Es OPCIONAL y casi siempre va
-- vacio -- la luz, el alquiler y un sueldo no vienen de ningun servicio -- y
-- se completa cuando el movimiento lo origino un servicio que la empresa
-- presta o contrata. Con eso se puede filtrar el listado y el resumen por
-- servicio, que es lo que responde "cuanto me deja cada uno".
--
-- OJO: NO es la clasificacion del movimiento. El dinero ya tiene la suya
-- (categoria -> tipo) y esa sigue siendo obligatoria. Este campo dice el
-- ORIGEN, no el rubro: una misma venta de soldadura se clasifica igual que
-- cualquier otro ingreso por ventas.
--
-- Apunta a productos porque ahi viven tambien los servicios (es_servicio = 1).
-- La clave foranea se agrega mas abajo con un ALTER, porque esta tabla se crea
-- antes que productos.
CREATE TABLE movimientos (
  id_movimiento  INT AUTO_INCREMENT PRIMARY KEY,
  id_tipo        INT NOT NULL,
  monto          DECIMAL(14,2) NOT NULL,
  descripcion    VARCHAR(255),
  fecha          DATE NOT NULL,
  id_empresa INT NOT NULL,
  id_usuario     INT NOT NULL,
  id_servicio    INT NULL,
  anulado        TINYINT(1) DEFAULT 0,
  creado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_tipo)        REFERENCES tipos_movimiento(id_tipo),
  FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  FOREIGN KEY (id_usuario)     REFERENCES usuarios(id)
);


-- =============================================
-- RUBROS (Articulacion)
-- =============================================
--
-- La lista que usa el buscador entre empresas, de general a especifico (ej:
-- "Papel, cartón y embalaje" > "Cartón y cajas"). Es UNA SOLA para todas las
-- empresas y la define el sistema, igual que el catalogo de modulos.
--
-- No sirven para esto las categorias de producto de cada empresa: cada una
-- arma las suyas a su manera ("Alimentos", "Comestibles", "Almacen"), y un
-- buscador entre empresas necesita que todas hablen el mismo idioma.
--
-- Dos niveles en una sola tabla: los generales tienen id_rubro_padre en NULL.
-- Un producto puede colgarse de un general (si ninguno especifico le calza)
-- o de uno especifico.
--
-- Ningun rubro se llama "Servicios": chocaria con el modulo de Servicios, el
-- mismo choque que obligo a renombrar la categoria de dinero a "Gastos fijos".
CREATE TABLE rubros (
  id_rubro       INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(80) NOT NULL,
  id_rubro_padre INT NULL,
  orden          SMALLINT NOT NULL DEFAULT 0,
  FOREIGN KEY (id_rubro_padre) REFERENCES rubros(id_rubro),
  UNIQUE (id_rubro_padre, nombre)
);


-- =============================================
-- PRODUCTOS (arbol de clasificacion del catalogo)
-- =============================================
--
-- El catalogo se ordena en dos niveles, y cada empresa arma los suyos:
--   1. Categoria     -> agrupa productos (ej: "Alimentos")
--   2. Subcategoria  -> el detalle dentro de una categoria (ej: "Perecederos")
--
-- OJO: esto NO es la clasificacion del dinero. Un producto no es una categoria
-- de movimiento: el dinero ya tiene la suya (categoria -> tipo). Productos es
-- un modulo operativo que, mas adelante, GENERA movimientos. Si se mezclaran,
-- la misma venta quedaria clasificada dos veces y los totales no cerrarian.

-- Nivel 1: categorias de producto. Una por empresa, con nombre unico.
--
-- Sobre es_servicio: un SERVICIO es un producto sin stock. Misma estructura de
-- categoria -> subcategoria y, manana, mismo vinculo con los movimientos, asi
-- que comparten estas tablas y se distinguen por esta columna. Un solo modelo
-- de datos abajo y dos pantallas arriba.
--
-- Los dos arboles van separados a proposito: si fueran uno solo, el alta de
-- un producto ofreceria "Transporte" y la de un servicio ofreceria
-- "Alimentos". Son dos catalogos distintos aunque vivan en la misma tabla.
-- Por eso el nombre unico incluye es_servicio: una empresa puede tener la
-- categoria de productos "Transporte" y la de servicios tambien.
CREATE TABLE categorias_producto (
  id_categoria_producto INT AUTO_INCREMENT PRIMARY KEY,
  nombre                VARCHAR(80) NOT NULL,
  id_empresa            INT NOT NULL,
  es_servicio           TINYINT(1) NOT NULL DEFAULT 0,
  activo                TINYINT(1) DEFAULT 1,
  FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  UNIQUE (id_empresa, es_servicio, nombre)
);

-- Nivel 2: subcategorias. Cuelgan de una categoria, que ya es de una empresa.
CREATE TABLE subcategorias_producto (
  id_subcategoria_producto INT AUTO_INCREMENT PRIMARY KEY,
  nombre                   VARCHAR(80) NOT NULL,
  id_categoria_producto    INT NOT NULL,
  activo                   TINYINT(1) DEFAULT 1,
  -- Mismo criterio que en tipos_movimiento: distingue la baja en cascada de
  -- la que decidio el administrador, para no revivir lo que apago a proposito.
  baja_en_cascada          TINYINT(1) DEFAULT 0,
  FOREIGN KEY (id_categoria_producto) REFERENCES categorias_producto(id_categoria_producto),
  UNIQUE (id_categoria_producto, nombre)
);

-- El catalogo en si: que productos existen. Cuantos hay de cada uno es otra
-- cosa (el stock) y se resuelve aparte, con sus propios movimientos.
--
-- La subcategoria es OPCIONAL a proposito: quien no quiere subdividir carga
-- el producto con la categoria sola. Obligarla llevaria a inventar una
-- subcategoria de relleno ("General") en cada categoria para poder empezar.
-- La categoria, en cambio, va siempre: es lo que ordena el catalogo.
--
-- Los productos no se borran, se dan de baja: manana tienen stock e historial
-- colgando y borrarlos dejaria movimientos sin referencia.
-- El stock_minimo va en DECIMAL y no en entero porque se expresa en la unidad
-- del producto: hay cosas que se miden por unidad (5) y otras por peso o
-- volumen (2,5 kg). En 0 significa "no me avises", que es el caso de arranque.
--
-- Sobre es_servicio: la misma tabla guarda los productos y los servicios. Un
-- servicio es un producto SIN STOCK -- se presta, no se guarda en el deposito.
-- De ahi salen las dos diferencias:
--
--   unidad_medida  queda en NULL: un flete o un servicio tecnico no se miden
--                  en kilos ni en litros, y obligar a contestar "en que se
--                  mide" para poder guardarlo es una pregunta sin respuesta.
--   stock_minimo   queda en 0: no hay existencia que pueda bajar de nada.
--
-- Las dos las fuerza el servidor, no la pantalla: un pedido armado a mano que
-- mande unidad y stock minimo en un servicio los pierde igual.
CREATE TABLE productos (
  id_producto              INT AUTO_INCREMENT PRIMARY KEY,
  nombre                   VARCHAR(120) NOT NULL,
  descripcion              VARCHAR(255),
  unidad_medida            VARCHAR(20) NULL,
  stock_minimo             DECIMAL(12,2) NOT NULL DEFAULT 0,
  id_categoria_producto    INT NOT NULL,
  id_subcategoria_producto INT NULL,
  id_empresa               INT NOT NULL,
  es_servicio              TINYINT(1) NOT NULL DEFAULT 0,
  -- Cuanto cuesta perder una unidad de esto (HU-53).
  --
  -- Es un COSTO, no un precio de venta: lo que perder esa unidad te costo, no
  -- lo que ibas a ganar. Sirve para poner un numero a las roturas, los robos y
  -- lo que se consume sin venderse.
  --
  -- Es OPCIONAL y NULL significa "no lo se", no cero. La diferencia importa: un
  -- cero diria que perder eso no cuesta nada, y el reporte cuenta aparte lo que
  -- no pudo valorizar en vez de sumarlo como $0.
  --
  -- Por que este camino y no deducirlo de las compras: la cobertura seria a
  -- parches (solo los productos comprados por el sistema y con el movimiento de
  -- dinero aceptado), y un reporte donde la mitad valoriza y la otra mitad no
  -- tiene un total que no significa nada. Y preguntarlo al cargar la perdida le
  -- hace la pregunta al operador, parado en el deposito, que no sabe los precios.
  --
  -- costo_actualizado_en existe por la inflacion: un costo de hace ocho meses
  -- es un costo malo, y la fecha lo deja a la vista sin tener que explicarlo.
  costo_referencia         DECIMAL(12,2) NULL,
  costo_actualizado_en     DATETIME NULL,
  -- A cuanto se vende una unidad. Es lo que aparece ya escrito al registrar
  -- una venta, para no tener que saberse los precios de memoria.
  --
  -- Es OPCIONAL y NULL significa "todavia no tiene precio": la venta lo pide
  -- a mano. Y es una SUGERENCIA, no una regla: al vender se puede cambiar (un
  -- descuento, un precio por cantidad), y lo que queda en el movimiento de
  -- dinero es lo que se cobro de verdad, no este numero.
  --
  -- No es el costo de arriba: aquel es lo que te cuesta a vos, este es lo que
  -- le cobras al cliente. Un servicio no lleva ninguno de los dos.
  precio_venta             DECIMAL(12,2) NULL,
  -- Articulacion: si las OTRAS empresas lo ven en el buscador, y en que rubro
  -- de la lista comun. Lo que se ofrece a otras empresas sale de este mismo
  -- catalogo (decision del usuario, 02/11/2026): asi nada se carga dos veces.
  -- Las demas ven solo el nombre, la descripcion y el rubro: nunca el stock,
  -- el costo ni el precio. Para mostrarlo hace falta el rubro.
  visible_empresas         TINYINT(1) NOT NULL DEFAULT 0,
  id_rubro                 INT NULL,
  activo                   TINYINT(1) DEFAULT 1,
  creado_en                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_categoria_producto)    REFERENCES categorias_producto(id_categoria_producto),
  FOREIGN KEY (id_subcategoria_producto) REFERENCES subcategorias_producto(id_subcategoria_producto),
  FOREIGN KEY (id_empresa)               REFERENCES empresas(id_empresa),
  FOREIGN KEY (id_rubro)                 REFERENCES rubros(id_rubro),
  UNIQUE (id_empresa, es_servicio, nombre)
);

-- El vinculo entre un movimiento de dinero y el servicio que lo origino.
-- Va aca abajo y no adentro del CREATE TABLE porque "movimientos" se crea
-- mucho antes que "productos", y una clave foranea no puede apuntar a una
-- tabla que todavia no existe.
ALTER TABLE movimientos
  ADD CONSTRAINT fk_movimientos_servicio
  FOREIGN KEY (id_servicio) REFERENCES productos(id_producto);

-- Por que se mueve el stock. Cada empresa arma los suyos, y cada motivo lleva
-- su impacto CONFIGURADO, no cableado en el codigo: asi el administrador puede
-- crear los que necesite (venta, consumo, perdida, robo, ajuste, devolucion)
-- sin que nadie toque el sistema.
--
-- Son dos impactos distintos y hay que pensarlos por separado:
--   efecto_stock  -> entrada / salida        (siempre pasa algo)
--   efecto_dinero -> ingreso / egreso / ninguno
--
-- El caso que obliga a separarlos: una PERDIDA o un ROBO sacan mercaderia
-- (efecto_stock = salida) pero NO generan movimiento de dinero
-- (efecto_dinero = ninguno). Igual tienen que poder verse valorizados en un
-- reporte, que es otra cosa: ahi se multiplica la cantidad por el precio.
CREATE TABLE motivos_stock (
  id_motivo_stock INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(80) NOT NULL,
  efecto_stock    ENUM('entrada', 'salida') NOT NULL,
  efecto_dinero   ENUM('ingreso', 'egreso', 'ninguno') NOT NULL DEFAULT 'ninguno',
  -- En que tipo de movimiento de dinero cae la plata de este motivo (por
  -- ejemplo, Venta -> Ventas > Venta minorista). Se configura UNA vez aca, y
  -- por eso al registrar una venta no hay que elegir ninguna categoria: era la
  -- segunda clasificacion de la misma venta, y la que trababa a la gente.
  --
  -- Solo tiene sentido si el motivo mueve plata; si no, va en NULL. Su
  -- naturaleza (ingreso o egreso) tiene que coincidir con efecto_dinero: eso
  -- lo controla el servidor.
  id_tipo         INT NULL,
  id_empresa      INT NOT NULL,
  activo          TINYINT(1) DEFAULT 1,
  FOREIGN KEY (id_tipo)    REFERENCES tipos_movimiento(id_tipo),
  FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  UNIQUE (id_empresa, nombre)
);

-- Cada entrada o salida de mercaderia. La existencia de un producto NO se
-- guarda en ninguna columna: se calcula sumando estos movimientos.
--
-- Se hace asi a proposito. Un campo "stock_actual" hay que mantener
-- sincronizado a mano en cada alta, en cada anulacion y en cada correccion, y
-- el dia que una de esas se olvida, el numero queda mal para siempre sin que
-- nadie se entere. Calculandolo, la anulacion de un movimiento arregla el
-- stock sola y el historial siempre explica el numero que se ve en pantalla.
--
-- La cantidad es SIEMPRE positiva: si suma o resta lo dice el motivo. Es el
-- mismo criterio que el monto de los movimientos de dinero.
--
-- Los movimientos de stock no se borran, se anulan.
-- Sobre id_movimiento: cuando el motivo mueve plata (una venta, una compra),
-- el sistema OFRECE registrar tambien el movimiento de dinero, y si la persona
-- acepta, los dos quedan atados por esta columna. Queda en NULL cuando el
-- motivo no mueve plata (una perdida) o cuando todavia no se cargo.
--
-- El vinculo es lo que evita cargar la misma venta dos veces: con la columna
-- ocupada, el sistema no vuelve a ofrecerlo.
--
-- Desde el 25/10/2026 las VENTAS no pasan por la oferta: "Registrar una
-- venta" crea los dos movimientos juntos, en la misma transaccion, y el de
-- stock nace ya con esta columna completa.
CREATE TABLE movimientos_stock (
  id_movimiento_stock INT AUTO_INCREMENT PRIMARY KEY,
  id_producto         INT NOT NULL,
  id_motivo_stock     INT NOT NULL,
  cantidad            DECIMAL(12,2) NOT NULL,
  descripcion         VARCHAR(255),
  fecha               DATE NOT NULL,
  id_empresa          INT NOT NULL,
  id_usuario          INT NOT NULL,
  id_movimiento       INT NULL,
  anulado             TINYINT(1) DEFAULT 0,
  creado_en           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_producto)     REFERENCES productos(id_producto),
  FOREIGN KEY (id_motivo_stock) REFERENCES motivos_stock(id_motivo_stock),
  FOREIGN KEY (id_empresa)      REFERENCES empresas(id_empresa),
  FOREIGN KEY (id_usuario)      REFERENCES usuarios(id),
  FOREIGN KEY (id_movimiento)   REFERENCES movimientos(id_movimiento)
);

-- =============================================
-- MODULOS
-- =============================================
--
-- El sistema se divide en modulos y cada empresa prende solo los que usa: una
-- empresa de servicios no necesita stock, una distribuidora puede no usar
-- articulacion. Son dos tablas:
--
--   modulos          -> el catalogo, igual para todos (lo define el sistema)
--   empresa_modulos  -> que tiene prendido cada empresa
--
-- Si una empresa no tiene fila para un modulo, vale el "activo_por_defecto"
-- del catalogo. Asi las empresas que ya existian siguen funcionando sin tener
-- que cargarles nada.

CREATE TABLE modulos (
  id_modulo          INT AUTO_INCREMENT PRIMARY KEY,
  clave              VARCHAR(30) NOT NULL UNIQUE,
  nombre             VARCHAR(60) NOT NULL,
  descripcion        VARCHAR(255),
  -- Un modulo no opcional no se puede apagar: es el corazon del sistema.
  opcional           TINYINT(1) DEFAULT 1,
  activo_por_defecto TINYINT(1) DEFAULT 0,
  orden              TINYINT(2) DEFAULT 0
);

CREATE TABLE empresa_modulos (
  id_empresa INT NOT NULL,
  id_modulo  INT NOT NULL,
  activo     TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id_empresa, id_modulo),
  FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  FOREIGN KEY (id_modulo)  REFERENCES modulos(id_modulo)
);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Roles
INSERT INTO roles (id_rol, nombre, descripcion) VALUES
(1, 'admin_empresa', 'Administrador de una empresa'),
(2, 'tesorero',          'Registra movimientos financieros'),
(3, 'operador',          'Carga y gestiona inventario'),
(4, 'superadmin',        'Administrador de la plataforma');

-- Permisos
INSERT INTO permisos (nombre, descripcion) VALUES
('movimientos.ver',    'Ver movimientos financieros'),
('movimientos.crear',  'Registrar ingresos y egresos'),
('inventario.ver',     'Ver inventario'),
('inventario.cargar',  'Cargar y modificar inventario'),
('usuarios.gestionar', 'Crear y editar usuarios de la empresa'),
('empresas.admin', 'Administrar todas las empresas');

-- Permisos por rol
-- superadmin: todos
INSERT INTO rol_permisos (id_rol, id_permiso)
SELECT 4, id_permiso FROM permisos;

-- admin_empresa
INSERT INTO rol_permisos (id_rol, id_permiso)
SELECT 1, id_permiso FROM permisos WHERE nombre IN (
  'movimientos.ver', 'movimientos.crear',
  'inventario.ver',  'inventario.cargar',
  'usuarios.gestionar'
);

-- tesorero
INSERT INTO rol_permisos (id_rol, id_permiso)
SELECT 2, id_permiso FROM permisos WHERE nombre IN (
  'movimientos.ver', 'movimientos.crear'
);

-- operador
INSERT INTO rol_permisos (id_rol, id_permiso)
SELECT 3, id_permiso FROM permisos WHERE nombre IN (
  'inventario.ver', 'inventario.cargar'
);

-- Nota: las categorias y tipos de movimiento son por empresa, asi que no se
-- siembran aca. Se crean desde el ABM de cada empresa (o al aprobarla,
-- con un set por defecto). Ver datos_de_prueba.sql para ejemplos cargados.

-- Catalogo de modulos
INSERT INTO modulos (clave, nombre, descripcion, opcional, activo_por_defecto, orden) VALUES
('movimientos',  'Movimientos',  'Registro de ingresos y egresos de dinero. Es la base del sistema y no se puede desactivar.', 0, 1, 1),
('productos',    'Productos',    'Catálogo de productos, categorías propias y control de stock.',                              1, 0, 2),
('servicios',    'Servicios',    'Servicios que la empresa presta o contrata y que generan ingresos o egresos.',               1, 0, 3),
-- Reportes volvio a venir prendido de fabrica el 27/09/2026. Se habia apagado
-- el 16/09 porque la pantalla todavia no existia y un boton que no hace nada
-- se lee como "lo estoy apretando mal". Ahora existe y da un reporte de
-- verdad, asi que la razon de apagarlo ya no corre.
('reportes',     'Reportes',     'Reportes por período, categoría, producto y servicio, con descarga.',                        1, 1, 4),
('articulacion', 'Articulación', 'Buscar qué empresas cercanas ofrecen lo que necesitás, y mostrar lo tuyo a las demás.',      1, 0, 5);

-- =============================================
-- UBICACION: la lista de localidades para el buscador entre empresas
-- =============================================
--
-- Arranca con el Gran Buenos Aires, CABA y La Plata, que es donde estan las
-- empresas con las que trabaja el grupo. Ampliarla es agregar filas.
--
-- Las coordenadas son el centro APROXIMADO de cada localidad: alcanzan para
-- ordenar "de la mas cercana a la mas lejana", que es para lo unico que se
-- usan. No son una direccion.
INSERT INTO pais (id_pais, nombre) VALUES (1, 'Argentina');

INSERT INTO provincias (id_provincia, nombre, id_pais) VALUES
  (1, 'Buenos Aires', 1),
  (2, 'Ciudad Autónoma de Buenos Aires', 1);

INSERT INTO localidades (nombre, id_provincia, latitud, longitud) VALUES
  ('Ciudad de Buenos Aires', 2, -34.603700, -58.381600),
  ('Avellaneda',             1, -34.662000, -58.365000),
  ('Berazategui',            1, -34.763000, -58.212000),
  ('Caseros',                1, -34.605000, -58.564000),
  ('Castelar',               1, -34.650000, -58.644000),
  ('Escobar',                1, -34.348000, -58.795000),
  ('Ezeiza',                 1, -34.854000, -58.523000),
  ('Florencio Varela',       1, -34.827000, -58.395000),
  ('General Rodríguez',      1, -34.608000, -58.952000),
  ('González Catán',         1, -34.770000, -58.630000),
  ('Haedo',                  1, -34.644000, -58.593000),
  ('Hurlingham',             1, -34.588600, -58.639000),
  ('Isidro Casanova',        1, -34.700000, -58.585000),
  ('Ituzaingó',              1, -34.658300, -58.666700),
  ('José C. Paz',            1, -34.515000, -58.768000),
  ('La Plata',               1, -34.921000, -57.955000),
  ('Laferrere',              1, -34.747000, -58.588000),
  ('Lanús',                  1, -34.700000, -58.392000),
  ('Lomas de Zamora',        1, -34.760000, -58.400000),
  ('Luján',                  1, -34.570000, -59.105000),
  ('Merlo',                  1, -34.665000, -58.727600),
  ('Monte Grande',           1, -34.815000, -58.468000),
  ('Moreno',                 1, -34.650000, -58.790000),
  ('Morón',                  1, -34.653400, -58.619800),
  ('Paso del Rey',           1, -34.645000, -58.760000),
  ('Pilar',                  1, -34.458000, -58.914000),
  ('Quilmes',                1, -34.720000, -58.254000),
  ('Ramos Mejía',            1, -34.640000, -58.565000),
  ('San Antonio de Padua',   1, -34.668000, -58.702000),
  ('San Isidro',             1, -34.471000, -58.528000),
  ('San Justo',              1, -34.683000, -58.550000),
  ('San Martín',             1, -34.575000, -58.537000),
  ('San Miguel',             1, -34.542000, -58.712000),
  ('Tigre',                  1, -34.426000, -58.580000),
  ('Vicente López',          1, -34.526000, -58.475000),
  ('William C. Morris',      1, -34.585000, -58.661000);

-- =============================================
-- RUBROS: la lista comun del buscador entre empresas
-- =============================================
--
-- Primero los generales, despues los especificos de cada uno. La idea es que
-- cubra lo que una PyME compra y vende todos los dias, no que sea completa:
-- ampliarla es agregar filas. Incluye espacio, vehiculo y formacion, que eran
-- las necesidades que nombraba la validacion de idea.
INSERT INTO rubros (nombre, orden) VALUES
  ('Alimentos y bebidas',          1),
  ('Papel, cartón y embalaje',     2),
  ('Textil y confección',          3),
  ('Metalurgia',                   4),
  ('Madera y muebles',             5),
  ('Construcción',                 6),
  ('Plásticos',                    7),
  ('Química y limpieza',           8),
  ('Electricidad y electrónica',   9),
  ('Gráfica e imprenta',          10),
  ('Transporte y logística',      11),
  ('Mantenimiento y reparación',  12),
  ('Formación y asesoramiento',   13),
  ('Espacios y equipamiento',     14);

-- Los especificos se cuelgan de su general buscandolo por nombre, para no
-- depender de en que orden quedaron los ids.
INSERT INTO rubros (nombre, id_rubro_padre, orden)
SELECT h.nombre, p.id_rubro, h.orden
FROM rubros p
JOIN (
  SELECT 'Alimentos y bebidas' AS padre, 'Almacén y secos' AS nombre, 1 AS orden UNION ALL
  SELECT 'Alimentos y bebidas',          'Frescos y perecederos',     2 UNION ALL
  SELECT 'Alimentos y bebidas',          'Bebidas',                   3 UNION ALL
  SELECT 'Alimentos y bebidas',          'Panificados',               4 UNION ALL
  SELECT 'Papel, cartón y embalaje',     'Papel de impresión y oficina', 1 UNION ALL
  SELECT 'Papel, cartón y embalaje',     'Cartón y cajas',            2 UNION ALL
  SELECT 'Papel, cartón y embalaje',     'Bolsas y envases',          3 UNION ALL
  SELECT 'Papel, cartón y embalaje',     'Etiquetas',                 4 UNION ALL
  SELECT 'Textil y confección',          'Telas',                     1 UNION ALL
  SELECT 'Textil y confección',          'Indumentaria',              2 UNION ALL
  SELECT 'Textil y confección',          'Ropa de trabajo',           3 UNION ALL
  SELECT 'Textil y confección',          'Blanco y mantelería',       4 UNION ALL
  SELECT 'Metalurgia',                   'Chapa y perfiles',          1 UNION ALL
  SELECT 'Metalurgia',                   'Caños y tubos',             2 UNION ALL
  SELECT 'Metalurgia',                   'Piezas a medida',           3 UNION ALL
  SELECT 'Metalurgia',                   'Soldadura y corte',         4 UNION ALL
  SELECT 'Madera y muebles',             'Madera',                    1 UNION ALL
  SELECT 'Madera y muebles',             'Muebles',                   2 UNION ALL
  SELECT 'Madera y muebles',             'Pallets',                   3 UNION ALL
  SELECT 'Construcción',                 'Materiales',                1 UNION ALL
  SELECT 'Construcción',                 'Pinturas',                  2 UNION ALL
  SELECT 'Construcción',                 'Herramientas',              3 UNION ALL
  SELECT 'Plásticos',                    'Envases plásticos',         1 UNION ALL
  SELECT 'Plásticos',                    'Piezas plásticas',          2 UNION ALL
  SELECT 'Química y limpieza',           'Artículos de limpieza',     1 UNION ALL
  SELECT 'Química y limpieza',           'Insumos químicos',          2 UNION ALL
  SELECT 'Electricidad y electrónica',   'Materiales eléctricos',     1 UNION ALL
  SELECT 'Electricidad y electrónica',   'Reparación de equipos',     2 UNION ALL
  SELECT 'Gráfica e imprenta',           'Impresión',                 1 UNION ALL
  SELECT 'Gráfica e imprenta',           'Diseño gráfico',            2 UNION ALL
  SELECT 'Transporte y logística',       'Fletes',                    1 UNION ALL
  SELECT 'Transporte y logística',       'Almacenamiento',            2 UNION ALL
  SELECT 'Transporte y logística',       'Mensajería',                3 UNION ALL
  SELECT 'Mantenimiento y reparación',   'Mantenimiento de máquinas', 1 UNION ALL
  SELECT 'Mantenimiento y reparación',   'Mantenimiento edilicio',    2 UNION ALL
  SELECT 'Formación y asesoramiento',    'Capacitación',              1 UNION ALL
  SELECT 'Formación y asesoramiento',    'Asesoría contable y legal', 2 UNION ALL
  SELECT 'Espacios y equipamiento',      'Alquiler de espacios',      1 UNION ALL
  SELECT 'Espacios y equipamiento',      'Alquiler de máquinas',      2 UNION ALL
  SELECT 'Espacios y equipamiento',      'Vehículos',                 3
) h ON h.padre = p.nombre
WHERE p.id_rubro_padre IS NULL;

-- Usuario superadmin (contraseña: password)
-- El superadmin administra la plataforma, no una empresa: id_empresa queda en NULL.
INSERT INTO usuarios (nombre, apellido, email, password_hash, dni, id_rol, activo) VALUES
('Super', 'Admin', 'superadmin@cooperapp.com', '$2b$10$pNHXgoOkGWp2xM0twt4f7OJwg7YhCW0w/T82hCTkDrtzfyd8EJsoS', '00000001', 4, 1);
