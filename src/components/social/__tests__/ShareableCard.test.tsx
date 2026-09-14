import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShareableCard } from "../ShareableCard";
import type { PoliticianDetail } from "@/hooks/usePoliticianDetail";

const mockPolitician: Pick<
  PoliticianDetail,
  "id" | "name" | "currentParty" | "currentState" | "photoUrl" | "currentScore"
> = {
  id: 1,
  name: "Marco Feliciano",
  currentParty: "PL",
  currentState: "SP",
  photoUrl: "https://example.com/photo.jpg",
  currentScore: {
    lifeProtection: 90,
    familyValues: 85,
    moralIntegrity: 80,
    socialResponsibility: 75,
    religiousFreedom: 95,
    overall: 88.5,
    performanceLevel: "EXCELLENT",
    performanceLabel: "Aderência muito alta",
    performanceDescription: "",
    totalVotes: 42,
    consistencyScore: 0.85,
    lastCalculation: "2025-01-01T00:00:00Z",
  },
};

describe("ShareableCard", () => {
  it("renders the politician name, party and state", () => {
    render(<ShareableCard politician={mockPolitician} />);
    expect(screen.getByText("Marco Feliciano")).toBeInTheDocument();
    expect(screen.getByText("PL - SP")).toBeInTheDocument();
  });

  it("renders the overall score", () => {
    render(<ShareableCard politician={mockPolitician} />);
    expect(screen.getByText("88,5")).toBeInTheDocument();
  });

  // Regressão pro achado real (2026-08-20): o card nunca tinha sido
  // renderizado em lugar nenhum e tinha domínio errado
  // (abancadaevangelica.com.br, nunca existiu) e contagem de critérios
  // errada ("7 pilares" — a Metodologia real publica 5).
  it("shows the real domain, not the old non-existent one", () => {
    render(<ShareableCard politician={mockPolitician} />);
    expect(screen.getByText("a-bancada-evangelica.vercel.app")).toBeInTheDocument();
    expect(screen.queryByText(/abancadaevangelica\.com\.br/)).not.toBeInTheDocument();
  });

  it("shows the real criteria count, not a stale hardcoded number", () => {
    render(<ShareableCard politician={mockPolitician} />);
    expect(screen.getByText(/5 critérios ponderados/)).toBeInTheDocument();
  });

  it("does not crash when currentScore is missing", () => {
    const withoutScore = { ...mockPolitician, currentScore: undefined };
    render(<ShareableCard politician={withoutScore} />);
    expect(screen.getByText("Marco Feliciano")).toBeInTheDocument();
    expect(screen.getByText("Sem dados")).toBeInTheDocument();
  });

  it("renders download and share buttons", () => {
    render(<ShareableCard politician={mockPolitician} />);
    expect(screen.getByRole("button", { name: /baixar card/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /compartilhar card/i })).toBeInTheDocument();
  });

  it("renders the detailed variant without crashing", () => {
    render(<ShareableCard politician={mockPolitician} type="detailed" />);
    expect(screen.getByText("Marco Feliciano")).toBeInTheDocument();
  });
});
