// backend/src/db.ts
import oracledb from "oracledb";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECT_STRING,
};

// Abre una conexión
export async function getConnection() {
  return oracledb.getConnection(dbConfig);
}

/**
 * Ejecuta SQL con binds y devuelve Result tipado.
 * T = forma de cada fila (cuando usas SELECT)
 * B = forma de los parámetros de entrada/salida
 */
export async function dbExecute<
  T = any,
  B extends oracledb.BindParameters = oracledb.BindParameters
>(
  sql: string,
  binds?: B,
  options?: oracledb.ExecuteOptions
): Promise<oracledb.Result<T>> {
  let conn: oracledb.Connection | undefined;
  try {
    conn = await getConnection();

    const result = await conn.execute<T>(
      sql,
      (binds ?? {}) as B,
      {
        autoCommit: true,
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        ...options,
      }
    );

    return result;
  } catch (err) {
    console.error("❌ Error ejecutando SQL:", err);
    throw err;
  } finally {
    if (conn) {
      try { await conn.close(); } catch (e) { console.error("⚠️ Error cerrando conexión:", e); }
    }
  }
}

// (opcional) test rápido
export async function testConnection() {
  const c = await getConnection();
  const r = await c.execute<{ MENSAJE: string }>("select 'OK' MENSAJE from dual");
  console.log("Oracle:", r.rows?.[0]);
  await c.close();
}
