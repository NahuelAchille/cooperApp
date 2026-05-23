CREATE DATABASE IF NOT EXISTS cooperApp;
USE cooperApp;

CREATE TABLE roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,   
  descripcion TEXT,                     
  activo TINYINT(1) DEFAULT 1           
);

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  contraseña VARCHAR(255) NOT NULL,
  dni VARCHAR(20) NOT NULL UNIQUE,
  fecha_nacimiento DATE,
  id_rol INT NOT NULL,
  domicilio VARCHAR(255),
  codigo_postal VARCHAR(10),
  activo INT(1) DEFAULT 1,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_cooperativa INT,
  FOREIGN KEY (id_cooperativa) REFERENCES cooperativas(id_cooperativa) 
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

    CREATE TABLE cooperativas(
    id_cooperativa INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    cuit INT NOT NULL UNIQUE,
    id_tipo INT,
    matricula INT NOT NULL UNIQUE,
    federacion VARCHAR(255),
    domicilio VARCHAR(255),
    id_pais INT NOT NULL,
    id_localidad INT NOT NULL,
    id_provincia INT NOT NULL,    
    id_sector INT,
    cantidadTrabajadores INT,
    cantidaddiversidad INT,
    cantidadHombre INT,
    cantidadMujer INT,
    FOREIGN KEY (id_pais) REFERENCES pais(id_pais)
    FOREIGN KEY (id_provincia) REFERENCES provincias(id_provincia)
    FOREIGN KEY (id_localidad) REFERENCES localidades(id_localidad)
    FOREIGN KEY (id_sector) REFERENCES Sector(id_sector)
    FOREIGN KEY (id_tipo) REFERENCES tipoCoop(id_tipo)
);

CREATE TABLE pais(
    id_pais INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
);
CREATE TABLE provincias(
    id_provincia INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    id_pais INT NOT NULL,
    FOREIGN KEY (id_pais) REFERENCES pais(id_pais)
);

CREATE TABLE localidades(
  id_localidad INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  id_provincia VARCHAR(50),
  FOREIGN KEY (id_provincia) REFERENCES provincias(id_provincia)
);

CREATE TABLE sector(
    id_sector INT PRIMARY KEY NOT NULL UNIQUE,
    nombre VARCHAR(50),
);
CREATE TABLE tipoCoop(
    id_tipo TINYINT(2) PRIMARY KEY
    nombre VARCHAR(50) NOT NULL UNIQUE,   
    descripcion TEXT
);

//Financias
CREATE TABLE movimientos(
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,

);
CREATE TABLE tipoMovimiento(
    id_tipoMov INT PRIMARY KEY NOT NULL UNIQUE,
    nombre VARCHAR

);

