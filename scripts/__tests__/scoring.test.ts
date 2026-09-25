import { describe, it, expect } from 'vitest';
import {
  PARTY_ALIGNMENT,
  UNKNOWN_PARTY_BASE,
  clampScore,
  clampSeed,
  individualNoise,
  isKnownParty,
  overallScore,
  partyBase,
  performanceLabel,
  type CriteriaKey,
} from '../lib/scoring';

describe('partyBase / isKnownParty', () => {
  it('retorna o seed real de um partido conhecido', () => {
    expect(partyBase('PL')).toEqual(PARTY_ALIGNMENT.PL);
    expect(isKnownParty('PL')).toBe(true);
  });

  it('é tolerante a caixa e espaço (dado real da API às vezes vem assim)', () => {
    expect(partyBase(' pl ')).toEqual(PARTY_ALIGNMENT.PL);
  });

  it('cai no default neutro pra partido desconhecido', () => {
    expect(partyBase('SIGLA_INEXISTENTE')).toEqual(UNKNOWN_PARTY_BASE);
    expect(isKnownParty('SIGLA_INEXISTENTE')).toBe(false);
  });

  it('cai no default neutro pra null/undefined', () => {
    expect(partyBase(null)).toEqual(UNKNOWN_PARTY_BASE);
    expect(partyBase(undefined)).toEqual(UNKNOWN_PARTY_BASE);
  });
});

describe('individualNoise', () => {
  it('é determinístico — mesmo id+critério sempre dá o mesmo ruído', () => {
    const a = individualNoise(677, 2);
    const b = individualNoise(677, 2);
    expect(a).toBe(b);
  });

  it('varia entre critérios diferentes do mesmo político (evita nota idêntica nos 5)', () => {
    const values = [0, 1, 2, 3, 4].map((i) => individualNoise(677, i));
    expect(new Set(values).size).toBeGreaterThan(1);
  });

  it('fica dentro do intervalo documentado (-8 a +8, escalado por 0.9)', () => {
    for (let id = 0; id < 50; id++) {
      const n = individualNoise(id, 0);
      expect(n).toBeGreaterThanOrEqual(-8 * 0.9 - 1);
      expect(n).toBeLessThanOrEqual(8 * 0.9 + 1);
    }
  });
});

describe('clampSeed vs clampScore', () => {
  it('clampSeed nunca deixa a ESTIMATIVA de partido parecer 0 ou 100 absoluto', () => {
    expect(clampSeed(-50)).toBe(5);
    expect(clampSeed(500)).toBe(98);
  });

  it('clampScore permite 0/100 de verdade quando há dado real (voto/despesa)', () => {
    expect(clampScore(-50)).toBe(0);
    expect(clampScore(500)).toBe(100);
  });
});

describe('overallScore', () => {
  it('aplica os pesos publicados na Metodologia (30/25/20/15/10)', () => {
    const scores: Record<CriteriaKey, number> = {
      LIFE_PROTECTION: 100, FAMILY_VALUES: 0, MORAL_INTEGRITY: 0,
      SOCIAL_RESPONSIBILITY: 0, RELIGIOUS_FREEDOM: 0,
    };
    expect(overallScore(scores)).toBe(30); // só o peso de vida (30%) conta
  });

  it('soma ponderada de todos os critérios', () => {
    const scores: Record<CriteriaKey, number> = {
      LIFE_PROTECTION: 88, FAMILY_VALUES: 88, MORAL_INTEGRITY: 52,
      SOCIAL_RESPONSIBILITY: 38, RELIGIOUS_FREEDOM: 88,
    };
    // 88*.30 + 88*.25 + 52*.20 + 38*.15 + 88*.10 = 26.4+22+10.4+5.7+8.8 = 73.3
    expect(overallScore(scores)).toBe(73);
  });
});

describe('performanceLabel', () => {
  it.each([
    [85, 'EXCELLENT'], [80, 'EXCELLENT'],
    [79, 'GOOD'], [65, 'GOOD'],
    [64, 'AVERAGE'], [45, 'AVERAGE'],
    [44, 'POOR'], [0, 'POOR'],
  ])('score %i vira nível %s', (score, level) => {
    expect(performanceLabel(score).level).toBe(level);
  });
});

describe('regressão: idempotência do modelo híbrido (achado real 2026-09-08, #1)', () => {
  // Reproduz a lógica de recalculate-scores.ts pra provar a propriedade
  // que estava quebrada: rodar o cálculo N vezes com o MESMO voto real
  // tem que dar sempre o MESMO resultado. Antes da correção, a base
  // vinha do valor já gravado (existing?.campo) em vez do seed fixo do
  // partido — cada execução somava o delta de voto de novo por cima do
  // que já tinha o delta somado, e a nota só crescia/caía até saturar em
  // 0 ou 100. Essa função simula o "hasVotes ? seed+delta : seed" que
  // existe hoje no motor real (delta já pronto, seja média ou soma —
  // este teste é sobre a base ser fixa, não sobre o achado #2 abaixo).
  function hybridScore(politicianId: number, party: string, criteriaIndex: number, voteDelta: number) {
    const base = partyBase(party);
    const seed = clampSeed(base[criteriaIndex] + individualNoise(politicianId, criteriaIndex));
    return clampScore(seed + voteDelta);
  }

  it('rodar o cálculo várias vezes com o mesmo voto dá sempre o mesmo resultado', () => {
    const politicianId = 677; // Flávio Bolsonaro, mesmo caso real da correção
    const party = 'PL';
    const criteriaIndex = 1; // FAMILY_VALUES
    const voteDelta = -20;

    const run1 = hybridScore(politicianId, party, criteriaIndex, voteDelta);
    const run2 = hybridScore(politicianId, party, criteriaIndex, voteDelta);
    const run3 = hybridScore(politicianId, party, criteriaIndex, voteDelta);

    expect(run1).toBe(run2);
    expect(run2).toBe(run3);
  });

  it('sem voto (delta=0), o resultado é sempre o seed fixo do partido — nunca deriva', () => {
    const results = Array.from({ length: 5 }, () => hybridScore(677, 'PL', 1, 0));
    expect(new Set(results).size).toBe(1);
  });
});

describe('regressão: média em vez de soma (achado real 2026-09-08, #2)', () => {
  // Caso real medido em produção: Acácio Favacho (MDB), 16 votos em
  // Família com applied_score de ±15 cada, somando +150. SOMAR não tem
  // limite — qualquer deputado com volume de voto suficiente satura em
  // 100 garantido, mesmo com a base fixa do achado #1 já corrigida.
  // MÉDIA resolve: reflete tendência (alinhado/contrário/misto), não
  // volume de quantas vezes o tema apareceu em pauta.
  function average(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  it('16 votos de +15 cada NÃO deveriam somar +150 — a média é só +15', () => {
    const votes = Array(16).fill(15);
    const sum = votes.reduce((a, b) => a + b, 0);
    expect(sum).toBe(240); // a soma sem limite do bug antigo
    expect(average(votes)).toBe(15); // o valor real e estável, pós-correção
  });

  it('caso real: Acácio Favacho, votos mistos em Família (+150 de soma, 16 votos)', () => {
    const votes = [15, 15, -15, 15, 15, 15, 15, 15, 15, 15, -15, 15, -15, 15, 15, 15];
    expect(votes.reduce((a, b) => a + b, 0)).toBe(150);
    // Base MDB pra família = 58 (± ruído). +150 satura em 100 sempre;
    // a média (~9.4) mantém a nota dentro de faixa plausível.
    expect(average(votes)).toBeCloseTo(9.375, 3);
    // ID genérico só pra ter algum ruído individual determinístico — não
    // é o ID real do Acácio Favacho, o ponto do teste é a fórmula, não
    // reproduzir o valor exato dele.
    const base = partyBase('MDB');
    const seed = clampSeed(base[1] + individualNoise(1001, 1)); // FAMILY_VALUES index=1
    const withSum = clampScore(seed + 150);
    const withAverage = clampScore(seed + average(votes));
    expect(withSum).toBe(100); // o que o bug produzia — sempre saturado
    expect(withAverage).toBeLessThan(100); // o que a correção produz
  });

  it('poucos votos (1-2) não mudam de comportamento — média = soma quando N pequeno', () => {
    expect(average([10])).toBe(10);
    expect(average([10, -10])).toBe(0);
  });
});

// ============================================================
// Regressão: média por ASSUNTO, não por linha de voto
// (achado real 2026-09-25, correção de 2026-09-25)
// ============================================================
//
// key_agendas guarda 83 linhas para 33 assuntos distintos: a mesma
// proposição é gravada de novo a cada sessão de votação (o PL 2159/2021
// aparece 9x). Média por LINHA de voto pesa um assunto 9x contra outro —
// a média media "quantas vezes o projeto foi colocado em votação", não
// "em que o parlamentar votou". Medido em produção: desvio médio 1,64
// ponto entre os dois métodos, chegando a 5,86 no pior caso, e o pior
// caso é o parlamentar que mais votou.
//
// A correção: colapsar as sessões da mesma proposição pelo título da
// pauta, e cada assunto entra UMA vez na média, com a média dos seus votos.
interface VotoComPauta {
  applied_score: number;
  key_agenda: { criteria: string; title: string | null; source_id: string | null };
}

/** Reproduz o agrupamento de recalculate-scores.ts. */
function mediasPorAssunto(votes: VotoComPauta[]): number[] {
  const porAssunto = new Map<string, { soma: number; n: number }>();
  for (const v of votes) {
    const titulo = v.key_agenda.title ?? v.key_agenda.source_id ?? 'SEM_TITULO';
    const chave = `${v.key_agenda.criteria}|${titulo}`;
    const atual = porAssunto.get(chave);
    if (atual) {
      atual.soma += v.applied_score;
      atual.n += 1;
    } else {
      porAssunto.set(chave, { soma: v.applied_score, n: 1 });
    }
  }
  return [...porAssunto.values()].map((a) => a.soma / a.n);
}

/** O que o motor fazia antes: média crua de todas as linhas. */
function mediaPorLinha(votes: VotoComPauta[]): number {
  return votes.reduce((a, b) => a + b.applied_score, 0) / votes.length;
}

const pauta = (titulo: string, score: number, criteria = 'FAMILY_VALUES') => ({
  applied_score: score,
  key_agenda: { criteria, title: titulo, source_id: `src-${titulo}` },
});

describe('regressão: média por assunto, não por linha de voto (2026-09-25)', () => {
  it('um assunto com 9 sessões pesa como 1 assunto, não como 9', () => {
    const titulo = 'PL 2159/2021 — licenciamento ambiental';
    // 9 sessões do MESMO projeto, todas favoráveis (+10)
    const votes = Array.from({ length: 9 }, () => pauta(titulo, 10));
    // ...mais um assunto distinto, contrário (-10)
    votes.push(pauta('PL 999/2024 — outro assunto', -10));

    // Média por linha: 9 favoráveis puxam o contrário para perto do topo
    const porLinha = mediaPorLinha(votes);
    expect(porLinha).toBeCloseTo(8, 10); // (9*10 - 10)/10

    // Média por assunto: 2 assuntos, +10 e -10 → 0. O Contrary pesa igual.
    const porAssunto = mediasPorAssunto(votes);
    expect(porAssunto).toHaveLength(2);
    expect(porAssunto.sort((a, b) => b - a)).toEqual([10, -10]);
  });

  it('os dois métodos coincidem quando cada assunto teve UMA sessão só', () => {
    // Sem duplicidade de pauta, não há o que colapsar — a correção não
    // pode mudar o resultado de quem não é afetado pelo problema.
    const votes = [pauta('A', 10), pauta('B', -10), pauta('C', 15)];
    const media = mediasPorAssunto(votes).reduce((a, b) => a + b, 0) / 3;
    expect(media).toBeCloseTo(mediaPorLinha(votes), 10);
  });

  it('votos mistos no mesmo assunto viram a média interna dele', () => {
    const titulo = 'PL 2630/2020 — Marco Civil';
    const votes = [pauta(titulo, 15), pauta(titulo, -15), pauta(titulo, 15)];
    const porAssunto = mediasPorAssunto(votes);
    expect(porAssunto).toHaveLength(1);
    expect(porAssunto[0]).toBeCloseTo(5, 10); // (+15-15+15)/3
  });

  it('a ordem dos votos não altera o resultado', () => {
    const a = [pauta('A', 10), pauta('A', 10), pauta('B', -10)];
    const b = [pauta('B', -10), pauta('A', 10), pauta('A', 10)];
    expect(mediasPorAssunto(a).sort()).toEqual(mediasPorAssunto(b).sort());
  });

  it('pauta sem título cai no source_id em vez de colapsar todas', () => {
    // Sem título, usar a string vazia fundiria assuntos diferentes num só
    // — daí o fallback para source_id, que é único por sessão.
    const votes = [
      { applied_score: 10, key_agenda: { criteria: 'FAMILY_VALUES', title: null, source_id: 's1' } },
      { applied_score: -10, key_agenda: { criteria: 'FAMILY_VALUES', title: null, source_id: 's2' } },
    ];
    expect(mediasPorAssunto(votes)).toHaveLength(2);
  });

  it('critérios diferentes nunca se fundem, mesmo com o mesmo título', () => {
    // Uma proposição pode, em tese, virar pauta em dois critérios; o
    // agrupamento inclui o critério na chave justamente para isso.
    const votes = [pauta('Mesmo título', 10, 'FAMILY_VALUES'), pauta('Mesmo título', -10, 'MORAL_INTEGRITY')];
    expect(mediasPorAssunto(votes)).toHaveLength(2);
  });
});
