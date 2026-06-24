// Servidor de API simples para servir dados do banco
import express from 'express';
import cors from 'cors';
import { prisma } from '@/lib/prisma';

const app = express();
const PORT = process.env.PORT ?? 3001;

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:8080', 'http://127.0.0.1:8080'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(express.json());

// ========================================
// HEALTHCHECK
// ========================================

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========================================
// POLITICIANS ENDPOINTS
// ========================================

// GET /api/politicians - Lista de políticos com filtros
app.get('/api/politicians', async (req, res) => {
  try {
    const {
      search,
      state,
      party,
      house,
      performanceLevel,
      minScore,
      maxScore,
      limit = '50',
      offset = '0',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const whereClause: any = {
      is_active: true,
    };

    // Filtros
    if (search) {
      whereClause.name = {
        contains: search as string,
        mode: 'insensitive'
      };
    }

    if (state) {
      whereClause.current_state = state;
    }

    if (party) {
      whereClause.current_party = party;
    }

    if (house) {
      whereClause.current_house = house;
    }

    // Filtro por pontuação (precisa ser feito via relacionamento)
    const scoreFilter: any = {};
    if (performanceLevel) {
      scoreFilter.some = { performance_level: performanceLevel };
    }
    if (minScore || maxScore) {
      const scoreRange: any = {};
      if (minScore) scoreRange.gte = parseFloat(minScore as string);
      if (maxScore) scoreRange.lte = parseFloat(maxScore as string);
      scoreFilter.some = { ...scoreFilter.some, overall_score: scoreRange };
    }

    const politicians = await prisma.politician.findMany({
      where: {
        ...whereClause,
        ...(Object.keys(scoreFilter).length > 0 && {
          scores: scoreFilter
        })
      },
      include: {
        scores: {
          take: 1, // Só o primeiro/único score
          orderBy: { created_at: 'desc' }
        },
        mandates: {
          where: { is_current: true },
          take: 1
        }
      },
      orderBy: sortBy === 'name' 
        ? { name: sortOrder as 'asc' | 'desc' }
        : { id: 'asc' }, // Ordenação simples por enquanto
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    // Contar total para paginação
    const total = await prisma.politician.count({
      where: {
        ...whereClause,
        ...(Object.keys(scoreFilter).length > 0 && {
          scores: scoreFilter
        })
      }
    });

    // Estatísticas
    const stats = await prisma.politicianScore.groupBy({
      by: ['performance_level'],
      _count: true,
    });

    const statsFormatted = {
      excellent: stats.find(s => s.performance_level === 'EXCELLENT')?._count || 0,
      good: stats.find(s => s.performance_level === 'GOOD')?._count || 0,
      average: stats.find(s => s.performance_level === 'AVERAGE')?._count || 0,
      poor: stats.find(s => s.performance_level === 'POOR')?._count || 0,
      byState: {}, // TODO: implementar
      byParty: {}, // TODO: implementar
    };


    // Formatar resposta
    const response = {
      politicians: politicians.map(p => ({
        id: p.id,
        name: p.name,
        currentParty: p.current_party,
        currentState: p.current_state,
        currentHouse: p.current_house,
        photoUrl: p.photo_url,
        scores: (() => {
          const score = p.scores && p.scores.length > 0 ? p.scores[0] : null;
          if (score) {
            return {
              lifeProtection: score.life_protection || 0,
              familyValues: score.family_values || 0,
              moralIntegrity: score.moral_integrity || 0,
              socialResponsibility: score.social_responsibility || 0,
              religiousFreedom: score.religious_freedom || 0,
              overall: score.overall_score || 0,
              performanceLevel: score.performance_level || 'AVERAGE',
              performanceLabel: score.performance_label || 'Médio',
              performanceDescription: score.performance_description || 'Sem dados suficientes',
              totalVotes: score.total_votes || 0,
              consistencyScore: score.consistency_score || 0,
              lastCalculation: score.last_calculation?.toISOString() || new Date().toISOString(),
            };
          } else {
            return {
              lifeProtection: 50,
              familyValues: 50,
              moralIntegrity: 50,
              socialResponsibility: 50,
              religiousFreedom: 50,
              overall: 50,
              performanceLevel: 'AVERAGE',
              performanceLabel: 'Sem Dados',
              performanceDescription: 'Aguardando análise',
              totalVotes: 0,
              consistencyScore: 0,
              lastCalculation: new Date().toISOString(),
            };
          }
        })()
      })),
      total,
      hasMore: (parseInt(offset as string) + politicians.length) < total,
      filters: { search, state, party, house, performanceLevel, minScore, maxScore },
      stats: statsFormatted,
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar políticos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/politicians/ranking - Ranking de políticos
app.get('/api/politicians/ranking', async (req, res) => {
  try {
    const {
      house,
      state,
      party,
      limit = '50',
      criteria = 'overall'
    } = req.query;

    const whereClause: any = {
      is_active: true,
    };

    if (house) whereClause.current_house = house;
    if (state) whereClause.current_state = state;
    if (party) whereClause.current_party = party;

    // Definir campo de ordenação baseado no critério
    const orderField = criteria === 'overall' ? 'overall_score' : 
                      criteria === 'lifeProtection' ? 'life_protection' :
                      criteria === 'familyValues' ? 'family_values' :
                      criteria === 'moralIntegrity' ? 'moral_integrity' :
                      criteria === 'socialResponsibility' ? 'social_responsibility' :
                      criteria === 'religiousFreedom' ? 'religious_freedom' : 'overall_score';

    // Buscar políticos com scores, depois ordenar em memória
    const politicians = await prisma.politician.findMany({
      where: whereClause,
      include: {
        scores: {
          take: 1,
          orderBy: { created_at: 'desc' }
        },
      },
      take: parseInt(limit as string) * 2, // Buscar mais para compensar a ordenação
    });

    // Ordenar por score em memória
    const sortedPoliticians = politicians
      .filter(p => p.scores && p.scores[0]) // Só políticos com score
      .sort((a, b) => {
        const scoreA = a.scores![0][orderField as keyof typeof a.scores[0]] as number;
        const scoreB = b.scores![0][orderField as keyof typeof b.scores[0]] as number;
        return scoreB - scoreA; // Decrescente
      })
      .slice(0, parseInt(limit as string)); // Limitar resultado

    const response = sortedPoliticians.map((p, index) => ({
      politician: {
        id: p.id,
        name: p.name,
        currentParty: p.current_party,
        currentState: p.current_state,
        currentHouse: p.current_house,
        photoUrl: p.photo_url,
      },
      score: p.scores && p.scores.length > 0 ? {
        lifeProtection: p.scores[0].life_protection,
        familyValues: p.scores[0].family_values,
        moralIntegrity: p.scores[0].moral_integrity,
        socialResponsibility: p.scores[0].social_responsibility,
        religiousFreedom: p.scores[0].religious_freedom,
        overall: p.scores[0].overall_score,
        performanceLevel: p.scores[0].performance_level,
        performanceLabel: p.scores[0].performance_label,
        totalVotes: p.scores[0].total_votes,
        consistencyScore: p.scores[0].consistency_score,
      } : null,
      position: index + 1,
    }));

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/politicians/:id - Detalhes de um político
app.get('/api/politicians/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const politician = await prisma.politician.findUnique({
      where: { id: parseInt(id) },
      include: {
        scores: {
          take: 1,
          orderBy: { created_at: 'desc' }
        },
        mandates: true,
        votes: {
          include: {
            key_agenda: true
          },
          orderBy: { vote_date: 'desc' },
          take: 10 // Últimas 10 votações
        }
      }
    });

    if (!politician) {
      return res.status(404).json({ error: 'Político não encontrado' });
    }

    const response = {
      id: politician.id,
      name: politician.name,
      fullName: politician.full_name,
      currentParty: politician.current_party,
      currentState: politician.current_state,
      currentHouse: politician.current_house,
      photoUrl: politician.photo_url,
      email: politician.email,
      birthDate: politician.birth_date?.toISOString(),
      mandates: politician.mandates.map(m => ({
        id: m.id,
        house: m.house,
        party: m.party,
        state: m.state,
        legislature: m.legislature,
        startDate: m.start_date.toISOString(),
        endDate: m.end_date?.toISOString(),
        isCurrent: m.is_current,
      })),
      currentScore: politician.scores && politician.scores.length > 0 ? {
        lifeProtection: politician.scores[0].life_protection,
        familyValues: politician.scores[0].family_values,
        moralIntegrity: politician.scores[0].moral_integrity,
        socialResponsibility: politician.scores[0].social_responsibility,
        religiousFreedom: politician.scores[0].religious_freedom,
        overall: politician.scores[0].overall_score,
        performanceLevel: politician.scores[0].performance_level,
        performanceLabel: politician.scores[0].performance_label,
        performanceDescription: politician.scores[0].performance_description,
        lastCalculation: politician.scores[0].last_calculation?.toISOString() || new Date().toISOString(),
      } : null,
      recentVotes: politician.votes.map(v => ({
        id: v.id,
        agendaTitle: v.key_agenda.title,
        vote: v.vote_type,
        appliedScore: v.applied_score,
        voteDate: v.vote_date.toISOString(),
      })),
      expenseAnalysis: {
        totalValue: 0, // TODO: implementar
        suspiciousValue: 0,
        suspiciousPercentage: 0,
        integrityScore: politician.scores && politician.scores.length > 0 ? politician.scores[0].moral_integrity || 0 : 0,
        riskLevel: 'LOW',
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar político:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ========================================
// STATS ENDPOINTS
// ========================================

// ========================================
// METHODOLOGY ENDPOINTS
// ========================================

// GET /api/methodology/pillars - Lista dos pilares da metodologia
app.get('/api/methodology/pillars', async (req, res) => {
  try {
    const pillars = await prisma.methodologyPillar.findMany({
      where: { is_active: true },
      orderBy: { order: 'asc' }
    });

    res.json(pillars);
  } catch (error) {
    console.error('Erro ao buscar pilares da metodologia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/methodology/content - Conteúdo da metodologia
app.get('/api/methodology/content', async (req, res) => {
  try {
    const content = await prisma.methodologyContent.findMany({
      where: { is_active: true },
      orderBy: { order: 'asc' }
    });

    res.json(content);
  } catch (error) {
    console.error('Erro ao buscar conteúdo da metodologia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/methodology/full - Metodologia completa (pilares + conteúdo)
app.get('/api/methodology/full', async (req, res) => {
  try {
    const [pillars, content] = await Promise.all([
      prisma.methodologyPillar.findMany({
        where: { is_active: true },
        orderBy: { order: 'asc' }
      }),
      prisma.methodologyContent.findMany({
        where: { is_active: true },
        orderBy: { order: 'asc' }
      })
    ]);

    res.json({
      pillars,
      content,
      totalWeight: pillars.reduce((sum, pillar) => sum + pillar.weight, 0)
    });
  } catch (error) {
    console.error('Erro ao buscar metodologia completa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ========================================
// STATS ENDPOINTS
// ========================================

// GET /api/stats/overview - Estatísticas gerais
app.get('/api/stats/overview', async (req, res) => {
  try {
    const totalPoliticians = await prisma.politician.count({
      where: { is_active: true }
    });

    const performanceStats = await prisma.politicianScore.groupBy({
      by: ['performance_level'],
      _count: true,
    });

    const houseStats = await prisma.politician.groupBy({
      by: ['current_house'],
      where: { is_active: true },
      _count: true,
    });

    const response = {
      totalPoliticians,
      performanceDistribution: {
        excellent: performanceStats.find(s => s.performance_level === 'EXCELLENT')?._count || 0,
        good: performanceStats.find(s => s.performance_level === 'GOOD')?._count || 0,
        average: performanceStats.find(s => s.performance_level === 'AVERAGE')?._count || 0,
        poor: performanceStats.find(s => s.performance_level === 'POOR')?._count || 0,
      },
      houseDistribution: {
        camara: houseStats.find(s => s.current_house === 'CAMARA')?._count || 0,
        senado: houseStats.find(s => s.current_house === 'SENADO')?._count || 0,
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 API Server rodando em http://localhost:${PORT}`);
  console.log(`📊 Endpoints disponíveis:`);
  console.log(`   GET /api/politicians`);
  console.log(`   GET /api/politicians/ranking`);
  console.log(`   GET /api/politicians/:id`);
  console.log(`   GET /api/stats/overview`);
  console.log(`   GET /api/methodology/pillars`);
  console.log(`   GET /api/methodology/content`);
  console.log(`   GET /api/methodology/full`);
});

export default app;