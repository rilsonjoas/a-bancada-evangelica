import { useQuery } from '@tanstack/react-query';
import { ANALYSIS_BASE_URL } from '@/lib/apiClient';

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
  size: number;
  members: ClusterMember[];
  centroid: number[];
}

export interface ClustersResponse {
  clusters: Cluster[];
  k_used: number;
  silhouette: number;
  pca_variance_2d: number;
  total_politicians: number;
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
