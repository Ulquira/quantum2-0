import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { pool } from './db';

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'quantum2-win-secret-key-2026';

// 1. LOGIN (Sin obligar a cambiar contraseña)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { documentNumber, password } = req.body;
    const cleanDoc = String(documentNumber || '').trim();
    const cleanPass = String(password || '').trim();

    const [rows]: any = await pool.query(
      'SELECT * FROM usuarios WHERE documento = ? OR usuario = ? LIMIT 1',
      [cleanDoc, cleanDoc]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const dbUser = rows[0];
    const storedPass = String(dbUser.password || dbUser.clave || cleanDoc).trim();

    if (cleanPass !== storedPass && cleanPass !== cleanDoc) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const userPayload = {
      id: String(dbUser.id || dbUser.usuario_id || 1),
      documentNumber: cleanDoc,
      fullName: dbUser.nombre_completo || dbUser.nombres || dbUser.usuario || `Técnico ${cleanDoc}`,
      zone: dbUser.zona || 'Lima Metropolitana',
      mustChangePassword: false,
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, user: userPayload });
  } catch (error: any) {
    console.error('Error en /api/auth/login:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// 2. CAMBIO DE CONTRASEÑA
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { documentNumber, newPassword } = req.body;
    await pool.query(
      'UPDATE usuarios SET password = ? WHERE documento = ? OR usuario = ?',
      [newPassword, documentNumber, documentNumber]
    );
    return res.json({ ok: true });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// 3. LISTAR ÓRDENES ASIGNADAS AL TÉCNICO + SUS TAREAS/FOTOS
app.get('/api/orders/:documentNumber', async (req, res) => {
  try {
    const { documentNumber } = req.params;
    const [orders]: any = await pool.query(
      'SELECT * FROM vw_winordetraba WHERE UsuarioResponsable = ? OR Cuadrilla LIKE ? ORDER BY OrdenId DESC LIMIT 50',
      [documentNumber, `%${documentNumber}%`]
    );

    for (const order of orders) {
      const [tasks]: any = await pool.query(
        'SELECT * FROM orden_tareas_fotos WHERE OrdenId = ? ORDER BY id ASC',
        [order.OrdenId]
      );
      order.tasks = tasks || [];
    }

    return res.json(orders);
  } catch (error: any) {
    console.error('Error en GET /api/orders:', error.message);
    return res.status(500).json({ message: error.message });
  }
});

// 4. ACTUALIZAR ESTADO DE LA ORDEN (AGENDADA -> EN CAMINO -> EN PROCESO -> FINALIZADO)
app.put('/api/orders/:ordenId/status', async (req, res) => {
  try {
    const { ordenId } = req.params;
    const { status, georeferencia_tecnico, diagnostico } = req.body;

    await pool.query(
      `UPDATE vw_winordetraba 
       SET EstadoOT = ?, 
           Georeferencia_tecnico = COALESCE(?, Georeferencia_tecnico),
           \`DiagnósticoTécnico\` = COALESCE(?, \`DiagnósticoTécnico\`)
       WHERE OrdenId = ?`,
      [status, georeferencia_tecnico || null, diagnostico || null, ordenId]
    );

    return res.json({ ok: true });
  } catch (error: any) {
    console.error('Error en PUT /api/orders/:ordenId/status:', error.message);
    return res.status(500).json({ message: error.message });
  }
});

// 5. GUARDAR / ACTUALIZAR TAREA Y FOTO EN orden_tareas_fotos
app.put('/api/orders/task/:taskId', async (req, res) => {
  try {
    const {
      ordenId,
      codigo_tarea,
      titulo,
      valor_ingresado,
      foto_url,
      completado,
      lat,
      lng,
    } = req.body;

    const [existing]: any = await pool.query(
      'SELECT id FROM orden_tareas_fotos WHERE OrdenId = ? AND codigo_tarea = ? LIMIT 1',
      [ordenId, codigo_tarea]
    );

    if (existing && existing.length > 0) {
      await pool.query(
        `UPDATE orden_tareas_fotos 
         SET valor_ingresado = ?, foto_url = ?, completado = ?, latitud_foto = ?, longitud_foto = ?, updated_at = NOW()
         WHERE id = ?`,
        [valor_ingresado || '', foto_url || null, completado ? 1 : 0, lat || null, lng || null, existing[0].id]
      );
    } else if (ordenId && codigo_tarea) {
      await pool.query(
        `INSERT INTO orden_tareas_fotos 
         (OrdenId, codigo_tarea, titulo, requiere_foto, valor_ingresado, foto_url, completado, latitud_foto, longitud_foto)
         VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)`,
        [ordenId, codigo_tarea, titulo || codigo_tarea, valor_ingresado || '', foto_url || null, completado ? 1 : 0, lat || null, lng || null]
      );
    }

    return res.json({ ok: true });
  } catch (error: any) {
    console.error('Error en PUT /api/orders/task:', error.message);
    return res.status(500).json({ message: error.message });
  }
});

// 6. TELEMETRÍA GPS EN TIEMPO REAL DEL TÉCNICO
app.post('/api/tracking/ping', async (req, res) => {
  try {
    const { documentNumber, ordenId, lat, lng, accuracy } = req.body;
    await pool.query(
      `INSERT INTO tecnico_ubicaciones_log (documento_tecnico, OrdenId, latitud, longitud, precision_metros)
       VALUES (?, ?, ?, ?, ?)`,
      [documentNumber || '111', ordenId || null, lat, lng, accuracy || null]
    );
    return res.json({ ok: true });
  } catch {
    return res.json({ ok: false });
  }
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Quantum 2.0 API corriendo en http://0.0.0.0:${PORT}`);
});
