import fondo from "../assets/crear_cuenta.png";

export default function CrearCuenta() {
  return (
    <section className="relative min-h-[calc(100vh-72px)] w-full">
      <img
        src={fondo}
        alt=""
        className="absolute inset-0 h-full w-full object-cover scale-105"
      />

      <div className="relative z-[1] mx-auto w-full max-w-[900px] p-6">
        <div className="mx-auto mt-10 rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="text-center text-xl font-bold tracking-wide text-zinc-800">
            CREA TU CUENTA
          </h2>
          <div className="mt-1 h-1 w-20 mx-auto bg-emerald-600 rounded-full" />

          {/* leyenda de requeridos */}
          <p className="mt-5 mb-2 text-xs text-red-500 font-medium">
            * Campo requerido
          </p>

          {/* Formulario */}
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PRIMER NOMBRE */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                PRIMER NOMBRE *
              </span>
              <input
                required
                className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="FirstName"
              />
            </div>

            {/* SEGUNDO NOMBRE */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                SEGUNDO NOMBRE
              </span>
              <input
                className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="SecondName"
              />
            </div>

            {/* PRIMER APELLIDO */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                PRIMER APELLIDO *
              </span>
              <input
                required
                className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="FirstLastName"
              />
            </div>

            {/* SEGUNDO APELLIDO */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                SEGUNDO APELLIDO
              </span>
              <input
                className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="SecondLastName"
              />
            </div>

            {/* CORREO (fila completa) */}
            <div className="relative md:col-span-2">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                CORREO ELECTRÓNICO *
              </span>
              <input
                type="email"
                required
                className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="example@mail.com"
              />
            </div>

            {/* TELÉFONO (más pequeño y centrado) */}
            <div className="relative md:col-span-2 flex justify-center">
              <div className="relative w-full md:w-[350px]">
                <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                  NÚMERO TELEFÓNICO *
                </span>
                <input
                  required
                  inputMode="numeric"
                  className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                  placeholder="3000000000"
                />
              </div>
            </div>

            {/* CONTRASEÑAS EN UNA MISMA FILA */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                CONTRASEÑA *
              </span>
              <input
                required
                type="password"
                className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="********"
              />
              <p className="text-[11px] text-zinc-500 mt-1">8+ characters</p>
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                CONFIRMAR CONTRASEÑA *
              </span>
              <input
                required
                type="password"
                className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="********"
              />
              <p className="text-[11px] text-zinc-500 mt-1">8+ characters</p>
            </div>

            {/* Botón */}
            <div className="md:col-span-2 mt-2">
              <button className="w-full rounded-full bg-indigo-600 py-2 text-white font-bold tracking-wide hover:bg-indigo-700">
                CREAR CUENTA
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
