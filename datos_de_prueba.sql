-- =============================================================================
-- CooperApp · DATOS DE PRUEBA
-- =============================================================================
--
-- Carga 4 empresas con 27 usuarios en total, para poder probar el sistema
-- con algo parecido a la realidad. NO es parte del sistema: es sólo data de
-- prueba, por eso está separado de database.sql.
--
-- CÓMO USARLO (primero database.sql, después este):
--   "C:\xampp\mysql\bin\mysql.exe" -u root < database.sql
--   "C:\xampp\mysql\bin\mysql.exe" -u root < datos_de_prueba.sql
--
-- Se puede volver a correr cuando quieras: arranca borrando estas 4
-- empresas y sus usuarios, así resetea los datos de prueba sin tocar
-- el superadmin ni nada que hayas creado por fuera.
--
-- CONTRASEÑAS
--   marta@laesperanza.com.ar  ->  esperanza123
--   Test1@gmail.com         ->  Test123
--   todos los demás         ->  prueba123
--
-- QUÉ TRAE PARA PROBAR
--   · 3 empresas activas y 1 pendiente (para probar la aprobación)
--   · 1 administrador por empresa, más tesoreros y operadores
--   · 3 usuarios con contraseña temporal sin cambiar
--   · 2 usuarios dados de baja
--   · Finanzas en las 3 empresas activas: categorías, tipos y movimientos
--     (ingresos y egresos) con fechas recientes, más 1 movimiento anulado
-- =============================================================================

SET NAMES utf8mb4;

USE cooperApp;

-- ---------------------------------------------------------------- limpieza --
-- El orden respeta las claves foraneas: primero los movimientos, despues su
-- clasificacion (tipos -> categorias), y recien ahi usuarios y empresas.
DELETE FROM movimientos WHERE id_empresa IN (
  SELECT id_empresa FROM empresas WHERE email IN (
    'contacto@laesperanza.com.ar', 'contacto@elamanecer.com.ar',
    'contacto@metaloeste.com.ar',  'contacto@huertanorte.com.ar'));

DELETE FROM tipos_movimiento WHERE id_categoria IN (
  SELECT id_categoria FROM categorias_movimiento WHERE id_empresa IN (
    SELECT id_empresa FROM empresas WHERE email IN (
      'contacto@laesperanza.com.ar', 'contacto@elamanecer.com.ar',
      'contacto@metaloeste.com.ar',  'contacto@huertanorte.com.ar')));

DELETE FROM categorias_movimiento WHERE id_empresa IN (
  SELECT id_empresa FROM empresas WHERE email IN (
    'contacto@laesperanza.com.ar', 'contacto@elamanecer.com.ar',
    'contacto@metaloeste.com.ar',  'contacto@huertanorte.com.ar'));

DELETE FROM usuarios WHERE id_empresa IN (
  SELECT id_empresa FROM empresas WHERE email IN (
    'contacto@laesperanza.com.ar', 'contacto@elamanecer.com.ar',
    'contacto@metaloeste.com.ar',  'contacto@huertanorte.com.ar'));

DELETE FROM empresas WHERE email IN (
  'contacto@laesperanza.com.ar', 'contacto@elamanecer.com.ar',
  'contacto@metaloeste.com.ar',  'contacto@huertanorte.com.ar');

-- =============================================================================
-- 1 · Alimentos La Esperanza S.R.L.  (activa · 7 empleados · alimentos)
-- =============================================================================
INSERT INTO empresas
  (nombre, email, cuit, matricula, federacion, domicilio, estado,
   cantidadTrabajadores, cantidadMujer, cantidadHombre, cantidadDiversidad)
VALUES
  ('Alimentos La Esperanza S.R.L.', 'contacto@laesperanza.com.ar',
   30712345678, 48211, NULL, 'Av. San Martín 2450, Ituzaingó', 'activa',
   7, 4, 3, 0);

INSERT INTO usuarios
  (nombre, apellido, email, password_hash, dni, id_rol, activo, debe_cambiar_password, id_empresa)
VALUES
  ('Marta',      'Gómez',        'marta@laesperanza.com.ar',   '$2b$10$J4iflUEXRo8C.Iz9wGCzk.eYVZZB8mPTZmwW.zW0TNEb88OV8y01W', '27345678', 1, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@laesperanza.com.ar')),
  ('NombreTest', 'ApellidoTest', 'Test1@gmail.com',          '$2b$10$AjYY2pbzNDZFghnYysMjYOQdqesLqPJy9sLh.SI4feqV1N4WFGNEm', '12345678', 3, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@laesperanza.com.ar')),
  ('Roberto',    'Quiroga',      'roberto@laesperanza.com.ar', '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '20456789', 2, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@laesperanza.com.ar')),
  ('Silvia',     'Ferreyra',     'silvia@laesperanza.com.ar',  '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '24567890', 3, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@laesperanza.com.ar')),
  ('Jorge',      'Maidana',      'jorge@laesperanza.com.ar',   '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '28678901', 3, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@laesperanza.com.ar')),
  ('Claudia',    'Ríos',         'claudia@laesperanza.com.ar', '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '30789012', 3, 1, 1, (SELECT id_empresa FROM empresas WHERE email = 'contacto@laesperanza.com.ar')),
  ('Héctor',     'Sosa',         'hector@laesperanza.com.ar',  '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '22890123', 3, 0, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@laesperanza.com.ar'));

-- =============================================================================
-- 2 · Textil El Amanecer S.A.  (activa · 6 empleados)
-- =============================================================================
INSERT INTO empresas
  (nombre, email, cuit, matricula, federacion, domicilio, estado,
   cantidadTrabajadores, cantidadMujer, cantidadHombre, cantidadDiversidad)
VALUES
  ('Textil El Amanecer S.A.', 'contacto@elamanecer.com.ar',
   30698765432, 51702, NULL, 'Belgrano 1180, Morón', 'activa',
   6, 5, 1, 0);

INSERT INTO usuarios
  (nombre, apellido, email, password_hash, dni, id_rol, activo, debe_cambiar_password, id_empresa)
VALUES
  ('Norma',    'Benítez',  'norma@elamanecer.com.ar',    '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '26123456', 1, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@elamanecer.com.ar')),
  ('Lucía',    'Paredes',  'lucia@elamanecer.com.ar',    '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '31234567', 2, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@elamanecer.com.ar')),
  ('Miriam',   'Acuña',    'miriam@elamanecer.com.ar',   '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '25345678', 3, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@elamanecer.com.ar')),
  ('Verónica', 'Ledesma',  'veronica@elamanecer.com.ar', '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '33456789', 3, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@elamanecer.com.ar')),
  ('Ramón',    'Ojeda',    'ramon@elamanecer.com.ar',    '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '21567890', 3, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@elamanecer.com.ar')),
  ('Estela',   'Cabrera',  'estela@elamanecer.com.ar',   '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '29678901', 3, 1, 1, (SELECT id_empresa FROM empresas WHERE email = 'contacto@elamanecer.com.ar'));

-- =============================================================================
-- 3 · Metalúrgica del Oeste S.A.  (activa · 9 empleados)
-- =============================================================================
INSERT INTO empresas
  (nombre, email, cuit, matricula, federacion, domicilio, estado,
   cantidadTrabajadores, cantidadMujer, cantidadHombre, cantidadDiversidad)
VALUES
  ('Metalúrgica del Oeste S.A.', 'contacto@metaloeste.com.ar',
   30655443322, 44980, NULL, 'Ruta 200 km 3, Merlo', 'activa',
   9, 2, 7, 0);

INSERT INTO usuarios
  (nombre, apellido, email, password_hash, dni, id_rol, activo, debe_cambiar_password, id_empresa)
VALUES
  ('Osvaldo',  'Peralta',  'osvaldo@metaloeste.com.ar',  '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '18234567', 1, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@metaloeste.com.ar')),
  ('Daniel',   'Ibarra',   'daniel@metaloeste.com.ar',   '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '23345678', 2, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@metaloeste.com.ar')),
  ('Fabián',   'Correa',   'fabian@metaloeste.com.ar',   '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '27456789', 3, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@metaloeste.com.ar')),
  ('Sergio',   'Villalba', 'sergio@metaloeste.com.ar',   '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '20567890', 3, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@metaloeste.com.ar')),
  ('Walter',   'Ocampo',   'walter@metaloeste.com.ar',   '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '24678901', 3, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@metaloeste.com.ar')),
  ('Andrés',   'Zárate',   'andres@metaloeste.com.ar',   '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '29789012', 3, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@metaloeste.com.ar')),
  ('Patricia', 'Núñez',    'patricia@metaloeste.com.ar', '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '26890123', 3, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@metaloeste.com.ar')),
  ('Rubén',    'Aguirre',  'ruben@metaloeste.com.ar',    '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '19901234', 3, 0, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@metaloeste.com.ar')),
  ('Mariela',  'Godoy',    'mariela@metaloeste.com.ar',  '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '32012345', 3, 1, 1, (SELECT id_empresa FROM empresas WHERE email = 'contacto@metaloeste.com.ar'));

-- =============================================================================
-- 4 · Distribuidora Huerta Norte S.R.L.  (PENDIENTE de aprobación · 5 empleados)
--     Sirve para probar el circuito de aprobación del superadmin: sus usuarios
--     no pueden iniciar sesión hasta que la empresa sea aprobada.
-- =============================================================================
INSERT INTO empresas
  (nombre, email, cuit, matricula, federacion, domicilio, estado,
   cantidadTrabajadores, cantidadMujer, cantidadHombre, cantidadDiversidad)
VALUES
  ('Distribuidora Huerta Norte S.R.L.', 'contacto@huertanorte.com.ar',
   30677889900, 56341, NULL, 'Camino Real 540, San Miguel', 'pendiente',
   5, 3, 1, 1);

INSERT INTO usuarios
  (nombre, apellido, email, password_hash, dni, id_rol, activo, debe_cambiar_password, id_empresa)
VALUES
  ('Elena',  'Maldonado', 'elena@huertanorte.com.ar',  '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '34123456', 1, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@huertanorte.com.ar')),
  ('Carlos', 'Zapata',    'carlos@huertanorte.com.ar', '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '28234567', 2, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@huertanorte.com.ar')),
  ('Yamila', 'Ferreira',  'yamila@huertanorte.com.ar', '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '35345678', 3, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@huertanorte.com.ar')),
  ('Diego',  'Cáceres',   'diego@huertanorte.com.ar',  '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '30456789', 3, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@huertanorte.com.ar')),
  ('Rocío',  'Benegas',   'rocio@huertanorte.com.ar',  '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '33567890', 3, 1, 0, (SELECT id_empresa FROM empresas WHERE email = 'contacto@huertanorte.com.ar'));

-- =============================================================================
-- FINANZAS DE PRUEBA
-- =============================================================================
-- Categorias, tipos y movimientos para las 3 empresas ACTIVAS. La 4ta
-- (Huerta Norte) esta pendiente, asi que no opera y no lleva finanzas.
--
-- Las fechas son relativas a hoy (CURDATE() - INTERVAL n DAY) para que el
-- dashboard "del mes" siempre muestre datos, con algunos del mes anterior
-- para que funcione la comparacion. Los montos van siempre positivos: el
-- signo lo da la naturaleza de la categoria. Se incluye 1 movimiento anulado
-- por empresa para probar la baja logica.
--
-- Se referencia todo por variables (@empresa, @cat_*) para no depender de ids
-- autoincrementales.

-- ------------------------------------------------------ 1 · La Esperanza --
SET @empresa     := (SELECT id_empresa FROM empresas WHERE email = 'contacto@laesperanza.com.ar');
SET @tesorero := (SELECT id FROM usuarios WHERE email = 'roberto@laesperanza.com.ar');

INSERT INTO categorias_movimiento (nombre, naturaleza, id_empresa) VALUES
  ('Ventas',    'ingreso', @empresa),
  ('Otros ingresos', 'ingreso', @empresa),
  ('Sueldos',   'egreso',  @empresa),
  ('Servicios', 'egreso',  @empresa),
  ('Insumos',   'egreso',  @empresa);

SET @cat_ventas    := (SELECT id_categoria FROM categorias_movimiento WHERE id_empresa = @empresa AND naturaleza = 'ingreso' AND nombre = 'Ventas');
SET @cat_subsidios := (SELECT id_categoria FROM categorias_movimiento WHERE id_empresa = @empresa AND naturaleza = 'ingreso' AND nombre = 'Otros ingresos');
SET @cat_sueldos   := (SELECT id_categoria FROM categorias_movimiento WHERE id_empresa = @empresa AND naturaleza = 'egreso'  AND nombre = 'Sueldos');
SET @cat_servicios := (SELECT id_categoria FROM categorias_movimiento WHERE id_empresa = @empresa AND naturaleza = 'egreso'  AND nombre = 'Servicios');
SET @cat_insumos   := (SELECT id_categoria FROM categorias_movimiento WHERE id_empresa = @empresa AND naturaleza = 'egreso'  AND nombre = 'Insumos');

INSERT INTO tipos_movimiento (nombre, id_categoria) VALUES
  ('Venta mayorista', @cat_ventas),
  ('Venta minorista', @cat_ventas),
  ('Reintegro de exportación',  @cat_subsidios),
  ('Sueldos del personal',@cat_sueldos),
  ('Luz',             @cat_servicios),
  ('Internet',        @cat_servicios),
  ('Harina',          @cat_insumos),
  ('Envases',         @cat_insumos);

INSERT INTO movimientos (id_tipo, monto, descripcion, fecha, id_empresa, id_usuario, anulado) VALUES
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_ventas    AND nombre = 'Venta mayorista'),  350000.00, 'Venta a distribuidora mayorista',          CURDATE() - INTERVAL 2  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_ventas    AND nombre = 'Venta minorista'),   48000.00, 'Ventas del local',                   CURDATE() - INTERVAL 4  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_subsidios AND nombre = 'Reintegro de exportación'),    200000.00, 'Reintegro del trimestre',   CURDATE() - INTERVAL 9  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_sueldos   AND nombre = 'Sueldos del personal'),  180000.00, 'Sueldos del mes',         CURDATE() - INTERVAL 3  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_servicios AND nombre = 'Luz'),                32000.00, 'Factura de luz',                    CURDATE() - INTERVAL 6  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_servicios AND nombre = 'Internet'),           15000.00, 'Abono de internet',                 CURDATE() - INTERVAL 6  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_insumos   AND nombre = 'Harina'),             90000.00, 'Compra de harina por tonelada',          CURDATE() - INTERVAL 10 DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_ventas    AND nombre = 'Venta mayorista'),   275000.00, 'Venta del mes anterior',            CURDATE() - INTERVAL 35 DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_insumos   AND nombre = 'Envases'),            12000.00, 'Compra de envases (mes anterior)',    CURDATE() - INTERVAL 38 DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_ventas    AND nombre = 'Venta minorista'),     5000.00, 'Cargado por error (anulado)',       CURDATE() - INTERVAL 5  DAY, @empresa, @tesorero, 1);

-- ------------------------------------------------------ 2 · El Amanecer --
SET @empresa     := (SELECT id_empresa FROM empresas WHERE email = 'contacto@elamanecer.com.ar');
SET @tesorero := (SELECT id FROM usuarios WHERE email = 'lucia@elamanecer.com.ar');

INSERT INTO categorias_movimiento (nombre, naturaleza, id_empresa) VALUES
  ('Ventas',    'ingreso', @empresa),
  ('Sueldos',   'egreso',  @empresa),
  ('Servicios', 'egreso',  @empresa),
  ('Insumos',   'egreso',  @empresa);

SET @cat_ventas    := (SELECT id_categoria FROM categorias_movimiento WHERE id_empresa = @empresa AND naturaleza = 'ingreso' AND nombre = 'Ventas');
SET @cat_sueldos   := (SELECT id_categoria FROM categorias_movimiento WHERE id_empresa = @empresa AND naturaleza = 'egreso'  AND nombre = 'Sueldos');
SET @cat_servicios := (SELECT id_categoria FROM categorias_movimiento WHERE id_empresa = @empresa AND naturaleza = 'egreso'  AND nombre = 'Servicios');
SET @cat_insumos   := (SELECT id_categoria FROM categorias_movimiento WHERE id_empresa = @empresa AND naturaleza = 'egreso'  AND nombre = 'Insumos');

INSERT INTO tipos_movimiento (nombre, id_categoria) VALUES
  ('Venta mayorista', @cat_ventas),
  ('Venta minorista', @cat_ventas),
  ('Sueldos del personal',@cat_sueldos),
  ('Luz',             @cat_servicios),
  ('Alquiler',        @cat_servicios),
  ('Tela',            @cat_insumos);

INSERT INTO movimientos (id_tipo, monto, descripcion, fecha, id_empresa, id_usuario, anulado) VALUES
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_ventas    AND nombre = 'Venta mayorista'),  210000.00, 'Pedido de remeras',            CURDATE() - INTERVAL 1  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_ventas    AND nombre = 'Venta minorista'),   60000.00, 'Ventas de la semana',          CURDATE() - INTERVAL 7  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_sueldos   AND nombre = 'Sueldos del personal'),  150000.00, 'Sueldos del mes',    CURDATE() - INTERVAL 3  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_servicios AND nombre = 'Luz'),                21000.00, 'Factura de luz',               CURDATE() - INTERVAL 5  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_servicios AND nombre = 'Alquiler'),          120000.00, 'Alquiler del taller',          CURDATE() - INTERVAL 8  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_insumos   AND nombre = 'Tela'),               70000.00, 'Compra de tela',               CURDATE() - INTERVAL 11 DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_ventas    AND nombre = 'Venta mayorista'),  190000.00, 'Venta del mes anterior',       CURDATE() - INTERVAL 34 DAY, @empresa, @tesorero, 0);

-- ------------------------------------------------ 3 · Metalúrgica del Oeste --
SET @empresa     := (SELECT id_empresa FROM empresas WHERE email = 'contacto@metaloeste.com.ar');
SET @tesorero := (SELECT id FROM usuarios WHERE email = 'daniel@metaloeste.com.ar');

INSERT INTO categorias_movimiento (nombre, naturaleza, id_empresa) VALUES
  ('Ventas',              'ingreso', @empresa),
  ('Trabajos a terceros', 'ingreso', @empresa),
  ('Sueldos',             'egreso',  @empresa),
  ('Insumos',             'egreso',  @empresa),
  ('Servicios',           'egreso',  @empresa);

SET @cat_ventas    := (SELECT id_categoria FROM categorias_movimiento WHERE id_empresa = @empresa AND naturaleza = 'ingreso' AND nombre = 'Ventas');
SET @cat_terceros  := (SELECT id_categoria FROM categorias_movimiento WHERE id_empresa = @empresa AND naturaleza = 'ingreso' AND nombre = 'Trabajos a terceros');
SET @cat_sueldos   := (SELECT id_categoria FROM categorias_movimiento WHERE id_empresa = @empresa AND naturaleza = 'egreso'  AND nombre = 'Sueldos');
SET @cat_insumos   := (SELECT id_categoria FROM categorias_movimiento WHERE id_empresa = @empresa AND naturaleza = 'egreso'  AND nombre = 'Insumos');
SET @cat_servicios := (SELECT id_categoria FROM categorias_movimiento WHERE id_empresa = @empresa AND naturaleza = 'egreso'  AND nombre = 'Servicios');

INSERT INTO tipos_movimiento (nombre, id_categoria) VALUES
  ('Venta de piezas', @cat_ventas),
  ('Torneado',        @cat_terceros),
  ('Soldadura',       @cat_terceros),
  ('Sueldos del personal',@cat_sueldos),
  ('Chapa',           @cat_insumos),
  ('Electrodos',      @cat_insumos),
  ('Luz',             @cat_servicios),
  ('Gas',             @cat_servicios);

INSERT INTO movimientos (id_tipo, monto, descripcion, fecha, id_empresa, id_usuario, anulado) VALUES
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_ventas   AND nombre = 'Venta de piezas'),  520000.00, 'Venta de piezas a fábrica',     CURDATE() - INTERVAL 2  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_terceros AND nombre = 'Torneado'),         130000.00, 'Trabajo para automotriz',       CURDATE() - INTERVAL 6  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_terceros AND nombre = 'Soldadura'),         85000.00, 'Soldadura de estructura',       CURDATE() - INTERVAL 4  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_sueldos  AND nombre = 'Sueldos del personal'), 300000.00, 'Sueldos del mes',     CURDATE() - INTERVAL 3  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_insumos  AND nombre = 'Chapa'),            160000.00, 'Compra de chapa',               CURDATE() - INTERVAL 9  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_insumos  AND nombre = 'Electrodos'),        22000.00, 'Compra de electrodos',          CURDATE() - INTERVAL 9  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_servicios AND nombre = 'Luz'),              45000.00, 'Factura de luz',                CURDATE() - INTERVAL 6  DAY, @empresa, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_servicios AND nombre = 'Gas'),              38000.00, 'Factura de gas (mes anterior)', CURDATE() - INTERVAL 40 DAY, @empresa, @tesorero, 0);

-- ------------------------------------------------------------ comprobación --
SELECT c.nombre AS empresa, c.estado, COUNT(u.id) AS empleados
FROM empresas c
LEFT JOIN usuarios u ON u.id_empresa = c.id_empresa
GROUP BY c.id_empresa
ORDER BY c.id_empresa;

-- Resumen de finanzas por empresa (los anulados no suman)
SELECT c.nombre AS empresa,
       COUNT(m.id_movimiento)                                                    AS movimientos,
       COALESCE(SUM(CASE WHEN cat.naturaleza = 'ingreso' AND m.anulado = 0 THEN m.monto ELSE 0 END), 0) AS ingresos,
       COALESCE(SUM(CASE WHEN cat.naturaleza = 'egreso'  AND m.anulado = 0 THEN m.monto ELSE 0 END), 0) AS egresos
FROM empresas c
LEFT JOIN movimientos m           ON m.id_empresa = c.id_empresa
LEFT JOIN tipos_movimiento t      ON t.id_tipo = m.id_tipo
LEFT JOIN categorias_movimiento cat ON cat.id_categoria = t.id_categoria
WHERE c.estado = 'activa'
GROUP BY c.id_empresa
ORDER BY c.id_empresa;
