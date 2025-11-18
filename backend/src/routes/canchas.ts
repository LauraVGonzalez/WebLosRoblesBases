import { Router } from "express";
import oracledb from "oracledb";
import { dbExecute } from "../db";

const router = Router();

const ESTADOS_CANCHA = ["ACTIVA", "INACTIVA", "MANTENIMIENTO"] as const;
type EstadoCancha = (typeof ESTADOS_CANCHA)[number];
function assertEstado(v: any): asserts v is EstadoCancha {
  if (!ESTADOS_CANCHA.includes(v)) {
    throw new Error(`Estado inválido. Permitidos: ${ESTADOS_CANCHA.join(", ")}`);
  }
}

function toMinutes(hhmm: string): number {
  if (!hhmm || typeof hhmm !== 'string') return NaN;
  const m = hhmm.trim();
  const parts = m.split(':');
  if (parts.length !== 2) return NaN;
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return NaN;
  return hh * 60 + mm;
}

/** GET /api/canchas/:id */
router.get("/:id", async (req, res, next) => {
  try {
    const result = await dbExecute<{
      id: number;
      nombre: string;
      idDisciplina: number;
      valor: number;
      estado: EstadoCancha;
      horaApertura: string;
      horaCierre: string;
      disciplina: string;
    }>(
      `SELECT
         c.ID_CANCHA                           AS id,
         c.NOMBRE_CANCHA                       AS nombre,
         c.ID_TIPO_CANCHA                     AS "idDisciplina",
         c.VALOR                              AS valor,
         c.ESTADO                             AS estado,
         c.HORA_APERTURA                      AS "horaApertura",
         c.HORA_CIERRE                        AS "horaCierre",
         t.NOMBRE                             AS disciplina
       FROM TBL_CANCHA c
       LEFT JOIN TBL_TIPO_CANCHA t ON t.ID_TIPO_CANCHA = c.ID_TIPO_CANCHA
       WHERE c.ID_CANCHA = :id`,
      { id: Number(req.params.id) }
    );

    const row = result.rows?.[0];
    if (!row) return res.status(404).send("No existe");
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// (removed duplicate GET / — consolidated implementation is below)

/** POST /api/canchas */
router.post("/", async (req, res, next) => {
  try {
    // Coerción/validación básica
    const nombre: string = (req.body?.nombre ?? "").toString().trim();
    const idDisciplina: number = Number(req.body?.idDisciplina ?? 0);
    const valor: number = Number(req.body?.valor ?? 0);
    const estado: EstadoCancha = req.body?.estado;
    const horaApertura: string = (req.body?.horaApertura ?? "").toString();
    const horaCierre: string = (req.body?.horaCierre ?? "").toString();

    if (!nombre) throw new Error("El nombre es obligatorio");
    if (!idDisciplina) throw new Error("La disciplina es obligatoria");
    if (!(valor > 0)) throw new Error("El valor debe ser mayor que 0");
    if (!horaApertura || !horaCierre) throw new Error("Horas de apertura/cierre obligatorias");
    // validar formato HH:MM y orden
    const minA = toMinutes(horaApertura);
    const minC = toMinutes(horaCierre);
    if (Number.isNaN(minA) || Number.isNaN(minC)) return res.status(400).json({ error: "Formato de hora inválido. Use 'HH:MM'." });
    if (!(minA < minC)) return res.status(400).json({ error: "La hora de apertura debe preceder a la hora de cierre." });
    assertEstado(estado);

    try {
      const result = await dbExecute<any, oracledb.BindParameters>(
        `INSERT INTO TBL_CANCHA
               (ID_TIPO_CANCHA, NOMBRE_CANCHA, VALOR, ESTADO, HORA_APERTURA, HORA_CIERRE)
             VALUES
               (:idDisciplina, :nombre, :valor, :estado,
                :horaApertura,
                :horaCierre)
             RETURNING ID_CANCHA INTO :outId`,
        {
          nombre,
          idDisciplina,
          valor,
          estado,
          horaApertura,
          horaCierre,
          outId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        }
      );

      // Manejo robusto de outBinds para diferentes drivers/formatos
      const out = (result as any)?.outBinds?.outId;
      const id = Array.isArray(out) ? out[0] : out;
      return res.json({ id });
    } catch (err: any) {
      console.error("Insert con RETURNING falló, intentando fallback:", err);
      // Si es ORA-00904 u otro problema con RETURNING, intentamos un fallback
      if ((err?.message ?? "").includes("ORA-00904") || (err?.message ?? "").includes("RETURNING")) {
        // Insert sin RETURNING
        await dbExecute(
          `INSERT INTO TBL_CANCHA
               (ID_TIPO_CANCHA, NOMBRE_CANCHA, VALOR, ESTADO, HORA_APERTURA, HORA_CIERRE)
             VALUES
               (:idDisciplina, :nombre, :valor, :estado,
                :horaApertura,
                :horaCierre)`,
          {
            nombre,
            idDisciplina,
            valor,
            estado,
            horaApertura,
            horaCierre,
          }
        );

        // Intentar recuperar el id recien insertado buscando por los campos únicos/semirubrics
        const q = await dbExecute<any>(
          `SELECT ID_CANCHA FROM TBL_CANCHA
             WHERE NOMBRE_CANCHA = :nombre AND ID_TIPO_CANCHA = :idDisciplina
             ORDER BY ID_CANCHA DESC FETCH FIRST 1 ROWS ONLY`,
          { nombre, idDisciplina }
        );
        const id = q.rows?.[0]?.ID_CANCHA ?? q.rows?.[0]?.id_cancha;
        return res.json({ id });
      }

      throw err; // re-lanzar si no es el caso esperado
    }
  } catch (err) {
    next(err);
  }
});

/** PUT /api/canchas/:id */
router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) throw new Error("ID inválido");

    const nombre: string = (req.body?.nombre ?? "").toString().trim();
    const idDisciplina: number = Number(req.body?.idDisciplina ?? 0);
    const valor: number = Number(req.body?.valor ?? 0);
    const estado: EstadoCancha = req.body?.estado;
    const horaApertura: string = (req.body?.horaApertura ?? "").toString();
    const horaCierre: string = (req.body?.horaCierre ?? "").toString();

    if (!nombre) throw new Error("El nombre es obligatorio");
    if (!idDisciplina) throw new Error("La disciplina es obligatoria");
    if (!(valor > 0)) throw new Error("El valor debe ser mayor que 0");
    if (!horaApertura || !horaCierre) throw new Error("Horas de apertura/cierre obligatorias");
    // validar formato HH:MM y orden
    const minA2 = toMinutes(horaApertura);
    const minC2 = toMinutes(horaCierre);
    if (Number.isNaN(minA2) || Number.isNaN(minC2)) return res.status(400).json({ error: "Formato de hora inválido. Use 'HH:MM'." });
    if (!(minA2 < minC2)) return res.status(400).json({ error: "La hora de apertura debe preceder a la hora de cierre." });
    assertEstado(estado);

        await dbExecute(
        `UPDATE TBL_CANCHA
          SET NOMBRE_CANCHA = :nombre,
            ID_TIPO_CANCHA = :idDisciplina,
            VALOR = :valor,
            ESTADO = :estado,
            HORA_APERTURA = :horaApertura,
            HORA_CIERRE   = :horaCierre
        WHERE ID_CANCHA = :id`,
      {
        id,
        nombre,
        idDisciplina,
        valor,
        estado,
        horaApertura,
        horaCierre,
      }
    );

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }

  
  
});

// ✅ LISTAR TODAS LAS CANCHAS
router.get("/", async (_req, res, next) => {
  try {
    const r = await dbExecute<{
      id: number;
      nombre: string;
      valor: number;
      estado: EstadoCancha;
      idDisciplina: number;
      disciplina: string;
    }>(
      `
      SELECT
        c.ID_CANCHA                          AS "id",
        c.NOMBRE_CANCHA                      AS "nombre",
        c.VALOR                              AS "valor",
        c.ESTADO                             AS "estado",
        c.ID_TIPO_CANCHA                     AS "idDisciplina",
        c.HORA_APERTURA                      AS "horaApertura",
        c.HORA_CIERRE                        AS "horaCierre",
        tc.NOMBRE                            AS "disciplina"
      FROM TBL_CANCHA c
      LEFT JOIN TBL_TIPO_CANCHA tc ON tc.ID_TIPO_CANCHA = c.ID_TIPO_CANCHA
      ORDER BY c.ID_CANCHA DESC
      `
    );
    console.log('[API] /api/canchas rows sample keys:', Object.keys(((r.rows||[])[0]) || {}));
    console.log('[API] /api/canchas first row raw:', (r.rows||[])[0]);
    res.json(r.rows ?? []);
  } catch (e) {
    next(e);
  }
});


export default router;
