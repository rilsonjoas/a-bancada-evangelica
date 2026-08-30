import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import VotingClusters from "../VotingClusters";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("@/hooks/useClusterData", () => ({
  useClusterData: () => ({
    data: {
      k_used: 3,
      silhouette: 0.42,
      pca_variance_2d: 78.5,
      total_politicians: 594,
      clusters: [
        {
          id: 1,
          label: "Grupo 1 — Alinhamento Muito Alto com a FPE",
          dominant_party: "PL",
          dominant_party_pct: 45,
          size: 280,
          members: [
            { id: 1, name: "João Silva", party: "PL", state: "SP", house: "camara", x: 0.75, y: 0.68 }
          ],
          centroid: [0.8, 0.7],
          party_breakdown: { PL: 120, REPUBLICANOS: 80 }
        }
      ]
    },
    isLoading: false,
  }),
  usePartyAlignment: () => ({
    data: {
      total_parties: 2,
      parties: [
        { party: "PL", politician_count: 98, avg_score: 89.2, alignment_level: "alta", criteria: { life_protection: 92, family_values: 90, moral_integrity: 88, social_responsibility: 85, religious_freedom: 91 } },
        { party: "PT", politician_count: 68, avg_score: 38.5, alignment_level: "baixa", criteria: { life_protection: 35, family_values: 38, moral_integrity: 42, social_responsibility: 45, religious_freedom: 33 } }
      ]
    },
    isLoading: false,
  })
}));

describe("VotingClusters Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    cleanup();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  const renderClusters = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <VotingClusters />
        </MemoryRouter>
      </QueryClientProvider>
    );

  it("renderiza o cabeçalho da página de Grupos de Votação", () => {
    renderClusters();
    expect(screen.getByText("Grupos de Votação")).toBeInTheDocument();
  });

  it("exibe o gráfico de alinhamento por partido", () => {
    renderClusters();
    expect(screen.getByText("Alinhamento por partido")).toBeInTheDocument();
  });
});
