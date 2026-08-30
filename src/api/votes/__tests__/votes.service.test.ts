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