/**
 * Bens declarados na resposta da API (Fase D de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * O banco guarda agregados gravados por scripts/sync-tse-bens.ts. Antes de
 * sair, o dado é validado: grupos ausentes, valores negativos ou soma que não
 * bate com o total declarado fazem `byType` virar `null`. Valor acima da trava
 * de sanidade (marcado `unverified` na gravação) sai com `total: null`, para a
 * ficha não pôr em destaque um número que provavelmente é erro de digitação.
 */

export interface AssetsDto {
  electionYear: number;
  /** null quando `unverified`: o número não é exibido em destaque. */
  total: number | null;
  itemCount: number;
  unverified: boolean;
  byType: Record<'imoveis' | 'moveis' | 'participacoes' | 'aplicacoes' | 'creditos' | 'dinheiro' | 'outros', number> | null;
}

const GRUPOS = ['imoveis', 'moveis', 'participacoes', 'aplicacoes', 'creditos', 'dinheiro', 'outros'] as const;
const TOLERANCIA_REAIS = 1;

export interface AssetRow {
  election_year: number;
  total_declared: number;
  item_count: number;
  unverified: boolean;
  by_type: unknown;
}

export function toAssetsDto(row: AssetRow | null | undefined): AssetsDto | null {
  if (!row) return null;
  if (!Number.isFinite(row.total_declared) || row.total_declared < 0) return null;

  let byType: AssetsDto['byType'] = null;
  if (row.by_type && typeof row.by_type === 'object' && !Array.isArray(row.by_type)) {
    const data = row.by_type as Record<string, unknown>;
    const out = {} as NonNullable<AssetsDto['byType']>;
    let soma = 0;
    let ok = true;
    for (const g of GRUPOS) {
      const v = data[g];
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) { ok = false; break; }
      out[g] = v;
      soma += v;
    }
    if (ok && Math.abs(soma - row.total_declared) <= TOLERANCIA_REAIS) byType = out;
  }

  return {
    electionYear: row.election_year,
    total: row.unverified ? null : row.total_declared,
    itemCount: row.item_count,
    unverified: row.unverified,
    byType: row.unverified ? null : byType,
  };
}
