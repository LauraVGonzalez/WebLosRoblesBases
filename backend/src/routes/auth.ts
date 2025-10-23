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
    const sqlParams = {
      pn: primer_nombre,
      sn: segundo_nombre,
      pa: primer_apellido,
      sa: saValue,
      co: correo,
      cel: celValue,
      id_out: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };
    console.log('[DEBUG] Parámetros SQL INSERT CLIENTES:', sqlParams);
    console.log('[DEBUG] Tipos de parámetros:', {
      pn: typeof sqlParams.pn,
      sn: typeof sqlParams.sn,
      pa: typeof sqlParams.pa,
      sa: typeof sqlParams.sa,
      co: typeof sqlParams.co,
      cel: typeof sqlParams.cel
    });
    console.log('[DEBUG] SQL ejecutado:',
      `INSERT INTO clientes (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, celular, estado)` +
      ` VALUES (:pn, :sn, :pa, :sa, :co, :cel, 'activo') RETURNING id_cliente INTO :id_out`
    );
    let cRes;
    try {
      cRes = await dbExecute<{ ID_CLIENTE: number }>(
        `INSERT INTO clientes (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, celular, estado)
         VALUES (:pn, :sn, :pa, :sa, :co, :cel, 'activo')
         RETURNING id_cliente INTO :id_out`,
        sqlParams
      );
      console.log('[DEBUG] Resultado INSERT CLIENTES:', cRes);
      console.log('[DEBUG] outBinds:', cRes.outBinds);
    } catch (err) {
      console.error('[ERROR] Fallo INSERT CLIENTES:', err);
      throw err;
    }
    const idCliente = (cRes.outBinds as any).id_out[0];

    // 2) Crear usuario vinculado al cliente
  const esAdmin = correo.includes("@losrobles.com") ? 'S' : 'N';
  console.log(`[DEBUG] Valor de esAdmin para el usuario: '${esAdmin}' (correo: ${correo})`);
    await dbExecute(
      `INSERT INTO usuarios (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, contrasena, id_cliente, estado, es_admin)
       VALUES (:pn, :sn, :pa, :sa, :co, :hash, :idc, 'activo', :esAdmin)`,
      {
        pn: primer_nombre,
        sn: segundo_nombre,
        pa: primer_apellido,
        sa: saValue,
        co: correo,
        hash,
        idc: idCliente,
        esAdmin
      }
    );

    res.status(201).json({ ok: true, idCliente });
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
      `SELECT id_usuario, contrasena FROM usuarios WHERE correo = :c`,
      { c: correo }
    );
    const row = r.rows?.[0];
  if (!row) return res.status(401).json({ error: "El correo electronico no se encuentra registrado." });

    const ok = await bcrypt.compare(password, row.CONTRASENA);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    res.json({ ok: true, id_usuario: row.ID_USUARIO });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

export default router;
