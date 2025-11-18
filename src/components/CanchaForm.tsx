import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { Cancha, Disciplina } from "../types";
import { disciplinasSvc } from "../services/canchas";
import { ESTADOS_CANCHA } from "../constants";

// Tipo local del formulario: permite estado '' para mostrar "Selecciona"
type FormState = Omit<Cancha, "estado"> & { estado: "" | Cancha["estado"] };

type Props = {
  initial?: Partial<Cancha>;
  loading?: boolean;
  submitLabel: string;
  onSubmit: (values: Cancha) => Promise<void> | void;
};

const to2 = (n: number) => n.toString().padStart(2, "0");
const genTimeOptions = (step = 30) => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += step) out.push(`${to2(h)}:${to2(m)}`);
  return out;
};

// defaults usan FormState (estado vacío para placeholder) — aquí dejamos campos vacíos
const defaults: FormState = {
  nombre: "",
  idDisciplina: 0,
  valor: undefined as any,
  estado: "",
  horaApertura: "",
  horaCierre: "",
};

export default function CanchaForm({ initial, loading, submitLabel, onSubmit }: Props) {
  const [v, setV] = useState<FormState>({ ...defaults, ...(initial ?? {}) });
  const [disc, setDisc] = useState<Disciplina[]>([]);
  const [loadDisc, setLoadDisc] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeOpts = useMemo(() => genTimeOptions(30), []);

  useEffect(() => {
    if (initial) {
      setV(() => ({ ...defaults, ...initial }));
    }
  }, [initial]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoadDisc(true);
  const d = await disciplinasSvc.list(); // ← servicio normaliza campos
  console.log("[CanchaForm] disciplinas raw:", d);
  console.table?.(d);
        if (!cancel) {
          setDisc(d);
          setError(null); // limpia errores de carga previos
        }
      } catch (e: any) {
        console.error("[CanchaForm] error cargando disciplinas:", e);
        if (!cancel) setError(e?.message ?? "Error cargando disciplinas");
      } finally {
        if (!cancel) setLoadDisc(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const chg = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setV((x) => ({
      ...x,
      [name]:
        name === "valor" ? Number(value.replace(/\D+/g, "")) :
        name === "idDisciplina" ? Number(value) :
        (value as any),
    }) as FormState);
  };

  const validate = (): string | null => {
    if (!v.nombre.trim()) return "El nombre es obligatorio.";
    if (!v.idDisciplina) return "Selecciona una disciplina.";
    if (!v.estado) return "Selecciona un estado.";
    if (v.valor <= 0) return "El valor debe ser mayor a 0.";
    if (v.horaApertura >= v.horaCierre) return "La hora de apertura debe preceder a la hora de cierre.";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    try {
      await onSubmit(v as Cancha); // v.estado ya no es ''
    } catch (e: any) {
      // api.client throws Error(text) where text may be JSON like { error: '...' }
      let msg = e?.message ?? String(e || 'Error');
      try {
        const parsed = JSON.parse(msg);
        msg = parsed?.error ?? parsed?.message ?? msg;
      } catch (_) {
        // keep original
      }
      setError(msg);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-xl rounded-2xl bg-white/95 p-6 shadow-xl">
      {/* Nombre */}
      <label className="mb-1 block text-xs uppercase text-gray-600">Nombre</label>
      <input
        name="nombre"
        value={v.nombre}
        onChange={chg}
        placeholder="Stadium name"
  className="mb-3 w-full rounded-lg border px-3 py-2 outline-none focus:ring placeholder:text-zinc-400"
      />

      {/* Disciplina */}
      <label className="mb-1 block text-xs uppercase text-gray-600">Disciplina</label>
      <select
        name="idDisciplina"
        value={v.idDisciplina}
        onChange={chg}
        disabled={loadDisc}
  className="mb-3 w-full rounded-lg border px-3 py-2 outline-none focus:ring disabled:opacity-60 placeholder:text-zinc-400"
      >
        <option value={0}>{loadDisc ? "Cargando..." : "Selecciona"}</option>
        {!loadDisc && disc.length === 0 && (
          <option value={0} disabled>(Sin disciplinas)</option>
        )}
        {disc.map((d, i) => (
          <option key={d?.id ?? `disc-${i}`} value={d?.id ?? i}>
            {d?.nombre ?? `Disciplina ${i + 1}`}
          </option>
        ))}
      </select>

      {/* Valor */}
      <label className="mb-1 block text-xs uppercase text-gray-600">Valor</label>
      <input
        name="valor"
        inputMode="numeric"
        value={v.valor ? v.valor : ""}
        onChange={chg}
        placeholder="100000"
  className="mb-3 w-full rounded-lg border px-3 py-2 outline-none focus:ring placeholder:text-zinc-400"
      />

      {/* Estado */}
      <label className="mb-1 block text-xs uppercase text-gray-600">Estado</label>
      <select
        name="estado"
        value={v.estado}
        onChange={chg}
  className="mb-3 w-full rounded-lg border px-3 py-2 outline-none focus:ring placeholder:text-zinc-400"
      >
        <option value="">Selecciona</option>
        {ESTADOS_CANCHA.map((e) => (
          <option key={e} value={e}>
            {e === "ACTIVA" ? "Activa" : e === "INACTIVA" ? "Inactiva" : "Mantenimiento"}
          </option>
        ))}
      </select>

      {/* Horarios */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs uppercase text-gray-600">Hora apertura</label>
          <select
            name="horaApertura"
            value={v.horaApertura}
            onChange={chg}
            className="mb-3 w-full rounded-lg border px-3 py-2 outline-none focus:ring placeholder:text-zinc-400"
          >
            {timeOpts.map((t) => (
              <option key={`a-${t}`} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase text-gray-600">Hora cierre</label>
          <select
            name="horaCierre"
            value={v.horaCierre}
            onChange={chg}
            className="mb-3 w-full rounded-lg border px-3 py-2 outline-none focus:ring placeholder:text-zinc-400"
          >
            {timeOpts.map((t) => (
              <option key={`c-${t}`} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-lg bg-indigo-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Procesando..." : submitLabel}
      </button>
    </form>
  );
}
