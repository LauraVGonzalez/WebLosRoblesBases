import fondo from "../assets/hero.png";

export default function CrearCuenta() {
  return (
    <section className="relative min-h-[calc(100vh-72px)] w-full">
      <img src={fondo} alt="" className="absolute inset-0 h-full w-full object-cover blur-sm scale-105" />
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-[1] mx-auto w-full max-w-[900px] p-6">
        <div className="mx-auto mt-10 rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="text-center text-xl font-bold tracking-wide text-zinc-800">
            CREA TU CUENTA
          </h2>
          <div className="mt-1 h-1 w-20 mx-auto bg-emerald-600 rounded-full" />

          <form className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombres y apellidos */}
            <div>
              <label className="text-xs font-semibold text-zinc-600">PRIMER NOMBRE *</label>
              <input className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="FirstName" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600">SEGUNDO NOMBRE</label>
              <input className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="SecondName" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600">PRIMER APELLIDO *</label>
              <input className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="FirstLastName" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600">SEGUNDO APELLIDO</label>
              <input className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="SecondLastName" />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-zinc-600">CORREO ELECTRÓNICO *</label>
              <input className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="example@mail.com" />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-600">NÚMERO TELEFÓNICO *</label>
              <input className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="3000000000" />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-600">CONTRASEÑA *</label>
              <input type="password" className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="********" />
              <p className="text-[11px] text-zinc-500 mt-1">8+ characters</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-600">CONFIRMAR CONTRASEÑA *</label>
              <input type="password" className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="********" />
              <p className="text-[11px] text-zinc-500 mt-1">8+ characters</p>
            </div>

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
