import express from 'express';
import pool from '../models/db.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
let estadoUsuario = {}; // Simula sesiones simples por usuario

const BASE_URL = process.env.BASE_URL || 'http://localhost:7500';

const menuPrincipal = [
  { text: '¿Quieres otra cosa? Elige una opción:' },
  { text: '1. Modelos de lentes' },
  { text: '2. Más baratos' },
  { text: '3. Más caros' },
  { text: '4. En stock' },
  { text: '5. En oferta' }
];

router.post('/', async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'Faltan parámetros userId o message' });
  }

  const msg = message.trim().toLowerCase();
  const despedidas = ['gracias', 'muchas gracias', 'gracias chat', 'thank you', 'thanks'];

  if (despedidas.includes(msg)) {
    estadoUsuario[userId] = { etapa: 'menu_principal' };
    return res.json({
      reply: [{ text: '¡De nada! Si necesitas algo más, escribe "hola" para comenzar.' }]
    });
  }

  if (!estadoUsuario[userId] || ['hola', 'hi', 'hello'].includes(msg)) {
    estadoUsuario[userId] = { etapa: 'menu_principal' };
    return res.json({ reply: menuPrincipal });
  }

  const estado = estadoUsuario[userId];

  try {
    switch (estado.etapa) {
      case 'menu_principal':
        if (['1', 'modelos de lentes'].includes(msg)) {
          const [rows] = await pool.query('SELECT DISTINCT seccion, nombre_seccion FROM productos');
          estado.etapa = 'elegir_seccion';
          return res.json({
            reply: [
              { text: 'Estas son las secciones disponibles:' },
              ...rows.map(r => ({ text: `- ${r.nombre_seccion} (${r.seccion})` })),
              { text: '\nEscribe el código de la sección que quieres ver (ejemplo: lo_nuevo).' }
            ]
          });
        }

        if (['2', 'más baratos', 'mas baratos'].includes(msg)) {
          const [rows] = await pool.query('SELECT * FROM productos WHERE en_stock=TRUE ORDER BY precio_normal ASC LIMIT 10');
          return res.json({ reply: [...formatProductos(rows), { text: '' }, ...menuPrincipal] });
        }

        if (['3', 'más caros', 'mas caros'].includes(msg)) {
          const [rows] = await pool.query('SELECT * FROM productos WHERE en_stock=TRUE ORDER BY precio_normal DESC LIMIT 10');
          return res.json({ reply: [...formatProductos(rows), { text: '' }, ...menuPrincipal] });
        }

        if (['4', 'en stock'].includes(msg)) {
          const [rows] = await pool.query('SELECT * FROM productos WHERE en_stock=TRUE LIMIT 10');
          return res.json({ reply: [...formatProductos(rows), { text: '' }, ...menuPrincipal] });
        }

        if (['5', 'en oferta'].includes(msg)) {
          const [rows] = await pool.query('SELECT * FROM productos WHERE en_oferta=TRUE AND en_stock=TRUE LIMIT 10');
          return res.json({ reply: [...formatProductos(rows), { text: '' }, ...menuPrincipal] });
        }

        return res.json({ reply: [{ text: 'Opción no válida. Elige una opción del 1 al 5.' }] });

      case 'elegir_seccion': {
        const [secciones] = await pool.query('SELECT DISTINCT seccion FROM productos');
        const codigosValidos = secciones.map(s => s.seccion);

        if (!codigosValidos.includes(msg)) {
          return res.json({
            reply: [
              { text: 'Sección no válida. Por favor escribe uno de estos códigos:' },
              ...codigosValidos.map(c => ({ text: c }))
            ]
          });
        }

        const [productos] = await pool.query('SELECT * FROM productos WHERE seccion = ? AND en_stock=TRUE', [msg]);
        estado.etapa = 'menu_principal';
        return res.json({ reply: [...formatProductos(productos), { text: '' }, ...menuPrincipal] });
      }

      default:
        estadoUsuario[userId] = { etapa: 'menu_principal' };
        return res.json({ reply: [{ text: 'Reiniciando sesión. Por favor escribe "hola" para empezar.' }] });
    }
  } catch (error) {
    console.error('Error del servidor:', error);
    return res.status(500).json({ reply: [{ text: 'Error del servidor. Intenta nuevamente.' }] });
  }
});

function formatProductos(productos) {
  if (!productos.length) return [{ text: 'No se encontraron productos para esa opción.' }];

  return productos.flatMap(p => {
    const precio = p.en_oferta && p.precio_oferta
      ? `OFERTA: S/${p.precio_oferta}`
      : `Precio: S/${p.precio_normal}`;

    return [
      { text: `${p.nombre_seccion}\n${p.nombre}\n${precio}` },
      { image: `${BASE_URL}/img/${p.imagen_1}` },
      { text: '---' }
    ];
  });
}

export default router;
