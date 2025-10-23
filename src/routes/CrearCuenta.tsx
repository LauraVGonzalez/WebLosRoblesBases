import fondo from "../assets/crear_cuenta.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { usuariosSvc } from "../services/usuarios";

export default function CrearCuenta() {
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
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [showPasswordLengthError, setShowPasswordLengthError] = useState(false);
  const [showTelefonoError, setShowTelefonoError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showEmailError, setShowEmailError] = useState(false);
  const [showEmailRegisteredError, setShowEmailRegisteredError] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Validación visual de longitud de contraseña en tiempo real
    if (e.target.name === "contrasena") {
      setShowPasswordLengthError(e.target.value.length > 0 && e.target.value.length < 8);
    }
    const newForm = { ...form, [e.target.name]: e.target.value };
    setForm(newForm);
    // Mostrar error de contraseñas en tiempo real
    if (e.target.name === "confirmarContrasena" || e.target.name === "contrasena") {
      setShowPasswordError(
        Boolean(newForm.contrasena) && Boolean(newForm.confirmarContrasena) && newForm.contrasena !== newForm.confirmarContrasena
      );
    }
    // Validación visual de correo en tiempo real
    if (e.target.name === "correo") {
      setShowEmailError(
        newForm.correo.length > 0 && !newForm.correo.includes("@")
      );
      setShowEmailRegisteredError(false); // Oculta el error si el usuario cambia el correo
    }
    // Validación visual de teléfono en tiempo real
    if (e.target.name === "telefono") {
      setShowTelefonoError(
        newForm.telefono.length > 0 && !/^[0-9]+$/.test(newForm.telefono)
      );
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  setError(null);
  setSuccess(false);
  setShowErrors(true);
  setShowEmailRegisteredError(false); // Oculta el error al intentar crear cuenta
    // Validación por campo
    if (!form.primerNombre.trim() || !form.primerApellido.trim() || !form.correo.trim() || !form.telefono.trim() || !form.contrasena || !form.confirmarContrasena) {
      return;
    }
    if (form.contrasena.length < 8) {
      setShowPasswordLengthError(true);
      return;
    }
    if (form.contrasena !== form.confirmarContrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }
  // setLoading(true); // loading eliminado
    try {
      const res = await usuariosSvc.crear({
        primerNombre: form.primerNombre,
        segundoNombre: form.segundoNombre,
        primerApellido: form.primerApellido,
        segundoApellido: form.segundoApellido,
        correo: form.correo,
        telefono: form.telefono,
        contrasena: form.contrasena,
      });
      if (res.ok) {
        setSuccess(true);
        setShowSuccessModal(true);
        setForm({
          primerNombre: "",
          segundoNombre: "",
          primerApellido: "",
          segundoApellido: "",
          correo: "",
          telefono: "",
          contrasena: "",
          confirmarContrasena: "",
        });
      } else {
        // Si el error es de correo ya registrado, mostrarlo visualmente en el campo correo
        if (res.error && res.error.toLowerCase().includes('correo')) {
          setShowEmailRegisteredError(true);
        } else {
          setError(res.error || "No se pudo crear la cuenta");
        }
      }
    } catch (err: any) {
      // Si el error es un string con JSON, intenta parsear y buscar el mensaje
      let msg = err.message || "Error de red";
      try {
        const parsed = JSON.parse(msg);
        if (parsed.error && parsed.error.toLowerCase().includes('correo')) {
          setShowEmailRegisteredError(true);
          return;
        }
      } catch {}
      setError(msg);
    } finally {
      // setLoading(false); // loading eliminado
    }
  };

  return (
    <>
      {/* Modal de registro exitoso */}
      {showSuccessModal ? (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center max-w-md w-full">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
              <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2.5" fill="none" />
              <polyline points="16 8 11 13 8 10" stroke="#22c55e" strokeWidth="2.5" fill="none" />
            </svg>
            <h3 className="text-2xl font-bold text-zinc-800 mb-2">Registro exitoso</h3>
            <p className="text-zinc-600 mb-6">Se registró el usuario de manera exitosa</p>
            <button
              className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold text-lg hover:bg-emerald-700"
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/");
              }}
            >
              Listo
            </button>
          </div>
        </div>
      ) : null}
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

          {/* Solo mostrar error global si no es de correo ya registrado */}
          {typeof error === 'string' && error && (!error.toLowerCase().includes('correo') && !error.toLowerCase().includes('mail')) && (
            <p className="mb-2 text-xs text-red-600 font-semibold">{error}</p>
          )}
          {success && <p className="mb-2 text-xs text-green-600 font-semibold">¡Cuenta creada exitosamente!</p>}

          {/* Formulario */}
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit} autoComplete="off">
            {/* PRIMER NOMBRE */}
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
              {form.primerNombre.trim() && (
                <span className="absolute right-3 top-2 text-lg" style={{color: '#22c55e'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              )}
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

            {/* SEGUNDO NOMBRE */}
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

            {/* PRIMER APELLIDO */}
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
              {form.primerApellido.trim() && (
                <span className="absolute right-3 top-2 text-lg" style={{color: '#22c55e'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              )}
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

            {/* SEGUNDO APELLIDO */}
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

            {/* CORREO (fila completa) */}
            <div className="relative md:col-span-2">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                CORREO ELECTRÓNICO *
              </span>
              <input
                name="correo"
                value={form.correo}
                onChange={handleChange}
                className={`w-full rounded-xl px-3 pt-6 pb-2 text-sm outline-none placeholder:text-zinc-400 border ${showEmailError ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-zinc-300 focus:ring-2 focus:ring-emerald-500'}`}
                placeholder="example@mail.com"
              />
              {/* Icono de validación o error */}
              {form.correo.trim() && showEmailError ? (
                <span className="absolute right-3 top-2 text-lg" style={{color: '#DC3545'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC3545" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></svg>
                </span>
              ) : form.correo.trim() && (
                <span className="absolute right-3 top-2 text-lg" style={{color: '#22c55e'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              )}
              {/* Mensaje de correo ya registrado debajo del campo */}
              {form.correo.trim() && showEmailRegisteredError && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#DC3545" />
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                    </svg>
                  </span>
                  <span>Correo electronico ya registrado</span>
                </div>
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
              {/* Mensaje de correo inválido en tiempo real */}
              {form.correo.trim() && showEmailError && (
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

            {/* TELÉFONO (más pequeño y centrado) */}
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
                  className={`w-full rounded-xl px-3 pt-6 pb-2 text-sm outline-none border ${showTelefonoError ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-zinc-300 focus:ring-2 focus:ring-emerald-500'}`}
                  placeholder="3000000000"
                />
                {/* Icono de validación o error */}
                {form.telefono.trim() && showTelefonoError ? (
                  <span className="absolute right-3 top-2 text-lg" style={{color: '#DC3545'}}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC3545" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></svg>
                  </span>
                ) : form.telefono.trim() && (
                  <span className="absolute right-3 top-2 text-lg" style={{color: '#22c55e'}}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
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
                {/* Mensaje de formato incorrecto en tiempo real */}
                {form.telefono.trim() && showTelefonoError && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                    <span className="inline-flex items-center justify-center w-4 h-4">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#DC3545" />
                        <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">i</text>
                      </svg>
                    </span>
                    <span>Formato incorrecto</span>
                  </div>
                )}
              </div>
            </div>

            {/* CONTRASEÑAS EN UNA MISMA FILA */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                CONTRASEÑA *
              </span>
              <input
                name="contrasena"
                value={form.contrasena}
                onChange={handleChange}
                type={showPassword ? "text" : "password"}
                className={`w-full rounded-xl px-3 pt-6 pb-2 text-sm outline-none pr-10 placeholder:text-zinc-400 border ${showPasswordLengthError ? 'border-red-500 focus:ring-2 focus:ring-red-500' : form.contrasena ? 'border-zinc-300 focus:ring-2 focus:ring-emerald-500' : 'border-zinc-300'}`}
                placeholder="********"
              />
              {/* Icono de validación o error */}
              {form.contrasena && showPasswordLengthError ? (
                <span className="absolute right-3 top-2 text-lg" style={{color: '#DC3545'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC3545" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></svg>
                </span>
              ) : form.contrasena && (
                <span className="absolute right-3 top-2 text-lg" style={{color: '#22c55e'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              )}
              {/* Mensaje de error de longitud de contraseña */}
              {form.contrasena && showPasswordLengthError && (
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
              {showErrors && !form.contrasena && (
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
              <span
                className="absolute right-3 top-7 cursor-pointer text-zinc-500"
                onClick={() => setShowPassword(v => !v)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
              <p className="text-[11px] text-zinc-500 mt-1">8+ characters</p>
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-zinc-500">
                CONFIRMAR CONTRASEÑA*
              </span>
              <input
                name="confirmarContrasena"
                value={form.confirmarContrasena}
                onChange={handleChange}
                type={showConfirmPassword ? "text" : "password"}
                className={`w-full rounded-xl px-3 pt-6 pb-2 text-sm outline-none pr-10 placeholder:text-zinc-400 border ${showPasswordError ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-zinc-300 focus:ring-2 focus:ring-emerald-500'}`}
                placeholder="********"
              />
              {/* Icono de validación o error */}
              {form.confirmarContrasena && showPasswordError ? (
                <span className="absolute right-3 top-2 text-lg" style={{color: '#DC3545'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC3545" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></svg>
                </span>
              ) : form.confirmarContrasena && (
                <span className="absolute right-3 top-2 text-lg" style={{color: '#22c55e'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              )}
              {/* Solo mostrar 'Este campo es obligatorio' si showErrors es true y el submit fue presionado */}
              {showErrors && !form.confirmarContrasena && !form.contrasena && (
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
              {/* Mensaje de error de contraseñas no coinciden en tiempo real */}
              {form.confirmarContrasena && showPasswordError && (
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
              <span
                className="absolute right-3 top-7 cursor-pointer text-zinc-500"
                onClick={() => setShowConfirmPassword(v => !v)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
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
    </>
  );
}
