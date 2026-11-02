/**
 * auditar-links.ts
 *
 * Auditoria OFFLINE dos links de redes sociais dos parlamentares
 * (B4 de docs/PLANO-CONFIANCA-E-DADOS-2027.md). Não roda em produção nem no CI:
 * é rodada à mão, de vez em quando, e o resultado vai para o git.
 *
 * O que faz: lê `politicians.social_media_urls`, extrai os links de YouTube
 * (o único site que responde a consulta automatizada com um 404 confiável),
 * consulta cada um e grava `src/api/politicians/links-quebrados.ts`. A ficha
 * esconde o que está nessa lista.
 *
 * Regra: só se esconde com prova (404/410 em duas consultas, com navegador e
 * idioma diferentes). Timeout, 403, 429 e 5xx são "inconclusivo": o link
 * continua aparecendo. Instagram, Facebook e X não são consultados.
 *
 * Uso:
 *   pnpm auditar:links                          # lê do banco (DATABASE_URL), só relata
 *   pnpm auditar:links --entrada politicos.json # lê de arquivo [{id,house,raw}], só relata
 *   pnpm auditar:links --gravar                 # relata e grava a lista
 */
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import { auditavel, novaLista, renderizarArquivo, veredito, type Resposta, type Veredito } from './lib/auditar-links';

const execFileAsync = promisify(execFile);

// `src/api` tem package.json próprio em CommonJS; o `import` nomeado de ESM não
// enxerga os exports desses arquivos, então carregamos com `require`.
const req = createRequire(import.meta.url);
const { collectSocialCandidates } = req('../src/api/politicians/social-links.ts') as typeof import('../src/api/politicians/social-links');
const { LINKS_QUEBRADOS } = req('../src/api/politicians/links-quebrados.ts') as typeof import('../src/api/politicians/links-quebrados');

const ARQUIVO_LISTA = path.join(process.cwd(), 'src', 'api', 'politicians', 'links-quebrados.ts');
const CONCORRENCIA = 2;
const TIMEOUT_MS = 15_000;
const PAUSA_ENTRE_PASSADAS_MS = 30_000;

const NAVEGADORES = [
  { ua: 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0', lang: 'pt-BR,pt;q=0.9' },
  { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15', lang: 'en-US,en;q=0.9' },
];

interface Linha {
  id: number;
  house: 'CAMARA' | 'SENADO';
  raw: unknown;
  tse?: unknown;
}

/** Falha de rede (sem status) é tentada de novo uma vez: o YouTube derruba conexões sob carga. */
async function consultar(url: string, navegador: number): Promise<Resposta> {
  const r = await consultarUma(url, navegador);
  if (r.status !== null) return r;
  await new Promise((ok) => setTimeout(ok, 2000));
  return consultarUma(url, navegador);
}

/**
 * Usa `curl` e não o `fetch` do Node: o YouTube responde 200 com cabeçalhos tão
 * grandes que o `fetch` desiste com "Headers Overflow" (medido em 2026-11-01),
 * e todo link bom parecia sem resposta. Argumentos vão em array, sem shell.
 */
async function consultarUma(url: string, navegador: number): Promise<Resposta> {
  const n = NAVEGADORES[navegador];
  try {
    const { stdout } = await execFileAsync(
      'curl',
      ['-s', '-o', '/dev/null', '-L', '--max-redirs', '5', '--max-time', String(TIMEOUT_MS / 1000),
        '-A', n.ua, '-H', `Accept-Language: ${n.lang}`, '-w', '%{http_code}', url],
      { timeout: TIMEOUT_MS + 5000 },
    );
    const status = Number(stdout.trim());
    return { status: status >= 100 ? status : null };
  } catch {
    return { status: null };
  }
}

async function emLotes<T, R>(itens: T[], fn: (x: T) => Promise<R>): Promise<R[]> {
  const saida: R[] = new Array(itens.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: CONCORRENCIA }, async () => {
      while (i < itens.length) {
        const k = i++;
        saida[k] = await fn(itens[k]);
      }
    }),
  );
  return saida;
}

async function lerLinhas(entrada: string | undefined): Promise<Linha[]> {
  if (entrada) return JSON.parse(fs.readFileSync(entrada, 'utf8')) as Linha[];
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.politician.findMany({
      select: { id: true, current_house: true, social_media_urls: true, tse_social_urls: true },
    });
    return rows.map((r) => ({ id: r.id, house: r.current_house as 'CAMARA' | 'SENADO', raw: r.social_media_urls, tse: r.tse_social_urls }));
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const gravar = args.includes('--gravar');
  const iEntrada = args.indexOf('--entrada');
  const entrada = iEntrada >= 0 ? args[iEntrada + 1] : undefined;
  const hoje = new Date().toISOString().slice(0, 10);

  const linhas = await lerLinhas(entrada);
  const urls = [...new Set(linhas.flatMap((l) => collectSocialCandidates(l.house, l.raw, l.tse).map((c) => c.url)))].filter(auditavel);
  console.log(`${linhas.length} fichas, ${urls.length} links de YouTube distintos para consultar.`);
  if (linhas.length < 500) {
    console.error('Menos de 500 fichas lidas: base incompleta. Abortando para não apagar a lista por engano.');
    process.exit(1);
  }

  const primeira = await emLotes(urls, (u) => consultar(u, 0));
  const naoOk = urls.map((u, i) => ({ u, i })).filter(({ i }) => !(primeira[i].status !== null && primeira[i].status! < 300));
  const segunda = new Map<string, Resposta>();
  if (naoOk.length) {
    console.log(`${naoOk.length} não responderam 2xx; segunda consulta (outro navegador e idioma) em ${PAUSA_ENTRE_PASSADAS_MS / 1000}s...`);
    await new Promise((r) => setTimeout(r, PAUSA_ENTRE_PASSADAS_MS));
    const rs = await emLotes(naoOk, ({ u }) => consultar(u, 1));
    naoOk.forEach(({ u }, k) => segunda.set(u, rs[k]));
  }

  const resultados = new Map<string, { veredito: Veredito; status: number | null }>();
  urls.forEach((u, i) => {
    resultados.set(u, { veredito: veredito(primeira[i], segunda.get(u) ?? null), status: primeira[i].status });
  });

  const cont = { ok: 0, quebrado: 0, inconclusivo: 0 };
  for (const r of resultados.values()) cont[r.veredito]++;
  console.log(`ok: ${cont.ok} | quebrado (provado): ${cont.quebrado} | inconclusivo: ${cont.inconclusivo}`);
  for (const [u, r] of resultados) if (r.veredito === 'inconclusivo') console.log(`  inconclusivo (${r.status ?? 'sem resposta'}): ${u}`);

  const anterior = LINKS_QUEBRADOS.map((l) => ({ ...l }));
  const nova = novaLista(anterior, resultados, hoje);
  const antes = new Set(anterior.map((l) => l.url));
  const depois = new Set(nova.map((l) => l.url));
  const entraram = nova.filter((l) => !antes.has(l.url));
  const sairam = anterior.filter((l) => !depois.has(l.url));
  console.log(`Lista de ocultos: ${anterior.length} -> ${nova.length} (entram ${entraram.length}, saem ${sairam.length}).`);
  for (const l of entraram) console.log(`  + ${l.status} ${l.url}`);
  for (const l of sairam) console.log(`  - ${l.url}`);

  if (gravar) {
    fs.writeFileSync(ARQUIVO_LISTA, renderizarArquivo(nova));
    console.log(`Gravado: ${path.relative(process.cwd(), ARQUIVO_LISTA)}`);
  } else {
    console.log('Nada gravado (use --gravar).');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
