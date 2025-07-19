import express from 'express';
import pool from '../models/db.js';

const router = express.Router();

// ✅ Ruta: Obtener todas las secciones de productos
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT seccion, nombre_seccion 
            FROM productos
            ORDER BY nombre_seccion ASC
        `);
        const rows = result.rows;

        if (rows.length === 0) {
            return res.status(404).json({ msg: 'No se encontraron secciones' });
        }

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener secciones:', error.message, error.stack);
        res.status(500).json({ msg: 'Error interno del servidor' });
    }
});

export default router;
