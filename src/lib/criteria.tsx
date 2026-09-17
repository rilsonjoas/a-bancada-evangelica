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
}

export const CRITERIA: CriteriaConfig[] = [
  {
    key: 'LIFE_PROTECTION', field: 'lifeProtection', label: 'Proteção à Vida',
    Icon: Shield, iconClass: 'text-red-500', badgeClass: 'bg-red-100 text-red-800', weight: '30%', barColor: '#ef4444',
    rationale: 'Reúne votações sobre aborto, eutanásia e proteção ao nascituro. O voto de quem defende a vida desde a concepção é o considerado alinhado neste critério.',
  },
  {
    key: 'FAMILY_VALUES', field: 'familyValues', label: 'Valores Familiares',
    Icon: Home, iconClass: 'text-blue-500', badgeClass: 'bg-blue-100 text-blue-800', weight: '25%', barColor: '#3b82f6',
    rationale: 'Reúne votações que afetam a família: educação dos filhos, autoridade parental e políticas de valorização da família. Alinha-se o voto que fortalece a família como instituição.',
  },
  {
    key: 'MORAL_INTEGRITY', field: 'moralIntegrity', label: 'Integridade Moral',
    Icon: Scale, iconClass: 'text-purple-500', badgeClass: 'bg-purple-100 text-purple-800', weight: '20%', barColor: '#a855f7',
    rationale: 'Avalia a conduta do parlamentar: despesas públicas suspeitas (cota parlamentar) e votos em matérias de ética e combate à corrupção.',
  },
  {
    key: 'SOCIAL_RESPONSIBILITY', field: 'socialResponsibility', label: 'Responsabilidade Social',
    Icon: Handshake, iconClass: 'text-green-500', badgeClass: 'bg-green-100 text-green-800', weight: '15%', barColor: '#22c55e',
    rationale: 'Reúne votações de cuidado pelo mais vulnerável: saúde, educação, assistência social e dignidade humana. O cuidado pelo próximo é expressão de fé, não pauta de partido.',
  },
  {
    key: 'RELIGIOUS_FREEDOM', field: 'religiousFreedom', label: 'Liberdade Religiosa',
    Icon: Church, iconClass: 'text-amber-500', badgeClass: 'bg-amber-100 text-amber-800', weight: '10%', barColor: '#f59e0b',
    rationale: 'Reúne votações sobre liberdade de culto, proteção contra perseguição religiosa e respeito ao exercício público da fé.',
  },
];

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
