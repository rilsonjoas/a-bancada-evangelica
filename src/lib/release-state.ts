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
 * HISTÓRICO da flag: `true` de 25/09 a 26/09 (fórmula nova com texto velho),
 * `false` no commit da fórmula 1.2.0 (texto e fórmula juntos), `true` de
 * novo em 26/09 (classificação de pauta errada — achado posterior).
 * A coluna `politician_scores.formula_version` continua gravando a versão
 * de cada nota, então a auditoria continua possível.
 *
 * O branch congelado continua em `src/pages/Ranking.tsx` (é o mecanismo de
 * transição, e deixá-lo pronto é o que torna a próxima recalibração
 * segura). Com a flag em `false` o renderizador nem passa por ele. Um dia
 * isto pode ser removido junto com o ternário — mas não agora, porque a
 * próxima mudança de fórmula vai precisar do mesmo mecanismo.
 */
export const NUMBERS_FROZEN = true;

/**
 * AVISO AO USUÁRIO — 2026-09-26 (segunda vez que a flag liga, motivo novo).
 *
 * Primeira vez (2026-09-25): a fórmula estava sendo recalibrada e o texto
 * descrevia a fórmula antiga.
 *
 * Segunda vez, esta: a **classificação das pautas estava errada**. Medido em
 * 2026-09-26, depois de só 9,5% dos votos sobreviverem à correção — ver
 * `docs/AUDITORIA-CLASSIFICACAO.md`. Não é mais "o texto está velho": é que
 * os votos estavam no critério errado, então a nota que o texto descreve
 * estava medindo a coisa errada.
 *
 * Por que congelar e não só avisar: a nota é o produto. Um número com cara
 * de medição, calculado sobre 9,5% de dado correto, é pior que número
 * nenhum — porque convence.
 */
export const FREEZE_REASON =
  'Estamos corrigindo um erro na classificação das votações: parte das pautas estava sendo atribuída ao tema errado, o que contamina a nota. Enquanto a reclasificación não termina, os números ficam congelados — publicar um número com cara de medição, mas medido errado, seria pior do que não publicar. Os detalhes estão em docs/AUDITORIA-CLASSIFICACAO.md.';

/**
 * Versão da fórmula visível ao usuário. O valor de verdade vem do banco
 * (`politician_scores.formula_version`, exposto pela API no perfil). Isto
 * aqui é só o fallback para quando a API não trouxer.
 */
export const FALLBACK_FORMULA_VERSION = '1.2.0';
