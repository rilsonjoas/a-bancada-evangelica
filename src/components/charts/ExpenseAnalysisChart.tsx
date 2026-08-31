import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { fmt } from '@/lib/format';

interface ExpenseAnalysisChartProps {
  analysis: {
    totalValue: number;
    suspiciousValue: number;
    suspiciousPercentage: number;
    integrityScore: number;
    riskLevel: string;
  };
  house?: string;
}

export function ExpenseAnalysisChart({ analysis, house }: ExpenseAnalysisChartProps) {
  const reducedMotion = useReducedMotion();

  // Dados para gráfico de barras - Comparação de valores
  const valueData = [
    {
      category: 'Total gasto',
      value: analysis.totalValue,
      type: 'total'
    },
    {
      category: 'Fora do padrão',
      value: analysis.suspiciousValue,
      type: 'suspicious'
    },
    {
      category: 'Dentro do padrão',
      value: analysis.totalValue - analysis.suspiciousValue,
      type: 'clean'
    }
  ];

  // Dados para gráfico de pizza - Distribuição de gastos
  const distributionData = [
    {
      name: 'Dentro do padrão',
      value: analysis.totalValue - analysis.suspiciousValue,
      fill: '#10b981'
    },
    {
      name: 'Fora do padrão',
      value: analysis.suspiciousValue,
      fill: '#ef4444'
    }
  ].filter(item => item.value > 0);

  // Dados para medidor de integridade
  const integrityData = [
    { name: 'Nota de Integridade', value: analysis.integrityScore, max: 100 }
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
      case 'LOW': return 'Regular';
      case 'MEDIUM': return 'Atenção';
      case 'HIGH': return 'Atípico';
      case 'CRITICAL': return 'Muito atípico';
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
      {/* F9: contexto leigo antes dos números — o que é a cota */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
        <strong>O que você está vendo:</strong> {house === 'SENADO' ? 'senadores' : 'deputados federais'} recebem a{' '}
        <strong>
          {house === 'SENADO'
            ? 'Cota para o Exercício da Atividade Parlamentar dos Senadores (CEAPS)'
            : 'Cota para o Exercício da Atividade Parlamentar (CEAP)'}
        </strong>{' '}
        (verba indenizatória) para custear o mandato — passagens, alimentação,
        consultorias, material de trabalho. O uso é público e publicado pelo{' '}
        <strong>{house === 'SENADO' ? 'Senado Federal' : 'Câmara dos Deputados'}</strong>. Aqui
        nós apenas organizamos esses dados e os comparamos com o padrão estatístico do conjunto.
        <details className="mt-2">
          <summary className="cursor-pointer select-none font-medium text-gray-900 hover:text-primary">
            Como a análise identifica despesas fora do padrão
          </summary>
          <p className="mt-2 leading-relaxed">
            Comparamos cada despesa com a referência estatística do conjunto
            analisado (tipo de gasto × valores típicos). Despesas com valor,
            tipo ou fornecedor que destoam da referência são marcadas como
            <strong> &ldquo;fora do padrão&rdquo;</strong>. É um sinal
            <strong> estatístico para olhar com atenção</strong> — não uma
            constatação de irregularidade. Os critérios completos estão na{' '}
            <a href="/metodologia" className="text-primary hover:underline">metodologia</a>.
          </p>
        </details>
      </div>

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
          <div className="text-sm text-gray-600">Fora do padrão</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {fmt(analysis.suspiciousPercentage)}%
          </div>
          <div className="text-sm text-gray-600">% fora do padrão</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {fmt(analysis.integrityScore, 0)}
          </div>
          <div className="text-sm text-gray-600">Nota de Integridade</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Gráfico de barras - Comparação de valores */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-center">
            Análise de Valores
          </h3>
          <div className="h-64" role="img" aria-label="Gráfico de barras comparando o total gasto, o valor fora do padrão e o dentro do padrão">
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
                  isAnimationActive={!reducedMotion}
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
          <div className="h-64" role="img" aria-label="Gráfico de pizza com a distribuição entre dentro e fora do padrão">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) =>
                    `${name}: ${formatCurrency(value)} (${fmt(percent * 100)}%)`
                  }
                  outerRadius={80}
                  dataKey="value"
                  isAnimationActive={!reducedMotion}
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
            <span className="text-sm font-medium text-gray-700">Nota de Integridade</span>
            <span className="text-lg font-bold" style={{ color: getRiskColor(analysis.riskLevel) }}>
              {fmt(analysis.integrityScore, 0)}/100
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
              Padrão geral dos gastos: {getRiskLabel(analysis.riskLevel)}
            </div>
          </div>
        </div>
      </div>

      {/* F9: interpretação reescrita — estatística, não acusação */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Como ler estes números</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <strong>Nota de Integridade:</strong> nota de 0–100 que resume o quanto as
              despesas deste parlamentar seguem o padrão estatístico do conjunto analisado.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
            <div>
              <strong>Fora do padrão:</strong> despesas cujo valor, tipo ou fornecedor destoa
              da referência estatística (ex.: valores muito acima do típico para a mesma categoria).
              É um alerta para investigação — <strong>não prova nada</strong> e pode refletir
              desde erro de digitação do próprio órgão até particularidades legítimas do mandato.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
            <div>
              <strong>Padrão geral dos gastos:</strong> classificação derivada dos indicadores
              acima (Regular / Atenção / Atípico).
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
            <div>
              <strong>Atenção ao zero:</strong> nenhuma despesa marcada significa apenas que
              nada destoou dos critérios automáticos — <strong>não garante ausência de problemas</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* F9: bloco jurídico — transparência sem acusação */}
      <div className="border border-border rounded-lg p-5 bg-muted/30 text-xs text-muted-foreground leading-relaxed space-y-2">
        <p className="font-semibold text-foreground text-sm">Sobre esta análise</p>
        <p>
          Processamento automatizado de dados públicos publicados pelo{' '}
          {house === 'SENADO' ? 'Senado Federal' : 'Câmara dos Deputados'}, por critérios estatísticos descritos na{' '}
          <a href="/metodologia" className="text-primary hover:underline">metodologia aberta</a> deste projeto.
        </p>
        <p>
          Os marcadores exibidos são <strong>diferenças estatísticas, não acusações</strong>.
          Qualquer pessoa mencionada tem direito à presunção de inocência, e nada aqui
          afirma, sugere ou configura irregularidade, ilícito ou má conduta. Despesas
          fora do padrão podem ter explicações legítimas ou decorrer de falhas nos próprios dados oficiais.
        </p>
        <p>
          Encontrou um dado incorreto ou desatualizado?{' '}
          <a href="/contato" className="text-primary hover:underline">Fale conosco</a> — corrigimos com prioridade.
        </p>
      </div>
    </div>
  );
}