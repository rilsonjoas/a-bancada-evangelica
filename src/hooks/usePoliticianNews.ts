import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';

export interface NewsMention {
  id: number;
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string;
}

async function fetchPoliticianNews(id: number): Promise<NewsMention[]> {
  return apiFetch(`/api/news/politicians/${id}`);
}

/**
 * Menções na imprensa #7 (endpoint separado do perfil para manter o findOne
 * enxuto). Só retorna o que passou na curadoria (status APPROVED).
 */
export function usePoliticianNews(id: number) {
  return useQuery({
    queryKey: ['politician-news', id],
    queryFn: () => fetchPoliticianNews(id),
    enabled: !!id && id > 0,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });
}