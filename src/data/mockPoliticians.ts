import { Politician } from '@/types/politician';

// Mock data for demonstration - in production this would come from APIs
export const mockPoliticians: Politician[] = [
  {
    id: '1',
    name: 'João Silva',
    fullName: 'João Carlos Silva Santos',
    party: 'PSL',
    state: 'SP',
    house: 'deputado',
    photo: undefined,
    overallScore: 87.3,
    scores: {
      familyValues: 90.0,
      lifeProtection: 92.5,
      moralIntegrity: 85.0,
      socialResponsibility: 78.0,
      religiousFreedom: 88.0
    },
    details: {
      term: '2023-2027',
      email: 'joao.silva@camara.leg.br',
      biography: 'Pastor evangélico e empresário, defensor dos valores familiares.',
      education: 'Teologia - Faculdade Teológica Batista',
      profession: 'Pastor e Empresário',
      birthDate: '1975-03-15',
      birthPlace: 'Campinas, SP'
    },
    voting: {
      totalVotes: 156,
      alignedVotes: 142,
      alignmentPercentage: 91,
      keyVotes: []
    },
    projects: {
      authored: 8,
      coAuthored: 12,
      keyProjects: []
    },
    transparency: {
      expensesScore: 85,
      attendanceScore: 92,
      declarationScore: 88
    }
  },
  {
    id: '2',
    name: 'Maria Santos',
    fullName: 'Maria José dos Santos',
    party: 'REPUBLICANOS',
    state: 'RJ',
    house: 'deputado',
    photo: undefined,
    overallScore: 84.1,
    scores: {
      familyValues: 88.0,
      lifeProtection: 90.0,
      moralIntegrity: 82.0,
      socialResponsibility: 75.0,
      religiousFreedom: 85.0
    },
    details: {
      term: '2023-2027',
      email: 'maria.santos@camara.leg.br',
      biography: 'Advogada e missionária, defensora dos direitos da família.',
      education: 'Direito - UERJ',
      profession: 'Advogada',
      birthDate: '1968-07-22',
      birthPlace: 'Rio de Janeiro, RJ'
    },
    voting: {
      totalVotes: 148,
      alignedVotes: 128,
      alignmentPercentage: 86,
      keyVotes: []
    },
    projects: {
      authored: 5,
      coAuthored: 15,
      keyProjects: []
    },
    transparency: {
      expensesScore: 90,
      attendanceScore: 88,
      declarationScore: 85
    }
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    fullName: 'Carlos Roberto de Oliveira',
    party: 'PL',
    state: 'MG',
    house: 'senador',
    photo: undefined,
    overallScore: 79.8,
    scores: {
      familyValues: 85.0,
      lifeProtection: 88.0,
      moralIntegrity: 75.0,
      socialResponsibility: 72.0,
      religiousFreedom: 82.0
    },
    details: {
      term: '2019-2027',
      email: 'carlos.oliveira@senado.leg.br',
      biography: 'Médico e líder comunitário cristão.',
      education: 'Medicina - UFMG',
      profession: 'Médico',
      birthDate: '1962-11-08',
      birthPlace: 'Belo Horizonte, MG'
    },
    voting: {
      totalVotes: 89,
      alignedVotes: 71,
      alignmentPercentage: 80,
      keyVotes: []
    },
    projects: {
      authored: 12,
      coAuthored: 8,
      keyProjects: []
    },
    transparency: {
      expensesScore: 78,
      attendanceScore: 85,
      declarationScore: 82
    }
  },
  {
    id: '4',
    name: 'Ana Costa',
    fullName: 'Ana Luiza Costa Ferreira',
    party: 'UNIÃO',
    state: 'RS',
    house: 'deputado',
    photo: undefined,
    overallScore: 76.5,
    scores: {
      familyValues: 82.0,
      lifeProtection: 85.0,
      moralIntegrity: 70.0,
      socialResponsibility: 68.0,
      religiousFreedom: 78.0
    },
    details: {
      term: '2023-2027',
      email: 'ana.costa@camara.leg.br',
      biography: 'Educadora cristã e defensora dos valores tradicionais.',
      education: 'Pedagogia - PUC-RS',
      profession: 'Educadora',
      birthDate: '1973-09-12',
      birthPlace: 'Porto Alegre, RS'
    },
    voting: {
      totalVotes: 145,
      alignedVotes: 108,
      alignmentPercentage: 74,
      keyVotes: []
    },
    projects: {
      authored: 6,
      coAuthored: 11,
      keyProjects: []
    },
    transparency: {
      expensesScore: 82,
      attendanceScore: 76,
      declarationScore: 80
    }
  },
  {
    id: '5',
    name: 'Pedro Almeida',
    fullName: 'Pedro Henrique de Almeida',
    party: 'PP',
    state: 'GO',
    house: 'deputado',
    photo: undefined,
    overallScore: 72.3,
    scores: {
      familyValues: 78.0,
      lifeProtection: 80.0,
      moralIntegrity: 68.0,
      socialResponsibility: 65.0,
      religiousFreedom: 75.0
    },
    details: {
      term: '2023-2027',
      email: 'pedro.almeida@camara.leg.br',
      biography: 'Empresário do agronegócio e líder da bancada evangélica.',
      education: 'Administração - UFG',
      profession: 'Empresário',
      birthDate: '1970-05-30',
      birthPlace: 'Goiânia, GO'
    },
    voting: {
      totalVotes: 152,
      alignedVotes: 95,
      alignmentPercentage: 62,
      keyVotes: []
    },
    projects: {
      authored: 4,
      coAuthored: 9,
      keyProjects: []
    },
    transparency: {
      expensesScore: 75,
      attendanceScore: 82,
      declarationScore: 72
    }
  },
  {
    id: '6',
    name: 'Lucia Fernandes',
    fullName: 'Lucia Maria Fernandes da Silva',
    party: 'PODE',
    state: 'BA',
    house: 'deputado',
    photo: undefined,
    overallScore: 68.9,
    scores: {
      familyValues: 75.0,
      lifeProtection: 78.0,
      moralIntegrity: 62.0,
      socialResponsibility: 60.0,
      religiousFreedom: 72.0
    },
    details: {
      term: '2023-2027',
      email: 'lucia.fernandes@camara.leg.br',
      biography: 'Assistente social e ativista cristã.',
      education: 'Serviço Social - UFBA',
      profession: 'Assistente Social',
      birthDate: '1965-12-03',
      birthPlace: 'Salvador, BA'
    },
    voting: {
      totalVotes: 138,
      alignedVotes: 82,
      alignmentPercentage: 59,
      keyVotes: []
    },
    projects: {
      authored: 3,
      coAuthored: 7,
      keyProjects: []
    },
    transparency: {
      expensesScore: 72,
      attendanceScore: 68,
      declarationScore: 75
    }
  }
];

// Helper function to get politicians with pagination
export const getPoliticians = (
  page: number = 1,
  limit: number = 10,
  filters?: Partial<{ search: string; state: string; party: string; house: string }>
): { politicians: Politician[]; total: number; pages: number } => {
  let filteredPoliticians = [...mockPoliticians];

  // Apply filters
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    filteredPoliticians = filteredPoliticians.filter(p => 
      p.name.toLowerCase().includes(search) ||
      p.fullName.toLowerCase().includes(search) ||
      p.party.toLowerCase().includes(search)
    );
  }

  if (filters?.state && filters.state !== 'all') {
    filteredPoliticians = filteredPoliticians.filter(p => p.state === filters.state);
  }

  if (filters?.party && filters.party !== 'all') {
    filteredPoliticians = filteredPoliticians.filter(p => p.party === filters.party);
  }

  if (filters?.house && filters.house !== 'all') {
    filteredPoliticians = filteredPoliticians.filter(p => p.house === filters.house);
  }

  // Sort by overall score (descending)
  filteredPoliticians.sort((a, b) => b.overallScore - a.overallScore);

  const total = filteredPoliticians.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    politicians: filteredPoliticians.slice(start, end),
    total,
    pages
  };
};

// Helper function to get unique values for filters
export const getFilterOptions = () => {
  const states = [...new Set(mockPoliticians.map(p => p.state))].sort();
  const parties = [...new Set(mockPoliticians.map(p => p.party))].sort();
  
  return { states, parties };
};