/**
 * sync-tse-receitas.ts
 *
 * Financiamento de campanha 2022 — TRANSPARÊNCIA PURA, não entra na
 * pontuação (decisão de escopo documentada: doação legal não é crime;
 * misturar com score seria insinuação sem base). Alimenta a seção
 * "Financiamento" no perfil do parlamentar.
 *
 * Lê TODOS os receitas_candidatos_2022_<UF>.csv do zip de prestação de
 * contas (54 arquivos, ~674MB descomprimido — o TSE não publica um
 * BRASIL unificado pra receitas de candidatos, só por estado; achado
 * real 2026-08-23 que corrige a nota antiga da branch).
 *
 * Agrega por político e grava UMA linha em CampaignFinance com resumo +
 * top 10 doadores. Doações individuais não são armazenadas — volume
 * inviável e desnecessário pro produto.
 *
 * IMPORTANTE — igual ao sync-tse-candidatura: o portal do TSE bloqueia
 * IP de nuvem/datacenter. O zip precisa ser baixado manualmente
 * (navegador, IP residencial) em data/tse/.
 *
 * Por ano: `--ano 2026` lê `data/tse/2026/` (padrão 2022, como antes) e grava a
 * linha daquele `election_year`, sem tocar nas dos outros anos.
 *
 * TRAVA: recusa importar uma prestação de contas que ainda não é final (menos
 * de 95% das linhas de deputado/senador com tipo FINAL). 2022 tem 98,9%; 2026
 * em 2026-11-02 tinha 33%. `--aceitar-parcial` existe, mas só deve ser usado
 * se a ficha rotular o dado como parcial.
 *
 * `--senadores` também casa os senadores (nome completo + UF + nascimento, 1 para 1;
 * o CPF do candidato é usado só em memória, nenhum CPF de senador é gravado).
 * Desligado por padrão: depende da decisão D3 do levantamento. Lê
 * `consulta_cand_<ano>.zip` para isso.
 *
 * Uso:
 *   pnpm sync:tse:receitas --dry-run   # agrega e relata, não grava
 *   pnpm sync:tse:receitas             # grava de verdade
 *   pnpm sync:tse:receitas --ano 2026 --dry-run
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { pathToFileURL } from 'node:url';
import { parse } from 'csv-parse/sync';
import { parse as parseStream } from 'csv-parse';
import iconv from 'iconv-lite';
import unzipper from 'unzipper';
import fs from 'node:fs';
import path from 'node:path';
import {
  type ReceitaRow,
  type CandidateAggregate,
  type FinanceSummary,
  isRelevantOffice,
  accumulateReceita,
  newAggregate,
  summarize,
  lerDoBrasil,
} from './lib/tse-receitas';
import { casarComCpf, resumoSenadores } from './lib/senadores-tse';
import { lerCandidatosSenador } from './lib/consulta-cand-io';
import { lerAno, prestacaoPodeSerImportada, proporcaoFinal, resolverZip } from './lib/tse-eleicao';

const prisma = new PrismaClient();

const DATA_DIR = path.join(process.cwd(), 'data', 'tse');
// Definidos em main() a partir de `--ano` (padrão 2022, como antes).
let ANO = 2022;
let RECEITAS_ZIP = path.join(DATA_DIR, 'prestacao_de_contas_eleitorais_candidatos_2022.zip');

/** Linhas de deputado/senador por tipo de prestação (FINAL, PARCIAL...), para a trava de "prestação final". */
const tiposDePrestacao = new Map<string, number>();

async function readCsvEntry(zipPath: string, entryName: string): Promise<string> {
  if (!fs.existsSync(zipPath)) {
    throw new Error(
      `${zipPath} não existe. Baixe manualmente de dadosabertos.tse.jus.br ` +
      `(bloqueia IP de nuvem, precisa ser de um navegador comum) e coloque em data/tse/.`
    );
  }
  const directory = await unzipper.Open.file(zipPath);
  const entry = directory.files.find(f => f.path === entryName);
  if (!entry) {
    const available = directory.files.map(f => f.path).join(', ');
    throw new Error(`${entryName} não encontrado em ${zipPath}. Disponíveis: ${available}`);
  }
  const buffer = await entry.buffer();
  return iconv.decode(buffer, 'ISO-8859-1');
}

function parseCsv<T>(content: string): T[] {
  return parse(content, {
    delimiter: ';',
    columns: true,
    relax_quotes: true,
    skip_empty_lines: true,
  }) as T[];
}

/** Acumula uma linha no agregado do político dono do CPF, se for dos nossos. */
export function processReceitaRow(
  row: ReceitaRow & { TP_PRESTACAO_CONTAS?: string },
  byCpf: Map<string, number>,
  aggregates: Map<number, CandidateAggregate>
): boolean {
  if (!isRelevantOffice(row.DS_CARGO || '')) return false;
  const tp = (row.TP_PRESTACAO_CONTAS ?? '?').trim();
  tiposDePrestacao.set(tp, (tiposDePrestacao.get(tp) ?? 0) + 1);
  const politicianId = byCpf.get((row.NR_CPF_CANDIDATO || '').trim());
  if (!politicianId) return false;
  let agg = aggregates.get(politicianId);
  if (!agg) {
    agg = newAggregate(politicianId);
    aggregates.set(politicianId, agg);
  }
  accumulateReceita(agg, row);
  return true;
}

/**
 * Lê o arquivo BRASIL em streaming (432 MB, não cabe como string) e acumula só
 * os estados que não têm arquivo próprio no zip (hoje, o DF).
 */
export async function processBrasilStream(
  zipPath: string,
  ufsComArquivoProprio: Set<string>,
  byCpf: Map<string, number>,
  aggregates: Map<number, CandidateAggregate>
): Promise<{ rowsRead: number; rowsMatched: number }> {
  const directory = await unzipper.Open.file(zipPath);
  const entry = directory.files.find(f => f.path === `receitas_candidatos_${ANO}_BRASIL.csv`);
  if (!entry) throw new Error(`receitas_candidatos_${ANO}_BRASIL.csv não encontrado no zip`);
  const parser = entry
    .stream()
    .pipe(iconv.decodeStream('ISO-8859-1'))
    .pipe(parseStream({ delimiter: ';', columns: true, relax_quotes: true, skip_empty_lines: true }));
  let rowsRead = 0;
  let rowsMatched = 0;
  for await (const row of parser as AsyncIterable<ReceitaRow>) {
    rowsRead++;
    if (!lerDoBrasil(row, ufsComArquivoProprio)) continue;
    if (processReceitaRow(row, byCpf, aggregates)) rowsMatched++;
  }
  return { rowsRead, rowsMatched };
}

/** Processa um CSV de receitas acumulando nos agregados dos nossos políticos. */
export function processReceitasCsv(
  csv: string,
  byCpf: Map<string, number>,
  aggregates: Map<number, CandidateAggregate>
): { rowsRead: number; rowsMatched: number } {
  const rows = parseCsv<ReceitaRow>(csv);
  let matched = 0;

  for (const row of rows) {
    if (processReceitaRow(row, byCpf, aggregates)) matched++;
  }

  return { rowsRead: rows.length, rowsMatched: matched };
}

async function syncReceitas(dryRun: boolean): Promise<void> {
  console.log(`📥 Abrindo ${path.basename(RECEITAS_ZIP)}...`);

  const politicians = await prisma.politician.findMany({
    where: { is_active: true },
    select: { id: true, cpf: true },
  });
  const byCpf = new Map(
    politicians.filter(p => p.cpf).map(p => [p.cpf as string, p.id])
  );
  console.log(`   ${politicians.length} políticos ativos no banco`);
  if (process.argv.includes('--senadores')) {
    const sens = await prisma.politician.findMany({
      where: { current_house: 'SENADO', is_active: true },
      select: { id: true, name: true, full_name: true, current_state: true, birth_date: true },
    });
    const consultaZip = resolverZip(DATA_DIR, `consulta_cand_${ANO}.zip`, ANO, fs.existsSync);
    const r = casarComCpf(sens, await lerCandidatosSenador(consultaZip, ANO));
    console.log(`   ${resumoSenadores(r)}`);
    for (const s of sens) {
      const cpf = r.cpfPorFicha.get(s.id);
      if (cpf) byCpf.set(cpf, s.id);
    }
  }

  const directory = await unzipper.Open.file(RECEITAS_ZIP);
  const receitasEntries = directory.files
    .filter(f => new RegExp(`^receitas_candidatos_${ANO}_[A-Z]{2}\\.csv$`).test(f.path))
    .map(f => f.path)
    .sort();
  console.log(`   ${receitasEntries.length} arquivos de receitas no zip`);

  const aggregates = new Map<number, CandidateAggregate>();
  let totalRows = 0;
  let totalMatched = 0;

  const ufsComArquivoProprio = new Set(
    receitasEntries.map(n => /_([A-Z]{2})\.csv$/.exec(n)?.[1]).filter((x): x is string => Boolean(x))
  );

  for (const entryName of receitasEntries) {
    const csv = await readCsvEntry(RECEITAS_ZIP, entryName);
    const { rowsRead, rowsMatched } = processReceitasCsv(csv, byCpf, aggregates);
    totalRows += rowsRead;
    totalMatched += rowsMatched;
    console.log(`   ${path.basename(entryName)}: ${rowsRead} linhas, ${rowsMatched} do nossos`);
  }

  const faltantes = 27 - ufsComArquivoProprio.size;
  if (faltantes > 0) {
    console.log(`   ${faltantes} estado(s) sem arquivo próprio no zip; lendo do BRASIL em streaming...`);
    const b = await processBrasilStream(RECEITAS_ZIP, ufsComArquivoProprio, byCpf, aggregates);
    totalRows += b.rowsRead;
    totalMatched += b.rowsMatched;
    console.log(`   BRASIL (só estados faltantes): ${b.rowsRead} linhas varridas, ${b.rowsMatched} dos nossos`);
  }

  const aceitarParcial = process.argv.includes('--aceitar-parcial');
  const pctFinal = proporcaoFinal(tiposDePrestacao);
  console.log(
    `   Prestação final: ${(pctFinal * 100).toFixed(1)}% das linhas de deputado/senador ` +
    `(${[...tiposDePrestacao].map(([k, v]) => `${k}: ${v}`).join(', ')})`
  );
  if (!prestacaoPodeSerImportada(tiposDePrestacao, aceitarParcial)) {
    throw new Error(
      `A prestação de contas de ${ANO} ainda não é final (${(pctFinal * 100).toFixed(1)}% final; mínimo 95%). ` +
      `Nada foi gravado. Espere a versão final do TSE. Só use --aceitar-parcial se for rotular o dado como parcial na ficha.`
    );
  }

  const summaries: FinanceSummary[] = [...aggregates.values()].map(summarize);
  const grandTotal = summaries.reduce((s, x) => s + x.totalReceived, 0);
  console.log(
    `\n📊 Agregado: ${totalRows} linhas lidas, ${totalMatched} de nossos candidatos, ` +
    `${summaries.length} políticos com receitas, total R$ ${(grandTotal / 1e6).toFixed(1)}M`
  );

  if (dryRun) {
    // Amostra pros 3 maiores, pra validação manual contra o portal do TSE
    const top3 = [...summaries].sort((a, b) => b.totalReceived - a.totalReceived).slice(0, 3);
    for (const s of top3) {
      console.log(
        `   🏷️  politician_id=${s.politicianId}: R$ ${s.totalReceived.toLocaleString('pt-BR')} em ` +
        `${s.donationCount} doações (${s.donorPfCount} PF, ${s.donorPjCount} PJ), ` +
        `maior R$ ${s.largestDonation.toLocaleString('pt-BR')}`
      );
    }
    const soma: Record<string, number> = {};
    for (const x of summaries) for (const [k, v] of Object.entries(x.bySource)) soma[k] = (soma[k] ?? 0) + v;
    console.log('   Por origem (R$ milhões):', Object.fromEntries(Object.entries(soma).map(([k, v]) => [k, Math.round(v / 1e4) / 100])));
    console.log('🔍 Modo dry-run — nada será gravado no banco.');
    return;
  }

  let upserted = 0;
  for (const s of summaries) {
    await prisma.campaignFinance.upsert({
      where: {
        politician_id_election_year: {
          politician_id: s.politicianId,
          election_year: ANO,
        },
      },
      update: {
        total_received: s.totalReceived,
        donation_count: s.donationCount,
        largest_donation: s.largestDonation,
        donor_pf_count: s.donorPfCount,
        donor_pj_count: s.donorPjCount,
        top_donors: s.topDonors as unknown as Prisma.InputJsonValue,
        source_breakdown: s.bySource as unknown as Prisma.InputJsonValue,
        sq_candidato: s.sqCandidato,
      },
      create: {
        politician_id: s.politicianId,
        election_year: ANO,
        total_received: s.totalReceived,
        donation_count: s.donationCount,
        largest_donation: s.largestDonation,
        donor_pf_count: s.donorPfCount,
        donor_pj_count: s.donorPjCount,
        top_donors: s.topDonors as unknown as Prisma.InputJsonValue,
        source_breakdown: s.bySource as unknown as Prisma.InputJsonValue,
        sq_candidato: s.sqCandidato,
      },
    });
    upserted++;
  }

  // Políticos sem nenhuma receita declarada ficam SEM linha (o perfil
  // exibe estado vazio honesto — mesma disciplina do "0 honesto").
  console.log(`✅ Financiamento: ${upserted} políticos gravados/atualizados.`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  ANO = lerAno(process.argv.slice(2));
  RECEITAS_ZIP = resolverZip(DATA_DIR, `prestacao_de_contas_eleitorais_candidatos_${ANO}.zip`, ANO, fs.existsSync);
  console.log(`Ano: ${ANO}`);
  if (dryRun) console.log('🔍 Modo dry-run — nada será gravado no banco.\n');
  await syncReceitas(dryRun);
}

// Roda só se este arquivo for o entry point de verdade — mesma correção
// aplicada nos outros scripts de sync (achado real 2026-08-20).
// pathToFileURL: o guard antigo (`file://${argv[1]}`) falhava SILENCIOSAMENTE
// em caminhos com espaço/acento (import.meta.url vem percent-encoded) — script
// não rodava e saía 0. Achado real 2026-08-23 rodando da máquina local.
const isEntryPoint = Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntryPoint) {
  main()
    .catch(err => {
      console.error('❌ Erro:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
