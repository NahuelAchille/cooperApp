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
--
-- Los movimientos de STOCK van primero de todo: desde el Sprint 08 pueden
-- apuntar a un movimiento de dinero (la venta que genero el ingreso), asi que
-- borrar el dinero antes deja la referencia colgada y MySQL lo rechaza.
DELETE FROM movimientos_stock WHERE id_empresa IN (
  SELECT id_empresa FROM empresas WHERE email IN (
    'contacto@laesperanza.com.ar', 'contacto@elamanecer.com.ar',
    'contacto@metaloeste.com.ar',  'contacto@huertanorte.com.ar'));

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

DELETE FROM motivos_stock WHERE id_empresa IN (
  SELECT id_empresa FROM empresas WHERE email IN (
    'contacto@laesperanza.com.ar', 'contacto@elamanecer.com.ar',
    'contacto@metaloeste.com.ar',  'contacto@huertanorte.com.ar'));

-- Catalogo: primero los productos, despues su clasificacion
-- (subcategorias -> categorias).
DELETE FROM productos WHERE id_empresa IN (
  SELECT id_empresa FROM empresas WHERE email IN (
    'contacto@laesperanza.com.ar', 'contacto@elamanecer.com.ar',
    'contacto@metaloeste.com.ar',  'contacto@huertanorte.com.ar'));

DELETE FROM subcategorias_producto WHERE id_categoria_producto IN (
  SELECT id_categoria_producto FROM categorias_producto WHERE id_empresa IN (
    SELECT id_empresa FROM empresas WHERE email IN (
      'contacto@laesperanza.com.ar', 'contacto@elamanecer.com.ar',
      'contacto@metaloeste.com.ar',  'contacto@huertanorte.com.ar')));

DELETE FROM categorias_producto WHERE id_empresa IN (
  SELECT id_empresa FROM empresas WHERE email IN (
    'contacto@laesperanza.com.ar', 'contacto@elamanecer.com.ar',
    'contacto@metaloeste.com.ar',  'contacto@huertanorte.com.ar'));

DELETE FROM empresa_modulos WHERE id_empresa IN (
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
  (nombre, email, cuit, federacion, domicilio, estado,
   cantidadTrabajadores, cantidadMujer, cantidadHombre, cantidadDiversidad)
VALUES
  ('Alimentos La Esperanza S.R.L.', 'contacto@laesperanza.com.ar',
   30712345678, NULL, 'Av. San Martín 2450, Ituzaingó', 'activa',
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
  (nombre, email, cuit, federacion, domicilio, estado,
   cantidadTrabajadores, cantidadMujer, cantidadHombre, cantidadDiversidad)
VALUES
  ('Textil El Amanecer S.A.', 'contacto@elamanecer.com.ar',
   30698765432, NULL, 'Belgrano 1180, Morón', 'activa',
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
  (nombre, email, cuit, federacion, domicilio, estado,
   cantidadTrabajadores, cantidadMujer, cantidadHombre, cantidadDiversidad)
VALUES
  ('Metalúrgica del Oeste S.A.', 'contacto@metaloeste.com.ar',
   30655443322, NULL, 'Ruta 200 km 3, Merlo', 'activa',
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
  (nombre, email, cuit, federacion, domicilio, estado,
   cantidadTrabajadores, cantidadMujer, cantidadHombre, cantidadDiversidad)
VALUES
  ('Distribuidora Huerta Norte S.R.L.', 'contacto@huertanorte.com.ar',
   30677889900, NULL, 'Camino Real 540, San Miguel', 'pendiente',
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
-- MODULOS ACTIVOS POR EMPRESA
-- =============================================================================
-- Cada empresa prende lo que usa. Se cargan distintos a proposito, para que se
-- vea que el menu cambia segun la empresa:
--   · La Esperanza (alimentos)  -> productos
--   · El Amanecer (textil)      -> productos
--   · Metalurgica del Oeste     -> productos y servicios (hace trabajos a terceros)
--   · Huerta Norte              -> nada: todavia esta pendiente de aprobacion
--
-- Lo que no figura aca queda con el valor por defecto del catalogo de modulos.

INSERT INTO empresa_modulos (id_empresa, id_modulo, activo)
SELECT e.id_empresa, m.id_modulo, 1
FROM empresas e JOIN modulos m
WHERE (e.email = 'contacto@laesperanza.com.ar' AND m.clave IN ('productos'))
   OR (e.email = 'contacto@elamanecer.com.ar'  AND m.clave IN ('productos'))
   OR (e.email = 'contacto@metaloeste.com.ar'  AND m.clave IN ('productos', 'servicios'));

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

-- =============================================================================
-- Categorías y subcategorías de PRODUCTOS para las 3 empresas que tienen el
-- módulo prendido. Es la clasificación del catálogo, no la del dinero: son
-- cosas distintas y viven en tablas distintas.
--
-- La Esperanza lleva además una categoría desactivada con sus subcategorías
-- inactivas, para poder ver en pantalla cómo se muestra una baja lógica.
-- =============================================================================

-- ------------------------------------------------------ 1 · La Esperanza --
SET @empresa := (SELECT id_empresa FROM empresas WHERE email = 'contacto@laesperanza.com.ar');

INSERT INTO categorias_producto (nombre, id_empresa, activo) VALUES
  ('Alimentos',  @empresa, 1),
  ('Bebidas',    @empresa, 1),
  ('Promociones', @empresa, 0);

SET @cat_alimentos   := (SELECT id_categoria_producto FROM categorias_producto WHERE id_empresa = @empresa AND nombre = 'Alimentos');
SET @cat_bebidas     := (SELECT id_categoria_producto FROM categorias_producto WHERE id_empresa = @empresa AND nombre = 'Bebidas');
SET @cat_promociones := (SELECT id_categoria_producto FROM categorias_producto WHERE id_empresa = @empresa AND nombre = 'Promociones');

INSERT INTO subcategorias_producto (nombre, id_categoria_producto, activo) VALUES
  ('Perecederos',    @cat_alimentos,   1),
  ('No perecederos', @cat_alimentos,   1),
  ('Congelados',     @cat_alimentos,   1),
  ('Con alcohol',    @cat_bebidas,     1),
  ('Sin alcohol',    @cat_bebidas,     1),
  ('Combos',         @cat_promociones, 0);

-- ------------------------------------------------------- 2 · El Amanecer --
SET @empresa := (SELECT id_empresa FROM empresas WHERE email = 'contacto@elamanecer.com.ar');

INSERT INTO categorias_producto (nombre, id_empresa, activo) VALUES
  ('Telas',     @empresa, 1),
  ('Confección', @empresa, 1);

SET @cat_telas      := (SELECT id_categoria_producto FROM categorias_producto WHERE id_empresa = @empresa AND nombre = 'Telas');
SET @cat_confeccion := (SELECT id_categoria_producto FROM categorias_producto WHERE id_empresa = @empresa AND nombre = 'Confección');

INSERT INTO subcategorias_producto (nombre, id_categoria_producto, activo) VALUES
  ('Algodón',     @cat_telas,      1),
  ('Poliéster',   @cat_telas,      1),
  ('Remeras',     @cat_confeccion, 1),
  ('Pantalones',  @cat_confeccion, 1),
  ('Uniformes',   @cat_confeccion, 1);

-- ------------------------------------------------------- 3 · Metal Oeste --
SET @empresa := (SELECT id_empresa FROM empresas WHERE email = 'contacto@metaloeste.com.ar');

INSERT INTO categorias_producto (nombre, id_empresa, activo) VALUES
  ('Materia prima', @empresa, 1),
  ('Herramientas',  @empresa, 1);

SET @cat_materia      := (SELECT id_categoria_producto FROM categorias_producto WHERE id_empresa = @empresa AND nombre = 'Materia prima');
SET @cat_herramientas := (SELECT id_categoria_producto FROM categorias_producto WHERE id_empresa = @empresa AND nombre = 'Herramientas');

INSERT INTO subcategorias_producto (nombre, id_categoria_producto, activo) VALUES
  ('Chapa',       @cat_materia,      1),
  ('Caño',        @cat_materia,      1),
  ('Electrodos',  @cat_materia,      1),
  ('Manuales',    @cat_herramientas, 1),
  ('Eléctricas',  @cat_herramientas, 1);

-- =============================================================================
-- CATÁLOGO DE PRODUCTOS
--
-- Qué productos existen en cada empresa. Las cantidades son otra cosa (el
-- stock) y todavía no están.
--
-- La subcategoría es opcional a propósito: hay productos cargados sin ella,
-- para ver en pantalla que se puede clasificar sólo por categoría.
-- =============================================================================

-- ------------------------------------------------------ 1 · La Esperanza --
SET @empresa := (SELECT id_empresa FROM empresas WHERE email = 'contacto@laesperanza.com.ar');

SET @cat_alimentos := (SELECT id_categoria_producto FROM categorias_producto WHERE id_empresa = @empresa AND nombre = 'Alimentos');
SET @cat_bebidas   := (SELECT id_categoria_producto FROM categorias_producto WHERE id_empresa = @empresa AND nombre = 'Bebidas');

SET @sub_perecederos := (SELECT id_subcategoria_producto FROM subcategorias_producto WHERE id_categoria_producto = @cat_alimentos AND nombre = 'Perecederos');
SET @sub_no_perec    := (SELECT id_subcategoria_producto FROM subcategorias_producto WHERE id_categoria_producto = @cat_alimentos AND nombre = 'No perecederos');
SET @sub_congelados  := (SELECT id_subcategoria_producto FROM subcategorias_producto WHERE id_categoria_producto = @cat_alimentos AND nombre = 'Congelados');
SET @sub_sin_alcohol := (SELECT id_subcategoria_producto FROM subcategorias_producto WHERE id_categoria_producto = @cat_bebidas AND nombre = 'Sin alcohol');

INSERT INTO productos (nombre, descripcion, unidad_medida, stock_minimo, id_categoria_producto, id_subcategoria_producto, id_empresa, activo) VALUES
  ('Queso cremoso',      'Horma entera',            'kg',      5.50, @cat_alimentos, @sub_perecederos, @empresa, 1),
  ('Jamón cocido',       NULL,                      'kg',      3.00, @cat_alimentos, @sub_perecederos, @empresa, 1),
  ('Fideos secos 500g',  'Paquete de medio kilo',   'paquete', 24,   @cat_alimentos, @sub_no_perec,    @empresa, 1),
  ('Arroz largo fino',   NULL,                      'kg',      15,   @cat_alimentos, @sub_no_perec,    @empresa, 1),
  ('Milanesas de soja',  'Caja x 12 unidades',      'caja',    4,    @cat_alimentos, @sub_congelados,  @empresa, 1),
  ('Bolsa de pan',       'Sin subcategoría',        'bolsa',   0,    @cat_alimentos, NULL,             @empresa, 1),
  ('Agua mineral 2L',    NULL,                      'unidad',  36,   @cat_bebidas,   @sub_sin_alcohol, @empresa, 1),
  ('Gaseosa cola 2,25L', 'Producto discontinuado',  'unidad',  0,    @cat_bebidas,   @sub_sin_alcohol, @empresa, 0);

-- ------------------------------------------------------- 2 · El Amanecer --
SET @empresa := (SELECT id_empresa FROM empresas WHERE email = 'contacto@elamanecer.com.ar');

SET @cat_telas      := (SELECT id_categoria_producto FROM categorias_producto WHERE id_empresa = @empresa AND nombre = 'Telas');
SET @cat_confeccion := (SELECT id_categoria_producto FROM categorias_producto WHERE id_empresa = @empresa AND nombre = 'Confección');

SET @sub_algodon    := (SELECT id_subcategoria_producto FROM subcategorias_producto WHERE id_categoria_producto = @cat_telas AND nombre = 'Algodón');
SET @sub_remeras    := (SELECT id_subcategoria_producto FROM subcategorias_producto WHERE id_categoria_producto = @cat_confeccion AND nombre = 'Remeras');
SET @sub_uniformes  := (SELECT id_subcategoria_producto FROM subcategorias_producto WHERE id_categoria_producto = @cat_confeccion AND nombre = 'Uniformes');

INSERT INTO productos (nombre, descripcion, unidad_medida, stock_minimo, id_categoria_producto, id_subcategoria_producto, id_empresa, activo) VALUES
  ('Tela algodón blanca',  'Ancho 1,50 m',          'metro',  50.5, @cat_telas,      @sub_algodon,   @empresa, 1),
  ('Tela algodón azul',    NULL,                    'metro',  50,   @cat_telas,      @sub_algodon,   @empresa, 1),
  ('Remera lisa talle M',  NULL,                    'unidad', 20,   @cat_confeccion, @sub_remeras,   @empresa, 1),
  ('Ambo de trabajo',      'Pantalón y chaqueta',   'unidad', 6,    @cat_confeccion, @sub_uniformes, @empresa, 1),
  ('Retazos surtidos',     'Sobrantes de corte',    'kg',     0,    @cat_telas,      NULL,           @empresa, 1);

-- ------------------------------------------------------- 3 · Metal Oeste --
SET @empresa := (SELECT id_empresa FROM empresas WHERE email = 'contacto@metaloeste.com.ar');

SET @cat_materia      := (SELECT id_categoria_producto FROM categorias_producto WHERE id_empresa = @empresa AND nombre = 'Materia prima');
SET @cat_herramientas := (SELECT id_categoria_producto FROM categorias_producto WHERE id_empresa = @empresa AND nombre = 'Herramientas');

SET @sub_chapa      := (SELECT id_subcategoria_producto FROM subcategorias_producto WHERE id_categoria_producto = @cat_materia AND nombre = 'Chapa');
SET @sub_cano       := (SELECT id_subcategoria_producto FROM subcategorias_producto WHERE id_categoria_producto = @cat_materia AND nombre = 'Caño');
SET @sub_electrodos := (SELECT id_subcategoria_producto FROM subcategorias_producto WHERE id_categoria_producto = @cat_materia AND nombre = 'Electrodos');
SET @sub_electricas := (SELECT id_subcategoria_producto FROM subcategorias_producto WHERE id_categoria_producto = @cat_herramientas AND nombre = 'Eléctricas');

INSERT INTO productos (nombre, descripcion, unidad_medida, stock_minimo, id_categoria_producto, id_subcategoria_producto, id_empresa, activo) VALUES
  ('Chapa galvanizada N°20', 'Hoja de 1 x 2 m',      'unidad', 10,  @cat_materia,      @sub_chapa,      @empresa, 1),
  ('Caño estructural 40x40', 'Barra de 6 m',         'metro',  120, @cat_materia,      @sub_cano,       @empresa, 1),
  ('Electrodo 2,5 mm',       'Caja de 5 kg',         'caja',   2,   @cat_materia,      @sub_electrodos, @empresa, 1),
  ('Amoladora angular',      NULL,                   'unidad', 0,   @cat_herramientas, @sub_electricas, @empresa, 1),
  ('Pintura antióxido',      'Balde de 4 litros',    'litro',  8,   @cat_materia,      NULL,            @empresa, 1);

-- =============================================================================
-- MOTIVOS DE MOVIMIENTO DE STOCK
--
-- Los seis motivos con los que arranca cualquier empresa (los mismos que
-- siembra el sistema al aprobarla, en src/config/datos-iniciales.js), más uno
-- propio por empresa para que se vea que son configurables.
--
-- Lo que hay que mirar es la columna del dinero: Compra y Venta son los únicos
-- que mueven plata. Pérdida y Robo sacan mercadería sin mover un peso.
-- =============================================================================

INSERT INTO motivos_stock (nombre, efecto_stock, efecto_dinero, id_empresa, activo)
SELECT m.nombre, m.efecto_stock, m.efecto_dinero, e.id_empresa, 1
FROM empresas e
JOIN (
  SELECT 'Compra'          AS nombre, 'entrada' AS efecto_stock, 'egreso'  AS efecto_dinero UNION ALL
  SELECT 'Venta',                     'salida',                  'ingreso'                  UNION ALL
  SELECT 'Consumo interno',           'salida',                  'ninguno'                  UNION ALL
  SELECT 'Pérdida',                   'salida',                  'ninguno'                  UNION ALL
  SELECT 'Robo',                      'salida',                  'ninguno'                  UNION ALL
  SELECT 'Ajuste positivo',           'entrada',                 'ninguno'                  UNION ALL
  SELECT 'Ajuste negativo',           'salida',                  'ninguno'
) m
WHERE e.email IN ('contacto@laesperanza.com.ar', 'contacto@elamanecer.com.ar',
                  'contacto@metaloeste.com.ar');

-- Un motivo propio de cada empresa, para mostrar que se pueden agregar.
-- El de La Esperanza está desactivado, para ver cómo se muestra una baja.
INSERT INTO motivos_stock (nombre, efecto_stock, efecto_dinero, id_empresa, activo) VALUES
  ('Vencimiento',        'salida',  'ninguno', (SELECT id_empresa FROM empresas WHERE email = 'contacto@laesperanza.com.ar'), 1),
  ('Promoción sin cargo','salida',  'ninguno', (SELECT id_empresa FROM empresas WHERE email = 'contacto@laesperanza.com.ar'), 0),
  ('Devolución a cliente','entrada','ninguno', (SELECT id_empresa FROM empresas WHERE email = 'contacto@elamanecer.com.ar'),  1),
  ('Recorte de producción','salida','ninguno', (SELECT id_empresa FROM empresas WHERE email = 'contacto@metaloeste.com.ar'),  1);

-- =============================================================================
-- MOVIMIENTOS DE STOCK
--
-- La existencia de cada producto NO está guardada en ninguna columna: sale de
-- sumar estos movimientos. Por eso acá se carga la historia y el sistema
-- calcula el número.
--
-- Está armado para que al abrir la pantalla se vean los tres estados:
--   · productos con stock holgado
--   · productos POR DEBAJO del mínimo (avisan "Reponer")
--   · un producto en CERO (avisa "Sin stock")
--
-- Las fechas son relativas a hoy, para que el historial se vea reciente.
-- =============================================================================

-- ------------------------------------------------------ 1 · La Esperanza --
SET @empresa  := (SELECT id_empresa FROM empresas WHERE email = 'contacto@laesperanza.com.ar');
SET @operador := (SELECT id FROM usuarios WHERE email = 'silvia@laesperanza.com.ar');

SET @m_compra  := (SELECT id_motivo_stock FROM motivos_stock WHERE id_empresa = @empresa AND nombre = 'Compra');
SET @m_venta   := (SELECT id_motivo_stock FROM motivos_stock WHERE id_empresa = @empresa AND nombre = 'Venta');
SET @m_perdida := (SELECT id_motivo_stock FROM motivos_stock WHERE id_empresa = @empresa AND nombre = 'Pérdida');

SET @p_queso    := (SELECT id_producto FROM productos WHERE id_empresa = @empresa AND nombre = 'Queso cremoso');
SET @p_jamon    := (SELECT id_producto FROM productos WHERE id_empresa = @empresa AND nombre = 'Jamón cocido');
SET @p_fideos   := (SELECT id_producto FROM productos WHERE id_empresa = @empresa AND nombre = 'Fideos secos 500g');
SET @p_arroz    := (SELECT id_producto FROM productos WHERE id_empresa = @empresa AND nombre = 'Arroz largo fino');
SET @p_milanesa := (SELECT id_producto FROM productos WHERE id_empresa = @empresa AND nombre = 'Milanesas de soja');
SET @p_agua     := (SELECT id_producto FROM productos WHERE id_empresa = @empresa AND nombre = 'Agua mineral 2L');

INSERT INTO movimientos_stock (id_producto, id_motivo_stock, cantidad, descripcion, fecha, id_empresa, id_usuario) VALUES
  -- Queso cremoso (mínimo 5,5): 20 - 12,5 - 2 = 5,5, justo en el mínimo
  (@p_queso,    @m_compra,  20,   'Compra semanal',              CURDATE() - INTERVAL 12 DAY, @empresa, @operador),
  (@p_queso,    @m_venta,   12.5, 'Venta mostrador',             CURDATE() - INTERVAL 6  DAY, @empresa, @operador),
  (@p_queso,    @m_perdida, 2,    'Se cortó la cadena de frío',  CURDATE() - INTERVAL 4  DAY, @empresa, @operador),
  -- Jamón cocido (mínimo 3): 15 - 6 = 9, holgado
  (@p_jamon,    @m_compra,  15,   'Compra semanal',              CURDATE() - INTERVAL 12 DAY, @empresa, @operador),
  (@p_jamon,    @m_venta,    6,   'Venta mostrador',             CURDATE() - INTERVAL 3  DAY, @empresa, @operador),
  -- Fideos secos (mínimo 24): 48 - 30 = 18, POR DEBAJO del mínimo
  (@p_fideos,   @m_compra,  48,   'Compra mensual',              CURDATE() - INTERVAL 20 DAY, @empresa, @operador),
  (@p_fideos,   @m_venta,   30,   'Ventas de la quincena',       CURDATE() - INTERVAL 2  DAY, @empresa, @operador),
  -- Arroz (mínimo 15): 40, holgado
  (@p_arroz,    @m_compra,  40,   'Compra mensual',              CURDATE() - INTERVAL 18 DAY, @empresa, @operador),
  -- Milanesas de soja (mínimo 4): 10 - 10 = 0, SIN STOCK
  (@p_milanesa, @m_compra,  10,   'Compra',                      CURDATE() - INTERVAL 15 DAY, @empresa, @operador),
  (@p_milanesa, @m_venta,   10,   'Se vendió todo',              CURDATE() - INTERVAL 1  DAY, @empresa, @operador),
  -- Agua mineral (mínimo 36): 72 - 12 = 60, holgado
  (@p_agua,     @m_compra,  72,   'Compra a distribuidora',      CURDATE() - INTERVAL 10 DAY, @empresa, @operador),
  (@p_agua,     @m_venta,   12,   'Ventas de la semana',         CURDATE() - INTERVAL 2  DAY, @empresa, @operador);

-- ------------------------------------------------------- 3 · Metal Oeste --
SET @empresa  := (SELECT id_empresa FROM empresas WHERE email = 'contacto@metaloeste.com.ar');
SET @operador := (SELECT id FROM usuarios WHERE id_empresa = @empresa AND id_rol = 3 AND activo = 1 LIMIT 1);

SET @m_compra  := (SELECT id_motivo_stock FROM motivos_stock WHERE id_empresa = @empresa AND nombre = 'Compra');
SET @m_consumo := (SELECT id_motivo_stock FROM motivos_stock WHERE id_empresa = @empresa AND nombre = 'Consumo interno');

SET @p_chapa      := (SELECT id_producto FROM productos WHERE id_empresa = @empresa AND nombre = 'Chapa galvanizada N°20');
SET @p_cano       := (SELECT id_producto FROM productos WHERE id_empresa = @empresa AND nombre = 'Caño estructural 40x40');
SET @p_electrodos := (SELECT id_producto FROM productos WHERE id_empresa = @empresa AND nombre = 'Electrodo 2,5 mm');

INSERT INTO movimientos_stock (id_producto, id_motivo_stock, cantidad, descripcion, fecha, id_empresa, id_usuario) VALUES
  -- Chapa (mínimo 10): 30 - 8 = 22
  (@p_chapa,      @m_compra,   30, 'Compra a proveedor',      CURDATE() - INTERVAL 14 DAY, @empresa, @operador),
  (@p_chapa,      @m_consumo,   8, 'Usada en pedido de obra', CURDATE() - INTERVAL 5  DAY, @empresa, @operador),
  -- Caño (mínimo 120): 150 - 60 = 90, POR DEBAJO del mínimo
  (@p_cano,       @m_compra,  150, 'Compra de barras',        CURDATE() - INTERVAL 16 DAY, @empresa, @operador),
  (@p_cano,       @m_consumo,  60, 'Estructura del galpón',   CURDATE() - INTERVAL 3  DAY, @empresa, @operador),
  -- Electrodos (mínimo 2): 6 - 1 = 5
  (@p_electrodos, @m_compra,    6, 'Compra',                  CURDATE() - INTERVAL 9  DAY, @empresa, @operador),
  (@p_electrodos, @m_consumo,   1, 'Consumo del taller',      CURDATE() - INTERVAL 2  DAY, @empresa, @operador);

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

-- Clasificación del catálogo de productos por empresa
SELECT e.nombre AS empresa,
       COUNT(DISTINCT cp.id_categoria_producto) AS categorias,
       COUNT(sp.id_subcategoria_producto)       AS subcategorias
FROM empresas e
JOIN categorias_producto cp     ON cp.id_empresa = e.id_empresa
LEFT JOIN subcategorias_producto sp ON sp.id_categoria_producto = cp.id_categoria_producto
GROUP BY e.id_empresa
ORDER BY e.id_empresa;

-- Catálogo de productos por empresa
SELECT e.nombre AS empresa,
       COUNT(p.id_producto)                                 AS productos,
       SUM(CASE WHEN p.activo = 1 THEN 1 ELSE 0 END)        AS activos,
       SUM(CASE WHEN p.id_subcategoria_producto IS NULL THEN 1 ELSE 0 END) AS sin_subcategoria
FROM empresas e
JOIN productos p ON p.id_empresa = e.id_empresa
GROUP BY e.id_empresa
ORDER BY e.id_empresa;

-- Motivos de stock por empresa
SELECT e.nombre AS empresa,
       COUNT(*)                                                      AS motivos,
       SUM(CASE WHEN ms.efecto_dinero <> 'ninguno' THEN 1 ELSE 0 END) AS mueven_dinero,
       SUM(CASE WHEN ms.activo = 0 THEN 1 ELSE 0 END)                 AS inactivos
FROM empresas e
JOIN motivos_stock ms ON ms.id_empresa = e.id_empresa
GROUP BY e.id_empresa
ORDER BY e.id_empresa;

-- Existencias calculadas (así las ve la pantalla de Stock)
SELECT e.nombre AS empresa, p.nombre AS producto, p.unidad_medida,
       COALESCE(SUM(CASE WHEN ms.anulado = 1 THEN 0
                         WHEN mo.efecto_stock = 'entrada' THEN ms.cantidad
                         ELSE -ms.cantidad END), 0) AS existencia,
       p.stock_minimo AS minimo
FROM productos p
JOIN empresas e                ON e.id_empresa = p.id_empresa
LEFT JOIN movimientos_stock ms ON ms.id_producto = p.id_producto
LEFT JOIN motivos_stock mo     ON mo.id_motivo_stock = ms.id_motivo_stock
WHERE p.id_empresa IN (SELECT id_empresa FROM empresas
                       WHERE email IN ('contacto@laesperanza.com.ar', 'contacto@metaloeste.com.ar'))
GROUP BY p.id_producto
ORDER BY e.id_empresa, p.nombre;
