import { useEffect, useState } from 'react';
import { reservasSvc } from '../services/reservas';
import reservasBg from '../assets/reservas.jpg';

export default function ReservasAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; table?: string } | null>(null);
  const [busyCancel, setBusyCancel] = useState<boolean>(false);
  const [filterName, setFilterName] = useState<string>('');

  useEffect(() => {
    (async () => { await loadRows(); })();
  }, []);

  // Extracted loader so we can refresh after actions (keeps parity with client view)
  async function loadRows() {
    try {
      setLoading(true);
      const r = await reservasSvc.list();
      // keep only reservations in state 'programada'
      const filtered = (r || []).filter((it: any) => String(it.estado ?? it.ESTADO ?? '').toLowerCase() === 'programada');
      setRows(filtered);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? 'Error cargando reservas');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(rowOrId: any) {
    // accept either full row object or numeric id
    const id = typeof rowOrId === 'number' ? rowOrId : (rowOrId.id_reserva ?? rowOrId.ID_RESERVA);
    // detect terceros rows by presence of ID_USUARIO_CREADOR or CONTACTO_TERCERO
    const isTercero = !!(rowOrId && (rowOrId.ID_USUARIO_CREADOR ?? rowOrId.id_usuario_creador ?? rowOrId.CONTACTO_TERCERO ?? rowOrId.contacto_tercero));
    setConfirmTarget({ id: Number(id), table: isTercero ? 'tercero' : 'reserva' });
  }

  async function confirmCancel() {
    if (!confirmTarget) return;
    const id = confirmTarget.id;
    const table = (confirmTarget.table || '').toLowerCase();
    setBusyCancel(true);
    try {
      if (table === 'tercero') {
        await reservasSvc.cancel(id, { table: 'tercero' });
      } else if (table === 'reserva') {
        await reservasSvc.cancel(id, { table: 'reserva' });
      } else {
        await reservasSvc.cancel(id);
      }
      // reload from server to avoid stale-state / repeated 409 errors
      await loadRows();
      setErr(null);
      setSuccessMsg('Reserva cancelada correctamente');
      setConfirmTarget(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      let msg = e?.message ?? 'Error cancelando';
      try {
        const parsed = JSON.parse(msg);
        if (parsed && parsed.error) msg = String(parsed.error);
      } catch (_) {}
      setErr(null);
      setErrorToast(msg);
      // If server says it's already cancelled, refresh list to reflect actual state
      try {
        if (String(msg).toLowerCase().includes('ya cancelada')) {
          await loadRows();
        }
      } catch (_) {}
      setTimeout(() => setErrorToast(null), 4000);
    } finally {
      setBusyCancel(false);
    }
  }

  function fmtDate(v: any) {
    if (!v) return '';
    try {
      const d = new Date(String(v));
      if (isNaN(d.getTime())) return '';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch { return ''; }
  }

  function fmtTime(timeVal: any) {
    if (timeVal === undefined || timeVal === null) return '';
    const s = String(timeVal);
    if (!s) return '';
    return s.split(':').slice(0,2).join(':');
  }

  function displayClientName(r: any) {
    return r.NOMBRE_CLIENTE ?? r.nombre_cliente ?? r.NOMBRE_TERCERO ?? r.nombre_tercero ?? r.nombre ?? r.NOMBRE_USUARIO ?? '';
  }

  function displayClientContact(r: any) {
    return r.CONTACTO_TERCERO ?? r.contacto_tercero ?? r.contacto ?? r.CONTACTO ?? '';
  }

  const visibleRows = rows.filter(r => {
    if (!filterName) return true;
    const name = String(displayClientName(r)).toLowerCase();
    return name.includes(filterName.trim().toLowerCase());
  });

  return (
    <section
      className="p-6 relative"
      style={{
        backgroundImage: `url(${reservasBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
      }}
    >
      <div className="absolute inset-0 bg-black opacity-30" aria-hidden />
      <div className="relative z-10">

      <div className="w-full max-w-6xl mx-auto mb-0">
        <div className="bg-emerald-700 text-white rounded-t-lg p-4 shadow-md">
          <h2 className="text-2xl font-bold mb-2">Reservas (Administración)</h2>
          <div className="mb-0 flex flex-col sm:flex-row gap-2 items-center">
            <label className="text-sm text-white mr-2">Filtrar por nombre:</label>
            <input
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Escribe el nombre del cliente..."
              className="px-3 py-1 rounded w-full sm:w-64 text-zinc-900 bg-white placeholder:text-gray-500 border border-gray-200 shadow-sm"
            />
            <button
              onClick={() => setFilterName('')}
              className="text-sm text-white hover:underline ml-2"
            >Limpiar</button>
            <div className="text-sm text-white ml-4">Mostrando {visibleRows.length} de {rows.length} reservas programadas</div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="fixed right-6 bottom-6 z-50 max-w-sm w-full">
          <div className="flex items-start space-x-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3 shadow-lg">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 text-emerald-800">{successMsg}</div>
            <button className="text-emerald-600 hover:opacity-80" onClick={() => setSuccessMsg(null)} aria-label="Cerrar">✕</button>
          </div>
        </div>
      )}

      {loading && <p>Cargando…</p>}
      {err && <div className="rounded bg-red-50 p-3 text-red-700 mb-3">{err}</div>}
      {errorToast && (
        <div className="fixed right-6 bottom-6 z-50 max-w-sm w-full">
          <div className="flex items-start space-x-3 rounded-lg bg-red-50 border border-red-200 p-3 shadow-lg">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1 text-red-800">{errorToast}</div>
            <button className="text-red-600 hover:opacity-80" onClick={() => setErrorToast(null)} aria-label="Cerrar">✕</button>
          </div>
        </div>
      )}

      {!loading && !err && (
        visibleRows.length === 0 ? (
          <div className="rounded-md bg-yellow-50 p-4 text-yellow-800 text-center">No hay reservas programadas que coincidan</div>
        ) : (
          <div className="w-full max-w-6xl mx-auto mt-0">
            <div className="overflow-auto rounded-b-lg shadow">
              <table className="min-w-full bg-white">
              <thead>
                <tr className="text-left bg-emerald-700 text-white">
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Cancha</th>
                  <th className="px-4 py-2">Nombre cliente</th>
                  <th className="px-4 py-2">Contacto</th>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Hora inicio</th>
                  <th className="px-4 py-2">Hora fin</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r: any, i: number) => (
                  <tr key={i} className="even:bg-gray-50">
                    <td className="px-4 py-2">{r.id_reserva ?? r.ID_RESERVA}</td>
                    <td className="px-4 py-2">{r.NOMBRE_CANCHA ?? r.nombre_cancha ?? r.nombre}</td>
                    <td className="px-4 py-2">{displayClientName(r)}</td>
                    <td className="px-4 py-2">{displayClientContact(r)}</td>
                    <td className="px-4 py-2">{fmtDate(r.fecha_reserva ?? r.FECHA_RESERVA)}</td>
                    <td className="px-4 py-2">{fmtTime(r.inicio_ts ?? r.INICIO_TS ?? r.HORA_INICIO ?? r.hora_inicio)}</td>
                    <td className="px-4 py-2">{fmtTime(r.fin_ts ?? r.FIN_TS ?? r.HORA_FIN ?? r.hora_fin)}</td>
                    <td className="px-4 py-2">{String(r.estado ?? r.ESTADO ?? '').toUpperCase()}</td>
                    <td className="px-4 py-2">
                      {(String(r.estado ?? r.ESTADO ?? '').toLowerCase() === 'programada') && (
                        <button className="text-emerald-700 hover:underline" onClick={() => handleCancel(r)}>Cancelar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        )
      )}

      </div>

      {confirmTarget !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => { if(!busyCancel) setConfirmTarget(null); }} />
          <div className="relative z-50 max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Confirmar cancelación</h3>
            <p className="text-sm text-gray-600 mb-4">¿Desea cancelar esta reserva? Esta acción no puede ser revertida.</p>
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 rounded bg-gray-100 text-gray-700" onClick={() => setConfirmTarget(null)} disabled={busyCancel}>Volver</button>
              <button className="px-4 py-2 rounded bg-emerald-600 text-white hover:opacity-95" onClick={confirmCancel} disabled={busyCancel}>
                {busyCancel ? 'Cancelando…' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
