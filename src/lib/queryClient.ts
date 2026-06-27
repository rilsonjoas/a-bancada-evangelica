// Configuração do React Query Client
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos por padrão
      staleTime: 5 * 60 * 1000,
      // Manter cache por 10 minutos
      gcTime: 10 * 60 * 1000,
      // Retry automático em caso de erro
      retry: (failureCount, error) => {
        // Não fazer retry para erros 4xx (client errors)
        if (error instanceof Error && 'status' in error) {
          const status = (error as Error & { status?: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Máximo 3 tentativas
        return failureCount < 3;
      },
      // Intervalo de retry exponencial
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch automático quando a janela ganha foco
      refetchOnWindowFocus: false,
      // Refetch quando reconecta à internet
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry para mutations também
      retry: 1,
      // Timeout para mutations
      networkMode: 'online',
    },
  },
});

// Configurações específicas por tipo de query
export const queryKeys = {
  // Políticos
  politicians: {
    all: ['politicians'] as const,
    lists: () => [...queryKeys.politicians.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.politicians.lists(), { filters }] as const,
    details: () => [...queryKeys.politicians.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.politicians.details(), id] as const,
    ranking: (filters: Record<string, unknown>) => [...queryKeys.politicians.all, 'ranking', { filters }] as const,
  },
  
  // Pontuações
  scores: {
    all: ['scores'] as const,
    politician: (id: number) => [...queryKeys.scores.all, 'politician', id] as const,
    history: (id: number) => [...queryKeys.scores.all, 'history', id] as const,
    ranking: () => [...queryKeys.scores.all, 'ranking'] as const,
  },
  
  // Votações
  votes: {
    all: ['votes'] as const,
    politician: (id: number) => [...queryKeys.votes.all, 'politician', id] as const,
    agenda: (id: string) => [...queryKeys.votes.all, 'agenda', id] as const,
  },
  
  // Despesas
  expenses: {
    all: ['expenses'] as const,
    politician: (id: number, year?: number, month?: number) => 
      [...queryKeys.expenses.all, 'politician', id, { year, month }] as const,
    analysis: (id: number) => [...queryKeys.expenses.all, 'analysis', id] as const,
  },
  
  // Pautas-chave
  keyAgendas: {
    all: ['keyAgendas'] as const,
    lists: () => [...queryKeys.keyAgendas.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.keyAgendas.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.keyAgendas.all, 'detail', id] as const,
  },
  
  // Sistema
  system: {
    all: ['system'] as const,
    config: () => [...queryKeys.system.all, 'config'] as const,
    health: () => [...queryKeys.system.all, 'health'] as const,
    syncLogs: () => [...queryKeys.system.all, 'syncLogs'] as const,
  },
  
  // Estatísticas
  stats: {
    all: ['stats'] as const,
    overview: () => [...queryKeys.stats.all, 'overview'] as const,
    trends: () => [...queryKeys.stats.all, 'trends'] as const,
    distribution: () => [...queryKeys.stats.all, 'distribution'] as const,
  },
} as const;

// Configurações de cache específicas
export const cacheConfigs = {
  // Dados que mudam raramente - cache longo
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000,    // 1 hora
  },
  
  // Dados que mudam ocasionalmente - cache médio
  moderate: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000,    // 30 minutos
  },
  
  // Dados que mudam frequentemente - cache curto
  dynamic: {
    staleTime: 2 * 60 * 1000,  // 2 minutos
    gcTime: 10 * 60 * 1000,    // 10 minutos
  },
  
  // Dados em tempo real - sem cache
  realtime: {
    staleTime: 0,              // Sempre buscar
    gcTime: 5 * 60 * 1000,     // 5 minutos
  },
};

// Função para invalidar queries relacionadas a um político
export const invalidatePoliticianQueries = (politicianId: number) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.politicians.detail(politicianId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.scores.politician(politicianId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.votes.politician(politicianId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.expenses.politician(politicianId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.politicians.ranking({}) });
  queryClient.invalidateQueries({ queryKey: queryKeys.scores.ranking() });
};

// Função para invalidar todas as queries de ranking
export const invalidateRankingQueries = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.politicians.ranking({}) });
  queryClient.invalidateQueries({ queryKey: queryKeys.scores.ranking() });
  queryClient.invalidateQueries({ queryKey: queryKeys.stats.overview() });
};

// Função para pré-carregar dados críticos
export const prefetchCriticalData = async () => {
  // Pré-carregar ranking principal
  await queryClient.prefetchQuery({
    queryKey: queryKeys.politicians.ranking({}),
    queryFn: () => fetch('/api/politicians/ranking').then(res => res.json()),
    ...cacheConfigs.moderate,
  });
  
  // Pré-carregar estatísticas gerais
  await queryClient.prefetchQuery({
    queryKey: queryKeys.stats.overview(),
    queryFn: () => fetch('/api/stats/overview').then(res => res.json()),
    ...cacheConfigs.moderate,
  });
};