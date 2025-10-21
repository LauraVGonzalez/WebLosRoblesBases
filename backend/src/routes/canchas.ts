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
         c.NOMBRE                             AS nombre,
         c.ID_TIPO_CANCHA                     AS "idDisciplina",
         c.VALOR                              AS valor,
         c.ESTADO                             AS estado,
         c.HORA_APERTURA                      AS "horaApertura",
         c.HORA_CIERRE                        AS "horaCierre",
         t.NOMBRE                             AS disciplina
       FROM CANCHAS c
       LEFT JOIN TIPOS_CANCHA t ON t.ID_TIPO_CANCHA = c.ID_TIPO_CANCHA
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

/** GET /api/canchas */
router.get("/", async (_req, res, next) => {
  try {
    const result = await dbExecute<{
      id: number;
      nombre: string;
      idDisciplina: number;
      valor: number;
      estado: EstadoCancha;
      horaApertura: string;
      horaCierre: string;
    }>(
      `SELECT
         c.ID_CANCHA                           AS id,
         c.NOMBRE                             AS nombre,
         c.ID_TIPO_CANCHA                     AS "idDisciplina",
         c.VALOR                              AS valor,
         c.ESTADO                             AS estado,
         c.HORA_APERTURA                      AS "horaApertura",
         c.HORA_CIERRE                        AS "horaCierre"
       FROM CANCHAS c`
    );

    res.json(result.rows || []);
  } catch (err) {
    next(err);
  }
});

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
    assertEstado(estado);

    try {
      const result = await dbExecute<any, oracledb.BindParameters>(
        `INSERT INTO CANCHAS
           (ID_CANCHA, NOMBRE, ID_TIPO_CANCHA, VALOR, ESTADO, HORA_APERTURA, HORA_CIERRE)
         VALUES
           (CANCHAS_SEQ.NEXTVAL, :nombre, :idDisciplina, :valor, :estado,
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
          `INSERT INTO CANCHAS
             (NOMBRE, ID_TIPO_CANCHA, VALOR, ESTADO, HORA_APERTURA, HORA_CIERRE)
           VALUES
             (:nombre, :idDisciplina, :valor, :estado,
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
        const q = await dbExecute<{ id_cancha: number }>(
          `SELECT ID_CANCHA FROM CANCHAS
             WHERE NOMBRE = :nombre AND ID_TIPO_CANCHA = :idDisciplina
             ORDER BY ID_CANCHA DESC FETCH FIRST 1 ROWS ONLY`,
          { nombre, idDisciplina }
        );
        const id = q.rows?.[0]?.id_cancha;
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
    assertEstado(estado);

    await dbExecute(
      `UPDATE CANCHAS
          SET NOMBRE = :nombre,
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
        c.ID                          AS id,
        c.NOMBRE                      AS nombre,
        c.VALOR                       AS valor,
        c.ESTADO                      AS estado,
        c.ID_TIPO_CANCHA              AS "idDisciplina",
        tc.NOMBRE                     AS disciplina
      FROM CANCHAS c
      JOIN TIPOS_CANCHA tc ON tc.ID_TIPO_CANCHA = c.ID_TIPO_CANCHA
      ORDER BY c.ID DESC
      `
    );
    res.json(r.rows ?? []);
  } catch (e) {
    next(e);
  }
});


export default router;
