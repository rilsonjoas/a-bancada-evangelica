// TypeScript definitions for A Bancada Evangélica

// Interface para dados reais da API
export interface APIPolitician {
  id: number;
  name: string;
  currentParty: string;
  currentState: string;
  currentHouse: 'CAMARA' | 'SENADO';
  photoUrl?: string;
  isFpeMember?: boolean;
  fpe?: {
    tier: 'REGISTRADO' | 'AUTODECLARADO' | 'IMPRENSA';
    source?: string | null;
    sourceUrl?: string | null;
    capturedAt?: string | null;
  };
  scores: {
    lifeProtection: number;
    familyValues: number;
    moralIntegrity: number;
    socialResponsibility: number;
    religiousFreedom: number;
    overall: number;
    performanceLevel: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
    performanceLabel: string;
    performanceDescription?: string;
    totalVotes: number;
    consistencyScore: number;
    // Honestidade de frescor (2026-09-16): passou a ser nullable — político
    // sem cálculo registrado mostra "—", não data inventada de "agora".
    lastCalculation: string | null;
  };
}

// Interface para dados detalhados de um político da API
export interface APIPoliticianDetails extends APIPolitician {
  fullName?: string;
  email?: string;
  birthDate?: string;
  mandates: Array<{
    id: number;
    house: 'CAMARA' | 'SENADO';
    party: string;
    state: string;
    legislature: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
  }>;
  currentScore: APIPolitician['scores'] | null;
  recentVotes: Array<{
    id: string;
    agendaTitle: string;
    criteria: string;
    vote: string;
    appliedScore: number;
    voteDate: string;
    description: string;
    source?: string;
    sourceVoteId?: string | null;
    sourcePropositionId?: string | null;
  }>;
  expenseAnalysis: {
    totalValue: number;
    suspiciousValue: number;
    suspiciousCount: number;
    totalCount: number;
    suspiciousPercentage: number;
    // D6 (2026-09-25): false = não há despesa sincronizada para este
    // parlamentar. Ausência de dado não é gasto normal, e a UI precisa
    // distinguir os dois.
    hasExpenseData: boolean;
    // D3: `integrityScore` foi REMOVIDO de propósito. Ele era preenchido
    // com moral_integrity (score do critério de valores, não uma medida de
    // gasto) e a aba de Gastos o rotulava como se fosse. Ver DECISOES.md D3.
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  // H2 (2026-08-27): votos por critério — base do cálculo
  votesPerCriteria?: Record<string, { count: number; totalImpact: number }>;
}

/** Resposta de GET /api/politicians/:id/expenses/flagged (D2, 2026-09-25) */
export interface FlaggedExpense {
  id: string;
  year: number;
  month: number;
  expenseType: string | null;
  supplierName: string | null;
  hasSupplierDocument: boolean;
  grossValue: number;
  netValue: number;
  refundValue: number | null;
  suspicionScore: number;
  reasons: string[];
  /** Documento oficial publicado pela Casa. null quando não disponível. */
  documentUrl: string | null;
  documentNumber: string;
  source: string;
  isSenado: boolean;
}

export interface FlaggedExpensesResponse {
  flagged: FlaggedExpense[];
  totalFlagged: number;
  totalCount: number;
  hasExpenseData: boolean;
}

// Interface legada (mantida para compatibilidade)
export interface Politician {
  id: string;
  name: string;
  fullName: string;
  party: string;
  state: string;
  house: 'deputado' | 'senador'; // Câmara dos Deputados ou Senado
  photo?: string;
  overallScore: number;
  scores: {
    familyValues: number;      // Defesa da Família (25%)
    lifeProtection: number;    // Proteção à Vida (30%)
    moralIntegrity: number;    // Integridade Moral (20%)
    socialResponsibility: number; // Responsabilidade Social (15%)
    religiousFreedom: number;  // Liberdade Religiosa (10%)
  };
  details: {
    term: string;
    email?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
    };
    biography?: string;
    education?: string;
    profession?: string;
    birthDate?: string;
    birthPlace?: string;
  };
  voting: {
    totalVotes: number;
    alignedVotes: number;
    alignmentPercentage: number;
    keyVotes: KeyVote[];
  };
  projects: {
    authored: number;
    coAuthored: number;
    keyProjects: LegislativeProject[];
  };
  transparency: {
    expensesScore: number;
    attendanceScore: number;
    declarationScore: number;
  };
}

// Interfaces para respostas da API
export interface APIResponse<T> {
  data: T;
  total?: number;
  hasMore?: boolean;
}

export interface PoliticiansResponse {
  politicians: APIPolitician[];
  total: number;
  hasMore: boolean;
  filters: {
    search?: string;
    state?: string;
    party?: string;
    house?: string;
    performanceLevel?: string;
    minScore?: string;
    maxScore?: string;
  };
  stats: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
    byState: Record<string, number>;
    byParty: Record<string, number>;
  };
}

export interface RankingResponse {
  politician: {
    id: number;
    name: string;
    currentParty: string;
    currentState: string;
    currentHouse: 'CAMARA' | 'SENADO';
    photoUrl?: string;
  };
  score: APIPolitician['scores'];
  position: number;
}

export interface StatsResponse {
  totalPoliticians: number;
  /** Ativos cuja nota veio de votos nominais próprios (total_votes > 0
   * no último score) — os demais são estimativa pela média do partido */
  withOwnVotes?: number;
  /** Média global dos ativos (stats.service.overview) — fonte única
   * da "Nota Média" desde o fix 86.3-vs-65.8 de 2026-08-21 */
  averageScore?: number;
  performanceDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
  houseDistribution: {
    camara: number;
    senado: number;
  };
}

export interface KeyVote {
  id: string;
  title: string;
  description: string;
  date: string;
  vote: 'sim' | 'não' | 'abstenção' | 'ausente';
  alignedWithCriteria: boolean;
  weight: number;
  category: 'familyValues' | 'lifeProtection' | 'moralIntegrity' | 'socialResponsibility' | 'religiousFreedom';
}

export interface LegislativeProject {
  id: string;
  title: string;
  description: string;
  status: 'proposto' | 'em_tramitacao' | 'aprovado' | 'rejeitado' | 'arquivado';
  year: number;
  category: string;
  alignedWithCriteria: boolean;
  impact: 'alto' | 'medio' | 'baixo';
}

export interface FilterOptions {
  search: string;
  state: string;
  party: string;
  house: 'all' | 'deputado' | 'senador';
  minScore: number;
  maxScore: number;
  sortBy: 'score' | 'name' | 'state' | 'party';
  sortOrder: 'asc' | 'desc';
}

export interface ScoreBreakdown {
  category: string;
  score: number;
  weight: number;
  weightedScore: number;
  description: string;
  color: string;
}

// Utility types
export type ScoreCategory = keyof Politician['scores'];
export type VoteType = KeyVote['vote'];
export type ProjectStatus = LegislativeProject['status'];
export type SortOption = FilterOptions['sortBy'];

// Constants
export const SCORE_WEIGHTS = {
  familyValues: 0.25,      // 25%
  lifeProtection: 0.30,    // 30%
  moralIntegrity: 0.20,    // 20%
  socialResponsibility: 0.15, // 15%
  religiousFreedom: 0.10   // 10%
} as const;

export const SCORE_CATEGORIES = {
  familyValues: 'Defesa da Família',
  lifeProtection: 'Proteção à Vida',
  moralIntegrity: 'Integridade Moral',
  socialResponsibility: 'Responsabilidade Social',
  religiousFreedom: 'Liberdade Religiosa'
} as const;

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;

export type BrazilianState = typeof BRAZILIAN_STATES[number];