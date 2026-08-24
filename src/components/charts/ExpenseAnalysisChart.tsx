import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface ExpenseAnalysisChartProps {
  analysis: {
    totalValue: number;
    suspiciousValue: number;
    suspiciousPercentage: number;
    integrityScore: number;
    riskLevel: string;
  };
}

export function ExpenseAnalysisChart({ analysis }: ExpenseAnalysisChartProps) {
  // Dados para gráfico de barras - Comparação de valores
  const valueData = [
    {
      category: 'Total Gasto',
      value: analysis.totalValue,
      type: 'total'
    },
    {
      category: 'Valor Suspeito',
      value: analysis.suspiciousValue,
      type: 'suspicious'
    },
    {
      category: 'Valor Íntegro',
      value: analysis.totalValue - analysis.suspiciousValue,
      type: 'clean'
    }
  ];

  // Dados para gráfico de pizza - Distribuição de gastos
  const distributionData = [
    {
      name: 'Gastos Íntegros',
      value: analysis.totalValue - analysis.suspiciousValue,
      fill: '#10b981'
    },
    {
      name: 'Gastos Suspeitos',
      value: analysis.suspiciousValue,
      fill: '#ef4444'
    }
  ].filter(item => item.value > 0);

  // Dados para medidor de integridade
  const integrityData = [
    { name: 'Score de Integridade', value: analysis.integrityScore, max: 100 }
  ];

  // Cores baseadas no nível de risco
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return '#10b981';
      case 'MEDIUM': return '#f59e0b';
      case 'HIGH': return '#ef4444';
      case 'CRITICAL': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'LOW': return 'Baixo';
      case 'MEDIUM': return 'Médio';
      case 'HIGH': return 'Alto';
      case 'CRITICAL': return 'Crítico';
      default: return 'Indefinido';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(analysis.totalValue)}
          </div>
          <div className="text-sm text-gray-600">Total Gasto</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(analysis.suspiciousValue)}
          </div>
          <div className="text-sm text-gray-600">Valor Suspeito</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {analysis.suspiciousPercentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">% Suspeito</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {analysis.integrityScore.toFixed(0)}
          </div>
          <div className="text-sm text-gray-600">Score Integridade</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Gráfico de barras - Comparação de valores */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-center">
            Análise de Valores
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 11, fill: '#666' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 11, fill: '#666' }}
                />
                <Tooltip
                  formatter={(value: unknown) => [formatCurrency(Number(value)), 'Valor']}
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                  }}
                />
                {/* fill aceita só string no Recharts — cores por categoria
                    via Cell (antes: função que era silenciosamente ignorada,
                    todas as barras ficavam na cor default) */}
                <Bar
                  dataKey="value"
                  radius={[2, 2, 0, 0]}
                >
                  {valueData.map((entry) => (
                    <Cell
                      key={entry.type}
                      fill={
                        entry.type === 'total' ? '#3b82f6'
                          : entry.type === 'suspicious' ? '#ef4444'
                            : entry.type === 'clean' ? '#10b981'
                              : '#6b7280'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de pizza - Distribuição */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-center">
            Distribuição de Gastos
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => 
                    `${name}: ${formatCurrency(value)} (${(percent * 100).toFixed(1)}%)`
                  }
                  outerRadius={80}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) => [formatCurrency(Number(value)), 'Valor']}
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Medidor de integridade */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-center">
          Medidor de Integridade
        </h3>
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">Score de Integridade</span>
            <span className="text-lg font-bold" style={{ color: getRiskColor(analysis.riskLevel) }}>
              {analysis.integrityScore.toFixed(0)}/100
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className="h-4 rounded-full transition-all duration-300"
              style={{ 
                width: `${analysis.integrityScore}%`,
                backgroundColor: getRiskColor(analysis.riskLevel)
              }}
            ></div>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>0 - Crítico</span>
            <span>50 - Médio</span>
            <span>100 - Excelente</span>
          </div>

          <div className="mt-4 text-center">
            <div 
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: `${getRiskColor(analysis.riskLevel)}20`,
                color: getRiskColor(analysis.riskLevel)
              }}
            >
              Nível de Risco: {getRiskLabel(analysis.riskLevel)}
            </div>
          </div>
        </div>
      </div>

      {/* Interpretação dos resultados */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Interpretação dos Resultados</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <strong>Score de Integridade:</strong> Pontuação de 0-100 baseada na análise de padrões suspeitos nos gastos parlamentares.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
            <div>
              <strong>Gastos Suspeitos:</strong> Despesas que apresentam características questionáveis como valores altos, fornecedores não identificados ou padrões atípicos.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
            <div>
              <strong>Nível de Risco:</strong> Classificação geral baseada no conjunto de indicadores analisados.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}