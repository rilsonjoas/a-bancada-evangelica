// Hook personalizado para buscar dados de políticos
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfigs } from '@/lib/queryClient';
import type { 
  APIPolitician, 
  APIPoliticianDetails, 
  PoliticiansResponse,
  RankingResponse,
  StatsResponse 
} from '@/types/politician';

// ========================================
// TIPOS PARA FILTROS E RESPOSTAS
// ========================================

export interface PoliticiansFilters {
  search?: string;
  state?: string;
  party?: string;
  house?: 'CAMARA' | 'SENADO';
  performanceLevel?: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  minScore?: number;
  maxScore?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'score' | 'state' | 'party';
  sortOrder?: 'asc' | 'desc';
}


// ========================================
// FUNÇÕES DE API
// ========================================

const fetchPoliticians = async (filters: PoliticiansFilters = {}): Promise<PoliticiansResponse> => {
  const searchParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(`http://localhost:3001/api/politicians?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar políticos: ${response.status}`);
  }
  
  return response.json();
};

const fetchPoliticianDetail = async (id: number): Promise<APIPoliticianDetails> => {
  const response = await fetch(`http://localhost:3001/api/politicians/${id}`);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar detalhes do político: ${response.status}`);
  }
  
  return response.json();
};

const fetchRanking = async (filters: Omit<PoliticiansFilters, 'search'> = {}): Promise<RankingResponse[]> => {
  const searchParams = new URLSearchParams();
  
  // Para ranking, sempre ordenar por score desc
  const rankingFilters = {
    ...filters,
    criteria: 'overall',
    limit: filters.limit || 50,
  };
  
  Object.entries(rankingFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(`http://localhost:3001/api/politicians/ranking?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar ranking: ${response.status}`);
  }
  
  return response.json();
};

// ========================================
// HOOKS PERSONALIZADOS
// ========================================

/**
 * Hook para buscar lista de políticos com filtros
 */
export const usePoliticians = (filters: PoliticiansFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.politicians.list(filters),
    queryFn: () => fetchPoliticians(filters),
    ...cacheConfigs.moderate,
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook para buscar ranking de políticos
 */
export const usePoliticiansRanking = (filters: Omit<PoliticiansFilters, 'search'> = {}) => {
  return useQuery({
    queryKey: queryKeys.politicians.ranking(filters),
    queryFn: () => fetchRanking(filters),
    ...cacheConfigs.moderate,
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook para buscar detalhes de um político específico
 */
export const usePoliticianDetail = (id: number) => {
  return useQuery({
    queryKey: queryKeys.politicians.detail(id),
    queryFn: () => fetchPoliticianDetail(id),
    ...cacheConfigs.moderate,
    enabled: !!id,
  });
};

/**
 * Hook para buscar múltiplos políticos (para comparação)
 */
export const usePoliticiansComparison = (ids: number[]) => {
  return useQuery({
    queryKey: ['politicians', 'comparison', ids.sort()],
    queryFn: async () => {
      const politicians = await Promise.all(
        ids.map(id => fetchPoliticianDetail(id))
      );
      return politicians;
    },
    ...cacheConfigs.moderate,
    enabled: ids.length > 0,
  });
};

/**
 * Hook para buscar estatísticas gerais
 */
export const usePoliticiansStats = () => {
  return useQuery({
    queryKey: queryKeys.stats.overview(),
    queryFn: async (): Promise<StatsResponse> => {
      const response = await fetch('http://localhost:3001/api/stats/overview');
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas');
      }
      return response.json();
    },
    ...cacheConfigs.static,
  });
};

// ========================================
// MUTATIONS (para futuro - admin)
// ========================================

/**
 * Mutation para atualizar dados de um político (admin)
 */
export const useUpdatePolitician = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Politician> }) => {
      const response = await fetch(`/api/politicians/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar político');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.politicians.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.politicians.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.politicians.ranking({}) });
    },
  });
};

/**
 * Mutation para recalcular pontuação de um político (admin)
 */
export const useRecalculateScore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (politicianId: number) => {
      const response = await fetch(`/api/politicians/${politicianId}/recalculate-score`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao recalcular pontuação');
      }
      
      return response.json();
    },
    onSuccess: (data, politicianId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.politicians.detail(politicianId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.scores.politician(politicianId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.politicians.ranking({}) });
    },
  });
};

// ========================================
// HOOKS UTILITÁRIOS
// ========================================

/**
 * Hook para obter filtros de estado únicos
 */
export const useStatesFilter = () => {
  return useQuery({
    queryKey: ['politicians', 'states'],
    queryFn: async () => {
      const response = await fetch('/api/politicians/filters/states');
      if (!response.ok) throw new Error('Erro ao buscar estados');
      return response.json();
    },
    ...cacheConfigs.static,
  });
};

/**
 * Hook para obter filtros de partido únicos
 */
export const usePartiesFilter = () => {
  return useQuery({
    queryKey: ['politicians', 'parties'],
    queryFn: async () => {
      const response = await fetch('/api/politicians/filters/parties');
      if (!response.ok) throw new Error('Erro ao buscar partidos');
      return response.json();
    },
    ...cacheConfigs.static,
  });
};

/**
 * Hook para buscar políticos com infinite query (paginação infinita)
 */
export const usePoliticiansInfinite = (filters: PoliticiansFilters = {}) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['politicians', 'infinite', filters],
    queryFn: async ({ pageParam = 0 }: { pageParam?: number }) => {
      return fetchPoliticians({
        ...filters,
        offset: pageParam,
        limit: filters.limit || 20,
      });
    },
    ...cacheConfigs.moderate,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * (filters.limit || 20);
    },
  });
};