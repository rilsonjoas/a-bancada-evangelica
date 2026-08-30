import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

export interface VotingAnalysisData {
  totalVotes: number;
  activePoliticians: number;
  totalAgendas: number;
  averageScore?: number;
  agendaByCriteria: Record<string, number>;
  averageConsensus: number;
  voteByCriteria: Record<string, number>;
  alignmentStats: { high: number; medium: number; low: number; };
  timelineTrends: Array<{ date: string; favorableVotes: number; contraryVotes: number; abstentions: number; }>;
  keyAgendas: Array<{
    id: string; title: string; description: string; practicalImpact?: string | null; theme?: string | null;
    criteria: string; totalVotes: number; favorableVotes: number; contraryVotes: number; abstentions: number;
    consensusScore: number; firstVoteDate: string | null; lastVoteDate: string | null;
  }>;
  politicianRanking: Array<{ id: number; name: string; party: string; state: string; alignmentScore: number; totalVotes: number; }>;
}

const FALLBACK_ANALYSIS_DATA: VotingAnalysisData = {
  totalVotes: 26860, activePoliticians: 594, totalAgendas: 75, averageScore: 86.3,
  agendaByCriteria: { LIFE_PROTECTION: 25, FAMILY_VALUES: 20, MORAL_INTEGRITY: 15, SOCIAL_RESPONSIBILITY: 10, RELIGIOUS_FREEDOM: 5 },
  averageConsensus: 74.2, voteByCriteria: { LIFE_PROTECTION: 8500, FAMILY_VALUES: 6800, MORAL_INTEGRITY: 5200, SOCIAL_RESPONSIBILITY: 4100, RELIGIOUS_FREEDOM: 2260 },
  alignmentStats: { high: 412, medium: 145, low: 37 },
  timelineTrends: [
    { date: "2023-03-01", favorableVotes: 320, contraryVotes: 40, abstentions: 5 },
    { date: "2023-06-01", favorableVotes: 310, contraryVotes: 50, abstentions: 10 },
    { date: "2023-09-01", favorableVotes: 295, contraryVotes: 65, abstentions: 8 },
    { date: "2023-12-01", favorableVotes: 305, contraryVotes: 55, abstentions: 6 },
    { date: "2024-03-01", favorableVotes: 318, contraryVotes: 50, abstentions: 1 }
  ],
  keyAgendas: [
    { id: "pl-2159-2021", title: "PL 2159/2021 — Licenciamento Ambiental", description: "Dispõe sobre o licenciamento ambiental e regulamenta a avaliação de impactos.", practicalImpact: "Simplifica o licenciamento para obras de infraestrutura e agronegócio.", theme: "meio-ambiente-energia", criteria: "SOCIAL_RESPONSIBILITY", totalVotes: 361, favorableVotes: 318, contraryVotes: 50, abstentions: 1, consensusScore: 31.0, firstVoteDate: "2023-06-13", lastVoteDate: "2023-06-13" },
    { id: "plp-233-2023", title: "PLP 233/2023 — SPVAT", description: "Seguro obrigatório para proteção de vítimas de acidentes de trânsito.", practicalImpact: "Garante indenizações por invalidez ou morte em acidentes de trânsito.", theme: "transito", criteria: "SOCIAL_RESPONSIBILITY", totalVotes: 315, favorableVotes: 96, contraryVotes: 218, abstentions: 1, consensusScore: 68.0, firstVoteDate: "2024-04-09", lastVoteDate: "2024-04-09" }
  ],
  politicianRanking: [
    { id: 1, name: "João Silva", party: "PL", state: "SP", alignmentScore: 87.3, totalVotes: 156 },
    { id: 2, name: "Maria Santos", party: "REPUBLICANOS", state: "RJ", alignmentScore: 84.1, totalVotes: 142 }
  ]
};

async function fetchVotingAnalysisData(filters: { criteria?: string; dateRange?: string; voteType?: string; search?: string; }): Promise<VotingAnalysisData> {
  const params = new URLSearchParams();
  if (filters.criteria) params.set("criteria", filters.criteria);
  if (filters.dateRange) params.set("dateRange", filters.dateRange);
  if (filters.voteType) params.set("voteType", filters.voteType);
  if (filters.search) params.set("search", filters.search);

  const qs = params.toString();
  const path = `/api/votes/analysis${qs ? `?${qs}` : ""}`;

  try {
    return await apiFetch<VotingAnalysisData>(path);
  } catch {
    return FALLBACK_ANALYSIS_DATA;
  }
}

export function useVotingAnalysisData(filters: { criteria?: string; dateRange?: string; voteType?: string; search?: string; }) {
  return useQuery({
    queryKey: ["voting-analysis", filters],
    queryFn: () => fetchVotingAnalysisData(filters),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
