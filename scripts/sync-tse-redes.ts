/**
 * sync-tse-redes.ts
 *
 * Importa as redes sociais que cada candidato declarou ao TSE em 2022
 * (B2 de docs/PLANO-CONFIANCA-E-DADOS-2027.md) para `politicians.tse_social_urls`.
 * As redes da Câmara/Senado (`social_media_urls`) não são tocadas: elas são
 * regravadas a cada sync, e o que vem do TSE só preenche as redes que a casa
 * não informou (regra em src/api/politicians/social-links.ts).
 *
 * REQUISITO DE SCHEMA: a coluna `tse_social_urls` precisa existir no banco
 * (`pnpm db:push`, mudança aditiva e anulável). O script confere e aborta se não.
 *
 * Casamento: CPF do candidato (consulta_cand_2022) == `politicians.cpf`.
 * Só Câmara: o Senado não tem CPF no banco, e senador atual quase nunca foi
 * candidato em 2022. Sem CPF, não se casa por nome (nome igual não prova pessoa).
 *
 * Arquivos em data/tse/ (baixados à mão; o TSE bloqueia IP de datacenter):
 *   consulta_cand_2022.zip
 *   rede_social_candidato_2022.zip
 *     https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_2022.zip
 *
 * Por ano: `--ano 2026` lê `data/tse/2026/` (padrão 2022, como antes). O campo
 * guarda UM ano só; a declaração mais recente vale e uma importação de ano mais
 * antigo nunca sobrescreve uma mais nova.
 *
 * `--senadores` também casa os senadores (nome completo + UF + nascimento, 1 para 1;
 * o CPF do candidato é usado só em memória, nenhum CPF de senador é gravado).
 * Desligado por padrão: depende da decisão D3 do levantamento.
 *
 * Uso:
 *   pnpm sync:tse:redes --dry-run             # só relata (2022)
 *   pnpm sync:tse:redes --ano 2026 --dry-run  # só relata (2026)
 *   pnpm sync:tse:redes [--ano N]             # grava
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';
import unzipper from 'unzipper';
import fs from 'node:fs';
import path from 'node:path';
import { agruparRedes, mesmoConteudo, montarTseSocialUrls, type RedeRow } from './lib/tse-redes';
import { casarComCpf, resumoSenadores } from './lib/senadores-tse';
import { lerCandidatosSenador } from './lib/consulta-cand-io';
import { deveSubstituirRedes, ehEleicaoGeralEstadual, lerAno, resolverZip } from './lib/tse-eleicao';

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
  const REDES_ZIP = resolverZip(DATA_DIR, `rede_social_candidato_${ANO}.zip`, ANO, fs.existsSync);
  console.log(`Ano: ${ANO}${dryRun ? ' (dry-run)' : ''}`);

  const col = await prisma.$queryRaw<Array<{ n: bigint }>>(
    Prisma.sql`SELECT COUNT(*)::bigint AS n FROM information_schema.columns WHERE table_name = 'politicians' AND column_name = 'tse_social_urls'`,
  );
  if (Number(col[0]?.n) !== 1) {
    throw new Error('Coluna politicians.tse_social_urls não existe neste banco. Rode `pnpm db:push` antes.');
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

  const linhas = (await lerCsv<RedeRow & { DS_ELEICAO: string }>(REDES_ZIP, `rede_social_candidato_${ANO}_BRASIL.csv`))
    .filter((r) => ehEleicaoGeralEstadual(r.DS_ELEICAO, ANO));
  if (linhas.length === 0) throw new Error(`Nenhuma linha de eleição geral estadual ${ANO} em ${REDES_ZIP}: confira o ano e o arquivo.`);
  const redesPorSq = agruparRedes(linhas);
  console.log(`${linhas.length} linhas de rede (eleição geral estadual ${ANO}), ${redesPorSq.size} candidatos com ao menos uma.`);

  const pols = await prisma.politician.findMany({
    where: { cpf: { not: null } },
    select: { id: true, cpf: true, tse_social_urls: true },
  });
  if (process.argv.includes('--senadores')) {
    const sens = await prisma.politician.findMany({
      where: { current_house: 'SENADO', is_active: true },
      select: { id: true, name: true, full_name: true, current_state: true, birth_date: true, tse_social_urls: true },
    });
    const r = casarComCpf(sens, await lerCandidatosSenador(CANDIDATURA_ZIP, ANO));
    console.log(resumoSenadores(r));
    for (const s of sens) {
      const cpf = r.cpfPorFicha.get(s.id);
      if (cpf) pols.push({ id: s.id, cpf, tse_social_urls: s.tse_social_urls });
    }
  }

  let casados = 0, comRedes = 0, gravados = 0, iguais = 0, ambiguos = 0, maisNovas = 0;
  for (const p of pols) {
    const sqs = sqPorCpf.get(p.cpf as string);
    if (!sqs) continue;
    casados++;
    const comLinhas = sqs.filter((sq) => redesPorSq.has(sq));
    if (comLinhas.length === 0) continue;
    // Mais de uma candidatura do mesmo CPF com redes: mesmo cargo/ano não se repete; se acontecer, não adivinha.
    if (comLinhas.length > 1) { ambiguos++; continue; }
    comRedes++;
    const valor = montarTseSocialUrls(ANO, redesPorSq.get(comLinhas[0])!);
    const anoGuardado = (p.tse_social_urls as { ano?: unknown } | null)?.ano;
    if (!deveSubstituirRedes(anoGuardado, ANO)) { maisNovas++; continue; }
    if (mesmoConteudo(p.tse_social_urls, valor)) { iguais++; continue; }
    if (!dryRun) {
      await prisma.politician.update({ where: { id: p.id }, data: { tse_social_urls: valor as unknown as Prisma.InputJsonValue } });
    }
    gravados++;
  }

  console.log(
    `Fichas com CPF: ${pols.length} | casadas com candidatura ${ANO}: ${casados} | com redes no TSE: ${comRedes} | ` +
    `ambíguas (ignoradas): ${ambiguos} | já com ano mais novo (preservadas): ${maisNovas} | já iguais: ${iguais} | ${dryRun ? 'a gravar (dry-run, nada gravado)' : 'gravadas'}: ${gravados}`,
  );
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
