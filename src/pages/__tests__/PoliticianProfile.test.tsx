import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PoliticianProfile } from "../PoliticianProfile";

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

vi.mock("@/hooks/usePoliticianDetail", () => ({
  usePoliticianDetail: (id: number) => ({
    data: {
      id: 1,
      name: "João Silva",
      fullName: "João Carlos Silva Santos",
      currentParty: "PL",
      currentState: "SP",
      currentHouse: "camara",
      photoUrl: "",
      email: "joao.silva@camara.leg.br",
      isFpeMember: true,
      fpe: {
        tier: "REGISTRADO",
        source: "Câmara dos Deputados (Frente 54477)",
        sourceUrl: "https://www.camara.leg.br/frentes/54477",
        capturedAt: "2026-08-25",
      },
      mandates: [
        { id: 101, house: "camara", party: "PL", state: "SP", legislature: "57", startDate: "2023-02-01", isCurrent: true }
      ],
      currentScore: {
        lifeProtection: 92.5,
        familyValues: 90.0,
        moralIntegrity: 85.0,
        socialResponsibility: 78.0,
        religiousFreedom: 88.0,
        overall: 87.3,
        performanceLevel: "EXCELLENT",
        performanceLabel: "Aderência muito alta",
        totalVotes: 156,
        consistencyScore: 91,
        lastCalculation: "2026-08-25T03:00:00Z",
      },
      recentVotes: [
        {
          id: "v1",
          agendaTitle: "PL 2159/2021 — Licenciamento Ambiental",
          criteria: "SOCIAL_RESPONSIBILITY",
          vote: "YES",
          appliedScore: 100,
          voteDate: "2023-06-13",
          source: "CAMARA",
          sourceVoteId: "sv1",
          sourcePropositionId: "2159-2021"
        }
      ],
      expenseAnalysis: {
        totalValue: 125000,
        suspiciousValue: 0,
        suspiciousPercentage: 0,
        totalCount: 450,
        integrityScore: 100,
        riskLevel: "LOW"
      },
      votesPerCriteria: {
        lifeProtection: { count: 47, totalImpact: 4700 },
        familyValues: { count: 39, totalImpact: 3900 },
        moralIntegrity: { count: 31, totalImpact: 3100 },
        socialResponsibility: { count: 23, totalImpact: 2300 },
        religiousFreedom: { count: 16, totalImpact: 1600 }
      },
      campaignFinance: {
        electionYear: 2022,
        totalReceived: 500000,
        donationCount: 25,
        largestDonation: 50000,
        donorPfCount: 20,
        donorPjCount: 5,
        topDonors: [{ name: "Doador Exemplo", doc: "***123***", amount: 50000, count: 1 }]
      }
    },
    isLoading: false,
    error: null,
  })
}));

vi.mock("@/hooks/usePoliticianNews", () => ({
  usePoliticianNews: () => ({
    data: [
      { id: 1, title: "Notícia sobre João Silva", url: "https://g1.globo.com", sourceName: "G1", publishedAt: "2026-08-20" }
    ],
    isLoading: false,
  })
}));

describe("PoliticianProfile Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    cleanup();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  const renderProfile = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/politicos/1"]}>
          <Routes>
            <Route path="/politicos/:id" element={<PoliticianProfile />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  it("renderiza o nome, partido e estado do parlamentar", () => {
    renderProfile();
    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getAllByText(/PL/i).length).toBeGreaterThan(0);
  });

  it("exibe a pontuação de aderência e o nível", () => {
    renderProfile();
    expect(screen.getByText(/87,3/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Aderência muito alta/i).length).toBeGreaterThan(0);
  });

  it("renderiza as abas de navegação do perfil", () => {
    renderProfile();
    expect(screen.getByRole("tab", { name: /visão geral/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /desempenho/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /votações/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /gastos/i })).toBeInTheDocument();
  });
});
