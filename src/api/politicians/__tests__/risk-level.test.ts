import { describe, it, expect } from 'vitest';
import { computeRiskLevel, MIN_MARCADAS, RISK_BASIS } from '../risk-level';

// Casos tirados da distribuição real (produção, 2026-11-02): valor marcado alto, contagem baixa.
const pocasGrandes = { suspiciousCount: 3, totalCount: 150, suspiciousValue: 60_000, totalValue: 400_000 }; // valor 15%, contagem 2%
const muitasMarcadas = { suspiciousCount: 20, totalCount: 150, suspiciousValue: 30_000, totalValue: 400_000 }; // valor 7,5%, contagem 13,3%
const poucasMasAltas = { suspiciousCount: 3, totalCount: 20, suspiciousValue: 10, totalValue: 1000 }; // contagem 15%, só 3 marcadas
const limpo = { suspiciousCount: 0, totalCount: 100, suspiciousValue: 0, totalValue: 50_000 };
const semDados = { suspiciousCount: 0, totalCount: 0, suspiciousValue: 0, totalValue: 0 };

describe('computeRiskLevel', () => {
  it('o padrão adota "contagem" (alinhado ao medidor da ficha) conforme a decisão D5', () => {
    expect(RISK_BASIS).toBe('contagem');
    expect(computeRiskLevel(pocasGrandes)).toBe('LOW');
  });

  describe('base "valor" (atual)', () => {
    it('3 despesas grandes entre 150 viram "Atípico": o caso que motivou D5', () => {
      expect(computeRiskLevel(pocasGrandes, 'valor')).toBe('HIGH');
    });
    it('13% das despesas marcadas mas só 7,5% do valor fica em "Atenção" (o inverso do caso acima)', () => {
      expect(computeRiskLevel(muitasMarcadas, 'valor')).toBe('MEDIUM'); // 7,5% do valor
    });
  });

  describe('base "contagem" (igual ao medidor da ficha)', () => {
    it('3 despesas grandes entre 150 NÃO são "Atípico"', () => {
      expect(computeRiskLevel(pocasGrandes, 'contagem')).toBe('LOW');
    });
    it('13% das despesas marcadas é "Atípico"', () => {
      expect(computeRiskLevel(muitasMarcadas, 'contagem')).toBe('HIGH');
    });
    it('limites: exatamente 5% e 10% não passam do nível de baixo', () => {
      expect(computeRiskLevel({ suspiciousCount: 5, totalCount: 100, suspiciousValue: 0, totalValue: 1 }, 'contagem')).toBe('LOW');
      expect(computeRiskLevel({ suspiciousCount: 10, totalCount: 100, suspiciousValue: 0, totalValue: 1 }, 'contagem')).toBe('MEDIUM');
      expect(computeRiskLevel({ suspiciousCount: 11, totalCount: 100, suspiciousValue: 0, totalValue: 1 }, 'contagem')).toBe('HIGH');
    });
  });

  describe('base "contagem_minimo"', () => {
    it('15% mas só 3 marcadas: limitado a "Atenção"', () => {
      expect(computeRiskLevel(poucasMasAltas, 'contagem')).toBe('HIGH');
      expect(computeRiskLevel(poucasMasAltas, 'contagem_minimo')).toBe('MEDIUM');
    });
    it('com o mínimo de marcadas, "Atípico" volta', () => {
      const i = { suspiciousCount: MIN_MARCADAS, totalCount: 30, suspiciousValue: 1, totalValue: 100 }; // 16,7%
      expect(computeRiskLevel(i, 'contagem_minimo')).toBe('HIGH');
    });
    it('não rebaixa o que já era "Atenção" nem "Regular"', () => {
      expect(computeRiskLevel({ suspiciousCount: 7, totalCount: 100, suspiciousValue: 0, totalValue: 1 }, 'contagem_minimo')).toBe('MEDIUM');
      expect(computeRiskLevel(limpo, 'contagem_minimo')).toBe('LOW');
    });
  });

  it.each(['valor', 'contagem', 'contagem_minimo'] as const)('sem dados: "Regular" em %s, sem dividir por zero', (b) => {
    expect(computeRiskLevel(semDados, b)).toBe('LOW');
  });
});
