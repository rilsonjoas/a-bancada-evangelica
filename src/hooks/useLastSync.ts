import { useQuery } from '@tanstack/react-query';

export type SyncType = 'POLITICIANS' | 'VOTES' | 'EXPENSES' | 'TSE_DATA' | 'SCORES' | 'NEWS';

const SYNC_TYPE_LABEL: Record<string, string> = {
  POLITICIANS: 'políticos',
  VOTES: 'votações',
  EXPENSES: 'gastos',
  TSE_DATA: 'dados TSE',
  SCORES: 'cálculo de notas',
  NEWS: 'cobertura na imprensa',
};

interface LastSyncData {
  lastSync: string | null;
  syncType: string | null;
  source: string | null;
  freshness?: Record<string, string | null>;
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} às ${hh}:${mi}`;
}

/**
 * Frescura honesta (2026-09-16):
 * NÃO usa o "último log qualquer" (NEWS/SCORES diários mascaravam votos
 * velhos). Busca o tipo de dado MAIS ANTIGO dentre os sincronizados e
 * mostra ele — é o dado que de fato pode estar desatualizado.
 */
export function useLastSync() {
  const { data } = useQuery<LastSyncData>({
    queryKey: ['lastSync'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stats/last-sync`);
      if (!res.ok) return { lastSync: null, syncType: null, source: null };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Prefere o shape novo (frescura por tipo): pega o mais antigo.
  let oldest: { type: string; at: string | null } | null = null;
  if (data?.freshness) {
    for (const [type, at] of Object.entries(data.freshness)) {
      if (!at) continue;
      if (!oldest || at < oldest.at!) oldest = { type, at };
    }
  }

  const at = oldest?.at ?? data?.lastSync ?? null;
  const type = oldest?.type ?? data?.syncType ?? null;
  const label = SYNC_TYPE_LABEL[type ?? ''] ?? null;

  return {
    lastSyncAt: at,
    syncType: type,
    lastSyncLabel: fmtDateTime(at),
    label: label ? `${label}` : null,
    raw: data ?? null,
  };
}