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

const MOCK_COMPARISON_ITEMS: Record<number, ComparisonPolitician> = {
  1: {
    id: 1, name: "João Silva", fullName: "João Carlos Silva Santos", currentParty: "PL", currentState: "SP", currentHouse: "camara", photoUrl: "",
    currentScore: { lifeProtection: 92.5, familyValues: 90.0, moralIntegrity: 85.0, socialResponsibility: 78.0, religiousFreedom: 88.0, overall: 87.3, performanceLevel: "EXCELLENT", performanceLabel: "Aderência muito alta", totalVotes: 156, consistencyScore: 91 }
  },
  2: {
    id: 2, name: "Maria Santos", fullName: "Maria José dos Santos", currentParty: "REPUBLICANOS", currentState: "RJ", currentHouse: "camara", photoUrl: "",
    currentScore: { lifeProtection: 90.0, familyValues: 88.0, moralIntegrity: 82.0, socialResponsibility: 75.0, religiousFreedom: 85.0, overall: 84.1, performanceLevel: "EXCELLENT", performanceLabel: "Aderência muito alta", totalVotes: 142, consistencyScore: 89 }
  },
  3: {
    id: 3, name: "Pedro Oliveira", fullName: "Pedro Henrique Oliveira", currentParty: "PP", currentState: "MG", currentHouse: "camara", photoUrl: "",
    currentScore: { lifeProtection: 78.0, familyValues: 75.0, moralIntegrity: 70.0, socialResponsibility: 65.0, religiousFreedom: 72.0, overall: 72.5, performanceLevel: "GOOD", performanceLabel: "Aderência alta", totalVotes: 120, consistencyScore: 82 }
  }
};

async function fetchComparisonData(politicianIds: number[]): Promise<ComparisonPolitician[]> {
  if (politicianIds.length === 0) return [];
  
  const promises = politicianIds.map(async (id) => {
    try {
      return await apiFetch<ComparisonPolitician>(`/api/politicians/${id}`);
    } catch {
      return MOCK_COMPARISON_ITEMS[id] || {
        id,
        name: `Parlamentar #${id}`,
        fullName: `Deputado Federal #${id}`,
        currentParty: "PL",
        currentState: "SP",
        currentHouse: "camara",
        photoUrl: "",
        currentScore: { lifeProtection: 80, familyValues: 80, moralIntegrity: 80, socialResponsibility: 80, religiousFreedom: 80, overall: 80, performanceLevel: "GOOD", performanceLabel: "Aderência alta", totalVotes: 100, consistencyScore: 85 }
      };
    }
  });

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
