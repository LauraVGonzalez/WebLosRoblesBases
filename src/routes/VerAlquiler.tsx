import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import fondo from '../assets/implementos.jpg';

export default function VerAlquiler() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const r = await api.get<any>(`/alquila/${id}`);
        if (!mounted) return;
        setRow(r);
        setErr(null);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message ?? 'Error cargando alquiler');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  function handleDevolver() {
    if (!row) return;
    // open custom confirmation modal instead of native confirm()
    setConfirmOpen(true);
  }

  async function confirmDevolver() {
    if (!row) return;
    setProcessing(true);
    try {
      await api.post(`/alquila/${id}/devolver`, {});
      setConfirmOpen(false);
      setSuccessMsg('Devolución registrada correctamente.');
      setTimeout(() => {
        navigate('/PrincipalAdmin/Implementos');
      }, 1400);
    } catch (e: any) {
      setErr(e?.message ?? 'Error al devolver');
    } finally {
      setProcessing(false);
    }
  }

  function formatDate(value: any) {
    if (!value) return '';
    try {
      const d = new Date(String(value));
      if (isNaN(d.getTime())) return '';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return '';
    }
  }

  return (
    <section
      className="min-h-screen w-full flex flex-col items-center justify-start pt-10"
      style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        backgroundColor: '#07372a',
      }}
    >
      <h2 className="text-2xl font-bold mb-4 text-white">Devolución de Alquiler</h2>
      {loading && <p>Cargando…</p>}
      {err && <div className="rounded bg-red-50 p-3 text-red-700">{err}</div>}
      {successMsg && (
        <div className="w-full flex justify-center">
          <div className="mt-4 rounded-lg bg-emerald-600/90 text-white px-6 py-4 shadow-lg max-w-xl">
            <div className="flex items-center gap-3">
              <div className="text-2xl">✅</div>
              <div className="font-medium">{successMsg}</div>
            </div>
          </div>
        </div>
      )}
      {row && (
        <div className="max-w-xl bg-white/95 rounded shadow p-4">
          <p><strong>ID:</strong> {row.ID_PRESTAMO}</p>
          <p><strong>Cliente:</strong> {row.NOMBRE_CLIENTE}</p>
          <p><strong>Implemento:</strong> {row.TIPO_IMPLEMENTO}</p>
          <p><strong>Cantidad prestada:</strong> {row.CANTIDAD_PRESTADA}</p>
          <p><strong>Fecha préstamo:</strong> {row.FECHA_PRESTAMO ? formatDate(row.FECHA_PRESTAMO) : ''}</p>
          <p><strong>Fecha devolución:</strong> {row.FECHA_DEVOLUCION ? formatDate(row.FECHA_DEVOLUCION) : '—'}</p>

            {!row.FECHA_DEVOLUCION && row && (
              <div className="mt-4">
                <button
                  disabled={processing}
                  onClick={handleDevolver}
                  className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {processing ? 'Procesando…' : 'Confirmar devolución'}
                </button>
              </div>
            )}
        </div>
      )}
        {/* Confirmation modal (custom) */}
        {confirmOpen && row && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => !processing && setConfirmOpen(false)} />
            <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-2">Confirmar devolución</h3>
              <p className="text-sm text-gray-700 mb-4">¿Confirmar devolución de <strong>{row.CANTIDAD_PRESTADA ?? 0}</strong> unidad(es)?</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={processing}
                  className="px-4 py-2 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
                >Cancelar</button>
                <button
                  onClick={confirmDevolver}
                  disabled={processing}
                  className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                >{processing ? 'Procesando…' : 'Aceptar'}</button>
              </div>
            </div>
          </div>
        )}
    </section>
  );
}
