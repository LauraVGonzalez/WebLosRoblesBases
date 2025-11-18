import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import implementosSvc from "../services/implementos";
import alquilaSvc from "../services/alquila";
import fondo from "../assets/implementos.jpg";

// Cargar imágenes locales de implementos (si las hay)
const _mods = (import.meta as any).glob('../assets/implementos/*.{png,jpg,jpeg,svg}', { eager: true });
const imagesList: string[] = Object.values(_mods).map((m: any) => (m && m.default) ? m.default : m) as string[];

const pickImageFor = (id: any) => {
  if (!imagesList || imagesList.length === 0) return null;
  const s = String(id ?? Math.random());
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % imagesList.length;
  return imagesList[idx];
};

export default function VerImplemento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await implementosSvc.get(Number(id));
        if (!mounted) return;
        setItem(data as any);
        setErr(null);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message ?? "Error cargando implemento");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleRent = async () => {
    try {
      setSubmitting(true);
      const id_usuario = Number(localStorage.getItem('id_usuario') || 0);
      if (!id_usuario) throw new Error('Debes iniciar sesión para alquilar');
      await alquilaSvc.rent({ id_usuario, id_implemento: Number(id), cantidad });
      setShowSuccess(true);
    } catch (e: any) {
      alert(e?.message ?? 'Error al registrar alquiler');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-white">Cargando…</p>;
  if (err) return <p className="rounded bg-red-50 px-3 py-2 text-red-700">{err}</p>;
  if (!item) return <p className="text-white">Implemento no encontrado</p>;

  const max = Math.max(0, Number(item.CANTIDAD || 0));

  return (
    <section
      className="min-h-screen p-6 md:p-12"
      style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${fondo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '100vh',
        }}
    >
      {/* Success modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center">
            <span className="mb-4">
              <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="45" stroke="#22c55e" strokeWidth="4" fill="none" />
                <polyline points="30,55 47,72 72,38" fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 className="text-2xl font-bold text-zinc-700 mb-2 text-center">Alquiler registrado</h2>
            <p className="text-zinc-500 mb-6 text-center">Se registró correctamente tu solicitud de alquiler.</p>
            <div className="flex gap-3">
              <button
                className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg px-5 py-2 shadow"
                onClick={() => { setShowSuccess(false); navigate(-1); }}
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-emerald-800/80 to-emerald-700/70 rounded-xl shadow-xl overflow-hidden bg-opacity-30">
          <div className="p-6 md:p-8 text-white flex flex-col md:flex-row items-center gap-6">
            {/* Left: image / placeholder */}
            <div className="flex-shrink-0 w-40 h-40 md:w-52 md:h-52 rounded-full bg-white p-4 shadow-inner flex items-center justify-center text-4xl font-bold text-emerald-800 ring-2 ring-white/20 overflow-hidden">
              {(() => {
                const img = pickImageFor(item.ID_IMPLEMENTO ?? id);
                if (img) return (
                  <img
                    src={img}
                    alt={String(item.TIPO_IMPLEMENTO || '')}
                    className="max-w-full max-h-full rounded-full object-cover"
                    style={{ width: '100%', height: '100%', objectPosition: 'center' }}
                  />
                );
                return String(item.TIPO_IMPLEMENTO || '').charAt(0).toUpperCase();
              })()}
            </div>

            {/* Right: details */}
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{item.TIPO_IMPLEMENTO}</h2>
              <p className="text-sm text-white/90 mb-4">Estado: <span className="font-semibold">{String(item.ESTADO || '').toUpperCase()}</span></p>
              <p className="text-sm text-white/90 mb-6">Disponibles: <span className="font-semibold">{max}</span></p>

              <div className="mb-6">
                <label className="block text-sm mb-2">Cantidad a alquilar</label>
                <div className="inline-flex items-center bg-white/10 rounded-lg p-1">
                  <button
                    className="px-3 py-1 text-white/90 disabled:opacity-40"
                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    disabled={cantidad <= 1 || submitting}
                  >−</button>
                  <input
                    className="w-16 text-center bg-transparent outline-none text-white font-semibold"
                    type="number"
                    min={1}
                    max={max}
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.min(max, Math.max(1, Number(e.target.value || 1))))}
                  />
                  <button
                    className="px-3 py-1 text-white/90 disabled:opacity-40"
                    onClick={() => setCantidad((c) => Math.min(max, c + 1))}
                    disabled={cantidad >= max || submitting}
                  >+</button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold"
                  onClick={handleRent}
                  disabled={submitting || max <= 0}
                >{submitting ? 'Enviando…' : 'Alquilar'}</button>

                <button
                  className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => navigate(-1)}
                >Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
