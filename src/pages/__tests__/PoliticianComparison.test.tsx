import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PoliticianComparison } from "../PoliticianComparison";

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

const { useComparisonDataMock } = vi.hoisted(() => ({
  useComparisonDataMock: vi.fn(),
}));

vi.mock("@/hooks/useComparisonData", () => ({
  useComparisonData: useComparisonDataMock,
}));

const successPayload = (ids: number[]) => ({
  data: ids.map((id) => ({
    id,
    name: id === 1 ? "João Silva" : "Maria Santos",
    fullName: id === 1 ? "João Carlos Silva Santos" : "Maria José dos Santos",
    currentParty: id === 1 ? "PL" : "REPUBLICANOS",
    currentState: id === 1 ? "SP" : "RJ",
    currentHouse: "camara",
    photoUrl: "",
    currentScore: {
      lifeProtection: 90,
      familyValues: 85,
      moralIntegrity: 80,
      socialResponsibility: 75,
      religiousFreedom: 88,
      overall: id === 1 ? 87.3 : 84.1,
      performanceLevel: "EXCELLENT",
      performanceLabel: "Aderência muito alta",
      totalVotes: 150,
      consistencyScore: 90
    }
  })),
  isLoading: false,
  error: null,
});

describe("PoliticianComparison Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    cleanup();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useComparisonDataMock.mockReturnValue(successPayload([]));
  });

  const renderComparison = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PoliticianComparison />
        </MemoryRouter>
      </QueryClientProvider>
    );

  it("renderiza o título da página do comparador", () => {
    renderComparison();
    expect(screen.getByText(/Comparar Parlamentares/i)).toBeInTheDocument();
  });

  it("exibe o seletor de parlamentares quando a lista está vazia", () => {
    renderComparison();
    expect(screen.getByText(/Escolher o primeiro parlamentar/i)).toBeInTheDocument();
  });

  it("não fabrica dados quando a API falha — mostra erro honesto", () => {
    useComparisonDataMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("API error 500"),
    });
    renderComparison();
    expect(screen.getByText(/Não foi possível carregar os dados/i)).toBeInTheDocument();
    expect(screen.queryByText(/Parlamentar #/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/João Silva/i)).not.toBeInTheDocument();
  });
});
