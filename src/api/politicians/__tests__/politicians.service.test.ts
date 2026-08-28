import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PoliticiansService } from '../politicians.service';
import type { PrismaService } from '../../prisma/prisma.service';

describe('PoliticiansService.exportVotes', () => {
  let prisma: { vote: { findMany: ReturnType<typeof vi.fn> } };
  let service: PoliticiansService;

  const rawVote = (overrides: Record<string, unknown> = {}) => ({
    id: 'v1',
    politician_id: 123,
    vote_type: 'FAVOR',
    applied_score: 10,
    vote_date: new Date('2026-08-01T12:00:00Z'),
    source: 'camara',
    source_vote_id: 'sv1',
    source_proposition_id: 'prop-1',
    key_agenda: { title: 'PL 123', criteria: 'LIFE_PROTECTION' },
    politician: {
      name: 'Fulano',
      current_party: 'PL',
      current_state: 'SP',
      current_house: 'CAMARA',
    },
    ...overrides,
  });

  beforeEach(() => {
    prisma = { vote: { findMany: vi.fn() } };
    service = new PoliticiansService(prisma as unknown as PrismaService);
  });

  it('mapeia cada voto com os campos de auditoria fonte/origem', async () => {
    prisma.vote.findMany.mockResolvedValue([rawVote()]);

    const result = await service.exportVotes({ limit: 10 });

    expect(result).toEqual([
      {
        id: 'v1',
        politicianId: 123,
        politicianName: 'Fulano',
        politicianParty: 'PL',
        politicianState: 'SP',
        politicianHouse: 'CAMARA',
        voteDate: new Date('2026-08-01T12:00:00Z'),
        agendaTitle: 'PL 123',
        criteria: 'LIFE_PROTECTION',
        voteType: 'FAVOR',
        appliedScore: 10,
        source: 'camara',
        sourceVoteId: 'sv1',
        sourcePropositionId: 'prop-1',
      },
    ]);
    expect(prisma.vote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, orderBy: { vote_date: 'desc' } }),
    );
  });

  it('filtra por politicianId quando passado', async () => {
    prisma.vote.findMany.mockResolvedValue([]);

    await service.exportVotes({ politicianId: 42, limit: 10 });

    expect(prisma.vote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ politician_id: 42 }) }),
    );
  });

  it('filtra por critério camelCase (vida pública) e por enum cru, ignora inválido', async () => {
    prisma.vote.findMany.mockResolvedValue([]);

    await service.exportVotes({ criteria: 'familyValues', limit: 10 });
    expect(prisma.vote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ key_agenda: { criteria: 'FAMILY_VALUES' } }),
      }),
    );

    await service.exportVotes({ criteria: 'FAMILY_VALUES', limit: 10 });
    expect(prisma.vote.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ key_agenda: { criteria: 'FAMILY_VALUES' } }),
      }),
    );

    await service.exportVotes({ criteria: 'CRITERIO_INEXISTENTE', limit: 10 });
    expect(prisma.vote.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: expect.not.objectContaining({ key_agenda: expect.anything() }) }),
    );
  });
});