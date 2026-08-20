import { describe, it, expect } from "vitest";
import { groupByCountMap } from "../politicians.utils";

describe("groupByCountMap", () => {
  it("transforma linhas de groupBy num mapa chave->contagem", () => {
    const rows = [
      { current_state: "SP", _count: 70 },
      { current_state: "MG", _count: 53 },
    ];
    const result = groupByCountMap(rows, r => r.current_state);
    expect(result).toEqual({ SP: 70, MG: 53 });
  });

  it("ordena por contagem decrescente, independente da ordem de entrada", () => {
    const rows = [
      { current_party: "PT", _count: 10 },
      { current_party: "PL", _count: 97 },
      { current_party: "MDB", _count: 42 },
    ];
    const result = groupByCountMap(rows, r => r.current_party);
    expect(Object.keys(result)).toEqual(["PL", "MDB", "PT"]);
  });

  it("retorna objeto vazio quando não há linhas (ex.: filtro sem resultado)", () => {
    const result = groupByCountMap([] as { current_state: string; _count: number }[], r => r.current_state);
    expect(result).toEqual({});
  });

  it("soma de todas as contagens bate com o total esperado (regressão pro achado real: filtro por partido deve refletir só esse partido)", () => {
    const rows = [{ current_party: "PL", _count: 97 }];
    const result = groupByCountMap(rows, r => r.current_party);
    const total = Object.values(result).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(97);
    expect(Object.keys(result)).toEqual(["PL"]);
  });
});
