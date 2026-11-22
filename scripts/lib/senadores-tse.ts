/**
 * Ponte entre o casamento de senadores (casar-senadores.ts) e os syncs do TSE
 * (E3 de docs/PLANO-CONFIANCA-E-DADOS-2027.md). Lógica pura, sem banco.
 *
 * Os syncs ligam candidato -> ficha pelo CPF. O banco não tem CPF de senador,
 * então, com `--senadores`, o CPF do candidato do TSE é usado só em memória:
 * descobre-se a ficha por nome completo + UF + nascimento e o CPF serve para
 * localizar as linhas do arquivo. **Nenhum CPF de senador é gravado.**
 */
import { casarSenadores, type CandidatoTse, type SenadorFicha } from './casar-senadores';

export interface FichaSenadorDb {
  id: number;
  name: string;
  full_name: string | null;
  current_state: string | null;
  birth_date: Date | null;
}

export interface CandidatoSenadorTse extends CandidatoTse {
  cpf: string;
}

/** DD/MM/AAAA a partir de uma data guardada em UTC (evita o dia mudar por fuso). */
export function dataBR(d: Date | null | undefined): string | null {
  if (!d || Number.isNaN(d.getTime())) return null;
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

export function paraFicha(f: FichaSenadorDb): SenadorFicha {
  return { id: f.id, name: f.name, fullName: f.full_name, uf: f.current_state, birth: dataBR(f.birth_date) };
}

export interface CasamentoSenadores {
  /** ficha -> CPF do candidato no TSE (uso em memória apenas). */
  cpfPorFicha: Map<number, string>;
  semFicha: number;
  ambiguos: number;
  fichasTotal: number;
}

/**
 * Casa os candidatos a senador de um ano com as fichas de senador. Só entra
 * casamento 1 para 1. Candidato sem CPF utilizável é ignorado.
 */
export function casarComCpf(fichas: ReadonlyArray<FichaSenadorDb>, candidatos: ReadonlyArray<CandidatoSenadorTse>): CasamentoSenadores {
  const validos = candidatos.filter((c) => /^\d{11}$/.test((c.cpf ?? '').trim()));
  const r = casarSenadores(fichas.map(paraFicha), validos);
  const cpfPorSq = new Map(validos.map((c) => [c.sq, c.cpf.trim()]));
  const cpfPorFicha = new Map<number, string>();
  for (const [sq, id] of r.casados) {
    const cpf = cpfPorSq.get(sq);
    if (cpf) cpfPorFicha.set(id, cpf);
  }
  return { cpfPorFicha, semFicha: r.semFicha.length, ambiguos: r.ambiguos.length, fichasTotal: fichas.length };
}

/** Linha do relatório para o log dos syncs. */
export function resumoSenadores(c: CasamentoSenadores): string {
  return `Senadores: ${c.cpfPorFicha.size} de ${c.fichasTotal} fichas casadas (nome + UF + nascimento) | candidatos sem ficha: ${c.semFicha} | ambíguos (ignorados): ${c.ambiguos}`;
}
