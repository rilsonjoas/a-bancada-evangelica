import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatsService } from '../stats.service';
import type { PrismaService } from '../../prisma/prisma.service';

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