/**
 * recalculate-scores.ts
 * Recalcula scores usando abordagem híbrida:
 *   - Para critérios COM votos reais: seed do partido + delta dos votos
 *   - Para critérios SEM votos reais: mantém o seed do partido
 *   - Penalidade de despesas suspeitas em moral_integrity
 *
 * Isso preserva a diferenciação PL/PT em critérios sem votações
 * PLEN acessíveis (vida, família, religião) enquanto usa dados reais
 * para ajustar critérios com votações disponíveis (social, família).
 *
 * CORREÇÃO CRÍTICA (2026-09-08, achado real): até esta versão, a "base"
 * de cada critério vinha de `existing?.campo` — o valor JÁ GRAVADO pela
 * execução anterior, que já incluía o delta de voto somado. Como este
 * script roda todo dia via cron (sync-worker.ts, 05:00) e `sumDelta()`
 * soma TODOS os votos desde sempre (não só os novos), isso somava o
 * histórico completo de novo, todo santo dia, em cima de um valor que já
 * o continha. Resultado real medido em produção: 98% dos deputados com
 * voto travados em 0 ou 100 em Família, 100% em Responsabilidade Social,
 * 69% em Integridade Moral — extremos sem significado, não nota real.
 * Vida e Liberdade Religiosa escaparam só por terem poucos/nenhum voto
 * casado (mesmo problema de vocabulário estreito já documentado em
 * docs/GUIA-CURADORIA-DADOS.md pra liberdade religiosa).
 *
 * Correção: a base agora é sempre `partyBase() + individualNoise()` —
 * um valor FIXO, recalculado do zero a cada execução, nunca lido de
 * volta do banco. O delta de voto (soma de TODOS os votos reais, que já
 * é o total certo por natureza) se aplica uma vez só sobre essa base
 * fixa, então rodar este script qualquer número de vezes dá o mesmo
 * resultado (idempotente) — a garantia que faltava.
 */
import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  CRITERIA_KEYS,
  WEIGHTS,
  clampSeed,
  clampScore,
  individualNoise,
  overallScore,
  partyBase,
  performanceLabel,
  type CriteriaKey,
} from './lib/scoring.js';

const prisma = new PrismaClient();

const CRITERIA_INDEX: Record<CriteriaKey, number> = {
  LIFE_PROTECTION: 0,
  FAMILY_VALUES: 1,
  MORAL_INTEGRITY: 2,
  SOCIAL_RESPONSIBILITY: 3,
  RELIGIOUS_FREEDOM: 4,
};

async function recalculate() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(dryRun
    ? '🔢 [dry-run] Recálculo híbrido de scores (partido + votos reais) — NADA será gravado...\n'
    : '🔢 Recálculo híbrido de scores (partido + votos reais)...\n');

  const politicians = await prisma.politician.findMany({
    where: { is_active: true },
    include: {
      scores: { take: 1, orderBy: { created_at: 'desc' } },
      votes: {
        include: { key_agenda: { select: { criteria: true } } },
      },
      expenses: {
        select: { suspicion_score: true, is_suspicious: true },
      },
    },
  });

  console.log(`👤 ${politicians.length} políticos para processar`);

  let updated = 0;
  let hybridUpdated = 0;

  // H6 (2026-08-27): diff de auditoria das transformações. Cada recálculo
  // registra no SyncLog O QUE mudou nas notas: critérios e nº de políticos
  // impactados. Sem isso, uma mudança de nota é invisível (parece correção
  // arbitrária); com histórico, é processo auditável.
  let changedCount = 0;
  let unchangedCount = 0;
  const criteriaDeltas: Record<string, { changed: number; totalDelta: number }> = {
    LIFE_PROTECTION: { changed: 0, totalDelta: 0 },
    FAMILY_VALUES: { changed: 0, totalDelta: 0 },
    MORAL_INTEGRITY: { changed: 0, totalDelta: 0 },
    SOCIAL_RESPONSIBILITY: { changed: 0, totalDelta: 0 },
    RELIGIOUS_FREEDOM: { changed: 0, totalDelta: 0 },
  };
  const biggestMovers: Array<{ name: string; from: number; to: number; delta: number }> = [];

  for (const politician of politicians) {
    const existing = politician.scores[0];
    const base = partyBase(politician.current_party);

    // Agrupar votos reais por critério — sumDelta já é o TOTAL real (todos
    // os votos desde sempre), por isso a base tem que ser fixa (ver
    // comentário no topo do arquivo), nunca o valor já ajustado.
    const deltas: Record<CriteriaKey, number[]> = {
      LIFE_PROTECTION: [], FAMILY_VALUES: [], MORAL_INTEGRITY: [],
      SOCIAL_RESPONSIBILITY: [], RELIGIOUS_FREEDOM: [],
    };

    for (const vote of politician.votes) {
      const c = vote.key_agenda.criteria as CriteriaKey;
      if (deltas[c]) deltas[c].push(vote.applied_score);
    }

    const hasCriteriaVotes = (c: CriteriaKey) => deltas[c].length > 0;
    const sumDelta = (c: CriteriaKey) => deltas[c].reduce((a, b) => a + b, 0);

    // Seed do partido pra cada critério — fixo, recalculado do zero.
    const seedFor = (c: CriteriaKey) => clampSeed(base[CRITERIA_INDEX[c]] + individualNoise(politician.id, CRITERIA_INDEX[c]));

    // Penalidade de despesas suspeitas em moral_integrity — sempre
    // recalculada fresca a partir do dado real, nunca cumulativa.
    const suspiciousCount = politician.expenses.filter(e => e.is_suspicious).length;
    const avgSuspicion = politician.expenses.length > 0
      ? politician.expenses.reduce((s, e) => s + (e.suspicion_score ?? 0), 0) / politician.expenses.length
      : 0;
    const expensePenalty = Math.min(25, suspiciousCount * 3 + avgSuspicion * 0.1);

    // Híbrido: parte do seed do partido (fixo), ajusta só onde há voto real.
    const life = clampScore(hasCriteriaVotes('LIFE_PROTECTION') ? seedFor('LIFE_PROTECTION') + sumDelta('LIFE_PROTECTION') : seedFor('LIFE_PROTECTION'));
    const family = clampScore(hasCriteriaVotes('FAMILY_VALUES') ? seedFor('FAMILY_VALUES') + sumDelta('FAMILY_VALUES') : seedFor('FAMILY_VALUES'));
    const moral = clampScore(seedFor('MORAL_INTEGRITY') + sumDelta('MORAL_INTEGRITY') - expensePenalty);
    const social = clampScore(hasCriteriaVotes('SOCIAL_RESPONSIBILITY') ? seedFor('SOCIAL_RESPONSIBILITY') + sumDelta('SOCIAL_RESPONSIBILITY') : seedFor('SOCIAL_RESPONSIBILITY'));
    const religious = clampScore(hasCriteriaVotes('RELIGIOUS_FREEDOM') ? seedFor('RELIGIOUS_FREEDOM') + sumDelta('RELIGIOUS_FREEDOM') : seedFor('RELIGIOUS_FREEDOM'));

    const scores: Record<CriteriaKey, number> = {
      LIFE_PROTECTION: life, FAMILY_VALUES: family, MORAL_INTEGRITY: moral,
      SOCIAL_RESPONSIBILITY: social, RELIGIOUS_FREEDOM: religious,
    };
    const overall = overallScore(scores);

    const perf = performanceLabel(overall);

    // Consistência: recalcula se tem votos; ZERADO se não tem.
    // Achado real (2026-08-22): o fallback antigo preservava
    // `existing?.consistency_score` — lixo congelado da fórmula quebrada do
    // sync-worker antigo (100% pra quem nunca votou) voltava a cada recálculo.
    // Sem votos NÃO existe consistência medida: grava 0; a UI exibe "—".
    const totalVotes = politician.votes.length;
    const consistency = totalVotes > 0
      ? politician.votes.filter(v => v.applied_score !== 0).length / totalVotes
      : 0;

    if (politician.votes.length > 0) hybridUpdated++;

    // H6: capturar diff antes/depois (overall_score) para o histórico.
    const prevOverall = existing?.overall_score ?? null;
    if (prevOverall !== null) {
      const absDelta = Math.abs(overall - prevOverall);
      if (absDelta > 1e-9) {
        changedCount++;
        biggestMovers.push({ name: politician.name, from: prevOverall, to: overall, delta: overall - prevOverall });
      } else {
        unchangedCount++;
      }
    }
    // Deltas por critério (só onde a nota mudou de fato)
    const prevCrits: Array<[CriteriaKey, number | null]> = [
      ['LIFE_PROTECTION', existing?.life_protection ?? null],
      ['FAMILY_VALUES', existing?.family_values ?? null],
      ['MORAL_INTEGRITY', existing?.moral_integrity ?? null],
      ['SOCIAL_RESPONSIBILITY', existing?.social_responsibility ?? null],
      ['RELIGIOUS_FREEDOM', existing?.religious_freedom ?? null],
    ];
    for (const [key, prev] of prevCrits) {
      const next = scores[key];
      if (prev !== null && Math.abs(next - prev) > 1e-9) {
        criteriaDeltas[key].changed++;
        criteriaDeltas[key].totalDelta += next - prev;
      }
    }

    if (dryRun) {
      if (prevOverall !== null && Math.abs(overall - prevOverall) > 1e-9) {
        console.log(`   [dry-run] ${politician.name}: ${prevOverall} → ${overall} (${politician.votes.length} votos)`);
      }
    } else {
      await prisma.politicianScore.upsert({
        where: { politician_id: politician.id },
        create: {
          politician_id: politician.id,
          life_protection: life, family_values: family,
          moral_integrity: moral, social_responsibility: social, religious_freedom: religious,
          overall_score: overall, performance_level: perf.level,
          performance_label: perf.label, performance_description: perf.description,
          consistency_score: consistency,
          total_votes: politician.votes.length,
        },
        update: {
          life_protection: life, family_values: family,
          moral_integrity: moral, social_responsibility: social, religious_freedom: religious,
          overall_score: overall, performance_level: perf.level,
          performance_label: perf.label, performance_description: perf.description,
          consistency_score: consistency,
          // Achado real (2026-08-22): a coluna nunca era atualizada por este
          // motor — ficava congelada da criação (509 ativos com votos reais
          // exibindo "0 votações"; a UI e qualquer verificação lixo liam 0).
          total_votes: politician.votes.length,
          last_calculation: new Date(),
        },
      });
    }

    updated++;
  }

  console.log(dryRun ? `\n✅ [dry-run] Recálculo simulado (nada gravado):` : `\n✅ Recálculo concluído:`);
  console.log(`   🔄 ${updated} políticos atualizados`);
  console.log(`   🗳️  ${hybridUpdated} ajustados com votos reais (híbrido)`);
  console.log(`   📊 ${updated - hybridUpdated} mantiveram score de partido`);

  // H6 (2026-08-27): registrar diff no SyncLog para auditoria pública.
  const avgDelta = (k: string) =>
    criteriaDeltas[k].changed > 0 ? criteriaDeltas[k].totalDelta / criteriaDeltas[k].changed : 0;

  const details = {
    totalRevised: updated,
    changedCount,
    unchangedCount,
    hybridUpdated,
    criteriaDelta: Object.fromEntries(
      Object.entries(criteriaDeltas).map(([k, v]) => [k, { changed: v.changed, avgDelta: Number(avgDelta(k).toFixed(2)) }])
    ),
    biggestMovers: biggestMovers
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 10)
      .map(m => ({ ...m, delta: Number(m.delta.toFixed(2)) })),
    timestamp: new Date().toISOString(),
  };

  if (!dryRun) {
    await prisma.syncLog.create({
      data: {
        sync_type: 'SCORES',
        source: 'MANUAL',
        status: 'SUCCESS',
        start_time: new Date(),
        end_time: new Date(),
        records_processed: updated,
        records_inserted: changedCount,
        records_updated: updated,
        records_failed: 0,
        details,
      },
    });
    console.log(`   📝 Diff registrado no SyncLog (${changedCount} notas alteradas de ${updated})`);
  } else {
    console.log(`   📝 [dry-run] ${changedCount} notas TERIAM mudado de ${updated} — nada gravado.`);
  }
}

// Roda só se este arquivo for o entry point de verdade — mesma correção
// aplicada em sync-camara.ts/sync-senado.ts (achado real 2026-08-20):
// sem isso, importar este módulo de outro lugar recalcularia (e
// sobrescreveria) todos os scores como efeito colateral.
// pathToFileURL: o guard antigo (`file://${argv[1]}`) falhava SILENCIOSAMENTE
// em caminhos com espaço/acento (import.meta.url vem percent-encoded) — script
// não rodava e saía 0. Achado real 2026-08-23 rodando da máquina local.
const isEntryPoint = Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntryPoint) {
  recalculate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
