/**
 * scoring.ts
 * Fonte única do "seed" de partido — antes duplicado em seed-party-scores.ts
 * e recalculate-scores.ts (e, temporariamente, em fix-never-seeded-scores.ts,
 * 2026-09-08), cada cópia divergindo um pouco de propósito nenhum.
 *
 * Extraído em 2026-09-08 junto da correção do bug de saturação
 * (recalculate-scores.ts somava o delta de voto cumulativo de novo a cada
 * execução diária, em cima do valor já ajustado, em vez de partir do seed
 * fixo do partido — 98% dos deputados com voto ficaram travados em 0/100
 * em Família, 100% em Responsabilidade Social). A causa raiz era usar
 * `existing?.campo` (valor móvel, já mutado por execuções anteriores) como
 * base em vez de recalcular o seed do partido (valor fixo) a cada vez.
 * Consolidar aqui é o que torna essa distinção óbvia — só existe UM lugar
 * que sabe calcular "o seed do partido", e ele nunca lê de volta o que já
 * foi gravado no banco.
 */

// Histórico real de alinhamento por partido com critérios evangélicos.
// Escala 0-100 por critério (vida, família, moral, social, religião).
// Fontes: DIAP, Frente Parlamentar Evangélica, análises do JRN/Estadão e
// histórico de votações na 56ª e 57ª legislaturas.
export const PARTY_ALIGNMENT: Record<string, [number, number, number, number, number]> = {
  PL: [88, 88, 52, 38, 88],
  PP: [82, 82, 60, 52, 80],
  REPUBLICANOS: [82, 82, 70, 58, 88],
  UNIÃO: [78, 78, 64, 58, 78],
  PSD: [65, 65, 62, 62, 65],
  MDB: [58, 58, 65, 65, 60],
  SOLIDARIEDADE: [72, 72, 60, 62, 72],
  AVANTE: [65, 65, 60, 62, 65],
  PRD: [75, 75, 62, 52, 72],
  PODE: [75, 75, 65, 60, 72],
  NOVO: [70, 65, 78, 42, 65],
  PATRIOTA: [78, 78, 60, 52, 75],
  PSC: [85, 85, 58, 48, 88],
  DC: [88, 88, 62, 50, 90],
  PTB: [65, 65, 55, 55, 62],
  PROS: [65, 65, 60, 60, 65],
  PMN: [60, 60, 60, 62, 60],
  PSDB: [58, 58, 68, 60, 58],
  PTC: [65, 65, 62, 55, 65],
  PMB: [70, 70, 60, 55, 70],
  PRTB: [75, 75, 60, 50, 72],
  PRP: [70, 70, 60, 52, 68],
  PHS: [68, 68, 62, 55, 68],
  PEN: [72, 72, 60, 52, 70],
  SD: [72, 72, 60, 62, 72],
  DEM: [65, 65, 68, 58, 62],
  PR: [68, 68, 60, 58, 65],
  PPL: [62, 62, 60, 62, 60],
  PDT: [30, 30, 62, 80, 30],
  PT: [18, 18, 55, 90, 18],
  PSOL: [12, 12, 55, 88, 12],
  PSB: [32, 32, 60, 82, 32],
  REDE: [22, 22, 65, 82, 22],
  PCdoB: [14, 14, 50, 90, 14],
  PV: [25, 25, 62, 80, 25],
  CIDADANIA: [45, 45, 65, 68, 45],
  AGIR: [78, 78, 62, 52, 80],
};

// Base neutra pra partido sem entrada na tabela acima (raro — legenda nova
// ou erro de grafia na fonte oficial). Mesmo valor nos dois scripts desde
// sempre, só nunca tinha nome.
export const UNKNOWN_PARTY_BASE: [number, number, number, number, number] = [55, 55, 65, 60, 55];

export const CRITERIA_KEYS = [
  'LIFE_PROTECTION',
  'FAMILY_VALUES',
  'MORAL_INTEGRITY',
  'SOCIAL_RESPONSIBILITY',
  'RELIGIOUS_FREEDOM',
] as const;

export type CriteriaKey = (typeof CRITERIA_KEYS)[number];

// Pesos publicados na Metodologia (30/25/20/15/10) — mesma ordem de
// CRITERIA_KEYS/PARTY_ALIGNMENT (vida, família, moral, social, religião).
export const WEIGHTS: Record<CriteriaKey, number> = {
  LIFE_PROTECTION: 0.30,
  FAMILY_VALUES: 0.25,
  MORAL_INTEGRITY: 0.20,
  SOCIAL_RESPONSIBILITY: 0.15,
  RELIGIOUS_FREEDOM: 0.10,
};

/**
 * Versão da fórmula de score (M0, 2026-09-25).
 *
 * `SCAN_RULES_VERSION` ancora a classificação de pautas e
 * `EXPENSE_RULES_VERSION` a detecção de gasto, mas a FÓRMULA que junta tudo
 * não tinha versão nenhuma: `PARTY_ALIGNMENT`, os pesos e o peso do delta de
 * voto podiam mudar sem deixar rastro, e o diff do `SyncLog` dizia quantas
 * notas mudaram sem dizer com que fórmula cada nota foi calculada.
 *
 * Sobe a cada mudança real de fórmula. A sequência planned:
 *   1.0.0 — seed cheio + delta ×1 (o estado medido: 91,8% da variância é
 *            partido)
 *   2.0.0 — M1c: delta ×3 + seed encolhido a 50% do desvio da média
 *
 * Onde o peso do voto individual mora: `VOTE_WEIGHT_MULT` e
 * `SEED_SHRINK` abaixo, com o alvo de_medido em `PLANO-PESO-INDIVIDUAL.md`.
 */
export const SCORE_FORMULA_VERSION = '1.0.0';

/** Multiplicador do sinal de voto antes de somar ao seed. */
export const VOTE_WEIGHT_MULT = 1.0;

/**
 * Quanto o seed do partido conserva da sua amplitude original.
 * 1.0 = seed intacto (só o voto pesa mais); 0 = todo partido vira a média.
 * 0.5 = mantém metade do desvio, e a ORDEM dos partidos.
 */
export const SEED_SHRINK = 1.0;

/** Valor de Encolhimento em direção à média global, para SEED_SHRINK < 1. */
export const GLOBAL_MID = 55;

/**
 * Aplica o encolhimento do seed. Com SEED_SHRINK = 1 é a identidade —
 * uma função só, para que a fórmula não bifurque em caminhos distintos
 * conforme a constante.
 */
export function shrinkSeed(rawSeed: number, shrink: number = SEED_SHRINK): number {
  return GLOBAL_MID + (rawSeed - GLOBAL_MID) * shrink;
}

export function partyBase(party: string | null | undefined): [number, number, number, number, number] {
  const key = (party ?? '').toUpperCase().trim();
  return PARTY_ALIGNMENT[key] ?? UNKNOWN_PARTY_BASE;
}

export function isKnownParty(party: string | null | undefined): boolean {
  const key = (party ?? '').toUpperCase().trim();
  return PARTY_ALIGNMENT[key] !== undefined;
}

/**
 * Variação individual pseudoaleatória baseada no ID do político — garante
 * que dois políticos do mesmo partido nunca tenham o seed idêntico.
 * `criteriaIndex`: 0=vida, 1=família, 2=moral, 3=social, 4=religião
 * (mesma ordem de PARTY_ALIGNMENT); 5 é usado só por seed-party-scores.ts
 * pra variar a consistência estimada.
 */
export function individualNoise(politicianId: number, criteriaIndex: number): number {
  const seed = (politicianId * 31 + criteriaIndex * 17) % 100;
  // Ruído de -8 a +8, com distribuição central.
  return Math.round(((seed % 17) - 8) * 0.9);
}

/**
 * Clamp "de estimativa" (5–98) — usado só pro SEED do partido (antes de
 * qualquer ajuste por voto/despesa real). Nunca deixa a estimativa de
 * partido, por si só, parecer uma certeza absoluta (0 ou 100).
 */
export function clampSeed(value: number): number {
  return Math.max(5, Math.min(98, Math.round(value)));
}

/**
 * Clamp "de nota final" (0–100) — usado depois de aplicar delta de voto
 * real ou penalidade de despesa real sobre o seed. Aqui um extremo pode
 * ser genuinamente justificado por dado real, não é mais só estimativa.
 */
export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function overallScore(scores: Record<CriteriaKey, number>): number {
  return clampScore(
    CRITERIA_KEYS.reduce((acc, key) => acc + scores[key] * WEIGHTS[key], 0),
  );
}

export function performanceLabel(score: number): {
  level: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  label: string;
  description: string;
} {
  // Rótulos neutros de aderência (neutralizados em 2026-09-14 — a UI já
  // estava neutra, mas a API expunha labels morais tipo "Guardião da Fé" /
  // "Precisa Crescer" que virariam print de ataque pessoal. Neutro mede a
  // distância das votações aos critérios, nunca julga a pessoa).
  if (score >= 80) return {
    level: 'EXCELLENT',
    label: 'Aderência muito alta',
    description: 'Votações consistentemente alinhadas com os critérios cristãos declarados',
  };
  if (score >= 65) return {
    level: 'GOOD',
    label: 'Aderência alta',
    description: 'Bom alinhamento com os critérios evangélicos declarados',
  };
  if (score >= 45) return {
    level: 'AVERAGE',
    label: 'Aderência moderada',
    description: 'Alinhamento parcial — há votações mistas',
  };
  return {
    level: 'POOR',
    label: 'Aderência baixa',
    description: 'Votações frequentemente divergem dos critérios cristãos declarados',
  };
}
