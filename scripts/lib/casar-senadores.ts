/**
 * Casamento de senadores com os candidatos do TSE (E3 de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * O banco não tem CPF de senador (0 de 85). A chave é nome COMPLETO + UF +
 * data de nascimento, comparados exatamente depois de tirar acento e caixa.
 * Nome parecido NÃO casa: nome igual não prova a mesma pessoa, e uma chave
 * que "quase" casa vira ficha com o financiamento de outra pessoa.
 *
 * Este módulo só decide quem casa com quem. Nenhuma gravação passa por aqui;
 * escolher a chave e gravar é a decisão D3 do levantamento.
 */

export interface SenadorFicha {
  id: number;
  name: string;
  fullName: string | null;
  uf: string | null;
  /** DD/MM/AAAA, como o TSE grava. */
  birth: string | null;
}

export interface CandidatoTse {
  sq: string;
  nome: string;
  uf: string;
  /** DD/MM/AAAA */
  nascimento: string;
}

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');

export function normalizarNome(t: string | null | undefined): string {
  return semAcento(t ?? '').toUpperCase().replace(/\s+/g, ' ').trim();
}

const DATA_RE = /^\d{2}\/\d{2}\/\d{4}$/;

/** Chave de casamento; null se faltar qualquer um dos três componentes. */
export function chave(nome: string | null | undefined, uf: string | null | undefined, nascimento: string | null | undefined): string | null {
  const n = normalizarNome(nome);
  const u = (uf ?? '').trim().toUpperCase();
  const d = (nascimento ?? '').trim();
  if (!n || u.length !== 2 || !DATA_RE.test(d)) return null;
  return `${n}|${u}|${d}`;
}

export interface ResultadoCasamento {
  /** SQ do candidato -> id da ficha (casamento único e inequívoco). */
  casados: Map<string, number>;
  /** Candidatos sem nenhuma ficha. */
  semFicha: CandidatoTse[];
  /** Candidatos que bateriam com mais de uma ficha, ou fichas que bateriam com mais de um candidato: não se adivinha. */
  ambiguos: CandidatoTse[];
}

/**
 * Casa candidatos com fichas. Uma ficha pode ser achada pelo nome completo ou
 * pelo nome parlamentar. Casamento só vale se for 1 para 1.
 */
export function casarSenadores(fichas: ReadonlyArray<SenadorFicha>, candidatos: ReadonlyArray<CandidatoTse>): ResultadoCasamento {
  const porChave = new Map<string, Set<number>>();
  for (const f of fichas) {
    for (const nome of [f.fullName, f.name]) {
      const k = chave(nome, f.uf, f.birth);
      if (!k) continue;
      (porChave.get(k) ?? porChave.set(k, new Set()).get(k)!).add(f.id);
    }
  }

  const casados = new Map<string, number>();
  const semFicha: CandidatoTse[] = [];
  const ambiguos: CandidatoTse[] = [];

  for (const c of candidatos) {
    const k = chave(c.nome, c.uf, c.nascimento);
    const ids = k ? porChave.get(k) : undefined;
    if (!ids || ids.size === 0) { semFicha.push(c); continue; }
    if (ids.size > 1) { ambiguos.push(c); continue; }
    const id = [...ids][0];
    casados.set(c.sq, id);
  }

  // Duas candidaturas diferentes casando com a mesma ficha: ambas ficam ambíguas.
  const usos = new Map<number, string[]>();
  for (const [sq, id] of casados) (usos.get(id) ?? usos.set(id, []).get(id)!).push(sq);
  for (const [, sqs] of usos) {
    if (sqs.length > 1) {
      for (const sq of sqs) {
        casados.delete(sq);
        const c = candidatos.find((x) => x.sq === sq);
        if (c) ambiguos.push(c);
      }
    }
  }
  return { casados, semFicha, ambiguos };
}
