import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

export interface ComparisonPolitician {
  id: number;
  name: string;
  fullName: string;
  currentParty: string;
  currentState: string;
  currentHouse: string;
  photoUrl: string;
  email?: string;
  currentScore?: {
    lifeProtection: number;
    familyValues: number;
    moralIntegrity: number;
    socialResponsibility: number;
    religiousFreedom: number;
    overall: number;
    performanceLevel: string;
    performanceLabel: string;
    totalVotes: number;
    consistencyScore: number;
  };
}

// Auditoria anti-fabricação (2026-09-15): este hook costumava devolver
// parlamentares SINTÉTICOS ("João Silva", "Parlamentar #N" com nota 80)
// quando a API falhava — violação direta da regra "0 honesto > número
// fabricado". Agora o erro propaga pro React Query e a página renderiza
// estado honesto de indisponibilidade, nunca pessoas/números inventados.
async function fetchComparisonData(politicianIds: number[]): Promise<ComparisonPolitician[]> {
  if (politicianIds.length === 0) return [];

  const promises = politicianIds.map((id) =>
    apiFetch<ComparisonPolitician>(`/api/politicians/${id}`)
  );

  return Promise.all(promises);
}

export function useComparisonData(politicianIds: number[]) {
  return useQuery({
    queryKey: ["comparison", politicianIds.sort().join(",")],
    queryFn: () => fetchComparisonData(politicianIds),
    enabled: politicianIds.length > 0,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
