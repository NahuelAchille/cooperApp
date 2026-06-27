exports.requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
};

exports.requireRol = (...roles) => (req, res, next) => {
  if (!req.session.user || !roles.includes(req.session.user.rol)) {
    return res.status(403).json({ error: 'Sin permiso para realizar esta acción' });
  }
  next();
};
