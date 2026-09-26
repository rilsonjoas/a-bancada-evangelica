/**
 * SCAN_RULES — FONTE ÚNICA das regras de classificação de pautas.
 *
 * Achado real (2026-09-16): estas regras existiam DUPLICADAS em
 * scripts/sync-votes.ts (Câmara) e scripts/sync-votes-senado.ts (Senado).
 * O Senado ainda gravava as keywords erradas (o enum do critério, não as
 * palavras reais) — impossibilitando reclassificação futura. Ao inverter uma
 * keyword, um sync atualizava e o outro não; o histórico de classificação
 * ficava incoerente entre as casas.
 *
 * Agora quem define a regra é SÓ este arquivo. `RULES_VERSION` deve subir
 * a cada mudança real de regra — a versão é registrada nas pautas e serve
 * de âncora para reclassificar coerentemente num futuro resync.
 *
 * Referências:
 * - Critérios/pesos documentados em docs/REPRODUCIBILITY.md (seção 3)
 * - O texto "SCAN_RULES_VERSION" percorre os key_agendas como rules_version
 */

export type Criteria =
  | 'LIFE_PROTECTION'
  | 'FAMILY_VALUES'
  | 'MORAL_INTEGRITY'
  | 'SOCIAL_RESPONSIBILITY'
  | 'RELIGIOUS_FREEDOM';

export interface ScanRule {
  criteria: Criteria;
  keywords: string[];
  // Positivo se votar SIM = alinhamento evangélico
  simIsPositive: boolean;
  weight: number;   // pontuação aplicada (pode ser negativa se simIsPositive=false)
  priority: number;
}

/** Sobe a versão quando as regras mudarem de verdade.
 *  1.1.0 (2026-09-26): casamento por PALAVRA INTEIRA. Até 1.0.0 era substring, e
 *  `sus` casava dentro de `sustentavel` — 67,4% dos votos do banco entravam
 *  no critério errado. Ver docs/AUDITORIA-CLASSIFICACAO.md.
 */
export const SCAN_RULES_VERSION = '1.1.0';

export const SCAN_RULES: ScanRule[] = [
  // Proteção à vida
  { criteria: 'LIFE_PROTECTION', keywords: ['aborto', 'nascituro', 'eutanasia', 'interrupcao da gravidez'], simIsPositive: false, weight: 20, priority: 5 },
  { criteria: 'LIFE_PROTECTION', keywords: ['protecao da vida', 'direito a vida', 'crime contra a vida', 'homicidio'], simIsPositive: true, weight: 15, priority: 4 },
  // Família
  { criteria: 'FAMILY_VALUES', keywords: ['familia', 'casamento', 'adocao', 'menor de idade', 'crianca', 'estatuto da crianca'], simIsPositive: true, weight: 15, priority: 4 },
  { criteria: 'FAMILY_VALUES', keywords: ['identidade de genero', 'diversidade sexual', 'homoafetiv', 'transexual'], simIsPositive: false, weight: 15, priority: 4 },
  // Integridade moral
  { criteria: 'MORAL_INTEGRITY', keywords: ['corrupcao', 'improbidade', 'ficha limpa', 'transparencia publica', 'lei anticorrupcao'], simIsPositive: true, weight: 15, priority: 4 },
  { criteria: 'MORAL_INTEGRITY', keywords: ['amnistia', 'anistia', 'prescricao', 'indulto'], simIsPositive: false, weight: 12, priority: 3 },
  // Social
  { criteria: 'SOCIAL_RESPONSIBILITY', keywords: ['assistencia social', 'bolsa familia', 'beneficio social', 'populacao em situacao de rua'], simIsPositive: true, weight: 10, priority: 3 },
  { criteria: 'SOCIAL_RESPONSIBILITY', keywords: ['saude publica', 'sus', 'atendimento a vitimas'], simIsPositive: true, weight: 8, priority: 2 },
  // Liberdade Religiosa
  // Achado real (2026-08-21): as keywords originais nunca casaram nenhuma
  // votação nominal do Plenário desde fev/2023 — o critério vivia com 0
  // pautas. Frases adicionais cobrem os termos que aparecem nas ementas.
  { criteria: 'RELIGIOUS_FREEDOM', keywords: ['liberdade religiosa', 'liberdade de culto', 'discriminacao religiosa', 'intolerancia religiosa', 'expressao religiosa', 'simbolo religioso', 'perseguicao religiosa'], simIsPositive: true, weight: 20, priority: 5 },
  { criteria: 'RELIGIOUS_FREEDOM', keywords: ['laicidade', 'ensino religioso', 'crenca', 'assistencia espiritual', 'folga religiosa'], simIsPositive: true, weight: 10, priority: 3 },
];

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Testa uma keyword como PALAVRA INTEIRA, não como substring.
 *
 * ACHADO P0 (2026-09-26, `docs/AUDITORIA-CLASSIFICACAO.md`): antes era
 * `n.includes(k)`, e a keyword `sus` (sistema de saúde) é substring de
 * `sustentavel`, `consumo`, `consumidor`, `construcao`, `resultado`,
 * `conclusao`, `suspeita`, `suspensao`. O PL 2159/2021 — que é sobre
 * LICENCIAMENTO AMBIENTAL — foi classificado como "Responsabilidade
 * Social" e virou a maior pauta do sistema, com 2.872 votos.
 *
 * **67,4% de todos os votos do banco** entraram por essa regra.
 *
 * A fronteira é o que separa "SUS" de "sustentável". Como o texto já vem
 * normalizado (sem acento, minúsculo), basta exigir que a keyword não seja
 * vizinha de letra ou dígito.
 */
function contemPalavra(textoNormalizado: string, keyword: string): boolean {
  const k = escapeRe(normalize(keyword));
  // (?<![a-z0-9]) e (?![a-z0-9]) em vez de \b: \b é sensível a Unicode e se
  // comporta mal com acento já removido; lookaround explícito não depende disso.
  return new RegExp(`(?<![a-z0-9])${k}(?![a-z0-9])`).test(textoNormalizado);
}

/**
 * Testa um texto (ementa + título + descrição da proposição) contra as regras
 * EM ORDEM — a primeira cujo array casar decide critério, peso e sinal.
 * Null = sem regra (votação fora do escopo; entra no histórico mas não no
 * scoring).
 */
export function matchScanRule(text: string): ScanRule | null {
  const n = normalize(text);
  for (const rule of SCAN_RULES) {
    if (rule.keywords.some(k => contemPalavra(n, k))) return rule;
  }
  return null;
}