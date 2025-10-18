import { NavLink, Outlet, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

function Breadcrumbs() {
  const { pathname } = useLocation();        // ej: /Principal/Inicio
  const parts = pathname.replace(/^\/+/, "").split("/").filter(Boolean); // ["Principal","Inicio"]

  return (
    <div className="font-semibold text-[#609E46] text-xs sm:text-sm">
      <NavLink to="/Principal" className="font-semibold text-[#609E46]">HOME</NavLink>
      {parts.slice(1).map((seg, i) => (
        <span key={i}> {" > "} {seg.toUpperCase()} </span>
      ))}
    </div>
  );
}

export default function RootLayout() {
  return (
    <div className="min-h-screen w-full bg-black">
      {/* Header verde */}
      <header className="relative z-50 w-full shadow-lg" 
        style={{
              background: "linear-gradient(to right, #f4faf6 40%, #b2d5c3 60%, #006d46 100%)",
        }}
>

        <div className="mx-auto flex items-center justify-between gap-8 px-10 py-4 max-w-7x1">
          <div className="flex items-center gap-6">
            {/* LOGO más grande */}
            <img
              src={logo}
              alt="Logo Los Robles"
              className="h-20 w-20 object-contain select-none"
            />

            <div className="leading-tight text-center">
              {/* CENTRO DEPORTIVO */}
              <div className="text-base font-[750]" style={{ color: "#245d3c" }}>
                CENTRO DEPORTIVO
              </div>

              {/* LOS ROBLES */}
              <div className="text-base font-[750] -mt-1 tracking-tight" style={{ color: "#245d3c" }}>
                LOS ROBLES
              </div>

              {/* Breadcrumbs */}
              <Breadcrumbs />
            </div>

                 
          </div>

          {/* Enlace HOME a la derecha */}
          <NavLink
            to="/Principal"
            className="text-white font-semibold text-sm tracking-wide hover:text-emerald-700 transition"
          >
            HOME
          </NavLink>
        </div>
      </header>


      {/* Aquí renderizan las páginas */}
      <Outlet />
    </div>
  );
}
