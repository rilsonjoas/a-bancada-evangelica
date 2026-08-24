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
}

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
  };
}
