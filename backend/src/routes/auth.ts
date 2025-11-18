import { Router } from "express";
import { dbExecute } from "../db";
import oracledb from "oracledb";
import bcrypt from "bcrypt";


const router = Router();

/** Registro */
router.post("/register", async (req, res) => {
  console.log("[API] POST /api/auth/register body:", req.body);
  console.log(`[DEBUG] Valor recibido para telefono: '${req.body.telefono}'`);
  const {
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    apellido, // por compatibilidad
    correo,
    telefono,
    password
  } = req.body;

  // Mostrar qué campos faltan
  const missing = [];
  if (!primer_nombre) missing.push('primer_nombre');
  if (!primer_apellido && !apellido) missing.push('primer_apellido');
  if (!correo) missing.push('correo');
  if (!telefono) missing.push('telefono');
  if (!password) missing.push('password');
  if (missing.length) {
    console.log('[API] Faltan campos:', missing);
    return res.status(400).json({ error: `Faltan campos requeridos: ${missing.join(', ')}` });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    // Si segundo_apellido es null o undefined, usar cadena vacía
    const saValue = typeof segundo_apellido === 'string' && segundo_apellido.trim() !== '' ? segundo_apellido : '';
  // Forzar el valor de celular a string explícito
    const celValue = String(telefono ?? '').trim();
    console.log(`[DEBUG] Valor insertado en CELULAR (forzado a string): '${celValue}'`);
    if (!celValue) {
      console.error('[ERROR] El valor de celular está vacío antes de insertar.');
      return res.status(400).json({ error: 'El número telefónico no puede estar vacío.' });
    }
    console.log(`[DEBUG] Valor insertado en CELULAR: '${celValue}'`);
    // 1) Insertar en TBL_USUARIO y obtener ID_USUARIO generado
    const sqlParams = {
      pn: primer_nombre,
      sn: segundo_nombre,
      pa: primer_apellido,
      sa: saValue,
      co: correo,
      hash,
      id_out: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    console.log('[DEBUG] Parámetros SQL INSERT TBL_USUARIO:', sqlParams);
    let uRes;
    try {
      uRes = await dbExecute(
        `INSERT INTO TBL_USUARIO (PRIMER_NOMBRE, SEGUNDO_NOMBRE, PRIMER_APELLIDO, SEGUNDO_APELLIDO, CORREO, CONTRASENA, ESTADO)
         VALUES (:pn, :sn, :pa, :sa, :co, :hash, 'activo')
         RETURNING ID_USUARIO INTO :id_out`,
        sqlParams
      );
      console.log('[DEBUG] Resultado INSERT TBL_USUARIO:', uRes.outBinds);
    } catch (err) {
      console.error('[ERROR] Fallo INSERT TBL_USUARIO:', err);
      throw err;
    }

    const idUsuario = (uRes.outBinds as any).id_out[0];

    // 2) Insertar en TBL_CLIENTE con el ID_USUARIO generado
    try {
      await dbExecute(
        `INSERT INTO TBL_CLIENTE (ID_USUARIO, CELULAR, FECHA_CREACION)
         VALUES (:idu, :cel, SYSDATE)`,
        { idu: idUsuario, cel: celValue }
      );
    } catch (err) {
      console.error('[ERROR] Fallo INSERT TBL_CLIENTE:', err);
      throw err;
    }

    // 3) Si es administrador (dominio interno), insertar en TBL_ADMINISTRADOR
    const isAdmin = correo.includes("@losrobles.com");
    if (isAdmin) {
      try {
        await dbExecute(`INSERT INTO TBL_ADMINISTRADOR (ID_USUARIO, FECHA_INICIO) VALUES (:idu, SYSDATE)`, { idu: idUsuario });
      } catch (err) {
        console.error('[WARN] No se pudo insertar en TBL_ADMINISTRADOR:', err);
        // no detener el registro por fallo al crear administrador
      }
    }

    res.status(201).json({ ok: true, idCliente: idUsuario });
  } catch (e: any) {
    if (e.errorNum === 1) return res.status(409).json({ error: "Correo ya registrado" }); // UNIQUE
    console.error(e);
    res.status(500).json({ error: "Error registrando usuario" });
  }
});

/** Login */
router.post("/login", async (req, res) => {
  const { correo, password } = req.body;
  try {
    const r = await dbExecute<any>(
      `SELECT ID_USUARIO, CONTRASENA FROM TBL_USUARIO WHERE CORREO = :c`,
      { c: correo }
    );
    const row = r.rows?.[0];
  if (!row) return res.status(401).json({ error: "El correo electronico no se encuentra registrado." });

    const hash = Array.isArray(row) ? row[1] : row.CONTRASENA;
    const idUsuario = Array.isArray(row) ? row[0] : row.ID_USUARIO;

    const ok = await bcrypt.compare(password, hash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    res.json({ ok: true, id_usuario: idUsuario });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

export default router;
