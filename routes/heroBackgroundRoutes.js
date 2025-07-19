import express from 'express';
import multer from 'multer';
import path from 'path';
import { getHeroBackground, updateHeroBackground } from '../controllers/heroBackgroundController.js';

const router = express.Router();

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads')); // Carpeta segura
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPG, PNG, WEBP).'));
  }
};

// Multer con límite de tamaño (5 MB por archivo)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Rutas
router.get('/', getHeroBackground);

router.put(
  '/',
  upload.fields([
    { name: 'fondoGrande', maxCount: 1 },
    { name: 'fondoPequeno', maxCount: 1 },
    { name: 'anuncio', maxCount: 1 }
  ]),
  updateHeroBackground
);

export default router;
