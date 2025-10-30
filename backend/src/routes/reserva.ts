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

    // We'll use a manual connection here to perform a SELECT FOR UPDATE
    // to lock the cancha row and ensure its estado is checked atomically
    // before inserting the reserva.
    let conn: oracledb.Connection | undefined;
    try {
      conn = await getConnection();

      // Lock the cancha row
      const estadoRes = await conn.execute(
        `SELECT ESTADO FROM CANCHAS WHERE ID_CANCHA = :id_cancha FOR UPDATE`,
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
        const r = await conn.execute<any>(
          `INSERT INTO RESERVAS
             (id_cliente, id_cancha, id_usuario_creador, inicio_ts, fin_ts, estado)
           VALUES
             (:id_cliente, :id_cancha, :id_usuario_creador,
              TO_TIMESTAMP(:inicio_ts, 'YYYY-MM-DD HH24:MI:SS'),
              TO_TIMESTAMP(:fin_ts,   'YYYY-MM-DD HH24:MI:SS'),
              :estado)
           RETURNING id_reserva INTO :outId`,
          {
            id_cliente,
            id_cancha,
            id_usuario_creador,
            inicio_ts: inicio_for_oracle,
            fin_ts: fin_for_oracle,
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
