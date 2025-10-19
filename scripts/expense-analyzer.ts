import { PrismaClient } from '@prisma/client';

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

  constructor() {
    this.setupSuspicionRules();
  }

  private setupSuspicionRules(): void {
    // Regra 1: Valores muito altos
    this.suspicionRules.push({
      name: 'HIGH_VALUE',
      description: 'Despesa com valor muito alto para o tipo',
      weight: 25,
      check: (expense, politician, context) => {
        const threshold = politician.current_house === 'SENADO' ? 100000 : 50000;
        return {
          applies: expense.net_value > threshold,
          reason: `Valor R$ ${expense.net_value.toLocaleString('pt-BR')} excede limite de R$ ${threshold.toLocaleString('pt-BR')}`
        };
      }
    });

    // Regra 2: Fornecedor sem identificação
    this.suspicionRules.push({
      name: 'UNIDENTIFIED_SUPPLIER',
      description: 'Fornecedor sem documento identificador',
      weight: 20,
      check: (expense, politician, context) => {
        return {
          applies: !expense.supplier_document || expense.supplier_document.trim() === '',
          reason: 'Fornecedor não possui CNPJ/CPF informado'
        };
      }
    });

    // Regra 3: Nome do fornecedor suspeito
    this.suspicionRules.push({
      name: 'SUSPICIOUS_SUPPLIER_NAME',
      description: 'Nome do fornecedor suspeito ou genérico',
      weight: 15,
      check: (expense, politician, context) => {
        const suspiciousNames = [
          'pessoa fisica',
          'sem nome',
          'nao informado',
          'não informado',
          'diversos',
          'vários',
          'multiplos'
        ];
        
        const supplierName = expense.supplier_name?.toLowerCase() || '';
        const hasSuspiciousName = suspiciousNames.some(name => 
          supplierName.includes(name)
        );
        
        return {
          applies: hasSuspiciousName,
          reason: `Nome do fornecedor suspeito: "${expense.supplier_name}"`
        };
      }
    });

    // Regra 4: Gastos concentrados em poucos fornecedores
    this.suspicionRules.push({
      name: 'SUPPLIER_CONCENTRATION',
      description: 'Concentração excessiva de gastos em poucos fornecedores',
      weight: 18,
      check: (expense, politician, context) => {
        if (!context.supplierStats) return { applies: false };
        
        const supplierDoc = expense.supplier_document;
        if (!supplierDoc) return { applies: false };
        
        const supplierTotal = context.supplierStats[supplierDoc]?.total || 0;
        const monthlyTotal = context.monthlyTotal || 1;
        const percentage = (supplierTotal / monthlyTotal) * 100;
        
        return {
          applies: percentage > 50,
          reason: `Fornecedor representa ${percentage.toFixed(1)}% dos gastos do mês`
        };
      }
    });

    // Regra 5: Frequência alta de gastos
    this.suspicionRules.push({
      name: 'HIGH_FREQUENCY',
      description: 'Frequência muito alta de despesas no mesmo período',
      weight: 12,
      check: (expense, politician, context) => {
        const sameTypeCount = context.expensesByType?.[expense.expense_type]?.length || 0;
        return {
          applies: sameTypeCount > 20, // Mais de 20 despesas do mesmo tipo no mês
          reason: `${sameTypeCount} despesas do tipo "${expense.expense_type}" no mesmo mês`
        };
      }
    });

    // Regra 6: Padrões temporais suspeitos
    this.suspicionRules.push({
      name: 'TEMPORAL_PATTERN',
      description: 'Padrão temporal suspeito (ex: gastos só no final do mês)',
      weight: 10,
      check: (expense, politician, context) => {
        if (!expense.document_date) return { applies: false };
        
        const date = new Date(expense.document_date);
        const dayOfMonth = date.getDate();
        const isEndOfMonth = dayOfMonth >= 25;
        
        const endOfMonthCount = context.temporalStats?.endOfMonthCount || 0;
        const totalCount = context.temporalStats?.totalCount || 1;
        const endOfMonthPercentage = (endOfMonthCount / totalCount) * 100;
        
        return {
          applies: isEndOfMonth && endOfMonthPercentage > 70,
          reason: `${endOfMonthPercentage.toFixed(1)}% dos gastos concentrados no final do mês`
        };
      }
    });

    // Regra 7: Valores redondos suspeitos
    this.suspicionRules.push({
      name: 'ROUND_VALUES',
      description: 'Valores excessivamente redondos',
      weight: 8,
      check: (expense, politician, context) => {
        const value = expense.net_value;
        const isRound = value % 1000 === 0 && value >= 10000;
        
        const roundCount = context.roundValues?.count || 0;
        const totalCount = context.roundValues?.total || 1;
        const roundPercentage = (roundCount / totalCount) * 100;
        
        return {
          applies: isRound && roundPercentage > 30,
          reason: `Valor redondo R$ ${value.toLocaleString('pt-BR')} (${roundPercentage.toFixed(1)}% dos gastos são valores redondos)`
        };
      }
    });
  }

  async analyzeAllPoliticians(year?: number, month?: number): Promise<ExpenseAnalysisResult[]> {
    const targetYear = year || new Date().getFullYear();
    console.log(`🔍 Iniciando análise de despesas para ${targetYear}...`);

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

    // Calcular estatísticas básicas
    const totalValue = monthExpenses.reduce((sum: number, e: any) => sum + e.net_value, 0);
    const suspiciousExpenses = monthExpenses.filter((e: any) => e.is_suspicious);
    const suspiciousValue = suspiciousExpenses.reduce((sum: number, e: any) => sum + e.net_value, 0);
    const suspiciousCount = suspiciousExpenses.length;
    const suspiciousPercentage = monthExpenses.length > 0 ? (suspiciousCount / monthExpenses.length) * 100 : 0;

    // Preparar contexto para análise
    const context = await this.buildAnalysisContext(politician, monthExpenses, year, month);

    // Aplicar regras de suspeição
    const flags: string[] = [];
    const recommendations: string[] = [];
    let totalSuspicionScore = 0;

    for (const expense of monthExpenses) {
      for (const rule of this.suspicionRules) {
        const result = rule.check(expense, politician, context);
        
        if (result.applies) {
          if (!flags.includes(rule.name)) {
            flags.push(rule.name);
            totalSuspicionScore += rule.weight;
          }
          
          if (result.reason && !recommendations.includes(result.reason)) {
            recommendations.push(result.reason);
          }
        }
      }
    }

    // Calcular score de integridade (0-100, onde 100 = íntegro)
    let integrityScore = 100;
    
    // Penalizar por pontuação de suspeição
    integrityScore -= Math.min(totalSuspicionScore, 60);
    
    // Penalizar por percentual de gastos suspeitos
    if (suspiciousPercentage > 50) integrityScore -= 25;
    else if (suspiciousPercentage > 25) integrityScore -= 15;
    else if (suspiciousPercentage > 10) integrityScore -= 10;

    // Penalizar por valor total suspeito
    const suspiciousValuePercentage = totalValue > 0 ? (suspiciousValue / totalValue) * 100 : 0;
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
    let report = '\n📊 RELATÓRIO DE ANÁLISE DE DESPESAS\n';
    report += '=' * 50 + '\n\n';

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

    report += '\n' + '=' * 50;
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