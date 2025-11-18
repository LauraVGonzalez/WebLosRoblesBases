import { Router } from "express";
import { dbExecute } from "../db";

const router = Router();

/**
 * GET /api/disciplinas
 * Devuelve la lista de disciplinas (tipos de cancha) desde la BD
 */
router.get("/", async (_req, res, next) => {
  try {
    const result = await dbExecute<{
      id: number;
      nombre: string;
      descripcion: string;
    }>(
      `
      SELECT
        ID_TIPO_CANCHA AS "id",
        NOMBRE         AS "nombre",
        DESCRIPCION    AS "descripcion"
      FROM TBL_TIPO_CANCHA
      ORDER BY NOMBRE
      `
    );

    res.json(result.rows ?? []);
  } catch (err) {
    next(err);
  }
});

export default router;
