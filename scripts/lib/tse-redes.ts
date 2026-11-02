/**
 * Redes sociais declaradas ao TSE (rede_social_candidato_2022.zip).
 * Lógica pura de scripts/sync-tse-redes.ts, para poder testar sem banco.
 *
 * Colunas usadas do CSV: SQ_CANDIDATO, NR_ORDEM_REDE_SOCIAL, DS_URL.
 * A URL é guardada CRUA (só aparada); quem sanitiza é a API, na leitura, com o
 * mesmo sanitizador das redes da Câmara. Assim uma regra nova de sanitização
 * vale para o dado já importado, sem reimportar.
 */

export interface RedeRow {
  SQ_CANDIDATO: string;
  NR_ORDEM_REDE_SOCIAL: string;
  DS_URL: string;
}

/** Limite por candidato: o maior caso real é pequeno; acima disso é lixo. */
export const MAX_REDES_POR_CANDIDATO = 20;

/** SQ_CANDIDATO -> URLs na ordem declarada, sem vazias nem repetidas. */
export function agruparRedes(rows: ReadonlyArray<RedeRow>): Map<string, string[]> {
  const porCandidato = new Map<string, Array<{ ordem: number; url: string }>>();
  for (const r of rows) {
    const sq = (r.SQ_CANDIDATO ?? '').trim();
    const url = (r.DS_URL ?? '').trim();
    if (!sq || !url) continue;
    const ordem = Number.parseInt(r.NR_ORDEM_REDE_SOCIAL, 10);
    const lista = porCandidato.get(sq) ?? [];
    lista.push({ ordem: Number.isFinite(ordem) ? ordem : Number.MAX_SAFE_INTEGER, url });
    porCandidato.set(sq, lista);
  }

  const saida = new Map<string, string[]>();
  for (const [sq, lista] of porCandidato) {
    lista.sort((a, b) => a.ordem - b.ordem);
    const urls = [...new Set(lista.map((x) => x.url))].slice(0, MAX_REDES_POR_CANDIDATO);
    if (urls.length) saida.set(sq, urls);
  }
  return saida;
}

export interface TseSocialUrls {
  ano: number;
  redes: string[];
}

export const montarTseSocialUrls = (ano: number, redes: string[]): TseSocialUrls => ({ ano, redes });

/** Igualdade estrutural simples, para só gravar quando mudou. */
export function mesmoConteudo(a: unknown, b: TseSocialUrls): boolean {
  if (!a || typeof a !== 'object') return false;
  const x = a as Partial<TseSocialUrls>;
  return x.ano === b.ano && Array.isArray(x.redes) && x.redes.length === b.redes.length && x.redes.every((u, i) => u === b.redes[i]);
}
