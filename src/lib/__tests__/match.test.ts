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
  it('concordando com tudo, afinidade == nota geral (ranking oficial)', () => {
    const p = politician(75);
    expect(affinityFor(p.scores, agreeAll)).toBe(75);
  });

  it('discordando de um critério, usa o reflexo (100 - nota) nele', () => {
    const p = politician(50, { lifeProtection: 10, familyValues: 10, moralIntegrity: 10, socialResponsibility: 10, religiousFreedom: 10 });
    const answers: MatchAnswers = { ...agreeAll, LIFE_PROTECTION: 'discordo' };
    const aff = affinityFor(p.scores, answers);
    // lifeProtection entra como 90 (=100-10); os outros 4 entram como 10
    expect(aff).toBeCloseTo((0.3 * 90 + 0.7 * 10) / 1, 5);
  });

  it('neutro descarta o critério e renormaliza os pesos', () => {
    const p = politician(50, { familyValues: 0, lifeProtection: 100, moralIntegrity: 50, socialResponsibility: 50, religiousFreedom: 50 });
    const answers: MatchAnswers = { ...agreeAll, FAMILY_VALUES: 'neutro' };
    const aff = affinityFor(p.scores, answers);
    const total = 1 - 0.25; // 0.75
    const expected = (0.3 * 100 + 0.2 * 50 + 0.15 * 50 + 0.1 * 50) / total;
    expect(aff).toBeCloseTo(expected, 5);
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

  it('o quiz cobre exatamente os 5 critérios da metodologia', () => {
    expect(MATCH_QUESTIONS).toHaveLength(5);
    expect(MATCH_QUESTIONS.map((q) => q.key).sort()).toEqual(
      ['FAMILY_VALUES', 'LIFE_PROTECTION', 'MORAL_INTEGRITY', 'RELIGIOUS_FREEDOM', 'SOCIAL_RESPONSIBILITY'].sort(),
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
    const antiAbortoLover = politician(50, { lifeProtection: 100, familyValues: 50, moralIntegrity: 50, socialResponsibility: 50, religiousFreedom: 50 });
    const proChoiceFp = politician(50, { lifeProtection: 5, familyValues: 50, moralIntegrity: 50, socialResponsibility: 50, religiousFreedom: 50 });
    const answers: MatchAnswers = { ...agreeAll, LIFE_PROTECTION: 'discordo' };
    const sorted = sortByAffinity([antiAbortoLover, proChoiceFp], answers);
    expect(sorted[0].politician.id).toBe(proChoiceFp.id);
  });
});