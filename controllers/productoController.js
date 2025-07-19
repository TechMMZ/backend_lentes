import db from '../models/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ✅ Configurar almacenamiento multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const seccion = req.body.seccion || 'otros';
        const uploadPath = path.join(path.resolve(), 'img', seccion);
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});

const upload = multer({ storage });
export const uploadMultiple = upload.fields([
    { name: 'imagen_1', maxCount: 1 },
    { name: 'imagen_2', maxCount: 1 },
]);

// ✅ Helper para convertir valores a booleanos
function parseBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const val = value.toLowerCase().trim();
        return val === 'true' || val === '1';
    }
    return false;
}

// ✅ Obtener todos los productos (con filtro opcional por sección)
export async function getAllProductos(req, res) {
    try {
        const { seccion } = req.query;
        let query = 'SELECT * FROM productos';
        const params = [];
        if (seccion) {
            query += ' WHERE seccion = $1';
            params.push(seccion);
        }
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error en getAllProductos:', error);
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
}

// ✅ Obtener productos por sección
export async function getProductosPorSeccion(req, res) {
    try {
        const { seccion } = req.params;
        if (!seccion) return res.status(400).json({ message: 'Sección es requerida' });

        const result = await db.query('SELECT * FROM productos WHERE seccion = $1', [seccion]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error en getProductosPorSeccion:', error);
        res.status(500).json({ error: 'Error al obtener productos por sección' });
    }
}

// ✅ Obtener producto por ID
export async function getProductoById(req, res) {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM productos WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Producto no encontrado' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error en getProductoById:', error);
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
}

// ✅ Crear producto
export async function createProducto(req, res) {
    try {
        const {
            seccion,
            nombre_seccion,
            nombre,
            precio_normal,
            precio_oferta,
            en_oferta,
            en_stock,
            cantidad
        } = req.body;

        if (!req.files || !req.files['imagen_1']) {
            return res.status(400).json({ message: 'Imagen_1 es requerida' });
        }

        if (!seccion || !nombre_seccion || !nombre || !precio_normal || cantidad == null) {
            return res.status(400).json({ message: 'Faltan datos obligatorios para crear el producto' });
        }

        const imagen_1 = path.join(seccion, req.files['imagen_1'][0].filename).replace(/\\/g, '/');
        const imagen_2 = req.files['imagen_2']
            ? path.join(seccion, req.files['imagen_2'][0].filename).replace(/\\/g, '/')
            : null;

        const enOfertaBool = parseBoolean(en_oferta);
        const enStockBool = parseBoolean(en_stock);
        const precioNormalFloat = parseFloat(precio_normal);
        const precioOfertaFloat = precio_oferta ? parseFloat(precio_oferta) : null;
        const cantidadInt = parseInt(cantidad);

        const insertQuery = `
            INSERT INTO productos 
            (seccion, nombre_seccion, nombre, imagen_1, imagen_2, precio_normal, precio_oferta, en_oferta, en_stock, cantidad, creado_en, actualizado_en) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING *`;

        const values = [
            seccion,
            nombre_seccion,
            nombre,
            imagen_1,
            imagen_2,
            precioNormalFloat,
            precioOfertaFloat,
            enOfertaBool,
            enStockBool,
            cantidadInt
        ];

        const result = await db.query(insertQuery, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error en createProducto:', error);
        res.status(500).json({ error: 'Error al crear el producto' });
    }
}

// ✅ Actualizar producto
export async function updateProducto(req, res) {
    try {
        const { id } = req.params;

        const existingResult = await db.query('SELECT * FROM productos WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        const existingProduct = existingResult.rows[0];

        const {
            seccion = existingProduct.seccion,
            nombre_seccion = existingProduct.nombre_seccion,
            nombre = existingProduct.nombre,
            precio_normal = existingProduct.precio_normal,
            precio_oferta = existingProduct.precio_oferta,
            en_oferta = existingProduct.en_oferta,
            en_stock = existingProduct.en_stock,
            cantidad = existingProduct.cantidad
        } = req.body;

        let imagen_1 = existingProduct.imagen_1;
        let imagen_2 = existingProduct.imagen_2;

        if (req.files && req.files['imagen_1']) {
            imagen_1 = path.join(seccion, req.files['imagen_1'][0].filename).replace(/\\/g, '/');
        }
        if (req.files && req.files['imagen_2']) {
            imagen_2 = path.join(seccion, req.files['imagen_2'][0].filename).replace(/\\/g, '/');
        }

        const enOfertaBool = parseBoolean(en_oferta);
        const enStockBool = parseBoolean(en_stock);
        const precioNormalFloat = parseFloat(precio_normal);
        const precioOfertaFloat = precio_oferta ? parseFloat(precio_oferta) : null;
        const cantidadInt = parseInt(cantidad);

        const updateQuery = `
            UPDATE productos SET 
                seccion = $1, 
                nombre_seccion = $2,
                nombre = $3,
                imagen_1 = $4,
                imagen_2 = $5,
                precio_normal = $6,
                precio_oferta = $7,
                en_oferta = $8,
                en_stock = $9,
                cantidad = $10,
                actualizado_en = NOW()
            WHERE id = $11 RETURNING *`;

        const values = [
            seccion,
            nombre_seccion,
            nombre,
            imagen_1,
            imagen_2,
            precioNormalFloat,
            precioOfertaFloat,
            enOfertaBool,
            enStockBool,
            cantidadInt,
            id
        ];

        const updated = await db.query(updateQuery, values);
        res.json(updated.rows[0]);
    } catch (error) {
        console.error('Error en updateProducto:', error);
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
}

// ✅ Eliminar producto
export async function deleteProducto(req, res) {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM productos WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Producto no encontrado' });

        const producto = result.rows[0];
        const imagenes = [producto.imagen_1, producto.imagen_2].filter(Boolean);

        imagenes.forEach(imgRelPath => {
            const imgFullPath = path.join(path.resolve(), 'img', imgRelPath);
            if (fs.existsSync(imgFullPath)) {
                fs.unlinkSync(imgFullPath);
            }
        });

        await db.query('DELETE FROM productos WHERE id = $1', [id]);
        res.json({ message: 'Producto e imágenes eliminados correctamente' });
    } catch (error) {
        console.error('Error en deleteProducto:', error);
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
}
