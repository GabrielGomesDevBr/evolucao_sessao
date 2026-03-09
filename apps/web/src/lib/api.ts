const API_URL =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:3333`;

export type ApiError = Error & { status?: number };

export async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string, pinToken?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(pinToken ? { 'x-pin-token': pinToken } : {}),
      ...(init.headers ?? {}),
    },
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(json.error || 'Erro na comunicação com a API.') as ApiError;
    error.status = response.status;
    throw error;
  }

  return json.data as T;
}

export { API_URL };
