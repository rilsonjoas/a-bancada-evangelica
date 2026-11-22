import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PoliticiansService } from '../politicians.service';
import type { PrismaService } from '../../prisma/prisma.service';

type Hist = { assets: { electionYear: number } | null; assetsHistory: Array<{ electionYear: number; total: number | null; unverified: boolean }> };

describe('PoliticiansService.findOne: campaignFinance.bySource', () => {
  let prisma: { politician: { findUnique: ReturnType<typeof vi.fn> }; expense: { aggregate: ReturnType<typeof vi.fn> }; vote: { findMany: ReturnType<typeof vi.fn> } };
  let service: PoliticiansService;

  const finance = (over: Record<string, unknown> = {}) => ({
    election_year: 2022, total_received: 1000, donation_count: 3, largest_donation: 800, donor_pf_count: 2, donor_pj_count: 1,
    top_donors: [], source_breakdown: { fundo_eleitoral: 800, fundo_partidario: 100, partido: 20, pessoas_fisicas: 60, proprios: 10, outros_candidatos: 5, outras: 5 },
    ...over,
  });
  const row = (cf: unknown) => ({
    id: 42, name: 'T', full_name: 'T', current_party: 'PL', current_state: 'SP', current_house: 'CAMARA', photo_url: null,
    legislature_id: '1', social_media_urls: null, tse_social_urls: null, is_fpe_member: false, mandates: [],
    campaignFinance: cf ? [cf] : [], votes: [], scores: [],
  });

  beforeEach(() => {
    prisma = {
      politician: { findUnique: vi.fn() },
      expense: { aggregate: vi.fn().mockResolvedValue({ _sum: { net_value: 0 }, _count: { id: 0 } }) },
      vote: { findMany: vi.fn().mockResolvedValue([]) },
    };
    service = new PoliticiansService(prisma as unknown as PrismaService);
  });

  it('devolve a divisão por origem quando ela fecha com o total', async () => {
    prisma.politician.findUnique.mockResolvedValue(row(finance()));
    const r = await service.findOne(42);
    expect(r.campaignFinance?.bySource).toMatchObject({ fundoEleitoral: 800, fundoPartidario: 100, pessoasFisicas: 60 });
  });
  it('ainda não importada (null): bySource null, resto da ficha intacto', async () => {
    prisma.politician.findUnique.mockResolvedValue(row(finance({ source_breakdown: null })));
    const r = await service.findOne(42);
    expect(r.campaignFinance?.bySource).toBeNull();
    expect(r.campaignFinance?.totalReceived).toBe(1000);
  });
  it('não fecha com o total: bySource null', async () => {
    prisma.politician.findUnique.mockResolvedValue(row(finance({ total_received: 5000 })));
    const r = await service.findOne(42);
    expect(r.campaignFinance?.bySource).toBeNull();
  });
  it('sem financiamento: campaignFinance null', async () => {
    prisma.politician.findUnique.mockResolvedValue(row(null));
    const r = await service.findOne(42);
    expect(r.campaignFinance).toBeNull();
  });

  it('devolve os bens declarados e não deixa o valor vazar quando sem verificação', async () => {
    const base = row(finance());
    prisma.politician.findUnique.mockResolvedValue({
      ...base,
      assets: [{ election_year: 2022, total_declared: 1000, item_count: 4, unverified: false, by_type: { imoveis: 1000, moveis: 0, participacoes: 0, aplicacoes: 0, creditos: 0, dinheiro: 0, outros: 0 } }],
    });
    const ok = await service.findOne(42);
    expect(ok.assets).toMatchObject({ total: 1000, itemCount: 4, unverified: false });

    prisma.politician.findUnique.mockResolvedValue({
      ...base,
      assets: [{ election_year: 2022, total_declared: 7777777777, item_count: 4, unverified: true, by_type: {} }],
    });
    const bad = await service.findOne(42);
    expect(bad.assets).toMatchObject({ total: null, unverified: true });
    expect(JSON.stringify(bad)).not.toContain('7777777777');
  });
  it('sem bens: assets null', async () => {
    prisma.politician.findUnique.mockResolvedValue({ ...row(finance()), assets: [] });
    expect((await service.findOne(42)).assets).toBeNull();
  });

  it('com duas eleições configuradas, devolve o histórico em ordem e o mais recente em assets', async () => {
    const mk = (ano: number, total: number) => ({ election_year: ano, total_declared: total, item_count: 2, unverified: false, by_type: { imoveis: total, moveis: 0, participacoes: 0, aplicacoes: 0, creditos: 0, dinheiro: 0, outros: 0 } });
    prisma.politician.findUnique.mockResolvedValue({ ...row(finance()), assets: [mk(2022, 1000), mk(2026, 1500)] });
    const r = (await service.findOne(42)) as unknown as Hist;
    expect(r.assets.electionYear).toBe(2026);
    expect(r.assetsHistory.map((a) => a.electionYear)).toEqual([2022, 2026]);
    // nunca calcula diferença nem crescimento
    expect(JSON.stringify(r.assetsHistory)).not.toMatch(/growth|crescimento|diferen|delta|variacao/i);
  });
  it('com uma só eleição, assetsHistory é vazio (nada de "evolução" com um ponto)', async () => {
    prisma.politician.findUnique.mockResolvedValue({ ...row(finance()), assets: [{ election_year: 2022, total_declared: 10, item_count: 1, unverified: false, by_type: { imoveis: 10, moveis: 0, participacoes: 0, aplicacoes: 0, creditos: 0, dinheiro: 0, outros: 0 } }] });
    const r = (await service.findOne(42)) as unknown as Hist;
    expect(r.assetsHistory).toEqual([]);
  });
  it('uma das eleições sem verificação continua sem expor o valor no histórico', async () => {
    const ok = { election_year: 2022, total_declared: 10, item_count: 1, unverified: false, by_type: { imoveis: 10, moveis: 0, participacoes: 0, aplicacoes: 0, creditos: 0, dinheiro: 0, outros: 0 } };
    const ruim = { election_year: 2026, total_declared: 9_999_999_999, item_count: 1, unverified: true, by_type: {} };
    prisma.politician.findUnique.mockResolvedValue({ ...row(finance()), assets: [ok, ruim] });
    const r = (await service.findOne(42)) as unknown as Hist;
    expect(JSON.stringify(r)).not.toContain('9999999999');
    expect(r.assetsHistory[1]).toMatchObject({ total: null, unverified: true });
  });
});
