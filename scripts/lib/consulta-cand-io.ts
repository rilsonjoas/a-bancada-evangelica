/**
 * Leitura do `consulta_cand_<ano>.zip` para o casamento de senadores
 * (`--senadores` nos syncs do TSE). Faz I/O; a lógica de casamento fica em
 * senadores-tse.ts e casar-senadores.ts, que são puras e testadas.
 */
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';
import unzipper from 'unzipper';
import fs from 'node:fs';
import { ehEleicaoGeralEstadual } from './tse-eleicao';
import type { CandidatoSenadorTse } from './senadores-tse';

interface Linha {
  DS_ELEICAO: string;
  DS_CARGO: string;
  SQ_CANDIDATO: string;
  NM_CANDIDATO: string;
  SG_UF: string;
  DT_NASCIMENTO: string;
  NR_CPF_CANDIDATO: string;
}

/** Candidatos a senador da eleição geral estadual do ano (todos, não só os eleitos). */
export async function lerCandidatosSenador(zipPath: string, ano: number): Promise<CandidatoSenadorTse[]> {
  if (!fs.existsSync(zipPath)) throw new Error(`${zipPath} não existe (necessário para --senadores).`);
  const dir = await unzipper.Open.file(zipPath);
  const nome = `consulta_cand_${ano}_BRASIL.csv`;
  const entry = dir.files.find((f) => f.path === nome);
  if (!entry) throw new Error(`${nome} não encontrado em ${zipPath}`);
  const linhas = parse(iconv.decode(await entry.buffer(), 'ISO-8859-1'), {
    delimiter: ';', columns: true, relax_quotes: true, skip_empty_lines: true,
  }) as Linha[];
  return linhas
    .filter((l) => ehEleicaoGeralEstadual(l.DS_ELEICAO, ano) && (l.DS_CARGO ?? '').trim().toUpperCase() === 'SENADOR')
    .map((l) => ({ sq: l.SQ_CANDIDATO, nome: l.NM_CANDIDATO, uf: l.SG_UF, nascimento: l.DT_NASCIMENTO, cpf: l.NR_CPF_CANDIDATO }));
}
