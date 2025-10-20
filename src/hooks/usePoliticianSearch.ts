import { useQuery } from '@tanstack/react-query';

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
  
  const response = await fetch(`http://localhost:3001/api/politicians?${params}`);
  
  if (!response.ok) {
    throw new Error(`Erro na busca: ${response.status}`);
  }
  
  return response.json();
}

export function usePoliticianSearch(query: string = '', limit: number = 20) {
  return useQuery({
    queryKey: ['politician-search', query, limit],
    queryFn: () => searchPoliticians(query, limit),
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: 2,
  });
}