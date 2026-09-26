/**
 * TIPO DA VOTAÇÃO — o que a votação realmente decide.
 *
 * POR QUE EXISTE (2026-09-26, decisão D-02): medir o acervo mostrou que
 * **48% das votações substantivas são procedimentais**. Um requerimento de
 * urgência pergunta "este projeto entra na pauta hoje?", não "você apoia este
 * projeto?". Tratar os dois como a mesma coisa é tratar pergunta de
 * processo como posição sobre tema.
 *
 * Peso por tipo (aprovado pelo Rilson em 2026-09-26):
 *
 *   mérito ........ 1,0   é posição sobre o assunto
 *   redação final  1,0   é a versão que vai ao sanction
 *   emenda ........ 0,7   posição sobre parte; herda o assunto da mãe
 *   requerimento .. 0,3   é sobre processo
 *   urgência ...... 0,2   é sobre entrar na pauta
 *
 * A ORDEM dos testes importa. "Requerimento de Urgência" tem que ser
 * testado antes de "Requerimento", senão o de urgência cai no genérico e
 * perde o peso próprio. E "Proposta de Emenda à Constituição" é a PEC
 * **indo a voto** — posição de mérito —, não uma emenda dentro dela.
 */

export type VoteKind = 'MERIT' | 'FINAL_TEXT' | 'AMENDMENT' | 'REQUEST' | 'URGENCY';

/** Peso de cada tipo na nota. Fonte: decisão D-02. */
export const VOTE_KIND_WEIGHTS: Record<VoteKind, number> = {
  MERIT: 1.0,
  FINAL_TEXT: 1.0,
  AMENDMENT: 0.7,
  REQUEST: 0.3,
  URGENCY: 0.2,
};

/** Rótulo curto para a tela — o usuário vê o tipo e o peso (D-02). */
export const VOTE_KIND_LABELS: Record<VoteKind, string> = {
  MERIT: 'Votação de mérito',
  FINAL_TEXT: 'Redação final',
  AMENDMENT: 'Emenda a proposição',
  REQUEST: 'Requerimento',
  URGENCY: 'Requerimento de urgência',
};

/** Uma frase explicando por que o tipo pesa menos — usada na metodologia. */
export const VOTE_KIND_EXPLANATION: Record<VoteKind, string> = {
  MERIT: 'A Câmara votou o mérito da proposição. É posição sobre o assunto, e vale o peso cheio.',
  FINAL_TEXT: 'A redação final é o texto que vai para o sanction. Também é posição sobre o assunto.',
  AMENDMENT: 'A votação foi sobre uma emenda dentro da proposição. O assunto é o da proposição mãe, e a emenda é parte dela.',
  REQUEST: 'A votação foi sobre um requerimento — é sobre processo, não sobre o tema da proposição.',
  URGENCY: 'A votação foi sobre entrada na pauta. Diz o quanto a pessoa quer resolver aquilo agora, não o que acha do conteúdo.',
};

const RE_URGENCIA = /requerimento\s+de\s+urg[eê]ncia/i;
const RE_REQUERIMENTO = /requerimento/i;
const RE_REDACAO_FINAL = /reda[çc][ãa]o\s+final/i;
/** A PEC indo a voto é mérito. "Proposta de Emenda à Constituição nº 383". */
const RE_PEC_PROPRIA = /proposta\s+de\s+emenda\s+[àa]\s+constitui[çc][ãa]o|emenda\s+[àa]\s+constitui[çc][ãa]o/i;
/** Emenda dentro de um projeto: "Emenda do Senado nº 28", "emenda à Lei nº 8.069". */
const RE_EMENDA = /\bemendas?\b/i;

/**
 * Classifica o tipo de uma votação a partir da descrição da Câmara.
 *
 * @param descricao texto de `votes.voting_description`, ex.:
 *   "Aprovado o Requerimento de Urgência (Art. 155 do RICD). Sim: 276; Não: 41"
 */
export function classificarVotacao(descricao: string | null | undefined): VoteKind {
  const d = descricao ?? '';
  if (!d.trim()) return 'REQUEST';

  // 1. Redação final — antes de tudo, porque "Aprovada a redação final da
  //    emenda do Senado nº 3" contém "emenda" e não é emenda nenhuma.
  if (RE_REDACAO_FINAL.test(d)) return 'FINAL_TEXT';
  // 2. Urgência antes de requerimento genérico — os dois casam.
  if (RE_URGENCIA.test(d)) return 'URGENCY';
  // 3. PEC indo a voto é mérito, mesmo com a palavra "emenda" no meio.
  if (RE_PEC_PROPRIA.test(d)) return 'MERIT';
  // 4. Requerimento genérico.
  if (RE_REQUERIMENTO.test(d)) return 'REQUEST';
  // 5. Emenda dentro de proposição.
  if (RE_EMENDA.test(d)) return 'AMENDMENT';
  // 6. O resto é mérito: "Mantido o texto", "Aprovado o Projeto de Lei nº 5.122".
  return 'MERIT';
}

export function pesoVotacao(descricao: string | null | undefined): number {
  return VOTE_KIND_WEIGHTS[classificarVotacao(descricao)];
}
