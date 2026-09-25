import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PoliticiansService } from '../politicians.service';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * Testes do endpoint de despesas marcadas (D2, 2026-09-25).
 *
 * A peça que torna a marcação auditável: o aggregate diz QUANTO está fora do
 * padrão, a lista diz QUAIS e onde abrir o recibo oficial. Sem ela o site
 * afirmava uma diferença estatística sem dar como conferir.
 */
describe('PoliticiansService.flaggedExpenses', () => {
  let prisma: {
    politician: { findUnique: ReturnType<typeof vi.fn> };
    expense: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
  };
  let service: PoliticiansService;

  const rawExpense = (over: Record<string, unknown> = {}) => ({
    id: 'e1',
    year: 2025,
    month: 3,
    expense_type: 'COMBUSTÍVEIS E LUBRIFICANTES',
    supplier_name: 'POSTO IPIRANGA LTDA',
    supplier_document: '12345678000199',
    gross_value: 6000,
    net_value: 6000,
    refund_value: null,
    suspicion_score: 25,
    suspicion_reasons: ['Entre as 1% despesas mais caras'],
    document_url: 'https://www.camara.leg.br/doc.pdf',
    document_number: '123',
    source: 'CAMARA',
    ...over,
  });

  beforeEach(() => {
    prisma = {
      politician: { findUnique: vi.fn().mockResolvedValue({ id: 42 }) },
      expense: {
        findMany: vi.fn().mockResolvedValue([rawExpense()]),
        count: vi.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(180),
      },
    };
    service = new PoliticiansService(prisma as unknown as PrismaService);
  });

  it('devolve a lista com o motivo e o documento oficial', async () => {
    const r = await service.flaggedExpenses(42, 50);

    expect(r.totalFlagged).toBe(3);
    expect(r.totalCount).toBe(180);
    expect(r.hasExpenseData).toBe(true);
    expect(r.flagged).toHaveLength(1);

    const e = r.flagged[0];
    expect(e.netValue).toBe(6000);
    expect(e.reasons).toEqual(['Entre as 1% despesas mais caras']);
    expect(e.documentUrl).toBe('https://www.camara.leg.br/doc.pdf');
    expect(e.isSenado).toBe(false);
  });

  it('marca isSenado pela origem, não pelo tipo de despesa', async () => {
    prisma.expense.findMany.mockResolvedValue([rawExpense({ source: 'SENADO' })]);
    const r = await service.flaggedExpenses(42, 50);
    expect(r.flagged[0].isSenado).toBe(true);
  });

  it('converte document_url ausente em null em vez de string vazia', async () => {
    // 56% do acervo não tem documento publicado; a UI não pode prometer link
    // onde não existe.
    prisma.expense.findMany.mockResolvedValue([rawExpense({ document_url: '' })]);
    const r = await service.flaggedExpenses(42, 50);
    expect(r.flagged[0].documentUrl).toBeNull();
  });

  it('hasSupplierDocument reflete CNPJ/CPF em branco', async () => {
    prisma.expense.findMany.mockResolvedValue([rawExpense({ supplier_document: '   ' })]);
    const r = await service.flaggedExpenses(42, 50);
    expect(r.flagged[0].hasSupplierDocument).toBe(false);
  });

  it('D6: devolve hasExpenseData=false quando o parlamentar não tem despesa', async () => {
    prisma.expense.count.mockReset();
    prisma.expense.count.mockResolvedValue(0);
    prisma.expense.findMany.mockResolvedValue([]);

    const r = await service.flaggedExpenses(42, 50);
    expect(r.hasExpenseData).toBe(false);
    expect(r.totalFlagged).toBe(0);
    expect(r.flagged).toEqual([]);
  });

  it('devolve estado vazio para parlamentar inexistente, sem tocar em despesa', async () => {
    prisma.politician.findUnique.mockResolvedValue(null);

    const r = await service.flaggedExpenses(999, 50);
    expect(r).toEqual({ flagged: [], totalFlagged: 0, hasExpenseData: false });
    expect(prisma.expense.findMany).not.toHaveBeenCalled();
  });

  it('filtra somente as despesas marcadas e ordena por valor decrescente', async () => {
    await service.flaggedExpenses(42, 50);
    // findMany recebe UM objeto de argumento, não (where, opts)
    const arg = prisma.expense.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({ politician_id: 42, is_suspicious: true });
    expect(arg.orderBy).toEqual({ net_value: 'desc' });
    expect(arg.take).toBe(50);
  });
});

/**
 * Base de cálculo por critério (`votesPerCriteria`).
 *
 * ACHADO REAL 2026-09-25: o groupBy por key_agenda_id com reduce
 * sobrescrevia em vez de somar. Um parlamentar com 41 votos em
 * RESPONSABILIDADE_SOCIAL recebia count=1 — a última pauta do grupo, não a
 * soma. A UI mostrava "1 votação" para quem votou 41 vezes, e a
 * proveniência da nota ficava errada nos dois sentidos.
 *
 * Além disso, `count` passou a contar ASSUNTOS (títulos distintos), não
 * linhas de pauta, para ficar coerente com a média por assunto do motor de
 * scoring.
 */
describe('PoliticiansService.findOne — votesPerCriteria', () => {
  let prisma: Record<string, unknown>;
  let service: PoliticiansService;

  const voto = (
    applied: number,
    criteria: string,
    title: string,
  ) => ({ applied_score: applied, key_agenda: { criteria, title } });

  beforeEach(() => {
    prisma = {
      politician: {
        findUnique: vi.fn().mockResolvedValue({
          id: 42, name: 'Teste', full_name: 'Teste', current_party: 'PL',
          current_state: 'SP', current_house: 'CAMARA', photo_url: null,
          is_fpe_member: false, mandates: [], campaignFinance: [], votes: [],
          scores: [{
            life_protection: 50, family_values: 50, moral_integrity: 50,
            social_responsibility: 50, religious_freedom: 50, overall_score: 50,
            performance_level: 'AVERAGE', performance_label: 'x',
            performance_description: '', total_votes: 0, consistency_score: 0,
            national_rank: 1, state_rank: 1, party_rank: 1,
          }],
        }),
      },
      // findOne chama expense.aggregate() DUAS vezes: a primeira devolve o
      // total, a segunda (dentro de um .then encadeado) devolve só as
      // suspeitas. Cada chamada tem de devolver o formato que ela espera.
      expense: {
        aggregate: vi.fn()
          .mockResolvedValueOnce({ _sum: { net_value: 1000 }, _count: { id: 10 } })
          .mockResolvedValueOnce({ _sum: { net_value: 0 }, _count: { id: 0 } }),
      },
      vote: {
        findMany: vi.fn().mockResolvedValue([]),
        groupBy: vi.fn(),
      },
    };
    service = new PoliticiansService(prisma as unknown as PrismaService);
  });

  it('SOMA as pautas do mesmo critério em vez de sobrescrever', async () => {
    // A regressão: 3 pautas distintas de RESPONSABILIDADE_SOCIAL.
    (prisma.vote.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      voto(10, 'SOCIAL_RESPONSIBILITY', 'PL 1/2024'),
      voto(-10, 'SOCIAL_RESPONSIBILITY', 'PL 2/2024'),
      voto(8, 'SOCIAL_RESPONSIBILITY', 'PL 3/2024'),
    ]);

    const r = await service.findOne(42);
    const social = r.votesPerCriteria.SOCIAL_RESPONSIBILITY;
    expect(social.count).toBe(3);
    expect(social.votes).toBe(3);
    expect(social.totalImpact).toBe(8);
  });

  it('conta ASSUNTOS distintos quando a mesma proposição foi voting várias vezes', async () => {
    // Mesmo título, 3 sessões — o caso real do acervo.
    (prisma.vote.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      voto(10, 'SOCIAL_RESPONSIBILITY', 'PL 2159/2021'),
      voto(10, 'SOCIAL_RESPONSIBILITY', 'PL 2159/2021'),
      voto(10, 'SOCIAL_RESPONSIBILITY', 'PL 2159/2021'),
      voto(-10, 'SOCIAL_RESPONSIBILITY', 'PL 999/2024'),
    ]);

    const r = await service.findOne(42);
    const social = r.votesPerCriteria.SOCIAL_RESPONSIBILITY;
    expect(social.count).toBe(2);   // 2 assuntos
    expect(social.votes).toBe(4);   // 4 linhas de voto
    expect(social.totalImpact).toBe(20);
  });

  it('separa critérios diferentes', async () => {
    (prisma.vote.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      voto(10, 'FAMILY_VALUES', 'PL 1/2024'),
      voto(10, 'MORAL_INTEGRITY', 'PL 1/2024'),
    ]);
    const r = await service.findOne(42);
    expect(r.votesPerCriteria.FAMILY_VALUES.count).toBe(1);
    expect(r.votesPerCriteria.MORAL_INTEGRITY.count).toBe(1);
  });

  it('não devolve entrada para critério sem voto', async () => {
    (prisma.vote.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      voto(10, 'FAMILY_VALUES', 'PL 1/2024'),
    ]);
    const r = await service.findOne(42);
    expect(r.votesPerCriteria.FAMILY_VALUES).toBeDefined();
    expect(r.votesPerCriteria.RELIGIOUS_FREEDOM).toBeUndefined();
  });
});
