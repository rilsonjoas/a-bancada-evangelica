import { describe, it, expect } from 'vitest';
import {
  ABSOLUTE_CEILING,
  MAD_FLOOR_RATIO,
  MAX_EXPENSE_PENALTY,
  MIN_BASELINE_N,
  ROBUST_Z_LIMIT,
  SUSPICION_THRESHOLD,
  baselineKey,
  buildBaseline,
  computeBaselines,
  computeExpensePenalty,
  evaluateExpense,
  evaluateExpenses,
  normalizeCategory,
  type BaselineRow,
  type CategoryBaseline,
  type ExpenseLike,
} from '../lib/expense-rules';

function despesa(over: Partial<ExpenseLike> = {}): ExpenseLike {
  return {
    net_value: 100,
    refund_value: null,
    expense_type: 'COMBUSTIVEIS E LUBRIFICANTES',
    supplier_name: 'POSTO IPIRANGA LTDA',
    supplier_document: '12345678000199',
    year: 2025,
    source: 'CAMARA',
    ...over,
  };
}

describe('normalizeCategory', () => {
  it('agrupa variações de caixa, acento, espaço e ponto final', () => {
    const a = normalizeCategory('COMBUSTÍVEIS E LUBRIFICANTES.');
    const b = normalizeCategory('combustiveis e lubrificantes');
    expect(a).toBe(b);
  });

  it('colapsa espaços internos repetidos', () => {
    expect(normalizeCategory('DIVULGAÇÃO   DA  ATIVIDADE  PARLAMENTAR'))
      .toBe('DIVULGACAO DA ATIVIDADE PARLAMENTAR');
  });

  it('não quebra em null/undefined/vazio', () => {
    expect(normalizeCategory(null)).toBe('SEM CATEGORIA');
    expect(normalizeCategory(undefined)).toBe('SEM CATEGORIA');
    expect(normalizeCategory('   ')).toBe('SEM CATEGORIA');
  });
});

describe('buildBaseline', () => {
  it('aplica o piso de MAD para não explodir quando todos os valores são iguais', () => {
    const bl = buildBaseline('X', 2025, [100, 100, 100, 100, 100]);
    expect(bl.mad).toBeGreaterThan(0);
    expect(bl.mad).toBe(100 * MAD_FLOOR_RATIO);
  });

  it('calcula mediana e p99 reais', () => {
    const vals = Array.from({ length: 100 }, (_, i) => i + 1);
    const bl = buildBaseline('X', 2025, vals);
    expect(bl.median).toBe(50.5);
    expect(bl.p99).toBe(99.01);
    expect(bl.n).toBe(100);
  });
});

describe('computeBaselines', () => {
  const rows: BaselineRow[] = Array.from({ length: 40 }, (_, i) => ({
    category: 'TAXI', year: 2025, value: 20 + (i % 10),
  }));

  it('usa o bucket (categoria, ano) quando n é suficiente', () => {
    const bl = computeBaselines(rows);
    const found = bl.get(baselineKey('TAXI', 2025));
    expect(found?.year).toBe(2025);
    expect(found?.n).toBe(40);
  });

  it('cai no pool (year=null) quando o bucket do ano é fino mas a categoria tem n', () => {
    const misturado: BaselineRow[] = [
      ...Array.from({ length: 40 }, (_, i) => ({ category: 'TAXI', year: 2025, value: 20 + (i % 10) })),
      { category: 'TAXI', year: 2024, value: 30 },
    ];
    const bl = computeBaselines(misturado);
    const fino = bl.get(baselineKey('TAXI', 2024));
    expect(fino?.year).toBeNull();
    expect(fino?.n).toBe(41);
  });

  it('NÃO cria baseline quando nem o pool atinge o mínimo — zero honesto', () => {
    const r: BaselineRow[] = Array.from({ length: 5 }, (_, i) => ({
      category: 'RARISSIMA', year: 2025, value: i,
    }));
    const bl = computeBaselines(r);
    expect(bl.get(baselineKey('RARISSIMA', 2025))).toBeUndefined();
  });

  it('NÃO deixa o pool de uma categoria vazar para o baseline de outra', () => {
    // Regressão real (2026-09-25): o loop interno percorria TODOS os buckets
    // sem filtrar pela categoria, então uma categoria fina herdava o pool da
    // última categoria grande. Na prática uma categoria de 25 despesas
    // recebia baseline com n=2.746 e mediana R$ 1.490 em vez de R$ 28.000.
    const rows: BaselineRow[] = [
      // categoria grande, n bem acima do mínimo
      ...Array.from({ length: 200 }, (_, i) => ({ category: 'GRANDE', year: 2025, value: 1000 + i })),
      // categoria fina: nunca deve receber baseline
      ...Array.from({ length: 25 }, (_, i) => ({ category: 'FINA', year: 2025, value: 20_000 + i * 500 })),
    ];
    const bl = computeBaselines(rows);
    expect(bl.get(baselineKey('FINA', 2025))).toBeUndefined();
    const grande = bl.get(baselineKey('GRANDE', 2025));
    expect(grande?.n).toBe(200);
    expect(grande?.median).toBe(1099.5);
  });

  it('mantém as categorias separadas quando ambas têm n suficiente', () => {
    const rows: BaselineRow[] = [
      ...Array.from({ length: 40 }, (_, i) => ({ category: 'A', year: 2025, value: 10 + i })),
      ...Array.from({ length: 40 }, (_, i) => ({ category: 'B', year: 2025, value: 10_000 + i * 100 })),
    ];
    const bl = computeBaselines(rows);
    expect(bl.get(baselineKey('A', 2025))?.median).toBeCloseTo(29.5);
    expect(bl.get(baselineKey('B', 2025))?.median).toBeCloseTo(11_950);
  });

  it('ignora valor negativo ou não finito', () => {
    const r: BaselineRow[] = [
      { category: 'X', year: 2025, value: -50 },
      { category: 'X', year: 2025, value: Number.NaN },
    ];
    expect(computeBaselines(r).size).toBe(0);
  });

  it('usa o mínimo documentado', () => {
    expect(MIN_BASELINE_N).toBe(30);
  });
});

describe('computeExpensePenalty — proporcional, não por volume', () => {
  it('não penaliza quem não tem dado de despesa', () => {
    // Ausência de dado NUNCA vira penalidade — 556 dos 730 parlamentares
    // registrados não têm despesa sincronizada.
    expect(computeExpensePenalty({ totalExpenses: 0, suspiciousCount: 0, avgSuspicion: 0 })).toBe(0);
  });

  it('não penaliza quem tem despesa e nenhuma marcação', () => {
    expect(computeExpensePenalty({ totalExpenses: 300, suspiciousCount: 0, avgSuspicion: 0 })).toBe(0);
  });

  it('pune proporção, não contagem — o caso que motivou a correção', () => {
    // Mesma contagem de marcações (9), proporções muito diferentes.
    // 9 em 300 = 3% → penalidade baixa.
    const extenso = computeExpensePenalty({ totalExpenses: 300, suspiciousCount: 9, avgSuspicion: 30 });
    // 9 em 40 = 22,5% → penalidade alta (22,5 de 25 com severidade 0,8).
    const concentrado = computeExpensePenalty({ totalExpenses: 40, suspiciousCount: 9, avgSuspicion: 30 });
    expect(extenso).toBeLessThan(4);
    expect(concentrado).toBeGreaterThan(20);
    expect(concentrado).toBeGreaterThan(extenso * 5);
  });

  it('satura no teto com proporção alta E severidade alta', () => {
    const p = computeExpensePenalty({ totalExpenses: 40, suspiciousCount: 12, avgSuspicion: 55 });
    expect(p).toBe(MAX_EXPENSE_PENALTY);
  });

  it('NÃO satura por ter muitas despesas (regressão do defeito antigo)', () => {
    // A fórmula antiga (nº_suspeitas × 3) dava 27 → saturava em 25.
    // Medido em 2026-09-25: 31 dos 174 parlamentares com despesa (18%)
    // saturavam no teto só por volume.
    const p = computeExpensePenalty({ totalExpenses: 500, suspiciousCount: 9, avgSuspicion: 30 });
    expect(p).toBeLessThan(MAX_EXPENSE_PENALTY);
    expect(p).toBeLessThan(5);
  });

  it('escala linearmente com a proporção até saturar', () => {
    const base = { totalExpenses: 100, avgSuspicion: 0 };
    const cinco = computeExpensePenalty({ ...base, suspiciousCount: 5 });
    const dez = computeExpensePenalty({ ...base, suspiciousCount: 10 });
    expect(cinco).toBeGreaterThan(0);
    expect(dez).toBeCloseTo(cinco * 2, 5);
  });

  it('pondera pela severidade das marcações', () => {
    const base = { totalExpenses: 100, suspiciousCount: 8 };
    const trivial = computeExpensePenalty({ ...base, avgSuspicion: 8 });
    const grave = computeExpensePenalty({ ...base, avgSuspicion: 60 });
    expect(grave).toBeGreaterThan(trivial);
  });

  it('nunca devolve negativo nem acima do teto', () => {
    for (const avg of [-10, 0, 30, 100]) {
      const p = computeExpensePenalty({ totalExpenses: 100, suspiciousCount: 100, avgSuspicion: avg });
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(MAX_EXPENSE_PENALTY);
    }
  });
});

describe('evaluateExpense — regras absolutas (sem baseline)', () => {
  it('não marca despesa comum com fornecedor identificado', () => {
    const v = evaluateExpense(despesa());
    expect(v.is_suspicious).toBe(false);
    expect(v.suspicion_score).toBe(0);
  });

  it('fornecedor sem documento sozinho NÃO marca (15 < 20)', () => {
    const v = evaluateExpense(despesa({ supplier_document: null }));
    expect(v.suspicion_score).toBe(15);
    expect(v.is_suspicious).toBe(false);
  });

  it('glosa + fornecedor sem documento marca (20 + 15 = 35)', () => {
    const v = evaluateExpense(despesa({ refund_value: 500, supplier_document: null }));
    expect(v.is_suspicious).toBe(true);
    expect(v.suspicion_reasons).toContain('Possui valor glosado');
  });

  it('nome de fornecedor genérico marca sozinho (15) apenas somado', () => {
    const v = evaluateExpense(despesa({ supplier_name: 'PESSOA FISICA' }));
    expect(v.suspicion_reasons.some(r => r.includes('genérico'))).toBe(true);
  });

  it('backstop absoluto da Câmara em 50.000', () => {
    expect(evaluateExpense(despesa({ net_value: 50_001 })).is_suspicious).toBe(true);
    expect(evaluateExpense(despesa({ net_value: 50_000 })).is_suspicious).toBe(false);
  });

  it('backstop do Senado em 100.000 (o threshold divergente que existia duplicado)', () => {
    const noSenado = { source: 'SENADO' as const };
    expect(evaluateExpense(despesa({ ...noSenado, net_value: 60_000 })).is_suspicious).toBe(false);
    expect(evaluateExpense(despesa({ ...noSenado, net_value: 100_001 })).is_suspicious).toBe(true);
    expect(ABSOLUTE_CEILING.CAMARA).toBe(50_000);
    expect(ABSOLUTE_CEILING.SENADO).toBe(100_000);
  });

  it('respeita o corte canônico de 20', () => {
    expect(SUSPICION_THRESHOLD).toBe(20);
    const exatamente = evaluateExpense(despesa({ refund_value: 20 }));
    expect(exatamente.is_suspicious).toBe(false);
  });
});

describe('evaluateExpense — corte robusto (o ponto do projeto)', () => {
  const CAT = 'SERVICO DE TAXI, PEDAGIO E ESTACIONAMENTO';

  // Reproduz a CAUDA REAL de táxi/pedágio medida em produção:
  // mediana R$ 26, p95 R$ 499, máx R$ 2.700 (n = 3.014).
  // Determinístico de propósito — uma versão anterior usava Math.random()
  // e o teste ficava flaky (p99 oscilava e a asserção mudava de resultado
  // entre rodadas). Teste flaky é pior que teste ausente.
  function taxiReal(): Map<string, CategoryBaseline> {
    const valores = [
      ...Array.from({ length: 1800 }, (_, i) => 20 + (i % 11)),  // núcleo
      ...Array.from({ length: 150 }, (_, i) => 100 + i * 2),      // cauda média
      ...Array.from({ length: 45 }, (_, i) => 500 + i * 9),       // cauda alta
      ...Array.from({ length: 5 }, (_, i) => 1500 + i * 300),     // topo
    ];
    return computeBaselines(
      valores.map(value => ({ category: CAT, year: 2025, value })),
    );
  }

  it('NÃO marca o p95 da categoria — é caro mas normal', () => {
    const bl = taxiReal();
    const b = bl.get(baselineKey(CAT, 2025))!;
    // valor no p95 real da categoria
    const v = evaluateExpense(despesa({ expense_type: CAT, net_value: 499 }), { baselines: bl });
    expect(v.robust_z).toBeGreaterThan(ROBUST_Z_LIMIT);
    expect(v.is_suspicious).toBe(false);
    expect(b.p99).toBeGreaterThan(0);
  });

  it('NÃO marca o p99 da própria categoria — o portão de percentil existe por isso', () => {
    const bl = taxiReal();
    const b = bl.get(baselineKey(CAT, 2025))!;
    const v = evaluateExpense(
      despesa({ expense_type: CAT, net_value: b.p99 - 1 }),
      { baselines: bl },
    );
    expect(v.is_suspicious).toBe(false);
  });

  it('marca o que é absurdo para a categoria MUITO abaixo do teto absoluto', () => {
    const bl = taxiReal();
    // R$ 4.000 é 8% do teto de R$ 50.000 — passaria batido na regra antiga.
    const v = evaluateExpense(
      despesa({ expense_type: CAT, net_value: 4_000 }),
      { baselines: bl },
    );
    expect(v.is_suspicious).toBe(true);
    expect(v.robust_z).toBeGreaterThan(ROBUST_Z_LIMIT);
    expect(v.suspicion_reasons.some(r => r.includes('mais caras'))).toBe(true);
  });

  it('o motivo diz exatamente o que o corte fez, sem adjetivo', () => {
    const v = evaluateExpense(
      despesa({ expense_type: CAT, net_value: 9_000 }),
      { baselines: taxiReal() },
    );
    const motivo = v.suspicion_reasons.join(' ');
    expect(motivo).toMatch(/Entre as 1% despesas mais caras/);
    expect(motivo).toMatch(/mediana da categoria: R\$/);
    // "muito acima do padrão" inflaria a evidência — a média da categoria
    // é R$ 26 e o p99 é ~R$ 900; o texto precisa deixar o usuário judge.
    expect(motivo).not.toMatch(/muito acima/i);
  });

  it('taxa de marcação fica em torno de 1% por categoria (portão de percentil)', () => {
    const bl = taxiReal();
    const b = bl.get(baselineKey(CAT, 2025))!;
    const acima = [b.p99 + 1, b.p99 * 1.5, b.p99 * 2, b.p99 * 3];
    for (const valor of acima) {
      const v = evaluateExpense(despesa({ expense_type: CAT, net_value: valor }), { baselines: bl });
      expect(v.is_suspicious).toBe(true);
    }
  });

  it('ignora despesa cuja categoria não tem baseline (só valem as regras absolutas)', () => {
    const v = evaluateExpense(
      despesa({ expense_type: 'CATEGORIA QUE NAO EXISTE', net_value: 1_000 }),
      { baselines: taxiReal() },
    );
    expect(v.robust_z).toBeNull();
    expect(v.is_suspicious).toBe(false);
  });

  it('avalia lote com o mesmo resultado da avaliação individual', () => {
    const bl = taxiReal();
    const lote = [
      despesa({ expense_type: CAT, net_value: 4_000 }),
      despesa({ expense_type: CAT, net_value: 25 }),
    ];
    const emLote = evaluateExpenses(lote, bl);
    const individual = lote.map(e => evaluateExpense(e, { baselines: bl }));
    expect(emLote.map(v => v.is_suspicious)).toEqual(individual.map(v => v.is_suspicious));
  });
});
