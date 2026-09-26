/**
 * MEDIÇÃO — quantas pautas sobrevivem à correção de 2026-09-26.
 *
 * Roda sobre o banco real, com o classificador real, e compara o critério
 * que o BANCO gravou com o que o classificador corrigido devolve. É a
 * medida que decide se o site pode voltar a publicar nota.
 *
 *   npx tsx scripts/medir-sobrevivencia.ts            # resumo
 *   npx tsx scripts/medir-sobrevivencia.ts --todas    # lista as 83
 *
 * Não grava nada. Só mede e imprime.
 */
import { PrismaClient } from '@prisma/client';
import { matchScanRule, SCAN_RULES_VERSION } from './lib/scan-rules.js';

const prisma = new PrismaClient();
async function main() {
  const todas = process.argv.includes('--todas');
  const agendas = await prisma.keyAgenda.findMany();
  const porVoto = await prisma.vote.groupBy({ by: ['key_agenda_id'], _count: { _all: true } });
  const votosDe = new Map(porVoto.map((p) => [p.key_agenda_id, p._count._all]));

  let mantem = 0, muda = 0, nenhuma = 0;
  let votosTotal = 0, votosMantem = 0;
  const linhas: string[] = [];

  for (const a of agendas) {
    const texto = `${a.title ?? ''} ${a.description ?? ''}`;
    const novo = matchScanRule(texto);
    const novoNorm = novo; // matchScanRule já devolve o valor do enum
    const v = votosDe.get(a.id) ?? 0;
    votosTotal += v;
    let estado: string;
    if (!novoNorm) { nenhuma++; estado = 'PERDE'; }
    else if (novoNorm === a.criteria) { mantem++; votosMantem += v; estado = 'ok   '; }
    else { muda++; estado = 'MUDA '; }
    if (novoNorm && novoNorm !== a.criteria) {
      const kws = novo!.keywords.filter((k) => {
        const n = texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
        const kk = k.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
        return new RegExp(`(?<![a-z0-9])${kk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`).test(n);
      });
      linhas.push(`  ${String(v).padStart(4)} ${estado} ${a.criteria.padEnd(20)} -> ${novoNorm.padEnd(19)} [${kws.join(', ')}] ${(a.title ?? '').slice(0, 46)}`);
    } else if (!novoNorm) {
      linhas.push(`  ${String(v).padStart(4)} ${estado} ${a.criteria.padEnd(20)} -> ${'-'.padEnd(19)} ${(a.title ?? '').slice(0, 60)}`);
    } else if (todas) {
      linhas.push(`  ${String(v).padStart(4)} ${estado} ${a.criteria.padEnd(20)} = ${novoNorm.padEnd(19)} ${(a.title ?? '').slice(0, 60)}`);
    }
  }

  const pc = (n: number) => `${(100 * n / (votosTotal || 1)).toFixed(1)}%`;
  console.log(`\nSCAN_RULES ${SCAN_RULES_VERSION}\n`);
  console.log(`Pautas: ${agendas.length} | mantem ${mantem} | mudam ${muda} | sem regra ${nenhuma}`);
  console.log(`Votos:  ${votosTotal} | mantem criterio ${votosMantem} (${pc(votosMantem)}) | muda ou perde ${votosTotal - votosMantem} (${pc(votosTotal - votosMantem)})\n`);
  for (const l of linhas) console.log(l);
  await prisma.$disconnect();
}
main();
