import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PoliticianScore, Politician, CriteriaType } from '@prisma/client';
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
      lastCalculation: score.last_calculation?.toISOString() ?? null,
    };
  }

  // F16: expõe o tier de filiação à FPE + fonte verificável + data de captura
  private formatFpe(p: Pick<Politician, 'is_fpe_member' | 'fpe_tier' | 'fpe_source' | 'fpe_source_url' | 'fpe_captured_at'>) {
    if (!p.is_fpe_member) return null;
    return {
      tier: p.fpe_tier ?? 'REGISTRADO',
      source: p.fpe_source ?? null,
      sourceUrl: p.fpe_source_url ?? null,
      capturedAt: p.fpe_captured_at?.toISOString() ?? null,
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
      // Bug real (2026-09-16): o groupBy de performance não tinha `where`
      // is_active — contava scores de inativos/históricos, enquanto `total`
      // da listagem usava is_active. As faixas do filtro podiam somar mais
      // que o total. Agora espelha o mesmo `where` da listagem.
      this.prisma.politicianScore.groupBy({
        by: ['performance_level'],
        where: { politician: { is_active: true } },
        _count: true,
      }),
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
        fpe: this.formatFpe(p),
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
          fpe: this.formatFpe(p),
        },
        score: this.formatScore(p.scores[0]),
        position: i + 1,
      }));
  }

  async findOne(id: number) {
    const [politician, expenseAgg, votesPerCriteria] = await Promise.all([
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
      // H2 (2026-08-27): votos por critério para transparência de base de
      // cálculo.
      //
      // ACHADO REAL 2026-09-25: o reduce() sobrescrevia em vez de SOMAR. Com
      // groupBy por key_agenda_id, um parlamentar com 41 votos em
      // RESPONSABILITY_SOCIAL (em ~10 pautas distintas) recebia
      // count=1 — a ÚLTIMA pauta do grupo, não a soma. A UI mostrava
      // "1 votação" para quem votou 41 vezes, e a proveniência da nota
      // ficava errada nos dois sentidos: a base exibida e o cálculo de
      // proveniência da nota que depende dela.
      //
      // Além disso: a contagem de base passou a contar ASSUNTOS (titles
      // distintos), não linhas de pauta, para ficar coerente com a média
      // por assunto do motor de scoring (recalculate-scores.ts).
      this.prisma.vote.findMany({
        where: { politician_id: id },
        select: {
          applied_score: true,
          key_agenda: { select: { criteria: true, title: true } },
        },
      }).then(votes => {
        const acc = {} as Record<
          string,
          { count: number; totalImpact: number; votes: number; subjects: Set<string> }
        >;
        for (const v of votes) {
          const criteria = v.key_agenda.criteria as string;
          if (!acc[criteria]) {
            acc[criteria] = { count: 0, totalImpact: 0, votes: 0, subjects: new Set() };
          }
          const a = acc[criteria];
          a.count += 1;
          a.votes += 1;
          a.totalImpact += v.applied_score ?? 0;
          a.subjects.add(v.key_agenda.title ?? v.key_agenda.criteria);
        }
        return Object.fromEntries(
          Object.entries(acc).map(([criteria, a]) => [
            criteria,
            // `count` é o que a UI usa como "base de cálculo" → número de
            // ASSUNTOS, que é o que de fato sustenta a nota agora. `votes`
            // fica disponível para o texto explicar a diferença.
            { count: a.subjects.size, totalImpact: a.totalImpact, votes: a.votes },
          ]),
        );
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
      fpe: this.formatFpe(politician),
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
        // Proveniência (H1, 2026-08-27): expor a identidade da votação na
        // fonte oficial (Câmara/Senado) para o usuário auditar a nota.
        source: v.source,
        sourceVoteId: v.source_vote_id,
        sourcePropositionId: v.source_proposition_id,
      })),
      expenseAnalysis: {
        totalValue,
        suspiciousValue,
        suspiciousCount: expenseAgg.suspicious._count.id,
        totalCount: expenseAgg.agg._count.id,
        suspiciousPercentage: Math.round(suspiciousPct * 10) / 10,
        // D3 (2026-09-25): removido o `integrityScore` daqui. Ele era
        // preenchido com moral_integrity — que é o score do critério de
        // valores (majoritariamente seed do partido + média de votos), não
        // uma medida de gasto. A aba de Gastos exibia isso rotulado como
        // "nota que resume o quanto as despesas seguem o padrão", o que é
        // afirmação falsa. Ver DECISOES.md D3.
        //
        // D6: hasExpenseData distingue "sem dado" de "gasto normal" — só
        // 174 dos parlamentares registrados têm despesa no acervo.
        hasExpenseData: expenseAgg.agg._count.id > 0,
        // D4: uma única fonte de verdade para a leitura visual. Baseado
        // só na proporção de despesas fora do padrão (antes a cor vinha de
        // riskLevel e a escala mostrada vinha de integrityScore — as duas se
        // contradiziam na mesma tela).
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
      // H2 (2026-08-27): votos por critério — base do cálculo da nota,
      // permite aviso de confiança quando a base é pequena.
      votesPerCriteria,
    };
  }

  /**
   * H4 (2026-08-27): Export de votações individuais — auditoria total.
   * Lista todos os votos nominais com pauta, critério, voto, impacto e
   * identidade na fonte oficial (para montar o link público).
   */
  async exportVotes(params: {
    politicianId?: number;
    criteria?: string;
    limit: number;
  }): Promise<
    Array<{
      id: string;
      politicianId: number;
      politicianName: string;
      politicianParty: string | null;
      politicianState: string | null;
      politicianHouse: string | null;
      voteDate: Date;
      agendaTitle: string;
      criteria: string;
      voteType: string;
      appliedScore: number;
      source: string;
      sourceVoteId: string;
      sourcePropositionId: string | null;
    }>
  > {
    const { politicianId, criteria, limit } = params;
    // Aceita o rótulo camelCase da API pública (lifeProtection) e também o
    // enum Prisma cru (LIFE_PROTECTION) — ver @ApiQuery do exportVotesCsv.
    const CRITERIA_ALIAS: Record<string, CriteriaType> = {
      lifeProtection: CriteriaType.LIFE_PROTECTION,
      familyValues: CriteriaType.FAMILY_VALUES,
      moralIntegrity: CriteriaType.MORAL_INTEGRITY,
      socialResponsibility: CriteriaType.SOCIAL_RESPONSIBILITY,
      religiousFreedom: CriteriaType.RELIGIOUS_FREEDOM,
    };
    const criteriaFilter = criteria
      ? (CRITERIA_ALIAS[criteria] ??
        ((Object.values(CriteriaType) as string[]).includes(criteria) ? (criteria as CriteriaType) : undefined))
      : undefined;
    const rows = await this.prisma.vote.findMany({
      where: {
        ...(politicianId ? { politician_id: politicianId } : {}),
        ...(criteriaFilter ? { key_agenda: { criteria: criteriaFilter } } : {}),
      },
      take: limit,
      select: {
        id: true,
        politician_id: true,
        vote_type: true,
        applied_score: true,
        vote_date: true,
        source: true,
        source_vote_id: true,
        source_proposition_id: true,
        key_agenda: { select: { title: true, criteria: true } },
        politician: {
          select: {
            name: true,
            current_party: true,
            current_state: true,
            current_house: true,
          },
        },
      },
      orderBy: { vote_date: 'desc' },
    });

    return rows.map((r) => ({
      id: r.id,
      politicianId: r.politician_id,
      politicianName: r.politician.name,
      politicianParty: r.politician.current_party,
      politicianState: r.politician.current_state,
      politicianHouse: r.politician.current_house,
      voteDate: r.vote_date,
      agendaTitle: r.key_agenda.title,
      criteria: r.key_agenda.criteria,
      voteType: r.vote_type,
      appliedScore: r.applied_score,
      source: r.source,
      sourceVoteId: r.source_vote_id,
      sourcePropositionId: r.source_proposition_id,
    }));
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

  /**
   * Despesas marcadas como fora do padrão, com o motivo técnico e o link do
   * documento oficial (D2, 2026-09-25).
   *
   * O objetivo é auditabilidade: o aggregate diz QUANTO está fora do padrão,
   * esta lista diz QUAIS despesas e onde conferir o recibo na fonte. Sem
   * isso o site afirmava uma diferença estatística sem dar como verificar.
   *
   * Ordena por valor decrescente — o que o usuário quer ver primeiro é a
   * despesa de maior valor, não a mais recente.
   *
   * `hasDocument` diz se a Casa publicou o documento daquela despesa: 56% do
   * acervo tem (41.855 de 74.336), então o link não pode ser prometido
   * sempre. Onde não tem, a UI mostra que não há documento disponível em vez
   * de um link quebrado.
   */
  async flaggedExpenses(id: number, limit: number) {
    const exists = await this.prisma.politician.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) return { flagged: [], totalFlagged: 0, hasExpenseData: false };

    const [flagged, totalFlagged, totalCount] = await Promise.all([
      this.prisma.expense.findMany({
        where: { politician_id: id, is_suspicious: true },
        orderBy: { net_value: 'desc' },
        take: limit,
        select: {
          id: true,
          year: true,
          month: true,
          expense_type: true,
          supplier_name: true,
          supplier_document: true,
          gross_value: true,
          net_value: true,
          refund_value: true,
          suspicion_score: true,
          suspicion_reasons: true,
          document_url: true,
          document_number: true,
          source: true,
        },
      }),
      this.prisma.expense.count({ where: { politician_id: id, is_suspicious: true } }),
      this.prisma.expense.count({ where: { politician_id: id } }),
    ]);

    return {
      totalFlagged,
      totalCount,
      hasExpenseData: totalCount > 0,
      flagged: flagged.map((e) => ({
        id: e.id,
        year: e.year,
        month: e.month,
        expenseType: e.expense_type,
        supplierName: e.supplier_name,
        hasSupplierDocument: Boolean(e.supplier_document?.trim()),
        grossValue: e.gross_value,
        netValue: e.net_value,
        refundValue: e.refund_value,
        suspicionScore: e.suspicion_score,
        reasons: e.suspicion_reasons,
        documentUrl: e.document_url || null,
        documentNumber: e.document_number,
        source: e.source,
        isSenado: e.source === 'SENADO',
      })),
    };
  }
}
