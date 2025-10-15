import { NavLink, Outlet, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

function Breadcrumbs() {
  const { pathname } = useLocation();        // ej: /Principal/Inicio
  const parts = pathname.replace(/^\/+/, "").split("/").filter(Boolean); // ["Principal","Inicio"]

  return (
    <div className="text-emerald-200 text-xs sm:text-sm">
      <NavLink to="/Principal" className="font-semibold">HOME</NavLink>
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
      <header className="w-full bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-500">
        <div className="mx-auto flex items-center justify-between gap-4 px-4 py-3 max-w-6xl">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Logo" className="h-12 w-12 object-contain" />
            <div className="leading-tight text-white">
              <div className="text-sm font-semibold">CENTRO DEPORTIVO</div>
              <div className="text-xl font-extrabold -mt-0.5">LOS ROBLES</div>
              <Breadcrumbs />
            </div>
          </div>
          <NavLink to="/Principal" className="text-white font-semibold">
            HOME
          </NavLink>
        </div>
      </header>

      {/* Aquí renderizan las páginas */}
      <Outlet />
    </div>
  );
}
