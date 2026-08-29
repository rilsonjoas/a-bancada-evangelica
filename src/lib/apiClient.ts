const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
export const ANALYSIS_BASE_URL = (import.meta.env.VITE_ANALYSIS_URL ?? 'http://localhost:8001').replace(/\/$/, '');

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    // Extrai a mensagem real do erro (ex.: guard de curadoria retorna
    // { error, statusCode }) — fallback genérico mantendo compatibilidade.
    let detail = `API error ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) detail = body.error;
    } catch {
      // corpo não-JSON: mantém o fallback
    }
    throw new Error(detail);
  }

  return response.json();
}

export { API_BASE_URL };
