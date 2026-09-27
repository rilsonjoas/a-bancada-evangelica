/**
 * news-curation.ts
 * Regras que mantêm a fila de curadoria de notícias num tamanho que uma
 * pessoa consegue revisar (decisão 2026-09-27, docs/DECISOES.md).
 *
 * Nenhuma regra aqui aprova nada nem julga o conteúdo editorial: elas só
 * descartam o que não é notícia (página de candidatura, título que é só o
 * nome, site de partido) e limitam quanto fica esperando. Aprovar continua
 * sendo 100% humano.
 *
 * Funções puras — usadas na coleta (`sync-news.ts`) e na manutenção diária
 * da fila (`sync-worker.ts`), testadas em `__tests__/news-curation.test.ts`.
 */

/** Notícia publicada há mais que isso não entra e, se estiver na fila, expira. */
export const CURATION_MAX_AGE_DAYS = 30;

/** Teto de pendentes por parlamentar — ficam as mais recentes. */
export const CURATION_MAX_PENDING_PER_POLITICIAN = 5;

export type JunkReason = 'titulo_so_nome' | 'pagina_candidatura' | 'fonte_partidaria';

export function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const alnumOnly = (s: string) => normalizeTitle(s).replace(/[^a-z0-9]/g, '');

// Páginas-ficha de candidato (ND Mais, Tribuna do Paraná, Itatiaia, G1),
// não matérias. Os padrões exigem a estrutura da ficha — número de urna ou
// "| Eleições 20xx" — pra não pegar notícia normal que fala de candidatura.
const CANDIDATE_PAGE_PATTERNS = [
  /veja o numero do candidat/,
  /\d{2,5}\s*(\([^)]*\))?\s*[-–:]\s*candidat[oa] a /,
  /^[^|:]{3,60}: candidatura a [a-z ]+ \| eleicoes 20\d\d$/,
  /\|\s*candidat[oa] a .*eleicoes 20\d\d/,
  // Variante do G1 sem separador: "Fulano Candidato a Deputado Federal em SP nas eleições 2026"
  /^[^,|:]{3,60} candidat[oa] a (deputad|senad|governad|vice)[a-z ]* (em|no|na|nos|nas|do|da|de) [a-z ]+ nas eleicoes 20\d\d$/,
];

// Fontes que são o próprio partido — autopromoção, não imprensa. Lista
// fechada nas siglas observadas na fila (2026-09-27): veículo com número
// no nome ("Fonte 83", "Sul 21", "Rede 98") não pode cair aqui.
const PARTY_SOURCE_PATTERNS = [
  /^partido\b/,
  /^(republicanos 10|psb 40|psol 50|avante 70)$/,
  /^republicanos10\.org\.br$/,
];

export function junkReason(
  item: { title: string; sourceName: string },
  politicianName: string,
): JunkReason | null {
  if (alnumOnly(item.title) === alnumOnly(politicianName)) return 'titulo_so_nome';

  const title = normalizeTitle(item.title);
  if (CANDIDATE_PAGE_PATTERNS.some((re) => re.test(title))) return 'pagina_candidatura';

  const source = normalizeTitle(item.sourceName);
  if (PARTY_SOURCE_PATTERNS.some((re) => re.test(source))) return 'fonte_partidaria';

  return null;
}

export function isWithinCurationWindow(publishedAt: Date, now = new Date()): boolean {
  const t = publishedAt.getTime();
  if (isNaN(t)) return false;
  return now.getTime() - t <= CURATION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
}

export interface PendingForTrim {
  id: number;
  politicianId: number;
  publishedAt: Date;
}

/**
 * Decide o que sai da fila: primeiro o que passou da janela de idade,
 * depois o que excede o teto por parlamentar (saem as mais antigas).
 */
export function selectQueueExpirations(
  pending: PendingForTrim[],
  now = new Date(),
): { tooOld: number[]; overflow: number[] } {
  const tooOld: number[] = [];
  const byPolitician = new Map<number, PendingForTrim[]>();

  for (const item of pending) {
    if (!isWithinCurationWindow(item.publishedAt, now)) {
      tooOld.push(item.id);
      continue;
    }
    const list = byPolitician.get(item.politicianId) ?? [];
    list.push(item);
    byPolitician.set(item.politicianId, list);
  }

  const overflow: number[] = [];
  for (const list of byPolitician.values()) {
    list
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(CURATION_MAX_PENDING_PER_POLITICIAN)
      .forEach((item) => overflow.push(item.id));
  }

  return { tooOld, overflow };
}
