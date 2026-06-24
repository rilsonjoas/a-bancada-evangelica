const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
export const ANALYSIS_BASE_URL = (import.meta.env.VITE_ANALYSIS_URL ?? 'http://localhost:8001').replace(/\/$/, '');

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${path}`);
  }

  return response.json();
}

export { API_BASE_URL };
