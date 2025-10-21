import React from "react";
import { useParams } from "react-router-dom";
import { canchasSvc, disciplinasSvc } from "../services/canchas";
import fondo from "../assets/ver_info_cancha.png";
import icoFutbol from "../assets/ico_futbol.png";
import icoTenis from "../assets/ico_tenis.png";
import icoBasket from "../assets/ico_basket.png";
import icoVoleibol from "../assets/ico_voley.png";

export default function VerInfoCancha() {
  const { id } = useParams();
  const [cancha, setCancha] = React.useState<any>(null);
  const [disciplinaNombre, setDisciplinaNombre] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const [data, disciplinas] = await Promise.all([
          canchasSvc.get(Number(id)),
          disciplinasSvc.list(),
        ]);
        setCancha(data);
        // Buscar nombre de disciplina por id
        let nombreDisc = data.disciplina;
        if (!nombreDisc && data.idDisciplina) {
          const found = disciplinas.find((d) => d.id === Number(data.idDisciplina));
          nombreDisc = found?.nombre;
        }
        setDisciplinaNombre(nombreDisc || "-");
        setErr(null);
      } catch (e: any) {
        setErr(e?.message ?? "Error cargando cancha");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Función para seleccionar el icono según la disciplina
  const getDisciplinaIcon = (disciplina: string | undefined) => {
  if (!disciplina) return icoFutbol;
  const d = disciplina.toLowerCase();
  if (d.includes("futb")) return icoFutbol;
  if (d.includes("tenis")) return icoTenis;
  if (d.includes("basket") || d.includes("baloncesto")) return icoBasket;
  if (d.includes("vole") || d.includes("voley") || d.includes("voleibol")) return icoVoleibol;
  return icoFutbol;
  };

  return (
    <div style={{ minHeight: "100vh", background: `url(${fondo}) center/cover no-repeat` }}>
      <header style={{ padding: "2rem 0 0 2rem" }}>
      </header>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "2rem" }}>
        {/* Icono según disciplina con fondo blanco circular */}
        <div
          style={{
            width: 150,
            height: 150,
            background: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
            marginBottom: 16,
          }}
        >
          <img
            src={getDisciplinaIcon(disciplinaNombre)}
            alt={disciplinaNombre || "Cancha"}
            style={{ width: 100, height: 100, objectFit: 'contain' }}
          />
        </div>
  <h1 style={{ color: "white", fontWeight: "bold", fontSize: "2.5rem", margin: "1rem 0" }}>{cancha?.nombre ?? cancha?.NOMBRE ?? "Cancha"}</h1>
        <div style={{ background: "white", borderRadius: 30, boxShadow: "0 2px 16px rgba(0,0,0,0.15)", padding: "2rem", minWidth: 320, textAlign: "center" }}>
          {loading && <div>Cargando…</div>}
          {err && <div style={{ color: "red" }}>{err}</div>}
          {!loading && !err && cancha && (
            <>
              <div>Nombre : <b>{cancha.nombre ?? cancha.NOMBRE ?? '-'}</b></div>
              <div style={{ marginTop: 8 }}>Disciplina: {disciplinaNombre}</div>
              <div style={{ marginTop: 8 }}>Valor: ${Intl.NumberFormat("es-CO").format(cancha.valor ?? cancha.VALOR ?? cancha.value ?? 0)}</div>
              <div style={{ marginTop: 8 }}>Estado: {
                (cancha.estado ?? cancha.ESTADO ?? '').toUpperCase() === "ACTIVA"
                  ? "Activa"
                  : (cancha.estado ?? cancha.ESTADO ?? '').toUpperCase() === "INACTIVA"
                  ? "Inactiva"
                  : "Mantenimiento"
              }</div>
              <div style={{ marginTop: 8 }}>Hora apertura: {cancha.horaApertura ?? cancha.hora_apertura ?? cancha.HORA_APERTURA ?? '-'}</div>
              <div style={{ marginTop: 8 }}>Hora cierre: {cancha.horaCierre ?? cancha.hora_cierre ?? cancha.HORA_CIERRE ?? '-'}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
