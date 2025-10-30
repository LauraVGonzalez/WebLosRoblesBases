import { api } from "../api/client";

export const reservasSvc = {
  create: (payload: any) => api.post<{ id: number }>("/reservas", payload),
};

export default reservasSvc;
