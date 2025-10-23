
import fondo from "../assets/iniciar_sesion.png";
import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function InicioSesion() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [correoNoRegistrado, setCorreoNoRegistrado] = useState(false);
  const [usuariosRegistrados, setUsuariosRegistrados] = useState<string[]>([]);
  const [correoInvalido, setCorreoInvalido] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contrasenaIncorrecta, setContrasenaIncorrecta] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  // Obtener lista de correos registrados al montar el componente
  useEffect(() => {
    async function fetchUsuarios() {
      try {
        // Ajusta la ruta según tu backend, por ejemplo /usuarios/all o similar
  const res = await api.get("/usuarios");
        if (Array.isArray(res)) {
          setUsuariosRegistrados(res);
        }
      } catch {}
    }
    fetchUsuarios();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCorreoNoRegistrado(false);
    setContrasenaIncorrecta(false);
    setShowErrors(true);
    setLoading(true);
    if (!correo.trim() || !password.trim()) {
      setLoading(false);
      return;
    }
    if (!correo.includes("@")) {
      setLoading(false);
      return;
    }
    try {
      const res: { ok: boolean; id_usuario?: number; error?: string } = await api.post("/auth/login", { correo, password });
      if (res.ok) {
        setShowSuccess(true);
        localStorage.setItem("usuario_correo", correo);
        setTimeout(() => {
          setShowSuccess(false);
          if (correo.includes("@losrobles.com")) {
            navigate("/PrincipalAdmin");
          } else {
            navigate("/Principal");
          }
        }, 1800);
      } else {
        if (res.error) {
          const errorMsg = res.error.toLowerCase();
          // Si la lista de correos aún no se ha cargado, no mostrar error
          if (!usuariosRegistrados || usuariosRegistrados.length === 0) {
            setCorreoNoRegistrado(false);
            setContrasenaIncorrecta(false);
            return;
          }
          if (errorMsg.includes("credenciales inválidas")) {
            const correoNormalizado = correo.trim().toLowerCase();
            const existe = usuariosRegistrados.some(c => c.trim().toLowerCase() === correoNormalizado);
            if (!existe) {
              setCorreoNoRegistrado(true);
              setContrasenaIncorrecta(false);
            } else {
              setContrasenaIncorrecta(true);
              setCorreoNoRegistrado(false);
            }
            return;
          }
          if (errorMsg.includes("contraseña incorrecta")) {
            setContrasenaIncorrecta(true);
            setCorreoNoRegistrado(false);
            return;
          }
          setCorreoNoRegistrado(false);
          setContrasenaIncorrecta(false);
        } else {
          setCorreoNoRegistrado(false);
          setContrasenaIncorrecta(false);
        }
      }
    } catch (err: any) {
      let msg = err.message || "Error de red";
      try {
        const parsed = JSON.parse(msg);
        if (parsed.error) {
          const errorMsg = parsed.error.toLowerCase();
          if (errorMsg.includes("el correo electronico no se encuentra registrado")) {
            setCorreoNoRegistrado(true);
            setContrasenaIncorrecta(false);
          } else if (errorMsg.includes("contraseña incorrecta") || errorMsg.includes("credenciales inválidas")) {
            setContrasenaIncorrecta(true);
            setCorreoNoRegistrado(false);
          } else {
            setCorreoNoRegistrado(false);
            setContrasenaIncorrecta(false);
          }
        }
      } catch {}
      setError("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-[calc(100vh-72px)] w-full">
      {/* Modal de éxito */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-10 flex flex-col items-center animate-fade-in">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mb-4">
              <circle cx="32" cy="32" r="30" stroke="#10B981" strokeWidth="4" fill="#fff" />
              <polyline points="18,34 30,46 46,22" fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 className="text-xl font-semibold text-zinc-800 mb-2">Inicio de sesión exitosa</h3>
            <button className="mt-4 px-6 py-2 rounded-full bg-emerald-600 text-white font-bold" onClick={() => setShowSuccess(false)}>Listo</button>
          </div>
        </div>
      )}
      <img src={fondo} alt="" className="absolute inset-0 h-full w-full object-cover scale-105" />

      <div className="relative z-[1] mx-auto w-full max-w-[640px] p-6">
        <div className="mx-auto mt-10 rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="text-center text-xl font-bold tracking-wide text-zinc-800">
            INICIO SESIÓN
          </h2>
          <div className="mt-1 h-1 w-20 mx-auto bg-emerald-600 rounded-full" />

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} autoComplete="off">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                CORREO ELECTRÓNICO
              </span>
              <div className="relative">
                <input
                  className={`w-full rounded-md px-3 pt-6 pb-2 text-sm outline-none placeholder:text-zinc-400 border ${correoInvalido ? 'border-red-500 focus:ring-2 focus:ring-red-500' : (correo.trim() && !correoNoRegistrado ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500' : 'border-zinc-300 focus:ring-2 focus:ring-emerald-500')}`}
                  placeholder="example@mail.com"
                  value={correo}
                  onChange={e => {
                    setCorreo(e.target.value);
                    if (correoNoRegistrado) setCorreoNoRegistrado(false);
                    setCorreoInvalido(e.target.value.trim() !== "" && !e.target.value.includes("@"));
                  }}
                />
                {/* Icono de validación correo */}
                {(showErrors && !correo.trim()) || correoNoRegistrado || correoInvalido ? (
                  <span className="absolute right-3 top-7 text-red-500">
                    {/* X roja del prototipo */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <line x1="7" y1="7" x2="17" y2="17" stroke="#F44336" strokeWidth="2" strokeLinecap="round" />
                      <line x1="17" y1="7" x2="7" y2="17" stroke="#F44336" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                ) : null}
                {correo.trim() && !correoNoRegistrado && !correoInvalido && (
                  <span className="absolute right-3 top-7 text-green-500">
                    {/* Chulito verde del prototipo */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <polyline points="6,13 10,17 18,7" fill="none" stroke="#43A047" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </div>
              {/* Mensaje de correo no registrado */}
              {correoNoRegistrado && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#DC3545" />
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                    </svg>
                  </span>
                  <span>El correo electronico no se encuentra registrado.</span>
                </div>
              )}
              {/* Mensaje de campo obligatorio correo */}
              {showErrors && !correo.trim() && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#DC3545" />
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                    </svg>
                  </span>
                  <span>Este campo es obligatorio</span>
                </div>
              )}
              {/* Mensaje de correo invalido */}
              {correoInvalido && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#DC3545" />
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                    </svg>
                  </span>
                  <span>Correo invalido</span>
                </div>
              )}
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                CONTRASEÑA *
              </span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full rounded-md border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 pr-10 placeholder:text-zinc-400 ${(showErrors && !password.trim()) ? 'border-red-500 focus:ring-2 focus:ring-red-500' : (password.trim() ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500' : 'border-zinc-300 focus:ring-emerald-500')}`}
                  placeholder="********"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                {/* Icono de validación contraseña */}
                {(showErrors && !password.trim()) || contrasenaIncorrecta ? (
                  <span className="absolute right-10 top-7 text-red-500">
                    {/* X roja del prototipo */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <line x1="7" y1="7" x2="17" y2="17" stroke="#F44336" strokeWidth="2" strokeLinecap="round" />
                      <line x1="17" y1="7" x2="7" y2="17" stroke="#F44336" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                ) : null}
                {password.trim() && !contrasenaIncorrecta && !correoNoRegistrado && (
                  <span className="absolute right-10 top-7 text-green-500">
                    {/* Chulito verde del prototipo */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <polyline points="6,13 10,17 18,7" fill="none" stroke="#43A047" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                <span
                  className="absolute right-3 top-7 cursor-pointer text-zinc-500"
                  onClick={() => setShowPassword((v: boolean) => !v)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
                <p className="text-[11px] text-zinc-500 mt-1">8+ characters</p>
              </div>
              {/* Mensaje de campo obligatorio contraseña */}
              {showErrors && !password.trim() && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#DC3545" />
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                    </svg>
                  </span>
                  <span>Este campo es obligatorio</span>
                </div>
              )}
              {/* Mensaje de contraseña incorrecta */}
              {contrasenaIncorrecta && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#DC3545" />
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                    </svg>
                  </span>
                  <span>Contraseña incorrecta</span>
                </div>
              )}
            </div>

            {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

            <button
              className="mt-2 w-full rounded-full bg-emerald-600 py-2 text-white font-bold tracking-wide hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "INICIAR SESIÓN"}
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
