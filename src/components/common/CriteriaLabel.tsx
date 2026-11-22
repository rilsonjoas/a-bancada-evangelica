import React from 'react';
import { CRITERIA_BY_KEY } from '@/lib/criteria';

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
