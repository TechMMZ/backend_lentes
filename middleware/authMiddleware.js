import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar token JWT
 */
export const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // Guardamos los datos del usuario (id, email, role)
    next();
  } catch (error) {
    console.error('Error en verificarToken:', error.message);
    return res.status(401).json({ msg: 'Token inválido o expirado.' });
  }
};

/**
 * Middleware para permitir solo administradores
 */
export const soloAdmin = (req, res, next) => {
  if (req.usuario?.role !== 'admin') {
    return res.status(403).json({ msg: 'Acceso denegado. Solo para administradores.' });
  }
  next();
};

/**
 * Middleware para permitir solo clientes
 */
export const soloCliente = (req, res, next) => {
  if (req.usuario?.role !== 'cliente') {
    return res.status(403).json({ msg: 'Acceso denegado. Solo para clientes.' });
  }
  next();
};
