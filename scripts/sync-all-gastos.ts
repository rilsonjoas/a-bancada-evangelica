/**
 * sync-all-gastos.ts
 * Sincroniza despesas reais de todos os deputados da Câmara.
 * Cada deputado: busca cota parlamentar dos últimos 2 anos.
 *
 * As despesas afetam MORAL_INTEGRITY: despesas suspeitas penalizam o score.
 * Após rodar este script, execute: pnpm scores:recalculate
 *
 * Tempo estimado: ~40-60 min para 514 deputados × 2 anos × 12 meses
 */
import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const prisma = new PrismaClient();
const BASE = 'https://dadosabertos.camara.leg.br/api/v2';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

interface CamaraGasto {
  ano: number; mes: number;
  tipoDespesa: string; tipoDocumento: string;
  numDocumento: string; dataDocumento: string;
  valorDocumento: number; valorLiquido: number; valorGlosa: number;
  nomeFornecedor: string; cnpjCpfFornecedor: string;
  codDocumento: number; urlDocumento: string;
}

async function syncGastosPolitico(
  politicianId: number,
  legislatureId: string,
  name: string,
  anos: number[]
): Promise<{ created: number; suspicious: number }> {
  let created = 0, suspicious = 0;

  for (const ano of anos) {
    // Câmara API: despesas por mês
    for (let mes = 1; mes <= 12; mes++) {
      // Skip meses futuros
      const now = new Date();
      if (ano === now.getFullYear() && mes > now.getMonth() + 1) break;

      const url = `${BASE}/deputados/${legislatureId}/despesas?ano=${ano}&mes=${mes}&itens=100&ordem=ASC&ordenarPor=ano`;
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) { await sleep(200); continue; }
        const data = await res.json() as { dados: CamaraGasto[] };
        const gastos = data.dados ?? [];

        for (const gasto of gastos) {
          const suspicionReasons: string[] = [];
          let suspicionScore = 0;

          if (gasto.valorLiquido > 50000) {
            suspicionReasons.push('Valor muito alto para despesa mensal'); suspicionScore += 30;
          }
          if (gasto.valorGlosa > 0) {
            suspicionReasons.push('Possui valor glosado'); suspicionScore += 20;
          }
          if (!gasto.cnpjCpfFornecedor) {
            suspicionReasons.push('Fornecedor sem documento identificador'); suspicionScore += 15;
          }
          const isSuspicious = suspicionScore > 20;
          if (isSuspicious) suspicious++;

          try {
            await prisma.expense.upsert({
              where: {
                politician_id_year_month_document_number_source: {
                  politician_id: politicianId,
                  year: gasto.ano, month: gasto.mes,
                  document_number: gasto.numDocumento || 'SEM_NUMERO',
                  source: 'CAMARA',
                },
              },
              create: {
                politician_id: politicianId,
                year: gasto.ano, month: gasto.mes,
                expense_type: gasto.tipoDespesa,
                document_type: gasto.tipoDocumento,
                document_number: gasto.numDocumento || 'SEM_NUMERO',
                document_date: gasto.dataDocumento ? new Date(gasto.dataDocumento) : null,
                gross_value: gasto.valorDocumento,
                net_value: gasto.valorLiquido,
                refund_value: gasto.valorGlosa,
                supplier_name: gasto.nomeFornecedor,
                supplier_document: gasto.cnpjCpfFornecedor,
                supplier_type: (gasto.cnpjCpfFornecedor?.length ?? 0) === 14 ? 'COMPANY' : 'INDIVIDUAL',
                is_suspicious: isSuspicious,
                suspicion_reasons: suspicionReasons,
                suspicion_score: Math.min(suspicionScore, 100),
                source: 'CAMARA',
                source_document_id: gasto.codDocumento.toString(),
                document_url: gasto.urlDocumento,
              },
              update: {
                gross_value: gasto.valorDocumento,
                net_value: gasto.valorLiquido,
                is_suspicious: isSuspicious,
                suspicion_score: Math.min(suspicionScore, 100),
              },
            });
            created++;
          } catch { /* skip */ }
        }
        await sleep(150);
      } catch { await sleep(300); }
    }
    await sleep(200);
  }
  return { created, suspicious };
}

async function main() {
  console.log('💰 Sincronização de gastos — Cota Parlamentar (últimos 2 anos)\n');

  const politicians = await prisma.politician.findMany({
    where: { is_active: true, current_house: 'CAMARA' },
    select: { id: true, legislature_id: true, name: true, current_party: true },
    orderBy: { name: 'asc' },
  });

  const currentYear = new Date().getFullYear();
  const anos = [currentYear - 1, currentYear];
  console.log(`👤 ${politicians.length} deputados | Anos: ${anos.join(', ')}\n`);

  let totalCreated = 0, totalSuspicious = 0;
  let processed = 0;

  for (const p of politicians) {
    process.stdout.write(`[${++processed}/${politicians.length}] ${p.name} (${p.current_party}) ... `);
    const { created, suspicious } = await syncGastosPolitico(p.id, p.legislature_id, p.name, anos);
    totalCreated += created;
    totalSuspicious += suspicious;
    process.stdout.write(`${created} despesas (${suspicious} suspeitas)\n`);
    await sleep(100);
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✅ Sincronização de gastos concluída:`);
  console.log(`   Despesas sincronizadas: ${totalCreated}`);
  console.log(`   Despesas suspeitas:     ${totalSuspicious}`);
  console.log(`${'─'.repeat(60)}`);
  console.log('\n💡 Próximo passo: pnpm scores:recalculate');
}

// Roda só se este arquivo for o entry point (achado real 2026-08-20,
// mesma correção dos outros scripts de sync).
// pathToFileURL: o guard antigo (`file://${argv[1]}`) falhava SILENCIOSAMENTE
// em caminhos com espaço/acento (import.meta.url vem percent-encoded) — script
// não rodava e saía 0. Achado real 2026-08-23 rodando da máquina local.
const isEntryPoint = Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntryPoint) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
