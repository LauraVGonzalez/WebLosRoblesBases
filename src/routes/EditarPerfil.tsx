
import fondo from "../assets/crear_cuenta.png";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function EditarPerfil() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    correo: "",
    telefono: "",
    contrasena: "",
    confirmarContrasena: "",
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  // Estados ya declarados arriba, no volver a declarar

  // Cargar datos actuales del usuario al montar
  useEffect(() => {
    const correoUsuario = localStorage.getItem("usuario_correo") || "";
    if (!correoUsuario) return;
    api.get<any>(`/usuarios/perfil?correo=${encodeURIComponent(correoUsuario)}`)
      .then(res => {
        setForm(f => ({
          ...f,
          primerNombre: res.nombres?.split(" ")[0] || "",
          segundoNombre: res.nombres?.split(" ")[1] || "",
          primerApellido: res.apellidos?.split(" ")[0] || "",
          segundoApellido: res.apellidos?.split(" ")[1] || "",
          correo: res.correo || correoUsuario,
          telefono: res.telefono || "",
          contrasena: "",
          confirmarContrasena: ""
        }));
      })
      .catch(() => setError("No se pudo cargar la información actual"));
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const minPasswordLength = 8;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setShowErrors(true);
    // Validación por campo
    if (!form.primerNombre.trim() || !form.primerApellido.trim() || !form.correo.trim() || !form.telefono.trim()) {
      return;
    }
    // Validación simple de formato de correo: debe contener @
    if (form.correo.trim() && !form.correo.includes("@")) {
      setError("Correo inválido");
      return;
    }
    // Validación de teléfono: solo dígitos
    if (form.telefono.trim() && !/^[0-9]+$/.test(form.telefono.trim())) {
      setError("Número de teléfono inválido");
      return;
    }
    if (form.contrasena || form.confirmarContrasena) {
      if (form.contrasena.length > 0 && form.contrasena.length < minPasswordLength) {
        setError("La contraseña debe tener mínimo 8 caracteres");
        return;
      }
      if (form.confirmarContrasena.length > 0 && form.confirmarContrasena.length < minPasswordLength) {
        setError("La contraseña debe tener mínimo 8 caracteres");
        return;
      }
      if (form.contrasena !== form.confirmarContrasena) {
        setError("Las contraseñas no coinciden");
        return;
      }
    }
  // setLoading(true); // loading eliminado
    try {
      // Actualizar datos en la base
      const correoUsuario = localStorage.getItem("usuario_correo") || "";
      const payload: any = {
        primer_nombre: form.primerNombre,
        segundo_nombre: form.segundoNombre,
        primer_apellido: form.primerApellido,
        segundo_apellido: form.segundoApellido,
        correo: form.correo,
        telefono: form.telefono,
      };
      if (form.contrasena) {
        payload.password = form.contrasena;
      }
      const res: any = await api.put(`/usuarios/perfil?correo=${encodeURIComponent(correoUsuario)}`, payload);
      if (res.ok) {
        // Guardar target y mostrar modal de éxito (el usuario confirmará)
        const target = correoUsuario.includes("@losrobles.com") ? "/PrincipalAdmin" : "/Principal";
        setRedirectTarget(target);
        setSuccess(true);
      } else {
        setError(res.error || "No se pudo actualizar el perfil");
      }
    } catch (err: any) {
      setError(err.message || "Error de red");
    } finally {
      // setLoading(false); // loading eliminado
    }
  };

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
            EDITA TU PERFIL
          </h2>
          <div className="mt-1 h-1 w-20 mx-auto bg-emerald-600 rounded-full" />

          <p className="mt-5 mb-2 text-xs text-red-500 font-medium">
            * Campo requerido
          </p>

          {error && <p className="mb-2 text-xs text-red-600 font-semibold">{error}</p>}
          {success && <p className="mb-2 text-xs text-green-600 font-semibold">¡Perfil editado exitosamente!</p>}

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit} autoComplete="off">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                PRIMER NOMBRE *
              </span>
              <input
                name="primerNombre"
                value={form.primerNombre}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-400"
                placeholder="FirstName"
              />
              {showErrors && !form.primerNombre.trim() && (
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
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                SEGUNDO NOMBRE
              </span>
              <input
                name="segundoNombre"
                value={form.segundoNombre}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-400"
                placeholder="SecondName"
              />
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                PRIMER APELLIDO *
              </span>
              <input
                name="primerApellido"
                value={form.primerApellido}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-400"
                placeholder="FirstLastName"
              />
              {showErrors && !form.primerApellido.trim() && (
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
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                SEGUNDO APELLIDO
              </span>
              <input
                name="segundoApellido"
                value={form.segundoApellido}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-300 px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-400"
                placeholder="SecondLastName"
              />
            </div>
            <div className="relative md:col-span-2">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                CORREO ELECTRÓNICO *
              </span>
              <input
                name="correo"
                value={form.correo}
                onChange={handleChange}
                readOnly
                className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm text-zinc-500 outline-none focus:ring-2 placeholder:text-zinc-400 cursor-not-allowed ${form.correo.trim() && !form.correo.includes('@') ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-zinc-300 focus:ring-emerald-500 opacity-90'}`}
                placeholder="example@mail.com"
              />
              {/* X roja a la derecha si correo inválido */}
              {form.correo.trim() && !form.correo.includes('@') && (
                <svg className="absolute right-3 top-3 w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M6 6L18 18M6 18L18 6" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
                {showErrors && !form.correo.trim() && (
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
              {/* Mensaje de formato inválido si falta '@' */}
              {form.correo.trim() && !form.correo.includes('@') && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#DC3545" />
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                    </svg>
                  </span>
                  <span>Correo inválido</span>
                </div>
              )}
            </div>
            <div className="relative md:col-span-2 flex justify-center">
              <div className="relative w-full md:w-[350px]">
                <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                  NÚMERO TELEFÓNICO *
                </span>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  inputMode="numeric"
                  className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none focus:ring-2 placeholder:text-zinc-400 ${form.telefono.trim() && !/^[0-9]+$/.test(form.telefono.trim()) ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-zinc-300 focus:ring-emerald-500'}`}
                  placeholder="3000000000"
                />
                {/* X roja a la derecha si teléfono inválido */}
                {form.telefono.trim() && !/^[0-9]+$/.test(form.telefono.trim()) && (
                  <svg className="absolute right-3 top-3 w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M6 6L18 18M6 18L18 6" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {showErrors && !form.telefono.trim() && (
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
                {/* Mensaje de teléfono inválido */}
                {form.telefono.trim() && !/^[0-9]+$/.test(form.telefono.trim()) && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                    <span className="inline-flex items-center justify-center w-4 h-4">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#DC3545" />
                        <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                      </svg>
                    </span>
                    <span>Número de teléfono inválido</span>
                  </div>
                )}
              </div>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                CONTRASEÑA
              </span>
              <input
                name="contrasena"
                value={form.contrasena}
                onChange={handleChange}
                type={showPassword ? "text" : "password"}
                className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none pr-10 placeholder:text-zinc-400 ${form.contrasena.length > 0 && form.contrasena.length < minPasswordLength ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-zinc-300 focus:ring-2 focus:ring-emerald-500'}`}
                placeholder="********"
              />
              <span
                className="absolute right-3 top-7 cursor-pointer text-zinc-500"
                onClick={() => setShowPassword(v => !v)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
              {/* X roja para contraseña si corta */}
              {form.contrasena.length > 0 && form.contrasena.length < minPasswordLength && (
                <svg className="absolute right-10 top-7 w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M6 6L18 18M6 18L18 6" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <p className="text-[11px] text-zinc-500 mt-1">8+ characters</p>
              {/* Mensaje de conflicto de contraseñas solo se muestra debajo de 'CONFIRMAR CONTRASEÑA' */}
              {form.contrasena.length > 0 && form.contrasena.length < minPasswordLength && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#DC3545" />
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                    </svg>
                  </span>
                  <span>La contraseña debe tener mínimo 8 caracteres</span>
                </div>
              )}
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                CONFIRMAR CONTRASEÑA
              </span>
              <input
                name="confirmarContrasena"
                value={form.confirmarContrasena}
                onChange={handleChange}
                type={showConfirmPassword ? "text" : "password"}
                className={`w-full rounded-xl border px-3 pt-6 pb-2 text-sm outline-none pr-10 placeholder:text-zinc-400 ${form.confirmarContrasena.length > 0 && form.confirmarContrasena.length < minPasswordLength ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-zinc-300 focus:ring-2 focus:ring-emerald-500'}`}
                placeholder="********"
              />
              <span
                className="absolute right-3 top-7 cursor-pointer text-zinc-500"
                onClick={() => setShowConfirmPassword(v => !v)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
              <p className="text-[11px] text-zinc-500 mt-1">8+ characters</p>
              {form.confirmarContrasena && form.confirmarContrasena !== form.contrasena && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#DC3545" />
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                    </svg>
                  </span>
                  <span>Las contraseñas no coinciden</span>
                </div>
              )}
              {/* X roja para confirmar contraseña si no coincide */}
              {form.confirmarContrasena && form.confirmarContrasena !== form.contrasena && (
                <svg className="absolute right-10 top-7 w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M6 6L18 18M6 18L18 6" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div className="md:col-span-2 mt-2">
              <button
                className="w-full rounded-full bg-indigo-600 py-2 text-white font-bold tracking-wide hover:bg-indigo-700"
                disabled={form.contrasena.length > 0 && form.contrasena.length < minPasswordLength || form.confirmarContrasena.length > 0 && form.confirmarContrasena.length < minPasswordLength}
              >
                EDITAR PERFIL
              </button>
            </div>
          </form>
          {/* Modal de éxito */}
          {success && redirectTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <div className="relative z-10 w-[420px] rounded-xl bg-white p-8 text-center">
                <svg className="mx-auto mb-4 h-24 w-24 text-emerald-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17l-5-5" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="mb-2 text-xl font-semibold text-zinc-800">Actualización exitosa</h3>
                <p className="mb-6 text-sm text-zinc-500">Se actualizaron los datos diligenciados</p>
                <button
                  className="mx-auto rounded-md bg-emerald-600 px-6 py-2 text-white font-semibold hover:bg-emerald-700"
                  onClick={() => {
                    if (redirectTarget) navigate(redirectTarget);
                  }}
                >
                  Listo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
