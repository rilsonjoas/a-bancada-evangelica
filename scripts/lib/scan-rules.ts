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

  /**
   * Termos que DESFAZEM o casamento da regra (2026-09-26).
   *
   * A fronteira de palavra (1.1.0) resolveu o problema de substring, mas
   * não o de SENTIDO: `prescricao` é palavra corrente em direito
   * securitário e tributário, e `anistia` aparece em liquidação de
   * dívidas. Medido: "PL 5122/2023 — liquidação, anistia, renegociação e
   * rebate de dívidas" (1.632 votos) entrava como Integridade Moral
   * porque o título traz `anistia`.
   *
   * Aqui não é adivinhação: a lista é o contexto que apareceu no acervo
   * real, medido. Termo presente na lista => a regra não dispara, mesmo
   * que a keyword esteja lá.
   */
  exclusoes?: string[];
}

/** Sobe a versão quando as regras mudarem de verdade.
 *  1.1.0 (2026-09-26): casamento por PALAVRA INTEIRA. Até 1.0.0 era substring, e
 *  `sus` casava dentro de `sustentavel` — 67,4% dos votos do banco entravam
 *  no critério errado. Ver docs/AUDITORIA-CLASSIFICACAO.md.
 *  1.2.0 (2026-09-26): campo `exclusoes`. 1.1.0 matou o falso positivo de
 *  SUBSTRING mas não o de SENTIDO — `anistia` em liquidação de dívidas,
 *  `prescricao` em contrato de seguro.
 */
export const SCAN_RULES_VERSION = '1.5.0';

export const SCAN_RULES: ScanRule[] = [
  // Proteção à vida
  // 1.4.0 (2026-09-26): `crime contra a vida` e `homicidio` SAÍRAM.
  //
  // Medido com a paginação corrigida: as duas puxavam 5 pautas e 1.720
  // votos, e NENHUMA era sobre vida intrauterina — eram projetos de Código
  // Penal (art. 121, crime hediondo) e de Lei de Execução Penal. Homicídio
  // é crime contra pessoa JÁ NASCIDA, e保护区 à vida neste site é sobre a
  // vida que ainda não começou.
  //
  // Consequência aceita: o critério fica praticamente sem dado. E isso é a
  // verdade — ver docs/DECISOES-PRODUTO-2026-09-26.md. Melhor um critério
  // honesto e vazio do que um critério cheio de projeto de criminal law.
  { criteria: 'LIFE_PROTECTION', keywords: ['nascituro', 'intrauterina', 'interrupcao da gestacao', 'interrupcao voluntaria da gestacao', 'aborto', 'abortivo', 'fertilizacao assistida', 'reproducao assistida', 'direito do aborto'], simIsPositive: false, weight: 20, priority: 5 },
  // Família
  // 1.3.0 (2026-09-26): a palavra solta `familia` foi REMOVIDA.
  //
  // Medido: "MPV 1268/2024 — Abre crédito extraordinário" (1.447 votos, 39%
  // de todo o dado que sobreviveu à limpeza) casava `familia` e entrava como
  // Valores Familiares. A ementa oficial diz "Agricultura Familiar" e
  // "Família e Combate à Fome" — é um decreto orçamentário, e `família` é
  // vocabulário administrativo comum em lei brasileira.
  //
  // Trocar o LOCAL do casamento (ementa em vez de descrição) não resolvia:
  // a palavra está na ementa oficial, em sentido administrativo. O que
  // resolve é trocar a KEYWORD: os termos específicos abaixo cobrem o que é
  // mesmo família, e nenhum deles aparece em decreto orçamentário.
  //
  // Custo: cai a sensitividade. Com 2.559 votos em 7 pautas,o recall já é o
  // gargalo do critério — e nesse regime, precisão vale mais que cobertura.
  {
    criteria: 'FAMILY_VALUES',
    keywords: ['casamento', 'adocao', 'menor de idade', 'crianca', 'estatuto da crianca', 'direito da crianca', 'violencia contra a crianca'],
    simIsPositive: true, weight: 15, priority: 4,
    // `crianca` é palavra fraca: aparece em qualquer lei que mencione
    // público infantil, mesmo quando o assunto é outro. Medido no acervo
    // real (2026-09-26): "PL 2225/2024" (687 votos) institui política
    // ambiental de direito de crianças e adolescentes à natureza e altera a
    // Lei 6.938 (SISNAMA) — é meio ambiente com menção a criança, não
    // proteção à criança. Não entra.
    exclusoes: ['6.938', 'sistema nacional de areas de protecao', 'direito a natureza', 'estatuto da cidade'],
  },
  { criteria: 'FAMILY_VALUES', keywords: ['identidade de genero', 'diversidade sexual', 'homoafetiv', 'transexual'], simIsPositive: false, weight: 15, priority: 4 },
  // Integridade moral
  {
    criteria: 'MORAL_INTEGRITY',
    keywords: ['corrupcao', 'improbidade', 'ficha limpa', 'transparencia publica', 'lei anticorrupcao'],
    simIsPositive: true, weight: 15, priority: 4,
    // Contexto medido no acervo real (2026-09-26):
    //  - "PL 10106/2018 — altera a Lei 8.080 para publicar na internet a
    //    lista de pacientes em cirurgia eletiva no SUS" (386 votos) citava
    //    a Lei 8.429 ao falar de publicidade das listas, e `improbidade`
    //    jogava um projeto de transparency do SUS para Integridade Moral.
    //    Integridade Moral aqui é o QUE se pune, não onde se publica.
    exclusoes: ['8.080', '8.429', 'cirurgia eletiva', 'procedimento eletivo', 'lista de pacientes'],
  },
  {
    criteria: 'MORAL_INTEGRITY',
    keywords: ['amnistia', 'anistia', 'prescricao', 'indulto'],
    simIsPositive: false, weight: 12, priority: 3,
    // Contexto medido no acervo real (2026-09-26), não adivinhado:
    //  - "PL 5122/2023 — liquidação, anistia, renegociação e rebate de
    //    dívidas" (1.632 votos) casava `anistia` e entrava como
    //    Integridade Moral. Anistia de DÍVIDA não é anistia de crime.
    //  - "PL 2597/2024 — normas gerais em contratos de seguro privado"
    //    (359 votos) casava `prescricao`. Prescrição é termo corrente em
    //    direito securitário, não é sinal de integridade moral.
    exclusoes: [
      'divida', 'dividas', 'debito', 'debitos', 'liquida', 'liquidacao',
      'parcela', 'parcelamento', 'tributar', 'tributaria', 'renegociacao',
      'seguro privado', 'contrato de seguro', 'proviso de seguranca',
    ],
  },
  // Social
  {
    criteria: 'SOCIAL_RESPONSIBILITY',
    keywords: ['assistencia social', 'bolsa familia', 'beneficio social', 'populacao em situacao de rua', 'seguridade social', 'protecao social'],
    simIsPositive: true, weight: 10, priority: 3,
    // Contexto medido no acervo real (2026-09-26):
    //  - "MPV 1268/2024" e "MPV 1188/2023" (1.826 votos) abrem crédito
    //    extraordinário "em favor dos Ministérios ... do Desenvolvimento e
    //    Assistência Social". É transferência de dotação—orçamento— e a
    //    palavra aparece só porque o nome do órgão aparece na ementa.
    //  - "PL 1822/2024" (365 votos) garante a internação de jovens viciados
    //    em "situação de vulnerabilidade social". É internação compelled e
    //    saúde, não política de assistência.
    // Regra: o que a proposição FAZ vale; o nome do órgão por onde passa
    // não. Por isso 'credito extraordinario' barra a regra inteira.
    exclusoes: ['credito extraordinario', 'abertura de credito', 'vulnerabilidade social'],
  },
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
 * TEXTO QUE CLASSIFICA (2026-09-26) — título + ementa, e nada mais.
 *
 * Este é o ponto que separa ~22% de voto classificado errado de voto
 * classificado certo. O `description` da pauta concatena três textos:
 * ementa, descrição do relator e descrição da votação. Só a ementa é o
 * objeto oficial da proposição; as outras duas são documento
 * administrativo, onde qualquer palavra aparece por acaso.
 *
 * Foi por casar contra o texto administrativo que:
 *  - `sus` casou com "sustentável" em licenciamento ambiental — 67,4% de
 *    todos os votos do banco;
 *  - `assistencia social` casou com projeto de estágio de Firms;
 *  - `homicidio` casou com projeto de Código Penal e entrou como proteção
 *    à vida — 1.720 votos.
 *
 * Regra: se não está no título ou na ementa, não é o assunto.
 */
/**
 * Extrai a ementa do campo `description`.
 *
 * O sync monta `description` como
 * `[ementa, descricao_da_proposicao, descricao_da_votacao].join(' · ')`,
 * então a ementa é o primeiro segmento. Depender disso é melhor do que
 * depender de coluna nova: o dado já está gravado nas 162 pautas, e uma
 * coluna nova exigiria migrar o Prisma Client de toda a cadeia.
 *
 * Se a pauta não tiver separador, o texto inteiro é usado — é o melhor
 * que existe, e é a ementa na maioria dos casos.
 */
export function extrairEmenta(description: string | null | undefined): string {
  const d = (description ?? '').trim();
  if (!d) return '';
  return (d.split(' · ')[0] ?? d).trim();
}

export function textoParaClassificar(
  titulo: string | null | undefined,
  description: string | null | undefined,
): string {
  return `${titulo ?? ''} ${extrairEmenta(description)}`;
}

/**
 * Testa um texto (título + ementa) contra as regras
 * EM ORDEM — a primeira cujo array casar decide critério, peso e sinal.
 * Null = sem regra (votação fora do escopo; entra no histórico mas não no
 * scoring).
 */
export function matchScanRule(text: string): ScanRule | null {
  const n = normalize(text);
  for (const rule of SCAN_RULES) {
    // A exclusão é avaliada ANTES das keywords: se o contexto está presente,
    // a regra não dispara, mesmo que a keyword esteja lá. Caso contrário
    // "liquidação de dívidas com anistia" casaria `anistia` e voltaria a
    // entrar como Integridade Moral.
    if (rule.exclusoes?.some(x => contemPalavra(n, x))) continue;
    if (rule.keywords.some(k => contemPalavra(n, k))) return rule;
  }
  return null;
}
/**
 * Como `matchScanRule`, mas devolve TAMBÉM a palavra que casou (e a
 * exclusão que barrou a regra, quando for o caso).
 *
 * Existe porque a auditoria por palavra-chave diz "isto está errado, e
 *provavelmente é por esta palavra aqui" — sem isso, corrigir um falso positivo é
 * adivinhação, e adivinhação em classificador é como o `sus` dentro de
 * "sustentável" entrou: alguém leu o sintoma e chutou a palavra.
 */
export interface ScanMatch {
  rule: ScanRule;
  keyword: string;
  /** Preenchida quando a regra casaria mas foi barrada por exclusão. */
  barradaPor?: string;
}

export function diagnosticarMatch(text: string): ScanMatch | null {
  const n = normalize(text);
  let barradas: ScanMatch | null = null;
  for (const rule of SCAN_RULES) {
    const exclusao = rule.exclusoes?.find(x => contemPalavra(n, x));
    if (exclusao) {
      if (!barradas) {
        barradas = { rule, keyword: rule.keywords.find(k => contemPalavra(n, k)) ?? rule.keywords[0], barradaPor: exclusao };
      }
      continue;
    }
    const keyword = rule.keywords.find(k => contemPalavra(n, k));
    if (keyword) return { rule, keyword };
  }
  return barradas;
}
