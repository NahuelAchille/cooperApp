const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const user = await userModel.findByEmailWithContext(email);

    if (!user) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'Tu cuenta está desactivada' });
    }

    const esSuperadmin = user.rol === 'superadmin';

    if (!esSuperadmin) {
      if (user.cooperativa_estado === 'pendiente') {
        return res.status(403).json({ error: 'Tu cooperativa está pendiente de aprobación' });
      }
      if (user.cooperativa_estado === 'suspendida') {
        return res.status(403).json({ error: 'Tu cooperativa está suspendida' });
      }
    }

    const passwordOk = await bcrypt.compare(password, user.contraseña);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    req.session.user = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol: user.rol,
      id_rol: user.id_rol,
      cooperativa: {
        id: user.id_cooperativa,
        nombre: user.cooperativa_nombre
      }
    };

    res.json({ redirect: '/pages/dashboard.html' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/'));
};

exports.me = (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
  res.json(req.session.user);
};
