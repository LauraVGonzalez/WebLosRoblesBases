import React from "react";
import { useNavigate } from "react-router-dom";
import fondo from "../assets/crear_cancha.png";
import { canchasSvc } from "../services/canchas";
import { disciplinasSvc } from "../services/canchas";
import type { Cancha, Disciplina, EstadoCancha } from "../types";

export default function CrearCancha() {
  const nav = useNavigate();
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [disciplinas, setDisciplinas] = React.useState<Disciplina[]>([]);
  // Use a local form type so 'valor' can be an empty string (placeholder) and
  // 'estado' can be empty ("Selecciona"). We'll convert to `Cancha` on submit.
  type CanchaForm = Omit<Cancha, "valor" | "estado"> & {
    valor: string;
    estado: EstadoCancha | "";
  };

  const [form, setForm] = React.useState<CanchaForm>({
    nombre: "",
    idDisciplina: 0,
    valor: "",
    estado: "",
    horaApertura: "",
    horaCierre: "",
  });

  React.useEffect(() => {
    (async () => {
      try {
        const d = await disciplinasSvc.list();
        setDisciplinas(d);
      } catch {
        setDisciplinas([]);
      }
    })();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      // keep 'valor' as string so placeholder works; convert only idDisciplina to number
      [name]: name === "idDisciplina" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErr(null);
      setSaving(true);
      // Normalize types before sending and build a proper Cancha
      const payload: Cancha = {
        nombre: form.nombre,
        idDisciplina: Number(form.idDisciplina) || 0,
        valor: Number(form.valor) || 0,
        estado: (form.estado as EstadoCancha) || 'INACTIVA',
        horaApertura: form.horaApertura,
        horaCierre: form.horaCierre,
      };
      const { id } = await canchasSvc.create(payload);
      alert("✅ Cancha creada correctamente");
      nav(`/Principal/Canchas/Editar/${id}`);
    } catch (e: any) {
      setErr(e?.message ?? "Error al crear la cancha");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="relative min-h-[calc(100vh-72px)] w-full">
      {/* Imagen de fondo */}
      <img
        src={fondo}
        alt="Fondo de Crear Cancha"
        className="absolute inset-0 h-full w-full object-cover scale-105"
      />

      {/* Contenedor principal */}
      <div className="relative z-[1] mx-auto w-full max-w-[900px] p-6">
        <div className="mx-auto mt-10 rounded-2xl bg-white p-8 shadow-xl">
          {/* Título */}
          <h2 className="text-center text-xl font-bold tracking-wide text-zinc-800">
            CREAR CANCHA
          </h2>
          <div className="mt-1 h-1 w-20 mx-auto bg-emerald-600 rounded-full" />

          {/* Error general */}
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
                value={form.nombre}
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
                value={form.idDisciplina}
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
                value={form.valor}
                onChange={handleChange}
                placeholder="10000"
                className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Estado */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                ESTADO
              </span>
              <select
                name="estado"
                value={form.estado}
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
                  value={form.horaApertura}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Array.from({ length: 24 }, (_, h) =>
                    ["00", "30"].map((m) => (
                      <option key={`${h}:${m}`} value={`${h.toString().padStart(2, "0")}:${m}`}>
                        {`${h.toString().padStart(2, "0")}:${m}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                  HORA CIERRE
                </span>
                <select
                  name="horaCierre"
                  value={form.horaCierre}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Array.from({ length: 24 }, (_, h) =>
                    ["00", "30"].map((m) => (
                      <option key={`${h}:${m}`} value={`${h.toString().padStart(2, "0")}:${m}`}>
                        {`${h.toString().padStart(2, "0")}:${m}`}
                      </option>
                    ))
                  )}
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
                {saving ? "Procesando..." : "CREAR CANCHA"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
