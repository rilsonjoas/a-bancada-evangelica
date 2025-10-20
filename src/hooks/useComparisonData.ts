import { useQuery } from '@tanstack/react-query';

interface ComparisonPolitician {
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

async function fetchComparisonData(politicianIds: number[]): Promise<ComparisonPolitician[]> {
  if (politicianIds.length === 0) {
    return [];
  }
  
  // Buscar dados de cada político
  const promises = politicianIds.map(async (id) => {
    const response = await fetch(`http://localhost:3001/api/politicians/${id}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar político ${id}: ${response.status}`);
    }
    
    return response.json();
  });
  
  const results = await Promise.allSettled(promises);
  
  // Filtrar apenas os sucessos
  return results
    .filter((result): result is PromiseFulfilledResult<ComparisonPolitician> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}

export function useComparisonData(politicianIds: number[]) {
  return useQuery({
    queryKey: ['comparison', politicianIds.sort().join(',')],
    queryFn: () => fetchComparisonData(politicianIds),
    enabled: politicianIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });
}