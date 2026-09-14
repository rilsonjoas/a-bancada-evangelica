import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const API_URL = process.env.VITE_API_URL ?? 'https://api-bancada.narniano.com';
const BASE_URL = process.env.SITE_URL ?? 'https://a-bancada-evangelica.vercel.app';

const THEME_SLUGS = [
  'meio-ambiente-energia',
  'assistencia-social',
  'economia-agro',
  'transito',
];

interface PoliticianApi {
  id: string;
}

interface PoliticiansResponse {
  politicians: PoliticianApi[];
  total: number;
  hasMore: boolean;
}

async function fetchAllPoliticians(): Promise<string[]> {
  const ids = new Set<string>();
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
    const data = (await res.json()) as PoliticiansResponse;
    const before = ids.size;
    for (const p of data.politicians) ids.add(p.id);
    const added = ids.size - before;
    console.log(`  offset ${offset}: +${added} (${ids.size}/${data.total})`);
    if (added === 0 || ids.size >= data.total) break;
    offset += data.politicians.length;
  }
  return [...ids];
}

function xml(url: string, changefreq: string, priority: string, lastmod: string): string {
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function main() {
  const lastmod = new Date().toISOString().slice(0, 10);
  console.log(`Gerando sitemap de ${BASE_URL} usando API ${API_URL}...`);

  const politicianIds = await fetchAllPoliticians();
  console.log(`Políticos: ${politicianIds.length}`);

  const entries: string[] = [];

  for (const { path, freq, priority } of [
    { path: '/', freq: 'daily', priority: '1.0' },
    { path: '/ranking', freq: 'daily', priority: '0.9' },
    { path: '/votacoes', freq: 'daily', priority: '0.9' },
    { path: '/temas', freq: 'weekly', priority: '0.8' },
    { path: '/comparacao', freq: 'weekly', priority: '0.7' },
    { path: '/grupos', freq: 'weekly', priority: '0.7' },
    { path: '/match', freq: 'weekly', priority: '0.7' },
    { path: '/metodologia', freq: 'monthly', priority: '0.6' },
    { path: '/dados', freq: 'weekly', priority: '0.6' },
    { path: '/sobre', freq: 'monthly', priority: '0.5' },
    { path: '/errata', freq: 'weekly', priority: '0.4' },
    { path: '/contato', freq: 'yearly', priority: '0.3' },
    { path: '/privacidade', freq: 'yearly', priority: '0.2' },
    { path: '/termos', freq: 'yearly', priority: '0.2' },
  ]) {
    entries.push(xml(`${BASE_URL}${path}`, freq, priority, lastmod));
  }

  for (const slug of THEME_SLUGS) {
    entries.push(xml(`${BASE_URL}/temas/${slug}`, 'weekly', '0.7', lastmod));
  }

  for (const id of politicianIds) {
    entries.push(xml(`${BASE_URL}/politicos/${id}`, 'weekly', '0.6', lastmod));
  }

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Sitemap gerado automaticamente em ${lastmod} por scripts/generate-sitemap.ts.
     ${politicianIds.length} políticos + rotas estáticas + temas. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  const outDir = join(process.cwd(), 'public');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'sitemap.xml'), xmlContent);
  console.log(`OK: sitemap.xml escrito com ${entries.length} URLs.`);
}

main().catch((err) => {
  console.error('Erro ao gerar sitemap:', err);
  process.exit(1);
});