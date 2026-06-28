// Servidor de API simples para servir dados do banco
import express from 'express';
import cors from 'cors';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const app = express();
const PORT = process.env.PORT ?? 3001;

console.log('[startup] NODE_ENV:', process.env.NODE_ENV);
console.log('[startup] DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('[startup] DATABASE_URL prefix:', process.env.DATABASE_URL?.slice(0, 40) ?? 'UNDEFINED');

// API pública de leitura — sem cookies/sessão, origin aberta é seguro
app.use(cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
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
      fpeFilter,
      limit = '50',
      offset = '0',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const whereClause: Prisma.PoliticianWhereInput = {
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

    if (fpeFilter === 'true') {
      whereClause.is_fpe_member = true;
    }

    // Filtro por pontuação (precisa ser feito via relacionamento)
    const scoreFilter: Prisma.PoliticianScoreListRelationFilter = {};
    if (performanceLevel) {
      scoreFilter.some = { performance_level: performanceLevel as Prisma.EnumPerformanceLevelFilter };
    }
    if (minScore || maxScore) {
      const scoreRange: Prisma.FloatFilter = {};
      if (minScore) scoreRange.gte = parseFloat(minScore as string);
      if (maxScore) scoreRange.lte = parseFloat(maxScore as string);
      scoreFilter.some = { ...scoreFilter.some, overall_score: scoreRange };
    }

    const queryWhere = {
      ...whereClause,
      ...(Object.keys(scoreFilter).length > 0 && { scores: scoreFilter })
    };

    const takeN = parseInt(limit as string);
    const skipN = parseInt(offset as string);

    // Quando sortBy === 'score', buscar todos e ordenar em JS
    // (Prisma não suporta orderBy em 1-to-many sem raw query)
    let politicians;
    if (sortBy === 'score') {
      const all = await prisma.politician.findMany({
        where: queryWhere,
        include: {
          scores: { take: 1, orderBy: { created_at: 'desc' } },
          mandates: { where: { is_current: true }, take: 1 }
        },
      });
      const dir = sortOrder === 'desc' ? -1 : 1;
      all.sort((a, b) =>
        dir * ((a.scores[0]?.overall_score ?? 0) - (b.scores[0]?.overall_score ?? 0))
      );
      politicians = all.slice(skipN, skipN + takeN);
    } else {
      politicians = await prisma.politician.findMany({
        where: queryWhere,
        include: {
          scores: { take: 1, orderBy: { created_at: 'desc' } },
          mandates: { where: { is_current: true }, take: 1 }
        },
        orderBy: { name: sortOrder as 'asc' | 'desc' },
        take: takeN,
        skip: skipN,
      });
    }

    // Contar total para paginação
    const total = await prisma.politician.count({ where: queryWhere });

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
        isFpeMember: p.is_fpe_member ?? false,
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

    const whereClause: Prisma.PoliticianWhereInput = {
      is_active: true,
    };

    if (house) whereClause.current_house = house as Prisma.EnumHouseTypeFilter;
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

    const [politician, expenseAgg] = await Promise.all([
      prisma.politician.findUnique({
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
            take: 10
          }
        }
      }),
      prisma.expense.aggregate({
        where: { politician_id: parseInt(id) },
        _sum: { net_value: true },
        _count: { id: true },
      }).then(async agg => {
        const suspicious = await prisma.expense.aggregate({
          where: { politician_id: parseInt(id), is_suspicious: true },
          _sum: { net_value: true },
          _count: { id: true },
        });
        return { agg, suspicious };
      })
    ]);

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
        totalVotes: politician.scores[0].total_votes,
        consistencyScore: politician.scores[0].consistency_score,
        lastCalculation: politician.scores[0].last_calculation?.toISOString() || new Date().toISOString(),
      } : null,
      recentVotes: politician.votes.map(v => ({
        id: v.id,
        agendaTitle: v.key_agenda.title,
        criteria: v.key_agenda.criteria,
        vote: v.vote_type,
        appliedScore: v.applied_score,
        voteDate: v.vote_date.toISOString(),
        description: v.voting_description ?? v.key_agenda.description ?? '',
      })),
      expenseAnalysis: (() => {
        const totalValue = expenseAgg.agg._sum.net_value ?? 0;
        const suspiciousValue = expenseAgg.suspicious._sum.net_value ?? 0;
        const suspiciousPercentage = totalValue > 0 ? (suspiciousValue / totalValue) * 100 : 0;
        const integrityScore = politician.scores?.[0]?.moral_integrity ?? 0;
        return {
          totalValue,
          suspiciousValue,
          suspiciousCount: expenseAgg.suspicious._count.id,
          totalCount: expenseAgg.agg._count.id,
          suspiciousPercentage: Math.round(suspiciousPercentage * 10) / 10,
          integrityScore,
          riskLevel: suspiciousPercentage > 10 ? 'HIGH' : suspiciousPercentage > 5 ? 'MEDIUM' : 'LOW',
        };
      })()
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar político:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ========================================
// VOTES ANALYSIS ENDPOINT
// ========================================

// GET /api/votes/analysis - Análise agregada de votações
app.get('/api/votes/analysis', async (_req, res) => {
  try {
    const [totalVotes, agendas, alignment, stats] = await Promise.all([
      prisma.vote.count(),
      prisma.keyAgenda.findMany({ where: { status: 'ACTIVE' } }),
      prisma.$queryRaw<Array<{ alignment_level: string; count: bigint }>>`
        SELECT ps.performance_level AS alignment_level, COUNT(*)::bigint
        FROM politician_scores ps
        JOIN politicians p ON p.id = ps.politician_id
        WHERE p.is_active = true
        GROUP BY ps.performance_level
      `,
      prisma.politicianScore.aggregate({ _avg: { overall_score: true } }),
    ]);

    const voteByCriteriaRaw = await prisma.vote.groupBy({
      by: ['key_agenda_id'],
      _count: { id: true },
    });

    const agendasWithCriteria = await Promise.all(
      voteByCriteriaRaw.map(async (v) => {
        const agenda = await prisma.keyAgenda.findUnique({ where: { id: v.key_agenda_id } });
        return { criteria: agenda?.criteria ?? 'UNKNOWN', count: v._count.id };
      })
    );

    const voteByCriteria: Record<string, number> = {};
    for (const item of agendasWithCriteria) {
      voteByCriteria[item.criteria] = (voteByCriteria[item.criteria] || 0) + item.count;
    }

    // Últimas votações agrupadas por mês
    const recentVotes = await prisma.vote.findMany({
      select: { vote_date: true, vote_type: true },
      orderBy: { vote_date: 'desc' },
      take: 2000,
    });

    const monthlyMap = new Map<string, { favorable: number; contrary: number; abstentions: number }>();
    for (const v of recentVotes) {
      const month = v.vote_date.toISOString().slice(0, 7);
      const entry = monthlyMap.get(month) ?? { favorable: 0, contrary: 0, abstentions: 0 };
      if (v.vote_type === 'YES') entry.favorable++;
      else if (v.vote_type === 'NO') entry.contrary++;
      else entry.abstentions++;
      monthlyMap.set(month, entry);
    }

    const timelineTrends = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([date, counts]) => ({
        date,
        favorableVotes: counts.favorable,
        contraryVotes: counts.contrary,
        abstentions: counts.abstentions,
      }));

    const alignmentStats = {
      high: Number(alignment.find(a => a.alignment_level === 'EXCELLENT')?.count ?? 0),
      medium: Number(alignment.find(a => a.alignment_level === 'GOOD')?.count ?? 0),
      low: Number(alignment.find(a => a.alignment_level === 'AVERAGE')?.count ?? 0) +
            Number(alignment.find(a => a.alignment_level === 'POOR')?.count ?? 0),
    };

    const activePoliticians = await prisma.politician.count({ where: { is_active: true } });

    const response = {
      totalVotes,
      activePoliticians,
      totalAgendas: agendas.length,
      averageConsensus: stats._avg.overall_score ?? 50,
      voteByCriteria,
      alignmentStats,
      timelineTrends,
      keyAgendas: agendas.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description ?? '',
        criteria: a.criteria,
        totalVotes: 0,
        favorableVotes: 0,
        contraryVotes: 0,
        abstentions: 0,
        consensusScore: 0,
      })),
      politicianRanking: [],
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar análise de votações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

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

// GET /api/parties/alignment - Alinhamento médio por partido (replica endpoint Python)
app.get('/api/parties/alignment', async (_req, res) => {
  try {
    type PartyRow = {
      party: string;
      house: string;
      politician_count: bigint;
      avg_score: string | null;
      avg_life: string | null;
      avg_family: string | null;
      avg_integrity: string | null;
      avg_social: string | null;
      avg_religious: string | null;
    };

    const rows = await prisma.$queryRaw<PartyRow[]>`
      SELECT
        p.current_party                                          AS party,
        p.current_house                                         AS house,
        COUNT(*)                                                AS politician_count,
        ROUND(AVG(ps.overall_score)::numeric, 1)               AS avg_score,
        ROUND(AVG(ps.life_protection)::numeric, 1)             AS avg_life,
        ROUND(AVG(ps.family_values)::numeric, 1)               AS avg_family,
        ROUND(AVG(ps.moral_integrity)::numeric, 1)             AS avg_integrity,
        ROUND(AVG(ps.social_responsibility)::numeric, 1)       AS avg_social,
        ROUND(AVG(ps.religious_freedom)::numeric, 1)           AS avg_religious
      FROM politicians p
      INNER JOIN politician_scores ps ON ps.politician_id = p.id
      WHERE p.is_active = true
        AND p.current_party IS NOT NULL
        AND p.current_party != ''
      GROUP BY p.current_party, p.current_house
      HAVING COUNT(*) >= 3
      ORDER BY AVG(ps.overall_score) DESC NULLS LAST
    `;

    const level = (s: string | null) => {
      const v = s ? parseFloat(s) : null;
      if (v === null) return 'sem_dados';
      if (v >= 70) return 'alta';
      if (v >= 50) return 'moderada';
      return 'baixa';
    };

    const parties = rows.map(r => ({
      party: r.party,
      house: r.house,
      politician_count: Number(r.politician_count),
      avg_score: r.avg_score ? parseFloat(r.avg_score) : null,
      alignment_level: level(r.avg_score),
      criteria: {
        life_protection:       r.avg_life      ? parseFloat(r.avg_life)      : null,
        family_values:         r.avg_family    ? parseFloat(r.avg_family)    : null,
        moral_integrity:       r.avg_integrity ? parseFloat(r.avg_integrity) : null,
        social_responsibility: r.avg_social    ? parseFloat(r.avg_social)    : null,
        religious_freedom:     r.avg_religious ? parseFloat(r.avg_religious) : null,
      },
    }));

    res.json({ parties, total_parties: parties.length });
  } catch (error) {
    console.error('Erro ao buscar alinhamento por partido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Error handler global — garante que erros inesperados retornem JSON com CORS
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Unhandled error]', err.message);
  res.status(500).json({ error: err.message ?? 'Erro interno do servidor' });
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
  console.log(`   GET /api/parties/alignment`);
});

export default app;