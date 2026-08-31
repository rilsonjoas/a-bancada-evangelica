import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NewsService } from '../news.service';
import type { PrismaService } from '../../prisma/prisma.service';

describe('NewsService', () => {
  let prisma: {
    politician: { findUnique: ReturnType<typeof vi.fn> };
    newsMention: { findMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> };
  };
  let service: NewsService;

  beforeEach(() => {
    prisma = {
      politician: { findUnique: vi.fn() },
      newsMention: { findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    };
    service = new NewsService(prisma as unknown as PrismaService);
  });

  describe('findByPolitician', () => {
    const rawMention = (overrides: Record<string, unknown> = {}) => ({
      id: 1,
      title: 'Deputado X propõe projeto - Folha',
      url: 'https://folha.com/a',
      source_name: 'Folha de S.Paulo',
      published_at: new Date('2026-08-26T14:30:00Z'),
      status: 'APPROVED',
      ...overrides,
    });

    it('retorna [] quando o político não existe', async () => {
      prisma.politician.findUnique.mockResolvedValue(null);

      const result = await service.findByPolitician(999);

      expect(result).toEqual([]);
      expect(prisma.newsMention.findMany).not.toHaveBeenCalled();
    });

    it('busca só APPROVED, ordenado por published_at desc, e converte datas e nomes', async () => {
      prisma.politician.findUnique.mockResolvedValue({ id: 1 });
      prisma.newsMention.findMany.mockResolvedValue([
        rawMention(),
        rawMention({
          id: 2,
          title: 'Outra matéria',
          url: 'https://uol.com/b',
          source_name: 'UOL',
          published_at: new Date('2026-08-25T10:00:00Z'),
        }),
      ]);

      const result = await service.findByPolitician(1);

      expect(prisma.newsMention.findMany).toHaveBeenCalledWith({
        where: { politician_id: 1, status: 'APPROVED' },
        orderBy: { published_at: 'desc' },
        take: 20,
        select: {
          id: true, title: true, url: true, source_name: true, published_at: true, status: true,
        },
      });
      expect(result).toEqual([
        {
          id: 1,
          title: 'Deputado X propõe projeto - Folha',
          url: 'https://folha.com/a',
          sourceName: 'Folha de S.Paulo',
          publishedAt: '2026-08-26T14:30:00.000Z',
        },
        {
          id: 2,
          title: 'Outra matéria',
          url: 'https://uol.com/b',
          sourceName: 'UOL',
          publishedAt: '2026-08-25T10:00:00.000Z',
        },
      ]);
    });
  });

  describe('pending', () => {
    it('retorna fila PENDING com contexto do parlamentar', async () => {
      prisma.newsMention.findMany.mockResolvedValue([
        {
          id: 7,
          title: 'Matéria pendente',
          url: 'https://x.com/7',
          source_name: 'Correio',
          published_at: new Date('2026-08-27T09:00:00Z'),
          politician: {
            id: 3,
            name: 'João da Silva',
            current_party: 'PL',
            current_state: 'SP',
            photo_url: null,
          },
        },
      ]);

      const result = await service.pending();

      expect(prisma.newsMention.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
        orderBy: { published_at: 'desc' },
        take: 100,
        include: {
          politician: {
            select: {
              id: true, name: true, current_party: true, current_state: true, photo_url: true,
            },
          },
        },
      });
      expect(result[0]).toMatchObject({
        id: 7,
        sourceName: 'Correio',
        politician: { id: 3, name: 'João da Silva', party: 'PL', state: 'SP', photoUrl: null },
      });
    });
  });

  describe('review', () => {
    it('aprova um PENDING carimbando reviewed_at', async () => {
      prisma.newsMention.update.mockResolvedValue({
        id: 7,
        status: 'APPROVED',
        title: 'X',
        reviewed_at: new Date('2026-08-28T18:00:00Z'),
      });

      const result = await service.review(7, 'APPROVED');

      expect(prisma.newsMention.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { status: 'APPROVED', reviewed_at: expect.any(Date) },
        select: { id: true, status: true, title: true, reviewed_at: true },
      });
      expect(result.status).toBe('APPROVED');
    });
  });

  describe('batchReview', () => {
    it('atualiza o status em lote para os ids fornecidos', async () => {
      prisma.newsMention.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.batchReview([1, 2, 3], 'REJECTED');

      expect(prisma.newsMention.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2, 3] } },
        data: { status: 'REJECTED', reviewed_at: expect.any(Date) },
      });
      expect(result).toEqual({ updatedCount: 3 });
    });

    it('retorna updatedCount: 0 se o array de ids for vazio', async () => {
      const result = await service.batchReview([], 'APPROVED');

      expect(result).toEqual({ updatedCount: 0 });
      expect(prisma.newsMention.updateMany).not.toHaveBeenCalled();
    });
  });
});