-- =============================================================================
-- CooperApp · DATOS DE PRUEBA
-- =============================================================================
--
-- Carga 4 cooperativas con 27 usuarios en total, para poder probar el sistema
-- con algo parecido a la realidad. NO es parte del sistema: es sólo data de
-- prueba, por eso está separado de database.sql.
--
-- CÓMO USARLO (primero database.sql, después este):
--   "C:\xampp\mysql\bin\mysql.exe" -u root < database.sql
--   "C:\xampp\mysql\bin\mysql.exe" -u root < datos_de_prueba.sql
--
-- Se puede volver a correr cuando quieras: arranca borrando estas 4
-- cooperativas y sus usuarios, así resetea los datos de prueba sin tocar
-- el superadmin ni nada que hayas creado por fuera.
--
-- CONTRASEÑAS
--   marta@laesperanza.coop  ->  esperanza123
--   Test1@gmail.com         ->  Test123
--   todos los demás         ->  prueba123
--
-- QUÉ TRAE PARA PROBAR
--   · 3 cooperativas activas y 1 pendiente (para probar la aprobación)
--   · 1 administrador por cooperativa, más tesoreros y operadores
--   · 3 usuarios con contraseña temporal sin cambiar
--   · 2 usuarios dados de baja
--   · Finanzas en las 3 cooperativas activas: categorías, tipos y movimientos
--     (ingresos y egresos) con fechas recientes, más 1 movimiento anulado
-- =============================================================================

SET NAMES utf8mb4;

USE cooperApp;

-- ---------------------------------------------------------------- limpieza --
-- El orden respeta las claves foraneas: primero los movimientos, despues su
-- clasificacion (tipos -> categorias), y recien ahi usuarios y cooperativas.
DELETE FROM movimientos WHERE id_cooperativa IN (
  SELECT id_cooperativa FROM cooperativas WHERE email IN (
    'contacto@laesperanza.coop', 'contacto@elamanecer.coop',
    'contacto@metaloeste.coop',  'contacto@huertanorte.coop'));

DELETE FROM tipos_movimiento WHERE id_categoria IN (
  SELECT id_categoria FROM categorias_movimiento WHERE id_cooperativa IN (
    SELECT id_cooperativa FROM cooperativas WHERE email IN (
      'contacto@laesperanza.coop', 'contacto@elamanecer.coop',
      'contacto@metaloeste.coop',  'contacto@huertanorte.coop')));

DELETE FROM categorias_movimiento WHERE id_cooperativa IN (
  SELECT id_cooperativa FROM cooperativas WHERE email IN (
    'contacto@laesperanza.coop', 'contacto@elamanecer.coop',
    'contacto@metaloeste.coop',  'contacto@huertanorte.coop'));

DELETE FROM usuarios WHERE id_cooperativa IN (
  SELECT id_cooperativa FROM cooperativas WHERE email IN (
    'contacto@laesperanza.coop', 'contacto@elamanecer.coop',
    'contacto@metaloeste.coop',  'contacto@huertanorte.coop'));

DELETE FROM cooperativas WHERE email IN (
  'contacto@laesperanza.coop', 'contacto@elamanecer.coop',
  'contacto@metaloeste.coop',  'contacto@huertanorte.coop');

-- =============================================================================
-- 1 · Cooperativa de Trabajo La Esperanza Ltda.  (activa · 7 miembros · textil)
-- =============================================================================
INSERT INTO cooperativas
  (nombre, email, cuit, matricula, federacion, domicilio, estado,
   cantidadTrabajadores, cantidadMujer, cantidadHombre, cantidadDiversidad)
VALUES
  ('Cooperativa de Trabajo La Esperanza Ltda.', 'contacto@laesperanza.coop',
   30712345678, 48211, 'FECOOTRA', 'Av. San Martín 2450, Ituzaingó', 'activa',
   7, 4, 3, 0);

INSERT INTO usuarios
  (nombre, apellido, email, password_hash, dni, id_rol, activo, debe_cambiar_password, id_cooperativa)
VALUES
  ('Marta',      'Gómez',        'marta@laesperanza.coop',   '$2b$10$J4iflUEXRo8C.Iz9wGCzk.eYVZZB8mPTZmwW.zW0TNEb88OV8y01W', '27345678', 1, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@laesperanza.coop')),
  ('NombreTest', 'ApellidoTest', 'Test1@gmail.com',          '$2b$10$AjYY2pbzNDZFghnYysMjYOQdqesLqPJy9sLh.SI4feqV1N4WFGNEm', '12345678', 3, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@laesperanza.coop')),
  ('Roberto',    'Quiroga',      'roberto@laesperanza.coop', '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '20456789', 2, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@laesperanza.coop')),
  ('Silvia',     'Ferreyra',     'silvia@laesperanza.coop',  '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '24567890', 3, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@laesperanza.coop')),
  ('Jorge',      'Maidana',      'jorge@laesperanza.coop',   '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '28678901', 3, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@laesperanza.coop')),
  ('Claudia',    'Ríos',         'claudia@laesperanza.coop', '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '30789012', 3, 1, 1, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@laesperanza.coop')),
  ('Héctor',     'Sosa',         'hector@laesperanza.coop',  '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '22890123', 3, 0, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@laesperanza.coop'));

-- =============================================================================
-- 2 · Cooperativa Textil El Amanecer Ltda.  (activa · 6 miembros)
-- =============================================================================
INSERT INTO cooperativas
  (nombre, email, cuit, matricula, federacion, domicilio, estado,
   cantidadTrabajadores, cantidadMujer, cantidadHombre, cantidadDiversidad)
VALUES
  ('Cooperativa Textil El Amanecer Ltda.', 'contacto@elamanecer.coop',
   30698765432, 51702, 'FECOOTRA', 'Belgrano 1180, Morón', 'activa',
   6, 5, 1, 0);

INSERT INTO usuarios
  (nombre, apellido, email, password_hash, dni, id_rol, activo, debe_cambiar_password, id_cooperativa)
VALUES
  ('Norma',    'Benítez',  'norma@elamanecer.coop',    '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '26123456', 1, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@elamanecer.coop')),
  ('Lucía',    'Paredes',  'lucia@elamanecer.coop',    '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '31234567', 2, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@elamanecer.coop')),
  ('Miriam',   'Acuña',    'miriam@elamanecer.coop',   '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '25345678', 3, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@elamanecer.coop')),
  ('Verónica', 'Ledesma',  'veronica@elamanecer.coop', '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '33456789', 3, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@elamanecer.coop')),
  ('Ramón',    'Ojeda',    'ramon@elamanecer.coop',    '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '21567890', 3, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@elamanecer.coop')),
  ('Estela',   'Cabrera',  'estela@elamanecer.coop',   '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '29678901', 3, 1, 1, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@elamanecer.coop'));

-- =============================================================================
-- 3 · Fábrica Recuperada Metalúrgica del Oeste  (activa · 9 miembros)
-- =============================================================================
INSERT INTO cooperativas
  (nombre, email, cuit, matricula, federacion, domicilio, estado,
   cantidadTrabajadores, cantidadMujer, cantidadHombre, cantidadDiversidad)
VALUES
  ('Fábrica Recuperada Metalúrgica del Oeste', 'contacto@metaloeste.coop',
   30655443322, 44980, 'FACTA', 'Ruta 200 km 3, Merlo', 'activa',
   9, 2, 7, 0);

INSERT INTO usuarios
  (nombre, apellido, email, password_hash, dni, id_rol, activo, debe_cambiar_password, id_cooperativa)
VALUES
  ('Osvaldo',  'Peralta',  'osvaldo@metaloeste.coop',  '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '18234567', 1, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@metaloeste.coop')),
  ('Daniel',   'Ibarra',   'daniel@metaloeste.coop',   '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '23345678', 2, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@metaloeste.coop')),
  ('Fabián',   'Correa',   'fabian@metaloeste.coop',   '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '27456789', 3, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@metaloeste.coop')),
  ('Sergio',   'Villalba', 'sergio@metaloeste.coop',   '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '20567890', 3, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@metaloeste.coop')),
  ('Walter',   'Ocampo',   'walter@metaloeste.coop',   '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '24678901', 3, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@metaloeste.coop')),
  ('Andrés',   'Zárate',   'andres@metaloeste.coop',   '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '29789012', 3, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@metaloeste.coop')),
  ('Patricia', 'Núñez',    'patricia@metaloeste.coop', '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '26890123', 3, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@metaloeste.coop')),
  ('Rubén',    'Aguirre',  'ruben@metaloeste.coop',    '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '19901234', 3, 0, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@metaloeste.coop')),
  ('Mariela',  'Godoy',    'mariela@metaloeste.coop',  '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '32012345', 3, 1, 1, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@metaloeste.coop'));

-- =============================================================================
-- 4 · Grupo Asociativo Huerta Norte  (PENDIENTE de aprobación · 5 miembros)
--     Sirve para probar el circuito de aprobación del superadmin: sus usuarios
--     no pueden iniciar sesión hasta que la cooperativa sea aprobada.
-- =============================================================================
INSERT INTO cooperativas
  (nombre, email, cuit, matricula, federacion, domicilio, estado,
   cantidadTrabajadores, cantidadMujer, cantidadHombre, cantidadDiversidad)
VALUES
  ('Grupo Asociativo Huerta Norte', 'contacto@huertanorte.coop',
   30677889900, 56341, NULL, 'Camino Real 540, San Miguel', 'pendiente',
   5, 3, 1, 1);

INSERT INTO usuarios
  (nombre, apellido, email, password_hash, dni, id_rol, activo, debe_cambiar_password, id_cooperativa)
VALUES
  ('Elena',  'Maldonado', 'elena@huertanorte.coop',  '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '34123456', 1, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@huertanorte.coop')),
  ('Carlos', 'Zapata',    'carlos@huertanorte.coop', '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '28234567', 2, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@huertanorte.coop')),
  ('Yamila', 'Ferreira',  'yamila@huertanorte.coop', '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '35345678', 3, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@huertanorte.coop')),
  ('Diego',  'Cáceres',   'diego@huertanorte.coop',  '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '30456789', 3, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@huertanorte.coop')),
  ('Rocío',  'Benegas',   'rocio@huertanorte.coop',  '$2b$10$PjeltbH8E0BboqNDV//HI.yHxwvN8uJtQ9umbfnOc0u7Ye9wO3TnK', '33567890', 3, 1, 0, (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@huertanorte.coop'));

-- =============================================================================
-- FINANZAS DE PRUEBA
-- =============================================================================
-- Categorias, tipos y movimientos para las 3 cooperativas ACTIVAS. La 4ta
-- (Huerta Norte) esta pendiente, asi que no opera y no lleva finanzas.
--
-- Las fechas son relativas a hoy (CURDATE() - INTERVAL n DAY) para que el
-- dashboard "del mes" siempre muestre datos, con algunos del mes anterior
-- para que funcione la comparacion. Los montos van siempre positivos: el
-- signo lo da la naturaleza de la categoria. Se incluye 1 movimiento anulado
-- por cooperativa para probar la baja logica.
--
-- Se referencia todo por variables (@coop, @cat_*) para no depender de ids
-- autoincrementales.

-- ------------------------------------------------------ 1 · La Esperanza --
SET @coop     := (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@laesperanza.coop');
SET @tesorero := (SELECT id FROM usuarios WHERE email = 'roberto@laesperanza.coop');

INSERT INTO categorias_movimiento (nombre, naturaleza, id_cooperativa) VALUES
  ('Ventas',    'ingreso', @coop),
  ('Subsidios', 'ingreso', @coop),
  ('Sueldos',   'egreso',  @coop),
  ('Servicios', 'egreso',  @coop),
  ('Insumos',   'egreso',  @coop);

SET @cat_ventas    := (SELECT id_categoria FROM categorias_movimiento WHERE id_cooperativa = @coop AND naturaleza = 'ingreso' AND nombre = 'Ventas');
SET @cat_subsidios := (SELECT id_categoria FROM categorias_movimiento WHERE id_cooperativa = @coop AND naturaleza = 'ingreso' AND nombre = 'Subsidios');
SET @cat_sueldos   := (SELECT id_categoria FROM categorias_movimiento WHERE id_cooperativa = @coop AND naturaleza = 'egreso'  AND nombre = 'Sueldos');
SET @cat_servicios := (SELECT id_categoria FROM categorias_movimiento WHERE id_cooperativa = @coop AND naturaleza = 'egreso'  AND nombre = 'Servicios');
SET @cat_insumos   := (SELECT id_categoria FROM categorias_movimiento WHERE id_cooperativa = @coop AND naturaleza = 'egreso'  AND nombre = 'Insumos');

INSERT INTO tipos_movimiento (nombre, id_categoria) VALUES
  ('Venta mayorista', @cat_ventas),
  ('Venta minorista', @cat_ventas),
  ('Subsidio INAES',  @cat_subsidios),
  ('Retiro de socios',@cat_sueldos),
  ('Luz',             @cat_servicios),
  ('Internet',        @cat_servicios),
  ('Tela',            @cat_insumos),
  ('Hilo',            @cat_insumos);

INSERT INTO movimientos (id_tipo, monto, descripcion, fecha, id_cooperativa, id_usuario, anulado) VALUES
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_ventas    AND nombre = 'Venta mayorista'),  350000.00, 'Venta a comercio del Once',          CURDATE() - INTERVAL 2  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_ventas    AND nombre = 'Venta minorista'),   48000.00, 'Ventas del local',                   CURDATE() - INTERVAL 4  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_subsidios AND nombre = 'Subsidio INAES'),    200000.00, 'Programa Trabajo Autogestionado',   CURDATE() - INTERVAL 9  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_sueldos   AND nombre = 'Retiro de socios'),  180000.00, 'Retiros de socios del mes',         CURDATE() - INTERVAL 3  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_servicios AND nombre = 'Luz'),                32000.00, 'Factura de luz',                    CURDATE() - INTERVAL 6  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_servicios AND nombre = 'Internet'),           15000.00, 'Abono de internet',                 CURDATE() - INTERVAL 6  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_insumos   AND nombre = 'Tela'),               90000.00, 'Compra de tela por rollo',          CURDATE() - INTERVAL 10 DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_ventas    AND nombre = 'Venta mayorista'),   275000.00, 'Venta del mes anterior',            CURDATE() - INTERVAL 35 DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_insumos   AND nombre = 'Hilo'),               12000.00, 'Compra de hilos (mes anterior)',    CURDATE() - INTERVAL 38 DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_ventas    AND nombre = 'Venta minorista'),     5000.00, 'Cargado por error (anulado)',       CURDATE() - INTERVAL 5  DAY, @coop, @tesorero, 1);

-- ------------------------------------------------------ 2 · El Amanecer --
SET @coop     := (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@elamanecer.coop');
SET @tesorero := (SELECT id FROM usuarios WHERE email = 'lucia@elamanecer.coop');

INSERT INTO categorias_movimiento (nombre, naturaleza, id_cooperativa) VALUES
  ('Ventas',    'ingreso', @coop),
  ('Sueldos',   'egreso',  @coop),
  ('Servicios', 'egreso',  @coop),
  ('Insumos',   'egreso',  @coop);

SET @cat_ventas    := (SELECT id_categoria FROM categorias_movimiento WHERE id_cooperativa = @coop AND naturaleza = 'ingreso' AND nombre = 'Ventas');
SET @cat_sueldos   := (SELECT id_categoria FROM categorias_movimiento WHERE id_cooperativa = @coop AND naturaleza = 'egreso'  AND nombre = 'Sueldos');
SET @cat_servicios := (SELECT id_categoria FROM categorias_movimiento WHERE id_cooperativa = @coop AND naturaleza = 'egreso'  AND nombre = 'Servicios');
SET @cat_insumos   := (SELECT id_categoria FROM categorias_movimiento WHERE id_cooperativa = @coop AND naturaleza = 'egreso'  AND nombre = 'Insumos');

INSERT INTO tipos_movimiento (nombre, id_categoria) VALUES
  ('Venta mayorista', @cat_ventas),
  ('Venta minorista', @cat_ventas),
  ('Retiro de socios',@cat_sueldos),
  ('Luz',             @cat_servicios),
  ('Alquiler',        @cat_servicios),
  ('Tela',            @cat_insumos);

INSERT INTO movimientos (id_tipo, monto, descripcion, fecha, id_cooperativa, id_usuario, anulado) VALUES
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_ventas    AND nombre = 'Venta mayorista'),  210000.00, 'Pedido de remeras',            CURDATE() - INTERVAL 1  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_ventas    AND nombre = 'Venta minorista'),   60000.00, 'Ventas de la semana',          CURDATE() - INTERVAL 7  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_sueldos   AND nombre = 'Retiro de socios'),  150000.00, 'Retiros de socios del mes',    CURDATE() - INTERVAL 3  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_servicios AND nombre = 'Luz'),                21000.00, 'Factura de luz',               CURDATE() - INTERVAL 5  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_servicios AND nombre = 'Alquiler'),          120000.00, 'Alquiler del taller',          CURDATE() - INTERVAL 8  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_insumos   AND nombre = 'Tela'),               70000.00, 'Compra de tela',               CURDATE() - INTERVAL 11 DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_ventas    AND nombre = 'Venta mayorista'),  190000.00, 'Venta del mes anterior',       CURDATE() - INTERVAL 34 DAY, @coop, @tesorero, 0);

-- ------------------------------------------------ 3 · Metalúrgica del Oeste --
SET @coop     := (SELECT id_cooperativa FROM cooperativas WHERE email = 'contacto@metaloeste.coop');
SET @tesorero := (SELECT id FROM usuarios WHERE email = 'daniel@metaloeste.coop');

INSERT INTO categorias_movimiento (nombre, naturaleza, id_cooperativa) VALUES
  ('Ventas',              'ingreso', @coop),
  ('Trabajos a terceros', 'ingreso', @coop),
  ('Sueldos',             'egreso',  @coop),
  ('Insumos',             'egreso',  @coop),
  ('Servicios',           'egreso',  @coop);

SET @cat_ventas    := (SELECT id_categoria FROM categorias_movimiento WHERE id_cooperativa = @coop AND naturaleza = 'ingreso' AND nombre = 'Ventas');
SET @cat_terceros  := (SELECT id_categoria FROM categorias_movimiento WHERE id_cooperativa = @coop AND naturaleza = 'ingreso' AND nombre = 'Trabajos a terceros');
SET @cat_sueldos   := (SELECT id_categoria FROM categorias_movimiento WHERE id_cooperativa = @coop AND naturaleza = 'egreso'  AND nombre = 'Sueldos');
SET @cat_insumos   := (SELECT id_categoria FROM categorias_movimiento WHERE id_cooperativa = @coop AND naturaleza = 'egreso'  AND nombre = 'Insumos');
SET @cat_servicios := (SELECT id_categoria FROM categorias_movimiento WHERE id_cooperativa = @coop AND naturaleza = 'egreso'  AND nombre = 'Servicios');

INSERT INTO tipos_movimiento (nombre, id_categoria) VALUES
  ('Venta de piezas', @cat_ventas),
  ('Torneado',        @cat_terceros),
  ('Soldadura',       @cat_terceros),
  ('Retiro de socios',@cat_sueldos),
  ('Chapa',           @cat_insumos),
  ('Electrodos',      @cat_insumos),
  ('Luz',             @cat_servicios),
  ('Gas',             @cat_servicios);

INSERT INTO movimientos (id_tipo, monto, descripcion, fecha, id_cooperativa, id_usuario, anulado) VALUES
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_ventas   AND nombre = 'Venta de piezas'),  520000.00, 'Venta de piezas a fábrica',     CURDATE() - INTERVAL 2  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_terceros AND nombre = 'Torneado'),         130000.00, 'Trabajo para automotriz',       CURDATE() - INTERVAL 6  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_terceros AND nombre = 'Soldadura'),         85000.00, 'Soldadura de estructura',       CURDATE() - INTERVAL 4  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_sueldos  AND nombre = 'Retiro de socios'), 300000.00, 'Retiros de socios del mes',     CURDATE() - INTERVAL 3  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_insumos  AND nombre = 'Chapa'),            160000.00, 'Compra de chapa',               CURDATE() - INTERVAL 9  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_insumos  AND nombre = 'Electrodos'),        22000.00, 'Compra de electrodos',          CURDATE() - INTERVAL 9  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_servicios AND nombre = 'Luz'),              45000.00, 'Factura de luz',                CURDATE() - INTERVAL 6  DAY, @coop, @tesorero, 0),
  ((SELECT id_tipo FROM tipos_movimiento WHERE id_categoria = @cat_servicios AND nombre = 'Gas'),              38000.00, 'Factura de gas (mes anterior)', CURDATE() - INTERVAL 40 DAY, @coop, @tesorero, 0);

-- ------------------------------------------------------------ comprobación --
SELECT c.nombre AS cooperativa, c.estado, COUNT(u.id) AS miembros
FROM cooperativas c
LEFT JOIN usuarios u ON u.id_cooperativa = c.id_cooperativa
GROUP BY c.id_cooperativa
ORDER BY c.id_cooperativa;

-- Resumen de finanzas por cooperativa (los anulados no suman)
SELECT c.nombre AS cooperativa,
       COUNT(m.id_movimiento)                                                    AS movimientos,
       COALESCE(SUM(CASE WHEN cat.naturaleza = 'ingreso' AND m.anulado = 0 THEN m.monto ELSE 0 END), 0) AS ingresos,
       COALESCE(SUM(CASE WHEN cat.naturaleza = 'egreso'  AND m.anulado = 0 THEN m.monto ELSE 0 END), 0) AS egresos
FROM cooperativas c
LEFT JOIN movimientos m           ON m.id_cooperativa = c.id_cooperativa
LEFT JOIN tipos_movimiento t      ON t.id_tipo = m.id_tipo
LEFT JOIN categorias_movimiento cat ON cat.id_categoria = t.id_categoria
WHERE c.estado = 'activa'
GROUP BY c.id_cooperativa
ORDER BY c.id_cooperativa;
