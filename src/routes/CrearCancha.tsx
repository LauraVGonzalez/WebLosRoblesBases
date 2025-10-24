import React from "react";
import { useNavigate } from "react-router-dom";
import fondo from "../assets/crear_cancha.png";
import { canchasSvc } from "../services/canchas";
import { disciplinasSvc } from "../services/canchas";
import type { Cancha, Disciplina, EstadoCancha } from "../types";

export default function CrearCancha() {
  const [showSuccess, setShowSuccess] = React.useState(false);

  const [showErrors, setShowErrors] = React.useState(false);
  const [valorTouched, setValorTouched] = React.useState(false);
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

  // Validación de campos
  const valid = {
    nombre: form.nombre.trim().length > 0,
    idDisciplina: form.idDisciplina > 0,
    valor: !!form.valor && /^\d+$/.test(form.valor) && Number(form.valor) > 0,
    valorSoloNumeros: !!form.valor && /^\d+$/.test(form.valor),
    valorSoloNumerosEstricto: !!form.valor && !/^\d+$/.test(form.valor),
    estado: !!form.estado,
    horaApertura: !!form.horaApertura,
    horaCierre: !!form.horaCierre,
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

  const aperturaMin = toMinutes(form.horaApertura ?? "");
  const cierreMin = toMinutes(form.horaCierre ?? "");
  const horaOrdenValida = aperturaMin !== null && cierreMin !== null && aperturaMin < cierreMin;
  (valid as any).horaOrden = horaOrdenValida;

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
    if (name === "valor") setValorTouched(true);
    setForm((f) => ({
      ...f,
      // keep 'valor' as string so placeholder works; convert only idDisciplina to number
      [name]: name === "idDisciplina" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    // Si algún campo no es válido, no enviar
    if (!valid.nombre || !valid.idDisciplina || !valid.valor || !valid.estado || !valid.horaApertura || !valid.horaCierre || !horaOrdenValida) {
      return;
    }
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
      await canchasSvc.create(payload);
      setShowSuccess(true);
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

      {/* Modal de éxito */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full flex flex-col items-center">
            <span className="mb-6">
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="45" stroke="#22c55e" strokeWidth="4" fill="none" />
                <polyline points="30,55 47,72 72,38" fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 className="text-2xl font-bold text-zinc-700 mb-2 text-center">Registro exitoso</h2>
            <p className="text-zinc-500 mb-6 text-center">Se registró la cancha</p>
            <button
              className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg px-6 py-2 shadow"
              onClick={() => { setShowSuccess(false); nav('/Principal/Canchas'); }}
            >
              Listo
            </button>
          </div>
        </div>
      )}

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
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">NOMBRE</span>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Stadium name"
                className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${showErrors ? (valid.nombre ? 'border-green-400' : 'border-red-400') : 'border-zinc-300'}`}
              />
              {valid.nombre && (
                <span className="absolute right-3 top-2 text-lg" style={{color: '#22c55e'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              )}
              {/* Mensaje de error debajo del input */}
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
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">DISCIPLINA</span>
              <select
                name="idDisciplina"
                value={form.idDisciplina}
                onChange={handleChange}
                className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${showErrors ? (valid.idDisciplina ? 'border-green-400' : 'border-red-400') : 'border-zinc-300'}`}
              >
                <option value={0}>Selecciona</option>
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
              {valid.idDisciplina && (
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
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">VALOR</span>
              <input
                name="valor"
                inputMode="numeric"
                value={form.valor}
                onChange={handleChange}
                onBlur={() => setValorTouched(true)}
                placeholder="10000"
                className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${(valorTouched || showErrors) ? (valid.valor ? 'border-green-400' : 'border-red-400') : 'border-zinc-300'}`}
              />
              {valid.valor && (
                <span className="absolute right-3 top-2 text-lg" style={{color: '#22c55e'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              )}
              {(valorTouched || showErrors) && (!valid.valor || valid.valorSoloNumerosEstricto) && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#DC3545" />
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                    </svg>
                  </span>
                  <span>{form.valor && valid.valorSoloNumerosEstricto ? "Campo inválido" : "Este campo es obligatorio"}</span>
                </div>
              )}
            </div>

            {/* Estado */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">ESTADO</span>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${showErrors ? (valid.estado ? 'border-green-400' : 'border-red-400') : 'border-zinc-300'}`}
              >
                <option value="">Selecciona</option>
                <option value="ACTIVA">Activa</option>
                <option value="INACTIVA">Inactiva</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
              </select>
              {valid.estado && (
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
                <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">HORA APERTURA</span>
                <select
                  name="horaApertura"
                    value={form.horaApertura}
                    onChange={handleChange}
                    className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${showErrors ? (valid.horaApertura && horaOrdenValida ? 'border-green-400' : 'border-red-400') : 'border-zinc-300'}`}
                >
                  <option value="">Selecciona</option>
                  {Array.from({ length: 24 }, (_, h) =>
                    ["00", "30"].map((m) => (
                      <option key={`${h}:${m}`} value={`${h.toString().padStart(2, "0")}:${m}`}>
                        {`${h.toString().padStart(2, "0")}:${m}`}
                      </option>
                    ))
                  )}
                </select>
                {valid.horaApertura && horaOrdenValida && (
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
                <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">HORA CIERRE</span>
                <select
                  name="horaCierre"
                    value={form.horaCierre}
                    onChange={handleChange}
                    className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${showErrors ? (valid.horaCierre && horaOrdenValida ? 'border-green-400' : 'border-red-400') : 'border-zinc-300'}`}
                >
                  <option value="">Selecciona</option>
                  {Array.from({ length: 24 }, (_, h) =>
                    ["00", "30"].map((m) => (
                      <option key={`${h}:${m}`} value={`${h.toString().padStart(2, "0")}:${m}`}>
                        {`${h.toString().padStart(2, "0")}:${m}`}
                      </option>
                    ))
                  )}
                </select>
                {valid.horaCierre && horaOrdenValida && (
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
                {saving ? "Procesando..." : "CREAR CANCHA"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
