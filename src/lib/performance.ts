export type PerformanceLevel = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';

export const ESTIMATED_LABEL = 'Nota estimada por partido';
export const ESTIMATED_BADGE_COLOR = 'bg-slate-100 text-slate-700';

/**
 * Rótulo do selo de nota — descreve a BASE da nota, não um juízo sobre ela.
 *
 * Até 2026-09-27 o selo dizia "Aderência alta / moderada / baixa" a partir
 * das faixas de `SCORE_BANDS`. Tirado no passe de honestidade pré-eleição:
 * as notas publicadas ficam entre 50 e 64 (dispersão 3,2) e 40% do peso vem
 * de critérios sem voto medido, então a faixa separava parlamentares por
 * diferenças que o dado não sustenta. As faixas continuam existindo no motor
 * e na API (`performanceLevel`); só deixam de virar adjetivo na tela.
 *
 * `totalVotes` `undefined`/`null` = sem score algum (Sem dados); `0` = score
 * de estimativa partidária (Nota estimada por partido); `n` = quantos votos
 * próprios sustentam a nota.
 */
export function getPerformanceLabel(_level?: string | null, totalVotes?: number | null): string {
  if (totalVotes == null) return 'Sem dados';
  if (totalVotes === 0) return ESTIMATED_LABEL;
  return `${totalVotes} voto${totalVotes === 1 ? '' : 's'} próprio${totalVotes === 1 ? '' : 's'}`;
}

/** Cor neutra do selo: nenhuma cor de "bom" ou "ruim" para faixa de nota. */
export const MEASURED_BADGE_COLOR = 'bg-blue-50 text-blue-900 border-blue-200';

export function getPerformanceBadgeColor(_level?: string | null, totalVotes?: number | null): string {
  if (totalVotes == null) return 'bg-slate-200 text-slate-600';
  if (totalVotes === 0) return ESTIMATED_BADGE_COLOR;
  return MEASURED_BADGE_COLOR;
}
