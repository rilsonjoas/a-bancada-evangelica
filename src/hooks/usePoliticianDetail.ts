import { useQuery } from '@tanstack/react-query';

interface PoliticianDetail {
  id: number;
  name: string;
  fullName: string;
  currentParty: string;
  currentState: string;
  currentHouse: string;
  photoUrl: string;
  email?: string;
  birthDate?: string;
  mandates: Array<{
    id: number;
    house: string;
    party: string;
    state: string;
    legislature: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
  }>;
  currentScore?: {
    lifeProtection: number;
    familyValues: number;
    moralIntegrity: number;
    socialResponsibility: number;
    religiousFreedom: number;
    overall: number;
    performanceLevel: string;
    performanceLabel: string;
    performanceDescription: string;
    totalVotes: number;
    consistencyScore: number;
    lastCalculation: string;
  };
  recentVotes: Array<{
    id: string;
    agendaTitle: string;
    vote: string;
    appliedScore: number;
    voteDate: string;
  }>;
  expenseAnalysis: {
    totalValue: number;
    suspiciousValue: number;
    suspiciousPercentage: number;
    integrityScore: number;
    riskLevel: string;
  };
}

async function fetchPoliticianDetail(id: number): Promise<PoliticianDetail> {
  const response = await fetch(`http://localhost:3001/api/politicians/${id}`);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar político: ${response.status}`);
  }
  
  return response.json();
}

export function usePoliticianDetail(id: number) {
  return useQuery({
    queryKey: ['politician', id],
    queryFn: () => fetchPoliticianDetail(id),
    enabled: !!id && id > 0,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  });
}