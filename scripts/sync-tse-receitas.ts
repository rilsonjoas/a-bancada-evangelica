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
 * Uso:
 *   pnpm sync:tse:receitas --dry-run   # agrega e relata, não grava
 *   pnpm sync:tse:receitas             # grava de verdade
 */
import { PrismaClient } from '@prisma/client';
import { pathToFileURL } from 'node:url';
import { parse } from 'csv-parse/sync';
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
} from './lib/tse-receitas';

const prisma = new PrismaClient();

const DATA_DIR = path.join(process.cwd(), 'data', 'tse');
const RECEITAS_ZIP = path.join(DATA_DIR, 'prestacao_de_contas_eleitorais_candidatos_2022.zip');

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

/** Processa um CSV de receitas acumulando nos agregados dos nossos políticos. */
export function processReceitasCsv(
  csv: string,
  byCpf: Map<string, number>,
  aggregates: Map<number, CandidateAggregate>
): { rowsRead: number; rowsMatched: number } {
  const rows = parseCsv<ReceitaRow>(csv);
  let matched = 0;

  for (const row of rows) {
    if (!isRelevantOffice(row.DS_CARGO || '')) continue;
    const politicianId = byCpf.get((row.NR_CPF_CANDIDATO || '').trim());
    if (!politicianId) continue;

    matched++;
    let agg = aggregates.get(politicianId);
    if (!agg) {
      agg = newAggregate(politicianId);
      aggregates.set(politicianId, agg);
    }
    accumulateReceita(agg, row);
  }

  return { rowsRead: rows.length, rowsMatched: matched };
}

async function syncReceitas(dryRun: boolean): Promise<void> {
  console.log('📥 Abrindo prestacao_de_contas_eleitorais_candidatos_2022.zip...');

  const politicians = await prisma.politician.findMany({
    where: { is_active: true },
    select: { id: true, cpf: true },
  });
  const byCpf = new Map(
    politicians.filter(p => p.cpf).map(p => [p.cpf as string, p.id])
  );
  console.log(`   ${politicians.length} políticos ativos no banco`);

  const directory = await unzipper.Open.file(RECEITAS_ZIP);
  const receitasEntries = directory.files
    .filter(f => /^receitas_candidatos_2022_[A-Z]{2}\.csv$/.test(f.path))
    .map(f => f.path)
    .sort();
  console.log(`   ${receitasEntries.length} arquivos de receitas no zip`);

  const aggregates = new Map<number, CandidateAggregate>();
  let totalRows = 0;
  let totalMatched = 0;

  for (const entryName of receitasEntries) {
    const csv = await readCsvEntry(RECEITAS_ZIP, entryName);
    const { rowsRead, rowsMatched } = processReceitasCsv(csv, byCpf, aggregates);
    totalRows += rowsRead;
    totalMatched += rowsMatched;
    console.log(`   ${path.basename(entryName)}: ${rowsRead} linhas, ${rowsMatched} do nossos`);
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
    console.log('🔍 Modo dry-run — nada será gravado no banco.');
    return;
  }

  let upserted = 0;
  for (const s of summaries) {
    await prisma.campaignFinance.upsert({
      where: {
        politician_id_election_year: {
          politician_id: s.politicianId,
          election_year: 2022,
        },
      },
      update: {
        total_received: s.totalReceived,
        donation_count: s.donationCount,
        largest_donation: s.largestDonation,
        donor_pf_count: s.donorPfCount,
        donor_pj_count: s.donorPjCount,
        top_donors: s.topDonors,
      },
      create: {
        politician_id: s.politicianId,
        election_year: 2022,
        total_received: s.totalReceived,
        donation_count: s.donationCount,
        largest_donation: s.largestDonation,
        donor_pf_count: s.donorPfCount,
        donor_pj_count: s.donorPjCount,
        top_donors: s.topDonors,
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
