/**
 * Estado de release — flags de transição.
 *
 * POR QUE EXISTE (2026-09-25): a fórmula de score está sendo recalibrada
 * (PLANO-PESO-INDIVIDUAL.md, M1c–M5). Durante a transição, o banco já tem
 * notas da fórmula nova enquanto o texto publicado ainda descreve a
 * antiga. Isso é exatamente o problema que o teste de consistência existe
 * para evitar, e o Rilson optou por fazer "tudo junto, sem errata" — o que
 * exige que os números não sejam publicados enquanto não fecharem.
 *
 * `NUMBERS_FROZEN` congela a exibição dos números agregados (home e
 * ranking) até a recalibração terminar e os textos serem atualizados juntos.
 * A alternativa seria mostrar número novo com texto velho.
 *
 * REMOVER ESTE ARQUIVO (ou pôr NUMBERS_FROZEN = false) no commit que
 * atualizar `/metodologia`, README e demais textos. Nada mais depende dele.
 */
export const NUMBERS_FROZEN = true;

/** Motivo exibido ao usuário enquanto os números estão congelados. */
export const FREEZE_REASON =
  'Estamos recalibrando como a nota é calculada, para que o voto do próprio parlamentar pese mais que o partido. Os números ficam congelados até a metodologia e esta página falarem a mesma coisa.';

/**
 * Versão da fórmula visível ao usuário. Vem do banco
 * (`politician_scores.formula_version`), mas fica aqui como fallback para
 * quando a API não trouxer.
 */
export const FALLBACK_FORMULA_VERSION = '1.0.0';
