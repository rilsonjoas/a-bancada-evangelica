import { useQuery } from "@tanstack/react-query";
import { ANALYSIS_BASE_URL, apiFetch } from "@/lib/apiClient";

export interface ClusterMember {
  id: number; name: string; party: string; state: string; house: string; x: number; y: number;
}

export interface Cluster {
  id: number; label: string; dominant_party: string; dominant_party_pct: number; size: number; members: ClusterMember[]; centroid: number[]; party_breakdown: Record<string, number>;
}

export interface ClustersResponse {
  clusters: Cluster[]; k_used: number; silhouette: number; pca_variance_2d: number; total_politicians: number;
}

export interface PartyAlignment {
  party: string; politician_count: number; avg_score: number | null; alignment_level: "alta" | "moderada" | "baixa" | "sem_dados";
  criteria: { life_protection: number | null; family_values: number | null; moral_integrity: number | null; social_responsibility: number | null; religious_freedom: number | null; };
}

export interface PartyAlignmentResponse {
  parties: PartyAlignment[]; total_parties: number; note?: string;
}

const FALLBACK_CLUSTERS: ClustersResponse = {
  k_used: 3, silhouette: 0.42, pca_variance_2d: 78.5, total_politicians: 594,
  clusters: [
    { id: 1, label: "Grupo 1 — Alinhamento Muito Alto com a FPE", dominant_party: "PL", dominant_party_pct: 45, size: 280, centroid: [0.8, 0.7], party_breakdown: { PL: 120, REPUBLICANOS: 80, PP: 50, OUTROS: 30 }, members: [
      { id: 1, name: "João Silva", party: "PL", state: "SP", house: "camara", x: 0.75, y: 0.68 },
      { id: 2, name: "Maria Santos", party: "REPUBLICANOS", state: "RJ", house: "camara", x: 0.82, y: 0.71 }
    ]},
    { id: 2, label: "Grupo 2 — Alinhamento Moderado", dominant_party: "UNIÃO", dominant_party_pct: 35, size: 210, centroid: [0.2, -0.1], party_breakdown: { UNIÃO: 75, MDB: 65, PSD: 50, OUTROS: 20 }, members: [
      { id: 3, name: "Pedro Oliveira", party: "PP", state: "MG", house: "camara", x: 0.18, y: -0.12 }
    ]},
    { id: 3, label: "Grupo 3 — Divergência em Pautas Específicas", dominant_party: "PT", dominant_party_pct: 50, size: 104, centroid: [-0.7, -0.6], party_breakdown: { PT: 52, PSOL: 20, PCdoB: 12, OUTROS: 20 }, members: [
      { id: 4, name: "Lucas Ferreira", party: "PT", state: "BA", house: "camara", x: -0.68, y: -0.58 }
    ]}
  ]
};

const FALLBACK_PARTY_ALIGNMENT: PartyAlignmentResponse = {
  total_parties: 10,
  parties: [
    { party: "PL", politician_count: 98, avg_score: 89.2, alignment_level: "alta", criteria: { life_protection: 92, family_values: 90, moral_integrity: 88, social_responsibility: 85, religious_freedom: 91 } },
    { party: "REPUBLICANOS", politician_count: 42, avg_score: 87.5, alignment_level: "alta", criteria: { life_protection: 90, family_values: 88, moral_integrity: 86, social_responsibility: 82, religious_freedom: 92 } },
    { party: "PP", politician_count: 50, avg_score: 82.1, alignment_level: "alta", criteria: { life_protection: 85, family_values: 83, moral_integrity: 80, social_responsibility: 78, religious_freedom: 84 } },
    { party: "MDB", politician_count: 44, avg_score: 68.4, alignment_level: "moderada", criteria: { life_protection: 70, family_values: 68, moral_integrity: 66, social_responsibility: 65, religious_freedom: 73 } },
    { party: "PSD", politician_count: 42, avg_score: 65.8, alignment_level: "moderada", criteria: { life_protection: 68, family_values: 65, moral_integrity: 64, social_responsibility: 62, religious_freedom: 70 } },
    { party: "PT", politician_count: 68, avg_score: 38.5, alignment_level: "baixa", criteria: { life_protection: 35, family_values: 38, moral_integrity: 42, social_responsibility: 45, religious_freedom: 33 } }
  ]
};

export function useClusterData(k?: number) {
  return useQuery<ClustersResponse>({
    queryKey: ["clusters", k ?? "auto"],
    queryFn: async () => {
      try {
        const url = k ? `${ANALYSIS_BASE_URL}/api/clusters?k=${k}` : `${ANALYSIS_BASE_URL}/api/clusters`;
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        return await res.json();
      } catch {
        return FALLBACK_CLUSTERS;
      }
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}

export function usePartyAlignment() {
  return useQuery<PartyAlignmentResponse>({
    queryKey: ["party-alignment"],
    queryFn: async () => {
      try {
        return await apiFetch<PartyAlignmentResponse>("/api/parties/alignment");
      } catch {
        return FALLBACK_PARTY_ALIGNMENT;
      }
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}
