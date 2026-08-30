import { SCORE_WEIGHTS } from '@/types/politician';
import type { APIPolitician } from '@/types/politician';

/**
 * Match Eleitor (M1): afinidade calculada 100% no navegador, sem backend novo.
 * Reusa o ranking oficial (GET /api/politicians) e os pesos da metodologia
 * (SCORE_WEIGHTS). Garantia de honestidade: se o cidadão concorda com todos
 * os critérios, este ranking é IDÊNTICO ao oficial (affinity = overall).
 */

export type MatchChoice = 'concordo' | 'discordo' | 'neutro';

export type MatchAnswers = Record<string, MatchChoice>;

export interface MatchQuestion {
  /** Chave do critério (CriteriaConfig.key) */
  key: string;
  /** Campo do score no JSON da API (CriteriaConfig.field) */
  field: keyof typeof SCORE_WEIGHTS;
  /** Label curto do critério (usado como título da pergunta) */
  label: string;
  /** Pergunta direta em linguagem de eleitor */
  question: string;
}

export const MATCH_QUESTIONS: MatchQuestion[] = [
  {
    key: 'LIFE_PROTECTION',
    field: 'lifeProtection',
    label: 'Proteção à Vida',
    question:
      'A defesa da vida desde a concepção deve orientar os votos no Congresso (contra aborto e eutanásia)?',
  },
  {
    key: 'FAMILY_VALUES',
    field: 'familyValues',
    label: 'Valores Familiares',
    question:
      'A família deve ter autoridade na educação dos filhos e ser prioridade nas políticas públicas?',
  },
  {
    key: 'MORAL_INTEGRITY',
    field: 'moralIntegrity',
    label: 'Integridade Moral',
    question:
      'Gastos públicos dos parlamentares devem ser auditados e irregularidades punidas?',
  },
  {
    key: 'SOCIAL_RESPONSIBILITY',
    field: 'socialResponsibility',
    label: 'Responsabilidade Social',
    question:
      'Saúde, educação e assistência aos mais vulneráveis devem ser prioridade no Orçamento?',
  },
  {
    key: 'RELIGIOUS_FREEDOM',
    field: 'religiousFreedom',
    label: 'Liberdade Religiosa',
    question:
      'O exercício público da fé e a liberdade de culto merecem proteção do Estado?',
  },
];

const round1 = (n: number) => Math.round(n * 10) / 10;

function scoreFor(scores: APIPolitician['scores'], field: keyof typeof SCORE_WEIGHTS): number {
  const value = (scores as unknown as Record<string, number>)[field];
  return typeof value === 'number' ? value : scores.overall;
}

/**
 * Afinidade (0–100) de um político com as respostas.
 * - concordo  → vale a nota do político no critério
 * - discordo  → vale o reflexo (100 − nota)
 * - neutro    → critério sai do cálculo (pesos renormalizados)
 * Sem nenhuma resposta: retorna a nota geral (ranking oficial).
 * Todos concordando em todos os critérios: afinidade == nota geral (overall),
 * então a ordenação coincide com o ranking oficial da metodologia.
 */
export function affinityFor(
  scores: APIPolitician['scores'],
  answers: MatchAnswers,
): number {
  const considered = MATCH_QUESTIONS.filter(
    (q) => answers[q.key] && answers[q.key] !== 'neutro',
  );
  if (considered.length === 0) return scores.overall;

  const allAgreeOnAll =
    considered.length === MATCH_QUESTIONS.length &&
    considered.every((q) => answers[q.key] === 'concordo');
  if (allAgreeOnAll) return scores.overall;

  const totalWeight = considered.reduce((s, q) => s + SCORE_WEIGHTS[q.field], 0);
  let aff = 0;
  for (const q of considered) {
    const w = SCORE_WEIGHTS[q.field] / totalWeight;
    const value = scoreFor(scores, q.field);
    aff += w * (answers[q.key] === 'concordo' ? value : 100 - value);
  }
  return round1(aff);
}

export interface AffinityEntry {
  politician: APIPolitician;
  affinity: number;
}

/** Ordena os parlamentares por afinidade desc (desempate: nota geral). */
export function sortByAffinity(
  politicians: APIPolitician[],
  answers: MatchAnswers,
): AffinityEntry[] {
  return [...politicians]
    .map((politician) => ({
      politician,
      affinity: affinityFor(politician.scores, answers),
    }))
    .sort(
      (a, b) =>
        b.affinity - a.affinity ||
        b.politician.scores.overall - a.politician.scores.overall,
    );
}