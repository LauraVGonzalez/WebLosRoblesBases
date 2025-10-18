import fondo from "../assets/iniciar_sesion.png";

export default function Inicio() {
  return (
    <section className="relative min-h-[calc(100vh-72px)] w-full">
      <img src={fondo} alt="" className="absolute inset-0 h-full w-full object-cover scale-105" />

      <div className="relative z-[1] mx-auto w-full max-w-[640px] p-6">
        <div className="mx-auto mt-10 rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="text-center text-xl font-bold tracking-wide text-zinc-800">
            INICIAR SESIÓN
          </h2>
          <div className="mt-1 h-1 w-20 mx-auto bg-emerald-600 rounded-full" />

          <form className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-600">CORREO ELECTRÓNICO</label>
              <input className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="example@mail.com" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600">CONTRASEÑA *</label>
              <input type="password" className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="********" />
              <p className="text-[11px] text-zinc-500 mt-1">8+ characters</p>
            </div>

            <button className="mt-2 w-full rounded-full bg-emerald-600 py-2 text-white font-bold tracking-wide hover:bg-emerald-700">
              INICIAR SESIÓN
            </button>

            <div className="text-center">
              <a className="text-xs text-sky-600 hover:underline" href="#">¿Has olvidado tu contraseña?</a>
            </div>

            <p className="text-[10px] text-center text-zinc-500">
              By continuing I agree with the <a className="underline">Terms & Conditions</a>. <a className="underline">Privacy Policy</a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
