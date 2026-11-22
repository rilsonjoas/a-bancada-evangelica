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
 * Por ano: `--ano 2026` lê `data/tse/2026/` (padrão 2022, como antes). Cada ano
 * grava a sua própria linha (`unique(politician, election_year)`): importar
 * 2026 nunca sobrescreve 2022.
 *
 * `--senadores` também casa os senadores (nome completo + UF + nascimento, 1 para 1;
 * o CPF do candidato é usado só em memória, nenhum CPF de senador é gravado).
 * Desligado por padrão: depende da decisão D3 do levantamento.
 *
 * Uso:
 *   pnpm sync:tse:bens --dry-run             # só relata (2022)
 *   pnpm sync:tse:bens --ano 2026 --dry-run  # só relata (2026)
 *   pnpm sync:tse:bens [--ano N]             # grava
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';
import unzipper from 'unzipper';
import fs from 'node:fs';
import path from 'node:path';
import { agruparBens, type BemRow } from './lib/tse-bens';
import { casarComCpf, resumoSenadores } from './lib/senadores-tse';
import { lerCandidatosSenador } from './lib/consulta-cand-io';
import { ehEleicaoGeralEstadual, lerAno, resolverZip } from './lib/tse-eleicao';

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), 'data', 'tse');

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
  const ANO = lerAno(process.argv.slice(2));
  const CANDIDATURA_ZIP = resolverZip(DATA_DIR, `consulta_cand_${ANO}.zip`, ANO, fs.existsSync);
  const BENS_ZIP = resolverZip(DATA_DIR, `bem_candidato_${ANO}.zip`, ANO, fs.existsSync);
  console.log(`Ano: ${ANO}${dryRun ? ' (dry-run)' : ''}`);

  const tabela = await prisma.$queryRaw<Array<{ n: bigint }>>(
    Prisma.sql`SELECT COUNT(*)::bigint AS n FROM information_schema.tables WHERE table_name = 'candidate_assets'`,
  );
  if (Number(tabela[0]?.n) !== 1) {
    throw new Error('Tabela candidate_assets não existe neste banco. Rode `pnpm db:push` antes.');
  }

  const cands = await lerCsv<{ DS_ELEICAO: string; DS_CARGO: string; SQ_CANDIDATO: string; NR_CPF_CANDIDATO: string }>(
    CANDIDATURA_ZIP, `consulta_cand_${ANO}_BRASIL.csv`);
  const sqPorCpf = new Map<string, string[]>();
  for (const c of cands) {
    if (!ehEleicaoGeralEstadual(c.DS_ELEICAO, ANO) || !['DEPUTADO FEDERAL', 'SENADOR'].includes((c.DS_CARGO ?? '').trim().toUpperCase())) continue;
    const l = sqPorCpf.get(c.NR_CPF_CANDIDATO) ?? [];
    l.push(c.SQ_CANDIDATO);
    sqPorCpf.set(c.NR_CPF_CANDIDATO, l);
  }

  const linhas = (await lerCsv<BemRow & { DS_ELEICAO: string }>(BENS_ZIP, `bem_candidato_${ANO}_BRASIL.csv`))
    .filter((r) => ehEleicaoGeralEstadual(r.DS_ELEICAO, ANO));
  if (linhas.length === 0) throw new Error(`Nenhuma linha de eleição geral estadual ${ANO} em ${BENS_ZIP}: confira o ano e o arquivo.`);
  const resumos = agruparBens(linhas);
  console.log(`${linhas.length} linhas de bens (eleição geral estadual ${ANO}), ${resumos.size} candidatos com ao menos um bem.`);

  const pols = await prisma.politician.findMany({ where: { cpf: { not: null } }, select: { id: true, cpf: true } });
  if (process.argv.includes('--senadores')) {
    const sens = await prisma.politician.findMany({
      where: { current_house: 'SENADO', is_active: true },
      select: { id: true, name: true, full_name: true, current_state: true, birth_date: true },
    });
    const r = casarComCpf(sens, await lerCandidatosSenador(CANDIDATURA_ZIP, ANO));
    console.log(resumoSenadores(r));
    for (const s of sens) {
      const cpf = r.cpfPorFicha.get(s.id);
      if (cpf) pols.push({ id: s.id, cpf });
    }
  }

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
    `Fichas com CPF: ${pols.length} | casadas com candidatura ${ANO}: ${casados} | com bens declarados: ${comBens} | ` +
    `ambíguas (ignoradas): ${ambiguos} | marcadas "sem verificação": ${semVerificacao} | ` +
    `${dryRun ? 'a gravar (dry-run, nada gravado)' : 'gravadas'}: ${gravados}`,
  );
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
