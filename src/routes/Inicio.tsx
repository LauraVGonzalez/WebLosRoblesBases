import hero from "../assets/pantalla_inicial.png";
import { NavLink } from "react-router-dom";

export default function Principal() {
  return (
    <section className="relative h-[calc(100vh-72px)] w-full"> {/* 100vh menos el header */}
      <img src={hero} alt="Cancha" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/25" />

      <div className="relative z-[1] h-full w-full grid place-items-center">
        <h1 className="text-white text-5xl md:text-6xl lg:text-7xl font-extrabold italic tracking-[0.12em] text-center drop-shadow">
          RESERVA TU CANCHA
        </h1>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-6">
          <NavLink
            to="/Inicio/IniciarSesion"
            className="rounded-full bg-black/85 px-6 py-2 text-xs font-extrabold tracking-widest text-white shadow-md hover:bg-black transition"
          >
            INICIAR SESIÓN
          </NavLink>
          <NavLink
            to="/Inicio/CrearCuenta"
            className="rounded-full bg-white/90 px-6 py-2 text-xs font-extrabold tracking-widest text-zinc-900 shadow-md hover:bg-white transition"
          >
            CREAR CUENTA
          </NavLink>
        </div>
      </div>
    </section>
  );
}
