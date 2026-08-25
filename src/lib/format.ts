// A1 (2026-08-25): números no padrão pt-BR — vírgula decimal.
// Substitui toFixed() em exibições para o usuário ("67.3" → "67,3").
export function fmt(value: number, digits = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
