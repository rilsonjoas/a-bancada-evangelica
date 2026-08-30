/**
 * sync-news.ts
 * Coleta menções na imprensa (#7) da Google News RSS para cada parlamentar
 * ativo, gravando tudo como PENDING para curadoria manual.
 *
 * Regras de negócio (alinhadas ao GUIA-CURADORIA-DADOS):
 *  - NADA é publicado direto: todo item nasce PENDING. Approved é decisão
 *    humana na área de curadoria.
 *  - Dedupe por url UNIQUE (idempotente): rodar de novo não duplica.
 *  - NÃO editorializa: guardamos título cru, link e data — o texto é da fonte.
 *  - Candidate-match por nome completo entre aspas + partido + UF, o que reduz
 *    (não elimina) homônimos; a curadoria humana decide nos PENDING.
 *
 * Uso:
 *   pnpm sync:news                 # todos os ativos
 *   pnpm sync:news -- --limit 20   # primeiros 20 (para testar/produzir aos poucos)
 *   pnpm sync:news -- --state SP   # só um estado (ajuda em campanhas intensas)
 */
import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { searchGoogleNews, isLikelyAbout, withinWindow } from './lib/google-news';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const stateIdx = args.indexOf('--state');
const LIMIT = limitIdx !== -1 ? Number(args[limitIdx + 1]) : undefined;
const STATE = stateIdx !== -1 ? args[stateIdx + 1] : undefined;

const BATCH = 50;     // log a cada N processados
const DELAY_MS = 300; // sleep entre requests — Google News sem key não tolera rajada
const MAX_PER_POLITICIAN = 10; // teto por parlamentar — curadoria humana fica viável
// Janela temporal: notícias de eleição antiga e balanços históricos enchem a
// fila com lixo não acionável. Fica só o que ainda serve para contexto atual.
const MAX_AGE_MONTHS = 24;

async function main() {
  const where = {
    is_active: true,
    ...(STATE ? { current_state: STATE } : {}),
  };

  const politicians = await prisma.politician.findMany({
    where,
    orderBy: [{ current_house: 'asc' }, { name: 'asc' }],
    take: LIMIT,
  });

  console.log(`🔎 Buscando menções para ${politicians.length} parlamentares...`);

  let found = 0;
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < politicians.length; i++) {
    const p = politicians[i];
    try {
      const query = {
        name: p.name,
        party: p.current_party,
        state: p.current_state,
      };
      const items = (await searchGoogleNews(query))
        // Filtro anti-ruído: nome completo precisa estar no título
        .filter((item) => isLikelyAbout(query, item.title))
        // Janela temporal: descarta balanços antigos e lixo histórico
        .filter((item) => withinWindow(item.pubDate, MAX_AGE_MONTHS))
        // Google News ordena por relevância; priorizar os mais recentes
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        .slice(0, MAX_PER_POLITICIAN);
      found += items.length;

      for (const item of items) {
        const existing = await prisma.newsMention.findUnique({ where: { url: item.link } });
        if (existing) {
          skipped++;
          continue;
        }
        const publishedAt = item.pubDate ? new Date(item.pubDate) : null;
        await prisma.newsMention.create({
          data: {
            politician_id: p.id,
            title: item.title,
            url: item.link,
            source_name: item.source ?? 'Google News',
            published_at: publishedAt ?? new Date(),
          },
        });
        inserted++;
      }
      if (items.length === 0) {
        console.log(`   – ${p.name}: nenhuma menção relevante`);
      }

      if ((i + 1) % BATCH === 0) {
        console.log(`   … ${i + 1}/${politicians.length} processados (${inserted} novas)`);
      }
      await new Promise((r) => setTimeout(r, DELAY_MS));
    } catch (err) {
      failed++;
      console.warn(`   ⚠️ ${p.name}: ${(err as Error).message}`);
    }
  }

  await prisma.syncLog.create({
    data: {
      sync_type: 'NEWS',
      source: 'MANUAL',
      status: failed > 0 ? 'PARTIAL' : 'SUCCESS',
      start_time: new Date(),
      end_time: new Date(),
      records_processed: politicians.length,
      records_inserted: inserted,
      records_updated: skipped,
      records_failed: failed,
      details: { itemsFound: found, inserted, skipped, failed, limit: LIMIT ?? null, state: STATE ?? null },
    },
  });

  console.log('');
  console.log(`✅ Itens encontrados: ${found}`);
  console.log(`   Inseridos (PENDING): ${inserted}`);
  console.log(`   Já conhecidos (skip): ${skipped}`);
  console.log(`   Falhas: ${failed}`);
  if (inserted > 0) console.log('   → revise em /admin/noticias para aprovar ou rejeitar.');
}

// Guard de entry point — mesmo padrão dos outros scripts de sync:
// importar de outro lugar não dispara a coleta.
// pathToFileURL: guard antigo (`file://${argv[1]}`) falhava silenciosamente
// em caminhos com espaço/acento (import.meta.url vem percent-encoded).
const isEntryPoint = Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntryPoint) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}