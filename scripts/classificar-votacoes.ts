/**
 * Backfill — classifica o tipo de cada votação já gravada (D-02).
 *
 * O `vote_kind` é propriedade da SESSÃO de votação, não do voto individual:
 * todos os votos de uma mesma pauta vêm da mesma deliberação e compartilham
 * o tipo. Por isso o campo mora em `key_agendas` e não em `votes`.
 *
 * De onde vem a classificação: `votes.voting_description`, que existe
 * (povoado) para os 26.860 votos do banco. Quando duas pautas diferentes
 * compartilham a sessão, a classificação é a mesma por construção.
 *
 *   npx tsx scripts/classificar-votacoes.ts            # mostra o plano
 *   npx tsx scripts/classificar-votacoes.ts --aplicar   # grava
 */
import { PrismaClient } from '@prisma/client';
import { classificarVotacao, VOTE_KIND_WEIGHTS, VOTE_KIND_LABELS } from './lib/vote-kind.js';

const prisma = new PrismaClient();
const aplicar = process.argv.includes('--aplicar');

async function main() {
  // Uma descrição por pauta. Se houver mais de uma (mesma proposição votada
  // em sessões diferentes), a primeira com tipo mais forte prevalece — é o
  // caso em que a proposição foi votada em mérito E recebeu emenda.
  const porAgenda = new Map<string, { desc: string; tipos: Set<string> }>();
  const votos = await prisma.vote.findMany({
    select: { key_agenda_id: true, voting_description: true },
  });
  for (const v of votos) {
    const atual = porAgenda.get(v.key_agenda_id);
    if (!atual) {
      porAgenda.set(v.key_agenda_id, { desc: v.voting_description, tipos: new Set() });
    }
    atual.tipos.add(classificarVotacao(v.voting_description));
  }

  // Precedência quando a mesma proposição teve mérito e emenda: a mais
  // forte manda, porque é a que define a posição sobre o assunto.
  const FORCA = ['MERIT', 'FINAL_TEXT', 'AMENDMENT', 'REQUEST', 'URGENCY'] as const;
  const plano: Array<{ id: string; tipo: string; peso: number; titulo: string }> = [];
  for (const [id, { tipos }] of porAgenda) {
    const tipo = FORCA.find((t) => tipos.has(t)) ?? 'REQUEST';
    plano.push({ id, tipo, peso: VOTE_KIND_WEIGHTS[tipo as keyof typeof VOTE_KIND_WEIGHTS], titulo: '' });
  }
  const metas = await prisma.keyAgenda.findMany({
    where: { id: { in: plano.map((p) => p.id) } },
    select: { id: true, title: true, voteKind: true, voteKindWeight: true },
  });
  const titulo = new Map(metas.map((m) => [m.id, m.title]));

  let muda = 0, igual = 0;
  for (const p of plano) {
    p.titulo = (titulo.get(p.id) ?? '').slice(0, 56);
    const antes = metas.find((m) => m.id === p.id)!;
    if (antes.voteKind === p.tipo && Math.abs(antes.voteKindWeight - p.peso) < 1e-9) igual++;
    else muda++;
  }

  console.log(`\nCLASSIFICAÇÃO DE VOTAÇÕES (D-02)${aplicar ? ' — APLICANDO' : ' — simulação'}\n`);
  console.log(`pautas com voto: ${plano.length} | já classificadas: ${igual} | a classificar: ${muda}\n`);
  for (const tipo of FORCA) {
    const n = plano.filter((p) => p.tipo === tipo).length;
    console.log(`  ${String(n).padStart(4)}  peso ${VOTE_KIND_WEIGHTS[tipo].toFixed(1)}  ${VOTE_KIND_LABELS[tipo]}`);
  }

  if (!aplicar) {
    console.log('\n--- 15 com maior reducao de peso ---');
    for (const p of plano.sort((a, b) => a.peso - b.peso).slice(0, 15)) {
      console.log(`  peso ${p.peso.toFixed(1)}  ${p.tipo.padEnd(11)} ${p.titulo}`);
    }
    console.log('\n(sem gravação — rode com --aplicar)');
    await prisma.$disconnect();
    return;
  }

  for (const p of plano) {
    await prisma.keyAgenda.update({
      where: { id: p.id },
      data: { voteKind: p.tipo as never, voteKindWeight: p.peso },
    });
  }
  console.log(`\nGravado: ${muda} pautas classificadas.`);
  console.log('Agora rode `npx tsx scripts/recalculate-scores.ts --dry-run` para medir o efeito na nota.');
  await prisma.$disconnect();
}

main();
