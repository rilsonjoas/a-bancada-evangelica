// A1 (2026-08-25): números no padrão pt-BR — vírgula decimal.
// Substitui toFixed() em exibições para o usuário ("67.3" → "67,3").
export function fmt(value: number, digits = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/**
 * Tempo relativo em pt-BR ("há 3h", "há 2 dias") — Eixo 1 do
 * docs/PLANO-OPERACAO-SUSTENTAVEL.md: mostrar frescor de dado em vez de
 * fingir que está sempre atualizado. `null`/`undefined` (nenhuma
 * sincronização registrada ainda) vira null — quem chama decide como
 * exibir esse caso (ex.: "nunca sincronizado").
 */
export function formatRelativeTime(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;

  const diffMs = Date.now() - d.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);

  if (diffMinutes < 1) return 'agora mesmo';
  if (diffMinutes < 60) return `há ${diffMinutes} min`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours}h`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return 'há 1 dia';
  return `há ${diffDays} dias`;
}
