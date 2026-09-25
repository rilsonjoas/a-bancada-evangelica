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
    lastCalculation: string | null;
  };
  recentVotes: Array<{
    id: string;
    agendaTitle: string;
    criteria: string;
    vote: string;
    appliedScore: number;
    voteDate: string;
    description?: string;
    source?: string;
    sourceVoteId?: string | null;
    sourcePropositionId?: string | null;
  }>;
  expenseAnalysis: {
    totalValue: number;
    suspiciousValue: number;
    suspiciousCount: number;
    /** Total de despesas analisadas — 0 = sem dado de despesa no acervo. */
    totalCount: number;
    suspiciousPercentage: number;
    /** D6 (2026-09-25): false = sem despesa sincronizada. Ausência de dado
     *  não é gasto normal, e a UI precisa distinguir os dois. */
    hasExpenseData: boolean;
    /** D3 (2026-09-25): `integrityScore` foi REMOVIDO de propósito — a API
     *  preenchia com moral_integrity (score do critério de valores, não uma
     *  medida de gasto) e a UI o rotulava como se fosse. Ver DECISOES.md. */
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  // H2 (2026-08-27): votos por critério
  /**
   * Base de cálculo por critério.
   *
   * `count` = número de ASSUNTOS distintos (títulos de pauta únicos) — é o
   * que sustenta a nota agora que a média é por assunto, e é o que a UI
   * mostra. `votes` = linhas de voto, que pode ser bem maior quando a mesma
   * proposição foi votada em várias sessões.
   */
  votesPerCriteria?: Record<string, { count: number; totalImpact: number; votes?: number }>;
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