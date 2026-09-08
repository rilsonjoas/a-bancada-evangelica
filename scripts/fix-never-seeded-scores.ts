/**
 * fix-never-seeded-scores.ts
 *
 * Achado real (2026-09-08): seed-party-scores.ts roda só 1 vez, no começo
 * do projeto. Todo político ADICIONADO DEPOIS disso (Senado sincronizado
 * depois do seed original; deputados incluídos numa auditoria posterior,
 * ex.: Silas Câmara — presidente da FPE, achado durante a correção da
 * auditoria de filiação em 2026-09-08) nunca passou pelo seed. O
 * recalculate-scores.ts diário toca nesses registros também, mas como
 * base ele usa o @default bruto do schema.prisma (50/50/80/50/60) — não
 * o histórico real do partido — e como ninguém deles tem voto casado
 * (0 delta), o resultado fica congelado nesse default genérico pra
 * sempre, idêntico pra PT e PL. Confirmado contra a API de produção:
 * 89 políticos (81 Senado + 8 Câmara) na assinatura exata
 * life=50 AND family=50 AND social=50 AND religious=60.
 *
 * Por que NÃO reusar seed-party-scores.ts nem scores:recalculate aqui:
 * - seed-party-scores.ts faz upsert INCONDICIONAL em todo político ativo
 *   — rodar de novo destruiria o score real (baseado em voto) de quem já
 *   tem histórico na Câmara.
 * - recalculate-scores.ts tem um bug diferente e mais grave (soma o
 *   delta de voto cumulativo de novo a cada execução diária, saturando
 *   score em 0/100 pra quem tem voto — 98% dos deputados em Família,
 *   100% em Responsabilidade Social). Rodar esse comando agora
 *   continuaria saturando os poucos que ainda não bateram no teto.
 *   FORA DE ESCOPO deste script — é bug do motor, precisa de correção
 *   própria, feita com calma, não por este fix pontual.
 *
 * Este script só toca em quem bate a assinatura exata acima — nunca em
 * quem já tem score real. Aplica o mesmo cálculo de seed-party-scores.ts
 * (PARTY_ALIGNMENT + individualNoise) pros 4 critérios sem voto, e pra
 * moral_integrity aplica a MESMA fórmula de penalidade de despesa do
 * recalculate-scores.ts (mas calculada uma vez, sem cumulatividade —
 * não há bug de saturação aqui porque não soma delta de voto nenhum,
 * sumDelta é sempre 0 pra esse grupo).
 *
 * Uso:
 *   pnpm tsx scripts/fix-never-seeded-scores.ts --dry-run   # só lista
 *   pnpm tsx scripts/fix-never-seeded-scores.ts             # aplica
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Idêntico a scripts/seed-party-scores.ts — mesma fonte (DIAP, FPE,
// JRN/Estadão, histórico 56ª/57ª legislaturas). Não duplicar decisão,
// só o cálculo.
const PARTY_ALIGNMENT: Record<string, [number, number, number, number, number]> = {
  PL: [88, 88, 52, 38, 88],
  PP: [82, 82, 60, 52, 80],
  REPUBLICANOS: [82, 82, 70, 58, 88],
  UNIÃO: [78, 78, 64, 58, 78],
  PSD: [65, 65, 62, 62, 65],
  MDB: [58, 58, 65, 65, 60],
  SOLIDARIEDADE: [72, 72, 60, 62, 72],
  AVANTE: [65, 65, 60, 62, 65],
  PRD: [75, 75, 62, 52, 72],
  PODE: [75, 75, 65, 60, 72],
  NOVO: [70, 65, 78, 42, 65],
  PATRIOTA: [78, 78, 60, 52, 75],
  PSC: [85, 85, 58, 48, 88],
  DC: [88, 88, 62, 50, 90],
  PTB: [65, 65, 55, 55, 62],
  PROS: [65, 65, 60, 60, 65],
  PMN: [60, 60, 60, 62, 60],
  PSDB: [58, 58, 68, 60, 58],
  PTC: [65, 65, 62, 55, 65],
  PMB: [70, 70, 60, 55, 70],
  PRTB: [75, 75, 60, 50, 72],
  PRP: [70, 70, 60, 52, 68],
  PHS: [68, 68, 62, 55, 68],
  PEN: [72, 72, 60, 52, 70],
  SD: [72, 72, 60, 62, 72],
  DEM: [65, 65, 68, 58, 62],
  PR: [68, 68, 60, 58, 65],
  PPL: [62, 62, 60, 62, 60],
  PDT: [30, 30, 62, 80, 30],
  PT: [18, 18, 55, 90, 18],
  PSOL: [12, 12, 55, 88, 12],
  PSB: [32, 32, 60, 82, 32],
  REDE: [22, 22, 65, 82, 22],
  PCdoB: [14, 14, 50, 90, 14],
  PV: [25, 25, 62, 80, 25],
  CIDADANIA: [45, 45, 65, 68, 45],
  AGIR: [78, 78, 62, 52, 80],
};

const WEIGHTS = [0.30, 0.25, 0.20, 0.15, 0.10];

function clamp(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

// Idêntico a seed-party-scores.ts — mesma semente pseudoaleatória por
// político, pra dois políticos do mesmo partido não terem nota idêntica.
function individualNoise(politicianId: number, criteriaIndex: number): number {
  const seed = (politicianId * 31 + criteriaIndex * 17) % 100;
  return Math.round(((seed % 17) - 8) * 0.9);
}

function overall(scores: number[]): number {
  return clamp(scores.reduce((acc, s, i) => acc + s * WEIGHTS[i], 0));
}

// Idêntico a recalculate-scores.ts — mesmos limiares (65/45/80→
// EXCELLENT/GOOD/AVERAGE/POOR), pra não inventar um terceiro texto.
function performanceLabel(score: number): { level: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR'; label: string; description: string } {
  if (score >= 80) return { level: 'EXCELLENT', label: 'Guardião da Fé', description: 'Votações consistentemente alinhadas com os valores cristãos' };
  if (score >= 65) return { level: 'GOOD', label: 'Testemunho Fiel', description: 'Bom alinhamento com os critérios evangélicos' };
  if (score >= 45) return { level: 'AVERAGE', label: 'Caminhando', description: 'Alinhamento parcial — há votações mistas' };
  return { level: 'POOR', label: 'Precisa Crescer', description: 'Votações frequentemente divergem dos valores cristãos' };
}

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

    const party = (p.current_party ?? '').toUpperCase().trim();
    const base = PARTY_ALIGNMENT[party] ?? [55, 55, 65, 60, 55];

    const life = clamp(base[0] + individualNoise(p.id, 0));
    const family = clamp(base[1] + individualNoise(p.id, 1));
    const social = clamp(base[3] + individualNoise(p.id, 3));
    const religious = clamp(base[4] + individualNoise(p.id, 4));

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
    const moralSeed = clamp(base[2] + individualNoise(p.id, 2));
    const moral = clamp(moralSeed - expensePenalty);

    const total = overall([life, family, moral, social, religious]);
    const perf = performanceLabel(total);

    if (dryRun) {
      console.log(`   [dry-run] #${p.id} ${p.name} (${party}, ${p.current_house}) → vida=${life} família=${family} moral=${moral} social=${social} religiao=${religious} geral=${total}`);
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
