import { Link } from "react-router-dom";
import fondo from "../assets/principal.png"; // ⬅️ reemplaza por tu imagen (ej. principal_admin.png)

export default function Principal() {
  return (
    <section className="relative min-h-[calc(100vh-72px)] w-full">
      {/* Fondo */}
      <img
        src={fondo}
        alt="Centro Deportivo Los Robles"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Vignette/oscurecido para contraste */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Contenido */}
      <div className="relative z-[1] mx-auto w-full max-w-[1200px] px-6 py-8 md:py-12">
        {/* Breadcrumb (opcional) */}
        <div className="mb-6" />

        {/* Hero Title */}
        <div className="mt-8 md:mt-12">
          <h1
            className="
              text-center text-white font-extrabold italic tracking-wide drop-shadow-md
              text-4xl leading-tight
              sm:text-5xl md:text-6xl
            "
          >
            <span className="block">CENTRO DEPORTIVO</span>
            <span className="block mt-1">LOS ROBLES</span>
          </h1>
        </div>

        {/* (Acciones rápidas eliminadas según UI) */}
      </div>
    </section>
  );
}
