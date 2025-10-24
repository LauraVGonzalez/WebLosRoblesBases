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

  const [showErrors, setShowErrors] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  // Validación de valor
  const valorValido =
    form?.valor !== undefined &&
    /^\d+$/.test(String(form?.valor)) &&
    Number(form?.valor) > 0;
  const valorSoloNumerosEstricto =
    form?.valor !== undefined &&
    String(form?.valor).length > 0 &&
    !/^\d+$/.test(String(form?.valor));

  // Validación completa (similar a CrearCancha)
  const valid = {
    nombre: !!form?.nombre && String(form.nombre).trim().length > 0,
    idDisciplina: !!form?.idDisciplina && Number(form.idDisciplina) > 0,
    valor: valorValido,
    valorSoloNumerosEstricto,
    estado: !!form?.estado && String(form.estado).trim().length > 0,
    horaApertura: !!form?.horaApertura && String(form.horaApertura).trim().length > 0,
    horaCierre: !!form?.horaCierre && String(form.horaCierre).trim().length > 0,
  };

  // Validación del rango de horas: apertura debe ser anterior a cierre (misma jornada)
  const toMinutes = (s?: string | number | null) => {
    if (s === undefined || s === null) return null;
    const str = String(s);
    if (!str.includes(':')) return null;
    const [hh, mm] = str.split(':').map((x) => Number(x));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return hh * 60 + mm;
  };

  const aperturaMin = toMinutes(form?.horaApertura ?? "");
  const cierreMin = toMinutes(form?.horaCierre ?? "");
  const horaOrdenValida = aperturaMin !== null && cierreMin !== null && aperturaMin < cierreMin;

  // añadir la validación combinada al objeto valid para usarla en el submit y en el UI
  (valid as any).horaOrden = horaOrdenValida;

  // Construir el mensaje de error para el campo "valor" de forma explícita
  const valorError: React.ReactNode = (() => {
    // Show valor errors only when form submit attempted (showErrors === true).
    if (!showErrors) return null;
    const v = String(form?.valor ?? "").trim();
    if (v === "") {
      return (
        <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
          <span className="inline-flex items-center justify-center w-4 h-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#DC3545" />
              <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
            </svg>
          </span>
          <span>Este campo es obligatorio</span>
        </div>
      );
    }
    if (valorSoloNumerosEstricto) {
      return (
        <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
          <span className="inline-flex items-center justify-center w-4 h-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#DC3545" />
              <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
            </svg>
          </span>
          <span>Campo inválido</span>
        </div>
      );
    }
    if (!valorValido) {
      return (
        <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
          <span className="inline-flex items-center justify-center w-4 h-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#DC3545" />
              <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
            </svg>
          </span>
          <span>Valor debe ser mayor que 0</span>
        </div>
      );
    }
    return null;
  })();

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
    // Mostrar errores y bloquear envío si algún campo requerido está vacío/ inválido
    setShowErrors(true);
    if (!valid.nombre || !valid.idDisciplina || !valid.valor || !valid.estado || !valid.horaApertura || !valid.horaCierre || !horaOrdenValida) {
      return;
    }
    try {
      setSaving(true);
      await canchasSvc.update(Number(id), {
        ...form,
        valor: Number(form.valor),
      });
      // Mostrar modal de éxito en lugar de alert
      setShowSuccess(true);
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
                className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${showErrors ? (valid.nombre ? 'border-green-400' : 'border-red-400') : 'border-zinc-300'}`}
              />
              {showErrors && valid.nombre && (
                <span className="absolute right-3 top-2 text-lg" style={{color: '#22c55e'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              )}
              {showErrors && !valid.nombre && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#DC3545" />
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                    </svg>
                  </span>
                  <span>Este campo es obligatorio</span>
                </div>
              )}
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
                className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${showErrors ? (valid.idDisciplina ? 'border-green-400' : 'border-red-400') : 'border-zinc-300'}`}
              >
                <option value={0}>Selecciona</option>
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
              {showErrors && valid.idDisciplina && (
                <span className="absolute right-3 top-2 text-lg" style={{color: '#22c55e'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              )}
              {showErrors && !valid.idDisciplina && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#DC3545" />
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                    </svg>
                  </span>
                  <span>Este campo es obligatorio</span>
                </div>
              )}
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
                
                placeholder="100000"
                className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${showErrors
                  ? (valorValido ? 'border-green-400' : 'border-red-400')
                  : 'border-zinc-300'}`}
              />
              {showErrors && valid.valor && (
                <span className="absolute right-3 top-2 text-lg" style={{color: '#22c55e'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              )}
              {valorError}
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
                className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${showErrors ? (valid.estado ? 'border-green-400' : 'border-red-400') : 'border-zinc-300'}`}
              >
                <option value="">Selecciona</option>
                <option value="ACTIVA">Activa</option>
                <option value="INACTIVA">Inactiva</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
              </select>
              {showErrors && valid.estado && (
                <span className="absolute right-3 top-2 text-lg" style={{color: '#22c55e'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              )}
              {showErrors && !valid.estado && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#DC3545" />
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                    </svg>
                  </span>
                  <span>Este campo es obligatorio</span>
                </div>
              )}
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                  HORA APERTURA
                </span>
                <select
                  name="horaApertura"
                    value={form?.horaApertura ?? ""}
                    onChange={handleChange}
                      className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${showErrors ? (valid.horaApertura && horaOrdenValida ? 'border-green-400' : 'border-red-400') : 'border-zinc-300'}`}
                >
                    <option value="">Selecciona</option>
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
                  {showErrors && valid.horaApertura && horaOrdenValida && (
                    <span className="absolute right-3 top-2 text-lg" style={{color: '#22c55e'}}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </span>
                  )}
                  {showErrors && !valid.horaApertura && (
                    <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                      <span className="inline-flex items-center justify-center w-4 h-4">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" fill="#DC3545" />
                          <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                        </svg>
                      </span>
                      <span>Este campo es obligatorio</span>
                    </div>
                  )}
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                  HORA CIERRE
                </span>
                <select
                  name="horaCierre"
                      value={form?.horaCierre ?? ""}
                    onChange={handleChange}
                    className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${showErrors ? (valid.horaCierre && horaOrdenValida ? 'border-green-400' : 'border-red-400') : 'border-zinc-300'}`}
                >
                    <option value="">Selecciona</option>
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
                  {showErrors && valid.horaCierre && horaOrdenValida && (
                    <span className="absolute right-3 top-2 text-lg" style={{color: '#22c55e'}}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </span>
                  )}
                  {showErrors && !valid.horaCierre && (
                    <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                      <span className="inline-flex items-center justify-center w-4 h-4">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" fill="#DC3545" />
                          <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                        </svg>
                      </span>
                      <span>Este campo es obligatorio</span>
                    </div>
                  )}
              </div>
            </div>

            {/* Mensaje combinado si ambas horas están presentes pero el rango es inválido */}
            {showErrors && valid.horaApertura && valid.horaCierre && !horaOrdenValida && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <span className="inline-flex items-center justify-center w-4 h-4">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#DC3545" />
                    <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                  </svg>
                </span>
                <span>La hora de apertura debe preceder a la hora de cierre</span>
              </div>
            )}

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

      {/* Modal de éxito (igual estilo que CrearCancha) */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full flex flex-col items-center">
            <span className="mb-6">
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="45" stroke="#22c55e" strokeWidth="4" fill="none" />
                <polyline points="30,55 47,72 72,38" fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 className="text-2xl font-bold text-zinc-700 mb-2 text-center">Actualización exitosa</h2>
            <p className="text-zinc-500 mb-6 text-center">Se actualizaron los datos diligenciados</p>
            <button
              className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg px-6 py-2 shadow"
              onClick={() => { setShowSuccess(false); nav('/PrincipalAdmin/Canchas'); }}
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
