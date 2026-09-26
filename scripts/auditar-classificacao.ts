/**
 * AUDITORIA DE CLASSIFICAÇÃO — mostra qual palavra-chave decidiu cada pauta.
 *
 * POR QUE (2026-09-26): a paginação do sync elevou o acervo de 83 para 162
 * pautas e de 6 para 71 assuntos. Com 6 assuntos os falsos positivos não
 * apareciam; com 71, aparecem em bloco — e a revisão um a um é inviável
 * sem saber a causa.
 *
 * Agrupar por palavra-chave muda o problema: em vez de "esta pauta está
 * errada", a pergunta passa a ser "qual palavra está produzindo erro, e
 * quanto". As palavras que mais erram são as que se corrigem primeiro.
 *
 *   npx tsx scripts/auditar-classificacao.ts          # por palavra-chave
 *   npx tsx scripts/auditar-classificacao.ts --pauta  # lista por pauta
 */
import { PrismaClient } from '@prisma/client';
import { matchScanRule, SCAN_RULES_VERSION, textoParaClassificar } from './lib/scan-rules.js';

const prisma = new PrismaClient();

function normalizar(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}
function contemPalavra(texto: string, keyword: string): boolean {
  const k = keyword.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![a-z0-9])${k}(?![a-z0-9])`).test(texto);
}

async function main() {
  const porPauta = process.argv.includes('--pauta');
  const votes = await prisma.vote.findMany({
    select: { key_agenda_id: true, voting_description: true },
  });
  const votosDe = new Map<string, number>();
  for (const v of votes) votosDe.set(v.key_agenda_id, (votosDe.get(v.key_agenda_id) ?? 0) + 1);

  const agendas = await prisma.keyAgenda.findMany({
    where: { id: { in: [...votosDe.keys()] } },
    orderBy: { criteria: 'asc' },
  });

  interface Linha {
    criterio: string;
    titulo: string;
    votos: number;
    palavras: string[];
    kind: string;
  }
  const linhas: Linha[] = [];
  for (const a of agendas) {
    // Título + ementa. NUNCA a descrição do relator (1.5.0).
    const texto = normalizar(textoParaClassificar(a.title, a.description));
    const regra = matchScanRule(texto);
    const palavras = regra
      ? regra.keywords.filter((k) => contemPalavra(texto, k))
      : [];
    linhas.push({
      criterio: a.criteria,
      titulo: (a.title ?? '').slice(0, 62),
      votos: votosDe.get(a.id) ?? 0,
      palavras,
      kind: (a as unknown as { voteKind: string }).voteKind ?? '?',
    });
  }

  const total = linhas.reduce((a, l) => a + l.votos, 0);
  console.log(`\nAUDITORIA DE CLASSIFICAÇÃO — SCAN_RULES ${SCAN_RULES_VERSION}`);
  console.log(`pautas com voto: ${linhas.length} | votos: ${total}\n`);

  if (porPauta) {
    for (const l of linhas.sort((a, b) => b.votos - a.votos)) {
      console.log(
        `  ${String(l.votos).padStart(5)}  ${l.criterio.padEnd(20)} ${(l.kind || '?').padEnd(10)} [${l.palavras.join(', ')}]`,
      );
      console.log(`         ${l.titulo}`);
    }
    await prisma.$disconnect();
    return;
  }

  // Agregado por palavra-chave: quais estão carregando mais volume, e
  // sobre o quê. É aqui que se vê a palavra que precisa sair.
  const porPalavra = new Map<string, { crit: string; pautas: number; votos: number; exemplos: string[] }>();
  for (const l of linhas) {
    for (const p of l.palavras) {
      const chave = `${l.criterio}|${p}`;
      const e = porPalavra.get(chave) ?? { crit: l.criterio, pautas: 0, votos: 0, exemplos: [] };
      e.pautas++;
      e.votos += l.votos;
      if (e.exemplos.length < 3) e.exemplos.push(l.titulo);
      porPalavra.set(chave, e);
    }
  }
  console.log('=== volume por palavra-chave (as que erram mais pesam mais aqui) ===\n');
  for (const [chave, e] of [...porPalavra.entries()].sort((a, b) => b[1].votos - a[1].votos)) {
    const p = chave.split('|')[1];
    const pct = Math.round((100 * e.votos) / total);
    console.log(`  ${String(e.votos).padStart(6)} (${String(pct).padStart(2)}%)  ${e.crit.padEnd(20)} "${p}"  em ${e.pautas} pauta(s)`);
    for (const x of e.exemplos) console.log(`            · ${x}`);
  }
  await prisma.$disconnect();
}

main();
