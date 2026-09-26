/**
 * Estado de release — flags de transição.
 *
 * POR QUE EXISTE (2026-09-25): a fórmula de score foi recalibrada
 * (PLANO-PESO-INDIVIDUAL.md, M1c–M3). Durante a transição, o banco já
 * tinha notas da fórmula nova enquanto o texto publicado ainda descrevia
 * a antiga. Isso é exatamente o problema que o teste de consistência
 * existe para evitar, e o Rilson optou por fazer "tudo junto, sem
 * errata" — o que exigia que os números não fossem publicados enquanto não
 * fechassem.
 *
 * HISTÓRICO: `NUMBERS_FROZEN` ficou `true` de 2026-09-25 a 2026-09-26.
 * Foi desligado no commit que atualizou `/metodologia`, o README e os
 * demais textos junto com a fórmula 1.2.0 — que é a condição que o próprio
 * arquivo exigia. A coluna `politician_scores.formula_version` continua
 * gravando a versão de cada nota, então a auditoria continua possível.
 *
 * O branch congelado continua em `src/pages/Ranking.tsx` (é o mecanismo de
 * transição, e deixá-lo pronto é o que torna a próxima recalibração
 * segura). Com a flag em `false` o renderizador nem passa por ele. Um dia
 * isto pode ser removido junto com o ternário — mas não agora, porque a
 * próxima mudança de fórmula vai precisar do mesmo mecanismo.
 */
export const NUMBERS_FROZEN = false;

/**
 * Mantido apenas para o texto de aviso continuar compilando se a flag for
 * ligada de novo durante uma futura transição de fórmula. Morto hoje.
 */
export const FREEZE_REASON =
  'Estamos recalibrando como a nota é calculada, para que o voto do próprio parlamentar pese mais que o partido. Os números ficam congelados até a metodologia e esta página falarem a mesma coisa.';

/**
 * Versão da fórmula visível ao usuário. O valor de verdade vem do banco
 * (`politician_scores.formula_version`, exposto pela API no perfil). Isto
 * aqui é só o fallback para quando a API não trouxer.
 */
export const FALLBACK_FORMULA_VERSION = '1.2.0';
