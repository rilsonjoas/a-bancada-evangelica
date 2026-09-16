import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PartiesService } from '../parties.service';
import type { PrismaService } from '../../prisma/prisma.service';

function score(votes: number, overrides: Record<string, number> = {}) {
  return {
    life_protection: 50,
    family_values: 60,
    moral_integrity: 50,
    social_responsibility: 50,
    religious_freedom: 60,
    overall_score: 55,
    performance_level: 'AVERAGE',
    performance_label: 'Médio',
    performance_description: '',
    total_votes: votes,
    consistency_score: 1,
    last_calculation: new Date(),
    ...overrides,
  };
}

function politician(id: number, party: string, s: Record<string, unknown> | null) {
  return {
    id,
    name: `Teste ${id}`,
    current_party: party,
    current_state: 'SP',
    current_house: 'CAMARA' as const,
    is_fpe_member: false,
    scores: s ? [s] : [],
  };
}

function partyMembers(party: string, scores: Array<Record<string, unknown> | null>): ReturnType<typeof politician>[] {
  return scores.map((s, i) => politician(i + 1, party, s));
}

describe('PartiesService.alignment', () => {
  let prisma: { politician: { findMany: ReturnType<typeof vi.fn> } };
  let service: PartiesService;

  beforeEach(() => {
    prisma = { politician: { findMany: vi.fn() } };
    service = new PartiesService(prisma as unknown as PrismaService);
    prisma.politician.findMany.mockResolvedValue(partyMembers('PL', [score(12)]).concat(
      partyMembers('PSD', [score(12)]).concat(partyMembers('MDB', [score(12)])),
    ));
  });

  it('mapeia partido com contagem, média e níveis', async () => {
    // Serviço filtra partidos com < 3 políticos — usa 3 PL, 0 de outros.
    prisma.politician.findMany.mockResolvedValue(
      partyMembers('PL', [
        score(12, { overall_score: 55 }),
        score(12, { overall_score: 55 }),
        score(12, { overall_score: 55 }),
      ]),
    );

    const result = await service.alignment();

    expect(result.parties).toHaveLength(1);
    expect(result.parties[0]).toEqual({
      party: 'PL',
      politician_count: 3,
      with_votes: 3,
      estimated: 0,
      avg_score: 55.0,
      alignment_level: 'moderada',
      criteria: {
        life_protection: 50.0,
        family_values: 60.0,
        moral_integrity: 50.0,
        social_responsibility: 50.0,
        religious_freedom: 60.0,
      },
    });
    expect(result.total_parties).toBe(1);
  });

  it('média NÃO mistura estimativas — computa só quem tem voto próprio', async () => {
    prisma.politician.findMany.mockResolvedValue([
      ...partyMembers('PL', [
        score(12, { overall_score: 100, life_protection: 100 }),
        score(0, { overall_score: 10, life_protection: 10 }),
        null,
      ]),
      ...partyMembers('PSD', [score(12)]),
      ...partyMembers('MDB', [score(12)]),
    ]);

    const result = await service.alignment();
    const pl = result.parties.find(p => p.party === 'PL')!;

    expect(pl.politician_count).toBe(3);
    expect(pl.with_votes).toBe(1);
    expect(pl.estimated).toBe(2);
    expect(pl.avg_score).toBe(100); // só o real entra; estimado não rebaixa
  });

  it('partido sem ninguém com voto próprio expõe sem_dados', async () => {
    prisma.politician.findMany.mockResolvedValue([
      ...partyMembers('PT', [score(0), null, score(0)]),
      ...partyMembers('PSD', [score(12)]),
      ...partyMembers('MDB', [score(12)]),
    ]);

    const result = await service.alignment();
    const pt = result.parties.find(p => p.party === 'PT')!;

    expect(pt.with_votes).toBe(0);
    expect(pt.avg_score).toBeNull();
    expect(pt.alignment_level).toBe('sem_dados');
  });

  it('filtra partidos com menos de 3 políticos mapeados', async () => {
    prisma.politician.findMany.mockResolvedValue(partyMembers('PTC', [score(12)]));

    const result = await service.alignment();

    expect(result.parties).toHaveLength(0);
  });

  it('ordena por média desc', async () => {
    prisma.politician.findMany.mockResolvedValue([
      ...partyMembers('ALTA', [score(12, { overall_score: 80 }), score(12), score(12)]),
      ...partyMembers('BAIXA', [score(12, { overall_score: 40 }), score(12), score(12)]),
    ]);

    const result = await service.alignment();
    expect(result.parties.map(p => p.party)).toEqual(['ALTA', 'BAIXA']);
  });

  it('a saída NÃO expõe campo house nem vazamentos de prisma', async () => {
    prisma.politician.findMany.mockResolvedValue([
      ...partyMembers('REPUBLICANOS', [score(12), score(12), score(12)]),
      ...partyMembers('PSD', [score(12), score(12), score(12)]),
    ]);

    const result = await service.alignment();

    for (const p of result.parties) {
      expect(p).not.toHaveProperty('house');
      expect(p).not.toHaveProperty('score');
      expect(Object.keys(p).sort()).toEqual(
        ['alignment_level', 'avg_score', 'criteria', 'estimated', 'party', 'politician_count', 'with_votes'].sort(),
      );
    }
  });
});