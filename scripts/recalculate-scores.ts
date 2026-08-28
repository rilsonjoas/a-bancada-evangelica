/**
 * recalculate-scores.ts
 * Recalcula scores usando abordagem híbrida:
 *   - Para critérios COM votos reais: party_seed + delta dos votos
 *   - Para critérios SEM votos reais: mantém score de partido (seed)
 *   - Penalidade de despesas suspeitas em moral_integrity
 *
 * Isso preserva a diferenciação PL/PT em critérios sem votações
 * PLEN acessíveis (vida, família, religião) enquanto usa dados reais
 * para ajustar critérios com votações disponíveis (social, família).
 */
import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const prisma = new PrismaClient();

const WEIGHTS = {
  LIFE_PROTECTION: 0.30,
  FAMILY_VALUES: 0.25,
  MORAL_INTEGRITY: 0.20,
  SOCIAL_RESPONSIBILITY: 0.15,
  RELIGIOUS_FREEDOM: 0.10,
};

function clamp(val: number) {
  return Math.max(0, Math.min(100, Math.round(val)));
}

function performanceLabel(score: number): {
  level: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  label: string;
  description: string;
} {
  if (score >= 80) return {
    level: 'EXCELLENT',
    label: 'Guardião da Fé',
    description: 'Votações consistentemente alinhadas com os valores cristãos'
  };
  if (score >= 65) return {
    level: 'GOOD',
    label: 'Testemunho Fiel',
    description: 'Bom alinhamento com os critérios evangélicos'
  };
  if (score >= 45) return {
    level: 'AVERAGE',
    label: 'Caminhando',
    description: 'Alinhamento parcial — há votações mistas'
  };
  return {
    level: 'POOR',
    label: 'Precisa Crescer',
    description: 'Votações frequentemente divergem dos valores cristãos'
  };
}

async function recalculate() {
  console.log('🔢 Recálculo híbrido de scores (partido + votos reais)...\n');

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

    // Agrupar votos reais por critério
    const deltas: Record<string, number[]> = {
      LIFE_PROTECTION: [], FAMILY_VALUES: [], MORAL_INTEGRITY: [],
      SOCIAL_RESPONSIBILITY: [], RELIGIOUS_FREEDOM: [],
    };

    for (const vote of politician.votes) {
      const c = vote.key_agenda.criteria;
      if (deltas[c]) deltas[c].push(vote.applied_score);
    }

    const hasCriteriaVotes = (c: string) => deltas[c].length > 0;
    const sumDelta = (c: string) => deltas[c].reduce((a, b) => a + b, 0);

    // Para critérios sem votos: usar score existente (de partido)
    // Para critérios com votos: ajustar o score existente com os deltas reais
    // Se não há score existente: usar base neutra
    const baseLife   = existing?.life_protection ?? 50;
    const baseFamily = existing?.family_values ?? 50;
    const baseMoral  = existing?.moral_integrity ?? 80;
    const baseSocial = existing?.social_responsibility ?? 50;
    const baseRel    = existing?.religious_freedom ?? 50;

    // Penalidade de despesas suspeitas em moral_integrity
    const suspiciousCount = politician.expenses.filter(e => e.is_suspicious).length;
    const avgSuspicion = politician.expenses.length > 0
      ? politician.expenses.reduce((s, e) => s + (e.suspicion_score ?? 0), 0) / politician.expenses.length
      : 0;
    const expensePenalty = Math.min(25, suspiciousCount * 3 + avgSuspicion * 0.1);

    // Híbrido: mantém base de partido, ajusta somente onde há votos reais
    const life   = clamp(hasCriteriaVotes('LIFE_PROTECTION') ? baseLife + sumDelta('LIFE_PROTECTION') : baseLife);
    const family = clamp(hasCriteriaVotes('FAMILY_VALUES') ? baseFamily + sumDelta('FAMILY_VALUES') : baseFamily);
    const moral  = clamp(baseMoral + sumDelta('MORAL_INTEGRITY') - expensePenalty);
    const social = clamp(hasCriteriaVotes('SOCIAL_RESPONSIBILITY') ? baseSocial + sumDelta('SOCIAL_RESPONSIBILITY') : baseSocial);
    const religious = clamp(hasCriteriaVotes('RELIGIOUS_FREEDOM') ? baseRel + sumDelta('RELIGIOUS_FREEDOM') : baseRel);

    const overall = clamp(
      life * WEIGHTS.LIFE_PROTECTION +
      family * WEIGHTS.FAMILY_VALUES +
      moral * WEIGHTS.MORAL_INTEGRITY +
      social * WEIGHTS.SOCIAL_RESPONSIBILITY +
      religious * WEIGHTS.RELIGIOUS_FREEDOM
    );

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
    const prevCrits: Array<[string, number | null]> = [
      ['LIFE_PROTECTION', existing?.life_protection ?? null],
      ['FAMILY_VALUES', existing?.family_values ?? null],
      ['MORAL_INTEGRITY', existing?.moral_integrity ?? null],
      ['SOCIAL_RESPONSIBILITY', existing?.social_responsibility ?? null],
      ['RELIGIOUS_FREEDOM', existing?.religious_freedom ?? null],
    ];
    for (const [key, prev] of prevCrits) {
      const next = { life: life, family: family, moral: moral, social: social, religious: religious }[
        key === 'LIFE_PROTECTION' ? 'life' : key === 'FAMILY_VALUES' ? 'family' : key === 'MORAL_INTEGRITY' ? 'moral' : key === 'SOCIAL_RESPONSIBILITY' ? 'social' : 'religious'
      ];
      if (prev !== null && Math.abs(next - prev) > 1e-9) {
        criteriaDeltas[key].changed++;
        criteriaDeltas[key].totalDelta += next - prev;
      }
    }

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
      },
    });

    updated++;
  }

  console.log(`\n✅ Recálculo concluído:`);
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
