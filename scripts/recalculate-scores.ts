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

    // Consistência: mantém a do partido se sem votos; recalcula se tem votos
    const totalVotes = politician.votes.length;
    const consistency = totalVotes > 0
      ? politician.votes.filter(v => v.applied_score !== 0).length / totalVotes
      : (existing?.consistency_score ?? 0.50);

    if (politician.votes.length > 0) hybridUpdated++;

    await prisma.politicianScore.upsert({
      where: { politician_id: politician.id },
      create: {
        politician_id: politician.id,
        life_protection: life, family_values: family,
        moral_integrity: moral, social_responsibility: social, religious_freedom: religious,
        overall_score: overall, performance_level: perf.level,
        performance_label: perf.label, performance_description: perf.description,
        consistency_score: consistency,
      },
      update: {
        life_protection: life, family_values: family,
        moral_integrity: moral, social_responsibility: social, religious_freedom: religious,
        overall_score: overall, performance_level: perf.level,
        performance_label: perf.label, performance_description: perf.description,
        consistency_score: consistency,
      },
    });

    updated++;
  }

  console.log(`\n✅ Recálculo concluído:`);
  console.log(`   🔄 ${updated} políticos atualizados`);
  console.log(`   🗳️  ${hybridUpdated} ajustados com votos reais (híbrido)`);
  console.log(`   📊 ${updated - hybridUpdated} mantiveram score de partido`);
}

recalculate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
