import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { FlaggedExpensesResponse } from "@/types/politician";

/**
 * Despesas marcadas como fora do padrão, com o link do recibo oficial.
 *
 * D2 (2026-09-25): existia o número agregado ("R$ 260.807 fora do padrão")
 * sem nenhuma forma de ver QUAIS despesas foram marcadas nem de conferir o
 * documento na fonte. 41.855 das 74.336 despesas do acervo têm `document_url`
 * e 100% têm nome de fornecedor — o dado para auditar já existia, só não era
 * exposto.
 *
 * Erro devolve estado vazio com hasExpenseData=false em vez de estourar: a
 * aba de Gastos continua utilizável mesmo se o endpoint cair.
 */
async function fetchFlagged(id: number, limit: number): Promise<FlaggedExpensesResponse> {
  try {
    return await apiFetch(`/api/politicians/${id}/expenses/flagged?limit=${limit}`);
  } catch {
    return { flagged: [], totalFlagged: 0, totalCount: 0, hasExpenseData: false };
  }
}

export function useFlaggedExpenses(id: number, limit = 50) {
  return useQuery({
    queryKey: ["politician-flagged-expenses", id, limit],
    queryFn: () => fetchFlagged(id, limit),
    enabled: !!id && id > 0,
    // A marcação só muda quando o sync de despesas ou o expenses:recalc roda
    // (domingo 04h e sob comando), então 30 min é seguro e evita refetch
    // desnecessário ao alternar entre abas.
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
}
