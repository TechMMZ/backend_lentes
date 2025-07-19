import db from '../models/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ✅ Registro de usuario
export const register = async (req, res) => {
  const { nombre, apellidos, email, password, celular, dni, role } = req.body;

  if (!nombre || !apellidos || !email || !password || !celular || !dni) {
    return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
  }

  const finalRole = role === 'admin' ? 'admin' : 'cliente';

  try {
    const existingEmail = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ msg: 'El correo ya está registrado.' });
    }

    if (finalRole === 'admin') {
      const existingAdmin = await db.query('SELECT * FROM users WHERE role = $1', ['admin']);
      if (existingAdmin.rows.length > 0) {
        return res.status(403).json({ msg: 'Ya existe un administrador registrado.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users (nombre, apellidos, email, password, celular, dni, role, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)`,
      [nombre, apellidos, email, hashedPassword, celular, dni, finalRole]
    );

    res.status(201).json({ msg: `Usuario ${finalRole} registrado exitosamente.` });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ msg: 'Error interno al registrar usuario.' });
  }
};

// ✅ Login de usuario
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Correo y contraseña son obligatorios.' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ msg: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    await db.query('UPDATE users SET ultimo_login = NOW(), activo = true WHERE id = $1', [user.id]);

    const updatedUser = await db.query('SELECT * FROM users WHERE id = $1', [user.id]);

    res.status(200).json({
      msg: 'Login exitoso.',
      token,
      usuario: updatedUser.rows[0],
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ msg: 'Error interno al iniciar sesión.' });
  }
};

// ✅ Logout
export const logout = async (req, res) => {
  try {
    const userId = req.usuario.id;
    await db.query('UPDATE users SET activo = false WHERE id = $1', [userId]);
    res.status(200).json({ msg: 'Sesión cerrada correctamente.' });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({ msg: 'Error al cerrar sesión.' });
  }
};

// ✅ Cambiar contraseña
export const cambiarContrasena = async (req, res) => {
  const { passwordActual, passwordNuevo } = req.body;
  const userId = req.usuario.id;

  if (!passwordActual || !passwordNuevo) {
    return res.status(400).json({ msg: 'Debe enviar la contraseña actual y la nueva.' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(passwordActual, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ msg: 'Contraseña actual incorrecta.' });
    }

    const hashedPasswordNuevo = await bcrypt.hash(passwordNuevo, 10);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPasswordNuevo, userId]);

    res.json({ msg: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ msg: 'Error interno al cambiar contraseña.' });
  }
};

// ✅ Obtener clientes
export const obtenerClientes = async (req, res) => {
  try {
    const clientes = await db.query(
      `SELECT id, nombre, apellidos, email, celular, dni, activo, ultimo_login 
       FROM users WHERE role = 'cliente'`
    );
    res.status(200).json(clientes.rows);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ msg: 'Error al obtener los clientes.' });
  }
};

// ✅ Eliminar cliente
export const eliminarCliente = async (req, res) => {
  const clienteId = req.params.id;

  try {
    if (req.usuario.role !== 'admin') {
      return res.status(403).json({ msg: 'No autorizado. Solo el administrador puede eliminar clientes.' });
    }

    const cliente = await db.query('SELECT * FROM users WHERE id = $1 AND role = $2', [clienteId, 'cliente']);
    if (cliente.rows.length === 0) {
      return res.status(404).json({ msg: 'Cliente no encontrado o no válido.' });
    }

    await db.query('DELETE FROM users WHERE id = $1', [clienteId]);

    res.status(200).json({ msg: 'Cliente eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ msg: 'Error al eliminar cliente.' });
  }
};
