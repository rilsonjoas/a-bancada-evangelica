import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PoliticianCard from "../PoliticianCard";
import type { APIPolitician } from "@/types/politician";

const mockPolitician: APIPolitician = {
  id: 1,
  name: "Marco Feliciano",
  currentParty: "PL",
  currentState: "SP",
  currentHouse: "CAMARA",
  photoUrl: "https://example.com/photo.jpg",
  scores: {
    lifeProtection: 90,
    familyValues: 85,
    moralIntegrity: 80,
    socialResponsibility: 75,
    religiousFreedom: 95,
    overall: 88.5,
    performanceLevel: "EXCELLENT",
    performanceLabel: "Aderência muito alta",
    totalVotes: 42,
    consistencyScore: 0.85,
    lastCalculation: "2025-01-01T00:00:00Z",
  },
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("PoliticianCard", () => {
  it("renders the politician name", () => {
    renderWithRouter(<PoliticianCard politician={mockPolitician} />);
    expect(screen.getByText("Marco Feliciano")).toBeInTheDocument();
  });

  it("renders party and state", () => {
    renderWithRouter(<PoliticianCard politician={mockPolitician} />);
    expect(screen.getByText("PL")).toBeInTheDocument();
    expect(screen.getByText("SP")).toBeInTheDocument();
  });

  it("renders the overall score (rounded)", () => {
    renderWithRouter(<PoliticianCard politician={mockPolitician} />);
    expect(screen.getByText("89")).toBeInTheDocument();
  });

  it("renders the scores of criteria with measured votes", () => {
    renderWithRouter(<PoliticianCard politician={mockPolitician} />);
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("75")).toBeInTheDocument();
  });

  it("does not show party-seed numbers for criteria without measured votes", () => {
    // Passe de honestidade 2026-09-27: Vida (90) e Religião (95) são semente
    // do partido; o card mostra "—" em vez do número.
    renderWithRouter(<PoliticianCard politician={mockPolitician} />);
    expect(screen.queryByText("90")).not.toBeInTheDocument();
    expect(screen.queryByText("95")).not.toBeInTheDocument();
    expect(screen.getAllByText("sem voto medido")).toHaveLength(2);
  });

  it("badge describes the vote base, not a judgment band", () => {
    renderWithRouter(<PoliticianCard politician={mockPolitician} />);
    expect(screen.getByText("42 votos próprios")).toBeInTheDocument();
    expect(screen.queryByText(/Aderência/)).not.toBeInTheDocument();
  });

  it("renders the rank when provided", () => {
    renderWithRouter(<PoliticianCard politician={mockPolitician} rank={1} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders the consistency percentage", () => {
    renderWithRouter(<PoliticianCard politician={mockPolitician} />);
    expect(screen.getByText(/85%/)).toBeInTheDocument();
    expect(screen.getByText("consistência")).toBeInTheDocument();
  });

  it("renders house badge", () => {
    renderWithRouter(<PoliticianCard politician={mockPolitician} />);
    expect(screen.getByText("Deputado(a)")).toBeInTheDocument();
  });

  it("links to the politician detail page", () => {
    renderWithRouter(<PoliticianCard politician={mockPolitician} />);
    const link = screen.getByRole("link", { name: /ver detalhes/i });
    expect(link).toHaveAttribute("href", "/politicos/1");
  });

  it("falls back to User icon when photo is missing", () => {
    const withoutPhoto = { ...mockPolitician, photoUrl: undefined };
    renderWithRouter(<PoliticianCard politician={withoutPhoto} />);
    expect(screen.getByTestId("user-icon")).toBeInTheDocument();
  });

  it("shows vote count when totalVotes > 0", () => {
    renderWithRouter(<PoliticianCard politician={mockPolitician} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("shows honest estimated badge instead of trust level when totalVotes is 0", () => {
    const withoutVotes: APIPolitician = {
      ...mockPolitician,
      scores: { ...mockPolitician.scores, totalVotes: 0, overall: 78, performanceLevel: "GOOD", performanceLabel: "Aderência alta" },
    };
    renderWithRouter(<PoliticianCard politician={withoutVotes} />);
    expect(screen.getByText("Nota estimada por partido")).toBeInTheDocument();
    expect(screen.queryByText("Aderência alta")).not.toBeInTheDocument();
    expect(screen.queryByText("Aderência moderada")).not.toBeInTheDocument();
  });

  it("shows 'Sem dados' badge when politician has no score at all", () => {
    const noScore: APIPolitician = {
      ...mockPolitician,
      scores: {
        ...mockPolitician.scores,
        performanceLevel: "GOOD",
        performanceLabel: "Aderência alta",
        totalVotes: undefined as unknown as number,
        overall: 0,
      },
    };
    renderWithRouter(<PoliticianCard politician={noScore} />);
    expect(screen.getByText("Sem dados")).toBeInTheDocument();
    expect(screen.queryByText("Aderência alta")).not.toBeInTheDocument();
  });
});
