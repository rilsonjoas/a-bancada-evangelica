/**
 * EXPENSE_RULES — FONTE ÚNICA das regras de suspeita de despesa parlamentar.
 *
 * Achado real (2026-09-25): as regras de suspeita existiam DUPLICADAS e
 * DIVERGENTES em três lugares —
 *   - scripts/sync-all-gastos.ts  (Câmara, corte R$ 50.000)
 *   - scripts/sync-camara.ts      (Câmara, corte R$ 50.000)
 *   - scripts/sync-senado.ts      (Senado, corte R$ 100.000, sem suspicion_score)
 * — e um quarto conjunto, mais sofisticado, em scripts/expense-analyzer.ts
 * (7 regras) que NUNCA entrou no cron do sync-worker.
 *
 * E o conjunto todo não funcionava. Medido em produção (74.336 despesas,
 * 174 dos 730 parlamentares com despesa registrada):
 *   - 23 despesas marcadas is_suspicious (0,03%)
 *   - 14 parlamentares com ao menos uma suspeita
 *   - suspiciously médio entre quem tem despesa: 0,082%
 * Ou seja: o card "Gastos fora do padrão" mostrava zero para ~92% dos
 * perfis com despesa, e a penalidade de Integridade Moral era praticamente
 * constante para todo mundo.
 *
 * POR QUE O CORTE FIXO NÃO FUNCIONA — o p95 por categoria varia 130x:
 *   Táxi/pedágio ....... mediana R$   26 | p95 R$   499 | máx R$  2.700
 *   Alimentação ......... mediana R$   58 | p95 R$   153 | máx R$    454
 *   Combustíveis ....... mediana R$  235 | p95 R$   450 | máx R$  9.121
 *   Consultorias ....... mediana R$ 1.500 | p95 R$ 15.000 | máx R$ 110.000
 *   Divulgação ......... mediana R$ 2.500 | p95 R$ 20.000 | máx R$ 175.000
 * Um limiar único em R$ 50.000 é cego (uma despesa de táxi de R$ 5.000 é
 * 200x a mediana da categoria e passa batido) e ruidoso ao mesmo tempo.
 *
 * A correção é BASELINE RELATIVA E ROBUSTA por categoria: mediana + MAD
 * (desvio absoluto mediano). É o corte certo para dado heavy-tailed como
 * despesa congressional, e é o que a sugestão de "mediana em vez de média"
 * pretendia — com a diferença de que hoje não existe média nenhuma
 * definindo o corte, e sim três constantes literais.
 *
 * SOBRE AS 7 REGRAS DO ANALYZER — auditadas uma a uma contra o dado real
 * (174 parlamentares com despesa) antes de trazer qualquer uma:
 *   R4 SUPPLIER_CONCENTRATION (1 fornecedor > 50% do mês) → 116/174 = 67% FP. DESCARTADA
 *   R5 HIGH_FREQUENCY (>20 despesas do mesmo tipo/mês) .... →  98/174 = 56% FP. DESCARTADA
 *   R6 TEMPORAL_PATTERN (>70% no fim do mês) .............. →   0/174 =  0% (morta). REMOVIDA
 *   R7 ROUND_VALUES (>30% dos valores redondos) ........... →   2/174 =  1% FP. MANTIDA
 *   R1 HIGH_VALUE / R2 UNIDENTIFIED_SUPPLIER / R3 SUSPICIOUS_SUPPLIER_NAME → mantidas
 * Se o analyzer tivesse entrado no cron como estava, teria marcado 67% de
 * todos os parlamentares numa única rodada.
 *
 * `EXPENSE_RULES_VERSION` sobe a cada mudança real de regra.
 */

export type ExpenseHouse = 'CAMARA' | 'SENADO';

/** Corte canônico que decide `is_suspicious`. Preservado do comportamento anterior. */
export const SUSPICION_THRESHOLD = 20;

/** Sobe a versão quando as regras mudarem de verdade. */
export const EXPENSE_RULES_VERSION = '2.0.0';

export interface ExpenseLike {
  net_value: number;
  refund_value: number | null;
  expense_type: string | null;
  supplier_name: string | null;
  supplier_document: string | null;
  year: number;
  source: string;
}

export interface ExpenseVerdict {
  is_suspicious: boolean;
  suspicion_score: number;
  suspicion_reasons: string[];
  // Metadados do corte robusto — gravados em suspicion_reasons para
  // auditoria, e expostos aqui para teste e para o relatório de sanidade.
  robust_z: number | null;
  baseline_n: number | null;
}

/* ------------------------------------------------------------------ *
 * Normalização de categoria
 * ------------------------------------------------------------------ */

/**
 * Agrupa categorias equivalentes. A CEAP traz a mesma categoria com
 * variações de caixa, espaço e ponto final ("COMBUSTÍVEIS E LUBRIFICANTES."
 * vs "Combustíveis e lubrificantes"); sem isso cada variação vira um
 * baseline próprio e o n de cada um fica fino demais para mediana.
 */
export function normalizeCategory(raw: string | null | undefined): string {
  if (!raw) return 'SEM CATEGORIA';
  return raw
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[.\s]+$/, '')
    .trim() || 'SEM CATEGORIA';
}

/* ------------------------------------------------------------------ *
 * Baseline robusto: mediana + MAD por (categoria, ano)
 * ------------------------------------------------------------------ */

export interface CategoryBaseline {
  category: string;
  year: number | null; // null = bucket pooled (fallback de n fino)
  n: number;
  median: number;
  mad: number;       // já com o piso aplicado
  p99: number;
}

export interface BaselineRow {
  category: string;
  year: number;
  value: number;
}

/** n mínimo para trusting um bucket (categoria, ano) isolado. */
export const MIN_BASELINE_N = 30;

/**
 * Piso do MAD relativo: em categoria com valores redondos o MAD puro dá 0
 * e a divisão explode. Piso de 5% da mediana mantém o corte estável.
 */
export const MAD_FLOOR_RATIO = 0.05;

/**
 * Corte robusto padrão. 0.6745 normaliza o MAD para a escala de um desvio
 * padrão, e 3.5 é o limiar de Iglewicz-Hoaglin para "outlier" — convenção
 * estabelecida na literatura, não um número escolhido por gosto.
 */
export const ROBUST_Z_LIMIT = 3.5;

/**
 * Piso de percentil: o z robusto sozinho NÃO basta.
 *
 * Achado real (2026-09-25, medido com o fixture do teste): com núcleo
 * apertado (mediana R$ 23, MAD ~2), o MAD explode o z-score de QUALQUER
 * valor de cauda — R$ 600 num categoria cuja mediana é R$ 23 dá z = 155.
 * Applied à distribution real de táxi/pedágio (mediana R$ 26, p95 R$ 499,
 * máx R$ 2.700), o MAD sozinho marcaria ~15% das despesas da categoria:
 * detector de "atípico", não de "outlier".
 *
 * Por isso o corte robusto exige AS DUAS condições: z acima do limite E
 * valor acima do percentil de topo da própria categoria. O percentil é o
 * que ancora a taxa de marcação (~1% por categoria, por construção) e o
 * MAD é o que garante que o valor alto é mesmo anômalo e não só caro.
 * Para uma ferramenta que afeta a nota de alguém, ser conservador é
 * correto — "zero honesto > número fabricado".
 */
export const ROBUST_PERCENTILE = 0.99;

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function medianOf(values: number[]): number {
  return quantile([...values].sort((a, b) => a - b), 0.5);
}

/** Monta o baseline de um conjunto de valores. */
export function buildBaseline(
  category: string,
  year: number | null,
  values: number[],
): CategoryBaseline {
  const sorted = [...values].sort((a, b) => a - b);
  const median = quantile(sorted, 0.5);
  const rawMad = medianOf(sorted.map(v => Math.abs(v - median)));
  const mad = Math.max(rawMad, median * MAD_FLOOR_RATIO);
  return { category, year, n: sorted.length, median, mad, p99: quantile(sorted, 0.99) };
}

/**
 * Calcula baselines (categoria, ano) e o pool por categoria. Bucket com
 * n < MIN_BASELINE_N cai no pool de todos os anos; se o pool também for
 * fino, a categoria fica SEM baseline e só valem as regras absolutas —
 * honestidade sobre número fabricado.
 *
 * ACHADO REAL (2026-09-25): a primeira versão desta função tinha o loop
 * externo percorrendo as categorias e o interno percorrendo TODOS os
 * buckets sem filtrar pela categoria atual — o pool de uma categoria fina
 *acabava sobrescrevendo o baseline de outra, e uma categoria com 25
 * despesas recebia o baseline de uma com 2.746 (mediana R$ 1.490 em
 * vez de R$ 28.000). Os testes não pegaram porque usavam uma categoria
 * só; há teste de regressão com várias categorias agora.
 */
export function computeBaselines(rows: BaselineRow[]): Map<string, CategoryBaseline> {
  // categoria -> ano -> valores
  const byCatYear = new Map<string, Map<number, number[]>>();

  for (const r of rows) {
    if (!Number.isFinite(r.value) || r.value < 0) continue;
    let anos = byCatYear.get(r.category);
    if (!anos) {
      anos = new Map<number, number[]>();
      byCatYear.set(r.category, anos);
    }
    const valores = anos.get(r.year);
    if (valores) valores.push(r.value);
    else anos.set(r.year, [r.value]);
  }

  const out = new Map<string, CategoryBaseline>();
  for (const [cat, porAno] of byCatYear) {
    const todas = [...porAno.values()].flat();
    const pooled = todas.length >= MIN_BASELINE_N
      ? buildBaseline(cat, null, todas)
      : null;

    for (const [year, valores] of porAno) {
      const chosen = valores.length >= MIN_BASELINE_N
        ? buildBaseline(cat, year, valores)
        : pooled;
      if (chosen) out.set(baselineKey(cat, year), chosen);
    }
  }
  return out;
}

export function baselineKey(category: string, year: number): string {
  return `${category}|${year}`;
}

/* ------------------------------------------------------------------ *
 * Regras
 * ------------------------------------------------------------------ */

const SUSPICIOUS_SUPPLIER_NAMES = [
  'pessoa fisica',
  'sem nome',
  'nao informado',
  'diversos',
  'varios',
  'multiplos',
];

export interface EvaluateOptions {
  baselines?: Map<string, CategoryBaseline>;
  /** Backstop absoluto: nunca perder o sinal de valor muito alto. */
  absoluteCeiling?: number;
}

/**
 * Backstop absoluto por casa. Não é o corte principal (o corte é a mediana
 * da categoria) — é o piso de segurança para bucket sem baseline e para
 * o caso de o valor ser absurdo em qualquer métrica relativa.
 */
export const ABSOLUTE_CEILING: Record<ExpenseHouse, number> = {
  CAMARA: 50_000,
  SENADO: 100_000,
};

export function evaluateExpense(
  expense: ExpenseLike,
  options: EvaluateOptions = {},
): ExpenseVerdict {
  const reasons: string[] = [];
  let score = 0;
  let robustZ: number | null = null;
  let baselineN: number | null = null;

  const value = expense.net_value ?? 0;
  const house: ExpenseHouse = expense.source === 'SENADO' ? 'SENADO' : 'CAMARA';

  // --- R2: fornecedor sem documento identificador ---
  const doc = expense.supplier_document?.trim();
  if (!doc) {
    reasons.push('Fornecedor sem documento identificador');
    score += 15;
  }

  // --- R3: nome de fornecedor genérico/suspeito ---
  const supplierName = (expense.supplier_name ?? '').toLowerCase();
  if (supplierName && SUSPICIOUS_SUPPLIER_NAMES.some(n => supplierName.includes(n))) {
    reasons.push(`Nome de fornecedor genérico: "${expense.supplier_name}"`);
    score += 15;
  }

  // --- GLOSA: oParlamentar pediu reembolso e a Casa glosou ---
  if ((expense.refund_value ?? 0) > 0) {
    reasons.push('Possui valor glosado');
    score += 20;
  }

  // --- R7: valor redondo em faixa alta ---
  const isRound = value >= 10_000 && Number.isInteger(value) && value % 1000 === 0;
  if (isRound) {
    reasons.push('Valor redondo em faixa alta');
    score += 8;
  }

  // --- REGRA NOVA: corte robusto por categoria (mediana + MAD + percentil) ---
  const baselines = options.baselines;
  if (baselines) {
    const key = baselineKey(normalizeCategory(expense.expense_type), expense.year);
    const bl = baselines.get(key);
    if (bl && bl.mad > 0) {
      baselineN = bl.n;
      robustZ = (0.6745 * (value - bl.median)) / bl.mad;
      const abovePercentile = value > bl.p99;
      if (robustZ > ROBUST_Z_LIMIT && abovePercentile) {
        // Linguagem deliberadamente factual. A primeira versão dizia "muito
        // acima do padrão" para qualquer valor acima do p99 — mas 1,5x o p99
        // não é "muito acima", e o projeto tem como princípio que marcador
        // é diferença estatística, não acusação. O texto diz exatamente
        // o que o corte fez, para o usuário poder discordar dele.
        reasons.push(
          `Entre as ${((1 - ROBUST_PERCENTILE) * 100).toFixed(0)}% despesas mais caras de ` +
          `"${expense.expense_type}" (mediana da categoria: ` +
          `R$ ${bl.median.toLocaleString('pt-BR', { maximumFractionDigits: 0 })})`,
        );
        score += 25;
      }
    }
  }

  // --- Backstop absoluto ---
  const ceiling = options.absoluteCeiling ?? ABSOLUTE_CEILING[house];
  if (value > ceiling) {
    reasons.push(`Valor acima do teto absoluto (R$ ${ceiling.toLocaleString('pt-BR')})`);
    score += 30;
  }

  return {
    is_suspicious: score > SUSPICION_THRESHOLD,
    suspicion_score: Math.min(score, 100),
    suspicion_reasons: reasons,
    robust_z: robustZ,
    baseline_n: baselineN,
  };
}

/** Veredito em lote quando há baseline — evita recomputar mediana por linha. */
export function evaluateExpenses(
  expenses: ExpenseLike[],
  baselines: Map<string, CategoryBaseline>,
): ExpenseVerdict[] {
  return expenses.map(e => evaluateExpense(e, { baselines }));
}

/* ------------------------------------------------------------------ *
 * Penalidade no score
 * ------------------------------------------------------------------ */

/** Teto da penalidade de despesa no critério Integridade Moral. */
export const MAX_EXPENSE_PENALTY = 25;

/** % de despesas fora do padrão que já zera a penalidade máxima. */
export const PENALTY_SATURATION_PCT = 20;

export interface PenaltyInput {
  totalExpenses: number;
  suspiciousCount: number;
  /** suspicion_score médio das despesas marcadas. */
  avgSuspicion: number;
}

/**
 * Converte percentual de despesas fora do padrão em penalidade do critério
 * Integridade Moral. Retorna 0 sem dado de despesa — ausência de dado nunca
 * vira penalidade.
 *
 * PROPORCIONAL, não por contagem (corrigido 2026-09-25). A fórmula anterior
 * era `min(25, nº_suspeitas * 3 + score_médio * 0,1)`, que punia volume:
 * um parlamentar com 300 despesas batia o teto só por acumular 9 marcações,
 * enquanto outro com 5 anomalias reais ficava de fora. Medido com as regras
 * 2.0.0: 31 de 174 parlamentares (18%) saturavam no teto. É o mesmo defeito
 * já corrigido na média dos votos (2026-09-08) — que tinha sobrado aqui.
 *
 * O fator `(0.5 + avgSuspicion/100)` pondera pela severidade: a mesma
 * proporção de marcações pesa mais se as marcações forem graves (valor no
 * topo da categoria + glosa) do que triviais (só valor redondo).
 */
export function computeExpensePenalty(input: PenaltyInput): number {
  if (input.totalExpenses <= 0) return 0;
  if (input.suspiciousCount <= 0) return 0;

  const suspiciousPct = (input.suspiciousCount / input.totalExpenses) * 100;
  const severity = 0.5 + Math.max(0, input.avgSuspicion) / 100;

  return Math.min(
    MAX_EXPENSE_PENALTY,
    (suspiciousPct / PENALTY_SATURATION_PCT) * MAX_EXPENSE_PENALTY * severity,
  );
}
