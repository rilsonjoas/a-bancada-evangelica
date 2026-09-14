/**
 * seed-party-scores.ts
 * Calcula scores de alinhamento evangélico com base no histórico
 * público de votações de cada partido + variação individual.
 *
 * Fontes: DIAP, Frente Parlamentar Evangélica, análises do JRN/Estadão
 * e histórico de votações na 56ª e 57ª legislaturas — tabela real em
 * scripts/lib/scoring.ts (PARTY_ALIGNMENT), fonte única compartilhada
 * com recalculate-scores.ts desde 2026-09-08.
 *
 * Scores são estimativas de alinhamento por partido até que os votos
 * individuais sejam sincronizados via pnpm sync:votes.
 *
 * ATENÇÃO: faz upsert INCONDICIONAL em todo político ativo — rodar isto
 * de novo sobrescreve o score real (baseado em voto) de quem já tem
 * histórico. Roda 1x no começo do projeto; depois disso, quem precisar
 * de correção pontual (político adicionado depois do seed original, ex.:
 * 2026-09-08) usa scripts/fix-never-seeded-scores.ts, que só toca em
 * quem nunca foi semeado.
 */
import { PrismaClient } from '@prisma/client';
import {
  clampSeed,
  individualNoise,
  isKnownParty,
  overallScore,
  partyBase,
  performanceLabel,
  type CriteriaKey,
} from './lib/scoring.js';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Calculando scores por alinhamento de partido...\n');

  const politicians = await prisma.politician.findMany({
    where: { is_active: true },
    select: { id: true, current_party: true, full_name: true },
  });

  console.log(`👤 ${politicians.length} políticos para processar`);

  let updated = 0;
  let unknown = 0;

  for (const p of politicians) {
    const base = partyBase(p.current_party);

    const vida = clampSeed(base[0] + individualNoise(p.id, 0));
    const familia = clampSeed(base[1] + individualNoise(p.id, 1));
    const moral = clampSeed(base[2] + individualNoise(p.id, 2));
    const social = clampSeed(base[3] + individualNoise(p.id, 3));
    const religiao = clampSeed(base[4] + individualNoise(p.id, 4));
    const total = overallScore({
      LIFE_PROTECTION: vida, FAMILY_VALUES: familia, MORAL_INTEGRITY: moral,
      SOCIAL_RESPONSIBILITY: social, RELIGIOUS_FREEDOM: religiao,
    } satisfies Record<CriteriaKey, number>);
    const perf = performanceLabel(total);

    // Consistência em escala 0-1 (o frontend multiplica por 100 para exibir %)
    // Partidos conhecidos: 65-80% de consistência com variação individual
    // Partidos desconhecidos: 50% (neutro, sem dados suficientes)
    const partyKnown = isKnownParty(p.current_party);
    const consistency = partyKnown
      ? clampSeed(70 + individualNoise(p.id, 5)) / 100
      : 0.50;

    if (!partyKnown) unknown++;

    await prisma.politicianScore.upsert({
      where: { politician_id: p.id },
      create: {
        politician_id: p.id,
        life_protection: vida,
        family_values: familia,
        moral_integrity: moral,
        social_responsibility: social,
        religious_freedom: religiao,
        overall_score: total,
        performance_level: perf.level,
        performance_label: perf.label,
        performance_description: perf.description,
        consistency_score: consistency,
      },
      update: {
        life_protection: vida,
        family_values: familia,
        moral_integrity: moral,
        social_responsibility: social,
        religious_freedom: religiao,
        overall_score: total,
        performance_level: perf.level,
        performance_label: perf.label,
        performance_description: perf.description,
        consistency_score: consistency,
      },
    });

    updated++;
  }

  console.log(`\n✅ Scores calculados:`);
  console.log(`   ✅ ${updated} políticos atualizados`);
  console.log(`   ⚠️  ${unknown} com partido desconhecido (score neutro aplicado)`);
  console.log('\n📊 Distribuição esperada:');
  console.log('   PL/PP/Republicanos → 70-90 pts (Aderência muito alta/alta)');
  console.log('   MDB/PSD → 55-68 pts (Aderência moderada)');
  console.log('   PT/PSOL/PCdoB → 20-35 pts (Aderência baixa)');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
