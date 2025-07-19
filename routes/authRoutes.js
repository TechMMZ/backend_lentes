import express from 'express';
import { register, login, logout, cambiarContrasena, obtenerClientes, eliminarCliente } from '../controllers/authController.js';
import { verificarToken } from '../middleware/authMiddleware.js';
import db from '../models/db.js';

const router = express.Router();

// Rutas de autenticación
router.post('/register', register);
router.post('/login', login);
router.post('/logout', verificarToken, logout);
router.put('/cambiar-contrasena', verificarToken, cambiarContrasena);

// Rutas protegidas
router.get('/clientes', verificarToken, obtenerClientes);
router.delete('/clientes/:id', verificarToken, eliminarCliente);

// Verificar si ya existe un administrador
router.get('/admin-existe', async (req, res) => {
    try {
        const result = await db.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
        res.json({ existe: result.rows.length > 0 });
    } catch (err) {
        console.error('Error verificando existencia de admin:', err);
        res.status(500).json({ msg: 'Error al verificar admin.' });
    }
});

export default router;
