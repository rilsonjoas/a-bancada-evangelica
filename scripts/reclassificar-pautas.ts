/**
 * RECLASSIFICAÇÃO — reavalia todas as pautas já gravadas contra as
 * SCAN_RULES atuais.
 *
 * POR QUE ESTE SCRIPT EXISTE (2026-09-26, `docs/AUDITORIA-CLASSIFICACAO.md`):
 *
 * Rodar o `sync-votes.ts` NÃO reclassifica o que já está no banco. O sync
 * faz `if (!rule) continue` — quando uma pauta não casa mais, ele apenas
 * pula, e a classificação antiga continua gravada. Pior: o bug de paginação
 * faz o sync só ver a primeira página de cada trimestre, então ele não
 * alcança nem as pautas que ele mesmo criou.
 *
 * Ou seja: sem este script, corrigir a SCAN_RULES não corrige nada no
 * banco. Foi por isso que a medição de sobrevivência é um script separado
 * (`medir-sobrevivencia.ts`) e não uma linha do sync.
 *
 * O que ele faz, por pauta:
 *   - recasa título + descrição contra as regras atuais
 *   - AGENDA QUE NÃO CASA MAIS: os votos param de contar (excluídos)
 *   - AGENDA QUE TROCA DE CRITÉRIO: votos realocados
 *   - PASSA `rules_version` para a versão atual, sempre
 *
 * NÃO apaga pauta nem voto — só realoca. Apagar seria destrutivo e
 * perderia a trilha do que foi medido antes.
 *
 *   npx tsx scripts/reclassificar-pautas.ts            # mostra o plano
 *   npx tsx scripts/reclassificar-pautas.ts --aplicar   # grava
 */
import { PrismaClient } from '@prisma/client';
import { matchScanRule, SCAN_RULES_VERSION } from './lib/scan-rules.js';

const prisma = new PrismaClient();
const aplicar = process.argv.includes('--aplicar');

async function main() {
  const agendas = await prisma.keyAgenda.findMany();
  const porVoto = await prisma.vote.groupBy({ by: ['key_agenda_id'], _count: { _all: true } });
  const votosDe = new Map(porVoto.map((p) => [p.key_agenda_id, p._count._all]));

  let mantem = 0, muda = 0, perde = 0;
  let votosMantem = 0, votosMuda = 0, votosPerde = 0;
  const plano: Array<{ t: string; de: string; para: string; v: number; id: string }> = [];

  for (const a of agendas) {
    const r = matchScanRule(`${a.title ?? ''} ${a.description ?? ''}`);
    // matchScanRule já devolve o valor do enum (CriteriaType). Sem mapeamento
    // aqui: um mapeamento anterior convertia para 'SOCIAL_RESP', que não existe
    // no enum, e fazia toda pauta SOCIAL que continuava SOCIAL ser contada
    // como 'mudou' — subestimando a sobrevivência em 9,5% quando era maior.
    const novo: string | null = r?.criteria ?? null;
    const v = votosDe.get(a.id) ?? 0;

    if (!novo) {
      perde++; votosPerde += v;
      plano.push({ t: (a.title ?? '').slice(0, 58), de: a.criteria, para: 'PERDE', v, id: a.id });
    } else if (novo === a.criteria) {
      mantem++; votosMantem += v;
      if (a.rules_version !== SCAN_RULES_VERSION) {
        await prisma.keyAgenda.update({
          where: { id: a.id },
          data: { rules_version: SCAN_RULES_VERSION },
        });
      }
    } else {
      muda++; votosMuda += v;
      plano.push({ t: (a.title ?? '').slice(0, 58), de: a.criteria, para: novo, v, id: a.id });
    }
  }

  const total = votosMantem + votosMuda + votosPerde;
  const pc = (n: number) => `${(100 * n / (total || 1)).toFixed(1)}%`;
  console.log(`\nRECLASSIFICAÇÃO — SCAN_RULES ${SCAN_RULES_VERSION}${aplicar ? ' (APLICANDO)' : ' (simulação)'}\n`);
  console.log(`Pautas: ${agendas.length} | mantem ${mantem} | mudam ${muda} | deixam de casar ${perde}`);
  console.log(`Votos:  ${total}`);
  console.log(`  mantem ............ ${votosMantem} (${pc(votosMantem)})`);
  console.log(`  mudam de criterio . ${votosMuda} (${pc(votosMuda)})`);
  console.log(`  param de contar ... ${votosPerde} (${pc(votosPerde)})`);

  if (!aplicar) {
    console.log(`\n--- 20 maiores mudanças planejadas ---`);
    for (const p of plano.sort((x, y) => y.v - x.v).slice(0, 20)) {
      console.log(`  ${String(p.v).padStart(4)}  ${p.de.padEnd(20)} → ${p.para.padEnd(18)} ${p.t}`);
    }
    console.log('\n(sem gravação — rode com --aplicar para gravar)');
    await prisma.$disconnect();
    return;
  }

  // Aplica: realoca o critério das que mudaram e marca a versão das outras.
  for (const p of plano) {
    if (p.para === 'PERDE') {
      // Não apaga. `ARCHIVED` é o estado que o enum já define como
      // "não monitora mais" — tira da vitrine e do cálculo preservando a
      // trilha do que foi medido antes. Apagar seria destrutivo.
      await prisma.keyAgenda.update({
        where: { id: p.id },
        data: { status: 'ARCHIVED', rules_version: SCAN_RULES_VERSION },
      });
    } else {
      await prisma.keyAgenda.update({
        where: { id: p.id },
        data: {
          criteria: p.para as never,
          rules_version: SCAN_RULES_VERSION,
        },
      });
    }
  }
  console.log(`\nGravado: ${plano.length} pautas alteradas.`);
  console.log('IMPORTANTE: as pautas PERDEM precisam ter os votos excluídos do cálculo.');
  console.log('Rode `npx tsx scripts/recalculate-scores.ts --dry-run` para medir o efeito.');
  await prisma.$disconnect();
}

main();
