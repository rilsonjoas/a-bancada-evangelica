/**
 * Lógica pura extraída de politicians.service.ts pra poder ser testada
 * sem precisar de banco/Prisma — mesmo padrão de src/services/scoring/
 * criteriaEngine.ts (lógica testável separada do que fala com o banco).
 */

interface CountRow {
  _count: number;
}

/**
 * Transforma o resultado de um Prisma groupBy (ex.: por current_state ou
 * current_party) num mapa { valor: contagem }, ordenado por contagem
 * decrescente (mais representativo primeiro).
 */
export function groupByCountMap<K extends string, R extends CountRow>(
  rows: R[],
  getKey: (row: R) => K,
): Record<K, number> {
  const entries = rows
    .map(row => [getKey(row), row._count] as const)
    .sort((a, b) => b[1] - a[1]);

  return Object.fromEntries(entries) as Record<K, number>;
}
