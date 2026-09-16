import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * G3: Data quality checks pós-sync.
 * Roda como `tsx scripts/quality-check.ts` ou após cada sync no worker.
 * Salva alertas como SyncLog com status=PARTIAL/ERROR.
 */
export async function runQualityChecks(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // 1. Ativos não variam >5% em relação ao último sync anterior
  const checks = [
    checkPoliticianCountStability(),
    checkScoreRange(),
    checkMandatesHaveScores(),
    checkOrphanExpenses(),
    checkFpeConsistency(),
  ];

  for (const check of checks) {
    results.push(await check);
  }

  // Log summary — grava SEMPRE (até em sucesso), incluindo totalPoliticians
  // para o check de estabilidade do próximo ciclo. Antes (2026-09-16) só
  // gravava quando havia falha, e sem o campo — logo, nunca havia linha para
  // comparar e o check NUNCA validou nada.
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed);
  console.log(`\n📋 Quality checks: ${passed}/${results.length} passaram`);

  const now = new Date();
  const totalPoliticians = await prisma.politician.count({ where: { is_active: true } });

  await prisma.syncLog.create({
    data: {
      sync_type: 'POLITICIANS',
      source: 'MANUAL',
      status: failed.some(f => f.name.includes('CRÍTICO')) ? 'ERROR' : 'PARTIAL',
      start_time: now,
      end_time: now,
      records_processed: results.length,
      records_inserted: 0,
      records_updated: 0,
      records_failed: failed.length,
      error_message: failed.length > 0 ? failed.map(f => `${f.name}: ${f.message}`).join(' | ') : undefined,
      details: {
        action: 'quality_check',
        totalPoliticians,
        results: results.map(r => ({
          name: r.name,
          passed: r.passed,
          message: r.message,
          ...(r.details ? { details: r.details } : {}),
        })),
      },
    },
  });

  if (failed.length > 0) {
    console.log('⚠️  Alertas:');
    for (const f of failed) {
      console.log(`   ❌ ${f.name}: ${f.message}`);
    }
  } else {
    console.log('✅ Todos os checks passaram!');
  }

  return results;
}

// ── Check 1: Variação de políticos ativos ───────────────────────────────
async function checkPoliticianCountStability(): Promise<CheckResult> {
  const current = await prisma.politician.count({ where: { is_active: true } });

  // Compara com o PRIMEIRO log do ciclo anterior (o mais antigo dentre os
  // últimos perto do atual). Corrige bug real (2026-09-16): o código antigo
  // lia `details.totalPoliticians` do `skip:1`, mas NENHUM sync gravava esse
  // campo (só {legislature, timestamp}) — então o check sempre caía em
  // "Sem contagem anterior" e nunca validava. Além disso, com CAMARA/SENADO/
  // FPE gerando 3+ logs POLITICIANS por dia, `skip:1` pegaria log aleatório,
  // não "o ciclo anterior".
  const recentLogs = await prisma.syncLog.findMany({
    where: { details: { path: ['action'], equals: 'quality_check' } },
    orderBy: { end_time: 'desc' },
    take: 10,
    select: { details: true, end_time: true },
  });

  // O total de ativos gravado pelo próprio quality-check no ciclo anterior.
  const prevEntry = recentLogs.find(
    (l) => (l.details as any)?.totalPoliticians != null
  );
  const prevCount = (prevEntry?.details as any)?.totalPoliticians as number | undefined;

  if (prevCount == null) {
    // Primeira execução com o novo formato: grava o valor e valida quando
    // houver um ciclo anterior para comparar.
    return {
      name: 'Estabilidade de políticos ativos',
      passed: true,
      message: `Sem histórico no novo formato. Ativos atuais: ${current}`,
      details: { current, previous: null, delta: 0, percentage: 0 },
    };
  }

  const delta = Math.abs(current - prevCount);
  const pct = (delta / prevCount) * 100;
  const passed = pct <= 5;

  return {
    name: 'Estabilidade de políticos ativos',
    passed,
    message: passed
      ? `${current} ativos (variação ${pct.toFixed(1)}% — dentro do limite de 5%)`
      : `CRÍTICO: ${current} ativos (variação ${pct.toFixed(1)}% — esperado ≤5%, anterior: ${prevCount})`,
    details: { current, previous: prevCount, delta, percentage: pct },
  };
}

// ── Check 2: Scores dentro de 0–100 ────────────────────────────────────
async function checkScoreRange(): Promise<CheckResult> {
  const outOfRange = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM politician_scores
    WHERE overall_score < 0 OR overall_score > 100
  `;

  const count = Number(outOfRange[0]?.count ?? 0);
  const passed = count === 0;

  return {
    name: 'Scores dentro de 0–100',
    passed,
    message: passed
      ? 'Todos os scores dentro da faixa válida'
      : `CRÍTICO: ${count} scores fora de 0–100`,
    details: { outOfRangeCount: count },
  };
}

// ── Check 3: Políticos ativos têm pelo menos 1 score ───────────────────
async function checkMandatesHaveScores(): Promise<CheckResult> {
  const activeWithoutScore = await prisma.politician.count({
    where: {
      is_active: true,
      scores: { none: {} },
    },
  });

  const totalActive = await prisma.politician.count({ where: { is_active: true } });
  const passed = activeWithoutScore === 0;

  return {
    name: 'Políticos ativos com score',
    passed,
    message: passed
      ? `Todos os ${totalActive} ativos têm score`
      : `ALERTA: ${activeWithoutScore} ativos sem score (de ${totalActive})`,
    details: { totalActive, withoutScore: activeWithoutScore },
  };
}

// ── Check 4: Despesas órfãs ────────────────────────────────────────────
async function checkOrphanExpenses(): Promise<CheckResult> {
  const orphans = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM expenses e
    LEFT JOIN politicians p ON e.politician_id = p.id
    WHERE p.id IS NULL
  `;

  const count = Number(orphans[0]?.count ?? 0);
  const passed = count === 0;

  return {
    name: 'Despesas sem político associado',
    passed,
    message: passed
      ? 'Nenhuma despesa órfã'
      : `ALERTA: ${count} despesas sem político associado`,
    details: { orphanCount: count },
  };
}

// ── Check 5: Consistência FPE ──────────────────────────────────────────
async function checkFpeConsistency(): Promise<CheckResult> {
  const fpeCount = await prisma.politician.count({
    where: { is_fpe_member: true, is_active: true },
  });

  // FPE pode ter até ~400 membros (300+ deputados + 15 senadores)
  const passed = fpeCount > 0 && fpeCount < 450;

  return {
    name: 'Consistência FPE',
    passed,
    message: passed
      ? `${fpeCount} membros FPE ativos (dentro do esperado)`
      : `ALERTA: ${fpeCount} membros FPE — verificar se está correto`,
    details: { fpeCount },
  };
}

// ── CLI runner ──────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Rodando data quality checks...\n');
  await runQualityChecks();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
