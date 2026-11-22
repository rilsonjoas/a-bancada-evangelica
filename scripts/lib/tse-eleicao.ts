/**
 * Utilidades comuns dos syncs do TSE por ano (E2 de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 * Lógica pura, sem I/O.
 */
import path from 'node:path';

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Compara rótulos de eleição sem diferenciar caixa nem acento.
 * Achado real (2026-11-02): `consulta_cand` e `bem_candidato` trazem
 * "Eleições Gerais Estaduais 2026" e `rede_social_candidato` traz
 * "ELEIÇÕES GERAIS ESTADUAIS 2026". Comparar com a caixa errada devolve zero
 * linhas sem dar erro.
 */
export function normalizarRotulo(t: string | undefined | null): string {
  return semAcento(t ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function ehEleicaoGeralEstadual(rotulo: string | undefined | null, ano: number): boolean {
  return normalizarRotulo(rotulo) === normalizarRotulo(`Eleições Gerais Estaduais ${ano}`);
}

/** Anos de eleição geral aceitos: pares, de 2014 a 2050 (2018, 2022, 2026...). */
export function anoValido(n: number): boolean {
  return Number.isInteger(n) && n >= 2014 && n <= 2050 && n % 4 === 2;
}

/**
 * Lê `--ano N` (ou `--ano=N`). Sem a flag, devolve o padrão (2022, o
 * comportamento anterior). Ano inválido lança erro, nunca vira o padrão em
 * silêncio: importar o ano errado é o erro caro.
 */
export function lerAno(argv: ReadonlyArray<string>, padrao = 2022): number {
  let presente = false;
  let bruto: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--ano') { presente = true; bruto = argv[i + 1]; }
    else if (argv[i].startsWith('--ano=')) { presente = true; bruto = argv[i].slice('--ano='.length); }
  }
  if (!presente) return padrao;
  const n = Number(bruto);
  if (!anoValido(n)) {
    throw new Error(`--ano inválido: "${bruto ?? ''}". Use um ano de eleição geral (2018, 2022, 2026...).`);
  }
  return n;
}

/**
 * Onde procurar o zip: `data/tse/<ano>/<nome>` primeiro, depois `data/tse/<nome>`
 * (onde ficam os de 2022 baixados em agosto). Devolve o primeiro que existe ou,
 * se nenhum, o caminho padrão para a mensagem de erro dizer onde colocar.
 */
export function resolverZip(
  raiz: string,
  nome: string,
  ano: number,
  existe: (caminho: string) => boolean,
): string {
  const candidatos = [path.join(raiz, String(ano), nome), path.join(raiz, nome)];
  return candidatos.find(existe) ?? candidatos[0];
}

/** Fração (0 a 1) das linhas com prestação de contas FINAL. Sem linhas: 0. */
export function proporcaoFinal(contagemPorTipo: ReadonlyMap<string, number>): number {
  let total = 0;
  let finais = 0;
  for (const [tipo, n] of contagemPorTipo) {
    total += n;
    if (semAcento(tipo).trim().toUpperCase() === 'FINAL') finais += n;
  }
  return total > 0 ? finais / total : 0;
}

/**
 * Trava: só importa financiamento de uma eleição cuja prestação de contas já
 * está (quase toda) final. Medido: 2022 = 98,9%; 2026 em 2026-11-02 = 33%.
 */
export const LIMITE_PRESTACAO_FINAL = 0.95;

export function prestacaoPodeSerImportada(contagemPorTipo: ReadonlyMap<string, number>, aceitarParcial: boolean): boolean {
  return aceitarParcial || proporcaoFinal(contagemPorTipo) >= LIMITE_PRESTACAO_FINAL;
}

/**
 * As redes do TSE ficam num campo de um ano só (`tse_social_urls`). A declaração
 * mais recente vale; uma importação de ano mais antigo nunca sobrescreve uma mais nova.
 */
export function deveSubstituirRedes(anoArmazenado: unknown, anoNovo: number): boolean {
  return typeof anoArmazenado !== 'number' || !Number.isFinite(anoArmazenado) || anoNovo >= anoArmazenado;
}
