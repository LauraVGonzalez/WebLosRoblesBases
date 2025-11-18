import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Link } from 'react-router-dom';
import fondo from '../assets/implementos.jpg';

export default function AdminImplementos() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const r = await api.get<any[]>('/alquila');
        if (!mounted) return;
        setRows(r || []);
        setErr(null);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message ?? 'Error cargando historial');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

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
      className="p-6"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${fondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
      }}
    >
      <div className="w-full max-w-6xl mx-auto mb-0">
        <div className="bg-emerald-700 text-white rounded-t-lg p-4 shadow-md">
          <h2 className="text-2xl font-bold mb-2">Historial de Alquileres (Implementos)</h2>
          <div className="mb-0 flex flex-col sm:flex-row gap-2 items-center">
            <label className="text-sm text-white mr-2">Filtrar por nombre:</label>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Escribe el nombre del cliente..."
              className="px-3 py-1 rounded w-full sm:w-64 text-zinc-900 bg-white placeholder:text-gray-500 border border-gray-200 shadow-sm"
            />
            <button
              onClick={() => setFilter('')}
              className="text-sm text-white hover:underline ml-2"
            >Limpiar</button>
          </div>
        </div>
      </div>
      {loading && <p>Cargando…</p>}
      {err && <div className="rounded bg-red-50 p-3 text-red-700">{err}</div>}
      {!loading && !err && (
        <div className="w-full max-w-6xl mx-auto mt-0">
          <div className="overflow-auto rounded-b-lg shadow">
            <table className="min-w-full bg-white">
            <thead>
              <tr className="text-left bg-emerald-700 text-white">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Implemento</th>
                <th className="px-4 py-2">Cantidad</th>
                <th className="px-4 py-2">Fecha préstamo</th>
                <th className="px-4 py-2">Fecha devolución</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
              <tbody>
              {rows
                .filter(r => {
                  if (!filter) return true;
                  try {
                    return String(r.NOMBRE_CLIENTE || '').toLowerCase().includes(filter.toLowerCase());
                  } catch {
                    return true;
                  }
                })
                .map((r, i) => (
                <tr key={i} className="even:bg-gray-50">
                  <td className="px-4 py-2">{r.ID_PRESTAMO}</td>
                  <td className="px-4 py-2">{r.NOMBRE_CLIENTE}</td>
                  <td className="px-4 py-2">{r.TIPO_IMPLEMENTO}</td>
                  <td className="px-4 py-2">{r.CANTIDAD_PRESTADA}</td>
                  <td className="px-4 py-2">{formatDate(r.FECHA_PRESTAMO)}</td>
                  <td className="px-4 py-2">{formatDate(r.FECHA_DEVOLUCION)}</td>
                  <td className="px-4 py-2">
                    {!r.FECHA_DEVOLUCION ? (
                      <Link to={`/PrincipalAdmin/Implementos/Devolucion/${r.ID_PRESTAMO}`} className="text-emerald-700 hover:underline">Devolver</Link>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </section>
  );
}
