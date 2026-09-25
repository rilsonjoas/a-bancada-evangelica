/**
 * expense-analyzer.ts — agregação MENSAL de despesa (ano × mês).
 *
 * O QUE ESTE ARQUIVO NÃO FAZ MAIS (2026-09-25): definir regra de suspeita.
 * As 7 regras que ele tinha foram medidas uma a uma contra o acervo real e
 * 4 foram descartadas por ruído. A fonte única é agora
 * `scripts/lib/expense-rules.ts`. Ver `docs/DETECCAO-DESPESAS.md` §4.
 *
 * O QUE ELE FAZ: consolida as despesas de cada mês em `ExpenseAnalysis` e
 * calcula um índice de integridade POR PROPORÇÃO — que sobreviveu à
 * auditoria e é a mesma abordagem que a penalidade do score passou a usar.
 *
 * A tabela `ExpenseAnalysis` era escrita por aqui e nunca lida por nenhuma
 * rota da API. Continua não sendo, mas os valores gravados agora são
 * verdadeiros e a granularidade mensal fica disponível.
 */
import { PrismaClient } from '@prisma/client';
import {
  computeBaselines,
  evaluateExpense,
  normalizeCategory,
  type CategoryBaseline,
} from './lib/expense-rules';

const prisma = new PrismaClient();

interface ExpenseAnalysisResult {
  politicianId: number;
  politicianName: string;
  year: number;
  month: number;
  totalValue: number;
  suspiciousValue: number;
  suspiciousCount: number;
  suspiciousPercentage: number;
  integrityScore: number;
  riskLevel: string;
  flags: string[];
  recommendations: string[];
}

interface SuspicionRule {
  name: string;
  description: string;
  weight: number;
  check: (expense: any, politician: any, context: any) => {
    applies: boolean;
    reason?: string;
  };
}

class ExpenseAnalyzerService {
  private suspicionRules: SuspicionRule[] = [];
  /** Baselines do acervo inteiro — o corte robusto é comparação com o
   *  conjunto, então um mês isolado não tem n para mediana. */
  private corpusBaselines: Map<string, CategoryBaseline> = new Map();

  constructor() {
    this.setupSuspicionRules();
  }

  private setupSuspicionRules(): void {
    // AS 7 REGRAS ANTIGAS FORAM REMOVIDAS EM 2026-09-25.
    //
    // Este arquivo NÃO deve mais definir regra de suspeita. A fonte única é
    // scripts/lib/expense-rules.ts, e as regras daqui foram medidas uma a uma
    // contra o acervo real antes de qualquer decisão (ver
    // docs/DETECCAO-DESPESAS.md §4):
    //
    //   R1 HIGH_VALUE .............. portada → teto absoluto
    //   R2 UNIDENTIFIED_SUPPLIER ... portada
    //   R3 SUSPICIOUS_SUPPLIER_NAME  portada
    //   R4 SUPPLIER_CONCENTRATION .. 116/174 = 67% de falsos positivos. DESCARTADA
    //   R5 HIGH_FREQUENCY ..........  98/174 = 56% de falsos positivos. DESCARTADA
    //   R6 TEMPORAL_PATTERN ........   0/174 =  0% (morta). REMOVIDA
    //   R7 ROUND_VALUES ............   2/174 =  1%. PORTADA
    //
    // R4 e R5 são ruído, não sinal: um parlamentar com 300 despesas tem
    // naturalmente um fornecedor principal acima de 50% num mês de cota
    // pequena, e naturalmente passa de 20 despesas de combustível. Ligado
    // como estava, este script teria marcado 67% de todos os parlamentares
    // numa única rodada — provavelmente a razão de nunca ter entrado no
    // cron.
    //
    // O que SOBREVIVE deste arquivo e vale a pena manter: a agregação
    // mensal (por ano × mês) e a fórmula de integridade POR PROPORÇÃO,
    // que é a mesma abordagem que a penalidade do score passou a usar em
    // 2026-09-25 (ver computeExpensePenalty). A fórmula antiga de
    // penalidade por contagem vivia no recalculate-scores e já foi
    // corrigida; aqui ela já era proporcional.
    //
    // R4 e R5 não foram condenadas em definitivo: buildAnalysisContext
    // (fornecedor, tipo, data) foi preservado e elas podem ser reparadas
    // com limiares relativos se um dia houver evidência de que carregam
    // sinal.
    void this.suspicionRules;
  }

  /**
   * Baselines (mediana + MAD por categoria) calculadas sobre TODO o acervo,
   * não sobre o parlamentar nem sobre o mês. O corte robusto é uma
   * comparação com o conjunto — o mês de uma pessoa só não tem n para
   * mediana. Ver DETECCAO-DESPESAS.md §3.1.
   */
  private async loadCorpusBaselines(): Promise<Map<string, CategoryBaseline>> {
    const expenses = await prisma.expense.findMany({
      select: { year: true, expense_type: true, net_value: true },
    });
    return computeBaselines(
      expenses.map(e => ({
        category: normalizeCategory(e.expense_type),
        year: e.year,
        value: e.net_value,
      })),
    );
  }

  async analyzeAllPoliticians(year?: number, month?: number): Promise<ExpenseAnalysisResult[]> {
    const targetYear = year || new Date().getFullYear();
    console.log(`🔍 Iniciando análise de despesas para ${targetYear}...`);

    // Baselines do acervo inteiro, UMA vez por execução. Sem isso o corte
    // robusto cairia só nas regras absolutas.
    this.corpusBaselines = await this.loadCorpusBaselines();
    console.log(`📐 ${this.corpusBaselines.size} baselines de categoria carregados`);

    // Buscar políticos com gastos no ano
    const politicians = await prisma.politician.findMany({
      where: {
        is_active: true,
        expenses: {
          some: {
            year: targetYear,
            ...(month && { month })
          }
        }
      },
      include: {
        expenses: {
          where: {
            year: targetYear,
            ...(month && { month })
          },
          orderBy: [
            { year: 'desc' },
            { month: 'desc' },
            { document_date: 'desc' }
          ]
        }
      }
    });

    console.log(`📊 Analisando ${politicians.length} políticos com gastos em ${targetYear}${month ? `/${month}` : ''}...`);

    const results: ExpenseAnalysisResult[] = [];

    for (const politician of politicians) {
      try {
        if (month) {
          // Analisar mês específico
          const result = await this.analyzePoliticianMonth(politician, targetYear, month);
          if (result) results.push(result);
        } else {
          // Analisar todos os meses do ano
          const monthsWithExpenses = [...new Set(politician.expenses.map(e => e.month))];
          
          for (const m of monthsWithExpenses) {
            const result = await this.analyzePoliticianMonth(politician, targetYear, m);
            if (result) results.push(result);
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao analisar ${politician.name}:`, error);
      }
    }

    // Ordenar por risco e pontuação
    results.sort((a, b) => {
      const riskOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const riskDiff = (riskOrder[b.riskLevel as keyof typeof riskOrder] || 0) - (riskOrder[a.riskLevel as keyof typeof riskOrder] || 0);
      
      if (riskDiff !== 0) return riskDiff;
      return a.integrityScore - b.integrityScore; // Menor pontuação = mais suspeito
    });

    console.log(`✅ Análise concluída. ${results.length} resultados gerados.`);
    return results;
  }

  private async analyzePoliticianMonth(
    politician: any, 
    year: number, 
    month: number
  ): Promise<ExpenseAnalysisResult | null> {
    const monthExpenses = politician.expenses.filter((e: any) => 
      e.year === year && e.month === month
    );

    if (monthExpenses.length === 0) return null;

    // Estatísticas básicas do mês
    const totalValue = monthExpenses.reduce((sum: number, e: any) => sum + e.net_value, 0);

    // Aplicar a regra de detecção — FONTE ÚNICA (scripts/lib/expense-rules.ts).
    //
    // Calcula o veredito AQUI, e não lendo a coluna expense.is_suspicious: a
    // coluna só é atualizada por `pnpm expenses:recalc`, então ler ela aqui
    // daria resultado defasado em relação à regra vigente. As regras deste
    // arquivo foram removidas em 2026-09-25 (ver setupSuspicionRules).
    const marked = monthExpenses.filter((e: any) =>
      evaluateExpense(e, { baselines: this.corpusBaselines }).is_suspicious,
    );

    const suspiciousCount = marked.length;
    const suspiciousValue = marked.reduce((sum: number, e: any) => sum + e.net_value, 0);
    const suspiciousPercentage = (marked.length / monthExpenses.length) * 100;
    const suspiciousValuePercentage = totalValue > 0 ? (suspiciousValue / totalValue) * 100 : 0;

    const flags: string[] = [];
    const recommendations: string[] = [];
    for (const expense of marked) {
      flags.push(`${expense.year}/${expense.month} — R$ ${expense.net_value.toFixed(2)}`);
      for (const reason of evaluateExpense(expense, { baselines: this.corpusBaselines }).suspicion_reasons) {
        if (!recommendations.includes(reason)) recommendations.push(reason);
      }
    }

    // Score de integridade POR PROPORÇÃO (100 = dentro do padrão). Esta
    // fórmula já era proporcional e sobreviveu à auditoria — é a mesma
    // abordagem que a penalidade do score passou a usar.
    let integrityScore = 100;
    if (suspiciousPercentage > 50) integrityScore -= 25;
    else if (suspiciousPercentage > 25) integrityScore -= 15;
    else if (suspiciousPercentage > 10) integrityScore -= 10;

    if (suspiciousValuePercentage > 50) integrityScore -= 15;
    else if (suspiciousValuePercentage > 25) integrityScore -= 10;

    integrityScore = Math.max(0, integrityScore);

    // Determinar nível de risco
    let riskLevel: string;
    if (integrityScore >= 80) riskLevel = 'LOW';
    else if (integrityScore >= 60) riskLevel = 'MEDIUM';
    else if (integrityScore >= 40) riskLevel = 'HIGH';
    else riskLevel = 'CRITICAL';

    // Salvar análise no banco de dados
    await this.saveAnalysisToDatabase({
      politicianId: politician.id,
      year,
      month,
      totalValue,
      suspiciousValue,
      suspiciousCount,
      suspiciousPercentage,
      integrityScore,
      riskLevel,
      flags,
      source: politician.current_house === 'CAMARA' ? 'CAMARA' : 'SENADO'
    });

    return {
      politicianId: politician.id,
      politicianName: politician.name,
      year,
      month,
      totalValue,
      suspiciousValue,
      suspiciousCount,
      suspiciousPercentage,
      integrityScore,
      riskLevel,
      flags,
      recommendations
    };
  }

  private async buildAnalysisContext(politician: any, expenses: any[], year: number, month: number): Promise<any> {
    // Estatísticas por fornecedor
    const supplierStats: Record<string, { count: number; total: number }> = {};
    
    // Estatísticas por tipo de despesa
    const expensesByType: Record<string, any[]> = {};
    
    // Estatísticas temporais
    let endOfMonthCount = 0;
    let roundValueCount = 0;

    for (const expense of expenses) {
      // Fornecedor
      if (expense.supplier_document) {
        if (!supplierStats[expense.supplier_document]) {
          supplierStats[expense.supplier_document] = { count: 0, total: 0 };
        }
        supplierStats[expense.supplier_document].count++;
        supplierStats[expense.supplier_document].total += expense.net_value;
      }

      // Tipo de despesa
      if (!expensesByType[expense.expense_type]) {
        expensesByType[expense.expense_type] = [];
      }
      expensesByType[expense.expense_type].push(expense);

      // Padrões temporais
      if (expense.document_date) {
        const date = new Date(expense.document_date);
        if (date.getDate() >= 25) endOfMonthCount++;
      }

      // Valores redondos
      if (expense.net_value % 1000 === 0 && expense.net_value >= 10000) {
        roundValueCount++;
      }
    }

    return {
      supplierStats,
      expensesByType,
      monthlyTotal: expenses.reduce((sum, e) => sum + e.net_value, 0),
      temporalStats: {
        endOfMonthCount,
        totalCount: expenses.length
      },
      roundValues: {
        count: roundValueCount,
        total: expenses.length
      }
    };
  }

  private async saveAnalysisToDatabase(analysis: {
    politicianId: number;
    year: number;
    month: number;
    totalValue: number;
    suspiciousValue: number;
    suspiciousCount: number;
    suspiciousPercentage: number;
    integrityScore: number;
    riskLevel: string;
    flags: string[];
    source: string;
  }): Promise<void> {
    await prisma.expenseAnalysis.upsert({
      where: {
        politician_id_year_month_source: {
          politician_id: analysis.politicianId,
          year: analysis.year,
          month: analysis.month,
          source: analysis.source as any
        }
      },
      update: {
        total_value: analysis.totalValue,
        suspicious_value: analysis.suspiciousValue,
        suspicious_count: analysis.suspiciousCount,
        suspicious_percentage: analysis.suspiciousPercentage,
        integrity_score: analysis.integrityScore,
        risk_level: analysis.riskLevel as any,
        flags: analysis.flags,
        analysis_date: new Date()
      },
      create: {
        politician_id: analysis.politicianId,
        year: analysis.year,
        month: analysis.month,
        total_value: analysis.totalValue,
        suspicious_value: analysis.suspiciousValue,
        suspicious_count: analysis.suspiciousCount,
        suspicious_percentage: analysis.suspiciousPercentage,
        integrity_score: analysis.integrityScore,
        risk_level: analysis.riskLevel as any,
        flags: analysis.flags,
        source: analysis.source as any
      }
    });
  }

  async generateReport(results: ExpenseAnalysisResult[]): Promise<string> {
    const div = '='.repeat(50);
    let report = `\n📊 RELATÓRIO DE ANÁLISE DE DESPESAS\n${div}\n\n`;

    // Estatísticas gerais
    const totalPoliticians = new Set(results.map(r => r.politicianId)).size;
    const criticalCount = results.filter(r => r.riskLevel === 'CRITICAL').length;
    const highCount = results.filter(r => r.riskLevel === 'HIGH').length;
    const mediumCount = results.filter(r => r.riskLevel === 'MEDIUM').length;
    const lowCount = results.filter(r => r.riskLevel === 'LOW').length;

    report += `🔢 ESTATÍSTICAS GERAIS:\n`;
    report += `   • Políticos analisados: ${totalPoliticians}\n`;
    report += `   • Análises geradas: ${results.length}\n`;
    report += `   • Risco CRÍTICO: ${criticalCount}\n`;
    report += `   • Risco ALTO: ${highCount}\n`;
    report += `   • Risco MÉDIO: ${mediumCount}\n`;
    report += `   • Risco BAIXO: ${lowCount}\n\n`;

    // Top 10 mais suspeitos
    report += `🚨 TOP 10 CASOS MAIS SUSPEITOS:\n`;
    const topSuspicious = results
      .filter(r => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH')
      .slice(0, 10);

    for (let i = 0; i < topSuspicious.length; i++) {
      const result = topSuspicious[i];
      report += `   ${i + 1}. ${result.politicianName} (${result.year}/${result.month})\n`;
      report += `      • Score: ${result.integrityScore}/100 (${result.riskLevel})\n`;
      report += `      • Valor total: R$ ${result.totalValue.toLocaleString('pt-BR')}\n`;
      report += `      • Valor suspeito: R$ ${result.suspiciousValue.toLocaleString('pt-BR')} (${result.suspiciousPercentage.toFixed(1)}%)\n`;
      report += `      • Flags: ${result.flags.join(', ')}\n\n`;
    }

    // Flags mais comuns
    const flagCount: Record<string, number> = {};
    results.forEach(r => {
      r.flags.forEach(flag => {
        flagCount[flag] = (flagCount[flag] || 0) + 1;
      });
    });

    const sortedFlags = Object.entries(flagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    report += `🏃 FLAGS MAIS COMUNS:\n`;
    sortedFlags.forEach(([flag, count]) => {
      report += `   • ${flag}: ${count} ocorrências\n`;
    });

    report += `\n${div}`;
    return report;
  }
}

// Função principal para execução
async function analyzeExpenses(year?: number, month?: number) {
  const analyzer = new ExpenseAnalyzerService();
  
  try {
    const results = await analyzer.analyzeAllPoliticians(year, month);
    const report = await analyzer.generateReport(results);
    
    console.log(report);
    
    // Salvar relatório em arquivo
    const fs = await import('fs/promises');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `expense-analysis-${timestamp}.txt`;
    await fs.writeFile(filename, report);
    
    console.log(`\n📝 Relatório salvo em: ${filename}`);
    
  } catch (error) {
    console.error('❌ Erro na análise de despesas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if this file is run directly
async function main() {
  const args = process.argv.slice(2);
  const year = args[0] ? parseInt(args[0]) : undefined;
  const month = args[1] ? parseInt(args[1]) : undefined;
  
  await analyzeExpenses(year, month);
}

// Run main if this file is executed directly
main().catch((error) => {
  console.error(error);
  process.exit(1);
});

export { ExpenseAnalyzerService, analyzeExpenses };