/**
 * Lógica pura da auditoria de links (scripts/auditar-links.ts).
 * Sem rede e sem banco aqui, para poder testar cada regra.
 *
 * Regra de ouro: esconder um link é uma afirmação ("está quebrado"), então só
 * se afirma com prova. Prova = 404/410 em DUAS consultas independentes.
 * Timeout, 5xx, 429, 403 e erro de rede são "inconclusivo": o link continua
 * aparecendo e entra no relatório.
 */

export type Veredito = 'ok' | 'quebrado' | 'inconclusivo';

export interface Resposta {
  /** Status HTTP final (depois de redirecionamentos) ou null se não houve resposta. */
  status: number | null;
}

/** Status que, sozinhos, indicam que a página não existe. */
export const STATUS_DE_AUSENCIA = new Set([404, 410]);

export function veredito(primeira: Resposta, segunda: Resposta | null): Veredito {
  if (primeira.status !== null && primeira.status >= 200 && primeira.status < 300) return 'ok';
  if (
    primeira.status !== null &&
    STATUS_DE_AUSENCIA.has(primeira.status) &&
    segunda &&
    segunda.status !== null &&
    STATUS_DE_AUSENCIA.has(segunda.status)
  ) {
    return 'quebrado';
  }
  // Primeira ausente mas a segunda respondeu 2xx: a segunda manda, o link funciona.
  if (segunda && segunda.status !== null && segunda.status >= 200 && segunda.status < 300) return 'ok';
  return 'inconclusivo';
}

export interface Entrada {
  url: string;
  status: number;
  verificadoEm: string;
}

/**
 * Nova lista de ocultos a partir da anterior e do resultado desta rodada.
 * - quebrado nesta rodada: entra (ou é atualizado);
 * - ok nesta rodada: sai (voltou a funcionar);
 * - inconclusivo: mantém o que já estava (não houve prova nova, nem contra);
 * - URL que não existe mais nos dados: sai.
 */
export function novaLista(
  anterior: ReadonlyArray<Entrada>,
  resultados: ReadonlyMap<string, { veredito: Veredito; status: number | null }>,
  hoje: string,
): Entrada[] {
  const saida = new Map<string, Entrada>();
  for (const e of anterior) {
    const r = resultados.get(e.url);
    if (r && r.veredito === 'inconclusivo') saida.set(e.url, e);
  }
  for (const [url, r] of resultados) {
    if (r.veredito === 'quebrado') saida.set(url, { url, status: r.status as number, verificadoEm: hoje });
  }
  return [...saida.values()].sort((a, b) => a.url.localeCompare(b.url));
}

/** Código-fonte do arquivo gerado `links-quebrados.ts`. */
export function renderizarArquivo(lista: ReadonlyArray<Entrada>): string {
  const linhas = lista
    .map((e) => `  { url: ${JSON.stringify(e.url)}, status: ${e.status}, verificadoEm: ${JSON.stringify(e.verificadoEm)} },`)
    .join('\n');
  return `/**
 * Links de redes sociais comprovadamente quebrados (a ficha não os mostra).
 *
 * ARQUIVO GERADO por \`pnpm auditar:links --gravar\` (scripts/auditar-links.ts).
 * Não edite à mão: rode a auditoria de novo e revise o diff.
 * Regra: só entra o que respondeu 404/410 em duas consultas independentes.
 */
export interface LinkQuebrado {
  url: string;
  status: number;
  /** Data (AAAA-MM-DD) da última auditoria que confirmou. */
  verificadoEm: string;
}

export const LINKS_QUEBRADOS: ReadonlyArray<LinkQuebrado> = [${lista.length ? `\n${linhas}\n` : ''}];
`;
}

/** Só YouTube é auditável: Instagram, Facebook e X bloqueiam consulta automatizada. */
export function auditavel(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return h === 'youtube.com' || h.endsWith('.youtube.com');
  } catch {
    return false;
  }
}
