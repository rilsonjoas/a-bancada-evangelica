/**
 * tse-receitas.ts — lógica pura do sync de financiamento de campanha.
 *
 * Sem imports de Prisma/IO de propósito: é importado tanto pelo script
 * `sync-tse-receitas.ts` quanto por testes unitários (Vitest). A
 * separação existe porque instanciar PrismaClient em teste exige
 * DATABASE_URL — e o CI não tem (nem precisa).
 */

export interface ReceitaRow {
  DS_CARGO: string;
  NR_CPF_CANDIDATO: string;
  NR_CPF_CNPJ_DOADOR: string;
  NM_DOADOR: string;
  DS_ORIGEM_RECEITA: string;
  VR_RECEITA: string;
  /** Tipo de fundo ("FUNDO ESPECIAL", "FUNDO PARTIDARIO", "OUTROS RECURSOS"). */
  DS_FONTE_RECEITA?: string;
  SQ_CANDIDATO?: string;
  SG_UF?: string;
}

/**
 * Deve esta linha do arquivo BRASIL ser lida? Só as de estados SEM arquivo
 * próprio no zip. Achado real (2026-11-02): o zip de 2022 traz 26 arquivos por
 * estado e nenhum do DF, então o sync por estado deixava os 8 deputados do DF
 * sem financiamento. O BRASIL cobre o DF; as linhas dos demais estados já
 * foram lidas dos arquivos próprios e não podem ser contadas duas vezes.
 */
export function lerDoBrasil(row: Pick<ReceitaRow, 'SG_UF'>, ufsComArquivoProprio: ReadonlySet<string>): boolean {
  const uf = (row.SG_UF ?? '').trim().toUpperCase();
  return uf.length === 2 && !ufsComArquivoProprio.has(uf);
}

/**
 * De onde veio o dinheiro (Fase C de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 * Categorias que não se sobrepõem, definidas por `DS_FONTE_RECEITA` (tipo de
 * fundo) e, para o que não é fundo, por `DS_ORIGEM_RECEITA`. Medido nas
 * receitas de 2022 de deputados federais e senadores (R$ 3,6 bi): fundo
 * eleitoral 80,2%, pessoas físicas 8,9%, fundo partidário 6,4%, recursos
 * próprios 2,2%, partido (outros recursos) 1,8%.
 */
export type FonteCategoria =
  | 'fundo_eleitoral'
  | 'fundo_partidario'
  | 'partido'
  | 'pessoas_fisicas'
  | 'proprios'
  | 'outros_candidatos'
  | 'outras';

export const FONTE_CATEGORIAS: ReadonlyArray<FonteCategoria> = [
  'fundo_eleitoral',
  'fundo_partidario',
  'partido',
  'pessoas_fisicas',
  'proprios',
  'outros_candidatos',
  'outras',
];

const normalizar = (t: string) =>
  (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/**
 * Fundo vence a origem: dinheiro do FEFC ou do Fundo Partidário é "fundo"
 * mesmo quando passou por outro candidato. O que não é fundo é classificado
 * pela origem declarada. O que não se reconhece vai para `outras`, nunca é
 * descartado: a soma das categorias é sempre o total arrecadado.
 */
export function categorizarReceita(row: Pick<ReceitaRow, 'DS_FONTE_RECEITA' | 'DS_ORIGEM_RECEITA'>): FonteCategoria {
  const fonte = normalizar(row.DS_FONTE_RECEITA ?? '');
  const origem = normalizar(row.DS_ORIGEM_RECEITA);
  if (fonte.includes('fundo especial')) return 'fundo_eleitoral';
  if (fonte.includes('fundo partidario')) return 'fundo_partidario';
  if (origem.includes('pessoas fisicas')) return 'pessoas_fisicas';
  if (origem.includes('proprios')) return 'proprios';
  if (origem.includes('partido politico')) return 'partido';
  if (origem.includes('outros candidatos')) return 'outros_candidatos';
  return 'outras';
}

export type BySource = Record<FonteCategoria, number>;

export const emptyBySource = (): BySource => ({
  fundo_eleitoral: 0,
  fundo_partidario: 0,
  partido: 0,
  pessoas_fisicas: 0,
  proprios: 0,
  outros_candidatos: 0,
  outras: 0,
});

export interface TopDonor {
  name: string;
  /** Documento mascarado na gravação (data minimização) */
  doc: string;
  amount: number;
  count: number;
}

interface DonorAccumulator {
  name: string;
  total: number;
  count: number;
  isPf: boolean;
}

export interface CandidateAggregate {
  politicianId: number;
  totalReceived: number;
  donationCount: number;
  largestDonation: number;
  /** chave = documento do doador (ou pseudo-chave de estimados) */
  donors: Map<string, DonorAccumulator>;
  /** Total por categoria de origem do dinheiro. */
  bySource: BySource;
  /** `SQ_CANDIDATO` de 2022 (liga à página oficial do candidato no TSE). */
  sqCandidato: string | null;
}

/** Cargos que interessam ao produto. Comparação case-insensitive porque o
 * TSE normaliza diferente entre arquivos (candidatura vem MAIÚSCULO,
 * receitas veio Title Case nos samples reais de 2026-08-23). */
const RELEVANT_OFFICES = new Set(['deputado federal', 'senador']);

export function isRelevantOffice(cargo: string): boolean {
  return RELEVANT_OFFICES.has(cargo.trim().toLowerCase());
}

/** Converte "9000,00" / "1.234.567,89" (formato TSE pt-BR) pra número.
 * Valores vazios/#NULO viram 0 — linha sem valor não deve derrubar o sync. */
export function parseMoneyBRL(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[#NULO]/g, '').trim();
  if (!cleaned) return 0;
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

/** Mascara CPF/CNPJ pra exibição pública. É dado público no portal do TSE,
 * mas não há razão pra republicar documento completo (data minimização,
 * mesma disciplina do Padrão de Qualidade de Conteúdo). */
export function maskDoc(doc: string): string {
  const digits = doc.replace(/\D/g, '');
  if (digits.length === 11) {
    return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
  }
  if (digits.length === 14) {
    return `**.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-**`;
  }
  return '(não identificado)';
}

export type DonorType = 'pf' | 'pj' | 'unknown';

/** PF tem 11 dígitos, PJ tem 14. Sem documento válido (#NULO/-1), usa a
 * origem declarada da receita como fallback ("Recursos de pessoas
 * físicas/jurídicas"). */
export function classifyDonor(row: ReceitaRow): { type: DonorType; key: string; name: string } {
  const digits = (row.NR_CPF_CNPJ_DOADOR || '').replace(/\D/g, '');
  if (digits.length === 11) {
    return { type: 'pf', key: digits, name: row.NM_DOADOR || '(sem nome)' };
  }
  if (digits.length === 14) {
    return { type: 'pj', key: digits, name: row.NM_DOADOR || '(sem nome)' };
  }
  // Doação estimada ou doador não identificado — agrupa num pseudo-doador
  // por origem pra não inflar contagem de pessoas distintas.
  const origem = (row.DS_ORIGEM_RECEITA || '').toLowerCase();
  if (origem.includes('jurídica')) {
    return { type: 'pj', key: '__estimado:pj__', name: '(Recursos estimados — pessoa jurídica)' };
  }
  if (origem.includes('física')) {
    return { type: 'pf', key: '__estimado:pf__', name: '(Recursos estimados — pessoa física)' };
  }
  return { type: 'unknown', key: '__nao_identificado__', name: '(Doador não identificado)' };
}

/** Acumula uma linha de receita no agregado do candidato. Mutação
 * deliberada do acumulador — streaming de ~674MB não pode copiar estado. */
export function accumulateReceita(agg: CandidateAggregate, row: ReceitaRow): void {
  const amount = parseMoneyBRL(row.VR_RECEITA);
  agg.totalReceived += amount;
  agg.donationCount += 1;
  agg.bySource[categorizarReceita(row)] += amount;
  if (!agg.sqCandidato && row.SQ_CANDIDATO) agg.sqCandidato = row.SQ_CANDIDATO.trim();
  if (amount > agg.largestDonation) agg.largestDonation = amount;

  const donor = classifyDonor(row);
  const existing = agg.donors.get(donor.key);
  if (existing) {
    existing.total += amount;
    existing.count += 1;
  } else {
    agg.donors.set(donor.key, { name: donor.name, total: amount, count: 1, isPf: donor.type === 'pf' });
  }
}

export function newAggregate(politicianId: number): CandidateAggregate {
  return {
    politicianId,
    totalReceived: 0,
    donationCount: 0,
    largestDonation: 0,
    donors: new Map(),
    bySource: emptyBySource(),
    sqCandidato: null,
  };
}

export interface FinanceSummary {
  politicianId: number;
  totalReceived: number;
  donationCount: number;
  largestDonation: number;
  donorPfCount: number;
  donorPjCount: number;
  topDonors: TopDonor[];
  bySource: BySource;
  sqCandidato: string | null;
}

/** Fecha o agregado: contagens de doadores distintos + top 10 por valor.
 * Doc vai mascarado direto na gravação. */
export function summarize(agg: CandidateAggregate): FinanceSummary {
  let pf = 0;
  let pj = 0;
  for (const donor of agg.donors.values()) {
    if (donor.isPf) pf += 1;
    else pj += 1;
  }

  const topDonors: TopDonor[] = [...agg.donors.entries()]
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 10)
    .map(([docKey, d]) => ({
      name: d.name,
      doc: maskDoc(docKey),
      amount: Math.round(d.total * 100) / 100,
      count: d.count,
    }));

  return {
    politicianId: agg.politicianId,
    totalReceived: Math.round(agg.totalReceived * 100) / 100,
    donationCount: agg.donationCount,
    largestDonation: Math.round(agg.largestDonation * 100) / 100,
    donorPfCount: pf,
    donorPjCount: pj,
    topDonors,
    bySource: Object.fromEntries(
      FONTE_CATEGORIAS.map((c) => [c, Math.round(agg.bySource[c] * 100) / 100]),
    ) as BySource,
    sqCandidato: agg.sqCandidato,
  };
}
