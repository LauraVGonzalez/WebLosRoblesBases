import express from "express";
import cors from "cors";
import { getConnection, testConnection } from "./db"; // 👈 AGREGA getConnection aquí

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Ruta para probar conexión
app.get("/test-db", async (req, res) => {
  try {
    const result = await testConnection();
    res.status(200).json({
      status: "OK",
      message: "✅ Conexión con Oracle establecida correctamente",
      data: result
    });
  } catch (err) {
    console.error("❌ Error al probar la conexión:", err);
    res.status(500).json({
      status: "ERROR",
      message: "❌ Error al conectar con Oracle",
    });
  }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`✅ Servidor escuchando en el puerto ${PORT}`);
  await testConnection(); // también lo prueba al iniciar
});

// ✅ Nueva ruta: obtener todos los productos
app.get("/productos", async (req, res) => {
  try {
    const conn = await getConnection();
    const result = await conn.execute(
      `SELECT id_producto, nombre, precio FROM productos`
    );
    await conn.close();

    res.json(result.rows); // Muestra los datos en el navegador
  } catch (err) {
    console.error("❌ Error obteniendo productos:", err);
    res.status(500).json({ error: "Error obteniendo productos" });
  }
});
