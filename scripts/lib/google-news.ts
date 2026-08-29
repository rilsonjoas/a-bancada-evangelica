/**
 * google-news.ts
 * Coleta de menções na imprensa via Google News RSS (#7).
 *
 * Decisões de design:
 *  - Google News RSS não exige API key e tem CORS aberto — v1 sem custo.
 *  - Também serve como base para a UI admin (busca manual por candidato).
 *  - O parse é 100% sem dependência (regex sobre XML) para manter testes
 *    rápidos e o deploy sem libs extras (mesma filosofia da seed do M5).
 *  - `parseRss` retorna o canal de forma estável: title/link/pubDate brutos;
 *    a curadoria decide (nunca editorializamos o título — só reproduzimos).
 */

export interface NewsItem {
  /** Título cru. No Google News RSS vem com o nome da fonte no final: "Título - Fonte" */
  title: string;
  /** URL do artigo (não é o link do Google News — já despachamos o lançador) */
  link: string;
  /** ISO 8601 (ex.: 2026-08-28T14:30:00Z) */
  pubDate: string;
  /** Nome da fonte extraído do fim do título (- Fonte) */
  source: string | null;
}

const TITLE_SOURCE_RE = /\s+-\s+([^-]+)$/;

/**
 * Separa "Título da matéria - Nome da Fonte" em título editorial e fonte.
 * O padrão "- Fonte" é o formato consolidado do Google News RSS atual;
 * quando não existe, mantém o título inteiro e fonte nula.
 */
export function splitTitleSource(rawTitle: string): { title: string; source: string | null } {
  const m = TITLE_SOURCE_RE.exec(rawTitle.trim());
  if (!m) return { title: rawTitle.trim(), source: null };
  return {
    title: rawTitle.trim().slice(0, -m[0].length).trim(),
    source: m[1].trim(),
  };
}

/**
 * Extrai itens de um XML de feed RSS.
 * Não usa DOMParser (não existe em Node) nem lib — regex em três marcadores
 * estáveis. O `<item>` do Google News contém `<title>`, `<link>`, `<pubDate>`.
 */
export function parseRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  // Regex global que captura um <item> por vez; os grupos internos são não-gulosos
  const sectionRe = /<item>([\s\S]*?)<\/item>/g;
  const titleRe = /<title[^>]*>([\s\S]*?)<\/title>/;
  const linkRe = /<link[^>]*>([\s\S]*?)<\/link>/;
  const pubDateRe = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/;

  let match: RegExpExecArray | null;
  while ((match = sectionRe.exec(xml)) !== null) {
    const body = match[1];
    const titleRaw = decodeXml(titleRe.exec(body)?.[1] ?? '');
    const link = decodeXml(linkRe.exec(body)?.[1] ?? '').trim();
    const pubDateRaw = decodeXml(pubDateRe.exec(body)?.[1] ?? '').trim();
    if (!link) continue; // item sem link é inútil para o produto
    const { title, source } = splitTitleSource(titleRaw);
    items.push({ title, link, source, pubDate: pubDateRaw });
  }
  return items;
}

function decodeXml(s: string): string {
  // 1) CDATA primeiro: dentro dele & é literal, não entidade
  const stripped = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  // 2) entidades XML na ordem que evita double-decode (&amp; -> &, que depois não é re-escaneado)
  return stripped
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export interface NewsQuery {
  /** Termos entre aspas: nome completo exato do parlamentar */
  name: string;
  /** Contexto partido/UF para afinar a busca sem perder o homônimo */
  party?: string | null;
  state?: string | null;
}

/** Monta a query de busca do Google News. */
export function buildNewsQuery({ name, party, state }: NewsQuery): string {
  const parts = [`"${name}"`];
  if (party) parts.push(party);
  if (state) parts.push(state);
  return parts.join(' ');
}

/**
 * Filtro anti-ruído/homônimo: exige que o nome do parlamentar apareça no
 * título. A busca do Google News é frouxa (retorna pesquisas eleitorais e
 * matérias correlatas que só citam o nome no corpo) — sem este filtro a fila
 * de curadoria entope. Ainda assim 100% vai para PENDING; homônimos reais
 * seguem dependendo da decisão humana.
 */
export function isLikelyAbout(query: NewsQuery, itemTitle: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const title = norm(itemTitle);
  const name = norm(query.name);

  // Nome completo (ex.: "joao da silva") no título — o caso comum.
  if (title.includes(name)) return true;
  return false;
}

/** Endpoint público do Google News RSS (pt-BR). */
export function googleNewsFeedUrl(query: string): string {
  return (
    `https://news.google.com/rss/search?q=${encodeURIComponent(query)}` +
    `&hl=pt-BR&gl=BR&ceid=BR:pt-419`
  );
}

/** Busca de verdade (usada pelo script de sync e pela curadoria manual). */
export async function searchGoogleNews(query: NewsQuery): Promise<NewsItem[]> {
  const url = googleNewsFeedUrl(buildNewsQuery(query));
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (a-bancada-evangelica/1.0)' },
  });
  if (!res.ok) throw new Error(`Google News RSS ${res.status}: ${url}`);
  return parseRss(await res.text());
}