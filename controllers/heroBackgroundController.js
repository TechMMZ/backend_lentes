import db from '../models/db.js';
import path from 'path';
import fs from 'fs';

// ✅ Obtener HeroBackground
export const getHeroBackground = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM heroBackground LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'No hay datos de HeroBackground' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener HeroBackground:', error);
    res.status(500).json({ msg: 'Error interno al obtener HeroBackground' });
  }
};

// ✅ Actualizar HeroBackground
export const updateHeroBackground = async (req, res) => {
  try {
    const { title, description } = req.body;

    const fondo_grande = req.files?.fondo_grande?.[0]?.filename || null;
    const fondo_pequeno = req.files?.fondo_pequeno?.[0]?.filename || null;
    const anuncio = req.files?.anuncio?.[0]?.filename || null;

    const result = await db.query('SELECT * FROM heroBackground WHERE id = 1');
    const uploadsPath = path.join(path.resolve(), 'uploads');

    if (result.rows.length === 0) {
      // ✅ No existe, insertamos
      await db.query(
        `INSERT INTO heroBackground 
        ( title, description, "fondo_grande", "fondo_pequeno", anuncio, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [title, description, fondo_grande, fondo_pequeno, anuncio]
      );
    } else {
      const existing = result.rows[0];

      // ✅ Eliminar imágenes antiguas si se reemplazan
      if (fondo_grande && existing.fondo_grande && fondo_grande !== existing.fondo_grande) {
        fs.unlink(path.join(uploadsPath, existing.fondo_grande), err => {
          if (err) console.error('Error eliminando fondo_grande viejo:', err);
        });
      }
      if (fondo_pequeno && existing.fondo_pequeno && fondo_pequeno !== existing.fondo_pequeno) {
        fs.unlink(path.join(uploadsPath, existing.fondo_pequeno), err => {
          if (err) console.error('Error eliminando fondo_pequeno viejo:', err);
        });
      }
      if (anuncio && existing.anuncio && anuncio !== existing.anuncio) {
        fs.unlink(path.join(uploadsPath, existing.anuncio), err => {
          if (err) console.error('Error eliminando anuncio viejo:', err);
        });
      }

      // ✅ Actualizamos (COALESCE igual funciona en PostgreSQL)
      await db.query(
        `UPDATE heroBackground SET
          title = $1,
          description = $2,
          "fondo_grande" = COALESCE($3, "fondo_grande"),
          "fondo_pequeno" = COALESCE($4, "fondo_pequeno"),
          anuncio = COALESCE($5, anuncio),
          updated_at = NOW()
        WHERE id = 1`,
        [title, description, fondo_grande, fondo_pequeno, anuncio]
      );
    }

    res.json({ msg: 'HeroBackground actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar HeroBackground:', error);
    res.status(500).json({ msg: 'Error al actualizar HeroBackground' });
  }
};
