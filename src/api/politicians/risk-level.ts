/**
 * Nível do selo de gastos ("Regular" / "Atenção" / "Atípico") — decisão D5 de
 * docs/PLANO-CONFIANCA-E-DADOS-2027.md.
 *
 * O selo pode vir de duas medidas, e elas divergem muito (medido em produção em
 * 2026-11-02, 174 parlamentares com despesa): pelo VALOR marcado, 50 são
 * "Atípico"; pela CONTAGEM de despesas marcadas, só 3. O medidor da ficha
 * mostra a contagem.
 *
 *   'valor'            comportamento atual: % do valor marcado
 *   'contagem'         % das despesas marcadas, a mesma medida do medidor
 *   'contagem_minimo'  como 'contagem', mas "Atípico" exige pelo menos
 *                      MIN_MARCADAS despesas marcadas (com menos, limita em "Atenção")
 *
 * O padrão (RISK_BASIS) preserva o comportamento atual até a decisão de quem
 * edita o site. Trocar é mudar UMA linha e rodar os testes.
 */

export type RiskBasis = 'valor' | 'contagem' | 'contagem_minimo';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/** Escolha vigente. Ver docs/PLANO-CONFIANCA-E-DADOS-2027.md, seção 11 (D5). */
export const RISK_BASIS: RiskBasis = 'contagem';

/** Mínimo de despesas marcadas para o selo mais alto na base 'contagem_minimo'. */
export const MIN_MARCADAS = 5;

export const LIMITE_ATENCAO = 5;
export const LIMITE_ATIPICO = 10;

export interface RiskInput {
  suspiciousCount: number;
  totalCount: number;
  suspiciousValue: number;
  totalValue: number;
}

const porLimites = (pct: number): RiskLevel => (pct > LIMITE_ATIPICO ? 'HIGH' : pct > LIMITE_ATENCAO ? 'MEDIUM' : 'LOW');

export function computeRiskLevel(i: RiskInput, basis: RiskBasis = RISK_BASIS): RiskLevel {
  if (basis === 'valor') {
    const pct = i.totalValue > 0 ? (i.suspiciousValue / i.totalValue) * 100 : 0;
    return porLimites(pct);
  }
  const pct = i.totalCount > 0 ? (i.suspiciousCount / i.totalCount) * 100 : 0;
  const nivel = porLimites(pct);
  if (basis === 'contagem_minimo' && nivel === 'HIGH' && i.suspiciousCount < MIN_MARCADAS) return 'MEDIUM';
  return nivel;
}
