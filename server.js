import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import heroBackgroundRoutes from './routes/heroBackgroundRoutes.js';
import productosRoutes from './routes/productosRoutes.js';
import seccionesRoutes from './routes/secciones.js';
import chatbotRoutes from './routes/chatbotRoutes.js';

dotenv.config();

const app = express();

// Obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/', (req, res) => {
  res.send('API de Suncity funcionando 🚀');
});

// Middleware para CORS y parseo JSON
app.use(cors());
app.use(express.json());

// Sirve la carpeta 'uploads' para imágenes subidas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Sirve la carpeta 'img' para imágenes estáticas
app.use('/img', express.static(path.join(__dirname, 'img')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/hero-background', heroBackgroundRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/secciones', seccionesRoutes);
// app.use('/api/chatbot', chatbotRoutes);

// Puerto
const PORT = process.env.PORT || 7500;

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Error en el servidor:', err);
});
