import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VotesService {
  constructor(private readonly prisma: PrismaService) {}

  async analysis() {
    // F11 (2026-08-25): a agregação antiga contava TODAS as linhas de
    // politician_scores (histórico + inativos) — a média vinha diferente
    // da do /stats/overview e ranking (63,1 vs 62,3). Consistência real:
    // última nota de cada político ATIVO, um voto por político. Fix em
    // 2026-09-16: votes/analysis usava o padrão antigo da tabela inteira.
    const [totalVotes, agendas, latestScores] = await Promise.all([
      this.prisma.vote.count(),
      this.prisma.keyAgenda.findMany({ where: { status: 'ACTIVE' } }),
      this.prisma.politician.findMany({
        where: { is_active: true },
        select: {
          scores: {
            take: 1,
            orderBy: { created_at: 'desc' },
            select: { performance_level: true, overall_score: true },
          },
        },
      }),
    ]);
    const withScore = latestScores.filter(p => p.scores.length > 0);
    const alignmentCounts = { EXCELLENT: 0, GOOD: 0, AVERAGE: 0, POOR: 0 };
    let scoreSum = 0;
    for (const p of withScore) {
      const s = p.scores[0];
      const key = s.performance_level.toUpperCase() as keyof typeof alignmentCounts;
      if (key in alignmentCounts) alignmentCounts[key] += 1;
      scoreSum += s.overall_score ?? 0;
    }
    const avgScore = withScore.length > 0
      ? Math.round((scoreSum / withScore.length) * 10) / 10
      : 0;

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

    // Top 50 políticos por pontuação (uma nota por político ativo).
    // Alinhado ao ranking oficial do site: última nota de cada político.
    // Antigo bug (2026-09-16): buscava TODAS as linhas de score e deduplicava
    // pelo MAIOR score já registrado — top-50 divergia do /politicians/ranking.
    const rankingRaw = await this.prisma.politician.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        current_party: true,
        current_state: true,
        scores: {
          take: 1,
          orderBy: { created_at: 'desc' },
          select: { overall_score: true, total_votes: true },
        },
      },
    });

    const politicianRanking = rankingRaw
      .filter(p => p.scores.length > 0)
      .sort((a, b) => (b.scores[0].overall_score ?? 0) - (a.scores[0].overall_score ?? 0))
      .slice(0, 50)
      .map(p => ({
        id: p.id,
        name: p.name,
        party: p.current_party,
        state: p.current_state,
        alignmentScore: Math.round((p.scores[0].overall_score ?? 0) * 10) / 10,
        totalVotes: p.scores[0].total_votes ?? 0,
      }));

    return {
      totalVotes,
      activePoliticians,
      totalAgendas: agendas.length,
      averageScore: avgScore,
      agendaByCriteria,
      voteByCriteria,
      alignmentStats: {
        high:   alignmentCounts.EXCELLENT,
        medium: alignmentCounts.GOOD,
        low:    alignmentCounts.AVERAGE + alignmentCounts.POOR,
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
            practicalImpact: a.practical_impact ?? null,
            theme: a.theme ?? null,
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

  /**
   * Votos individuais reais de uma pauta (GT1 — integridade de dados).
   * Antigamente a UI caía num fallback que FABRICAVA parlamentares e
   * contagens; este endpoint serve apenas votos reais gravados no banco.
   * Se a pauta não tiver votos, retorna lista vazia (0 honesto autorizado).
   */
  async agendaVotes(agendaId: string) {
    const agenda = await this.prisma.keyAgenda.findUnique({ where: { id: agendaId } });
    if (!agenda) return null;

    const rows = await this.prisma.vote.findMany({
      where: { key_agenda_id: agendaId },
      orderBy: { vote_date: 'desc' },
      select: {
        id: true,
        vote_type: true,
        applied_score: true,
        vote_date: true,
        source: true,
        source_vote_id: true,
        source_proposition_id: true,
        voting_description: true,
        result_description: true,
        politician: {
          select: {
            id: true,
            name: true,
            current_party: true,
            current_state: true,
            current_house: true,
          },
        },
      },
    });

    const summary = { total: 0, yes: 0, no: 0, abstention: 0, obstruction: 0, absent: 0 };
    for (const r of rows) {
      summary.total += 1;
      if (r.vote_type === 'YES') summary.yes += 1;
      else if (r.vote_type === 'NO') summary.no += 1;
      else if (r.vote_type === 'ABSTENTION') summary.abstention += 1;
      else if (r.vote_type === 'OBSTRUCTION') summary.obstruction += 1;
      else summary.absent += 1;
    }

    return {
      agenda: {
        id: agenda.id,
        title: agenda.title,
        description: agenda.description ?? '',
        criteria: agenda.criteria,
        positiveWeight: agenda.positive_weight,
        negativeWeight: agenda.negative_weight,
        source: agenda.source,
        sourceId: agenda.source_id,
        sourceUrl: agenda.source_url ?? null,
        keywords: agenda.keywords,
        status: agenda.status,
        priority: agenda.priority,
        createdAt: agenda.created_at,
        updatedAt: agenda.updated_at,
        _count: { votes: rows.length },
      },
      votes: rows.map((r) => ({
        id: r.id,
        politician: {
          id: r.politician.id,
          name: r.politician.name,
          currentParty: r.politician.current_party,
          currentState: r.politician.current_state,
          currentHouse: r.politician.current_house,
        },
        voteType: r.vote_type,
        appliedScore: r.applied_score,
        voteDate: r.vote_date,
        source: r.source,
        sourceVoteId: r.source_vote_id,
        ...(r.voting_description ? { votingDescription: r.voting_description } : {}),
        ...(r.result_description ? { resultDescription: r.result_description } : {}),
      })),
      summary,
    };
  }
}