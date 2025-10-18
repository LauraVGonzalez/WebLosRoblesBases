import { Router } from "express";
import { dbExecute } from "../db";
import bcrypt from "bcrypt";


const router = Router();

/** Registro */
router.post("/register", async (req, res) => {
  const { primer_nombre, segundo_nombre, apellido, correo, telefono, password } = req.body;

  if (!primer_nombre || !apellido || !correo || !password) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    // Si quieres crear también el cliente “propietario” del usuario:
    // 1) Crear cliente (mínimo primer_nombre+apellido para tu modelo):
    const cRes = await dbExecute<{ ID_CLIENTE: number }>(
      `INSERT INTO clientes (primer_nombre, apellido, correo, estado)
       VALUES (:pn, :ap, :co, 'activo')
       RETURNING id_cliente INTO :id_out`,
      { pn: primer_nombre, ap: apellido, co: correo, id_out: { dir: 3003, type: 2010 } } // BIND OUT
    );
    const idCliente = (cRes.outBinds as any).id_out[0];

    // 2) Crear usuario vinculado al cliente
    await dbExecute(
      `INSERT INTO usuarios (primer_nombre, segundo_nombre, apellido, correo, contrasena, id_cliente, estado)
       VALUES (:pn, :sn, :ap, :co, :hash, :idc, 'activo')`,
      { pn: primer_nombre, sn: segundo_nombre, ap: apellido, co: correo, hash, idc: idCliente }
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
    if (!row) return res.status(401).json({ error: "Credenciales inválidas" });

    const ok = await bcrypt.compare(password, row.CONTRASENA);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    res.json({ ok: true, id_usuario: row.ID_USUARIO });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

export default router;
