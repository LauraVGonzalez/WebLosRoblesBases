
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
      `SELECT CORREO FROM TBL_USUARIO`,
      {}
    );
    const correos = (result.rows || []).map((row: any) => Array.isArray(row) ? row[0] : row.CORREO);
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
    // Actualiza los datos en TBL_USUARIO
    let updateSql = `UPDATE TBL_USUARIO SET PRIMER_NOMBRE = :pn, SEGUNDO_NOMBRE = :sn, PRIMER_APELLIDO = :pa, SEGUNDO_APELLIDO = :sa`;
    const params: any = {
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
        `UPDATE TBL_CLIENTE SET CELULAR = :tel WHERE ID_USUARIO = (SELECT ID_USUARIO FROM TBL_USUARIO WHERE CORREO = :co)`,
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
      `SELECT U.ID_USUARIO, U.PRIMER_NOMBRE, U.SEGUNDO_NOMBRE, U.PRIMER_APELLIDO, U.SEGUNDO_APELLIDO, U.CORREO, U.CONTRASENA, C.CELULAR
       FROM TBL_USUARIO U
       LEFT JOIN TBL_CLIENTE C ON U.ID_USUARIO = C.ID_USUARIO
       WHERE U.CORREO = :correo`,
      { correo }
    );
    const rows = result.rows;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const u = rows[0] as any;
    const isArray = Array.isArray(u);
    const id_usuario = isArray ? u[0] : u.ID_USUARIO;
    const primer = isArray ? u[1] : u.PRIMER_NOMBRE;
    const segundo = isArray ? u[2] : u.SEGUNDO_NOMBRE;
    const pApellido = isArray ? u[3] : u.PRIMER_APELLIDO;
    const sApellido = isArray ? u[4] : u.SEGUNDO_APELLIDO;
    const mail = isArray ? u[5] : u.CORREO;
    const pass = isArray ? u[6] : u.CONTRASENA;
    const cel = isArray ? u[7] : u.CELULAR;

    res.json({
      id_usuario: id_usuario,
      id_cliente: id_usuario,
      nombres: [primer, segundo].filter(Boolean).join(" "),
      apellidos: [pApellido, sApellido].filter(Boolean).join(" "),
      correo: mail,
      telefono: cel || "",
      contrasena: pass || ""
    });
  } catch (e) {
    console.error("[API] Error obteniendo perfil:", e);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
