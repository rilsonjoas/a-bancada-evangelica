import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VotesService } from '../votes.service';
import type { PrismaService } from '../../prisma/prisma.service';

type Mock = ReturnType<typeof vi.fn>;

describe('VotesService.analysis — exposição do tema (M2)', () => {
  let prisma: {
    vote: { count: Mock; groupBy: Mock; findMany: Mock };
    keyAgenda: { findMany: Mock };
    politician: { count: Mock; findMany: Mock };
    $queryRaw: Mock;
  };
  let service: VotesService;

  beforeEach(() => {
    prisma = {
      vote: { count: vi.fn(), groupBy: vi.fn(), findMany: vi.fn() },
      keyAgenda: { findMany: vi.fn() },
      politician: { count: vi.fn(), findMany: vi.fn() },
      $queryRaw: vi.fn(),
    };
    service = new VotesService(prisma as unknown as never);

    prisma.vote.count.mockResolvedValue(12);
    prisma.politician.count.mockResolvedValue(2);
    prisma.$queryRaw.mockResolvedValue([]);
    prisma.politician.findMany.mockResolvedValue([
      {
        id: 1,
        name: 'Deputado Teste',
        current_party: 'PT',
        current_state: 'SP',
        current_house: 'CAMARA',
        is_fpe_member: false,
        scores: [
          {
            performance_level: 'GOOD',
            performance_label: 'Bom',
            performance_description: 'desc',
            overall_score: 80,
            life_protection: 80,
            family_values: 80,
            moral_integrity: 80,
            social_responsibility: 80,
            religious_freedom: 80,
            total_votes: 12,
            consistency_score: 1,
            last_calculation: new Date('2025-06-01'),
          },
        ],
      },
    ]);
    prisma.vote.findMany.mockResolvedValue([]);
    prisma.vote.groupBy.mockImplementation(async (args: { by: string[]; _count?: unknown; _min?: unknown }) => {
      if (args._count && !args.by.includes('vote_type')) {
        return [
          { key_agenda_id: 'a1', _count: { id: 3 } },
          { key_agenda_id: 'a2', _count: { id: 2 } },
        ];
      }
      if (args._min) {
        return [
          {
            key_agenda_id: 'a1',
            _min: { vote_date: new Date('2025-01-01') },
            _max: { vote_date: new Date('2025-06-01') },
          },
          {
            key_agenda_id: 'a2',
            _min: { vote_date: new Date('2025-02-01') },
            _max: { vote_date: new Date('2025-02-01') },
          },
        ];
      }
      return [
        { key_agenda_id: 'a1', vote_type: 'YES', _count: { id: 3 } },
        { key_agenda_id: 'a2', vote_type: 'NO', _count: { id: 2 } },
      ];
    });
  });

  it('expõe theme e practicalImpact nas pautas-chave', async () => {
    prisma.keyAgenda.findMany.mockResolvedValue([
      {
        id: 'a1',
        title: 'PL 2159/2021 — Licenciamento ambiental',
        description: 'desc',
        criteria: 'SOCIAL_RESPONSIBILITY',
        status: 'ACTIVE',
        practical_impact: 'Na prática: ...',
        theme: 'meio-ambiente-energia',
      },
      {
        id: 'a2',
        title: 'PL 9999/2024 — Sem tema',
        description: 'desc',
        criteria: 'FAMILY_VALUES',
        status: 'ACTIVE',
        practical_impact: null,
        theme: null,
      },
    ]);

    const result = await service.analysis();

    const a1 = result.keyAgendas.find((a) => a.id === 'a1');
    const a2 = result.keyAgendas.find((a) => a.id === 'a2');
    expect(a1?.theme).toBe('meio-ambiente-energia');
    expect(a1?.practicalImpact).toContain('Na prática');
    expect(a2?.theme).toBeNull();
    expect(a2?.practicalImpact).toBeNull();
  });

  it('calcula média e distribuição por político ativo (última nota)', async () => {
    prisma.keyAgenda.findMany.mockResolvedValue([]);

    const result = await service.analysis();

    expect(result.averageScore).toBe(80);
    expect(result.alignmentStats).toEqual({ high: 0, medium: 1, low: 0 });
    expect(result.politicianRanking).toHaveLength(1);
    expect(result.politicianRanking[0]).toMatchObject({
      id: 1,
      name: 'Deputado Teste',
      party: 'PT',
      state: 'SP',
      alignmentScore: 80,
      totalVotes: 12,
    });
  });

  it('usa a ÚLTIMA nota de cada político (não média de todas as linhas) — divergência 63,1 vs 62,3 (2026-09-16)', async () => {
    prisma.keyAgenda.findMany.mockResolvedValue([]);
    prisma.politician.count.mockResolvedValue(2);
    prisma.politician.findMany.mockResolvedValue([
      {
        id: 1,
        name: 'Deputado Teste',
        current_party: 'PT',
        current_state: 'SP',
        current_house: 'CAMARA',
        is_fpe_member: false,
        // Duas linhas de score: a última (jun/2025) tem 80; a antiga (jan/2025)
        // tinha 40. Contar todas as linhas → média 60; pegar a última → 80.
        scores: [
          { performance_level: 'GOOD', performance_label: 'Bom', performance_description: 'desc', overall_score: 80, life_protection: 80, family_values: 80, moral_integrity: 80, social_responsibility: 80, religious_freedom: 80, total_votes: 12, consistency_score: 1, last_calculation: new Date('2025-06-01') },
          { performance_level: 'POOR', performance_label: 'Ruim', performance_description: 'desc', overall_score: 40, life_protection: 40, family_values: 40, moral_integrity: 40, social_responsibility: 40, religious_freedom: 40, total_votes: 4, consistency_score: 1, last_calculation: new Date('2025-01-01') },
        ],
      },
      {
        id: 2,
        name: 'Deputado B',
        current_party: 'PL',
        current_state: 'MG',
        current_house: 'CAMARA',
        is_fpe_member: false,
        scores: [
          { performance_level: 'EXCELLENT', performance_label: 'Excelente', performance_description: 'desc', overall_score: 100, life_protection: 100, family_values: 100, moral_integrity: 100, social_responsibility: 100, religious_freedom: 100, total_votes: 20, consistency_score: 1, last_calculation: new Date('2025-06-01') },
          { performance_level: 'EXCELLENT', performance_label: 'Excelente', performance_description: 'desc', overall_score: 100, life_protection: 100, family_values: 100, moral_integrity: 100, social_responsibility: 100, religious_freedom: 100, total_votes: 20, consistency_score: 1, last_calculation: new Date('2025-01-01') },
        ],
      },
    ]);

    const result = await service.analysis();

    // Média por-político da nota vigente: (80 + 100) / 2 = 90.
    // A agregação ANTIGA contava todas as linhas: (40+80+100+100)/4 = 80 → era
    // a raiz da divergência. Este teste quebraria se alguém reintroduzir.
    expect(result.averageScore).toBe(90);
    expect(result.activePoliticians).toBe(2);
  });

  it('exposição de withOwnVotes em analysis não fabrica dado', async () => {
    prisma.keyAgenda.findMany.mockResolvedValue([]);
    prisma.politician.count.mockResolvedValue(1);
    prisma.politician.findMany.mockResolvedValue([
      {
        id: 1,
        name: 'Deputado Teste',
        current_party: 'PT',
        current_state: 'SP',
        current_house: 'CAMARA',
        is_fpe_member: false,
        scores: [
          { performance_level: 'GOOD', performance_label: 'Bom', performance_description: 'desc', overall_score: 80, life_protection: 80, family_values: 80, moral_integrity: 80, social_responsibility: 80, religious_freedom: 80, total_votes: 12, consistency_score: 1, last_calculation: new Date('2025-06-01') },
        ],
      },
    ]);

    const result = await service.analysis();

    expect(result.totalVotes).toBe(12);
    expect(result.withOwnVotes).toBe(1);
  });
});

// ================================================================
// agendaVotes — votos individuais reais por pauta (GT1 integridade)
// ================================================================
describe('VotesService.agendaVotes — voto real, sem fabricação', () => {
  let prisma: {
    keyAgenda: { findUnique: Mock };
    vote: { findMany: Mock };
  };
  let service: VotesService;

  beforeEach(() => {
    prisma = {
      keyAgenda: { findUnique: vi.fn() },
      vote: { findMany: vi.fn() },
    };
    service = new VotesService(prisma as unknown as never);
  });

  it('retorna null quando a pauta não existe', async () => {
    prisma.keyAgenda.findUnique.mockResolvedValue(null);
    expect(await service.agendaVotes('inexistente')).toBeNull();
  });

  it('retorna dados reais com shape VotesByAgenda', async () => {
    prisma.keyAgenda.findUnique.mockResolvedValue({
      id: 'cmq123',
      title: 'PL 244-C — violência patrimonial contra criança',
      description: 'Tipifica...',
      criteria: 'FAMILY_VALUES',
      positive_weight: 10,
      negative_weight: -10,
      source: 'CAMARA',
      source_id: '123',
      source_url: null,
      keywords: [],
      status: 'ACTIVE',
      priority: 1,
      created_at: new Date('2023-06-13'),
      updated_at: new Date('2023-06-13'),
    });
    prisma.vote.findMany.mockResolvedValue([
      {
        id: 'v1',
        vote_type: 'YES',
        applied_score: 10,
        vote_date: new Date('2023-06-13'),
        source: 'CAMARA',
        source_vote_id: 'sv1',
        source_proposition_id: null,
        voting_description: null,
        result_description: null,
        politician: { id: 406, name: 'Marcelo Crivella', current_party: 'REPUBLICANOS', current_state: 'RJ', current_house: 'camara' },
      },
      {
        id: 'v2',
        vote_type: 'NO',
        applied_score: -10,
        vote_date: new Date('2023-06-13'),
        source: 'CAMARA',
        source_vote_id: 'sv2',
        source_proposition_id: '999',
        voting_description: 'Desc',
        result_description: 'Resultado',
        politician: { id: 1, name: 'Deputado Teste', current_party: 'PT', current_state: 'SP', current_house: 'camara' },
      },
    ]);

    const result = await service.agendaVotes('cmq123');
    expect(result).not.toBeNull();
    expect(result!.agenda.id).toBe('cmq123');
    expect(result!.votes).toHaveLength(2);
    expect(result!.votes[0].politician.id).toBe(406);
    expect(result!.votes[0].politician.name).toBe('Marcelo Crivella');
    expect(result!.summary.yes).toBe(1);
    expect(result!.summary.no).toBe(1);
  });
});