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
 * HISTÓRICO da flag:
 *   - `true` de 25/09 a 26/09 (fórmula nova com texto velho);
 *   - `false` no commit da fórmula 1.2.0 (texto e fórmula juntos);
 *   - `true` de novo em 26/09, porque a classificação das pautas estava
 *     errada (achado da auditoria);
 *   - `false` em 26/09, por decisão do Rilson.
 *
 * POR QUE VOLTOU A `false` (2026-09-26, decisão do Rilson):
 *
 * A reclasificação TERMINOU. O que restou são 11 assuntos e 7.330 votos,
 * todos lidos um a um, nenhum deles classificado pelo tema errado. A nota
 * é estreita — escala 50–64 — e isso é consequência do corpus, não do
 * classificador.
 *
 * O argumento para manter congelado era "um número com cara de medição,
 * medido errado, é pior que número nenhum". Ele não se aplica mais: o
 * número não está medido errado, está medido sobre pouco dado. E o aviso
 * de congelamento estava causando um dano que a flag pretendia evitar —
 * passou a dizer ao usuário que o site inteiro era um número grande e
 * incerto, quando na verdade o que é incerto é UMA camada (votos por
 * tema), e essa camada continua verificável assunto por assunto em
 * `docs/AUDITORIA-CLASSIFICACAO.md` e no painel de cada perfil.
 *
 * OU SEJA: congelar o site inteiro por causa de uma camada foi
 * desproporcional. O ranking e as notas por perfil são normais e
 * auditáveis; o que precisa de ressalva é a camada de votação, e essa
 * ressalva pertence à camada, não a um banner que apaga o resto.
 *
 * QUANDO LIGAR DE NOVO: se uma reclassificação começar a alterar
 * `overall_score` antes de o texto público acompanhar, aí sim. O
 * mecanismo continua no lugar de propósito — a próxima recalibração de
 * fórmula vai precisar dele, e é mais barato ter a flag pronta do que
 * reconstruir o ternário no meio de uma transição.
 */
export const NUMBERS_FROZEN = false;

/**
 * AVISO AO USUÁRIO — 2026-09-26.
 *
 * Só aparece quando `NUMBERS_FROZEN` é `true`. Guardado porque é o texto
 * que funcionou quando a classificação estava de fato errada — se a flag
 * ligar de novo por erro de fórmula (e não por camada fina), a redação
 * serve; se ligar por camada fina, o texto certo é outro (veja o
 * comentário da flag).
 */
export const FREEZE_REASON =
  'Estamos corrigindo um erro na classificação das votações: parte das pautas estava sendo atribuída ao tema errado, o que contamina a nota. Enquanto a reclasificación não termina, os números ficam congelados — publicar um número com cara de medição, mas medido errado, seria pior do que não publicar. Os detalhes estão em docs/AUDITORIA-CLASSIFICACAO.md.';
/**
 * Versão da fórmula visível ao usuário. O valor de verdade vem do banco
 * (`politician_scores.formula_version`, exposto pela API no perfil). Isto
 * aqui é só o fallback para quando a API não trouxer.
 */
export const FALLBACK_FORMULA_VERSION = '1.2.0';
