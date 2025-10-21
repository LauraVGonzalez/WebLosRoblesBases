import { NavLink, Outlet, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

function Breadcrumbs() {
  const { pathname } = useLocation();        // ej: /Inicio/IniciarSesion
  // Split path and remove numeric segments (IDs) so breadcrumbs show only labels
  const parts = pathname.replace(/^\/+/, "").split("/").filter(Boolean).filter(p => !/^\d+$/.test(p)); // ["Principal","Canchas","Editar"]

  // Map internal route segments to friendly labels
  const labelFor = (seg: string) => {
    const map: Record<string, string> = {
      Principal: "PRINCIPAL",
      PrincipalAdmin: "PRINCIPAL",
      Inicio: "INICIO",
      IniciarSesion: "INICIOSESION",
      Canchas: "CANCHAS",
      Crear: "CREAR",
      CrearCuenta: "CREARCUENTA",
      Ver: "VER",
    };
    return map[seg] ?? seg.toUpperCase();
  };
  // Decide which parts to display. Avoid repeating the root label.
  // If we're inside the Principal (admin) area, remove the 'Principal' segment
  // so breadcrumbs render like: PRINCIPAL > CANCHAS
  const isPrincipalPath = pathname.startsWith('/Principal');
  const displayParts = isPrincipalPath
    ? parts.slice(1)
    : parts[0] === 'Inicio'
    ? parts.slice(1)
    : parts;

  return (
    <div className="font-semibold text-[#609E46] text-xs sm:text-sm">
      {/* Special case: if path is exactly /Principal show single 'PRINCIPAL' */}
      {isPrincipalPath ? (
        // Show PRINCIPAL as the root for admin pages
        <>
          <NavLink to="/Principal" className="font-semibold text-[#609E46]">PRINCIPAL</NavLink>
          {displayParts.length > 0 && (
            displayParts.map((seg, i) => (
              <span key={i}>
                {' > '}
                {seg === 'Canchas' ? (
                  <NavLink to="/Principal/Canchas" className="font-semibold text-[#609E46]"> {labelFor(seg)} </NavLink>
                ) : (
                  <span> {labelFor(seg)} </span>
                )}
              </span>
            ))
          )}
        </>
      ) : parts.length === 1 && parts[0] === 'Principal' ? (
        <span className="font-semibold text-[#609E46]">PRINCIPAL</span>
      ) : (
        <>
          <NavLink to="/" className="font-semibold text-[#609E46]">INICIO</NavLink>
          {displayParts.length > 0 && (
            displayParts.map((seg, i) => (
              <span key={i}>
                {' > '}
                {seg === 'Canchas' ? (
                  <NavLink to="/Principal/Canchas" className="font-semibold text-[#609E46]"> {labelFor(seg)} </NavLink>
                ) : (
                  <span> {labelFor(seg)} </span>
                )}
              </span>
            ))
          )}
        </>
      )}
    </div>
  );
}

export default function RootLayout() {
  const { pathname } = useLocation();
  // Ocultar la navegación completa en las pantallas de login/crear-cuenta
  const hideFullNav = pathname.includes('/Inicio/IniciarSesion') || pathname.includes('/Inicio/CrearCuenta');
  // En la página principal pública no debe aparecer nada de navegación
  const hideAllNav = pathname === '/';

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

          {/* Navegación: oculta por completo en la página principal pública; solo HOME en login/crear-cuenta; completa en el resto */}
          {hideAllNav ? null : hideFullNav ? (
            <NavLink to="/" className="text-white font-semibold text-sm tracking-wide hover:text-emerald-700 transition">
              {/* show PRINCIPAL link when inside Principal section */}
              {pathname.startsWith('/Principal') ? 'PRINCIPAL' : 'INICIO'}
            </NavLink>
          ) : (
            <nav className="flex items-center gap-6">
              <NavLink to={pathname.startsWith('/Principal') ? '/Principal' : '/'} className="text-white font-semibold text-sm hover:text-emerald-700 transition">
                {pathname.startsWith('/Principal') ? 'PRINCIPAL' : 'INICIO'}
              </NavLink>
              <NavLink to="/Principal/Canchas" className="text-white font-semibold text-sm hover:text-emerald-700 transition">CANCHAS</NavLink>
              <NavLink to="/Principal/Canchas/Crear" className="text-white font-semibold text-sm hover:text-emerald-700 transition">CREAR CANCHA</NavLink>
              <NavLink to="/Principal/Reservas" className="text-white font-semibold text-sm hover:text-emerald-700 transition">RESERVAS</NavLink>
              <NavLink to="/Principal/ReservaYA" className="rounded-full bg-white/10 px-3 py-1 text-white font-semibold hover:bg-white/20">RESERVA YA!</NavLink>
            </nav>
          )}
        </div>
      </header>


      {/* Aquí renderizan las páginas */}
      <Outlet />
    </div>
  );
}
