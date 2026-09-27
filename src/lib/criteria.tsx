import { Shield, Home, Scale, Handshake, Church, Award } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import React from 'react';

export interface CriteriaConfig {
  key: string;
  field: string;
  label: string;
  Icon: LucideIcon;
  badgeClass: string;
  iconClass: string;
  weight: string;
  barColor: string;
  /** Explicação em linguagem de eleitor do que o critério cobre —
   * renderizada na página de Votações pra dar contexto a quem não é
   * analysta político (transparência > jargão). */
  rationale: string;
  /** `true` quando o critério não tem NENHUM assunto com votação nominal
   * medida no acervo: a nota dele é só a semente do partido, igual para
   * quem vota de um jeito ou de outro. A tela não mostra esse número como
   * se fosse medição do parlamentar (ver `SEM_VOTO_MEDIDO_NOTA`). */
  semVotoMedido: boolean;
}

/**
 * Critérios sem votação nominal medida — passe de honestidade pré-eleição
 * (2026-09-27).
 *
 * Evidência, na API de produção em 2026-09-27: em `/api/votes/analysis`,
 * `voteByCriteria` não tem nenhuma entrada para LIFE_PROTECTION nem para
 * RELIGIOUS_FREEDOM; no `scoreBreakdown` de cada perfil esses dois critérios
 * têm `subjectCount: 0` e `votePoints: 0`. A nota deles é 100% semente do
 * partido. Ver docs/HISTORIA-DIFICULDADES-E-CAMINHOS.md, seção 5.
 *
 * A nota geral continua incluindo esses critérios pelo peso da metodologia
 * (mudar a fórmula a uma semana da eleição seria outra rodada de mudança no
 * ar). O que muda é que a tela diz de onde vem o número.
 *
 * QUANDO DESLIGAR: quando uma votação nominal do tema entrar no acervo e o
 * recálculo gravar `subjectCount > 0`. O plano pós-eleição é derivar isto do
 * dado em vez de fixar aqui (docs/PLANO-POS-ELEICAO.md).
 */
export const SEM_VOTO_MEDIDO_NOTA =
  'Sem votação nominal medida nesta legislatura: este critério entra na nota geral pela estimativa do partido, não pelo voto do parlamentar.';

export const CRITERIA: CriteriaConfig[] = [
  {
    key: 'LIFE_PROTECTION', field: 'lifeProtection', label: 'Proteção à Vida',
    Icon: Shield, iconClass: 'text-red-500', badgeClass: 'bg-red-100 text-red-800', weight: '30%', barColor: '#ef4444', semVotoMedido: true,
    rationale: 'Reúne votações sobre aborto, eutanásia e proteção ao nascituro. O voto de quem defende a vida desde a concepção é o considerado alinhado neste critério.',
  },
  {
    key: 'FAMILY_VALUES', field: 'familyValues', label: 'Valores Familiares',
    Icon: Home, iconClass: 'text-blue-500', badgeClass: 'bg-blue-100 text-blue-800', weight: '25%', barColor: '#3b82f6', semVotoMedido: false,
    rationale: 'Reúne votações que afetam a família: educação dos filhos, autoridade parental e políticas de valorização da família. Alinha-se o voto que fortalece a família como instituição.',
  },
  {
    key: 'MORAL_INTEGRITY', field: 'moralIntegrity', label: 'Integridade Moral',
    Icon: Scale, iconClass: 'text-purple-500', badgeClass: 'bg-purple-100 text-purple-800', weight: '20%', barColor: '#a855f7', semVotoMedido: false,
    rationale: 'Avalia a conduta do parlamentar: despesas públicas suspeitas (cota parlamentar) e votos em matérias de ética e combate à corrupção.',
  },
  {
    key: 'SOCIAL_RESPONSIBILITY', field: 'socialResponsibility', label: 'Responsabilidade Social',
    Icon: Handshake, iconClass: 'text-green-500', badgeClass: 'bg-green-100 text-green-800', weight: '15%', barColor: '#22c55e', semVotoMedido: false,
    rationale: 'Reúne votações de cuidado pelo mais vulnerável: saúde, educação, assistência social e dignidade humana. O cuidado pelo próximo é expressão de fé, não pauta de partido.',
  },
  {
    key: 'RELIGIOUS_FREEDOM', field: 'religiousFreedom', label: 'Liberdade Religiosa',
    Icon: Church, iconClass: 'text-amber-500', badgeClass: 'bg-amber-100 text-amber-800', weight: '10%', barColor: '#f59e0b', semVotoMedido: true,
    rationale: 'Reúne votações sobre liberdade de culto, proteção contra perseguição religiosa e respeito ao exercício público da fé.',
  },
];

/** Critérios que de fato distinguem um parlamentar do outro pelo voto. */
export const CRITERIA_COM_VOTO = CRITERIA.filter((c) => !c.semVotoMedido);

export const CRITERIA_BY_KEY = Object.fromEntries(CRITERIA.map(c => [c.key, c]));
export const CRITERIA_BY_FIELD = Object.fromEntries(CRITERIA.map(c => [c.field, c]));

/** Renderiza ícone + label de um critério inline */
export function CriteriaLabel({ criteriaKey, size = 'sm' }: { criteriaKey: string; size?: 'sm' | 'md' }) {
  const c = CRITERIA_BY_KEY[criteriaKey];
  if (!c) return <span>{criteriaKey}</span>;
  const { Icon, iconClass, label } = c;
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className={`${iconSize} ${iconClass} shrink-0`} />
      {label}
    </span>
  );
}

export { Award };

/**
 * Cortes das faixas de aderência — FONTE ÚNICA para o front.
 *
 * Estes números precisam ser os mesmos de `performanceLabel()` em
 * `scripts/lib/scoring.ts`. Antes desta constante, cada componente tinha
 * o seu próprio limiar hardcoded (80/60/40 em `PoliticianCard`,
 * `ComparisonTable` e `KeyAgendaCard`), e a API tinha outros (80/65/45):
 * três lugares, três respostas, e nada testava a concordância.
 *
 * O teste `1.7 faixas da UI × faixas da API` em
 * `src/__tests__/consistencia-publica.test.ts` falha se alguém mexer num
 * lado e não no outro.
 *
 * Recalibrados em 2026-09-26 junto com a fórmula 1.2.0: a amplitude real da
 * nota passou de 30–88 para 50–68, e os limiares antigos deixavam duas das
 * quatro cores mortas.
 */
export const SCORE_BANDS = {
  excellent: 65,
  good: 60,
  average: 55,
} as const;

/** Rótulo do nível de aderência, para texto e para cor. */
export function scoreBand(score: number): 'excellent' | 'good' | 'average' | 'poor' {
  if (score >= SCORE_BANDS.excellent) return 'excellent';
  if (score >= SCORE_BANDS.good) return 'good';
  if (score >= SCORE_BANDS.average) return 'average';
  return 'poor';
}
