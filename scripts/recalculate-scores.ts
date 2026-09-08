/**
 * recalculate-scores.ts
 * Recalcula scores usando abordagem híbrida:
 *   - Para critérios COM votos reais: seed do partido + MÉDIA dos votos
 *   - Para critérios SEM votos reais: mantém o seed do partido
 *   - Penalidade de despesas suspeitas em moral_integrity
 *
 * Isso preserva a diferenciação PL/PT em critérios sem votações
 * PLEN acessíveis (vida, família, religião) enquanto usa dados reais
 * para ajustar critérios com votações disponíveis (social, família).
 *
 * DOIS ACHADOS REAIS CORRIGIDOS EM 2026-09-08, distintos entre si:
 *
 * 1) Base móvel em vez de fixa. Até esta versão, a "base" de cada
 *    critério vinha de `existing?.campo` — o valor JÁ GRAVADO pela
 *    execução anterior, que já incluía o delta de voto somado. Como
 *    este script roda todo dia via cron (sync-worker.ts, 05:00) e o
 *    delta somava TODOS os votos desde sempre (não só os novos), isso
 *    somava o histórico completo de novo, todo santo dia, em cima de
 *    um valor que já o continha — drift sem fim, sempre piorando.
 *    Corrigido: a base agora é sempre `partyBase() + individualNoise()`
 *    — um valor FIXO, recalculado do zero a cada execução, nunca lido
 *    de volta do banco. Isso torna o script idempotente (rodar N vezes
 *    dá o mesmo resultado), mas por si só NÃO bastou — ver achado 2.
 *
 * 2) Soma sem limite em vez de média. applied_score de cada voto tem
 *    peso fixo do SCAN_RULES (ex.: ±15 em Família). SOMAR todos os
 *    votos de um critério não tem limite nenhum — um deputado com 16
 *    votos nesse critério acumulava até ±240, muito além da faixa
 *    0–100, saturando na hora mesmo já com a base fixa do achado 1.
 *    Medido em produção (só com o achado 1 corrigido, achado 2 ainda
 *    não): Família ainda 69% saturada, Responsabilidade Social 74%.
 *    Exemplo real: Acácio Favacho (MDB), 16 votos em Família somando
 *    +150 — saturava em 100 garantido, não por ser realmente extremo,
 *    só por ter votado bastante sobre o tema. Corrigido: MÉDIA, não
 *    soma — reflete a TENDÊNCIA real do voto (alinhado/contrário/misto),
 *    não o VOLUME de quantas vezes o tema apareceu em pauta. Decisão
 *    do Rilson (2026-09-08): média, não um cap na soma — muda o
 *    significado da nota de "acúmulo" pra "tendência", deliberadamente.
 *
 * Resultado combinado dos dois: script idempotente E sem saturação
 * garantida por volume de voto.
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

    // Agrupar votos reais por critério.
    const deltas: Record<CriteriaKey, number[]> = {
      LIFE_PROTECTION: [], FAMILY_VALUES: [], MORAL_INTEGRITY: [],
      SOCIAL_RESPONSIBILITY: [], RELIGIOUS_FREEDOM: [],
    };

    for (const vote of politician.votes) {
      const c = vote.key_agenda.criteria as CriteriaKey;
      if (deltas[c]) deltas[c].push(vote.applied_score);
    }

    const hasCriteriaVotes = (c: CriteriaKey) => deltas[c].length > 0;

    // MÉDIA, não soma (achado real 2026-09-08, segundo bug distinto do
    // "base móvel" acima). applied_score de cada voto tem peso fixo do
    // SCAN_RULES (ex.: ±15 em Família) — SOMAR todos os votos desde
    // sempre não tem limite: um deputado com 16 votos nesse critério
    // já acumula até ±240, muito além da faixa 0–100, saturando na
    // hora mesmo com a base fixa corrigida. Medido em produção antes
    // desta correção: Acácio Favacho (MDB), 16 votos em Família somando
    // +150 — saturava em 100 garantido, não por ser realmente extremo,
    // só por ter votado bastante. Média corrige isso: reflete a
    // TENDÊNCIA real do voto (alinhado, contrário, ou misto), não o
    // VOLUME de quantas vezes o tema apareceu em pauta.
    const avgDelta = (c: CriteriaKey) => deltas[c].reduce((a, b) => a + b, 0) / deltas[c].length;

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
    const life = clampScore(hasCriteriaVotes('LIFE_PROTECTION') ? seedFor('LIFE_PROTECTION') + avgDelta('LIFE_PROTECTION') : seedFor('LIFE_PROTECTION'));
    const family = clampScore(hasCriteriaVotes('FAMILY_VALUES') ? seedFor('FAMILY_VALUES') + avgDelta('FAMILY_VALUES') : seedFor('FAMILY_VALUES'));
    const moral = clampScore(seedFor('MORAL_INTEGRITY') + (hasCriteriaVotes('MORAL_INTEGRITY') ? avgDelta('MORAL_INTEGRITY') : 0) - expensePenalty);
    const social = clampScore(hasCriteriaVotes('SOCIAL_RESPONSIBILITY') ? seedFor('SOCIAL_RESPONSIBILITY') + avgDelta('SOCIAL_RESPONSIBILITY') : seedFor('SOCIAL_RESPONSIBILITY'));
    const religious = clampScore(hasCriteriaVotes('RELIGIOUS_FREEDOM') ? seedFor('RELIGIOUS_FREEDOM') + avgDelta('RELIGIOUS_FREEDOM') : seedFor('RELIGIOUS_FREEDOM'));

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
