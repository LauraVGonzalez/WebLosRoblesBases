
import React from "react";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { disciplinasSvc } from "../services/canchas";
import { canchasSvc } from "../services/canchas";

export default function ReservaYa() {
  const [disciplinas, setDisciplinas] = React.useState<any[]>([]);
  const [canchas, setCanchas] = React.useState<any[]>([]);
  const [filteredCanchas, setFilteredCanchas] = React.useState<any[]>([]);

  const [disciplinaId, setDisciplinaId] = React.useState<number | "">("");
  const [fecha, setFecha] = React.useState<Date | null>(null);
  const [horaInicio, setHoraInicio] = React.useState<string>("");
  const [horaFin, setHoraFin] = React.useState<string>("");
  const [canchaId, setCanchaId] = React.useState<number | "">("");
  const [valor, setValor] = React.useState<string>("");
  const [showSuccess, setShowSuccess] = React.useState(false);
  // Custom input for react-datepicker so we can keep our styling and control the trigger
  const CustomDateInput = React.forwardRef(({ value, onClick, placeholder }: any, ref: any) => (
    <div className="relative w-full">
      <input
        ref={ref}
        type="text"
        onClick={onClick}
        value={value ?? ''}
        placeholder={placeholder}
        readOnly
        className="block w-full rounded-xl border px-3 pt-6 pb-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-black"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <button type="button" onClick={onClick} className="p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  ));

  React.useEffect(() => {
    (async () => {
      try {
        const d = await disciplinasSvc.list();
        setDisciplinas(d);
      } catch {
        setDisciplinas([]);
      }
    })();
    (async () => {
      try {
        const list = await canchasSvc.list();
        setCanchas(list ?? []);
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
      return;
    }
    const filtered = (canchas ?? []).filter((c: any) => Number(c.idDisciplina ?? c.ID_TIPO_CANCHA ?? 0) === Number(disciplinaId));
    setFilteredCanchas(filtered);
    setCanchaId("");
    setValor("");
  }, [disciplinaId, canchas]);

  React.useEffect(() => {
    if (!canchaId) return;
    const c = (filteredCanchas ?? []).find((x: any) => Number(x.id ?? x.id_cancha ?? x.ID_CANCHA ?? 0) === Number(canchaId));
    const v = c ? String(c.valor ?? c.VALOR ?? "") : "";
    setValor(v);
  }, [canchaId, filteredCanchas]);

  const horas = Array.from({ length: 24 }, (_, h) => [`${h.toString().padStart(2, "0")}:00`, `${h.toString().padStart(2, "0")}:30`]).flat();

  const canReserve = Boolean(disciplinaId && fecha && horaInicio && horaFin && canchaId && valor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReserve) return;
    // For now show success UI; real reservation call can be added later
    setShowSuccess(true);
  };

  return (
    <section className="relative min-h-[calc(100vh-72px)] w-full flex items-center justify-center py-12">
      <img src="/src/assets/pantalla_inicial.png" alt="background" className="absolute inset-0 w-full h-full object-cover brightness-50" />

  <div className="relative z-10 w-full max-w-2xl px-8 py-10 rounded-2xl bg-emerald-100/90 shadow-lg">
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
        <h3 className="text-center text-lg font-semibold text-zinc-800 mb-4">RESERVA TU CANCHA</h3>
        <div className="w-20 h-0.5 bg-emerald-600 mx-auto mb-6" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <select
              value={disciplinaId}
              onChange={e => setDisciplinaId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="" disabled>DISCIPLINA</option>
              {disciplinas.map((d: any) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={canchaId}
              onChange={e => setCanchaId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="" disabled>CANCHA</option>
              {filteredCanchas.map((c: any) => (
                <option key={c.id ?? c.ID_CANCHA} value={c.id ?? c.ID_CANCHA}>{c.nombre ?? c.NOMBRE}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full">
            <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-black">FECHA</span>
            <DatePicker
              selected={fecha}
              onChange={(d: Date | null) => setFecha(d)}
              dateFormat="dd/MM/yyyy"
              placeholderText="dd/mm/aaaa"
              popperPlacement="bottom-end"
              customInput={<CustomDateInput placeholder="dd/mm/aaaa" />}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <select
                value={horaInicio}
                onChange={e => setHoraInicio(e.target.value)}
                className="w-full rounded-xl border px-3 pt-4 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="" disabled>HORA INICIO</option>
                {horas.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={horaFin}
                onChange={e => setHoraFin(e.target.value)}
                className="w-full rounded-xl border px-3 pt-4 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="" disabled>HORA FIN</option>
                {horas.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-black">VALOR</span>
            <input
              value={valor}
              readOnly
              placeholder="100000"
              className="w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-8 text-center">
            <h4 className="text-lg font-semibold mb-2">Reserva creada</h4>
            <p className="text-sm text-zinc-600 mb-4">Tu reserva se registró correctamente.</p>
            <button className="px-6 py-2 bg-emerald-600 text-white rounded-md" onClick={() => setShowSuccess(false)}>Listo</button>
          </div>
        </div>
      )}
    </section>
  );
}
