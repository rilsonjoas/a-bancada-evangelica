/**
 * fix-never-seeded-scores.ts
 *
 * Achado real (2026-09-08): seed-party-scores.ts roda só 1 vez, no começo
 * do projeto. Todo político ADICIONADO DEPOIS disso (Senado sincronizado
 * depois do seed original; deputados incluídos numa auditoria posterior,
 * ex.: Silas Câmara — presidente da FPE, achado durante a correção da
 * auditoria de filiação em 2026-09-08) nunca passou pelo seed. O
 * recalculate-scores.ts diário toca nesses registros também, mas como
 * base ele usava o @default bruto do schema.prisma (50/50/80/50/60) — não
 * o histórico real do partido — e como ninguém deles tem voto casado
 * (0 delta), o resultado fica congelado nesse default genérico pra
 * sempre, idêntico pra PT e PL. Confirmado contra a API de produção:
 * 89 políticos ativos (81 Senado + 8 Câmara) na assinatura exata
 * life=50 AND family=50 AND social=50 AND religious=60.
 *
 * Por que NÃO reusar seed-party-scores.ts nem scores:recalculate aqui:
 * - seed-party-scores.ts faz upsert INCONDICIONAL em todo político ativo
 *   — rodar de novo destruiria o score real (baseado em voto) de quem já
 *   tem histórico na Câmara.
 * - scores:recalculate (mesma execução deste script) tinha um bug
 *   separado e mais grave, corrigido no mesmo dia — ver histórico de
 *   commits de recalculate-scores.ts.
 *
 * Este script só toca em quem bate a assinatura exata de nunca-semeado,
 * usando o mesmo cálculo de scripts/lib/scoring.ts (partyBase +
 * individualNoise) usado por seed-party-scores.ts e recalculate-scores.ts.
 *
 * Uso:
 *   pnpm tsx scripts/fix-never-seeded-scores.ts --dry-run   # só lista
 *   pnpm tsx scripts/fix-never-seeded-scores.ts             # aplica
 */
import { PrismaClient } from '@prisma/client';
import {
  clampSeed,
  clampScore,
  individualNoise,
  overallScore,
  partyBase,
  performanceLabel,
  type CriteriaKey,
} from './lib/scoring.js';

const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  // Assinatura exata de "nunca semeado": os 4 critérios sem penalidade
  // possível ainda no @default bruto do schema. moral_integrity fica
  // FORA do filtro de propósito — já pode ter sido descontada por
  // penalidade de despesa mesmo sem nunca ter sido semeada de verdade
  // (ex.: um senador com despesa suspeita e moral=35, mas os outros 4
  // critérios ainda em 50/50/50/60).
  const stuck = await prisma.politicianScore.findMany({
    where: {
      life_protection: 50,
      family_values: 50,
      social_responsibility: 50,
      religious_freedom: 60,
    },
    include: {
      politician: {
        select: { id: true, name: true, current_party: true, current_house: true, is_active: true },
      },
    },
  });

  console.log(`🔎 ${stuck.length} registros na assinatura "nunca semeado" (life=50, family=50, social=50, religious=60).`);

  const byHouse: Record<string, number> = {};
  for (const s of stuck) {
    const h = s.politician.current_house ?? 'DESCONHECIDA';
    byHouse[h] = (byHouse[h] ?? 0) + 1;
  }
  console.log('   Por casa:', byHouse);

  let fixed = 0;
  let skippedInactive = 0;

  for (const s of stuck) {
    const p = s.politician;

    // Segurança extra: nunca tocar em político marcado inativo, mesmo
    // que ainda esteja na assinatura (não deveria aparecer no site).
    if (!p.is_active) {
      skippedInactive++;
      continue;
    }

    const base = partyBase(p.current_party);

    const life = clampSeed(base[0] + individualNoise(p.id, 0));
    const family = clampSeed(base[1] + individualNoise(p.id, 1));
    const social = clampSeed(base[3] + individualNoise(p.id, 3));
    const religious = clampSeed(base[4] + individualNoise(p.id, 4));

    // moral_integrity: mesma penalidade de despesa do recalculate-scores.ts,
    // calculada fresca a partir do dado real de despesas — não há soma
    // cumulativa aqui (sumDelta de voto é sempre 0 pra este grupo, é
    // isso que os torna seguros de corrigir sem o bug de saturação).
    const expenses = await prisma.expense.findMany({
      where: { politician_id: p.id },
      select: { suspicion_score: true, is_suspicious: true },
    });
    const suspiciousCount = expenses.filter((e) => e.is_suspicious).length;
    const avgSuspicion = expenses.length > 0
      ? expenses.reduce((sum, e) => sum + (e.suspicion_score ?? 0), 0) / expenses.length
      : 0;
    const expensePenalty = Math.min(25, suspiciousCount * 3 + avgSuspicion * 0.1);
    const moralSeed = clampSeed(base[2] + individualNoise(p.id, 2));
    const moral = clampScore(moralSeed - expensePenalty);

    const total = overallScore({
      LIFE_PROTECTION: life, FAMILY_VALUES: family, MORAL_INTEGRITY: moral,
      SOCIAL_RESPONSIBILITY: social, RELIGIOUS_FREEDOM: religious,
    } satisfies Record<CriteriaKey, number>);
    const perf = performanceLabel(total);

    if (dryRun) {
      console.log(`   [dry-run] #${p.id} ${p.name} (${p.current_party}, ${p.current_house}) → vida=${life} família=${family} moral=${moral} social=${social} religiao=${religious} geral=${total}`);
    } else {
      await prisma.politicianScore.update({
        where: { politician_id: p.id },
        data: {
          life_protection: life,
          family_values: family,
          moral_integrity: moral,
          social_responsibility: social,
          religious_freedom: religious,
          overall_score: total,
          performance_level: perf.level,
          performance_label: perf.label,
          performance_description: perf.description,
          last_calculation: new Date(),
          // consistency_score / total_votes ficam como estão (0) — não
          // há voto real pra medir consistência neste grupo; recalculate-
          // scores.ts já trata "sem voto" como consistência 0 (achado
          // 2026-08-22, ver comentário lá), então isso já bate com o
          // resto do sistema.
        },
      });
    }
    fixed++;
  }

  console.log(dryRun
    ? `\n✅ [dry-run] ${fixed} seriam corrigidos, ${skippedInactive} pulados (inativos).`
    : `\n✅ ${fixed} políticos corrigidos com o seed real do partido, ${skippedInactive} pulados (inativos).`);

  if (!dryRun) {
    await prisma.syncLog.create({
      data: {
        sync_type: 'SCORES',
        source: 'MANUAL',
        status: 'SUCCESS',
        start_time: new Date(),
        end_time: new Date(),
        records_processed: stuck.length,
        records_updated: fixed,
        records_failed: 0,
        details: {
          action: 'fix_never_seeded_scores',
          reason: '89 políticos (81 Senado + 8 Câmara) nunca passaram por seed-party-scores.ts — travados no @default bruto do schema (50/50/80/50/60), idêntico pra qualquer partido. Corrigido com o seed real de PARTY_ALIGNMENT.',
          fixedCount: fixed,
          skippedInactive,
        },
      },
    });
    console.log('📝 Registrado no SyncLog para auditoria pública (GET /api/stats/sync-history).');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
