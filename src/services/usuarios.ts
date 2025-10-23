import { api } from '../api/client';

export interface UsuarioNuevo {
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  correo: string;
  telefono: string;
  contrasena: string;
}

export const usuariosSvc = {
  crear: async (data: UsuarioNuevo) => {
    // El backend espera los campos en snake_case
    // El backend espera primer_nombre, segundo_nombre, apellido, correo, telefono, password
    // Enviar solo primerApellido como "apellido" y segundoApellido como "segundo_apellido" si lo requiere el backend
    return api.post<{ ok: boolean; idCliente?: number; error?: string }>(
      '/auth/register',
      {
        primer_nombre: data.primerNombre,
        segundo_nombre: data.segundoNombre,
        primer_apellido: data.primerApellido,
        segundo_apellido: data.segundoApellido,
        correo: data.correo,
        telefono: data.telefono,
        password: data.contrasena,
      }
    );
  },
};
