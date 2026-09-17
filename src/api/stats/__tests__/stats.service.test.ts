import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatsService } from '../stats.service';
import type { PrismaService } from '../../prisma/prisma.service';

function makeRow(id: number, totalVotes: number | null, overall: number, party = 'PL') {
  return {
    id,
    name: `Pol ${id}`,
    current_party: party,
    current_state: 'SP',
    current_house: 'CAMARA',
    is_fpe_member: false,
    scores: [{
      life_protection: 50,
      family_values: 50,
      moral_integrity: 50,
      social_responsibility: 50,
      religious_freedom: 50,
      overall_score: overall,
      performance_level: 'AVERAGE',
      performance_label: 'Nota estimada por partido',
      performance_description: 'Sem voto próprio',
      total_votes: totalVotes,
      consistency_score: 0,
      last_calculation: new Date('2026-09-16T00:00:00Z'),
    }],
  };
}

describe('StatsService.syncHistory', () => {
  let prisma: { syncLog: { findMany: ReturnType<typeof vi.fn> } };
  let service: StatsService;

  beforeEach(() => {
    prisma = { syncLog: { findMany: vi.fn() } };
    service = new StatsService(prisma as unknown as PrismaService);
  });

  it('busca sync logs ordenados do mais recente para o mais antigo', async () => {
    prisma.syncLog.findMany.mockResolvedValue([]);

    await service.syncHistory(20);

    expect(prisma.syncLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { end_time: 'desc' }, take: 20 }),
    );
  });

  it('limita em 200 registros no teto', async () => {
    prisma.syncLog.findMany.mockResolvedValue([]);

    await service.syncHistory(99999);

    expect(prisma.syncLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 200 }),
    );
  });

  it('inclui details (diff das notas) no select', async () => {
    prisma.syncLog.findMany.mockResolvedValue([]);

    await service.syncHistory(10);

    const select = prisma.syncLog.findMany.mock.calls[0][0].select as Record<string, boolean>;
    expect(Object.keys(select).sort()).toEqual([
      'details',
      'end_time',
      'error_message',
      'id',
      'records_failed',
      'records_inserted',
      'records_processed',
      'records_updated',
      'source',
      'start_time',
      'status',
      'sync_type',
    ].sort());
  });
});

describe('StatsService.estimatedScores', () => {
  let prisma: { politician: { findMany: ReturnType<typeof vi.fn> } };
  let service: StatsService;

  beforeEach(() => {
    prisma = { politician: { findMany: vi.fn() } };
    service = new StatsService(prisma as unknown as PrismaService);
  });

  it('lista só quem NÃO tem voto próprio (nota estimada por partido)', async () => {
    prisma.politician.findMany.mockResolvedValue([
      makeRow(1, 0, 58),
      makeRow(2, 0, 62, 'PT'),
      makeRow(3, 42, 71),
      makeRow(4, null, 55),
    ]);

    const res = await service.estimatedScores();

    expect(res.totalPoliticians).toBe(4);
    expect(res.withOwnVotes).toBe(1);
    expect(res.estimatedCount).toBe(3);
    expect(res.estimated.map(e => e.id).sort()).toEqual([1, 2, 4]);
    expect(res.estimated[0]).toHaveProperty('currentParty');
  });

  it('casa vazia quando todos têm voto próprio', async () => {
    prisma.politician.findMany.mockResolvedValue([
      makeRow(1, 88, 90),
      makeRow(2, 12, 65),
    ]);

    const res = await service.estimatedScores();

    expect(res.estimatedCount).toBe(0);
    expect(res.estimated).toEqual([]);
  });
});