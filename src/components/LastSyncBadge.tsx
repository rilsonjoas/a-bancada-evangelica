import { useLastSync } from '@/hooks/useLastSync';

export function LastSyncBadge() {
  const { lastSyncLabel } = useLastSync();

  if (!lastSyncLabel) return null;

  return (
    <p className="text-xs text-muted-foreground text-center">
      Dados atualizados em {lastSyncLabel}
    </p>
  );
}
