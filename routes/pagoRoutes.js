import express from 'express';
import { crearPago } from '../controllers/pagocontroller.js';

const router = express.Router();

// POST /api/pago
router.post('/', crearPago);

export default router;
