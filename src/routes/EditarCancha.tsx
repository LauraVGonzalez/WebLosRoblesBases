import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import fondo from "../assets/editar_cancha.png"; // puedes usar otra imagen si deseas
import { canchasSvc } from "../services/canchas";
import { disciplinasSvc } from "../services/canchas";
import type { Cancha, Disciplina } from "../types";

export default function EditarCancha() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [form, setForm] = React.useState<Cancha | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [disciplinas, setDisciplinas] = React.useState<Disciplina[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  // Estado para validación en tiempo real
  const [valorTouched, setValorTouched] = React.useState(false);
  // Validación de valor
  const valorValido =
    form?.valor !== undefined &&
    /^\d+$/.test(String(form?.valor)) &&
    Number(form?.valor) > 0;
  const valorSoloNumerosEstricto =
    form?.valor !== undefined &&
    String(form?.valor).length > 0 &&
    !/^\d+$/.test(String(form?.valor));

  React.useEffect(() => {
    (async () => {
      try {
        const [rawC, d] = await Promise.all([
          canchasSvc.get(Number(id)),
          disciplinasSvc.list(),
        ]);
        console.debug("EditarCancha: raw cancha:", rawC);

        // Normalizar posibles claves devueltas por la API
        const normalized: Cancha = {
          id: (rawC as any).id ?? (rawC as any).ID_CANCHA ?? Number(id),
          nombre: (rawC as any).nombre ?? (rawC as any).NOMBRE ?? "",
          idDisciplina:
            (rawC as any).idDisciplina ?? (rawC as any).ID_TIPO_CANCHA ?? 0,
          valor: Number((rawC as any).valor ?? (rawC as any).VALOR ?? 0) || 0,
          estado: (rawC as any).estado ?? (rawC as any).ESTADO ?? "",
          horaApertura:
            (rawC as any).horaApertura ?? (rawC as any).HORA_APERTURA ?? "",
          horaCierre:
            (rawC as any).horaCierre ?? (rawC as any).HORA_CIERRE ?? "",
        };

        setForm(normalized);
        setDisciplinas(d);
      } catch (e: any) {
        setErr(e?.message ?? "Error cargando la cancha");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "valor") setValorTouched(true);
    setForm((f) =>
      f
        ? {
            ...f,
            [name]:
              name === "valor"
                ? value
                : name === "idDisciplina"
                ? Number(value)
                : value,
          }
        : f
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!valorValido) return; // No guardar si el valor no es válido
    try {
      setSaving(true);
      await canchasSvc.update(Number(id), {
        ...form,
        valor: Number(form.valor),
      });
      alert("✅ Cambios guardados correctamente");
      nav("/Principal/Canchas");
    } catch (e: any) {
      setErr(e?.message ?? "Error actualizando la cancha");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando...</div>;
  if (err)
    return <div className="p-10 text-center text-red-700 font-semibold">{err}</div>;

  return (
    <section className="relative min-h-[calc(100vh-72px)] w-full">
      {/* Fondo */}
      <img
        src={fondo}
        alt="Fondo de Editar Cancha"
        className="absolute inset-0 h-full w-full object-cover scale-105"
      />

      {/* Contenedor */}
      <div className="relative z-[1] mx-auto w-full max-w-[900px] p-6">
        <div className="mx-auto mt-10 rounded-2xl bg-white p-8 shadow-xl">
          {/* Título */}
          <h2 className="text-center text-xl font-bold tracking-wide text-zinc-800">
            EDITAR CANCHA
          </h2>
          <div className="mt-1 h-1 w-20 mx-auto bg-emerald-600 rounded-full" />

          {/* Error */}
          {err && (
            <div className="my-4 rounded-md bg-red-50 p-3 text-center text-red-700">
              {err}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            {/* Nombre */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                NOMBRE
              </span>
              <input
                name="nombre"
                value={form?.nombre ?? ""}
                onChange={handleChange}
                placeholder="Stadium name"
                className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Disciplina */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                DISCIPLINA
              </span>
              <select
                name="idDisciplina"
                value={form?.idDisciplina ?? 0}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={0}>Selecciona</option>
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Valor */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                VALOR
              </span>
              <input
                name="valor"
                inputMode="numeric"
                value={form?.valor ?? ""}
                onChange={handleChange}
                onBlur={() => setValorTouched(true)}
                placeholder="100000"
                className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${
                  valorTouched
                    ? valorValido
                      ? "border-green-400"
                      : "border-red-400"
                    : "border-zinc-300"
                }`}
              />
              {valorTouched && (!valorValido || valorSoloNumerosEstricto) && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#DC3545" />
                      <text
                        x="12"
                        y="16"
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="bold"
                        fill="#fff"
                        fontFamily="Arial"
                      >
                        i
                      </text>
                    </svg>
                  </span>
                  <span>
                    {form?.valor && valorSoloNumerosEstricto
                      ? "Campo inválido"
                      : "Este campo es obligatorio"}
                  </span>
                </div>
              )}
            </div>

            {/* Estado */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                ESTADO
              </span>
              <select
                name="estado"
                value={form?.estado ?? ""}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Selecciona</option>
                <option value="ACTIVA">Activa</option>
                <option value="INACTIVA">Inactiva</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
              </select>
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                  HORA APERTURA
                </span>
                <select
                  name="horaApertura"
                  value={form?.horaApertura ?? "00:00"}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Array.from({ length: 24 }, (_, h) =>
                    ["00", "30"].map((m) => (
                      <option
                        key={`${h}:${m}`}
                        value={`${h.toString().padStart(2, "0")}:${m}`}
                      >
                        {`${h.toString().padStart(2, "0")}:${m}`}
                      </option>
                    ))
                  ).flat()}
                </select>
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                  HORA CIERRE
                </span>
                <select
                  name="horaCierre"
                  value={form?.horaCierre ?? "23:30"}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Array.from({ length: 24 }, (_, h) =>
                    ["00", "30"].map((m) => (
                      <option
                        key={`${h}:${m}`}
                        value={`${h.toString().padStart(2, "0")}:${m}`}
                      >
                        {`${h.toString().padStart(2, "0")}:${m}`}
                      </option>
                    ))
                  ).flat()}
                </select>
              </div>
            </div>

            {/* Botón */}
            <div className="mt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-indigo-600 py-2 text-white font-bold tracking-wide hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Guardando..." : "GUARDAR CAMBIOS"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
