// TypeScript definitions for A Bancada Evangélica

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