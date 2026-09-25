/**
 * recalc-expense-flags.ts
 *
 * Aplica a camada ROBUSTA de detecção de despesa fora do padrão sobre o
 * acervo já sincronizado.
 *
 * POR QUE ESTE SCRIPT EXISTE SEPARADO DO SYNC
 * O corte robusto é uma mediana POR CATEGORIA — depende de ver o acervo
 * inteiro, não a despesa que está chegando no stream da API. O sync grava
 * o dado cru e aplica só as regras absolutas; este script roda sobre tudo
 * e acrescenta a camada relativa.
 *
 * ACHADO REAL (2026-09-25) que motivou o script
 * Com as regras antigas, em 74.336 despesas sincronizadas:
 *   23 marcadas como is_suspicious (0,03%), 14 dos 174 parlamentares com
 *   despesa registrada. O card de perfil mostrava 0,08% em média.
 * Um corte fixo não pode funcionar num corpus em que o p95 por categoria
 * varia 130x (R$ 153 em alimentação, R$ 20.000 em divulgação).
 *
 * USO
 *   pnpm expenses:recalc --dry-run         # antes/depois, não grava
 *   pnpm expenses:recalc                   # grava + snapshot de rollback
 *   pnpm expenses:recalc --politician=42   # recalcula só um (debug)
 *
 * DEPOIS DISSO
 *   pnpm scores:recalculate                # a penalidade de Integridade
 *                                          # Moral lê expense.is_suspicious
 *                                          # — o ranking se move, e por
 *                                          # isso há snapshot de rollback.
 */
import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  EXPENSE_RULES_VERSION,
  MIN_BASELINE_N,
  ROBUST_PERCENTILE,
  ROBUST_Z_LIMIT,
  computeBaselines,
  evaluateExpense,
  normalizeCategory,
  type ExpenseLike,
} from './lib/expense-rules';

const prisma = new PrismaClient();

interface ExpenseRow extends ExpenseLike {
  // Atenção: Expense.id é cuid (String), não Int — o UPDATE em lote
  // monta os VALUES com literal de texto, não ::int.
  id: string;
  politician_id: number;
  is_suspicious: boolean;
  suspicion_score: number;
  suspicion_reasons: string[];
}

function argValue(flag: string): string | undefined {
  return process.argv.find(a => a.startsWith(`--${flag}=`))?.split('=')[1];
}

/** Escapa uma string para literal single-quoted do Postgres. */
function pgText(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

/** Snapshot de rollback: ponto anterior de toda nota que pode mudar. */
async function gravarSnapshot(reason: string): Promise<number> {
  const linhas = await prisma.politicianScore.findMany({
    select: {
      politician_id: true, life_protection: true, family_values: true,
      moral_integrity: true, social_responsibility: true, religious_freedom: true,
      overall_score: true,
    },
  });
  if (linhas.length === 0) return 0;

  const agora = new Date();
  const dados = linhas.map(l => ({ ...l, snapshot_date: agora, snapshot_reason: reason }));
  // createMany em blocos — tudo de uma vez estoura o limite de parâmetros
  for (let i = 0; i < dados.length; i += 200) {
    await prisma.historicalScore.createMany({ data: dados.slice(i, i + 200) });
  }
  return dados.length;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const apenasUm = argValue('politician');

  console.log(`🔎 Recálculo de despesas fora do padrão — regras ${EXPENSE_RULES_VERSION}\n`);
  if (apenasUm) console.log(`   Escopo: apenas politically ${apenasUm}\n`);
  if (dryRun) console.log('   ⚠️  DRY RUN — nada será gravado\n');

  const despesas = await prisma.expense.findMany({
    where: apenasUm ? { politician_id: Number(apenasUm) } : undefined,
    select: {
      id: true, politician_id: true, year: true, month: true, net_value: true,
      refund_value: true, expense_type: true, supplier_name: true,
      supplier_document: true, source: true, is_suspicious: true,
      suspicion_score: true, suspicion_reasons: true,
    },
    orderBy: { id: 'asc' },
  });

  if (despesas.length === 0) {
    console.log('❌ Nenhuma despesa encontrada. Rode pnpm sync:camara:gastos antes.');
    return;
  }
  console.log(`📊 ${despesas.length.toLocaleString('pt-BR')} despesas carregadas`);

  // --- 1. Baselines por (categoria normalizada, ano) ---
  const baselines = computeBaselines(
    despesas.map(d => ({
      category: normalizeCategory(d.expense_type),
      year: d.year,
      value: d.net_value,
    })),
  );
  const comBaseline = despesas.filter(d =>
    baselines.has(`${normalizeCategory(d.expense_type)}|${d.year}`),
  ).length;
  console.log(`📐 ${baselines.size} baselines | ${comBaseline.toLocaleString('pt-BR')} despesas ` +
    `(${((comBaseline / despesas.length) * 100).toFixed(1)}%) com baseline de categoria`);
  console.log(`   corte: mediana + ${ROBUST_Z_LIMIT}x MAD E acima do p${ROBUST_PERCENTILE * 100} da categoria ` +
    `(n mínimo ${MIN_BASELINE_N})\n`);

  // --- 2. Veredito novo; só o que muda entra na lista de gravação ---
  type Mudanca = { id: string; politician_id: number; is_suspicious: boolean; score: number; reasons: string[] };
  const mudancas: Mudanca[] = [];
  const porPolitico = new Map<number, number>();
  let marcadasDepois = 0, passamASer = 0, paramDeSer = 0;

  for (const d of despesas) {
    const v = evaluateExpense(d, { baselines });
    if (v.is_suspicious) marcadasDepois++;
    if (v.is_suspicious === d.is_suspicious) continue;

    if (v.is_suspicious) passamASer++; else paramDeSer++;
    mudancas.push({
      id: d.id, politician_id: d.politician_id,
      is_suspicious: v.is_suspicious, score: v.suspicion_score, reasons: v.suspicion_reasons,
    });
    porPolitico.set(d.politician_id, (porPolitico.get(d.politician_id) ?? 0) + 1);
  }

  const marcadasAntes = despesas.filter(d => d.is_suspicious).length;
  const taxa = (n: number) => `${((n / despesas.length) * 100).toFixed(2)}%`;
  console.log('─── antes → depois ───');
  console.log(`   despesas marcadas:  ${marcadasAntes.toLocaleString('pt-BR')} (${taxa(marcadasAntes)})` +
    ` → ${marcadasDepois.toLocaleString('pt-BR')} (${taxa(marcadasDepois)})`);
  console.log(`   passam a ser marcadas:  ${passamASer.toLocaleString('pt-BR')}`);
  console.log(`   deixam de ser marcadas:  ${paramDeSer.toLocaleString('pt-BR')}`);
  console.log(`   linhas a gravar:         ${mudancas.length.toLocaleString('pt-BR')}`);
  console.log(`   parlamentares afetados:  ${porPolitico.size} de ${new Set(despesas.map(d => d.politician_id)).size} com despesa\n`);

  if (dryRun) {
    console.log('   Dry run encerrado. Rode sem --dry-run para gravar.');
    return;
  }
  if (mudancas.length === 0) {
    console.log('   Nada a fazer — o acervo já está no estado da regra atual.');
    return;
  }

  // --- 3. Snapshot ANTES de gravar ---
  const snap = await gravarSnapshot(`expense_rules_${EXPENSE_RULES_VERSION}`);
  console.log(`💾 Snapshot de rollback gravado para ${snap} parlamentares`);

  // --- 4. Gravação em lote: UPDATE ... FROM (VALUES ...) ---
  const CHUNK = 400;
  for (let i = 0; i < mudancas.length; i += CHUNK) {
    const bloco = mudancas.slice(i, i + CHUNK);
    const valores = bloco
      .map(m => `(${pgText(m.id)}::text, ${m.is_suspicious}::boolean, ${m.score}::float, ` +
        `ARRAY[${m.reasons.map(pgText).join(', ')}]::text[])`)
      .join(',\n       ');
    await prisma.$executeRawUnsafe(
      `UPDATE expenses e
          SET is_suspicious = v.s, suspicion_score = v.sc, suspicion_reasons = v.r
         FROM (VALUES ${valores}) AS v(id, s, sc, r)
        WHERE e.id = v.id`,
    );
    process.stdout.write(`\r   gravando ${Math.min(i + CHUNK, mudancas.length)}/${mudancas.length}`);
  }
  process.stdout.write('\n');

  const inicio = new Date();
  await prisma.syncLog.create({
    data: {
      sync_type: 'EXPENSES',
      source: 'MANUAL',
      status: 'SUCCESS',
      start_time: inicio,
      end_time: new Date(),
      records_processed: despesas.length,
      records_updated: mudancas.length,
      details: {
        rules_version: EXPENSE_RULES_VERSION,
        baselines: baselines.size,
        marked_before: marcadasAntes,
        marked_after: marcadasDepois,
        affected_politicians: porPolitico.size,
        dry_run: false,
      },
    },
  });

  console.log(`\n${'─'.repeat(60)}`);
  console.log('✅ Recálculo concluído');
  console.log(`\n💡 Próximo passo: pnpm scores:recalculate`);
  console.log(`${'─'.repeat(60)}`);
}

const isEntryPoint = Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntryPoint) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
