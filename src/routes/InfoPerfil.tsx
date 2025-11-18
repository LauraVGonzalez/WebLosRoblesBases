import fondo from "../assets/info_perfil.png";
import GroupIconImg from "../assets/GroupIconImg.png";
import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function InfoPerfil() {
  const [usuario, setUsuario] = useState({
    nombres: "",
    apellidos: "",
    correo: "",
    telefono: ""
  });
  const [error, setError] = useState("");
  const correoUsuario = localStorage.getItem("usuario_correo") || "";

  useEffect(() => {
    async function fetchUsuario() {
      if (!correoUsuario) return;
      try {
        // Suponiendo que el backend tiene un endpoint /api/usuarios/perfil?correo=...
        const res = await api.get<any>(`/usuarios/perfil?correo=${encodeURIComponent(correoUsuario)}`);
        console.log('[UI] /api/usuarios/perfil response:', res);
        setUsuario({
          nombres: res.nombres || "",
          apellidos: res.apellidos || "",
          correo: res.correo || correoUsuario,
          telefono: res.telefono || res.celular || res.CELULAR || ""
        });
        setError("");
      } catch (e) {
        setUsuario(u => ({ ...u, correo: correoUsuario }));
        setError("No se pudo obtener la información del usuario. Verifica el endpoint /api/usuarios/perfil en el backend.");
      }
    }
    fetchUsuario();
  }, [correoUsuario]);

  return (
    <section className="relative min-h-[calc(100vh-72px)] w-full">
      <img src={fondo} alt="" className="absolute inset-0 h-full w-full object-cover scale-105" />
      {/* Menú de ajustes en la esquina superior derecha */}
      <div className="absolute top-8 right-8 z-10">
        <div className="bg-white rounded-lg shadow-lg p-2 w-48">
          <div className="text-sm text-zinc-700 font-semibold mb-2">Ajustes</div>
          <button className="block w-full text-left px-2 py-1 hover:bg-zinc-100 text-zinc-800" onClick={() => {
            const correo = localStorage.getItem('usuario_correo') || '';
            if (correo.includes('@losrobles.com')) {
              window.location.href = '/PrincipalAdmin/InfoPerfil/EditarPerfil';
            } else {
              window.location.href = '/Principal/InfoPerfil/EditarPerfil';
            }
          }}>✏️ Editar Perfil</button>
          <button className="block w-full text-left px-2 py-1 hover:bg-zinc-100 text-zinc-800" onClick={() => { localStorage.clear(); window.location.href = '/Inicio/IniciarSesion'; }}>🔒 Cerrar Sesión</button>
        </div>
      </div>
      <div className="relative z-[1] w-full max-w-[400px] mx-auto flex flex-col items-center">
        <div className="mt-10 flex flex-col items-center">
          <div className="bg-white rounded-full p-4 shadow-lg mb-4 border-2 border-blue-500">
            <img src={GroupIconImg} alt="icono usuario" className="w-24 h-24" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide mb-4 text-center drop-shadow-lg">
            {usuario.nombres.toUpperCase()}
          </h1>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full text-center">
          {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}
          <div className="mb-2 text-zinc-700 text-base">
            <span className="font-semibold">Nombres :</span> {usuario.nombres}
          </div>
          <div className="mb-2 text-zinc-700 text-base">
            <span className="font-semibold">Apellidos :</span> {usuario.apellidos}
          </div>
          <div className="mb-2 text-zinc-700 text-base">
            <span className="font-semibold">Correo electrónico :</span> {usuario.correo}
          </div>
          <div className="mb-2 text-zinc-700 text-base">
            <span className="font-semibold">Numero telefónico :</span> {usuario.telefono}
          </div>
        </div>
      </div>
    </section>
  );
}
