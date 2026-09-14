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

  it("renders all five criteria scores", () => {
    renderWithRouter(<PoliticianCard politician={mockPolitician} />);
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("95")).toBeInTheDocument();
  });

  it("renders performance badge label", () => {
    renderWithRouter(<PoliticianCard politician={mockPolitician} />);
    expect(screen.getByText("Aderência muito alta")).toBeInTheDocument();
  });

  it("renders the rank when provided", () => {
    renderWithRouter(<PoliticianCard politician={mockPolitician} rank={1} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders the consistency percentage", () => {
    renderWithRouter(<PoliticianCard politician={mockPolitician} />);
    expect(screen.getByText("85% consistência")).toBeInTheDocument();
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
});
