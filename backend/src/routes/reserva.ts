import { Router } from "express";
import oracledb from "oracledb";
import { dbExecute, getConnection } from "../db";

const router = Router();

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatForOracle(d: Date) {
  // Returns YYYY-MM-DD HH24:MI:SS
  return (
    d.getFullYear() + "-" +
    pad(d.getMonth() + 1) + "-" +
    pad(d.getDate()) + " " +
    pad(d.getHours()) + ":" +
    pad(d.getMinutes()) + ":" +
    pad(d.getSeconds())
  );
}

/** POST /api/reservas */
router.post("/", async (req, res, next) => {
  try {
    const id_cliente = Number(req.body?.id_cliente ?? 0);
    const id_cancha = Number(req.body?.id_cancha ?? 0);
    const id_usuario_creador = Number(req.body?.id_usuario_creador ?? 0);
    const inicioRaw = req.body?.inicio_ts;
    const finRaw = req.body?.fin_ts;
    const estado = String(req.body?.estado ?? "programada").trim();

    if (!id_cliente) throw new Error("id_cliente es obligatorio");
    if (!id_cancha) throw new Error("id_cancha es obligatorio");
    if (!id_usuario_creador) throw new Error("id_usuario_creador es obligatorio");
    if (!inicioRaw) throw new Error("inicio_ts es obligatorio");
    if (!finRaw) throw new Error("fin_ts es obligatorio");

    const inicioDate = new Date(inicioRaw);
    const finDate = new Date(finRaw);
    if (isNaN(inicioDate.getTime()) || isNaN(finDate.getTime())) {
      throw new Error("inicio_ts/fin_ts deben ser fechas válidas (ISO string o timestamp)");
    }

    if (!(finDate.getTime() > inicioDate.getTime())) {
      throw new Error("fin_ts debe ser posterior a inicio_ts");
    }

    // Business rule: only allow reservations from today up to 30 days in the future (inclusive).
    // Compare by date (ignore time-of-day) to avoid timezone surprises in the UI.
    const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
    const inicioDay = startOfDay(inicioDate);
    const todayDay = startOfDay(new Date());
    const maxAllowedDay = new Date(todayDay.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (inicioDay.getTime() < todayDay.getTime()) {
      return res.status(400).json({ error: 'La fecha no puede ser anterior a hoy' });
    }
    if (inicioDay.getTime() > maxAllowedDay.getTime()) {
      return res.status(400).json({ error: 'La fecha debe ser como máximo 30 días desde hoy' });
    }

    const inicio_for_oracle = formatForOracle(inicioDate);
    const fin_for_oracle = formatForOracle(finDate);
    const fecha_reserva_oracle = inicio_for_oracle.slice(0, 10); // YYYY-MM-DD

    // We'll use a manual connection here to perform a SELECT FOR UPDATE
    // to lock the cancha row and ensure its estado is checked atomically
    // before inserting the reserva.
    let conn: oracledb.Connection | undefined;
    try {
      conn = await getConnection();

      // Lock the cancha row
      const estadoRes = await conn.execute(
        `SELECT ESTADO FROM TBL_CANCHA WHERE ID_CANCHA = :id_cancha FOR UPDATE`,
        { id_cancha },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const rows = (estadoRes.rows as any[]) || [];
      if (!rows.length) {
        await conn.rollback();
        return res.status(404).json({ error: "Cancha no encontrada" });
      }

      const canchaRow = rows[0] as any;
      const estadoCampo = String(canchaRow.ESTADO ?? canchaRow.estado ?? "").trim().toUpperCase();
      if (estadoCampo !== "ACTIVA") {
        await conn.rollback();
        return res.status(409).json({ error: `La cancha no está activa (estado=${canchaRow.ESTADO})` });
      }

      // proceed to insert using the same connection so the lock is held
      try {
        // store HORA_INICIO and HORA_FIN as 'HH:MM' strings (VARCHAR2(5))
        const buildHHMM = (d: Date) => pad(d.getHours()) + ':' + pad(d.getMinutes());
        const hora_inicio = buildHHMM(inicioDate);
        const hora_fin = buildHHMM(finDate);

        const r = await conn.execute<any>(
          `INSERT INTO TBL_RESERVA
             (ID_USUARIO, ID_CANCHA, FECHA_RESERVA, HORA_INICIO, HORA_FIN, ESTADO)
           VALUES
             (:id_cliente, :id_cancha, TO_DATE(:fecha_reserva, 'YYYY-MM-DD'),
              :hora_inicio,
              :hora_fin,
              :estado)
           RETURNING ID_RESERVA INTO :outId`,
          {
            id_cliente,
            id_cancha,
            fecha_reserva: fecha_reserva_oracle,
            hora_inicio,
            hora_fin,
            estado,
            outId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
          },
          { autoCommit: false }
        );

        const out = (r as any)?.outBinds?.outId;
        const id = Array.isArray(out) ? out[0] : out;

        await conn.commit();
        return res.json({ id });
      } catch (err: any) {
        // Try to detect unique-slot error
        const msg = String(err?.message ?? "");
        try { await conn.rollback(); } catch (_) {}
        if (msg.includes("ORA-00001") || msg.includes("unique") || msg.includes("UQ_RESERVA_SLOT")) {
          return res.status(409).send("El horario ya está reservado para esa cancha");
        }
        throw err;
      }
    } finally {
      if (conn) {
        try { await conn.close(); } catch (e) { console.error("⚠️ Error cerrando conexión (reserva):", e); }
      }
    }
  } catch (err) {
    next(err);
  }
});

export default router;

// GET /api/reservas - listar reservas (soporta ?id_cliente= and ?id_usuario_creador=)
router.get("/", async (req, res) => {
  try {
    const id_cliente = req.query.id_cliente ? Number(req.query.id_cliente) : undefined;
    const id_usuario_creador = req.query.id_usuario_creador ? Number(req.query.id_usuario_creador) : undefined;

    let where = '';
    const binds: any = {};
    if (id_cliente) {
      // TBL_RESERVA stores the cliente in column ID_USUARIO
      where = 'WHERE r.ID_USUARIO = :id_cliente';
      binds.id_cliente = id_cliente;
    } else if (id_usuario_creador) {
      // The main TBL_RESERVA does not have an id_usuario_creador column; keep clause defensive
      // (no results) — callers asking by id_usuario_creador should use the admin-specific endpoint
      where = 'WHERE 1=0';
    }

    let sql: string;
    if (where) {
      // If filtering by id_cliente (client view), only return rows from TBL_RESERVA
      sql = `SELECT r.ID_RESERVA AS id_reserva,
             r.ID_USUARIO AS id_cliente,
             r.ID_CANCHA AS id_cancha,
             NULL AS id_usuario_creador,
             r.FECHA_RESERVA AS fecha_reserva,
             r.HORA_INICIO AS inicio_ts,
             r.HORA_FIN AS fin_ts,
             r.ESTADO AS estado,
             c.NOMBRE_CANCHA AS NOMBRE_CANCHA,
             u.PRIMER_NOMBRE || ' ' || u.PRIMER_APELLIDO AS NOMBRE_CLIENTE,
             NULL AS CONTACTO_TERCERO
           FROM TBL_RESERVA r
           LEFT JOIN TBL_CANCHA c ON r.ID_CANCHA = c.ID_CANCHA
           LEFT JOIN TBL_CLIENTE tc ON r.ID_USUARIO = tc.ID_USUARIO
           LEFT JOIN TBL_USUARIO u ON tc.ID_USUARIO = u.ID_USUARIO
           ${where}
           ORDER BY r.FECHA_RESERVA DESC, r.HORA_INICIO DESC`;
      const rr = await (await getConnection()).execute(sql, binds, { outFormat: (await import('oracledb')).OUT_FORMAT_OBJECT });
      const rows = (rr as any).rows || [];
      return res.json(rows);
    }

    // No filter: return reservations from both tables (regular and terceros)
    sql = `SELECT r.ID_RESERVA AS id_reserva,
             r.ID_USUARIO AS id_cliente,
             r.ID_CANCHA AS id_cancha,
             NULL AS id_usuario_creador,
             r.FECHA_RESERVA AS fecha_reserva,
             r.HORA_INICIO AS inicio_ts,
             r.HORA_FIN AS fin_ts,
             r.ESTADO AS estado,
             c.NOMBRE_CANCHA AS NOMBRE_CANCHA,
             u.PRIMER_NOMBRE || ' ' || u.PRIMER_APELLIDO AS NOMBRE_CLIENTE,
             NULL AS CONTACTO_TERCERO,
             'TBL_RESERVA' AS SOURCE_TABLE
           FROM TBL_RESERVA r
           LEFT JOIN TBL_CANCHA c ON r.ID_CANCHA = c.ID_CANCHA
           LEFT JOIN TBL_CLIENTE tc ON r.ID_USUARIO = tc.ID_USUARIO
           LEFT JOIN TBL_USUARIO u ON tc.ID_USUARIO = u.ID_USUARIO
    
           UNION ALL

           SELECT t.ID_RESERVA_TERCERO AS id_reserva,
             NULL AS id_cliente,
             t.ID_CANCHA AS id_cancha,
             t.ID_USUARIO AS id_usuario_creador,
             t.FECHA_RESERVA AS fecha_reserva,
             t.HORA_INICIO AS inicio_ts,
             t.HORA_FIN AS fin_ts,
             t.ESTADO AS estado,
             c2.NOMBRE_CANCHA AS NOMBRE_CANCHA,
             t.NOMBRE_TERCERO AS NOMBRE_CLIENTE,
             t.CONTACTO_TERCERO AS CONTACTO_TERCERO
             , 'TBL_RESERVA_TERCEROS' AS SOURCE_TABLE
           FROM TBL_RESERVA_TERCEROS t
           LEFT JOIN TBL_CANCHA c2 ON t.ID_CANCHA = c2.ID_CANCHA

           ORDER BY fecha_reserva DESC, inicio_ts DESC`;

    const r2 = await (await getConnection()).execute(sql, binds, { outFormat: (await import('oracledb')).OUT_FORMAT_OBJECT });
    const rows = (r2 as any).rows || [];
    res.json(rows);
  } catch (e: any) {
    console.error('[API] reservas GET error:', e);
    // In development, return the real error message to aid debugging
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

// PATCH /api/reservas/:id/cancel - cancelar una reserva (marca estado='cancelada')
router.patch('/:id/cancel', async (req, res, next) => {
  const id = Number(req.params.id || 0);
  if (!id) return res.status(400).json({ error: 'id obligatorio' });
  try {
    const conn = await getConnection();

    // allow caller to request a specific table (e.g. ?table=tercero)
    const requestedTable = String(req.query?.table ?? '').toLowerCase();

    const tryCancelReserva = async (): Promise<{ status: number; body: any } | null> => {
      const r = await conn.execute(
        `SELECT ID_RESERVA, ESTADO FROM TBL_RESERVA WHERE ID_RESERVA = :id FOR UPDATE`,
        { id },
        { outFormat: (await import('oracledb')).OUT_FORMAT_OBJECT }
      );
      const rows = (r as any).rows || [];
      if (!rows.length) return null;
      const reserva = rows[0];
      const estado = String(reserva.ESTADO ?? reserva.estado ?? '').toLowerCase();
      if (estado === 'cancelada') { await conn.rollback(); return { status: 409, body: { error: 'ya cancelada' } }; }
      await conn.execute(`UPDATE TBL_RESERVA SET ESTADO = 'cancelada' WHERE ID_RESERVA = :id`, { id }, { autoCommit: false });
      await conn.commit();
      return { status: 200, body: { cancelled: id, table: 'TBL_RESERVA' } };
    };

    const tryCancelTerceros = async (): Promise<{ status: number; body: any } | null> => {
      const r2 = await conn.execute(
        `SELECT ID_RESERVA_TERCERO, ESTADO FROM TBL_RESERVA_TERCEROS WHERE ID_RESERVA_TERCERO = :id FOR UPDATE`,
        { id },
        { outFormat: (await import('oracledb')).OUT_FORMAT_OBJECT }
      );
      const rows2 = (r2 as any).rows || [];
      if (!rows2.length) { await conn.rollback(); return { status: 404, body: { error: 'reserva no encontrada' } }; }
      const reserva2 = rows2[0];
      const estado2 = String(reserva2.ESTADO ?? reserva2.estado ?? '').toLowerCase();
      if (estado2 === 'cancelada') { await conn.rollback(); return { status: 409, body: { error: 'ya cancelada' } }; }
      await conn.execute(`UPDATE TBL_RESERVA_TERCEROS SET ESTADO = 'cancelada' WHERE ID_RESERVA_TERCERO = :id`, { id }, { autoCommit: false });
      await conn.commit();
      return { status: 200, body: { cancelled: id, table: 'TBL_RESERVA_TERCEROS' } };
    };

    // If caller requested tercero explicitly, try that first
    if (requestedTable === 'tercero') {
      const resT = await tryCancelTerceros();
      if (!resT) return res.status(404).json({ error: 'reserva no encontrada' });
      const { status, body } = resT;
      return res.status(status).json(body);
    }

    // If caller requested reserva explicitly, try that first
    if (requestedTable === 'reserva') {
      const resR = await tryCancelReserva();
      if (!resR) {
        // not found in regular reservations
        return res.status(404).json({ error: 'reserva no encontrada' });
      }
      const { status, body } = resR;
      return res.status(status).json(body);
    }

    // Default behavior: try the regular table first, then terceros if not found
    const resR = await tryCancelReserva();
    if (resR !== null) {
      const { status, body } = resR;
      return res.status(status).json(body);
    }

    // not found in regular, try terceros
    const resT = await tryCancelTerceros();
    if (!resT) return res.status(404).json({ error: 'reserva no encontrada' });
    return res.status(resT.status).json(resT.body);
  } catch (e) {
    console.error('[API] reservas cancel error:', e);
    next(e);
  }
});

// POST /api/reservas/terceros - crear reserva hecha por un administrador para un tercero
router.post('/terceros', async (req, res, next) => {
  try {
    const id_usuario = Number(req.body?.id_usuario ?? 0); // admin id
    const contacto_tercero = String(req.body?.contacto_tercero ?? '').trim();
    const nombre_tercero = String(req.body?.nombre_tercero ?? '').trim();
    const id_cancha = Number(req.body?.id_cancha ?? 0);
    const inicioRaw = req.body?.inicio_ts;
    const finRaw = req.body?.fin_ts;
    const estado = String(req.body?.estado ?? 'programada').trim();

    if (!id_usuario) throw new Error('id_usuario (admin) es obligatorio');
    if (!contacto_tercero) throw new Error('contacto_tercero es obligatorio');
    if (!nombre_tercero) throw new Error('nombre_tercero es obligatorio');
    if (!id_cancha) throw new Error('id_cancha es obligatorio');
    if (!inicioRaw) throw new Error('inicio_ts es obligatorio');
    if (!finRaw) throw new Error('fin_ts es obligatorio');

    const inicioDate = new Date(inicioRaw);
    const finDate = new Date(finRaw);
    if (isNaN(inicioDate.getTime()) || isNaN(finDate.getTime())) {
      throw new Error('inicio_ts/fin_ts deben ser fechas válidas (ISO string o timestamp)');
    }

    if (!(finDate.getTime() > inicioDate.getTime())) {
      throw new Error('fin_ts debe ser posterior a inicio_ts');
    }

    const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
    const inicioDay = startOfDay(inicioDate);
    const todayDay = startOfDay(new Date());
    const maxAllowedDay = new Date(todayDay.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (inicioDay.getTime() < todayDay.getTime()) {
      return res.status(400).json({ error: 'La fecha no puede ser anterior a hoy' });
    }
    if (inicioDay.getTime() > maxAllowedDay.getTime()) {
      return res.status(400).json({ error: 'La fecha debe ser como máximo 30 días desde hoy' });
    }

    const inicio_for_oracle = formatForOracle(inicioDate);
    const fin_for_oracle = formatForOracle(finDate);
    const fecha_reserva_oracle = inicio_for_oracle.slice(0, 10);

    let conn: oracledb.Connection | undefined;
    try {
      conn = await getConnection();

      // Lock cancha row and verify estado
      const estadoRes = await conn.execute(
        `SELECT ESTADO FROM TBL_CANCHA WHERE ID_CANCHA = :id_cancha FOR UPDATE`,
        { id_cancha },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const rows = (estadoRes.rows as any[]) || [];
      if (!rows.length) { await conn.rollback(); return res.status(404).json({ error: 'Cancha no encontrada' }); }
      const canchaRow = rows[0] as any;
      const estadoCampo = String(canchaRow.ESTADO ?? canchaRow.estado ?? '').trim().toUpperCase();
      if (estadoCampo !== 'ACTIVA') { await conn.rollback(); return res.status(409).json({ error: `La cancha no está activa (estado=${canchaRow.ESTADO})` }); }

      try {
        const buildHHMM = (d: Date) => pad(d.getHours()) + ':' + pad(d.getMinutes());
        const hora_inicio = buildHHMM(inicioDate);
        const hora_fin = buildHHMM(finDate);

        const r = await conn.execute<any>(
          `INSERT INTO TBL_RESERVA_TERCEROS
             (ID_USUARIO, CONTACTO_TERCERO, NOMBRE_TERCERO, ID_CANCHA, FECHA_RESERVA, HORA_INICIO, HORA_FIN, ESTADO)
           VALUES
             (:id_usuario, :contacto_tercero, :nombre_tercero, :id_cancha, TO_DATE(:fecha_reserva, 'YYYY-MM-DD'), :hora_inicio, :hora_fin, :estado)
           RETURNING ID_RESERVA_TERCERO INTO :outId`,
          {
            id_usuario,
            contacto_tercero,
            nombre_tercero,
            id_cancha,
            fecha_reserva: fecha_reserva_oracle,
            hora_inicio,
            hora_fin,
            estado,
            outId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
          },
          { autoCommit: false }
        );

        const out = (r as any)?.outBinds?.outId;
        const id = Array.isArray(out) ? out[0] : out;

        await conn.commit();
        return res.json({ id });
      } catch (err: any) {
        const msg = String(err?.message ?? '');
        try { await conn.rollback(); } catch (_) {}
        if (msg.includes('ORA-00001') || msg.includes('unique') || msg.includes('UQ_RESERVA_SLOT')) {
          return res.status(409).send('El horario ya está reservado para esa cancha');
        }
        throw err;
      }
    } finally {
      if (conn) { try { await conn.close(); } catch (e) { console.error('⚠️ Error cerrando conexión (reserva terceros):', e); } }
    }
  } catch (err) {
    next(err);
  }
});

