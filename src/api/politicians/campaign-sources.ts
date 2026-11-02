/**
 * Origem dos recursos de campanha na resposta da API (Fase C de
 * docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * O banco guarda `source_breakdown` com chaves em snake_case, gravado por
 * scripts/sync-tse-receitas.ts. Aqui ele é validado antes de sair: se faltar
 * categoria, houver valor negativo ou não-numérico, ou a soma não bater com o
 * total arrecadado, devolve `null` e a ficha não mostra a divisão. Zero honesto
 * vale mais que um número que não fecha.
 */

export interface BySourceDto {
  fundoEleitoral: number;
  fundoPartidario: number;
  partido: number;
  pessoasFisicas: number;
  proprios: number;
  outrosCandidatos: number;
  outras: number;
}

const MAP: ReadonlyArray<[keyof BySourceDto, string]> = [
  ['fundoEleitoral', 'fundo_eleitoral'],
  ['fundoPartidario', 'fundo_partidario'],
  ['partido', 'partido'],
  ['pessoasFisicas', 'pessoas_fisicas'],
  ['proprios', 'proprios'],
  ['outrosCandidatos', 'outros_candidatos'],
  ['outras', 'outras'],
];

/** Tolerância da soma: arredondamento de centavos em cada categoria. */
const TOLERANCIA_REAIS = 1;

export function toBySource(raw: unknown, totalReceived: number): BySourceDto | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (!Number.isFinite(totalReceived) || totalReceived <= 0) return null;
  const data = raw as Record<string, unknown>;

  const out = {} as BySourceDto;
  let soma = 0;
  for (const [camel, snake] of MAP) {
    const v = data[snake];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return null;
    out[camel] = v;
    soma += v;
  }
  if (Math.abs(soma - totalReceived) > TOLERANCIA_REAIS) return null;
  return out;
}
