import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NewsSection } from "../NewsSection";

vi.mock("@/lib/apiClient", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/lib/apiClient";

const apiFetchMock = vi.mocked(apiFetch);

function renderWithQuery(ui: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const mentions = [
  {
    id: 1,
    title: "Deputado X propõe novo projeto",
    url: "https://folha.com/artigo",
    sourceName: "Folha de S.Paulo",
    publishedAt: "2026-08-26T14:30:00.000Z",
  },
  {
    id: 2,
    title: "Deputado X critica proposta",
    url: "https://uol.com/outro",
    sourceName: "UOL",
    publishedAt: "2026-08-25T10:00:00.000Z",
  },
];

describe("NewsSection — #7 no perfil", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("não renderiza nada quando o político não tem menções aprovadas", async () => {
    apiFetchMock.mockResolvedValue([]);
    renderWithQuery(<NewsSection politicianId={12} />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledWith("/api/news/politicians/12"));
    // While loading the Card (with title) renders; after data resolves to []
    // the whole section returns null.
    await waitFor(() => expect(screen.queryByText("No noticiário")).not.toBeInTheDocument());
  });

  it("renderiza só menções aprovadas com fonte, data e link", async () => {
    apiFetchMock.mockResolvedValue(mentions);
    renderWithQuery(<NewsSection politicianId={12} />);

    await screen.findByText("Deputado X propõe novo projeto");
    expect(screen.getByText("Deputado X critica proposta")).toBeInTheDocument();
    expect(screen.getAllByText("Folha de S.Paulo").length).toBe(1);
    expect(screen.getByText("UOL")).toBeInTheDocument();
    expect(screen.getByText("26/08/2026")).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "https://folha.com/artigo")).toBe(true);
    expect(links.some((l) => l.getAttribute("rel") === "noopener noreferrer")).toBe(true);
  });
});