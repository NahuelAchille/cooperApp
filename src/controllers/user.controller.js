const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.registerUser = async (req, res) => {
  try {
    const { nombre, apellido, email, contraseña, confirmar_contraseña, dni, fecha_nacimiento, domicilio, codigo_postal } = req.body;

    if (!nombre || !apellido || !email || !contraseña || !dni) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (contraseña !== confirmar_contraseña) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    const [existingUser] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const [existingDni] = await db.query('SELECT id FROM usuarios WHERE dni = ?', [dni]);
    if (existingDni.length > 0) {
      return res.status(400).json({ error: 'El DNI ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(contraseña, 10);

    const query = `
      INSERT INTO usuarios (nombre, apellido, email, contraseña, dni, fecha_nacimiento, domicilio, codigo_postal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(query, [nombre, apellido, email, hashedPassword, dni, fecha_nacimiento, domicilio, codigo_postal]);

    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};
