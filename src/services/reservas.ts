import { api } from "../api/client";

export const reservasSvc = {
  create: (payload: any) => api.post<{ id: number }>("/reservas", payload),
  // create reserva on behalf of a third party (admin)
  createTerceros: (payload: any) => api.post<{ id: number }>("/reservas/terceros", payload),
  list: (params?: { id_cliente?: number, id_usuario_creador?: number }) => api.get<any[]>('/reservas' + (params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([k,v])=>v!=null).map(([k,v])=>[k,String(v)]))) : '')),
  cancel: (id: number, opts?: { table?: 'tercero' | 'reserva' }) => {
    const qp = opts && opts.table ? `?table=${encodeURIComponent(opts.table)}` : '';
    return api.patch(`/reservas/${id}/cancel${qp}`);
  },
};

export default reservasSvc;
