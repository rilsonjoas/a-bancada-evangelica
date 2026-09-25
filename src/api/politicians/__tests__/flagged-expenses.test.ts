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
