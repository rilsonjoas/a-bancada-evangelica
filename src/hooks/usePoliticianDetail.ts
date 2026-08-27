import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';

export interface PoliticianDetail {
  id: number;
  name: string;
  fullName: string;
  currentParty: string;
  currentState: string;
  currentHouse: string;
  photoUrl: string;
  isFpeMember?: boolean;
  fpe?: {
    tier?: 'REGISTRADO' | 'AUTODECLARADO' | 'IMPRENSA' | null;
    source?: string | null;
    sourceUrl?: string | null;
    capturedAt?: string | null;
  };
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
    criteria: string;
    vote: string;
    appliedScore: number;
    voteDate: string;
  }>;
  expenseAnalysis: {
    totalValue: number;
    suspiciousValue: number;
    suspiciousCount?: number;
    /** Total de despesas analisadas — 0 = estimativa parcial (party seed) */
    totalCount?: number;
    suspiciousPercentage: number;
    integrityScore: number;
    riskLevel: string;
  };
  /** Financiamento de campanha (TSE 2022) — transparência pura,
   * NÃO afeta a nota. null = sem receita declarada no dataset. */
  campaignFinance: {
    electionYear: number;
    totalReceived: number;
    donationCount: number;
    largestDonation: number;
    donorPfCount: number;
    donorPjCount: number;
    topDonors: Array<{ name: string; doc: string; amount: number; count: number }>;
  } | null;
}

async function fetchPoliticianDetail(id: number): Promise<PoliticianDetail> {
  return apiFetch(`/api/politicians/${id}`);
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