import { useQuery } from '@tanstack/react-query';

export interface EstimatedPolitician {
  id: number;
  name: string;
  currentParty: string;
  currentState: string;
  currentHouse: string;
  estimatedScore: number | null;
}

export interface EstimatedScoresData {
  totalPoliticians: number;
  withOwnVotes: number;
  estimatedCount: number;
  averageScore: number;
  estimated: EstimatedPolitician[];
}

/**
 * CEPT2-7 (2026-09-16): quem tem "nota estimada por partido" hoje — vivo,
 * via API. A Metodologia usa isso pra deixar qualquer um conferir a lista
 * dos políticos que ainda não têm voto próprio registrado.
 */
export function useEstimatedScores() {
  return useQuery<EstimatedScoresData>({
    queryKey: ['estimatedScores'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stats/estimated-scores`);
      if (!res.ok) throw new Error(`estimated-scores → ${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}