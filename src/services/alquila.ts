import { api } from "../api/client";

export const alquilaSvc = {
  rent: (payload: { id_usuario: number; id_implemento: number; cantidad: number }) =>
    api.post<any>("/alquila", payload),
};

export default alquilaSvc;
