import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VotesService {
  constructor(private readonly prisma: PrismaService) {}

  async analysis() {
    const [totalVotes, agendas, alignmentRaw, scoreStats] = await Promise.all([
      this.prisma.vote.count(),
      this.prisma.keyAgenda.findMany({ where: { status: 'ACTIVE' } }),
      this.prisma.$queryRaw<Array<{ alignment_level: string; count: bigint }>>`
        SELECT ps.performance_level AS alignment_level, COUNT(*)::bigint
        FROM politician_scores ps
        JOIN politicians p ON p.id = ps.politician_id
        WHERE p.is_active = true
        GROUP BY ps.performance_level
      `,
      this.prisma.politicianScore.aggregate({ _avg: { overall_score: true } }),
    ]);

    // Votos por critério (via key_agenda)
    const voteByCriteriaRaw = await this.prisma.vote.groupBy({
      by: ['key_agenda_id'],
      _count: { id: true },
    });

    const agendaMap = new Map(agendas.map(a => [a.id, a]));
    const voteByCriteria: Record<string, number> = {};
    for (const v of voteByCriteriaRaw) {
      const criteria = agendaMap.get(v.key_agenda_id)?.criteria ?? 'UNKNOWN';
      voteByCriteria[criteria] = (voteByCriteria[criteria] ?? 0) + v._count.id;
    }

    // Timeline mensal (últimos 12 meses)
    const recentVotes = await this.prisma.vote.findMany({
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

    // Votos por pauta (para preencher keyAgendas com dados reais)
    const votesByAgenda = await this.prisma.vote.groupBy({
      by: ['key_agenda_id', 'vote_type'],
      _count: { id: true },
    });

    // Datas mínima/máxima por pauta — habilita o filtro de período
    const datesByAgenda = await this.prisma.vote.groupBy({
      by: ['key_agenda_id'],
      _min: { vote_date: true },
      _max: { vote_date: true },
    });
    const agendaDateMap = new Map(
      datesByAgenda.map(d => [d.key_agenda_id, { min: d._min.vote_date, max: d._max.vote_date }])
    );

    const agendaVoteMap = new Map<string, { YES: number; NO: number; ABSTENTION: number; ABSENT: number }>();
    for (const v of votesByAgenda) {
      const curr = agendaVoteMap.get(v.key_agenda_id) ?? { YES: 0, NO: 0, ABSTENTION: 0, ABSENT: 0 };
      curr[v.vote_type as keyof typeof curr] = (curr[v.vote_type as keyof typeof curr] ?? 0) + v._count.id;
      agendaVoteMap.set(v.key_agenda_id, curr);
    }

    const activePoliticians = await this.prisma.politician.count({ where: { is_active: true } });

    // Pautas por critério (todos os 5 critérios têm dados)
    const agendaByCriteria: Record<string, number> = {};
    for (const a of agendas) {
      agendaByCriteria[a.criteria] = (agendaByCriteria[a.criteria] ?? 0) + 1;
    }

    // Top 50 políticos por pontuação (deduplicado por politician_id)
    const rankingRaw = await this.prisma.politicianScore.findMany({
      where: { politician: { is_active: true } },
      orderBy: { overall_score: 'desc' },
      select: {
        overall_score: true,
        total_votes: true,
        politician: { select: { id: true, name: true, current_party: true, current_state: true } },
      },
    });

    const seen = new Set<number>();
    const politicianRanking = rankingRaw
      .filter(s => { if (seen.has(s.politician.id)) return false; seen.add(s.politician.id); return true; })
      .slice(0, 50)
      .map(s => ({
        id: s.politician.id,
        name: s.politician.name,
        party: s.politician.current_party,
        state: s.politician.current_state,
        alignmentScore: Math.round(s.overall_score * 10) / 10,
        totalVotes: s.total_votes,
      }));

    return {
      totalVotes,
      activePoliticians,
      totalAgendas: agendas.length,
      averageScore: Math.round((scoreStats._avg.overall_score ?? 50) * 10) / 10,
      agendaByCriteria,
      voteByCriteria,
      alignmentStats: {
        high:   Number(alignmentRaw.find(a => a.alignment_level === 'EXCELLENT')?.count ?? 0),
        medium: Number(alignmentRaw.find(a => a.alignment_level === 'GOOD')?.count ?? 0),
        low:    Number(alignmentRaw.find(a => a.alignment_level === 'AVERAGE')?.count ?? 0)
              + Number(alignmentRaw.find(a => a.alignment_level === 'POOR')?.count ?? 0),
      },
      timelineTrends,
      keyAgendas: agendas
        .map(a => {
          const votes = agendaVoteMap.get(a.id) ?? { YES: 0, NO: 0, ABSTENTION: 0, ABSENT: 0 };
          const total = votes.YES + votes.NO + votes.ABSTENTION + votes.ABSENT;
          return {
            id: a.id,
            title: a.title,
            description: a.description ?? '',
            criteria: a.criteria,
            totalVotes: total,
            favorableVotes: votes.YES,
            contraryVotes: votes.NO,
            abstentions: votes.ABSTENTION,
            consensusScore: total > 0 ? Math.round((votes.YES / total) * 100) : 0,
            firstVoteDate: agendaDateMap.get(a.id)?.min?.toISOString() ?? null,
            lastVoteDate: agendaDateMap.get(a.id)?.max?.toISOString() ?? null,
          };
        })
        .filter(a => a.totalVotes > 0),
      politicianRanking,
    };
  }
}
