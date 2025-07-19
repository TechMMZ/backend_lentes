import express from 'express';
import { verificarToken, soloAdmin, soloCliente } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta solo para administradores
router.get('/admin/dashboard', verificarToken, soloAdmin, (req, res) => {
  res.status(200).json({ msg: `Bienvenido administrador: ${req.usuario?.nombre || ''}` });
});

// Ruta solo para clientes
router.get('/cliente/perfil', verificarToken, soloCliente, (req, res) => {
  res.status(200).json({ msg: `Bienvenido cliente: ${req.usuario?.nombre || ''}` });
});

export default router;
