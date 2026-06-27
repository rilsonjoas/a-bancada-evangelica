/**
 * recalculate-scores.ts
 * Lê todos os votos registrados no banco e recalcula o PoliticianScore
 * de cada político usando os pesos dos 5 critérios evangélicos.
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

// MORAL_INTEGRITY começa em 80 (presunção de inocência)
const BASE_SCORES: Record<string, number> = {
  LIFE_PROTECTION: 50,
  FAMILY_VALUES: 50,
  MORAL_INTEGRITY: 80,
  SOCIAL_RESPONSIBILITY: 50,
  RELIGIOUS_FREEDOM: 50,
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
  console.log('🔢 Iniciando recálculo de scores...\n');

  // Buscar todos os políticos que têm votos registrados
  const politicians = await prisma.politician.findMany({
    where: { is_active: true },
    include: {
      scores: true,
      votes: {
        include: { key_agenda: { select: { criteria: true } } },
      },
    },
  });

  console.log(`👤 ${politicians.length} políticos para processar`);

  let updated = 0;
  let skipped = 0;

  for (const politician of politicians) {
    if (politician.votes.length === 0) {
      skipped++;
      continue;
    }

    // Agrupar applied_scores por critério
    const grouped: Record<string, number[]> = {
      LIFE_PROTECTION: [],
      FAMILY_VALUES: [],
      MORAL_INTEGRITY: [],
      SOCIAL_RESPONSIBILITY: [],
      RELIGIOUS_FREEDOM: [],
    };

    for (const vote of politician.votes) {
      const criteria = vote.key_agenda.criteria;
      if (grouped[criteria] !== undefined) {
        grouped[criteria].push(vote.applied_score);
      }
    }

    // Calcular score por critério
    const life = clamp(
      BASE_SCORES.LIFE_PROTECTION + grouped.LIFE_PROTECTION.reduce((a, b) => a + b, 0)
    );
    const family = clamp(
      BASE_SCORES.FAMILY_VALUES + grouped.FAMILY_VALUES.reduce((a, b) => a + b, 0)
    );
    const moral = clamp(
      BASE_SCORES.MORAL_INTEGRITY + grouped.MORAL_INTEGRITY.reduce((a, b) => a + b, 0)
    );
    const social = clamp(
      BASE_SCORES.SOCIAL_RESPONSIBILITY + grouped.SOCIAL_RESPONSIBILITY.reduce((a, b) => a + b, 0)
    );
    const religious = clamp(
      BASE_SCORES.RELIGIOUS_FREEDOM + grouped.RELIGIOUS_FREEDOM.reduce((a, b) => a + b, 0)
    );

    const overall = clamp(
      life * WEIGHTS.LIFE_PROTECTION +
      family * WEIGHTS.FAMILY_VALUES +
      moral * WEIGHTS.MORAL_INTEGRITY +
      social * WEIGHTS.SOCIAL_RESPONSIBILITY +
      religious * WEIGHTS.RELIGIOUS_FREEDOM
    );

    const perf = performanceLabel(overall);

    // Calcular consistência: % de votos com score != 0 (não ausentes)
    const totalVotes = politician.votes.length;
    const activeVotes = politician.votes.filter(v => v.applied_score !== 0).length;
    // consistency_score armazenado como 0-1; frontend faz * 100 para exibir %
    const consistency = totalVotes > 0 ? activeVotes / totalVotes : 0;

    await prisma.politicianScore.upsert({
      where: { politician_id: politician.id },
      create: {
        politician_id: politician.id,
        life_protection: life,
        family_values: family,
        moral_integrity: moral,
        social_responsibility: social,
        religious_freedom: religious,
        overall_score: overall,
        performance_level: perf.level,
        performance_label: perf.label,
        performance_description: perf.description,
        consistency_score: consistency,
      },
      update: {
        life_protection: life,
        family_values: family,
        moral_integrity: moral,
        social_responsibility: social,
        religious_freedom: religious,
        overall_score: overall,
        performance_level: perf.level,
        performance_label: perf.label,
        performance_description: perf.description,
        consistency_score: consistency,
      },
    });

    updated++;
  }

  console.log(`\n✅ Recálculo concluído:`);
  console.log(`   🔄 ${updated} políticos com scores atualizados`);
  console.log(`   ⏭️  ${skipped} sem votos (mantiveram score padrão)`);
}

recalculate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
