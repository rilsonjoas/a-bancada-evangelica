import { useQuery } from '@tanstack/react-query';

interface VotingAnalysisData {
  totalVotes: number;
  activePoliticians: number;
  totalAgendas: number;
  averageConsensus: number;
  voteByCriteria: Record<string, number>;
  alignmentStats: {
    high: number;
    medium: number;
    low: number;
  };
  timelineTrends: Array<{
    date: string;
    favorableVotes: number;
    contraryVotes: number;
    abstentions: number;
  }>;
  keyAgendas: Array<{
    id: string;
    title: string;
    description: string;
    criteria: string;
    totalVotes: number;
    favorableVotes: number;
    contraryVotes: number;
    abstentions: number;
    consensusScore: number;
  }>;
  politicianRanking: Array<{
    id: number;
    name: string;
    party: string;
    state: string;
    alignmentScore: number;
    totalVotes: number;
  }>;
}

async function fetchVotingAnalysisData(filters: {
  criteria?: string;
  dateRange?: string;
  voteType?: string;
  search?: string;
}): Promise<VotingAnalysisData> {
  // Simular dados por enquanto - implementar quando tivermos dados reais de votação
  return {
    totalVotes: 1247,
    activePoliticians: 612,
    totalAgendas: 89,
    averageConsensus: 68,
    voteByCriteria: {
      'LIFE_PROTECTION': 312,
      'FAMILY_VALUES': 256,
      'MORAL_INTEGRITY': 189,
      'SOCIAL_RESPONSIBILITY': 298,
      'RELIGIOUS_FREEDOM': 192
    },
    alignmentStats: {
      high: 127,
      medium: 298,
      low: 187
    },
    timelineTrends: [
      { date: '2024-01', favorableVotes: 45, contraryVotes: 23, abstentions: 8 },
      { date: '2024-02', favorableVotes: 52, contraryVotes: 19, abstentions: 12 },
      { date: '2024-03', favorableVotes: 38, contraryVotes: 31, abstentions: 15 },
      { date: '2024-04', favorableVotes: 61, contraryVotes: 18, abstentions: 9 },
      { date: '2024-05', favorableVotes: 49, contraryVotes: 25, abstentions: 11 },
      { date: '2024-06', favorableVotes: 55, contraryVotes: 22, abstentions: 13 }
    ],
    keyAgendas: [
      {
        id: '1',
        title: 'PL 1234/2024 - Proteção da Vida desde a Concepção',
        description: 'Projeto que estabelece marcos legais para proteção da vida humana desde a concepção.',
        criteria: 'LIFE_PROTECTION',
        totalVotes: 487,
        favorableVotes: 298,
        contraryVotes: 156,
        abstentions: 33,
        consensusScore: 61.2
      },
      {
        id: '2',
        title: 'PEC 45/2024 - Educação Domiciliar',
        description: 'Proposta de emenda constitucional para regulamentação da educação domiciliar.',
        criteria: 'FAMILY_VALUES',
        totalVotes: 512,
        favorableVotes: 342,
        contraryVotes: 134,
        abstentions: 36,
        consensusScore: 66.8
      },
      {
        id: '3',
        title: 'PL 5678/2024 - Liberdade Religiosa nas Escolas',
        description: 'Projeto para garantir a liberdade religiosa e de consciência no ambiente escolar.',
        criteria: 'RELIGIOUS_FREEDOM',
        totalVotes: 456,
        favorableVotes: 289,
        contraryVotes: 123,
        abstentions: 44,
        consensusScore: 63.4
      }
    ],
    politicianRanking: [
      { id: 1, name: 'Marco Feliciano', party: 'PL', state: 'SP', alignmentScore: 92.3, totalVotes: 156 },
      { id: 2, name: 'Damares Alves', party: 'REPUBLICANOS', state: 'DF', alignmentScore: 89.7, totalVotes: 142 },
      { id: 3, name: 'Silas Câmara', party: 'REPUBLICANOS', state: 'AM', alignmentScore: 87.1, totalVotes: 134 },
      { id: 4, name: 'Sóstenes Cavalcante', party: 'PL', state: 'RJ', alignmentScore: 85.9, totalVotes: 148 },
      { id: 5, name: 'Pastor Eurico', party: 'PL', state: 'PE', alignmentScore: 84.2, totalVotes: 139 }
    ]
  };
}

export function useVotingAnalysisData(filters: {
  criteria?: string;
  dateRange?: string;
  voteType?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['voting-analysis', filters],
    queryFn: () => fetchVotingAnalysisData(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  });
}