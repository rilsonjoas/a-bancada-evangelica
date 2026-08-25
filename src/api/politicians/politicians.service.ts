import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PoliticianScore } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryPoliticiansDto } from './dto/query-politicians.dto';
import { QueryRankingDto } from './dto/query-ranking.dto';
import { groupByCountMap } from './politicians.utils';

const CRITERIA_FIELD_MAP: Record<string, string> = {
  overall: 'overall_score',
  lifeProtection: 'life_protection',
  familyValues: 'family_values',
  moralIntegrity: 'moral_integrity',
  socialResponsibility: 'social_responsibility',
  religiousFreedom: 'religious_freedom',
};

@Injectable()
export class PoliticiansService {
  constructor(private readonly prisma: PrismaService) {}

  private formatScore(score: PoliticianScore | null | undefined) {
    if (!score) return null;
    return {
      lifeProtection: score.life_protection ?? 0,
      familyValues: score.family_values ?? 0,
      moralIntegrity: score.moral_integrity ?? 0,
      socialResponsibility: score.social_responsibility ?? 0,
      religiousFreedom: score.religious_freedom ?? 0,
      overall: score.overall_score ?? 0,
      performanceLevel: score.performance_level ?? 'AVERAGE',
      performanceLabel: score.performance_label ?? 'Médio',
      performanceDescription: score.performance_description ?? 'Sem dados suficientes',
      totalVotes: score.total_votes ?? 0,
      consistencyScore: score.consistency_score ?? 0,
      lastCalculation: score.last_calculation?.toISOString() ?? new Date().toISOString(),
    };
  }

  async findAll(query: QueryPoliticiansDto) {
    const {
      search, state, party, house, performanceLevel,
      minScore, maxScore, fpeFilter,
      limit = '50', offset = '0',
      sortBy = 'name', sortOrder = 'asc',
    } = query;

    const where: Prisma.PoliticianWhereInput = { is_active: true };

    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (state)  where.current_state = state;
    if (party)  where.current_party = party;
    if (house)  where.current_house = house as Prisma.EnumHouseTypeFilter;
    if (fpeFilter === 'true') where.is_fpe_member = true;

    const scoreFilter: Prisma.PoliticianScoreListRelationFilter = {};
    if (performanceLevel) scoreFilter.some = { performance_level: performanceLevel as Prisma.EnumPerformanceLevelFilter };
    if (minScore || maxScore) {
      const range: Prisma.FloatFilter = {};
      if (minScore) range.gte = parseFloat(minScore);
      if (maxScore) range.lte = parseFloat(maxScore);
      scoreFilter.some = { ...scoreFilter.some, overall_score: range };
    }
    if (Object.keys(scoreFilter).length > 0) where.scores = scoreFilter;

    const takeN = parseInt(limit);
    const skipN = parseInt(offset);
    const include = {
      scores: { take: 1, orderBy: { created_at: 'desc' as const } },
      mandates: { where: { is_current: true }, take: 1 },
    };

    let politicians;
    if (sortBy === 'score') {
      const all = await this.prisma.politician.findMany({ where, include });
      const dir = sortOrder === 'desc' ? -1 : 1;
      all.sort((a, b) => dir * ((a.scores[0]?.overall_score ?? 0) - (b.scores[0]?.overall_score ?? 0)));
      politicians = all.slice(skipN, skipN + takeN);
    } else {
      politicians = await this.prisma.politician.findMany({
        where, include,
        orderBy: { name: sortOrder as 'asc' | 'desc' },
        take: takeN, skip: skipN,
      });
    }

    const [total, performanceStats, stateStats, partyStats] = await Promise.all([
      this.prisma.politician.count({ where }),
      this.prisma.politicianScore.groupBy({ by: ['performance_level'], _count: true }),
      // byState/byParty respeitam os mesmos filtros da listagem (where) —
      // se o pedido já filtrou por partido, a distribuição por estado
      // reflete só esse partido, não a base inteira (issue #3)
      this.prisma.politician.groupBy({ by: ['current_state'], where, _count: true }),
      this.prisma.politician.groupBy({ by: ['current_party'], where, _count: true }),
    ]);

    const byState = groupByCountMap(stateStats, s => s.current_state);
    const byParty = groupByCountMap(partyStats, s => s.current_party);

    return {
      politicians: politicians.map(p => ({
        id: p.id, name: p.name,
        currentParty: p.current_party, currentState: p.current_state,
        currentHouse: p.current_house, photoUrl: p.photo_url,
        isFpeMember: p.is_fpe_member ?? false,
        scores: this.formatScore(p.scores?.[0]),
      })),
      total,
      hasMore: skipN + politicians.length < total,
      filters: { search, state, party, house, performanceLevel, minScore, maxScore },
      stats: {
        excellent: performanceStats.find(s => s.performance_level === 'EXCELLENT')?._count ?? 0,
        good:      performanceStats.find(s => s.performance_level === 'GOOD')?._count ?? 0,
        average:   performanceStats.find(s => s.performance_level === 'AVERAGE')?._count ?? 0,
        poor:      performanceStats.find(s => s.performance_level === 'POOR')?._count ?? 0,
        byState,
        byParty,
      },
    };
  }

  async ranking(query: QueryRankingDto) {
    const { house, state, party, limit = '50', criteria = 'overall' } = query;
    const orderField = CRITERIA_FIELD_MAP[criteria] ?? 'overall_score';

    const where: Prisma.PoliticianWhereInput = { is_active: true };
    if (house) where.current_house = house as Prisma.EnumHouseTypeFilter;
    if (state) where.current_state = state;
    if (party) where.current_party = party;

    const politicians = await this.prisma.politician.findMany({
      where,
      include: { scores: { take: 1, orderBy: { created_at: 'desc' } } },
      take: parseInt(limit) * 2,
    });

    return politicians
      .filter(p => p.scores?.length > 0)
      .sort((a, b) => {
        const aScore = a.scores[0][orderField as keyof PoliticianScore] as number ?? 0;
        const bScore = b.scores[0][orderField as keyof PoliticianScore] as number ?? 0;
        return bScore - aScore;
      })
      .slice(0, parseInt(limit))
      .map((p, i) => ({
        politician: {
          id: p.id, name: p.name,
          currentParty: p.current_party, currentState: p.current_state,
          currentHouse: p.current_house, photoUrl: p.photo_url,
          isFpeMember: p.is_fpe_member ?? false,
        },
        score: this.formatScore(p.scores[0]),
        position: i + 1,
      }));
  }

  async findOne(id: number) {
    const [politician, expenseAgg] = await Promise.all([
      this.prisma.politician.findUnique({
        where: { id },
        include: {
          scores: { take: 1, orderBy: { created_at: 'desc' } },
          // F10: linha do tempo em ordem cronológica inversa (mais recente primeiro)
          mandates: { orderBy: { start_date: 'desc' } },
          campaignFinance: { where: { election_year: 2022 } },
          votes: {
            include: { key_agenda: true },
            orderBy: { vote_date: 'desc' },
            take: 10,
          },
        },
      }),
      this.prisma.expense.aggregate({
        where: { politician_id: id },
        _sum: { net_value: true },
        _count: { id: true },
      }).then(async agg => {
        const suspicious = await this.prisma.expense.aggregate({
          where: { politician_id: id, is_suspicious: true },
          _sum: { net_value: true },
          _count: { id: true },
        });
        return { agg, suspicious };
      }),
    ]);

    if (!politician) throw new NotFoundException(`Político ${id} não encontrado`);

    const totalValue = expenseAgg.agg._sum.net_value ?? 0;
    const suspiciousValue = expenseAgg.suspicious._sum.net_value ?? 0;
    const suspiciousPct = totalValue > 0 ? (suspiciousValue / totalValue) * 100 : 0;

    return {
      id: politician.id,
      name: politician.name,
      fullName: politician.full_name,
      currentParty: politician.current_party,
      currentState: politician.current_state,
      currentHouse: politician.current_house,
      photoUrl: politician.photo_url,
      isFpeMember: politician.is_fpe_member ?? false,
      email: politician.email,
      birthDate: politician.birth_date?.toISOString(),
      mandates: politician.mandates.map(m => ({
        id: m.id, house: m.house, party: m.party, state: m.state,
        legislature: m.legislature,
        startDate: m.start_date.toISOString(),
        endDate: m.end_date?.toISOString(),
        isCurrent: m.is_current,
      })),
      currentScore: this.formatScore(politician.scores?.[0]),
      recentVotes: politician.votes.map(v => ({
        id: v.id,
        agendaTitle: v.key_agenda.title,
        criteria: v.key_agenda.criteria,
        vote: v.vote_type,
        appliedScore: v.applied_score,
        voteDate: v.vote_date.toISOString(),
        description: v.voting_description ?? v.key_agenda.description ?? '',
      })),
      expenseAnalysis: {
        totalValue,
        suspiciousValue,
        suspiciousCount: expenseAgg.suspicious._count.id,
        totalCount: expenseAgg.agg._count.id,
        suspiciousPercentage: Math.round(suspiciousPct * 10) / 10,
        integrityScore: politician.scores?.[0]?.moral_integrity ?? 0,
        riskLevel: suspiciousPct > 10 ? 'HIGH' : suspiciousPct > 5 ? 'MEDIUM' : 'LOW',
      },
      // Transparência pura — NÃO entra na pontuação (decisão de escopo:
      // doação legal não é crime). Ausência = não declarou receita pelo
      // TSE; o frontend exibe estado vazio honesto.
      campaignFinance: politician.campaignFinance?.[0]
        ? {
            electionYear: politician.campaignFinance[0].election_year,
            totalReceived: politician.campaignFinance[0].total_received,
            donationCount: politician.campaignFinance[0].donation_count,
            largestDonation: politician.campaignFinance[0].largest_donation,
            donorPfCount: politician.campaignFinance[0].donor_pf_count,
            donorPjCount: politician.campaignFinance[0].donor_pj_count,
            topDonors: politician.campaignFinance[0].top_donors as Array<{
              name: string;
              doc: string;
              amount: number;
              count: number;
            }>,
          }
        : null,
    };
  }

  /**
   * URL da foto institucional de um parlamentar (query mínima — sem os
   * joins pesados do findOne). Usada pelo endpoint de proxy de imagem.
   */
  async photoUrlOf(id: number): Promise<string | null> {
    const p = await this.prisma.politician.findUnique({
      where: { id },
      select: { photo_url: true },
    });
    return p?.photo_url ?? null;
  }
}
