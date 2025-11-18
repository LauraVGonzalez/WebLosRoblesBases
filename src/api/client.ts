const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:4000/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  console.log('[API] →', url);                      // 👈 VERÁS ESTO EN LA CONSOLA
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });

  const ct = res.headers.get('content-type') || '';

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // Log server (5xx) errors as errors; client errors (4xx) as debug to avoid noisy console during expected rejections
    if (res.status >= 500) {
      console.error('[API] status', res.status, 'body:', text);
    } else {
      console.debug('[API] client error', res.status, 'body:', text);
    }
    throw new Error(text || `HTTP ${res.status} ${url}`);
  }

  if (res.status === 204) return undefined as unknown as T;

  if (!ct.includes('application/json')) {
    const text = await res.text().catch(() => '');
    console.error('[API] non-json from', url, '=>', text.slice(0, 120));
    throw new Error(
      text?.startsWith('<')
        ? `Respuesta HTML desde ${url}. Revisa VITE_API_BASE o el proxy de Vite.`
        : `Respuesta no JSON: ${text}`
    );
  }

  return res.json() as Promise<T>;
}

export const api = {
  get:  <T>(p: string) => request<T>(p),
  post: <T>(p: string, body: unknown) => request<T>(p, { method: 'POST', body: JSON.stringify(body) }),
  put:  <T>(p: string, body: unknown) => request<T>(p, { method: 'PUT',  body: JSON.stringify(body) }),
  patch:<T>(p: string, body?: unknown) => request<T>(p, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }),
  del:  <T>(p: string) => request<T>(p, { method: 'DELETE' }),
};
