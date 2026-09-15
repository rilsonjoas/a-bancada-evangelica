import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useComparisonData } from "../useComparisonData";

const { apiFetchMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiFetch: apiFetchMock,
}));

describe("useComparisonData — regra '0 honesto > número fabricado'", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("retorna os parlamentares reais quando a API responde", async () => {
    apiFetchMock.mockResolvedValue({ id: 1, name: "Deputado Real" });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useComparisonData([1]), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, name: "Deputado Real" }]);
  });

  it("NÃO fabrica parlamentar sintético quando a API falha — expõe o erro", async () => {
    apiFetchMock.mockRejectedValue(new Error("API error 500"));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useComparisonData([1]), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
  });
});