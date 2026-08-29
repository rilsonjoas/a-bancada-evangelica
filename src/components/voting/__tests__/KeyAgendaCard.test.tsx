import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KeyAgendaCard } from "../KeyAgendaCard";

const baseAgenda = {
  id: "ag1",
  title: "PL 2159/2021 — Licenciamento ambiental",
  description: "Regras para licenciar obras que afetam o meio ambiente.",
  criteria: "SOCIAL_RESPONSIBILITY",
  totalVotes: 444,
  favorableVotes: 300,
  contraryVotes: 140,
  abstentions: 4,
  consensusScore: 68,
  firstVoteDate: "2025-07-16T00:00:00.000Z",
  lastVoteDate: "2025-07-16T00:00:00.000Z",
};

describe("KeyAgendaCard — M5 impacto leigo", () => {
  it("não renderiza o bloco 'Na prática' quando practicalImpact está ausente", () => {
    render(<KeyAgendaCard agenda={baseAgenda} />);
    expect(
      screen.queryByText("Na prática, isso significa…")
    ).not.toBeInTheDocument();
  });

  it("renderiza o bloco 'Na prática' quando practicalImpact está presente", () => {
    render(
      <KeyAgendaCard
        agenda={{
          ...baseAgenda,
          practicalImpact: "Na prática: o texto unifica as regras de licenciamento ambiental.",
        }}
      />
    );
    expect(
      screen.getByText("Na prática, isso significa…")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Na prática: o texto unifica as regras de licenciamento ambiental.")
    ).toBeInTheDocument();
  });
});