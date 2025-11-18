// Centraliza recursos configurables de la app.
// Permite sobreescribir la imagen de fondo mediante la variable de entorno VITE_IMPLEMENTOS_BG
const defaultFondo = (import.meta as any).env?.BASE_URL ? undefined : undefined;
// Importar el asset por defecto solo si existe (Vite resolverá la ruta).
let fondoDefault: string | undefined;
try {
  // la import puede fallar en contextos no-Vite, por eso lo ponemos en try
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  fondoDefault = require('./assets/implementos.jpg');
} catch {
  fondoDefault = undefined;
}

export const IMPLEMENTOS_BG = ((): string | undefined => {
  const env = (import.meta as any).env || {};
  if (env.VITE_IMPLEMENTOS_BG) return env.VITE_IMPLEMENTOS_BG;
  return fondoDefault;
})();

export default {
  IMPLEMENTOS_BG,
};
