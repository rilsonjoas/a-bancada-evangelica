/**
 * Redes sociais do parlamentar, sanitizadas para exibição
 * (Fase B de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * Entrada: `politicians.social_media_urls`, como os syncs gravam hoje:
 *   - Câmara: `{ "redes": ["https://...", ...] }`  (campo `redeSocial` da API)
 *   - Senado: `{ "website": "https://..." }`        (`UrlPaginaParticular`)
 * O comentário do `schema.prisma` ("facebook, instagram...") não descreve esse
 * formato; vale o que está aqui, medido em produção em 2026-11-01.
 *
 * O que esta função garante:
 *   - só `http`/`https`, sem credenciais embutidas, sem URL gigante;
 *   - só redes conhecidas, com o domínio conferido de forma exata
 *     (`eviltwitter.com` e `instagram.com.evil.example` não passam);
 *   - só PERFIL: post, reel, tweet, vídeo, playlist e link de compartilhamento
 *     são descartados;
 *   - rastreadores (`igshid`, `mibextid`, `utm_*`, `s`, `t`, `locale`...) saem.
 *     O único parâmetro preservado é o `id` de `facebook.com/profile.php`,
 *     sem o qual o link deixa de apontar para a pessoa;
 *   - `http://` sobe para `https://` nas redes conhecidas.
 *
 * Nada aqui acessa a rede nem lê o conteúdo dos perfis. O site apenas linka.
 */

export type SocialPlatform = 'instagram' | 'x' | 'facebook' | 'youtube' | 'website';

export interface SocialLink {
  platform: SocialPlatform;
  label: string;
  url: string;
  /** Quem informou o link: a casa legislativa ou o TSE (candidatura de 2022). */
  origin: 'CAMARA' | 'SENADO' | 'TSE';
}

export interface SanitizedSocialUrl {
  platform: SocialPlatform;
  url: string;
  /** Preenchido por `collectSocialCandidates`; `sanitizeSocialUrl` não sabe de onde veio. */
  origin?: SocialLink['origin'];
}

const MAX_URL_LENGTH = 300;

const LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  x: 'X (Twitter)',
  facebook: 'Facebook',
  youtube: 'YouTube',
  website: 'Site do parlamentar',
};

/** Ordem fixa de exibição. */
const ORDER: SocialPlatform[] = ['instagram', 'x', 'facebook', 'youtube', 'website'];

const hostIs = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

const segmentsOf = (path: string) => path.split('/').filter(Boolean);

type Known = Exclude<SocialPlatform, 'website'>;

function detectPlatform(host: string): Known | null {
  if (hostIs(host, 'instagram.com')) return 'instagram';
  if (hostIs(host, 'facebook.com')) return 'facebook';
  if (hostIs(host, 'twitter.com') || hostIs(host, 'x.com')) return 'x';
  if (hostIs(host, 'youtube.com')) return 'youtube';
  return null;
}

const INSTAGRAM_NOT_PROFILE = new Set(['p', 'reel', 'reels', 'tv', 'explore', 'stories', 'accounts', 'direct', 'about', 'legal']);
const FACEBOOK_NOT_PROFILE = new Set([
  'sharer', 'sharer.php', 'share', 'share.php', 'photo', 'photo.php', 'photos', 'watch',
  'events', 'story.php', 'permalink.php', 'groups', 'dialog', 'plugins', 'login', 'l.php',
]);
const X_NOT_PROFILE = new Set(['intent', 'share', 'i', 'hashtag', 'search', 'home', 'explore', 'login', 'settings', 'messages', 'notifications']);
const YOUTUBE_PROFILE_PREFIXES = new Set(['channel', 'c', 'user']);
/**
 * Primeiro segmento do YouTube que NÃO é nome de canal. Necessário porque o
 * formato antigo `youtube.com/NomeDoCanal` (~70 casos reais) tem um único
 * segmento, igual a páginas do próprio site. Medido em 2026-11-01:
 * `youtube.com/videos` redireciona para tendências e `youtube.com/channel`
 * (sem id) abre um canal aleatório.
 */
const YOUTUBE_RESERVED = new Set([
  'watch', 'playlist', 'playlists', 'shorts', 'embed', 'results', 'feed', 'live', 'hashtag',
  'videos', 'featured', 'about', 'community', 'channels', 'premium', 'gaming', 'music',
  'movies', 'kids', 'tv', 'upload', 'account', 'redirect', 'attribution_link', 'oembed',
  'get_video_info', 's', 't', 'audiences', 'channel', 'c', 'user',
]);

/** Devolve a URL canônica do perfil, ou `null` se o endereço não for um perfil. */
function canonicalProfile(platform: Known, u: URL): string | null {
  let path = u.pathname;

  // Formato antigo do Twitter: https://twitter.com/#!/usuario
  if (platform === 'x' && u.hash.startsWith('#!/')) {
    path = u.hash.slice(2).split(/[?#]/)[0];
  }

  const segs = segmentsOf(path);
  if (segs.length === 0) return null;
  const first = segs[0].toLowerCase();
  const cleanPath = `/${segs.join('/')}`;

  switch (platform) {
    case 'instagram':
      if (INSTAGRAM_NOT_PROFILE.has(first)) return null;
      return `https://www.instagram.com${cleanPath}`;

    case 'facebook': {
      if (first === 'profile.php') {
        const id = u.searchParams.get('id');
        return id && /^\d+$/.test(id) ? `https://www.facebook.com/profile.php?id=${id}` : null;
      }
      if (FACEBOOK_NOT_PROFILE.has(first)) return null;
      return `https://www.facebook.com${cleanPath}`;
    }

    case 'x': {
      if (X_NOT_PROFILE.has(first)) return null;
      if (segs[1]?.toLowerCase() === 'status') return null; // tweet, não perfil
      const host = hostIs(u.hostname, 'x.com') ? 'x.com' : 'twitter.com';
      return `https://${host}${cleanPath}`;
    }

    case 'youtube': {
      if (first.startsWith('@')) return `https://www.youtube.com/${segs[0]}`;
      if (YOUTUBE_PROFILE_PREFIXES.has(first)) {
        // /channel/ID, /c/Nome, /user/Nome: precisam do segundo segmento.
        return segs.length >= 2 ? `https://www.youtube.com/${segs[0]}/${segs[1]}` : null;
      }
      if (YOUTUBE_RESERVED.has(first)) return null; // watch, playlist, shorts, videos...
      // Formato antigo: youtube.com/NomeDoCanal. Fica só o primeiro segmento.
      return `https://www.youtube.com/${segs[0]}`;
    }
  }
}

export function sanitizeSocialUrl(
  raw: unknown,
  options: { allowWebsite?: boolean } = {},
): SanitizedSocialUrl | null {
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!text || text.length > MAX_URL_LENGTH) return null;

  let u: URL;
  try {
    u = new URL(text);
  } catch {
    return null;
  }

  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  if (u.username || u.password) return null;

  const host = u.hostname.toLowerCase();
  const platform = detectPlatform(host);

  if (platform) {
    const url = canonicalProfile(platform, u);
    return url ? { platform, url } : null;
  }

  // Domínio que não é rede conhecida: só vale como "site do parlamentar", e
  // só quando o chamador pede (campo `website` do Senado).
  if (options.allowWebsite && host.includes('.')) {
    u.hash = '';
    return { platform: 'website', url: u.toString() };
  }

  return null;
}

/**
 * Links que a auditoria offline (`pnpm auditar:links`) comprovou quebrados.
 * Ver `links-quebrados.ts`. Só entra ali o que respondeu 404/410 em duas
 * consultas independentes; dúvida nunca esconde.
 */
import { LINKS_QUEBRADOS } from './links-quebrados';

const URLS_QUEBRADAS: ReadonlySet<string> = new Set(LINKS_QUEBRADOS.map((l) => l.url));

/**
 * Todos os links válidos declarados, na ordem de prioridade, ANTES de escolher
 * um por plataforma e de esconder os quebrados. A auditoria usa esta lista para
 * checar também os links "reserva".
 *
 * Prioridade: o que a casa legislativa informa hoje vem primeiro; o que o
 * candidato declarou ao TSE em 2022 (`tseRaw`, `{ ano, redes: [...] }`) só
 * preenche as redes que a casa não informou.
 */
export function collectSocialCandidates(
  house: 'CAMARA' | 'SENADO',
  raw: unknown,
  tseRaw?: unknown,
): SanitizedSocialUrl[] {
  const candidates: SanitizedSocialUrl[] = [];

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const data = raw as Record<string, unknown>;
    if (house === 'CAMARA' && Array.isArray(data.redes)) {
      for (const item of data.redes) {
        const s = sanitizeSocialUrl(item);
        if (s) candidates.push({ ...s, origin: house });
      }
    }
    if (house === 'SENADO') {
      const s = sanitizeSocialUrl(data.website, { allowWebsite: true });
      if (s) candidates.push({ ...s, origin: house });
    }
  }

  if (tseRaw && typeof tseRaw === 'object' && !Array.isArray(tseRaw)) {
    const redes = (tseRaw as Record<string, unknown>).redes;
    if (Array.isArray(redes)) {
      for (const item of redes) {
        const s = sanitizeSocialUrl(item);
        // O TSE não informa "site do parlamentar"; só as redes conhecidas valem.
        if (s) candidates.push({ ...s, origin: 'TSE' });
      }
    }
  }
  return candidates;
}

/**
 * Monta a lista exibida na ficha: um link por plataforma (o primeiro declarado
 * que não esteja comprovadamente quebrado vence), em ordem fixa. Dado fora do
 * formato esperado vira lista vazia, nunca erro: a ficha não pode cair por
 * causa de um campo de redes.
 *
 * `quebradas` existe para teste; em produção vale a lista versionada.
 */
export function buildSocialLinks(
  house: 'CAMARA' | 'SENADO',
  raw: unknown,
  quebradas: ReadonlySet<string> = URLS_QUEBRADAS,
  tseRaw?: unknown,
): SocialLink[] {
  const byPlatform = new Map<SocialPlatform, SanitizedSocialUrl>();
  for (const c of collectSocialCandidates(house, raw, tseRaw)) {
    if (quebradas.has(c.url)) continue;
    if (!byPlatform.has(c.platform)) byPlatform.set(c.platform, c);
  }

  return ORDER.filter((p) => byPlatform.has(p)).map((p) => {
    const c = byPlatform.get(p)!;
    return { platform: p, label: LABELS[p], url: c.url, origin: c.origin ?? house };
  });
}
