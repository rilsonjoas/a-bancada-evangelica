/**
 * Quais eleições a ficha lê do banco — decisões D1 e D2 de
 * docs/PLANO-CONFIANCA-E-DADOS-2027.md.
 *
 * Os padrões preservam o comportamento atual (só 2022). Quando os dados de 2026
 * forem importados e a decisão tomada, basta definir no ambiente da API:
 *   BANCADA_ANO_FINANCIAMENTO=2026            (D1: só quando a prestação for final)
 *   BANCADA_ANOS_BENS=2022,2026               (D2: duas eleições lado a lado)
 * ou trocar os padrões abaixo. Valor inválido NÃO derruba a API: cai no padrão e
 * avisa no log, porque um erro de digitação no ambiente não pode tirar o site do ar.
 */

export const ANO_FINANCIAMENTO_PADRAO = 2022;
export const ANOS_BENS_PADRAO: ReadonlyArray<number> = [2022];

/** Anos de eleição geral: pares, de 2014 a 2050, com resto 2 na divisão por 4 (2018, 2022, 2026...). */
export const anoDeEleicao = (n: number) => Number.isInteger(n) && n >= 2014 && n <= 2050 && n % 4 === 2;

export function lerAno(raw: string | undefined, padrao: number, aviso: (m: string) => void = () => {}): number {
  if (raw === undefined || raw.trim() === '') return padrao;
  const n = Number(raw.trim());
  if (anoDeEleicao(n)) return n;
  aviso(`ano inválido "${raw}"; usando ${padrao}`);
  return padrao;
}

/** Lista de anos separada por vírgula, sem repetidos, em ordem crescente. Qualquer item inválido invalida a lista inteira. */
export function lerAnos(raw: string | undefined, padrao: ReadonlyArray<number>, aviso: (m: string) => void = () => {}): number[] {
  if (raw === undefined || raw.trim() === '') return [...padrao];
  const itens = raw.split(',').map((x) => Number(x.trim()));
  if (itens.length === 0 || !itens.every(anoDeEleicao)) {
    aviso(`lista de anos inválida "${raw}"; usando ${padrao.join(',')}`);
    return [...padrao];
  }
  return [...new Set(itens)].sort((a, b) => a - b);
}

const avisar = (m: string) => console.warn(`[anos-exibidos] ${m}`);

export const ANO_FINANCIAMENTO = lerAno(process.env.BANCADA_ANO_FINANCIAMENTO, ANO_FINANCIAMENTO_PADRAO, avisar);
export const ANOS_BENS = lerAnos(process.env.BANCADA_ANOS_BENS, ANOS_BENS_PADRAO, avisar);
