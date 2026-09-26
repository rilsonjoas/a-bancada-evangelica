/**
 * MEDIÇÃO — quantas pautas sobrevivem à correção de 2026-09-26.
 *
 * Roda sobre o banco real, com o classificador real, e compara o critério
 * que oBANCO gravou com o que o classificador corrigido devolve. É a
 * medida que decide se o site pode voltar a publicar nota.
 *
 *   npx tsx scripts/medir-sobrevivencia.ts
 *
 * Não grava nada. Só mede e imprime.
 */
import { PrismaClient } from '@prisma/client';
import { matchScanRule, SCAN_RULES_VERSION } from './lib/scan-rules.js';

const prisma = new PrismaClient();
const MAPA: Record<string, string> = { SOCIAL_RESPONSIBILITY: 'SOCIAL_RESP' };

async function main() {
  const agendas = await prisma.keyAgenda.findMany({
    include: { _count: { select: { votes: true } } },
  });
  const votosDe = new Map<string, number>();
  const porVoto = await prisma.vote.groupBy({
    by: ['key_agenda_id'],
    _count: { _all: true },
  });
  for (const p of porVoto) votosDe.set(p.key_agenda_id, p._count._all);

  let mantem = 0, muda = 0, nenhuma = 0;
  let votosTotal = 0, votosMantem = 0, Muda = 0,VotesNenhuma = 0;
  const detalhe: Array<{ t: string; de: string; para: string; v: number }> = [];

  for (const a of agendas) {
    const texto = `${a.title ?? ''} ${a.description ?? ''}`;
    const novo = matchScanRule(texto);
    const novoNorm = novo ? (MAPA[novo.criteria] ?? novo.criteria) : null;
    const v = votosDe.get(a.id) ?? 0;
    votosTotal += v;
    if (!novoNorm) {
      nenhuma++; muda += 0; VotesNenhuma += v;
      detalhe.push({ t: (a.title ?? '').slice(0, 54), de: a.criteria, para: 'SEM REGRA', v });
    } else if (novoNorm === a.criteria) {
      mantem++; votosMantem += v;
    } else {
      muda++; VotesNenhuma += v;
      detalhe.push({ t: (a.title ?? '').slice(0, 54), de: a.criteria, para: novoNorm, v });
    }
  }

  const pc = (n: number) => `${(100 * n / (votosTotal || 1)).toFixed(1)}%`;
  console.log(`\nSCAN_RULES ${SCAN_RULES_VERSION} — sobrevivência das pautas\n`);
  console.log(`Pautas: ${agendas.length} | mantem ${mantem} | mudam ${muda} | sem regra ${nenhuma}`);
  console.log(`Votos:  ${votosTotal} total`);
  console.log(`  mantem o critério ....... ${votosMantem} (${pc(votosMantem)})`);
  console.log(`  mudam ou perdem .......... ${votosTotal - votosMantem} (${pc(votosTotal - votosMantem)})`);
  console.log(`\n--- 20 maiores mudanças (por peso de votos) ---`);
  for (const d of detalhe.sort((x, y) => y.v - x.v).slice(0, 20)) {
    console.log(`  ${String(d.v).padStart(5)}  ${d.de.padEnd(20)} → ${d.para.padEnd(20)} ${d.t}`);
  }
  await prisma.$disconnect();
}
main();
