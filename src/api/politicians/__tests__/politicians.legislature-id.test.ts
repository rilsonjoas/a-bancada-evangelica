import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PoliticiansService } from '../politicians.service';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * `legislatureId` na ficha (Fase A de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * É o identificador do parlamentar na casa de origem (id do deputado na
 * Câmara, código do senador). A tela usa para montar o link "Ver perfil na
 * Câmara/Senado", e o leitor confere os dados na fonte oficial. Antes ele
 * existia só no banco, e a API não o devolvia.
 */
describe('PoliticiansService.findOne: legislatureId', () => {
  // Tipado explicitamente: o CI roda tsc -p tsconfig.api.json (mais estrito).
  let prisma: {
    politician: { findUnique: ReturnType<typeof vi.fn> };
    expense: { aggregate: ReturnType<typeof vi.fn> };
    vote: { findMany: ReturnType<typeof vi.fn> };
  };
  let service: PoliticiansService;

  const politicianRow = (over: Record<string, unknown> = {}) => ({
    id: 42, name: 'Teste', full_name: 'Teste', current_party: 'PL',
    current_state: 'SP', current_house: 'CAMARA', photo_url: null,
    legislature_id: '204379',
    is_fpe_member: false, mandates: [], campaignFinance: [], votes: [],
    scores: [],
    ...over,
  });

  beforeEach(() => {
    prisma = {
      politician: { findUnique: vi.fn().mockResolvedValue(politicianRow()) },
      expense: {
        aggregate: vi.fn()
          .mockResolvedValueOnce({ _sum: { net_value: 0 }, _count: { id: 0 } })
          .mockResolvedValueOnce({ _sum: { net_value: 0 }, _count: { id: 0 } }),
      },
      vote: { findMany: vi.fn().mockResolvedValue([]) },
    };
    service = new PoliticiansService(prisma as unknown as PrismaService);
  });

  it('devolve o identificador da casa de origem', async () => {
    const r = await service.findOne(42);
    expect(r.legislatureId).toBe('204379');
  });

  it('devolve null (não undefined) quando o banco não tem o identificador', async () => {
    prisma.politician.findUnique.mockResolvedValue(politicianRow({ legislature_id: null }));
    const r = await service.findOne(42);
    // null aparece no JSON; undefined some da resposta e o contrato fica ambíguo.
    expect(r.legislatureId).toBeNull();
    expect(JSON.parse(JSON.stringify(r))).toHaveProperty('legislatureId', null);
  });
});
