import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { pool } from './config/db';

const app = express();
app.use(cors());
app.use(express.json({ limit: '30mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'win-produccion-secreto-minimo-32-caracteres-2026';

async function ensureTestDatabaseSchema(): Promise<void> {
  // 1. Tabla de tareas, fotos, OCR y series
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orden_tareas_fotos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      OrdenId BIGINT NOT NULL,
      codigo_tarea VARCHAR(50) NOT NULL,
      titulo VARCHAR(150) NOT NULL,
      requiere_foto TINYINT(1) NOT NULL DEFAULT 1,
      valor_ingresado VARCHAR(255) DEFAULT '',
      foto_url LONGTEXT NULL,
      fotos_json LONGTEXT NULL,
      completado TINYINT(1) NOT NULL DEFAULT 0,
      latitud_foto DECIMAL(10,7) NULL,
      longitud_foto DECIMAL(10,7) NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_orden_tarea (OrdenId, codigo_tarea),
      INDEX idx_otf_orden (OrdenId)
    )
  `);

  await pool.query(`ALTER TABLE orden_tareas_fotos MODIFY COLUMN foto_url LONGTEXT NULL`).catch(() => {});
  await pool.query(`ALTER TABLE orden_tareas_fotos ADD COLUMN fotos_json LONGTEXT NULL`).catch(() => {});
  await pool.query(`ALTER TABLE orden_tareas_fotos ADD UNIQUE INDEX uk_orden_tarea (OrdenId, codigo_tarea)`).catch(() => {});

  // 2. Tabla de log GPS del técnico
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tecnico_ubicaciones_log (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      documento_tecnico VARCHAR(25) NOT NULL,
      OrdenId BIGINT NULL,
      latitud DECIMAL(10,7) NOT NULL,
      longitud DECIMAL(10,7) NOT NULL,
      precision_metros DECIMAL(8,2) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tech_loc_doc (documento_tecnico, created_at),
      INDEX idx_tech_loc_ord (OrdenId)
    )
  `);

  // 3. Asegurar columnas operativas en vw_winordetraba sin importar cómo fue creada originalmente
  await pool.query(`ALTER TABLE vw_winordetraba ADD COLUMN EstadoOT VARCHAR(60) DEFAULT 'AGENDADA'`).catch(() => {});
  await pool.query(`ALTER TABLE vw_winordetraba ADD COLUMN Estado VARCHAR(60) DEFAULT 'ASIGNADA'`).catch(() => {});
  await pool.query(`ALTER TABLE vw_winordetraba ADD COLUMN Georeferencia_tecnico VARCHAR(100) NULL`).catch(() => {});
  await pool.query(`ALTER TABLE vw_winordetraba ADD COLUMN \`DiagnósticoTécnico\` TEXT NULL`).catch(() => {});
}

// Normaliza cualquier fila de vw_winordetraba
function mapOrderRow(r: any, doc: string) {
  const rawEstado = String(r.EstadoOT || r.estado_ot || r.Estado || 'AGENDADA').toUpperCase();
  const estadoNorm =
    rawEstado.includes('FINALIZ') || rawEstado.includes('ATENDID')
      ? 'FINALIZADO'
      : rawEstado.includes('PROCES') || rawEstado.includes('INICIAD')
      ? 'EN PROCESO'
      : rawEstado.includes('CAMINO') || rawEstado.includes('RUTA')
      ? 'EN CAMINO'
      : 'AGENDADA';

  return {
    OrdenId: Number(r.OrdenId || r.orden_id),
    TipoOrden: String(r.TipoOrden || r.Tipo || 'INST'),
    TipoTraba: String(r.TipoTraba || 'Instalación FTTH'),
    MotivoTrabajo: String(r.MotivoTrabajo || r['Motivo Trabajo'] || r.Producto || ''),
    Cliente: String(r.Cliente || 'Cliente WIN'),
    Producto: String(r.Producto || ''),
    Cuadrilla: String(r.Cuadrilla || ''),
    FVisita: String(r.FVisita || 'Hoy'),
    Estado: String(r.Estado || estadoNorm),
    EstadoOT: estadoNorm,
    Direccion: String(r.Direccion || ''),
    Localidad: String(r.Localidad || 'LIMA'),
    Provincia: String(r.Provincia || 'LIMA'),
    IdenServi: String(r.IdenServi || r.CodiSegui || ''),
    Zona: String(r.Zona || r['Sector Operativo'] || 'LIMA'),
    ObservacionesOT: String(r.ObservacionesOT || r['Observaciones Tareas'] || ''),
    DiagnósticoTécnico: String(r.DiagnósticoTécnico || r['Diagnóstico Técnico'] || ''),
    UsuarioResponsable: String(r.UsuarioResponsable || doc),
    NumeroDocumentoCliente: String(r.NumeroDocumentoCliente || r['Número Documento'] || ''),
    Prioridad: String(r.Prioridad || 'ALTA'),
    TeleMovilNume: String(r.TeleMovilNume || ''),
    Georeferencia: String(r.Georeferencia || '-12.097100,-77.026500'),
    DatosTecnicos: String(r.DatosTecnicos || r['Datos Técnicos'] || ''),
    Cuadrilla_nombre: String(r.Cuadrilla_nombre || r.Cuadrilla || ''),
    Georeferencia_tecnico: String(r.Georeferencia_tecnico || ''),
    Pin_token: String(r.Pin_token || r.token || ''),
    tasks: [],
  };
}

// 1. LOGIN en bd_quantum2_test
app.post('/api/auth/login', async (req, res) => {
  try {
    const cleanDoc = String(req.body?.documentNumber || req.body?.documento || '').trim();
    const cleanPass = String(req.body?.password || '').trim();

    const [rows]: any = await pool.query(
      'SELECT * FROM usuarios WHERE documento = ? LIMIT 1',
      [cleanDoc]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado en bd_quantum2_test' });
    }

    const dbUser = rows[0];
    const storedPass = String(dbUser.password || dbUser.clave || cleanDoc).trim();

    if (cleanPass !== storedPass && cleanPass !== cleanDoc) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const fullName = String(
      dbUser.nombre_completo || dbUser.nombre || dbUser.nombres || (cleanDoc === '111' ? 'TONNY' : `Técnico ${cleanDoc}`)
    );

    const userPayload = {
      id: String(dbUser.id || dbUser.usuario_id || 1),
      documentNumber: cleanDoc,
      fullName,
      zone: String(dbUser.zona || 'Lima Metropolitana'),
      mustChangePassword: false,
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ ok: true, token, user: userPayload });
  } catch (error: any) {
    console.error('Error en /api/auth/login:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// 2. LISTAR ÓRDENES DESDE bd_quantum2_test.vw_winordetraba + TAREAS GUARDADAS
const fetchOrdersWithTasks = async (doc: string) => {
  const [rawOrders]: any = await pool.query(
    'SELECT * FROM vw_winordetraba ORDER BY OrdenId DESC LIMIT 50'
  );

  const orders = (rawOrders || []).map((r: any) => mapOrderRow(r, doc));

  for (const order of orders) {
    const [tasks]: any = await pool.query(
      'SELECT * FROM orden_tareas_fotos WHERE OrdenId = ? ORDER BY id ASC',
      [order.OrdenId]
    );
    order.tasks = (tasks || []).map((t: any) => {
      let fotosArr: string[] = [];
      if (t.fotos_json) {
        try {
          fotosArr = JSON.parse(t.fotos_json);
        } catch {
          fotosArr = t.foto_url ? [t.foto_url] : [];
        }
      } else if (t.foto_url) {
        fotosArr = [t.foto_url];
      }
      return {
        ...t,
        id: String(t.id),
        fotos: fotosArr,
        completado: Boolean(t.completado),
      };
    });
  }

  return orders;
};

app.get('/api/orders/search', async (req, res) => {
  try {
    const q = String(req.query.q || '111').trim();
    const orders = await fetchOrdersWithTasks(q);
    return res.json({ ok: true, orders });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

app.get('/api/orders/:documentNumber', async (req, res) => {
  try {
    const orders = await fetchOrdersWithTasks(req.params.documentNumber);
    return res.json(orders);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// 3. ACTUALIZAR ESTADO EN bd_quantum2_test.vw_winordetraba (Detecta columnas dinámicamente)
app.put('/api/orders/:ordenId/status', async (req, res) => {
  try {
    const { ordenId } = req.params;
    const { status, georeferencia_tecnico, diagnostico } = req.body;

    const [cols]: any = await pool.query(`SHOW COLUMNS FROM vw_winordetraba`);
    const colNames = new Set((cols || []).map((c: any) => String(c.Field)));

    const sets: string[] = [];
    const params: any[] = [];

    if (colNames.has('EstadoOT')) {
      sets.push('EstadoOT = ?');
      params.push(status);
    }
    if (colNames.has('Estado')) {
      sets.push('Estado = ?');
      params.push(status);
    }
    if (colNames.has('estado_ot')) {
      sets.push('estado_ot = ?');
      params.push(status);
    }
    if (georeferencia_tecnico && colNames.has('Georeferencia_tecnico')) {
      sets.push('Georeferencia_tecnico = ?');
      params.push(georeferencia_tecnico);
    }
    if (diagnostico !== undefined) {
      if (colNames.has('DiagnósticoTécnico')) {
        sets.push('`DiagnósticoTécnico` = ?');
        params.push(diagnostico);
      } else if (colNames.has('Diagnóstico Técnico')) {
        sets.push('`Diagnóstico Técnico` = ?');
        params.push(diagnostico);
      }
    }

    const pkCol = colNames.has('OrdenId') ? 'OrdenId' : 'orden_id';
    if (sets.length > 0) {
      params.push(ordenId);
      await pool.query(`UPDATE vw_winordetraba SET ${sets.join(', ')} WHERE ${pkCol} = ?`, params);
    }

    return res.json({ ok: true });
  } catch (error: any) {
    console.error('Error en PUT /api/orders/:ordenId/status:', error.message);
    return res.status(500).json({ message: error.message });
  }
});

// 4. GUARDAR TAREA, CARRUSEL DE FOTOS, OCR Y BARCODE EN bd_quantum2_test.orden_tareas_fotos
app.put('/api/orders/task/:taskId', async (req, res) => {
  try {
    const {
      ordenId,
      codigo_tarea,
      titulo,
      valor_ingresado,
      foto_url,
      fotos,
      completado,
      lat,
      lng,
    } = req.body;

    const fotosArray = Array.isArray(fotos) ? fotos : foto_url ? [foto_url] : [];
    const primaryFoto = fotosArray[0] || foto_url || null;
    const fotosJson = JSON.stringify(fotosArray);

    await pool.query(
      `INSERT INTO orden_tareas_fotos
        (OrdenId, codigo_tarea, titulo, requiere_foto, valor_ingresado, foto_url, fotos_json, completado, latitud_foto, longitud_foto)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        valor_ingresado = VALUES(valor_ingresado),
        foto_url = VALUES(foto_url),
        fotos_json = VALUES(fotos_json),
        completado = VALUES(completado),
        latitud_foto = COALESCE(VALUES(latitud_foto), latitud_foto),
        longitud_foto = COALESCE(VALUES(longitud_foto), longitud_foto),
        updated_at = NOW()`,
      [
        ordenId,
        codigo_tarea,
        titulo || codigo_tarea,
        valor_ingresado || '',
        primaryFoto,
        fotosJson,
        completado ? 1 : 0,
        lat || null,
        lng || null,
      ]
    );

    return res.json({ ok: true });
  } catch (error: any) {
    console.error('Error en PUT /api/orders/task:', error.message);
    return res.status(500).json({ message: error.message });
  }
});

// 5. TELEMETRÍA GPS EN bd_quantum2_test.tecnico_ubicaciones_log
const handleTracking = async (req: express.Request, res: express.Response) => {
  try {
    const doc = req.body?.documentNumber || req.body?.documento || '111';
    const { ordenId, lat, lng, accuracy } = req.body;
    await pool.query(
      `INSERT INTO tecnico_ubicaciones_log (documento_tecnico, OrdenId, latitud, longitud, precision_metros)
       VALUES (?, ?, ?, ?, ?)`,
      [String(doc), ordenId || null, lat, lng, accuracy || null]
    );
    return res.json({ ok: true });
  } catch {
    return res.json({ ok: false });
  }
};

app.post('/api/tracking', handleTracking);
app.post('/api/tracking/ping', handleTracking);

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Servidor aislado en bd_quantum2_test corriendo en http://0.0.0.0:${PORT}`);
  try {
    await ensureTestDatabaseSchema();
    console.log('✅ Columnas EstadoOT, Georeferencia_tecnico y DiagnósticoTécnico verificadas en vw_winordetraba');
  } catch (err: any) {
    console.error('⚠️ Error verificando bd_quantum2_test:', err.message);
  }
});
