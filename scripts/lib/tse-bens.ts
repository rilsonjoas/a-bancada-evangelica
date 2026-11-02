/**
 * Bens declarados ao TSE (bem_candidato_2022.zip). Lógica pura de
 * scripts/sync-tse-bens.ts (Fase D de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * Só se guardam agregados por candidato: total, número de bens, maior item e
 * total por grupo. A descrição livre de cada bem não é lida nem guardada.
 */
import { parseMoneyBRL } from './tse-receitas';

export interface BemRow {
  SQ_CANDIDATO: string;
  CD_TIPO_BEM_CANDIDATO: string;
  VR_BEM_CANDIDATO: string;
}

export type GrupoBem = 'imoveis' | 'moveis' | 'participacoes' | 'aplicacoes' | 'creditos' | 'dinheiro' | 'outros';

export const GRUPOS_BEM: ReadonlyArray<GrupoBem> = [
  'imoveis', 'moveis', 'participacoes', 'aplicacoes', 'creditos', 'dinheiro', 'outros',
];

/** Trava de sanidade do plano: acima disso o valor é tratado como "sem verificação". */
export const LIMITE_TOTAL = 1_000_000_000;
export const LIMITE_ITEM = 500_000_000;

/**
 * Grupo pelo código do tipo de bem (`CD_TIPO_BEM_CANDIDATO`). A tabela de
 * códigos do TSE é organizada por dezena: 1-3 e 11-19 imóveis; 21-29 bens
 * móveis; 31-39 participações em empresas; 41-49 e 71-79 aplicações e fundos
 * (e 97, VGBL); 51-59 créditos; 61-69 dinheiro e depósitos. Código novo ou
 * desconhecido vai para "outros": nenhum valor é descartado.
 */
export function grupoDoBem(codigo: string | number): GrupoBem {
  const c = Number.parseInt(String(codigo), 10);
  if (!Number.isFinite(c)) return 'outros';
  if ((c >= 1 && c <= 3) || (c >= 11 && c <= 19)) return 'imoveis';
  if (c >= 21 && c <= 29) return 'moveis';
  if (c >= 31 && c <= 39) return 'participacoes';
  if ((c >= 41 && c <= 49) || (c >= 71 && c <= 79) || c === 97) return 'aplicacoes';
  if (c >= 51 && c <= 59) return 'creditos';
  if (c >= 61 && c <= 69) return 'dinheiro';
  return 'outros';
}

export type PorGrupo = Record<GrupoBem, number>;

export const gruposVazios = (): PorGrupo => ({
  imoveis: 0, moveis: 0, participacoes: 0, aplicacoes: 0, creditos: 0, dinheiro: 0, outros: 0,
});

export interface ResumoBens {
  total: number;
  itens: number;
  maiorItem: number;
  porGrupo: PorGrupo;
  semVerificacao: boolean;
}

const centavos = (n: number) => Math.round(n * 100) / 100;

/** SQ_CANDIDATO -> resumo. Linha sem SQ ou com valor negativo/ilegível não soma. */
export function agruparBens(rows: ReadonlyArray<BemRow>): Map<string, ResumoBens> {
  const acc = new Map<string, ResumoBens>();
  for (const r of rows) {
    const sq = (r.SQ_CANDIDATO ?? '').trim();
    if (!sq) continue;
    const valor = parseMoneyBRL(r.VR_BEM_CANDIDATO);
    if (!(valor >= 0)) continue;
    let a = acc.get(sq);
    if (!a) {
      a = { total: 0, itens: 0, maiorItem: 0, porGrupo: gruposVazios(), semVerificacao: false };
      acc.set(sq, a);
    }
    a.total += valor;
    a.itens += 1;
    if (valor > a.maiorItem) a.maiorItem = valor;
    a.porGrupo[grupoDoBem(r.CD_TIPO_BEM_CANDIDATO)] += valor;
  }
  for (const a of acc.values()) {
    a.semVerificacao = a.total > LIMITE_TOTAL || a.maiorItem > LIMITE_ITEM;
    a.total = centavos(a.total);
    a.maiorItem = centavos(a.maiorItem);
    for (const g of GRUPOS_BEM) a.porGrupo[g] = centavos(a.porGrupo[g]);
  }
  return acc;
}
