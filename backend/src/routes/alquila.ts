import { Router } from "express";
import oracledb from "oracledb";
import { getConnection } from "../db";

const router = Router();

// GET /api/alquila - listar alquileres (historial)
router.get("/", async (_req, res) => {
  try {
    const r = await (await getConnection()).execute(
      `SELECT a.ID_PRESTAMO,
              u.PRIMER_NOMBRE || ' ' || u.PRIMER_APELLIDO AS NOMBRE_CLIENTE,
              i.TIPO_IMPLEMENTO,
              a.CANTIDAD_PRESTADA,
              a.FECHA_PRESTAMO,
              a.HORA_PRESTAMO,
              a.FECHA_DEVOLUCION
       FROM TBL_ALQUILA a
       LEFT JOIN TBL_CLIENTE c ON a.ID_USUARIO = c.ID_USUARIO
       LEFT JOIN TBL_USUARIO u ON c.ID_USUARIO = u.ID_USUARIO
       LEFT JOIN TBL_IMPLEMENTO i ON a.ID_IMPLEMENTO = i.ID_IMPLEMENTO
       ORDER BY a.FECHA_PRESTAMO DESC`,
      [],
      { outFormat: (await import('oracledb')).OUT_FORMAT_OBJECT }
    );
    const rows = (r as any).rows || [];
    res.json(rows);
  } catch (e) {
    console.error('[API] alquila GET error:', e);
    res.status(500).json({ error: 'Error obteniendo alquileres' });
  }
});

function pad(n: number) { return String(n).padStart(2, "0"); }
function formatForOracle(d: Date) {
  return (
    d.getFullYear() + "-" +
    pad(d.getMonth() + 1) + "-" +
    pad(d.getDate()) + " " +
    pad(d.getHours()) + ":" +
    pad(d.getMinutes()) + ":" +
    pad(d.getSeconds())
  );
}

function formatTimeHHMM(d: Date) {
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
}

// POST /api/alquila
// body: { id_usuario, id_implemento, cantidad }
router.post("/", async (req, res, next) => {
  try {
    const id_usuario = Number(req.body?.id_usuario || 0);
    const id_implemento = Number(req.body?.id_implemento || 0);
    const cantidad = Number(req.body?.cantidad || 1);
    if (!id_usuario) return res.status(400).json({ error: 'id_usuario obligatorio' });
    if (!id_implemento) return res.status(400).json({ error: 'id_implemento obligatorio' });
    if (!(cantidad > 0)) return res.status(400).json({ error: 'cantidad inválida' });

    let conn: oracledb.Connection | undefined;
    try {
      conn = await getConnection();
      // Lock implemento row
      const estadoRes = await conn.execute(
        `SELECT CANTIDAD FROM TBL_IMPLEMENTO WHERE ID_IMPLEMENTO = :id FOR UPDATE`,
        { id: id_implemento },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const rows = (estadoRes.rows as any[]) || [];
      if (!rows.length) { await conn.rollback(); return res.status(404).json({ error: 'implemento no encontrado' }); }
      const disponible = Number(rows[0].CANTIDAD ?? 0);
      if (disponible < cantidad) { await conn.rollback(); return res.status(409).json({ error: 'No hay suficiente stock' }); }

      const now = new Date();
      const fechaStr = formatForOracle(now);
      const horaStr = formatTimeHHMM(now); // 'HH:MM' fits VARCHAR2(5 BYTE)

      // Insert a single alquiler record with the requested quantity
      const r = await conn.execute<any>(
        `INSERT INTO TBL_ALQUILA
           (ID_PRESTAMO, ID_USUARIO, ID_IMPLEMENTO, CANTIDAD_PRESTADA, FECHA_PRESTAMO, HORA_PRESTAMO, FECHA_DEVOLUCION)
         VALUES
           (SEQ_ALQUILA.NEXTVAL, :id_usuario, :id_implemento, :cantidad_prestada,
            TO_TIMESTAMP(:fecha, 'YYYY-MM-DD HH24:MI:SS'),
            :hora,
            NULL)
         RETURNING ID_PRESTAMO INTO :outId`,
        {
          id_usuario,
          id_implemento,
          cantidad_prestada: cantidad,
          fecha: fechaStr,
          hora: horaStr,
          outId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: false }
      );
      const out = (r as any)?.outBinds?.outId;
      const insertedId = Number(Array.isArray(out) ? out[0] : out);
      // Decrement stock explicitly in the same transaction to ensure consistency
      // (If DB trigger TRG_ALQUILA_DESCONTAR is active, it may also decrement;
      // ensure triggers are not duplicated in production.)
      await conn.execute(
        `UPDATE TBL_IMPLEMENTO
         SET CANTIDAD = NVL(CANTIDAD,0) - :cantidad
         WHERE ID_IMPLEMENTO = :id_impl`,
        { cantidad, id_impl: id_implemento }
      );

      await conn.commit();
      res.json({ inserted: insertedId, cantidad: cantidad });
    } finally {
      if (conn) { try { await conn.close(); } catch (e) { console.error(e); } }
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/alquila/:id - obtener un alquiler por id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id obligatorio' });
    const r = await (await getConnection()).execute(
      `SELECT a.ID_PRESTAMO,
              u.PRIMER_NOMBRE || ' ' || u.PRIMER_APELLIDO AS NOMBRE_CLIENTE,
              i.TIPO_IMPLEMENTO,
              a.CANTIDAD_PRESTADA,
              a.FECHA_PRESTAMO,
              a.HORA_PRESTAMO,
              a.FECHA_DEVOLUCION,
              a.ID_IMPLEMENTO
       FROM TBL_ALQUILA a
       LEFT JOIN TBL_CLIENTE c ON a.ID_USUARIO = c.ID_USUARIO
       LEFT JOIN TBL_USUARIO u ON c.ID_USUARIO = u.ID_USUARIO
       LEFT JOIN TBL_IMPLEMENTO i ON a.ID_IMPLEMENTO = i.ID_IMPLEMENTO
       WHERE a.ID_PRESTAMO = :id`,
      { id },
      { outFormat: (await import('oracledb')).OUT_FORMAT_OBJECT }
    );
    const rows = (r as any).rows || [];
    if (!rows.length) return res.status(404).json({ error: 'alquiler no encontrado' });
    res.json(rows[0]);
  } catch (e) {
    console.error('[API] alquila GET by id error:', e);
    res.status(500).json({ error: 'Error obteniendo alquiler' });
  }
});

// POST /api/alquila/:id/devolver - confirma devolución y restaura stock
router.post("/:id/devolver", async (req, res, next) => {
  const id = Number(req.params.id || 0);
  if (!id) return res.status(400).json({ error: 'id obligatorio' });
  let conn: oracledb.Connection | undefined;
  try {
    conn = await getConnection();
    // Lock the alquiler row
    const sel = await conn.execute(
      `SELECT ID_PRESTAMO, ID_IMPLEMENTO, CANTIDAD_PRESTADA, FECHA_DEVOLUCION
       FROM TBL_ALQUILA WHERE ID_PRESTAMO = :id FOR UPDATE`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const rows = (sel.rows as any[]) || [];
    if (!rows.length) { await conn.rollback(); return res.status(404).json({ error: 'alquiler no encontrado' }); }
    const alquiler = rows[0];
    if (alquiler.FECHA_DEVOLUCION) { await conn.rollback(); return res.status(409).json({ error: 'ya devuelto' }); }

    const cantidad = Number(alquiler.CANTIDAD_PRESTADA || 0);
    const id_impl = Number(alquiler.ID_IMPLEMENTO || 0);

    const now = new Date();
    const fechaStr = formatForOracle(now);

    // Update alquiler set fecha_devolucion and increment implemento stock
    await conn.execute(
      `UPDATE TBL_ALQUILA SET FECHA_DEVOLUCION = TO_TIMESTAMP(:fecha, 'YYYY-MM-DD HH24:MI:SS') WHERE ID_PRESTAMO = :id`,
      { fecha: fechaStr, id }
    );

    await conn.execute(
      `UPDATE TBL_IMPLEMENTO SET CANTIDAD = NVL(CANTIDAD,0) + :cantidad WHERE ID_IMPLEMENTO = :id_impl`,
      { cantidad, id_impl }
    );

    await conn.commit();
    res.json({ returned: id, cantidad });
  } catch (e) {
    if (conn) { try { await conn.rollback(); } catch (er) { console.error(er); } }
    console.error('[API] alquila devolver error:', e);
    next(e);
  } finally {
    if (conn) { try { await conn.close(); } catch (e) { console.error(e); } }
  }
});

export default router;
