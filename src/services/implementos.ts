import { api } from "../api/client";

export type Implemento = {
  ID_IMPLEMENTO: number;
  TIPO_IMPLEMENTO: string;
  ESTADO: string;
  CANTIDAD: number;
};

export const implementosSvc = {
  list: () => api.get<Implemento[]>('/implementos'),
  get: (id: number) => api.get<Implemento>(`/implementos/${id}`),
};

export default implementosSvc;
