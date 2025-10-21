// backend/src/server.ts
import express from "express";
import cors from "cors";
import { testConnection } from "./db";
import disciplinasRouter from "./routes/disciplinas";
import canchasRouter from "./routes/canchas";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"], // frontend vite
    credentials: false,
  })
);
app.use(express.json());

// Rutas API
app.use("/api/disciplinas", disciplinasRouter);
app.use("/api/canchas", canchasRouter);

// Healthcheck DB
app.get("/test-db", async (_req, res) => {
  try {
    await testConnection();
    res.json({ status: "OK" });
  } catch {
    res.status(500).json({ status: "ERROR" });
  }
});

// 404
app.use((_req, res) => res.status(404).send("Not Found"));

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).send(err?.message ?? "Error interno");
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, async () => {
  console.log(`✅ API escuchando en http://localhost:${PORT}`);
  try {
    await testConnection();
    console.log("✅ Conexión a Oracle OK");
  } catch (e) {
    console.error("❌ Conexión a Oracle falló:", e);
  }
});

export default app;
