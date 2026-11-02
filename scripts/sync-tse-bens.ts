/**
 * sync-tse-bens.ts
 *
 * Importa os bens declarados pelos candidatos ao TSE em 2022 (Fase D de
 * docs/PLANO-CONFIANCA-E-DADOS-2027.md) para `candidate_assets`. Só agregados.
 *
 * REQUISITO DE SCHEMA: a tabela `candidate_assets` precisa existir
 * (`pnpm db:push`). O script confere e aborta se não.
 *
 * Casamento: SQ_CANDIDATO (bem_candidato) -> CPF (consulta_cand_2022) ->
 * `politicians.cpf`. Só Câmara: o banco não tem CPF de senador, e não se casa
 * por nome. Fase E cobre o Senado.
 *
 * Arquivos em data/tse/ (baixados à mão; o TSE bloqueia IP de datacenter):
 *   consulta_cand_2022.zip, bem_candidato_2022.zip
 *
 * Uso:
 *   pnpm sync:tse:bens --dry-run   # só relata
 *   pnpm sync:tse:bens             # grava
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';
import unzipper from 'unzipper';
import fs from 'node:fs';
import path from 'node:path';
import { agruparBens, type BemRow } from './lib/tse-bens';

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), 'data', 'tse');
const CANDIDATURA_ZIP = path.join(DATA_DIR, 'consulta_cand_2022.zip');
const BENS_ZIP = path.join(DATA_DIR, 'bem_candidato_2022.zip');
const ELECTION_LABEL = 'Eleições Gerais Estaduais 2022';
const ANO = 2022;

async function lerCsv<T>(zipPath: string, csvName: string): Promise<T[]> {
  if (!fs.existsSync(zipPath)) {
    throw new Error(`${zipPath} não existe. Baixe manualmente (ver cabeçalho deste script) e coloque em data/tse/.`);
  }
  const dir = await unzipper.Open.file(zipPath);
  const entry = dir.files.find((f) => f.path === csvName);
  if (!entry) throw new Error(`${csvName} não encontrado em ${zipPath}`);
  const text = iconv.decode(await entry.buffer(), 'ISO-8859-1');
  return parse(text, { delimiter: ';', columns: true, relax_quotes: true, skip_empty_lines: true }) as T[];
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const tabela = await prisma.$queryRaw<Array<{ n: bigint }>>(
    Prisma.sql`SELECT COUNT(*)::bigint AS n FROM information_schema.tables WHERE table_name = 'candidate_assets'`,
  );
  if (Number(tabela[0]?.n) !== 1) {
    throw new Error('Tabela candidate_assets não existe neste banco. Rode `pnpm db:push` antes.');
  }

  const cands = await lerCsv<{ DS_ELEICAO: string; DS_CARGO: string; SQ_CANDIDATO: string; NR_CPF_CANDIDATO: string }>(
    CANDIDATURA_ZIP, 'consulta_cand_2022_BRASIL.csv');
  const sqPorCpf = new Map<string, string[]>();
  for (const c of cands) {
    if (c.DS_ELEICAO !== ELECTION_LABEL || !['DEPUTADO FEDERAL', 'SENADOR'].includes(c.DS_CARGO)) continue;
    const l = sqPorCpf.get(c.NR_CPF_CANDIDATO) ?? [];
    l.push(c.SQ_CANDIDATO);
    sqPorCpf.set(c.NR_CPF_CANDIDATO, l);
  }

  const linhas = (await lerCsv<BemRow & { DS_ELEICAO: string }>(BENS_ZIP, 'bem_candidato_2022_BRASIL.csv'))
    .filter((r) => r.DS_ELEICAO === ELECTION_LABEL);
  const resumos = agruparBens(linhas);
  console.log(`${linhas.length} linhas de bens (eleição geral estadual 2022), ${resumos.size} candidatos com ao menos um bem.`);

  const pols = await prisma.politician.findMany({ where: { cpf: { not: null } }, select: { id: true, cpf: true } });

  let casados = 0, comBens = 0, ambiguos = 0, semVerificacao = 0, gravados = 0;
  for (const p of pols) {
    const sqs = sqPorCpf.get(p.cpf as string);
    if (!sqs) continue;
    casados++;
    const comLinhas = sqs.filter((sq) => resumos.has(sq));
    if (comLinhas.length === 0) continue;
    if (comLinhas.length > 1) { ambiguos++; continue; }
    comBens++;
    const sq = comLinhas[0];
    const r = resumos.get(sq)!;
    if (r.semVerificacao) semVerificacao++;
    const dados = {
      sq_candidato: sq,
      total_declared: r.total,
      item_count: r.itens,
      largest_item: r.maiorItem,
      by_type: r.porGrupo as unknown as Prisma.InputJsonValue,
      unverified: r.semVerificacao,
    };
    if (!dryRun) {
      await prisma.candidateAsset.upsert({
        where: { politician_id_election_year: { politician_id: p.id, election_year: ANO } },
        update: dados,
        create: { politician_id: p.id, election_year: ANO, ...dados },
      });
    }
    gravados++;
  }

  console.log(
    `Fichas com CPF: ${pols.length} | casadas com candidatura 2022: ${casados} | com bens declarados: ${comBens} | ` +
    `ambíguas (ignoradas): ${ambiguos} | marcadas "sem verificação": ${semVerificacao} | ` +
    `${dryRun ? 'a gravar (dry-run, nada gravado)' : 'gravadas'}: ${gravados}`,
  );
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
