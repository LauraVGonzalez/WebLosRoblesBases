
import { useEffect, useState } from 'react';
import { reservasSvc } from '../services/reservas';
import { api } from '../api/client';
import reservasBg from '../assets/reservas.jpg';

export default function Reservas() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busyCancel, setBusyCancel] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      await loadRows();
    })();
    return () => {};
  }, []);

  // Extracted loader so we can refresh after actions
  async function loadRows() {
    try {
      setLoading(true);
      // try to get id_cliente from localStorage or resolve via profile
      let id_cliente = Number(localStorage.getItem('id_cliente') || 0);
      if (!id_cliente) {
        const correo = localStorage.getItem('usuario_correo') || '';
        if (correo) {
          try {
            const perfil = await api.get<any>(`/usuarios/perfil?correo=${encodeURIComponent(correo)}`);
            id_cliente = Number(perfil?.id_cliente ?? perfil?.ID_CLIENTE ?? 0);
            if (id_cliente) localStorage.setItem('id_cliente', String(id_cliente));
          } catch (e) {
            // ignore
          }
        }
      }

      const r = await reservasSvc.list(id_cliente ? { id_cliente } : undefined);
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

  async function handleCancel(id: number) {
    // open in-page confirmation modal
    setConfirmId(id);
  }

  async function confirmCancel() {
    if (!confirmId) return;
    const id = confirmId;
    setBusyCancel(true);
    try {
      await reservasSvc.cancel(id);
      // refresh list to ensure consistency
      await loadRows();
      setErr(null);
      setSuccessMsg('Reserva cancelada correctamente');
      setConfirmId(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      let msg = e?.message ?? 'Error cancelando';
      try {
        const p = JSON.parse(msg);
        if (p && p.error) msg = String(p.error);
      } catch (_) {}
      setErr(null);
      setErrorToast(msg);
      // If server indicates the reservation was already cancelled, refresh list
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
          <h2 className="text-2xl font-bold mb-2">Mis Reservas</h2>
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

      {loading && <p className="text-white">Cargando…</p>}
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
        rows.length === 0 ? (
          <div className="w-full max-w-6xl mx-auto mt-4">
            <div className="rounded-md bg-yellow-50 p-4 text-yellow-800 text-center">No tiene reservas programadas</div>
          </div>
        ) : (
          <div className="w-full max-w-6xl mx-auto mt-0">
            <div className="overflow-auto rounded-b-lg shadow">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="text-left bg-emerald-700 text-white">
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Cancha</th>
                    <th className="px-4 py-2">Fecha</th>
                    <th className="px-4 py-2">Hora inicio</th>
                    <th className="px-4 py-2">Hora fin</th>
                    <th className="px-4 py-2">Estado</th>
                    <th className="px-4 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any, i: number) => (
                    <tr key={i} className="even:bg-gray-50">
                      <td className="px-4 py-2">{r.id_reserva ?? r.ID_RESERVA}</td>
                      <td className="px-4 py-2">{r.NOMBRE_CANCHA ?? r.nombre_cancha ?? r.nombre}</td>
                      <td className="px-4 py-2">{fmtDate(r.fecha_reserva ?? r.FECHA_RESERVA)}</td>
                      <td className="px-4 py-2">{fmtTime(r.inicio_ts ?? r.INICIO_TS)}</td>
                      <td className="px-4 py-2">{fmtTime(r.fin_ts ?? r.FIN_TS)}</td>
                      <td className="px-4 py-2">{String(r.estado ?? r.ESTADO ?? '').toUpperCase()}</td>
                      <td className="px-4 py-2">
                        {(String(r.estado ?? r.ESTADO ?? '').toLowerCase() === 'programada') && (
                          <button className="text-emerald-700 hover:underline" onClick={() => handleCancel(r.id_reserva ?? r.ID_RESERVA)}>Cancelar</button>
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

      {confirmId !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => { if(!busyCancel) setConfirmId(null); }} />
          <div className="relative z-50 max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Confirmar cancelación</h3>
            <p className="text-sm text-gray-600 mb-4">¿Desea cancelar esta reserva? Esta acción no puede ser revertida.</p>
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 rounded bg-gray-100 text-gray-700" onClick={() => setConfirmId(null)} disabled={busyCancel}>Volver</button>
              <button className="px-4 py-2 rounded bg-emerald-600 text-white hover:opacity-95" onClick={confirmCancel} disabled={busyCancel}>
                {busyCancel ? 'Cancelando…' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </section>
  );
}
