import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VotesService } from '../votes.service';
import type { PrismaService } from '../../prisma/prisma.service';

type Mock = ReturnType<typeof vi.fn>;

describe('VotesService.analysis — exposição do tema (M2)', () => {
  let prisma: {
    vote: { count: Mock; groupBy: Mock; findMany: Mock };
    keyAgenda: { findMany: Mock };
    politician: { count: Mock };
    politicianScore: { aggregate: Mock; findMany: Mock };
    $queryRaw: Mock;
  };
  let service: VotesService;

  beforeEach(() => {
    prisma = {
      vote: { count: vi.fn(), groupBy: vi.fn(), findMany: vi.fn() },
      keyAgenda: { findMany: vi.fn() },
      politician: { count: vi.fn() },
      politicianScore: { aggregate: vi.fn(), findMany: vi.fn() },
      $queryRaw: vi.fn(),
    };
    service = new VotesService(prisma as unknown as never);

    prisma.vote.count.mockResolvedValue(12);
    prisma.politician.count.mockResolvedValue(2);
    prisma.$queryRaw.mockResolvedValue([]);
    prisma.politicianScore.aggregate.mockResolvedValue({ _avg: { overall_score: 62 } });
    prisma.politicianScore.findMany.mockResolvedValue([]);
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