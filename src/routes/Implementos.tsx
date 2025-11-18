import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import implementosSvc from "../services/implementos";
import type { Implemento } from "../services/implementos";
import fondo from "../assets/implementos.jpg";

// Cargar todas las imágenes que el usuario pueda colocar en
// `src/assets/implementos/*` usando Vite glob. Probamos primero
// con un patrón absoluto (más robusto para Vite) y luego con el
// relativo como fallback. Si no hay imágenes disponibles, `images`
// será vacío y se mostrará la letra inicial.
const images: string[] = (() => {
  try {
    // usar la API estándar de Vite; { eager: true } importa los módulos inmediatamente
    const mods = (import.meta as any).glob('../assets/implementos/*.{png,jpg,jpeg,svg}', { eager: true });
    return Object.values(mods).map((m: any) => (m && m.default) ? m.default : m) as string[];
  } catch (e) {
    return [];
  }
})();

// debug: mostrar cuántas imágenes cargó Vite
console.debug('[Implementos] imágenes cargadas:', images.length);
console.debug('[Implementos] fondo URL:', fondo);

const pickImageFor = (id: any) => {
  if (!images || images.length === 0) return null;
  const s = String(id ?? Math.random());
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % images.length;
  return images[idx];
};

export default function Implementos() {
  const [items, setItems] = useState<Implemento[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await implementosSvc.list();
        if (!mounted) return;
        setItems((data || []) as Implemento[]);
        setErr(null);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message ?? "Error cargando implementos");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // (removed background preload/debug) 

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
      {loading && <p className="text-white">Cargando…</p>}
      {err && <p className="rounded bg-red-50 px-3 py-2 text-red-700">{err}</p>}

      {/* Debug panel removed to clean UI (was showing image list and load status) */}

      {!loading && !err && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl mt-8">
          {items.map((imp) => {
                    const imgUrl = pickImageFor(imp.ID_IMPLEMENTO);
                    console.debug('[Implementos] img for', imp.ID_IMPLEMENTO, imgUrl);
            return (
              <Link
                key={imp.ID_IMPLEMENTO}
                to={`${(localStorage.getItem('usuario_correo') || '').includes('@losrobles.com') ? '/PrincipalAdmin' : '/Principal'}/Implementos/Ver/${imp.ID_IMPLEMENTO}`}
                className="group block focus:outline-none"
                style={{ textDecoration: 'none' }}
              >
                <article className="rounded-2xl bg-emerald-800/95 p-5 shadow-xl ring-1 ring-emerald-900/30 transition-transform duration-150 group-hover:scale-105 group-hover:shadow-2xl group-active:scale-100 cursor-pointer">
                  <div className="relative mb-3 text-white">
                    <div className="mb-4 text-center font-semibold text-white group-hover:underline">
                      {imp.TIPO_IMPLEMENTO ?? `Implemento ${imp.ID_IMPLEMENTO}`}
                    </div>
                  </div>
                  <div className="mx-auto mb-4 h-28 w-28 rounded-full bg-white p-4 shadow-inner flex items-center justify-center text-xl font-bold text-emerald-800 overflow-hidden">
                    {imgUrl ? (
                      <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      String(imp.TIPO_IMPLEMENTO || '').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="rounded-lg bg-white/10 p-4 text-sm text-white">
                    <p className="font-semibold">Cantidad: <span className="font-normal">{imp.CANTIDAD ?? 0}</span></p>
                    <p className="font-semibold">Estado: <span className="font-normal">{String(imp.ESTADO ?? '').toUpperCase()}</span></p>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && !err && items.length === 0 && (
        <p className="mt-8 rounded-xl bg-white/90 p-6 text-center">No hay implementos disponibles todavía.</p>
      )}
    </section>
  );
}
