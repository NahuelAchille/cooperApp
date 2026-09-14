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

CREATE TABLE localidades (
  id_localidad INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  id_provincia INT NOT NULL,
  FOREIGN KEY (id_provincia) REFERENCES provincias(id_provincia)
);

-- =============================================
-- CLASIFICACIÓN DE EMPRESAS
-- =============================================

CREATE TABLE sector (
  id_sector INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50)
);

CREATE TABLE tipos_empresa (
  id_tipo_empresa TINYINT(2) PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT
);

-- =============================================
-- EMPRESAS
-- =============================================

CREATE TABLE empresas (
  id_empresa INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  cuit BIGINT NOT NULL UNIQUE,
  id_tipo_empresa TINYINT(2),
  matricula INT NOT NULL UNIQUE,
  federacion VARCHAR(255),
  domicilio VARCHAR(255),
  id_pais INT,
  id_localidad INT,
  id_provincia INT,
  id_sector INT,
  cantidadTrabajadores INT,
  cantidadDiversidad INT,
  cantidadHombre INT,
  cantidadMujer INT,
  estado ENUM('pendiente', 'activa', 'suspendida') DEFAULT 'pendiente',
  FOREIGN KEY (id_pais) REFERENCES pais(id_pais),
  FOREIGN KEY (id_provincia) REFERENCES provincias(id_provincia),
  FOREIGN KEY (id_localidad) REFERENCES localidades(id_localidad),
  FOREIGN KEY (id_sector) REFERENCES sector(id_sector),
  FOREIGN KEY (id_tipo_empresa) REFERENCES tipos_empresa(id_tipo_empresa)
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
  FOREIGN KEY (id_categoria) REFERENCES categorias_movimiento(id_categoria),
  UNIQUE (id_categoria, nombre)
);

-- El movimiento en si. El monto siempre es positivo: el signo lo da la
-- naturaleza de la categoria. Los movimientos no se borran: se anulan.
CREATE TABLE movimientos (
  id_movimiento  INT AUTO_INCREMENT PRIMARY KEY,
  id_tipo        INT NOT NULL,
  monto          DECIMAL(14,2) NOT NULL,
  descripcion    VARCHAR(255),
  fecha          DATE NOT NULL,
  id_empresa INT NOT NULL,
  id_usuario     INT NOT NULL,
  anulado        TINYINT(1) DEFAULT 0,
  creado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_tipo)        REFERENCES tipos_movimiento(id_tipo),
  FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  FOREIGN KEY (id_usuario)     REFERENCES usuarios(id)
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
CREATE TABLE categorias_producto (
  id_categoria_producto INT AUTO_INCREMENT PRIMARY KEY,
  nombre                VARCHAR(80) NOT NULL,
  id_empresa            INT NOT NULL,
  activo                TINYINT(1) DEFAULT 1,
  FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  UNIQUE (id_empresa, nombre)
);

-- Nivel 2: subcategorias. Cuelgan de una categoria, que ya es de una empresa.
CREATE TABLE subcategorias_producto (
  id_subcategoria_producto INT AUTO_INCREMENT PRIMARY KEY,
  nombre                   VARCHAR(80) NOT NULL,
  id_categoria_producto    INT NOT NULL,
  activo                   TINYINT(1) DEFAULT 1,
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
CREATE TABLE productos (
  id_producto              INT AUTO_INCREMENT PRIMARY KEY,
  nombre                   VARCHAR(120) NOT NULL,
  descripcion              VARCHAR(255),
  unidad_medida            VARCHAR(20) NOT NULL,
  stock_minimo             DECIMAL(12,2) NOT NULL DEFAULT 0,
  id_categoria_producto    INT NOT NULL,
  id_subcategoria_producto INT NULL,
  id_empresa               INT NOT NULL,
  activo                   TINYINT(1) DEFAULT 1,
  creado_en                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_categoria_producto)    REFERENCES categorias_producto(id_categoria_producto),
  FOREIGN KEY (id_subcategoria_producto) REFERENCES subcategorias_producto(id_subcategoria_producto),
  FOREIGN KEY (id_empresa)               REFERENCES empresas(id_empresa),
  UNIQUE (id_empresa, nombre)
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
('reportes',     'Reportes',     'Reportes por período, categoría, producto y servicio, con descarga.',                        1, 1, 4),
('articulacion', 'Articulación', 'Publicar necesidades y ofertas, y encontrar coincidencias con otras empresas.',              1, 0, 5);

-- Usuario superadmin (contraseña: password)
-- El superadmin administra la plataforma, no una empresa: id_empresa queda en NULL.
INSERT INTO usuarios (nombre, apellido, email, password_hash, dni, id_rol, activo) VALUES
('Super', 'Admin', 'superadmin@cooperapp.com', '$2b$10$pNHXgoOkGWp2xM0twt4f7OJwg7YhCW0w/T82hCTkDrtzfyd8EJsoS', '00000001', 4, 1);
