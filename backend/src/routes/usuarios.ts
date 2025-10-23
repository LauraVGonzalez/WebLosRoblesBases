
import { Router } from "express";
import { dbExecute } from "../db";
const router = Router();

/**
 * GET /api/usuarios
 * Devuelve la lista de correos registrados
 */
router.get("/", async (req, res) => {
  try {
    const result = await dbExecute(
      `SELECT CORREO FROM USUARIOS`,
      {}
    );
    const correos = (result.rows || []).map((row: any) => row.CORREO);
    res.json(correos);
  } catch (e) {
    console.error("[API] Error obteniendo correos:", e);
    res.status(500).json({ error: "Error interno" });
  }
});
import bcrypt from "bcrypt";

/**
 * PUT /api/usuarios/perfil?correo=...
 * Actualiza la información del usuario por correo
 */
router.put("/perfil", async (req, res) => {
  const correo = req.query.correo;
  if (!correo || typeof correo !== "string") {
    return res.status(400).json({ error: "Correo requerido" });
  }
  const {
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    telefono,
    password
  } = req.body;
  try {
    // Actualiza los datos en USUARIOS
    let updateSql = `UPDATE USUARIOS SET PRIMER_NOMBRE = :pn, SEGUNDO_NOMBRE = :sn, PRIMER_APELLIDO = :pa, SEGUNDO_APELLIDO = :sa`;
    let params: any = {
      pn: primer_nombre,
      sn: segundo_nombre,
      pa: primer_apellido,
      sa: segundo_apellido,
      co: correo
    };
    if (password) {
      // Hashea la nueva contraseña antes de guardar
      const hash = await bcrypt.hash(password, 10);
      updateSql += `, CONTRASENA = :pw`;
      params.pw = hash;
    }
    updateSql += ` WHERE CORREO = :co`;
    await dbExecute(updateSql, params);
    // Actualiza el teléfono en CLIENTES
    if (telefono) {
      await dbExecute(
        `UPDATE CLIENTES SET CELULAR = :tel WHERE CORREO = :co`,
        { tel: telefono, co: correo }
      );
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("[API] Error actualizando perfil:", e);
    res.status(500).json({ error: "Error actualizando perfil" });
  }
});

/**
 * GET /api/usuarios/perfil?correo=...
 * Devuelve la información básica del usuario por correo
 */
router.get("/perfil", async (req, res) => {
  const correo = req.query.correo;
  if (!correo || typeof correo !== "string") {
    return res.status(400).json({ error: "Correo requerido" });
  }
  try {
    // Busca en la tabla usuarios por correo
    const result = await dbExecute(
      `SELECT U.PRIMER_NOMBRE, U.SEGUNDO_NOMBRE, U.PRIMER_APELLIDO, U.SEGUNDO_APELLIDO, U.CORREO, U.CONTRASENA, C.CELULAR
       FROM USUARIOS U
       LEFT JOIN CLIENTES C ON U.ID_CLIENTE = C.ID_CLIENTE
       WHERE U.CORREO = :correo`,
      { correo }
    );
    const rows = result.rows;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const u = rows[0] as any;
    res.json({
      nombres: [u.PRIMER_NOMBRE, u.SEGUNDO_NOMBRE].filter(Boolean).join(" "),
      apellidos: [u.PRIMER_APELLIDO, u.SEGUNDO_APELLIDO].filter(Boolean).join(" "),
      correo: u.CORREO,
      telefono: u.CELULAR || "",
      contrasena: u.CONTRASENA || ""
    });
  } catch (e) {
    console.error("[API] Error obteniendo perfil:", e);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
