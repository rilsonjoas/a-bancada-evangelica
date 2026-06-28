// Hook personalizado para buscar dados de políticos
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfigs } from '@/lib/queryClient';
import { apiFetch } from '@/lib/apiClient';
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
  fpeFilter?: boolean;
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

  return apiFetch(`/api/politicians?${searchParams.toString()}`);
};

const fetchPoliticianDetail = async (id: number): Promise<APIPoliticianDetails> =>
  apiFetch(`/api/politicians/${id}`);

const fetchRanking = async (filters: Omit<PoliticiansFilters, 'search'> = {}): Promise<RankingResponse[]> => {
  const searchParams = new URLSearchParams();

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

  return apiFetch(`/api/politicians/ranking?${searchParams.toString()}`);
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
    queryFn: (): Promise<StatsResponse> => apiFetch('/api/stats/overview'),
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<APIPoliticianDetails> }) =>
      apiFetch(`/api/politicians/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
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
    mutationFn: (politicianId: number) =>
      apiFetch(`/api/politicians/${politicianId}/recalculate-score`, { method: 'POST' }),
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
    queryFn: () => apiFetch('/api/politicians/filters/states'),
    ...cacheConfigs.static,
  });
};

/**
 * Hook para obter filtros de partido únicos
 */
export const usePartiesFilter = () => {
  return useQuery({
    queryKey: ['politicians', 'parties'],
    queryFn: () => apiFetch('/api/politicians/filters/parties'),
    ...cacheConfigs.static,
  });
};

/**
 * Hook para buscar políticos com paginação infinita
 */
export const usePoliticiansInfinite = (filters: PoliticiansFilters = {}) => {
  const pageSize = filters.limit || 20;

  return useInfiniteQuery({
    queryKey: ['politicians', 'infinite', filters],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      fetchPoliticians({ ...filters, offset: pageParam, limit: pageSize }),
    ...cacheConfigs.moderate,
    initialPageParam: 0,
    getNextPageParam: (lastPage: PoliticiansResponse, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * pageSize;
    },
  });
};