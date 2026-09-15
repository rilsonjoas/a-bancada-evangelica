import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const API_URL = process.env.VITE_API_URL ?? 'https://api-bancada.narniano.com';
const BASE_URL = process.env.SITE_URL ?? 'https://a-bancada-evangelica.vercel.app';

interface PoliticianOg {
  id: number;
  name: string;
  currentParty: string;
  currentState: string;
  photoUrl?: string;
  scores?: {
    overall: number;
    performanceLabel: string;
    totalVotes: number;
  };
}

// Gerador de páginas OG estáticas para /politicos/:id (SEO / compartilhamento).
// Roda pós-vite build: copia dist/index.html como shell e troca meta tags
// por dados reais da API — crawlers (WhatsApp/X) pegam o HTML inicial
// (SPA não é executado), clientes com JS veem o normal via React.
export function generatePoliticianPage(
  template: string,
  politician: PoliticianOg,
  baseUrl: string,
  apiUrl: string,
): string {
  const url = `${baseUrl}/politicos/${politician.id}`;
  const score = politician.scores;
  const photoUrl = politician.photoUrl
    ? `${apiUrl}/api/politicians/${politician.id}/photo`
    : `${baseUrl}/Logo.png`;

  const ogTitle = `${politician.name} (${politician.currentParty}/${politician.currentState}) — A Bancada Evangélica`;

  let ogDesc: string;
  if (score && score.totalVotes > 0) {
    ogDesc = `Nota de aderência ${score.overall}/100 (${score.performanceLabel}) — baseada em ${score.totalVotes} votos nominais públicos.`;
  } else {
    const nota = score?.overall ?? '—';
    ogDesc = `Nota ${nota}/100 estimativa (média do partido). Sem votos nominais registrados.`;
  }

  // Apenas o primeiro <title> (SPA shell) é alterado; o resto da página
  // (JS/CSS, Umami) fica intacto — React hidrata normalmente.
  return template
    .replace(/<title>.*?<\/title>/, `<title>${escapeAttr(ogTitle)}</title>`)
    .replace(/<meta name="description" content=".*?"/, `<meta name="description" content="${escapeAttr(ogDesc)}"`)
    .replace(/<meta property="og:title" content=".*?"/, `<meta property="og:title" content="${escapeAttr(ogTitle)}"`)
    .replace(/<meta property="og:description" content=".*?"/, `<meta property="og:description" content="${escapeAttr(ogDesc)}"`)
    .replace(/<meta property="og:type" content=".*?"/, `<meta property="og:type" content="profile"`)
    .replace(/<meta property="og:url" content=".*?"/, `<meta property="og:url" content="${escapeAttr(url)}"`)
    .replace(/<meta property="og:image" content=".*?"/, `<meta property="og:image" content="${escapeAttr(photoUrl)}"`)
    .replace(/<meta name="twitter:title" content=".*?"/, `<meta name="twitter:title" content="${escapeAttr(ogTitle)}"`)
    .replace(/<meta name="twitter:description" content=".*?"/, `<meta name="twitter:description" content="${escapeAttr(ogDesc)}"`)
    .replace(/<meta name="twitter:image" content=".*?"/, `<meta name="twitter:image" content="${escapeAttr(photoUrl)}"`)
    .replace(/<head>/, `<head>\n    <link rel="canonical" href="${escapeAttr(url)}" />`);
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchAllPoliticians(): Promise<PoliticianOg[]> {
  const ids = new Set<number>();
  const map = new Map<number, PoliticianOg>();
  let offset = 0;
  const limit = 500;

  for (;;) {
    const url = `${API_URL}/api/politicians?limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    if (res.status === 429) {
      console.log(`  429 no offset ${offset}, aguardando 15s...`);
      await new Promise((r) => setTimeout(r, 15_000));
      continue;
    }
    if (!res.ok) {
      throw new Error(`Falha ao buscar políticos (HTTP ${res.status}): ${url}`);
    }
    const data = (await res.json()) as {
      politicians: PoliticianOg[];
      total: number;
      hasMore: boolean;
    };
    for (const p of data.politicians) {
      if (!ids.has(p.id)) {
        ids.add(p.id);
        map.set(p.id, p);
      }
    }
    console.log(`  offset ${offset}: ${ids.size}/${data.total}`);
    if (ids.size >= data.total) break;
    offset += data.politicians.length;
  }
  return [...map.values()];
}

async function main() {
  const distIndex = join(process.cwd(), 'dist', 'index.html');
  const template = readFileSync(distIndex, 'utf-8');

  console.log(`Gerando páginas OG estáticas para /politicos/:id (${BASE_URL})...`);

  // API fora do ar ≠ build fora do ar: sem páginas OG o /politicos/:id cai
  // no rewrite SPA (OG genérico), que continua HONESTO — nunca fabricado.
  // Derrotar o deploy da home por causa de um fetch opcional seria pior.
  let politicians: PoliticianOg[];
  try {
    politicians = await fetchAllPoliticians();
  } catch (err) {
    console.error('  ⚠️ API indisponível — pulando geração de páginas OG (deploy segue com SPA padrão).', err instanceof Error ? err.message : err);
    return;
  }
  console.log(`  ${politicians.length} políticos.`);

  let ok = 0;
  for (const p of politicians) {
    const html = generatePoliticianPage(template, p, BASE_URL, API_URL);
    const dir = join(process.cwd(), 'dist', 'politicos', String(p.id));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html);
    ok++;
  }
  console.log(`OK: ${ok} páginas OG geradas em dist/politicos/*/index.html`);
}

// Guard de entrypoint: só roda como CLI (tsx scripts/generate-og-pages.ts);
// importação no teste (vitest) não dispara fetch contra a API real.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('Erro ao gerar páginas OG:', err);
    process.exit(1);
  });
}
