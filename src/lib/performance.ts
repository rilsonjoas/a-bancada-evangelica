export type PerformanceLevel = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';

export const PERFORMANCE_LABELS: Record<PerformanceLevel, string> = {
  EXCELLENT: 'Aderência muito alta',
  GOOD: 'Aderência alta',
  AVERAGE: 'Aderência moderada',
  POOR: 'Aderência baixa',
};

export const PERFORMANCE_BADGE_COLORS: Record<PerformanceLevel, string> = {
  EXCELLENT: 'bg-green-100 text-green-800',
  GOOD: 'bg-blue-100 text-blue-800',
  AVERAGE: 'bg-yellow-100 text-yellow-800',
  POOR: 'bg-red-100 text-red-800',
};

export const ESTIMATED_LABEL = 'Nota estimada por partido';
export const ESTIMATED_BADGE_COLOR = 'bg-slate-100 text-slate-700';

/**
 * Label honesto do desempenho: sem voto próprio registrado, o político não
 * tem aderência mensurável — a nota é estimada pela média do partido.
 * `totalVotes` `undefined`/`null` = sem score algum (Sem dados); `0` = score
 * de estimativa partidária (Nota estimada por partido).
 */
export function getPerformanceLabel(level?: string | null, totalVotes?: number | null): string {
  if (totalVotes == null) return 'Sem dados';
  if (totalVotes === 0) return ESTIMATED_LABEL;
  return PERFORMANCE_LABELS[(level ?? 'AVERAGE') as PerformanceLevel] ?? 'Sem dados';
}

export function getPerformanceBadgeColor(level?: string | null, totalVotes?: number | null): string {
  if (totalVotes == null) return 'bg-slate-200 text-slate-600';
  if (totalVotes === 0) return ESTIMATED_BADGE_COLOR;
  return PERFORMANCE_BADGE_COLORS[(level ?? 'AVERAGE') as PerformanceLevel] ?? PERFORMANCE_BADGE_COLORS.AVERAGE;
}