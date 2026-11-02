import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PoliticiansService } from '../politicians.service';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * `socialLinks` na ficha (Fase B de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 * A API devolve a lista JÁ sanitizada; o frontend só renderiza. O JSON cru de
 * `social_media_urls` não sai da API.
 */
describe('PoliticiansService.findOne: socialLinks', () => {
  let prisma: {
    politician: { findUnique: ReturnType<typeof vi.fn> };
    expense: { aggregate: ReturnType<typeof vi.fn> };
    vote: { findMany: ReturnType<typeof vi.fn> };
  };
  let service: PoliticiansService;

  const row = (over: Record<string, unknown> = {}) => ({
    id: 42, name: 'Teste', full_name: 'Teste', current_party: 'PL',
    current_state: 'SP', current_house: 'CAMARA', photo_url: null,
    legislature_id: '204379', social_media_urls: null, tse_social_urls: null,
    is_fpe_member: false, mandates: [], campaignFinance: [], votes: [], scores: [],
    ...over,
  });

  beforeEach(() => {
    prisma = {
      politician: { findUnique: vi.fn().mockResolvedValue(row()) },
      expense: {
        aggregate: vi.fn()
          .mockResolvedValueOnce({ _sum: { net_value: 0 }, _count: { id: 0 } })
          .mockResolvedValueOnce({ _sum: { net_value: 0 }, _count: { id: 0 } }),
      },
      vote: { findMany: vi.fn().mockResolvedValue([]) },
    };
    service = new PoliticiansService(prisma as unknown as PrismaService);
  });

  it('devolve os links sanitizados de um deputado', async () => {
    prisma.politician.findUnique.mockResolvedValue(
      row({
        social_media_urls: {
          redes: ['https://twitter.com/adailfilhoam?s=21&t=O_eoTX0q1QfS6vmySI7biQ', 'https://www.instagram.com/adailfilho/'],
        },
      }),
    );
    const r = await service.findOne(42);
    expect(r.socialLinks).toEqual([
      { platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/adailfilho', origin: 'CAMARA' },
      { platform: 'x', label: 'X (Twitter)', url: 'https://twitter.com/adailfilhoam', origin: 'CAMARA' },
    ]);
  });

  it('devolve o site de um senador', async () => {
    prisma.politician.findUnique.mockResolvedValue(
      row({ current_house: 'SENADO', social_media_urls: { website: 'https://cidgomes.com.br/' } }),
    );
    const r = await service.findOne(42);
    expect(r.socialLinks).toEqual([
      { platform: 'website', label: 'Site do parlamentar', url: 'https://cidgomes.com.br/', origin: 'SENADO' },
    ]);
  });

  it('devolve lista vazia (não null, não undefined) quando não há redes', async () => {
    const r = await service.findOne(42);
    expect(r.socialLinks).toEqual([]);
    expect(JSON.parse(JSON.stringify(r)).socialLinks).toEqual([]);
  });

  it('não expõe o JSON cru de social_media_urls', async () => {
    prisma.politician.findUnique.mockResolvedValue(
      row({ social_media_urls: { redes: ['https://www.instagram.com/x?igshid=segredo'] } }),
    );
    const r = await service.findOne(42);
    expect(JSON.stringify(r)).not.toContain('igshid');
    expect(r).not.toHaveProperty('social_media_urls');
    expect(r).not.toHaveProperty('socialMediaUrls');
  });

  it('dado corrompido no banco não derruba a ficha', async () => {
    prisma.politician.findUnique.mockResolvedValue(row({ social_media_urls: 'lixo' }));
    await expect(service.findOne(42)).resolves.toMatchObject({ socialLinks: [] });
  });

  it('usa as redes do TSE como complemento e não expõe o JSON cru', async () => {
    prisma.politician.findUnique.mockResolvedValue(
      row({
        social_media_urls: { redes: ['https://www.instagram.com/atual'] },
        tse_social_urls: { ano: 2022, redes: ['https://www.facebook.com/fulano?mibextid=x'] },
      }),
    );
    const r = await service.findOne(42);
    expect(r.socialLinks.map((l: { platform: string; origin: string }) => `${l.platform}:${l.origin}`)).toEqual(['instagram:CAMARA', 'facebook:TSE']);
    expect(JSON.stringify(r)).not.toContain('mibextid');
    expect(r).not.toHaveProperty('tse_social_urls');
  });
});
