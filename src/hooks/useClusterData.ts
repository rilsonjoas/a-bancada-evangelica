import { useQuery } from '@tanstack/react-query';
import { ANALYSIS_BASE_URL, apiFetch } from '@/lib/apiClient';

export interface ClusterMember {
  id: number;
  name: string;
  party: string;
  state: string;
  house: string;
  x: number;
  y: number;
}

export interface Cluster {
  id: number;
  label: string;
  dominant_party: string;
  dominant_party_pct: number;
  size: number;
  members: ClusterMember[];
  centroid: number[];
  party_breakdown: Record<string, number>;
}

export interface ClustersResponse {
  clusters: Cluster[];
  k_used: number;
  silhouette: number;
  pca_variance_2d: number;
  total_politicians: number;
}

export interface PartyAlignment {
  party: string;
  politician_count: number;
  avg_score: number | null;
  alignment_level: 'alta' | 'moderada' | 'baixa' | 'sem_dados';
  criteria: {
    life_protection: number | null;
    family_values: number | null;
    moral_integrity: number | null;
    social_responsibility: number | null;
    religious_freedom: number | null;
  };
}

export interface PartyAlignmentResponse {
  parties: PartyAlignment[];
  total_parties: number;
  note?: string;
}

export function useClusterData(k?: number) {
  return useQuery<ClustersResponse>({
    queryKey: ['clusters', k ?? 'auto'],
    queryFn: async () => {
      const url = k
        ? `${ANALYSIS_BASE_URL}/api/clusters?k=${k}`
        : `${ANALYSIS_BASE_URL}/api/clusters`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erro ao buscar clusters: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}

export function usePartyAlignment() {
  return useQuery<PartyAlignmentResponse>({
    queryKey: ['party-alignment'],
    queryFn: () => apiFetch<PartyAlignmentResponse>('/api/parties/alignment'),
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}
