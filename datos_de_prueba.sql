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
-- =============================================================================

SET NAMES utf8mb4;

USE cooperApp;

-- ---------------------------------------------------------------- limpieza --
DELETE FROM movimientos WHERE id_cooperativa IN (
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

-- ------------------------------------------------------------ comprobación --
SELECT c.nombre AS cooperativa, c.estado, COUNT(u.id) AS miembros
FROM cooperativas c
LEFT JOIN usuarios u ON u.id_cooperativa = c.id_cooperativa
GROUP BY c.id_cooperativa
ORDER BY c.id_cooperativa;
