import { useQuery } from '@tanstack/react-query';

interface LastSyncData {
  lastSync: string | null;
  syncType: string | null;
  source: string | null;
}

function fmtLastSync(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} às ${hh}:${mi}`;
}

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

  return {
    lastSyncLabel: fmtLastSync(data?.lastSync ?? null),
    raw: data ?? null,
  };
}
