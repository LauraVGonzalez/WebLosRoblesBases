// src/services/canchas.ts
import { api } from "../api/client";
import type { Cancha, Disciplina } from "../types";

// Lista de canchas puede venir con el nombre de la disciplina
export type CanchaListItem = Cancha & { disciplina?: string };

export const disciplinasSvc = {
  list: async (): Promise<Disciplina[]> => {
    const rows = await api.get<any[]>("/disciplinas"); // GET /api/disciplinas

    // Normaliza claves en mayúsculas/minúsculas y filtra inválidos
    const list: Disciplina[] = (rows ?? [])
      .map((r) => {
        const id =
          r.id ??
          r.ID ??
          r.ID_TIPO_CANCHA ??
          null;

        const nombre: string | undefined =
          r.nombre ??
          r.NOMBRE ??
          r.NOMBRE_TIPO ??
          undefined;

        const descripcion: string | undefined =
          r.descripcion ??
          r.DESCRIPCION ??
          undefined;

        return id != null && nombre
          ? { id: Number(id), nombre: String(nombre), descripcion }
          : null;
      })
      .filter(Boolean) as Disciplina[];

    return list;
  },
};

export const canchasSvc = {
  // Si tu endpoint /api/canchas incluye el nombre de la disciplina, este tipo lo contempla.
  list: (): Promise<CanchaListItem[]> => api.get<CanchaListItem[]>("/canchas"),

  get: (id: number): Promise<CanchaListItem> => api.get<CanchaListItem>(`/canchas/${id}`),

  create: (data: Cancha): Promise<{ id: number }> =>
    api.post<{ id: number }>("/canchas", data),

  update: (id: number, data: Cancha): Promise<void> =>
    api.put<void>(`/canchas/${id}`, data),
};
