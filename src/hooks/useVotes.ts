import { apiFetch } from '@/lib/apiClient';
// Hook personalizado para buscar dados de votações
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfigs } from '@/lib/queryClient';

// ========================================
// TIPOS PARA VOTAÇÕES
// ========================================

export interface Vote {
  id: string;
  politician: {
    id: number;
    name: string;
    currentParty: string;
    currentState: string;
    currentHouse: string;
  };
  keyAgenda: {
    id: string;
    title: string;
    description: string;
    criteria: string;
    priority: number;
  };
  voteType: 'YES' | 'NO' | 'ABSTENTION' | 'OBSTRUCTION' | 'ABSENT';
  appliedScore: number;
  voteDate: string;
  source: 'CAMARA' | 'SENADO';
  sourceVoteId: string;
  votingDescription?: string;
  resultDescription?: string;
}

export interface KeyAgenda {
  id: string;
  title: string;
  description: string;
  criteria: 'LIFE_PROTECTION' | 'FAMILY_VALUES' | 'MORAL_INTEGRITY' | 'SOCIAL_RESPONSIBILITY' | 'RELIGIOUS_FREEDOM';
  positiveWeight: number;
  negativeWeight: number;
  source: 'CAMARA' | 'SENADO';
  sourceId: string;
  sourceUrl?: string;
  keywords: string[];
  status: 'ACTIVE' | 'ARCHIVED' | 'APPROVED' | 'REJECTED';
  priority: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    votes: number;
  };
}

export interface VotesByAgenda {
  agenda: KeyAgenda;
  votes: Vote[];
  summary: {
    total: number;
    yes: number;
    no: number;
    abstention: number;
    obstruction: number;
    absent: number;
  };
}

export interface VotingPattern {
  politician: {
    id: number;
    name: string;
    currentParty: string;
    currentState: string;
  };
  totalVotes: number;
  voteDistribution: {
    yes: number;
    no: number;
    abstention: number;
    obstruction: number;
    absent: number;
  };
  consistencyScore: number;
  averageScore: number;
}

// ========================================
// FILTROS E PARÂMETROS
// ========================================

export interface VotesFilters {
  politicianId?: number;
  agendaId?: string;
  criteria?: string;
  voteType?: string;
  source?: 'CAMARA' | 'SENADO';
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface AgendasFilters {
  criteria?: string;
  status?: string;
  source?: 'CAMARA' | 'SENADO';
  priority?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

// ========================================
// FUNÇÕES DE API
// ========================================

const fetchVotes = async (filters: VotesFilters = {}) => {
  const searchParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(`/api/votes?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar votações: ${response.status}`);
  }
  
  return response.json();
};

const fetchPoliticianVotes = async (politicianId: number, filters: Omit<VotesFilters, 'politicianId'> = {}) => {
  const searchParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(`/api/politicians/${politicianId}/votes?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar votações do político: ${response.status}`);
  }
  
  return response.json();
};



const fetchAgendaVotes = async (agendaId: string): Promise<VotesByAgenda> => {
  // GT1 (2026-09-14): remove explicitamente o fallback que FABRICAVA
  // parlamentares, partidos e contagens. Zero fabricado > número inventado.
  // Se a API falhar, o erro sobe pro React Query e a UI mostra estado
  // vazio/indisponível honesto.
  return await apiFetch<VotesByAgenda>(`/api/agendas/${agendaId}/votes`);
};

const fetchKeyAgendas = async (filters: AgendasFilters = {}) => {
  const searchParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(`/api/agendas?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar pautas-chave: ${response.status}`);
  }
  
  return response.json();
};

const fetchVotingPatterns = async (criteria?: string) => {
  const searchParams = new URLSearchParams();
  if (criteria) searchParams.append('criteria', criteria);

  const response = await fetch(`/api/votes/patterns?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar padrões de votação');
  }
  
  return response.json();
};

// ========================================
// HOOKS PARA VOTAÇÕES
// ========================================

/**
 * Hook para buscar votações com filtros
 */
export const useVotes = (filters: VotesFilters = {}) => {
  return useQuery({
    queryKey: ['votes', 'list', filters],
    queryFn: () => fetchVotes(filters),
    ...cacheConfigs.moderate,
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook para buscar votações de um político específico
 */
export const usePoliticianVotes = (politicianId: number, filters: Omit<VotesFilters, 'politicianId'> = {}) => {
  return useQuery({
    queryKey: queryKeys.votes.politician(politicianId),
    queryFn: () => fetchPoliticianVotes(politicianId, filters),
    ...cacheConfigs.moderate,
    enabled: !!politicianId,
  });
};

/**
 * Hook para buscar votações de uma pauta específica
 */
export const useAgendaVotes = (agendaId: string) => {
  return useQuery({
    queryKey: queryKeys.votes.agenda(agendaId),
    queryFn: () => fetchAgendaVotes(agendaId),
    ...cacheConfigs.moderate,
    enabled: !!agendaId,
  });
};

/**
 * Hook para buscar pautas-chave
 */
export const useKeyAgendas = (filters: AgendasFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.keyAgendas.list(filters),
    queryFn: () => fetchKeyAgendas(filters),
    ...cacheConfigs.static,
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook para buscar detalhes de uma pauta-chave
 */
export const useKeyAgendaDetail = (agendaId: string) => {
  return useQuery({
    queryKey: queryKeys.keyAgendas.detail(agendaId),
    queryFn: async () => {
      const response = await fetch(`/api/agendas/${agendaId}`);
      if (!response.ok) throw new Error('Erro ao buscar pauta');
      return response.json();
    },
    ...cacheConfigs.static,
    enabled: !!agendaId,
  });
};

/**
 * Hook para buscar padrões de votação
 */
export const useVotingPatterns = (criteria?: string) => {
  return useQuery({
    queryKey: ['votes', 'patterns', criteria],
    queryFn: () => fetchVotingPatterns(criteria),
    ...cacheConfigs.moderate,
  });
};

/**
 * Hook para buscar votações recentes
 */
export const useRecentVotes = (limit: number = 20) => {
  return useQuery({
    queryKey: ['votes', 'recent', limit],
    queryFn: () => fetchVotes({ 
      limit,
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // últimos 30 dias
    }),
    ...cacheConfigs.dynamic,
  });
};

// ========================================
// HOOKS PARA ANÁLISES E ESTATÍSTICAS
// ========================================

/**
 * Hook para buscar estatísticas de votação por critério
 */
export const useVoteStatsByCriteria = () => {
  return useQuery({
    queryKey: ['votes', 'stats', 'criteria'],
    queryFn: async () => {
      const response = await fetch('/api/votes/stats/criteria');
      if (!response.ok) throw new Error('Erro ao buscar estatísticas');
      return response.json();
    },
    ...cacheConfigs.static,
  });
};

/**
 * Hook para buscar concordância entre políticos
 */
export const usePoliticiansAgreement = (politicianIds: number[]) => {
  return useQuery({
    queryKey: ['votes', 'agreement', politicianIds.sort()],
    queryFn: async () => {
      const response = await fetch('/api/votes/agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ politicianIds }),
      });
      if (!response.ok) throw new Error('Erro ao calcular concordância');
      return response.json();
    },
    ...cacheConfigs.moderate,
    enabled: politicianIds.length >= 2,
  });
};

/**
 * Hook para buscar histórico de votações de uma pauta ao longo do tempo
 */
export const useAgendaVotingHistory = (agendaId: string) => {
  return useQuery({
    queryKey: ['agendas', agendaId, 'voting-history'],
    queryFn: async () => {
      const response = await fetch(`/api/agendas/${agendaId}/voting-history`);
      if (!response.ok) throw new Error('Erro ao buscar histórico');
      return response.json();
    },
    ...cacheConfigs.moderate,
    enabled: !!agendaId,
  });
};

// ========================================
// MUTATIONS PARA ADMINISTRAÇÃO
// ========================================

/**
 * Mutation para criar nova pauta-chave
 */
export const useCreateKeyAgenda = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (agendaData: Omit<KeyAgenda, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch('/api/agendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agendaData),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar pauta-chave');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.keyAgendas.lists() });
    },
  });
};

/**
 * Mutation para atualizar pauta-chave
 */
export const useUpdateKeyAgenda = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<KeyAgenda> }) => {
      const response = await fetch(`/api/agendas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar pauta-chave');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.keyAgendas.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.keyAgendas.lists() });
    },
  });
};

/**
 * Mutation para sincronizar votações de uma pauta
 */
export const useSyncAgendaVotes = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (agendaId: string) => {
      const response = await fetch(`/api/agendas/${agendaId}/sync-votes`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao sincronizar votações');
      }
      
      return response.json();
    },
    onSuccess: (data, agendaId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.votes.agenda(agendaId) });
      queryClient.invalidateQueries({ queryKey: ['votes'] });
      queryClient.invalidateQueries({ queryKey: ['scores'] });
    },
  });
};

// ========================================
// HOOKS UTILITÁRIOS
// ========================================

/**
 * Hook para formatar tipos de voto
 */
export const useVoteFormatter = () => {
  const formatVoteType = (voteType: string) => {
    const voteLabels = {
      'YES': { label: 'Sim', color: 'text-green-600', bgColor: 'bg-green-100' },
      'NO': { label: 'Não', color: 'text-red-600', bgColor: 'bg-red-100' },
      'ABSTENTION': { label: 'Abstenção', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      'OBSTRUCTION': { label: 'Obstrução', color: 'text-orange-600', bgColor: 'bg-orange-100' },
      'ABSENT': { label: 'Ausente', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    };

    return voteLabels[voteType as keyof typeof voteLabels] || {
      label: voteType,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    };
  };

  const formatCriteria = (criteria: string) => {
    const criteriaLabels = {
      'LIFE_PROTECTION': 'Proteção à Vida',
      'FAMILY_VALUES': 'Defesa da Família',
      'MORAL_INTEGRITY': 'Integridade Moral',
      'SOCIAL_RESPONSIBILITY': 'Responsabilidade Social',
      'RELIGIOUS_FREEDOM': 'Liberdade Religiosa',
    };

    return criteriaLabels[criteria as keyof typeof criteriaLabels] || criteria;
  };

  return { formatVoteType, formatCriteria };
};