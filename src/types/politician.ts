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
    lastCalculation: string;
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
  }>;
  expenseAnalysis: {
    totalValue: number;
    suspiciousValue: number;
    suspiciousPercentage: number;
    integrityScore: number;
    riskLevel: string;
  };
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