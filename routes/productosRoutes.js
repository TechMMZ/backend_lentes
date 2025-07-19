import express from 'express';
import {
    getAllProductos,
    getProductosPorSeccion,
    getProductoById,
    createProducto,
    updateProducto,
    deleteProducto,
    uploadMultiple
} from '../controllers/productoController.js';

import { verificarToken, soloAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Listar productos
router.get('/', getAllProductos);

// ✅ Listar productos por sección
router.get('/seccion/:seccion', getProductosPorSeccion);

// ✅ Obtener un producto por ID
router.get('/:id', getProductoById);

// ✅ Crear producto (solo admin)
router.post('/', verificarToken, soloAdmin, uploadMultiple, createProducto);

// ✅ Actualizar producto (solo admin)
router.put('/:id', verificarToken, soloAdmin, uploadMultiple, updateProducto);

// ✅ Eliminar producto (solo admin)
router.delete('/:id', verificarToken, soloAdmin, deleteProducto);

export default router;
