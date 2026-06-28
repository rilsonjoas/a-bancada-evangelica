import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VotingStatsCard } from "../VotingStatsCard";
import { Vote } from "lucide-react";

describe("VotingStatsCard", () => {
  const defaultProps = {
    title: "Total de Votações",
    value: 1247,
    subtitle: "Monitoradas",
    icon: <Vote className="w-6 h-6" data-testid="vote-icon" />,
  };

  it("renders the title", () => {
    render(<VotingStatsCard {...defaultProps} />);
    expect(screen.getByText("Total de Votações")).toBeInTheDocument();
  });

  it("renders the formatted value", () => {
    render(<VotingStatsCard {...defaultProps} />);
    expect(screen.getByText("1247")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<VotingStatsCard {...defaultProps} />);
    expect(screen.getByText("Monitoradas")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    render(<VotingStatsCard {...defaultProps} />);
    expect(screen.getByTestId("vote-icon")).toBeInTheDocument();
  });

  it("renders trend badge when provided with positive value", () => {
    render(
      <VotingStatsCard
        {...defaultProps}
        trend={{ value: 12, isPositive: true }}
      />
    );
    expect(screen.getByText("+12%")).toBeInTheDocument();
  });

  it("renders trend badge for negative trend (no sign prefix)", () => {
    render(
      <VotingStatsCard
        {...defaultProps}
        trend={{ value: 5, isPositive: false }}
      />
    );
    expect(screen.getByText("5%")).toBeInTheDocument();
  });

  it("handles string values", () => {
    render(<VotingStatsCard {...defaultProps} value="68%" />);
    expect(screen.getByText("68%")).toBeInTheDocument();
  });
});
