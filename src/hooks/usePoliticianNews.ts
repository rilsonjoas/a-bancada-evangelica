import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

export interface NewsMention {
  id: number;
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string;
}

async function fetchPoliticianNews(id: number): Promise<NewsMention[]> {
  try {
    return await apiFetch(`/api/news/politicians/${id}`);
  } catch {
    return [];
  }
}

export function usePoliticianNews(id: number) {
  return useQuery({
    queryKey: ["politician-news", id],
    queryFn: () => fetchPoliticianNews(id),
    enabled: !!id && id > 0,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
