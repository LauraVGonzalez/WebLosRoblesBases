import React from "react";
import { Link } from "react-router-dom";
import { canchasSvc, type CanchaListItem, disciplinasSvc } from "../services/canchas";
import fondo from "../assets/lista_canchas.png";

// Íconos por disciplina (ajusta rutas si usas otros nombres)
import icoFutbol from "../assets/ico_futbol.png";
import icoTenis from "../assets/ico_tenis.png";
import icoVoley from "../assets/ico_voley.png";
import icoBasket from "../assets/ico_basket.png";

// ✅ Acepta string | undefined y normaliza
const iconByDisciplina = (nombre?: string) => {
  const n = (nombre ?? "").toLowerCase();
  if (n.includes("fút") || n.includes("futb")) return icoFutbol;
  if (n.includes("tenis")) return icoTenis;
  if (n.includes("vole")) return icoVoley;
  if (n.includes("balon") || n.includes("basket")) return icoBasket;
  return icoFutbol;
};

export default function Canchas() {
  const [items, setItems] = React.useState<CanchaListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Cargamos canchas y disciplinas en paralelo para mapear nombre de disciplina
        const [data, disciplinas] = await Promise.all([canchasSvc.list(), disciplinasSvc.list()]);
        const discMap = new Map<number, string>();
        for (const d of disciplinas) discMap.set(d.id, d.nombre);

        const enriched: CanchaListItem[] = (data || [])
          .map((c: any) => {
            // normalizar posibles claves devueltas por el backend
            const rawValor = c.valor ?? c.VALOR ?? c.VALOR_NUM ?? c.value;
            const valorNum = typeof rawValor === "number" ? rawValor : Number(rawValor) || 0;

            const rawIdDisc = c.idDisciplina ?? c.ID_TIPO_CANCHA ?? c.id_tipo_cancha ?? c.idDisc ?? c.idDisciplina;
            const idDiscNum = rawIdDisc != null ? Number(rawIdDisc) : undefined;

            const rawNombre = c.nombre ?? c.NOMBRE ?? c.NOMBRE_CANCHA ?? c.name ?? undefined;
            const nombreStr = rawNombre != null ? String(rawNombre) : undefined;

            const rawId = c.id ?? c.ID_CANCHA ?? c.ID ?? c.id_cancha ?? c.idCancha ?? null;
            const idNum = rawId != null ? Number(rawId) : undefined;

            const rawEstado = c.estado ?? c.ESTADO ?? c.ESTADO_CANCHA ?? "";
            const estadoNorm = typeof rawEstado === "string" ? rawEstado.toUpperCase() : String(rawEstado).toUpperCase();

            return {
              ...c,
              id: idNum,
              nombre: nombreStr ?? c.nombre,
              disciplina: c.disciplina ?? (idDiscNum ? discMap.get(idDiscNum) : undefined) ?? undefined,
              valor: valorNum,
              estado: estadoNorm as any,
            } as CanchaListItem;
          })
          // filtrar items sin id válido
          .filter((x: any) => x?.id != null && !Number.isNaN(Number(x.id)));

        setItems(enriched);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message ?? "Error cargando canchas");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section
      className="min-h-screen w-full flex flex-col items-center justify-start pt-10"
      style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Estado de carga / error */}
      {loading && <p className="text-white">Cargando…</p>}
      {err && <p className="rounded bg-red-50 px-3 py-2 text-red-700">{err}</p>}

      {/* Grid de tarjetas */}
      {!loading && !err && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl mt-8">
          {items.map((c) => (
            <Link
              key={c.id}
              to={`${(localStorage.getItem('usuario_correo') || '').includes('@losrobles.com') ? '/PrincipalAdmin' : '/Principal'}/Canchas/Ver/${c.id}`}
              className="group block focus:outline-none"
              style={{ textDecoration: 'none' }}
            >
              <article
                className="rounded-2xl bg-teal-800/95 p-5 shadow-xl ring-1 ring-teal-900/30 transition-transform duration-150 group-hover:scale-105 group-hover:shadow-2xl group-active:scale-100 cursor-pointer"
              >
                {/* header tarjeta: nombre centrado sobre el icono y edit en esquina */}
                <div className="relative mb-3 text-white">
                  <Link
                    to={`/PrincipalAdmin/Canchas/Editar/${c.id}`}
                    title="Editar"
                    className="absolute right-0 top-0 rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/20 z-10"
                    onClick={e => e.stopPropagation()}
                  >
                    ✎
                  </Link>
                  <div className="mb-4 text-center font-semibold text-white group-hover:underline">
                    {c.nombre ?? `Cancha ${c.id ?? ''}`}
                  </div>
                </div>
                <div className="mx-auto mb-4 h-28 w-28 rounded-full bg-white p-4 shadow-inner">
                  <img
                    src={iconByDisciplina(c.disciplina)}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="rounded-lg bg-white/10 p-4 text-sm text-white">
                  <p className="font-semibold">
                    Valor:{" "}
                    <span className="font-normal">
                      ${Intl.NumberFormat("es-CO").format(c.valor ?? 0)}
                    </span>
                  </p>
                  <p className="font-semibold">
                    Disciplina: <span className="font-normal">{c.disciplina ?? "-"}</span>
                  </p>
                  <p className="font-semibold">
                    Estado:{" "}
                    <span className="font-normal">
                      {c.estado === "ACTIVA"
                        ? "Activa"
                        : c.estado === "INACTIVA"
                        ? "Inactiva"
                        : "Mantenimiento"}
                    </span>
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      {/* vacío */}
      {!loading && !err && items.length === 0 && (
        <p className="mt-8 rounded-xl bg-white/90 p-6 text-center">
          No hay canchas creadas todavía.{" "}
          <Link className="text-indigo-700 underline" to={`${(localStorage.getItem('usuario_correo') || '').includes('@losrobles.com') ? '/PrincipalAdmin' : '/Principal'}/Canchas/Crear`}>
            Crea la primera
          </Link>
          .
        </p>
      )}
    </section>
  );
}
