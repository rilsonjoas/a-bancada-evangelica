import { describe, it, expect } from 'vitest';
import {
  affinityFor,
  sortByAffinity,
  MATCH_QUESTIONS,
  type MatchAnswers,
} from '@/lib/match';
import type { APIPolitician } from '@/types/politician';

function politician(overall: number, scores: Partial<APIPolitician['scores']> = {}): APIPolitician {
  return {
    id: Math.floor(Math.random() * 1000),
    name: `Dep ${overall}`,
    currentParty: 'A',
    currentState: 'BA',
    currentHouse: 'CAMARA',
    scores: {
      lifeProtection: overall,
      familyValues: overall,
      moralIntegrity: overall,
      socialResponsibility: overall,
      religiousFreedom: overall,
      overall,
      performanceLevel: 'AVERAGE',
      performanceLabel: 'Regular',
      totalVotes: 20,
      consistencyScore: 0.8,
      lastCalculation: new Date().toISOString(),
      ...scores,
    },
  };
}

const agreeAll: MatchAnswers = {
  LIFE_PROTECTION: 'concordo',
  FAMILY_VALUES: 'concordo',
  MORAL_INTEGRITY: 'concordo',
  SOCIAL_RESPONSIBILITY: 'concordo',
  RELIGIOUS_FREEDOM: 'concordo',
};

describe('match.affinityFor', () => {
  it('concordando com tudo e notas iguais nos critérios, afinidade == essa nota', () => {
    const p = politician(75);
    expect(affinityFor(p.scores, agreeAll)).toBe(75);
  });

  it('discordando de um critério, usa o reflexo (100 - nota) nele', () => {
    const p = politician(50, { lifeProtection: 10, familyValues: 10, moralIntegrity: 10, socialResponsibility: 10, religiousFreedom: 10 });
    const answers: MatchAnswers = { ...agreeAll, FAMILY_VALUES: 'discordo' };
    const aff = affinityFor(p.scores, answers);
    // familyValues entra como 90 (=100-10); Moral e Social entram como 10.
    // Pesos renormalizados entre os 3 critérios do quiz: 25 + 20 + 15 = 60.
    expect(aff).toBeCloseTo((0.25 * 90 + 0.35 * 10) / 0.6, 1);
  });

  it('concordar com tudo NÃO devolve a nota geral: critério sem voto medido fica fora', () => {
    // Regressão do passe de honestidade 2026-09-27: a nota geral inclui a
    // semente do partido em Vida e Religião; o quiz não pode herdá-la.
    const p = politician(60, { lifeProtection: 90, religiousFreedom: 90, familyValues: 50, moralIntegrity: 50, socialResponsibility: 50 });
    expect(affinityFor(p.scores, agreeAll)).toBe(50);
  });

  it('neutro descarta o critério e renormaliza os pesos', () => {
    const p = politician(50, { familyValues: 0, moralIntegrity: 80, socialResponsibility: 40 });
    const answers: MatchAnswers = { ...agreeAll, FAMILY_VALUES: 'neutro' };
    const aff = affinityFor(p.scores, answers);
    const expected = (0.2 * 80 + 0.15 * 40) / 0.35;
    expect(aff).toBeCloseTo(expected, 1);
  });

  it('sem nenhuma resposta (tudo neutro), retorna a nota geral', () => {
    const p = politician(61.4);
    const answers: MatchAnswers = {
      LIFE_PROTECTION: 'neutro',
      FAMILY_VALUES: 'neutro',
      MORAL_INTEGRITY: 'neutro',
      SOCIAL_RESPONSIBILITY: 'neutro',
      RELIGIOUS_FREEDOM: 'neutro',
    };
    expect(affinityFor(p.scores, answers)).toBe(61.4);
  });

  it('o quiz cobre exatamente os critérios com voto medido', () => {
    expect(MATCH_QUESTIONS.map((q) => q.key).sort()).toEqual(
      ['FAMILY_VALUES', 'MORAL_INTEGRITY', 'SOCIAL_RESPONSIBILITY'].sort(),
    );
  });
});

describe('match.sortByAffinity', () => {
  it('ordena por afinidade desc e desempata pela nota geral', () => {
    const high = politician(90);
    const low = politician(40);
    const sorted = sortByAffinity([low, high], agreeAll);
    expect(sorted[0].politician.scores.overall).toBe(90);
    expect(sorted[1].politician.scores.overall).toBe(40);
    expect(sorted[0].affinity).toBe(90);
  });

  it('respeita a direção do discordo (quem vota contra ganha)', () => {
    const antiAbortoLover = politician(50, { lifeProtection: 50, familyValues: 100, moralIntegrity: 50, socialResponsibility: 50, religiousFreedom: 50 });
    const proChoiceFp = politician(50, { lifeProtection: 50, familyValues: 5, moralIntegrity: 50, socialResponsibility: 50, religiousFreedom: 50 });
    const answers: MatchAnswers = { ...agreeAll, FAMILY_VALUES: 'discordo' };
    const sorted = sortByAffinity([antiAbortoLover, proChoiceFp], answers);
    expect(sorted[0].politician.id).toBe(proChoiceFp.id);
  });
});