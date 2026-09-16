import { useLastSync } from '@/hooks/useLastSync';

/**
 * Badge honesto de frescor (2026-09-16): mostra o tipo de dado MAIS ANTIGO
 * (o que pode estar desatualizado), não o último log qualquer. Se o dado
 * mais antigo é votações, o texto é "Dados de votações atualizados em X" —
 * em vez de um "atualizado hoje" enganoso.
 */
export function LastSyncBadge() {
  const { lastSyncLabel, label } = useLastSync();

  if (!lastSyncLabel) return null;

  const text = label
    ? `Dados de ${label} atualizados em ${lastSyncLabel}`
    : `Dados atualizados em ${lastSyncLabel}`;

  return (
    <p className="text-xs text-muted-foreground text-center">
      {text}
    </p>
  );
}