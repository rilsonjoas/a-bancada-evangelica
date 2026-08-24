/**
 * sync-tse-candidatura.ts
 *
 * Importa dados do TSE (candidatura 2022) pra dois fins:
 *   1. Preenche dados biográficos reais dos 514 políticos atuais
 *      (escolaridade, estado civil, ocupação, título de eleitor) —
 *      campos que já existiam no schema mas estavam vazios.
 *   2. Registra motivos de cassação de candidatura de conduta pessoal
 *      real (Ficha Limpa, abuso de poder, compra de voto etc.) — NÃO
 *      motivo administrativo/de partido (indeferimento de coligação,
 *      partido invalidado), que não é sobre a pessoa.
 *
 * IMPORTANTE — isto não roda sozinho: o portal do TSE
 * (dadosabertos.tse.jus.br) bloqueia IP de nuvem/datacenter (testado
 * 2026-08-20 — 403 tanto daqui quanto do próprio VPS). Os arquivos
 * precisam ser baixados manualmente (navegador, IP residencial) e
 * colocados em data/tse/ antes de rodar este script. Ver ROADMAP.md.
 *
 * Uso:
 *   pnpm sync:tse:candidatura --dry-run   # só relata, não grava nada
 *   pnpm sync:tse:candidatura             # grava de verdade
 */
import { PrismaClient } from '@prisma/client';
import { pathToFileURL } from 'node:url';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';
import unzipper from 'unzipper';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

const DATA_DIR = path.join(process.cwd(), 'data', 'tse');
const CANDIDATURA_ZIP = path.join(DATA_DIR, 'consulta_cand_2022.zip');
const CASSACAO_ZIP = path.join(DATA_DIR, 'motivo_cassacao_2022.zip');

// O TSE agrupa candidatura de Deputado Federal/Senador sob "Eleições
// Gerais Estaduais 2022" (não "Eleição Geral Federal") — confirmado
// contra o arquivo real, não suposição.
const ELECTION_LABEL = 'Eleições Gerais Estaduais 2022';
const RELEVANT_OFFICES = new Set(['DEPUTADO FEDERAL', 'SENADOR']);

// Só estes motivos são sobre conduta pessoal do candidato. O resto do
// dataset bruto (~70%, achado real 2026-08-20) é administrativo — "Ausência
// de requisito de registro", "Partido ou federação Invalidado",
// "Indeferimento de partido, federação ou coligação" — não é sobre a
// pessoa, fica de fora por não ser justo atribuir à conduta dela.
const PERSONAL_CONDUCT_REASONS = [
  'Ficha limpa',
  'Abuso de poder',
  'Compra de voto',
  'Conduta vedada',
  'Gasto ilícito',
  'Ausência de desincompatibilização',
];

export function isPersonalConductReason(reason: string): boolean {
  return PERSONAL_CONDUCT_REASONS.some(r => reason.includes(r));
}

interface CandidatoRow {
  DS_ELEICAO: string;
  DS_CARGO: string;
  SQ_CANDIDATO: string;
  NR_CPF_CANDIDATO: string;
  DS_GRAU_INSTRUCAO: string;
  DS_ESTADO_CIVIL: string;
  DS_OCUPACAO: string;
  NR_TITULO_ELEITORAL_CANDIDATO: string;
}

interface CassacaoRow {
  SQ_CANDIDATO: string;
  NR_PROCESSO: string;
  DS_TP_MOTIVO: string;
  DS_MOTIVO: string;
}

async function extractCsvFromZip(zipPath: string, csvName: string): Promise<string> {
  if (!fs.existsSync(zipPath)) {
    throw new Error(
      `${zipPath} não existe. Baixe manualmente de dadosabertos.tse.jus.br ` +
      `(bloqueia IP de nuvem, precisa ser de um navegador comum) e coloque em data/tse/.`
    );
  }
  const directory = await unzipper.Open.file(zipPath);
  const entry = directory.files.find(f => f.path === csvName);
  if (!entry) {
    const available = directory.files.map(f => f.path).join(', ');
    throw new Error(`${csvName} não encontrado em ${zipPath}. Arquivos disponíveis: ${available}`);
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

async function syncCandidatura(dryRun: boolean): Promise<Map<string, number>> {
  console.log('📥 Lendo consulta_cand_2022_BRASIL.csv...');
  const csv = await extractCsvFromZip(CANDIDATURA_ZIP, 'consulta_cand_2022_BRASIL.csv');
  const rows = parseCsv<CandidatoRow>(csv);

  const relevant = rows.filter(
    r => r.DS_ELEICAO === ELECTION_LABEL && RELEVANT_OFFICES.has(r.DS_CARGO)
  );
  console.log(`   ${rows.length} linhas no arquivo, ${relevant.length} são candidatos de Deputado Federal/Senador em 2022`);

  const politicians = await prisma.politician.findMany({
    where: { is_active: true },
    select: { id: true, cpf: true },
  });
  const byCpf = new Map(politicians.filter(p => p.cpf).map(p => [p.cpf as string, p.id]));

  // Mapa SQ_CANDIDATO -> politician_id, reusado pela cassação (mesma
  // fonte de dado, evita reprocessar o CSV de candidatura duas vezes)
  const sqToPoliticianId = new Map<string, number>();

  let matched = 0;
  let updated = 0;
  for (const row of relevant) {
    const politicianId = byCpf.get(row.NR_CPF_CANDIDATO);
    if (!politicianId) continue;

    matched++;
    sqToPoliticianId.set(row.SQ_CANDIDATO, politicianId);

    if (!dryRun) {
      await prisma.politician.update({
        where: { id: politicianId },
        data: {
          education_level: row.DS_GRAU_INSTRUCAO || undefined,
          marital_status: row.DS_ESTADO_CIVIL || undefined,
          occupation: row.DS_OCUPACAO || undefined,
          voter_title: row.NR_TITULO_ELEITORAL_CANDIDATO || undefined,
        },
      });
      updated++;
    }
  }

  console.log(
    `✅ Candidatura: ${matched}/${politicians.length} políticos casados por CPF, ` +
    `${dryRun ? '(dry-run, nada gravado)' : `${updated} atualizados`}`
  );
  return sqToPoliticianId;
}

async function syncCassacao(sqToPoliticianId: Map<string, number>, dryRun: boolean): Promise<void> {
  console.log('📥 Lendo motivo_cassacao_2022_BRASIL.csv...');
  const csv = await extractCsvFromZip(CASSACAO_ZIP, 'motivo_cassacao_2022_BRASIL.csv');
  const rows = parseCsv<CassacaoRow>(csv);
  console.log(`   ${rows.length} registros de cassação no arquivo (nacional, todos os cargos)`);

  let created = 0;
  let skippedNotOurs = 0;
  for (const row of rows) {
    const politicianId = sqToPoliticianId.get(row.SQ_CANDIDATO);
    if (!politicianId) {
      skippedNotOurs++;
      continue; // não é nenhum dos 514 atuais
    }

    const isPersonal = isPersonalConductReason(row.DS_MOTIVO);
    console.log(
      `   ⚠️  político id=${politicianId}: motivo="${row.DS_MOTIVO}" ` +
      `(conduta pessoal: ${isPersonal ? 'sim' : 'não — administrativo, registrado mas não pontua'})`
    );

    if (!dryRun) {
      await prisma.politicianDisqualification.upsert({
        where: {
          politician_id_process_number: {
            politician_id: politicianId,
            process_number: row.NR_PROCESSO,
          },
        },
        update: {
          reason_type: row.DS_TP_MOTIVO,
          reason: row.DS_MOTIVO,
          is_personal_conduct: isPersonal,
        },
        create: {
          politician_id: politicianId,
          election_year: 2022,
          process_number: row.NR_PROCESSO,
          reason_type: row.DS_TP_MOTIVO,
          reason: row.DS_MOTIVO,
          is_personal_conduct: isPersonal,
        },
      });
      created++;
    }
  }

  console.log(
    `✅ Cassação: ${skippedNotOurs} registros não são de nenhum dos 514 atuais (esperado — ` +
    `quem foi desqualificado não teria sido eleito), ${dryRun ? '0 (dry-run)' : created} gravados`
  );
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) console.log('🔍 Modo dry-run — nada será gravado no banco.\n');

  const sqToPoliticianId = await syncCandidatura(dryRun);
  await syncCassacao(sqToPoliticianId, dryRun);
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

export { syncCandidatura, syncCassacao };
