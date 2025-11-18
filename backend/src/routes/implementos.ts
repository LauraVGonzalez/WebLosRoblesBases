import { Router } from "express";
import { dbExecute } from "../db";

const router = Router();

// GET /api/implementos - lista implementos
router.get("/", async (_req, res) => {
  try {
    const r = await dbExecute<any>(`SELECT ID_IMPLEMENTO, TIPO_IMPLEMENTO, ESTADO, CANTIDAD FROM TBL_IMPLEMENTO`);
    const rows = r.rows || [];
    // oracledb may return rows as arrays or objects depending on outFormat; normalize to objects
    const normalized = rows.map((row: any) => Array.isArray(row) ? {
      ID_IMPLEMENTO: row[0],
      TIPO_IMPLEMENTO: row[1],
      ESTADO: row[2],
      CANTIDAD: row[3]
    } : row);
    res.json(normalized);
  } catch (e) {
    console.error('[API] implementos GET error:', e);
    res.status(500).json({ error: 'Error obteniendo implementos' });
  }
});

// GET /api/implementos/:id - obtener un implemento por id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params?.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const r = await dbExecute<any>(`SELECT ID_IMPLEMENTO, TIPO_IMPLEMENTO, ESTADO, CANTIDAD FROM TBL_IMPLEMENTO WHERE ID_IMPLEMENTO = :id`, { id });
    const rows = r.rows || [];
    const normalized = rows.map((row: any) => Array.isArray(row) ? {
      ID_IMPLEMENTO: row[0],
      TIPO_IMPLEMENTO: row[1],
      ESTADO: row[2],
      CANTIDAD: row[3]
    } : row);
    if (!normalized.length) return res.status(404).json({ error: 'implemento no encontrado' });
    res.json(normalized[0]);
  } catch (e) {
    console.error('[API] implementos GET id error:', e);
    res.status(500).json({ error: 'Error obteniendo implemento' });
  }
});

export default router;
