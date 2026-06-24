import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';

interface PoliticianSearchResult {
  id: number;
  name: string;
  currentParty: string;
  currentState: string;
  currentHouse: string;
  photoUrl: string;
  scores: {
    overall: number;
    performanceLevel: string;
    performanceLabel: string;
  };
}

interface SearchResponse {
  politicians: PoliticianSearchResult[];
  total: number;
  hasMore: boolean;
}

async function searchPoliticians(query: string = '', limit: number = 20): Promise<SearchResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: '0',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  if (query) {
    params.set('search', query);
  }
  
  return apiFetch<SearchResponse>(`/api/politicians?${params}`);
}

export function usePoliticianSearch(query: string = '', limit: number = 20) {
  return useQuery({
    queryKey: ['politician-search', query, limit],
    queryFn: () => searchPoliticians(query, limit),
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: 2,
  });
}