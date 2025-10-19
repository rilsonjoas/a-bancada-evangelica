// Hook personalizado para buscar dados de pontuação e análise
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfigs } from '@/lib/queryClient';

// ========================================
// TIPOS PARA PONTUAÇÕES E ANÁLISES
// ========================================

export interface ScoreBreakdown {
  lifeProtection: number;
  familyValues: number;
  moralIntegrity: number;
  socialResponsibility: number;
  religiousFreedom: number;
  overall: number;
}

export interface PoliticianScore extends ScoreBreakdown {
  performanceLevel: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  performanceLabel: string;
  performanceDescription: string;
  totalVotes: number;
  consistencyScore: number;
  nationalRank?: number;
  stateRank?: number;
  partyRank?: number;
  lastCalculation: string;
}

export interface HistoricalScore extends ScoreBreakdown {
  snapshotDate: string;
  snapshotReason: string;
}

export interface ScoreAnalysis {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keyVotes: Array<{
    id: string;
    agendaTitle: string;
    vote: string;
    appliedScore: number;
    voteDate: string;
    criteria: string;
  }>;
  trends: {
    direction: 'up' | 'down' | 'stable';
    change: number;
    period: string;
  };
}

export interface RankingEntry {
  politician: {
    id: number;
    name: string;
    currentParty: string;
    currentState: string;
    currentHouse: string;
    photoUrl?: string;
  };
  score: PoliticianScore;
  position: number;
}

export interface RankingFilters {
  house?: 'CAMARA' | 'SENADO';
  state?: string;
  party?: string;
  criteria?: 'overall' | 'lifeProtection' | 'familyValues' | 'moralIntegrity' | 'socialResponsibility' | 'religiousFreedom';
  limit?: number;
}

// ========================================
// FUNÇÕES DE API
// ========================================

const fetchPoliticianScore = async (politicianId: number): Promise<PoliticianScore> => {
  const response = await fetch(`/api/politicians/${politicianId}/score`);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar pontuação: ${response.status}`);
  }
  
  return response.json();
};

const fetchScoreHistory = async (politicianId: number): Promise<HistoricalScore[]> => {
  const response = await fetch(`/api/politicians/${politicianId}/score/history`);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar histórico de pontuação: ${response.status}`);
  }
  
  return response.json();
};

const fetchScoreAnalysis = async (politicianId: number): Promise<ScoreAnalysis> => {
  const response = await fetch(`/api/politicians/${politicianId}/score/analysis`);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar análise de pontuação: ${response.status}`);
  }
  
  return response.json();
};

const fetchRanking = async (filters: RankingFilters = {}): Promise<RankingEntry[]> => {
  const searchParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(`/api/scores/ranking?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar ranking: ${response.status}`);
  }
  
  return response.json();
};

const fetchTopPerformers = async (criteria: string, limit: number = 10) => {
  const response = await fetch(`/api/scores/top/${criteria}?limit=${limit}`);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar top performers: ${response.status}`);
  }
  
  return response.json();
};

const fetchScoreDistribution = async () => {
  const response = await fetch('/api/scores/distribution');
  
  if (!response.ok) {
    throw new Error('Erro ao buscar distribuição de pontuações');
  }
  
  return response.json();
};

// ========================================
// HOOKS PARA PONTUAÇÕES
// ========================================

/**
 * Hook para buscar pontuação de um político específico
 */
export const usePoliticianScore = (politicianId: number) => {
  return useQuery({
    queryKey: queryKeys.scores.politician(politicianId),
    queryFn: () => fetchPoliticianScore(politicianId),
    ...cacheConfigs.moderate,
    enabled: !!politicianId,
  });
};

/**
 * Hook para buscar histórico de pontuação de um político
 */
export const useScoreHistory = (politicianId: number) => {
  return useQuery({
    queryKey: queryKeys.scores.history(politicianId),
    queryFn: () => fetchScoreHistory(politicianId),
    ...cacheConfigs.moderate,
    enabled: !!politicianId,
  });
};

/**
 * Hook para buscar análise detalhada de pontuação
 */
export const useScoreAnalysis = (politicianId: number) => {
  return useQuery({
    queryKey: ['scores', 'analysis', politicianId],
    queryFn: () => fetchScoreAnalysis(politicianId),
    ...cacheConfigs.moderate,
    enabled: !!politicianId,
  });
};

/**
 * Hook para buscar ranking geral ou por critério
 */
export const useScoresRanking = (filters: RankingFilters = {}) => {
  return useQuery({
    queryKey: ['scores', 'ranking', filters],
    queryFn: () => fetchRanking(filters),
    ...cacheConfigs.moderate,
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook para buscar top performers por critério
 */
export const useTopPerformers = (criteria: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['scores', 'top', criteria, limit],
    queryFn: () => fetchTopPerformers(criteria, limit),
    ...cacheConfigs.static,
  });
};

/**
 * Hook para buscar distribuição de pontuações
 */
export const useScoreDistribution = () => {
  return useQuery({
    queryKey: ['scores', 'distribution'],
    queryFn: fetchScoreDistribution,
    ...cacheConfigs.static,
  });
};

/**
 * Hook para comparar pontuações de múltiplos políticos
 */
export const useScoresComparison = (politicianIds: number[]) => {
  return useQuery({
    queryKey: ['scores', 'comparison', politicianIds.sort()],
    queryFn: async () => {
      const scores = await Promise.all(
        politicianIds.map(id => fetchPoliticianScore(id))
      );
      return scores;
    },
    ...cacheConfigs.moderate,
    enabled: politicianIds.length > 1,
  });
};

// ========================================
// HOOKS PARA ESTATÍSTICAS E ANÁLISES
// ========================================

/**
 * Hook para buscar estatísticas gerais de pontuação
 */
export const useScoresStats = () => {
  return useQuery({
    queryKey: ['scores', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/scores/stats');
      if (!response.ok) throw new Error('Erro ao buscar estatísticas');
      return response.json();
    },
    ...cacheConfigs.static,
  });
};

/**
 * Hook para buscar tendências de pontuação por período
 */
export const useScoresTrends = (period: 'month' | 'quarter' | 'year' = 'month') => {
  return useQuery({
    queryKey: ['scores', 'trends', period],
    queryFn: async () => {
      const response = await fetch(`/api/scores/trends?period=${period}`);
      if (!response.ok) throw new Error('Erro ao buscar tendências');
      return response.json();
    },
    ...cacheConfigs.moderate,
  });
};

/**
 * Hook para buscar análise por critério específico
 */
export const useCriteriaAnalysis = (criteria: string) => {
  return useQuery({
    queryKey: ['scores', 'criteria', criteria],
    queryFn: async () => {
      const response = await fetch(`/api/scores/criteria/${criteria}/analysis`);
      if (!response.ok) throw new Error('Erro ao buscar análise do critério');
      return response.json();
    },
    ...cacheConfigs.moderate,
  });
};

// ========================================
// MUTATIONS PARA ADMINISTRAÇÃO
// ========================================

/**
 * Mutation para recalcular pontuação de um político
 */
export const useRecalculateScore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (politicianId: number) => {
      const response = await fetch(`/api/politicians/${politicianId}/score/recalculate`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao recalcular pontuação');
      }
      
      return response.json();
    },
    onSuccess: (data, politicianId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.scores.politician(politicianId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.scores.history(politicianId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.scores.ranking() });
      queryClient.invalidateQueries({ queryKey: ['scores', 'stats'] });
    },
  });
};

/**
 * Mutation para recalcular todas as pontuações
 */
export const useRecalculateAllScores = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/scores/recalculate-all', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao recalcular todas as pontuações');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidar todas as queries de pontuação
      queryClient.invalidateQueries({ queryKey: ['scores'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.politicians.ranking({}) });
    },
  });
};

// ========================================
// HOOKS UTILITÁRIOS
// ========================================

/**
 * Hook para formatar pontuação com classificação
 */
export const useScoreFormatter = () => {
  const formatScore = (score: number) => {
    let level: string;
    let color: string;
    let label: string;

    if (score >= 80) {
      level = 'excellent';
      color = 'text-green-600';
      label = 'Excelente';
    } else if (score >= 60) {
      level = 'good';
      color = 'text-yellow-600';
      label = 'Bom';
    } else if (score >= 40) {
      level = 'average';
      color = 'text-orange-600';
      label = 'Médio';
    } else {
      level = 'poor';
      color = 'text-red-600';
      label = 'Insuficiente';
    }

    return { score, level, color, label };
  };

  return { formatScore };
};

/**
 * Hook para obter cores dos critérios
 */
export const useCriteriaColors = () => {
  const criteriaColors = {
    lifeProtection: 'text-blue-600',
    familyValues: 'text-purple-600',
    moralIntegrity: 'text-green-600',
    socialResponsibility: 'text-orange-600',
    religiousFreedom: 'text-yellow-600',
    overall: 'text-gray-900',
  };

  const criteriaLabels = {
    lifeProtection: 'Proteção à Vida',
    familyValues: 'Defesa da Família',
    moralIntegrity: 'Integridade Moral',
    socialResponsibility: 'Responsabilidade Social',
    religiousFreedom: 'Liberdade Religiosa',
    overall: 'Pontuação Geral',
  };

  return { criteriaColors, criteriaLabels };
};