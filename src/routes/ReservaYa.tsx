
import React from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { disciplinasSvc } from "../services/canchas";
import { canchasSvc } from "../services/canchas";
import { reservasSvc } from "../services/reservas";
import { api } from "../api/client";

export default function ReservaYa() {
  const navigate = useNavigate();
  const [disciplinas, setDisciplinas] = React.useState<any[]>([]);
  const [canchas, setCanchas] = React.useState<any[]>([]);
  const [filteredCanchas, setFilteredCanchas] = React.useState<any[]>([]);

  const [disciplinaId, setDisciplinaId] = React.useState<number | "">("");
  const [fecha, setFecha] = React.useState<Date | null>(null);
  const [horaInicio, setHoraInicio] = React.useState<string>("");
  const [canchaId, setCanchaId] = React.useState<number | "">("");
  const [selectedCancha, setSelectedCancha] = React.useState<any>(null);
  const [valor, setValor] = React.useState<string>("");
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  // constant list of whole-hour slots between 05:00 and 22:00 (memoized so reference is stable)
  const horas = React.useMemo(() => {
    const out: string[] = [];
    for (let h = 5; h <= 22; h++) {
      out.push(`${h.toString().padStart(2, "0")}:00`);
    }
    return out;
  }, []);
  const [availableHoras, setAvailableHoras] = React.useState<string[]>(() => horas);
  // Custom input for react-datepicker so we can keep our styling and control the trigger
  const CustomDateInput = React.forwardRef<HTMLInputElement, any>((props, ref) => {
    const { value, onClick, placeholder, hasError } = props;
    // allow keyboard opening (Enter / Space) and focus to trigger datepicker
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' ) {
        e.preventDefault();
        if (onClick) onClick();
      }
    };

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type="text"
          onClick={onClick}
          onFocus={onClick}
          onKeyDown={handleKeyDown}
          value={value ?? ''}
          placeholder={placeholder}
          readOnly
          className={"block w-full rounded-xl bg-white px-3 pt-6 pb-3 pr-10 text-sm outline-none shadow-sm " + (hasError ? "ring-1 ring-red-500" : "")}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <button type="button" onClick={onClick} className="p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    );
  });

    // date validation: today .. today + 30 days (inclusive)
    const today = React.useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
    const maxDate = React.useMemo(() => new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), [today]);
    const [dateError, setDateError] = React.useState<string>("");

    const validateDate = (d: Date | null) => {
      if (!d) {
        // don't show an 'obligatoria' error when the user hasn't picked a date yet;
        // keep the field invalid (prevent submit) but show no message until they interact.
        setDateError("");
        return false;
      }
      const sel = new Date(d);
      sel.setHours(0,0,0,0);
      if (sel.getTime() < today.getTime()) {
        setDateError("No se permite reservar en días anteriores");
        return false;
      }
      if (sel.getTime() > maxDate.getTime()) {
        setDateError("La fecha debe ser como máximo 30 días desde hoy");
        return false;
      }
      setDateError("");
      return true;
    };

    React.useEffect(() => {
      validateDate(fecha);
    }, [fecha, today, maxDate]);

  React.useEffect(() => {
    (async () => {
      try {
        const d = await disciplinasSvc.list();
        setDisciplinas(d);
        // debug
        console.debug('[ReservaYa] disciplinas cargadas:', d);
      } catch {
        setDisciplinas([]);
      }
    })();
    (async () => {
      try {
        const list = await canchasSvc.list();
        console.debug('[ReservaYa] canchas raw:', list);
        // keep only canchas cuyo estado sea utilizable (robust to different key casings)
        const filtered = (list ?? []).filter((c: any) => {
          const estadoRaw = c?.ESTADO ?? c?.estado ?? c?.Estado ?? "";
          const estado = String(estadoRaw).trim().toUpperCase();
          // DB might use 'DISPONIBLE' instead of 'ACTIVA' depending on DDL/data
          return ["ACTIVA", "DISPONIBLE"].includes(estado);
        });
        setCanchas(filtered);
      } catch {
        setCanchas([]);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!disciplinaId) {
      setFilteredCanchas([]);
      setCanchaId("");
      setValor("");
      setSelectedCancha(null);
      setAvailableHoras(horas);
      return;
    }
    const filtered = (canchas ?? []).filter((c: any) => Number(c.idDisciplina ?? c.ID_TIPO_CANCHA ?? 0) === Number(disciplinaId));
    setFilteredCanchas(filtered);
    setCanchaId("");
    setValor("");
    setAvailableHoras(horas);
  }, [disciplinaId, canchas]);

  React.useEffect(() => {
    // prefer the selectedCancha object if available; otherwise attempt to find by id
    let c = selectedCancha ?? ((filteredCanchas ?? []).find((x: any) => Number(x.id ?? x.id_cancha ?? x.ID_CANCHA ?? x.ID ?? 0) === Number(canchaId)));
    // if we couldn't find the cancha in the already-fetched list, or the selected object lacks horario fields, fetch the full cancha detail
    const lacksHoras = (obj: any) => {
      if (!obj) return true;
      const keys = Object.keys(obj || {});
      const has = (k: string) => keys.includes(k) || Object.prototype.hasOwnProperty.call(obj, k);
      return !(has('horaApertura') || has('HORA_APERTURA') || has('hora_apertura')) || !(has('horaCierre') || has('HORA_CIERRE') || has('hora_cierre'));
    };

    if ((!c && canchaId) || (c && lacksHoras(c) && canchaId)) {
      (async () => {
        try {
          const fetched = await canchasSvc.get(Number(canchaId));
          if (fetched) {
            setSelectedCancha(fetched);
            c = fetched;
            const v = c ? String(c.valor ?? c.VALOR ?? "") : "";
            setValor(v);
          }
        } catch (e) {
          // ignore fetch errors for UI resilience
        }
      })();
    }
    if (!c) {
      // when no cancha selected, reset valor and available hours
      setValor("");
      setAvailableHoras(horas);
      setHoraInicio("");
      return;
    }

    const v = c ? String(c.valor ?? c.VALOR ?? "") : "";
    setValor(v);

    // DEBUG: print raw cancha object and detected apertura/cierre to help troubleshooting
    try {
      // eslint-disable-next-line no-console
      console.debug('[ReservaYa] cancha seleccionado (raw):', c);
    } catch (e) {
      // ignore
    }

    // compute available hours from cancha opening/closing fields
    const getFirst = (obj: any, keys: string[]) => {
      for (const k of keys) {
        const v = obj?.[k];
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
      }
      return "";
    };

    const apertura = getFirst(c, [
      'horaApertura', 'HORA_APERTURA', 'hora_apertura', 'horaInicio', 'hora_inicio', 'HORA_INICIO', 'apertura', 'apertura_hora', 'inicio', 'horario_inicio'
    ]);
    const cierre = getFirst(c, [
      'horaCierre', 'HORA_CIERRE', 'hora_cierre', 'horaFin', 'hora_fin', 'HORA_FIN', 'cierre', 'cierre_hora', 'fin', 'horario_fin'
    ]);

    const toMinutes = (hhmm: any) => {
      if (hhmm === undefined || hhmm === null) return NaN;

      // If it's a Date object, use hours and minutes directly
      if (hhmm instanceof Date) {
        return hhmm.getHours() * 60 + hhmm.getMinutes();
      }

      const s = String(hhmm).trim();
      if (!s) return NaN;

      // Handle ISO datetime like '2024-01-01T13:00:00.000Z' or '2024-01-01 13:00:00'
      if (s.includes('T')) {
        const timePart = s.split('T')[1] ?? '';
        // strip timezone if present
        const clean = timePart.split('.')[0].replace(/Z$/,'');
        const parts = clean.split(':');
        const hh = Number(parts[0]);
        const mm = Number(parts[1] ?? 0);
        if (Number.isNaN(hh) || Number.isNaN(mm)) return NaN;
        return hh * 60 + mm;
      }

      if (s.includes(' ')) {
        const afterSpace = s.split(' ')[1] ?? s;
        if (afterSpace.includes(':')) {
          const parts = afterSpace.split(':');
          const hh = Number(parts[0]);
          const mm = Number(parts[1] ?? 0);
          if (Number.isNaN(hh) || Number.isNaN(mm)) return NaN;
          return hh * 60 + mm;
        }
      }

      // accept 'HH:mm' or 'H' or 'HH' formats
      if (s.includes(':')) {
        const parts = s.split(':');
        const hh = Number(parts[0]);
        const mm = Number(parts[1] ?? 0);
        if (Number.isNaN(hh) || Number.isNaN(mm)) return NaN;
        return hh * 60 + mm;
      }

      // if only hour provided like '7' or '07'
      const hh = Number(s);
      if (Number.isNaN(hh)) return NaN;
      return hh * 60;
    };

    const min = toMinutes(apertura);
    const max = toMinutes(cierre);
    if (Number.isNaN(min) || Number.isNaN(max)) {
      // try to detect numeric hours (e.g. 7 and 18 stored as numbers)
      const numericMin = Number(apertura);
      const numericMax = Number(cierre);
      if (!Number.isNaN(numericMin) && !Number.isNaN(numericMax)) {
        // convert to minutes
        const fmin = numericMin * 60;
        const fmax = numericMax * 60;
        const filteredHoursNum = horas.filter(h => {
          const [hh, mm] = h.split(":").map(s => Number(s));
          const val = hh * 60 + mm;
          if (fmax >= fmin) {
            // same-day closure: start time + 60min must be <= cierre
            return val >= fmin && (val + 60) <= fmax;
          }
          // closure next day: allow starts that finish before midnight or finish before cierre (next day)
          return (val >= fmin && (val + 60) <= 24 * 60) || ((val + 60) <= fmax);
        });
        setAvailableHoras(filteredHoursNum);
        if (horaInicio && !filteredHoursNum.includes(horaInicio)) setHoraInicio("");
        return;
      }

      setAvailableHoras(horas);
      return;
    }

    let filteredHours: string[];
    if (max >= min) {
      // same-day closure: only include start times whose +1h does not exceed cierre
      filteredHours = horas.filter(h => {
        const [hh, mm] = h.split(":").map(s => Number(s));
        const val = hh * 60 + mm;
        return val >= min && (val + 60) <= max;
      });
    } else {
      // cierre es al día siguiente (p. ej. apertura 18:00, cierre 02:00)
      // allow starts that finish before midnight, or starts after midnight that finish before cierre
      filteredHours = horas.filter(h => {
        const [hh, mm] = h.split(":").map(s => Number(s));
        const val = hh * 60 + mm;
        return (val >= min && (val + 60) <= 24 * 60) || ((val + 60) <= max);
      });
    }

    setAvailableHoras(filteredHours);
    if (horaInicio && !filteredHours.includes(horaInicio)) {
      setHoraInicio("");
    }
  }, [canchaId, filteredCanchas, horas]);

  const canReserve = Boolean(disciplinaId && fecha && horaInicio && canchaId && valor && !submitting && dateError === "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReserve) return;
    setSubmitting(true);
    try {
      // get current user correo from localStorage
      const correo = localStorage.getItem("usuario_correo") || "";
      if (!correo) {
        // redirect user to login so they can authenticate
        navigate("/Inicio/IniciarSesion");
        return;
      }

      // fetch profile to obtain id_cliente and id_usuario
      // Try to reuse ids stored in localStorage to avoid an extra roundtrip
      let id_cliente = Number(localStorage.getItem('id_cliente') || 0);
      let id_usuario_creador = Number(localStorage.getItem('id_usuario') || 0);

      if (!id_cliente || !id_usuario_creador) {
        // fetch profile from backend when we don't have ids locally
        let perfil;
        try {
          perfil = await api.get<any>(`/usuarios/perfil?correo=${encodeURIComponent(correo)}`);
        } catch (err: any) {
          // API error: show message from server if available
          const msg = err?.message || String(err);
          throw new Error(`Error obteniendo perfil: ${msg}`);
        }

        id_cliente = Number(perfil?.id_cliente ?? perfil?.ID_CLIENTE ?? 0);
        id_usuario_creador = Number(perfil?.id_usuario ?? perfil?.ID_USUARIO ?? 0);

        if (id_cliente) localStorage.setItem('id_cliente', String(id_cliente));
        if (id_usuario_creador) localStorage.setItem('id_usuario', String(id_usuario_creador));
      }

      if (!id_cliente || !id_usuario_creador) {
        // include returned payload for easier debugging
        console.debug('[ReservaYa] perfil obtenido pero incompleto. localStorage ids:', {
          id_cliente: localStorage.getItem('id_cliente'),
          id_usuario: localStorage.getItem('id_usuario')
        });
        throw new Error("No se pudo obtener información del usuario (perfil incompleto)");
      }

      // build inicio and fin timestamps
  if (!fecha) throw new Error("Fecha inválida");
  if (dateError) throw new Error(dateError);
      // horaInicio is like '07:00' or '07:30'
      const [hh, mm] = horaInicio.split(":").map(s => Number(s));
      const inicio = new Date(fecha);
      inicio.setHours(hh, mm ?? 0, 0, 0);
      const fin = new Date(inicio.getTime() + 60 * 60 * 1000); // +1 hour

      const payload = {
        id_cliente,
        id_cancha: Number(canchaId),
        id_usuario_creador,
        inicio_ts: inicio.toISOString(),
        fin_ts: fin.toISOString(),
        estado: 'programada'
      };

  await reservasSvc.create(payload);
      // success
      setShowSuccess(true);
      // optionally reset form
      setDisciplinaId("");
      setCanchaId("");
      setSelectedCancha(null);
      setFecha(null);
      setHoraInicio("");
      setValor("");
    } catch (err: any) {
      console.error('[ReservaYa] error creating reserva', err);
      // show basic alert — you can replace with nicer UI
      alert(err?.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative min-h-[calc(100vh-72px)] w-full flex items-center justify-center py-12">
      <img src="/src/assets/pantalla_inicial.png" alt="background" className="absolute inset-0 w-full h-full object-cover brightness-50" />

      <div className="relative z-10 w-full max-w-md px-8 py-10 rounded-3xl bg-[#9EE6D0]/90 shadow-lg">
        <style>{`
          /* Hide only the browser native datepicker icon (keep our custom svg) */
          input[type="date"].hide-native::-webkit-calendar-picker-indicator { display: none; }
          input[type="date"].hide-native::-webkit-clear-button { display: none; }
          input[type="date"].hide-native::-webkit-inner-spin-button { display: none; }
          input[type="date"].hide-native::-ms-clear { display: none; }
          input[type="date"].hide-native::-ms-expand { display: none; }

          /* Make react-datepicker's input container full width so customInput can expand */
          .react-datepicker__input-container { display: block; width: 100%; }
          .react-datepicker-wrapper { width: 100%; }
        `}</style>

        <h3 className="text-center text-lg font-extrabold tracking-wider text-zinc-800 mb-2">RESERVA TU CANCHA</h3>
        <div className="w-24 h-0.5 bg-emerald-700 mx-auto mb-6" />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* DISCIPLINA */}
            <select
              value={disciplinaId}
              onChange={e => setDisciplinaId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-xl bg-white px-3 pt-5 pb-3 text-sm outline-none shadow-sm"
            >
              <option value="" disabled>DISCIPLINA</option>
              {disciplinas.map((d: any) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>

          {/* CANCHA */}
          <div className="relative">
            <select
              value={selectedCancha ? JSON.stringify(selectedCancha) : ""}
              onChange={e => {
                const val = e.target.value;
                if (!val) {
                  setSelectedCancha(null);
                  setCanchaId("");
                  return;
                }
                try {
                  const obj = JSON.parse(val);
                  setSelectedCancha(obj);
                  setCanchaId(obj?.id ?? obj?.ID_CANCHA ?? obj?.ID ?? obj?.id_cancha ?? "");
                } catch (err) {
                  // fallback: try numeric id value
                  setSelectedCancha(null);
                  setCanchaId(val === "" ? "" : Number(val));
                }
              }}
              className="w-full rounded-xl bg-white px-3 pt-5 pb-3 text-sm outline-none shadow-sm"
            >
              <option value="" disabled>CANCHA</option>
              {filteredCanchas.map((c: any) => (
                <option key={c.id ?? c.ID_CANCHA ?? c.ID} value={JSON.stringify(c)}>{c.nombre ?? c.NOMBRE}</option>
              ))}
            </select>
          </div>

          {/* FECHA */}
          <div className="relative w-full">
            <span className="pointer-events-none absolute left-4 top-1.5 text-[11px] font-semibold text-zinc-600 z-10">FECHA</span>
            <DatePicker
              selected={fecha}
              onChange={(d: Date | null) => setFecha(d)}
              dateFormat="dd/MM/yyyy"
              placeholderText="dd/mm/aaaa"
              popperPlacement="bottom-end"
              minDate={today}
              maxDate={maxDate}
              customInput={<CustomDateInput placeholder="dd/mm/aaaa" hasError={Boolean(dateError)} />}
            />
            {dateError && (
              <div className="mt-1 text-sm text-red-600 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.68-1.36 3.446 0l5.518 9.82c.75 1.334-.213 2.981-1.723 2.981H4.462c-1.51 0-2.473-1.647-1.723-2.98l5.518-9.82zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-.993.883L9 6v4a1 1 0 001.993.117L11 10V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{dateError}</span>
              </div>
            )}
          </div>

          {/* HORA */}
          <div className="relative">
            <select
              value={horaInicio}
              onChange={e => setHoraInicio(e.target.value)}
              className="w-full rounded-xl bg-white px-3 pt-4 pb-3 text-sm outline-none shadow-sm"
            >
              <option value="" disabled>HORA</option>
              {availableHoras.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {/* VALOR */}
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1.5 text-[11px] font-semibold text-zinc-600">VALOR</span>
            <input
              value={valor}
              readOnly
              placeholder="$100000"
              className="w-full rounded-xl bg-white px-3 pt-6 pb-3 text-sm outline-none shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!canReserve}
            className="w-full bg-black text-white rounded-full py-3 font-semibold disabled:opacity-60"
          >
            RESERVAR CANCHA
          </button>
        </form>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl p-8 text-center w-[min(720px,90%)] shadow-xl">
            <div className="flex justify-center mb-4">
              <div className="h-32 w-32 rounded-full border-4 border-emerald-400 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-zinc-800 mb-2">Reserva exitosa</h2>
            <p className="text-sm text-zinc-600 mb-6">Se registró correctamente la reserva</p>
            <button className="px-6 py-3 bg-emerald-600 text-white rounded-md shadow" onClick={() => { setShowSuccess(false); navigate('/Principal/Reservas'); }}>Listo</button>
          </div>
        </div>
      )}
    </section>
  );
}
