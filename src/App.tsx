import logo from "./assets/logo.png";
import hero from "./assets/hero.png";

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-50 p-3">
      {/* Etiqueta superior */}
      <div className="text-sky-700 font-semibold tracking-wide text-sm mb-2">
        PANTALLA INICIAL
      </div>

      {/* Contenedor con borde azul */}
      <div className="border-4 border-sky-500 rounded-sm overflow-hidden">
        {/* Header */}
        <header className="w-full bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-500">
          <div className="mx-auto flex items-center gap-4 px-4 py-3">
            <img
              src={logo}
              alt="Logo Los Robles"
              className="h-10 w-10 object-contain select-none"
            />

            <div className="flex flex-col leading-tight text-zinc-100">
              <span className="text-sm font-semibold">CENTRO DEPORTIVO</span>
              <span className="text-lg font-extrabold -mt-0.5">
                LOS ROBLES
              </span>
              <span className="text-xs font-semibold text-emerald-200 mt-0.5">
                HOME
              </span>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative aspect-[16/11] w-full">
          {/* Imagen de fondo */}
          <img
            src={hero}
            alt="Cancha de fútbol"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Suave oscurecido para legibilidad */}
          <div className="absolute inset-0 bg-black/25" />

          {/* Título centrado */}
          <div className="relative z-[1] h-full w-full grid place-items-center">
            <h1 className="text-white text-5xl md:text-6xl lg:text-7xl font-extrabold italic tracking-[0.12em] text-center drop-shadow-md">
              RESERVA TU CANCHA
            </h1>
          </div>

          {/* Botones inferior-centrados (ligeramente a la derecha como en la imagen) */}
          <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 md:gap-8">
            <button
              className="pointer-events-auto rounded-full bg-black/85 px-6 py-2 text-xs font-extrabold tracking-widest text-white shadow-md hover:bg-black transition"
              aria-label="Iniciar sesión"
            >
              INICIAR SESION
            </button>

            <button
              className="pointer-events-auto rounded-full bg-white/90 px-6 py-2 text-xs font-extrabold tracking-widest text-zinc-900 shadow-md hover:bg-white transition"
              aria-label="Crear cuenta"
            >
              CREAR CUENTA
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
