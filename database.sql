-- Los acentos del archivo se interpretan bien sin necesidad de pasar opciones
-- en la linea de comandos. Importar simplemente con:  mysql -u root < database.sql
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS cooperApp;
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
-- CLASIFICACIÓN DE COOPERATIVAS
-- =============================================

CREATE TABLE sector (
  id_sector INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50)
);

CREATE TABLE tipoCoop (
  id_tipo TINYINT(2) PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT
);

-- =============================================
-- COOPERATIVAS
-- =============================================

CREATE TABLE cooperativas (
  id_cooperativa INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  cuit BIGINT NOT NULL UNIQUE,
  id_tipo TINYINT(2),
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
  FOREIGN KEY (id_tipo) REFERENCES tipoCoop(id_tipo)
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
  id_cooperativa INT,
  FOREIGN KEY (id_cooperativa) REFERENCES cooperativas(id_cooperativa),
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
  id_cooperativa INT NOT NULL,
  activo         TINYINT(1) DEFAULT 1,
  FOREIGN KEY (id_cooperativa) REFERENCES cooperativas(id_cooperativa),
  UNIQUE (id_cooperativa, naturaleza, nombre)
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
  id_cooperativa INT NOT NULL,
  id_usuario     INT NOT NULL,
  anulado        TINYINT(1) DEFAULT 0,
  creado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_tipo)        REFERENCES tipos_movimiento(id_tipo),
  FOREIGN KEY (id_cooperativa) REFERENCES cooperativas(id_cooperativa),
  FOREIGN KEY (id_usuario)     REFERENCES usuarios(id)
);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Roles
INSERT INTO roles (id_rol, nombre, descripcion) VALUES
(1, 'admin_cooperativa', 'Administrador de una cooperativa'),
(2, 'tesorero',          'Registra movimientos financieros'),
(3, 'operador',          'Carga y gestiona inventario'),
(4, 'superadmin',        'Administrador de la plataforma');

-- Permisos
INSERT INTO permisos (nombre, descripcion) VALUES
('movimientos.ver',    'Ver movimientos financieros'),
('movimientos.crear',  'Registrar ingresos y egresos'),
('inventario.ver',     'Ver inventario'),
('inventario.cargar',  'Cargar y modificar inventario'),
('usuarios.gestionar', 'Crear y editar usuarios de la cooperativa'),
('cooperativas.admin', 'Administrar todas las cooperativas');

-- Permisos por rol
-- superadmin: todos
INSERT INTO rol_permisos (id_rol, id_permiso)
SELECT 4, id_permiso FROM permisos;

-- admin_cooperativa
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
-- siembran aca. Se crean desde el ABM de cada cooperativa (o al aprobarla,
-- con un set por defecto). Ver datos_de_prueba.sql para ejemplos cargados.

-- Usuario superadmin (contraseña: password)
-- El superadmin administra la plataforma, no una cooperativa: id_cooperativa queda en NULL.
INSERT INTO usuarios (nombre, apellido, email, password_hash, dni, id_rol, activo) VALUES
('Super', 'Admin', 'superadmin@cooperapp.com', '$2b$10$pNHXgoOkGWp2xM0twt4f7OJwg7YhCW0w/T82hCTkDrtzfyd8EJsoS', '00000001', 4, 1);
