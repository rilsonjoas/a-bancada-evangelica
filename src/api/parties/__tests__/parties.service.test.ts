import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PartiesService } from '../parties.service';
import type { PrismaService } from '../../prisma/prisma.service';

describe('PartiesService.alignment', () => {
  let prisma: { $queryRaw: ReturnType<typeof vi.fn> };
  let service: PartiesService;

  const row = (overrides: Record<string, unknown>) => ({
    party: 'PL',
    politician_count: 5n,
    avg_score: '55.0',
    avg_life: '50.0',
    avg_family: '60.0',
    avg_integrity: '50.0',
    avg_social: '50.0',
    avg_religious: '60.0',
    ...overrides,
  });

  beforeEach(() => {
    prisma = { $queryRaw: vi.fn() };
    service = new PartiesService(prisma as unknown as PrismaService);
  });

  it('mapeia linhas com contagem e média numérica', async () => {
    prisma.$queryRaw.mockResolvedValue([row({ party: 'PL' })]);

    const result = await service.alignment();

    expect(result.parties).toHaveLength(1);
    expect(result.parties[0]).toEqual({
      party: 'PL',
      politician_count: 5,
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

  it('classifica o nível por faixas fixas de score', async () => {
    prisma.$queryRaw.mockResolvedValue([
      row({ party: 'ALTA', avg_score: '80.0' }),
      row({ party: 'MOD', avg_score: '60.0' }),
      row({ party: 'BAIXA', avg_score: '40.0' }),
      row({ party: 'SEM', avg_score: null }),
    ]);

    const result = await service.alignment();
    const byParty = Object.fromEntries(result.parties.map(p => [p.party, p.alignment_level]));

    expect(byParty).toEqual({ ALTA: 'alta', MOD: 'moderada', BAIXA: 'baixa', SEM: 'sem_dados' });
  });

  it('a query agregada por partido NÃO contém current_house (regressão: partido com Câmara+Senado virava chave duplicada)', async () => {
    prisma.$queryRaw.mockResolvedValue([row({})]);
    await service.alignment();

    const sql = (prisma.$queryRaw.mock.calls[0][0] as string[]).join('');
    expect(sql).toContain('GROUP BY p.current_party');
    expect(sql).not.toContain('current_house');
    expect(sql).not.toContain('house');
  });

  it('a saída não expõe campo house (contrato público limpo da regressão)', async () => {
    prisma.$queryRaw.mockResolvedValue([row({ party: 'REPUBLICANOS' }), row({ party: 'PSD' })]);

    const result = await service.alignment();

    for (const p of result.parties) {
      expect(p).not.toHaveProperty('house');
      expect(Object.keys(p).sort()).toEqual(['alignment_level', 'avg_score', 'criteria', 'party', 'politician_count'].sort());
    }
  });
});