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

async function fetchVotingAnalysisData(filters: { criteria?: string; dateRange?: string; voteType?: string; search?: string; }): Promise<VotingAnalysisData> {
  const params = new URLSearchParams();
  if (filters.criteria) params.set("criteria", filters.criteria);
  if (filters.dateRange) params.set("dateRange", filters.dateRange);
  if (filters.voteType) params.set("voteType", filters.voteType);
  if (filters.search) params.set("search", filters.search);

  const qs = params.toString();
  const path = `/api/votes/analysis${qs ? `?${qs}` : ""}`;

  // GT1 (2026-09-14): remove o FALLBACK_ANALYSIS_DATA que FABRICAVA um
  // dataset inteiro (nomes, contagens) quando a API falhava. Zero
  // fabricado > número inventado: em erro, o React Query expõe `error` e
  // as páginas (Votações/Sobre/Temas) renderizam estado honesto
  // "indisponível"/"vazio", nunca números falsos.
  return await apiFetch<VotingAnalysisData>(path);
}

export function useVotingAnalysisData(filters: { criteria?: string; dateRange?: string; voteType?: string; search?: string; }) {
  return useQuery({
    queryKey: ["voting-analysis", filters],
    queryFn: () => fetchVotingAnalysisData(filters),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}