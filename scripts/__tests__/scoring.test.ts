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
  shrinkSeed,
  SEED_SHRINK,
  SCORE_FORMULA_VERSION,
  VOTE_WEIGHT_MULT,
  voteConfidence,
  consistencyBonus,
  CONFIDENCE_HALF_AT,
  CONSISTENCY_MAX_POINTS,
  type CriteriaKey,
} from '../lib/scoring';
import { matchScanRule } from '../lib/scan-rules';

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
  // Cortes RECALIBRADOS em 2026-09-26 com a fórmula 1.2.0: 65 / 60 / 55.
  // Antes eram 80 / 65 / 45, medidos para uma escala que ia de 30 a 88. Com o
  // seed do partido encolhido para 20%, a amplitude real virou 50–68 e as
  // faixas antigas deixaram "muito alta" e "baixa" vazias.
  it.each([
    [68, 'EXCELLENT'], [65, 'EXCELLENT'],
    [64, 'GOOD'], [60, 'GOOD'],
    [59, 'AVERAGE'], [55, 'AVERAGE'],
    [54, 'POOR'], [50, 'POOR'],
  ])('score %i vira nível %s', (score, level) => {
    expect(performanceLabel(score).level).toBe(level);
  });

  // Fronteiras: o corte é inclusivo. É aqui que bug de off-by-one mora.
  it.each([
    [65, 'EXCELLENT'], [64.99, 'GOOD'],
    [60, 'GOOD'], [59.99, 'AVERAGE'],
    [55, 'AVERAGE'], [54.99, 'POOR'],
  ])('fronteira em %i', (score, level) => {
    expect(performanceLabel(score).level).toBe(level);
  });

  it('nota acima do máximo real continua caindo no topo, sem estourar', () => {
    expect(performanceLabel(100).level).toBe('EXCELLENT');
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

// ============================================================
// M0 — versionamento da fórmula + as duas alavancas do M1c
// (2026-09-25)
// ============================================================
//
// A fórmula de score não tinha versão: `PARTY_ALIGNMENT`, os pesos e o peso
// do delta podiam mudar sem deixar rastro, e o diff do SyncLog dizia
// quantas notas mudaram sem dizer com que fórmula. M1c–M5 mudam a fórmula,
// então a versão vem antes delas.
describe('M0 — SCORE_FORMULA_VERSION', () => {
  it('existe e está em formato de versão', () => {
    expect(SCORE_FORMULA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('as constantes default são a identidade — M0 não muda behavior', () => {
    // M0 só cria as âncoras. Se o default já mudasse a nota, o recálculo
    // do dia 25 moveria o ranking sem ninguém ter pedido.
    // Obsoleto desde M1c (2026-09-26): o default NÃO é mais a identidade.
    // O teste de verdade agora é o de regressão abaixo, que fixa o par
    // medido. Este fica só como registro de que M0 foi inerte.
    expect(1).toBe(1);
  });

  // ── M1c/M2/M3: o par medido, fixado em teste ────────────────────────────
  it('o par de constantes em produção é o que foi medido, não um chute', () => {
    // Estes valores vieram de medir a variância partidária nos 504
    // parlamentares com voto real (ver PLANO-PESO-INDIVIDUAL.md). Fixar
    // em teste é o que impede alguém de "ajustar para 0,5 porque parece
    // mais justo" sem medir o efeito.
    expect(VOTE_WEIGHT_MULT).toBe(3.0);
    expect(SEED_SHRINK).toBe(0.2);
  });

  it('o voto pesa mais que o partido, e a ordem dos partidos sobrevive', () => {
    // O ponto do M1c: SEED_SHRINK < 1 encolhe a herança partidária sem
    // apagar a ordem entre partidos.
    expect(SEED_SHRINK).toBeLessThan(1);
    expect(SEED_SHRINK).toBeGreaterThan(0);
    const alto = shrinkSeed(85);
    const baixo = shrinkSeed(25);
    expect(alto).toBeGreaterThan(baixo);
    // E o encolhimento realmente puxa para a média global.
    expect(alto).toBeLessThan(85);
    expect(baixo).toBeGreaterThan(25);
  });
});

describe('shrinkSeed', () => {
  it('com shrink=1 é a identidade (comportamento de hoje)', () => {
    for (const v of [12, 30, 55, 70, 88]) {
      expect(shrinkSeed(v, 1)).toBe(v);
    }
  });

  it('com shrink=0 colapsa todo mundo na média global', () => {
    for (const v of [12, 30, 55, 70, 88]) {
      expect(shrinkSeed(v, 0)).toBe(55);
    }
  });

  it('encolhe em direção à média, PRESERVANDO a ordem dos partidos', () => {
    // Isso é o que importa: o seed encolhido não pode inverter quem está
    // acima de quem, senão o ranking de partido fica sem sentido.
    const partidos = [18, 32, 45, 58, 65, 78, 88];
    for (const shrink of [0.5, 0.3]) {
      const encolhidos = partidos.map(p => shrinkSeed(p, shrink));
      for (let i = 1; i < partidos.length; i++) {
        expect(encolhidos[i]).toBeGreaterThan(encolhidos[i - 1]);
      }
    }
  });

  it('o encolhimento é monotônico: quem era maior nunca fica menor', () => {
    expect(shrinkSeed(88, 0.5)).toBeGreaterThan(shrinkSeed(18, 0.5));
  });

  it('o default usa SEED_SHRINK', () => {
    expect(shrinkSeed(88)).toBe(shrinkSeed(88, SEED_SHRINK));
  });
});

// ---------------------------------------------------------------------------
// M4 (2026-09-25): a decomposição que a tela mostra tem que fechar com a nota.
// ---------------------------------------------------------------------------
describe('decomposição da nota (M4)', () => {
  // Um caso real do banco (político 47, Integridade Moral): seed 50,
  // suspeita 11,8 → o painel mostra 50 − 11,8 e a nota 38.
  it('os componentes reproduzem a nota, dentro do arredondamento do motor', () => {
    const seed = 50, vote = 0, penalty = 11.8;
    const score = clampScore(seed + vote - penalty);
    expect(score).toBe(38);
    // A diferença entre a soma das partes e a nota é o Math.round do
    // clampScore — por isso o painel diz que a soma é arredondada, em vez
    // de fingir que fecha em centésimos.
    expect(Math.abs((seed + vote - penalty) - score)).toBeLessThanOrEqual(0.5);
  });

  it('o arredondamento nunca empurra a nota para fora de 0–100', () => {
    expect(clampScore(100 + 40)).toBe(100);
    expect(clampScore(-0.4)).toBe(0);
    expect(clampScore(99.5)).toBe(100);
  });

  // M0 + M4 juntos: a versão da fórmula vai para a nota E para a decomposição.
  // Se as duas divergirem, a tela mostra componentes de uma fórmula e uma
  // nota de outra — que é o modo de falha que o M0 existe para impedir.
  it('a decomposição carrega a mesma versão da fórmula que a nota', () => {
    expect(SCORE_FORMULA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});


// ---------------------------------------------------------------------------
// M2 — confiança por base de assuntos
// ---------------------------------------------------------------------------
describe('voteConfidence (M2)', () => {
  it('zero assuntos é zero confiança — e nunca é negativo', () => {
    expect(voteConfidence(0)).toBe(0);
    expect(voteConfidence(-3)).toBe(0);
  });

  it('monótona: mais assunto, mais confiança', () => {
    for (let n = 0; n < 40; n++) {
      expect(voteConfidence(n + 1)).toBeGreaterThanOrEqual(voteConfidence(n));
    }
  });

  it('nunca chega a 1 (base finita nunca vira certeza absoluta)', () => {
    for (const n of [1, 4, 10, 100, 10_000]) {
      expect(voteConfidence(n)).toBeLessThan(1);
    }
  });

  it('metade do peso no número declarado de assuntos', () => {
    // K = 4 → 4 assuntos dão exatamente 50%. O número é legível de
    // propósito: é o que a página de metodologia explica ao usuário.
    expect(voteConfidence(CONFIDENCE_HALF_AT)).toBeCloseTo(0.5, 10);
  });

  it('um assunto só não vira nota sozinho', () => {
    expect(voteConfidence(1)).toBeCloseTo(0.2, 10);
  });
});

// ---------------------------------------------------------------------------
// M3 — coerência entre assuntos
// ---------------------------------------------------------------------------
describe('consistencyBonus (M3)', () => {
  it('sem voto pontuado, não move nota', () => {
    expect(consistencyBonus(0, 0)).toBe(0);
    expect(consistencyBonus(5, 0)).toBe(0);
  });

  it('100% coerente dá o bônus cheio, 0% dá o bônus cheio invertido', () => {
    expect(consistencyBonus(20, 20)).toBeCloseTo(CONSISTENCY_MAX_POINTS, 10);
    expect(consistencyBonus(0, 20)).toBeCloseTo(-CONSISTENCY_MAX_POINTS, 10);
  });

  it('metade coerente não dá nem bônus nem penalidade', () => {
    expect(consistencyBonus(10, 20)).toBeCloseTo(0, 10);
  });

  it('um voto só não move a nota de forma relevante (base de evidência)', () => {
    // Uma votação NÃO dá zero — a curva é contínua de propósito. O que
    // não pode é dar um bônus de verdade: 1 voto = 10% da evidência, e o
    // melhor caso (voto alinhadíssimo) rende +0,3 de 100. Ruído, não sinal.
    const umVoto = consistencyBonus(1, 1);
    expect(umVoto).toBeGreaterThan(0);
    expect(umVoto).toBeLessThan(CONSISTENCY_MAX_POINTS * 0.15);
  });

  it('o bônus é modesto: nunca passa de ±3 pontos', () => {
    for (const [a, s] of [[0, 5], [3, 5], [50, 100], [100, 100], [1, 3]]) {
      expect(Math.abs(consistencyBonus(a, s))).toBeLessThanOrEqual(CONSISTENCY_MAX_POINTS);
    }
  });

  it('a base de evidência cresce até 10 votos e satura', () => {
    // 5 votos = metade do bônus; 10+ = bônus inteiro.
    const cinco = consistencyBonus(5, 5) / CONSISTENCY_MAX_POINTS;
    const dez = consistencyBonus(10, 10) / CONSISTENCY_MAX_POINTS;
    expect(cinco).toBeCloseTo(0.5, 10);
    expect(dez).toBeCloseTo(1, 10);
  });
});

// ---------------------------------------------------------------------------
// Faixas de aderência recalibradas (2026-09-26)
// ---------------------------------------------------------------------------
describe('performanceLabel — faixas alcançáveis', () => {
  // Com os cortes antigos (80/65/45) e a fórmula 1.2.0, "muito alta" e
  // "baixa" viraram faixas mortas: 0 pessoas em cada. Este teste existe para
  // que a próxima mudança de fórmula não repita isso em silêncio.
  const N = 12; // nº de parcelas: 5 critérios + bônus de coerência
  it('a escala da nota cabe dentro das quatro faixas', () => {
    // A amplitude real medida em produção com a 1.2.0 foi 50–68. Qualquer
    // faixa precisa ser alcançável dentro dela.
    for (const score of [50, 55, 60, 65, 68]) {
      expect({ score, nivel: performanceLabel(score).level }).toMatchObject({
        nivel: expect.any(String),
      });
    }
  });

  it('os quatro níveis são distinguíveis dentro da faixa real', () => {
    const real = [50, 56, 61, 66];
    const niveis = real.map((s) => performanceLabel(s).level);
    // Esperado de baixo para cima: POOR, AVERAGE, GOOD, EXCELLENT
    expect(niveis).toEqual(['POOR', 'AVERAGE', 'GOOD', 'EXCELLENT']);
  });

  it('a nota máxima possível ainda pode chegar ao topo', () => {
    // Sanidade: a faixa superior não pode estar acima do que a fórmula
    // consegue produzir, senão "muito alta" éfiction.
    const maxSeed = 55 + (98 - 55) * SEED_SHRINK + 8; // seed encolhido + ruído
    const maxComBonus = maxSeed + CONSISTENCY_MAX_POINTS;
    expect(performanceLabel(maxComBonus).level).toBe('EXCELLENT');
  });

  it('os rótulos continuam neutros — nada de julgamento moral sobre a pessoa', () => {
    // Achado de 2026-09-14: a API expunha labels como "Guardião da Fé" e
    // "Precisa Crescer", que viravam print de ataque pessoal. Não volta.
    const rotulosProibidos = /guardi[ãa]o|precisa crescer|her[óo]i|p[ãa]o fiel|pecador/i;
    for (const score of [0, 40, 55, 60, 65, 100]) {
      const { label, description } = performanceLabel(score);
      expect(rotulosProibidos.test(label)).toBe(false);
      expect(rotulosProibidos.test(description)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Classificação de pauta por palavra inteira (P0, 2026-09-26)
// ---------------------------------------------------------------------------
//
// ACHADO QUE MOTIVOU ESTE BLOCO: `matchScanRule` casava por SUBSTRING, e a
// keyword `sus` (sistema de saúde) é substring de `sustentavel`. O PL
// 2159/2021, que é sobre LICENCIAMENTO AMBIENTAL, foi classificado como
// "Responsabilidade Social" e virou a maior pauta do sistema (2.872 votos).
// 67,4% de todos os votos do banco entraram por essa regra.
//
// O teste abaixo falha no código de hoje. É esse o ponto: ele tem que estar
// vermelho antes da correção, para não ser decoração depois dela.
describe('matchScanRule — fronteira de palavra (P0)', () => {
  const casar = (t: string) => matchScanRule(t);

  it('NÃO classifica "sustentável" como saúde', () => {
    // Este é o caso real do PL 2159/2021.
    const texto = 'Dispõe sobre o licenciamento ambiental e o desenvolvimento sustentável do país';
    expect({ texto, criterio: casar(texto)?.criteria ?? null })
      .toMatchObject({ criterio: null });
  });

  it.each([
    ['consumo de energia', 'consumo'],
    ['construção civil', 'construcao'],
    ['resultados do programa', 'resultado'],
    ['suspeita de irregularidade', 'suspeita'],
    ['suspensão do contrato', 'suspensao'],
  ])('NÃO casa "%s" (contém "sus" dentro de "%s")', (texto) => {
    const r = casar(texto);
    // Pode casar outro critério legítimo, mas nunca SOCIAL por causa de "sus".
    expect({ texto, viaSus: r?.keywords?.includes('sus') ?? false })
      .toMatchObject({ viaSus: false });
  });

  it('AINDA casa quando a palavra é a mesma', () => {
    // A correção tem que manter o acerto, não desligar a regra.
    const r = casar('Reforma do Sistema Único de Saúde e a saúde pública no Brasil');
    expect({ criterio: r?.criteria }).toMatchObject({ criterio: 'SOCIAL_RESPONSIBILITY' });
  });

  it('keyword composta continua casando inteira', () => {
    // Sem "família"/"criança" no texto: Valores Familiares vem ANTES de
    // Responsabilidade Social na ordem das regras, e casaria primeiro. Isso
    // é comportamento correto, não bug — o fixture é que estava sujo.
    const r = casar('Expande o programa de assistência social e o benefício social em territórios vulneráveis');
    expect({ criterio: r?.criteria }).toMatchObject({ criterio: 'SOCIAL_RESPONSIBILITY' });
  });
});

/**
 * O número que decide se o site pode voltar a publicar nota: quantos dos
 * 26.860 votos do banco ainda caem no MESMO critério depois da correção.
 *
 * Este teste é propositalmente verbose sobre um dado pequeno e fixo (a
 * lista real de pautas com mais votos, medida em 2026-09-26). Ele não
 * substitui uma reclassificação completa — substitui a surpresa. Se alguém
 * mexer nas SCAN_RULES e quebrar a classificação, o CI falha na hora em vez
 * de a nota mudar sozinha em produção três dias depois.
 */
describe('sobrevivência das pautas à correção (medição 2026-09-26)', () => {
  // [critério atual no banco, título real, o que a keyword `sus` pegou]
  const CASOS = [
    ['SOCIAL_RESPONSIBILITY', 'PL 2159/2021 — Dispõe sobre o licenciamento ambiental e o desenvolvimento sustentável', 'sus dentro de "sustentavel"'],
    ['SOCIAL_RESPONSIBILITY', 'PL 327/2021 — Dispõe sobre a Política Nacional da Transição Energética', 'sus dentro de "sustentavel"'],
    ['SOCIAL_RESPONSIBILITY', 'PL 3899/2012 — Institui a Política Nacional de Estímulo à Produção', 'sus dentro de "consumo"'],
    ['SOCIAL_RESPONSIBILITY', 'PL 420/2025 — Institui o Programa Nacional de Infraestruturas Sustentáveis', 'sus dentro de "sustentaveis"'],
    ['FAMILY_VALUES', 'PL 5122/2023 — Dispõe sobre a liquidação, anistia, renegociação e rebate de dívidas', 'familia (família do devedor)'],
    ['FAMILY_VALUES', 'MPV 1268/2024 — Abre crédito extraordinário em favor dos Ministérios', 'familia (família de servidores)'],
  ] as const;

  it.each(CASOS)(
    '"%s" NÃO sobrevive no MESMO critério depois da correção',
    (criterioNoBanco, titulo, motivo) => {
      const r = matchScanRule(titulo);
      // A propriedade honesta é "saiu do balde errado", não "virou null".
      //
      // "PL 5122/2023 — liquidação, anistia e rebate de dívidas" tem a
      // palavra `anistia` INTEIRA no título, então a fronteira de palavra
      // não a impede: ela sai de Valores Familiares e cai em Integridade
      // Moral, por `anistia`. Errado por SENTIDO, não por substring — é o
      // item 7.2 da auditoria (P0, ainda aberto). Aqui a garantia é só que
      // ela não fica parada no balde errado.
      expect(
        { titulo, criterioNoBanco, criterioAgora: r?.criteria ?? null, saiu: (r?.criteria ?? null) !== criterioNoBanco, motivo },
        'continua no mesmo critério errado depois da correção',
      ).toMatchObject({ saiu: true });
    },
  );

  it('ninguma das pautas com a keyword `sus` deveria continuar em SOCIAL', () => {
    // Trava de regressão: se alguém reintroduzir substring, este falha.
    const texto = 'Programa Nacional de Infraestruturas Sustentáveis e Consumo de Energia';
    expect({ criterio: matchScanRule(texto)?.criteria ?? null })
      .toMatchObject({ criterio: null });
  });
});

/**
 * Falso positivo de SENTIDO (2026-09-26, `SCAN_RULES` 1.2.0).
 *
 * A fronteira de palavra (1.1.0) resolveu o falso positivo de SUBSTRING,
 * mas não o de SENTIDO: `anistia` e `prescricao` são palavras inteiras
 * legítimas fora de integridade moral. Estas listas são o contexto medido
 * no acervo real — não é palavra que "parece"、湿 arbitrária.
 */
describe('exclusões de contexto (P0, sentido)', () => {
  it('anistia de DÍVIDA não é Integridade Moral', () => {
    // Caso real: PL 5122/2023, 1.632 votos, entrava aqui.
    const texto = 'Dispõe sobre a liquidação, anistia, renegociação e rebate de dívidas';
    const r = matchScanRule(texto);
    expect({ criterio: r?.criteria ?? null }).toMatchObject({ criterio: null });
  });

  it('prescrição em CONTRATO DE SEGURO não é Integridade Moral', () => {
    // Caso real: PL 2597/2024, 359 votos, casava `prescricao`.
    const texto = 'Estabelece normas gerais em contratos de seguro privado e.processos de prescrição';
    const r = matchScanRule(texto);
    expect({ criterio: r?.criteria ?? null }).toMatchObject({ criterio: null });
  });

  it('anistia de CRIME POLÍTICO continua entrando', () => {
    // A exclusão não pode virar um "não classifica nunca". O sinal que
    // queremos é anistia de repressão, e ela tem que continuar entrando.
    const texto = 'Concede anistia a presos políticos dà ditadura militar';
    const r = matchScanRule(texto);
    expect({ criterio: r?.criteria, sinal: r?.simIsPositive })
      .toMatchObject({ criterio: 'MORAL_INTEGRITY' });
  });

  it('corrupção e improbidade seguem entrando, sem exclusão', () => {
    for (const texto of [
      'requer investigação de corrupção na conduta do agente público',
      'medidas de combate à improbidade administrativa',
    ]) {
      expect({ texto, criterio: matchScanRule(texto)?.criteria })
        .toMatchObject({ criterio: 'MORAL_INTEGRITY' });
    }
  });

  it('a exclusão não afeta os outros critérios', () => {
    // Se a exclusão fosse global, "liquidação de dívidas" pararia de ser
    // classificável por qualquer regra. Ela é DA REGRA, não do texto.
    const texto = 'Dispõe sobre a liquidação, anistia, renegociação e rebate de dívidas, e streamline a assistência social';
    const r = matchScanRule(texto);
    expect({ criterio: r?.criteria }).toMatchObject({ criterio: 'SOCIAL_RESPONSIBILITY' });
  });
});
