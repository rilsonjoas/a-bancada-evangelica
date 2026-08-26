import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface VotingTrendsChartProps {
  data: Array<{
    date: string;
    favorableVotes: number;
    contraryVotes: number;
    abstentions: number;
  }>;
}

export function VotingTrendsChart({ data }: VotingTrendsChartProps) {
  const reducedMotion = useReducedMotion();

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Dados de tendências não disponíveis
      </div>
    );
  }

  // Preparar dados para o gráfico
  const chartData = data.map(item => ({
    ...item,
    month: new Date(item.date + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    total: item.favorableVotes + item.contraryVotes + item.abstentions,
    favorablePercentage: ((item.favorableVotes / (item.favorableVotes + item.contraryVotes + item.abstentions)) * 100).toFixed(1),
    contraryPercentage: ((item.contraryVotes / (item.favorableVotes + item.contraryVotes + item.abstentions)) * 100).toFixed(1)
  }));

  return (
    <div className="space-y-8">
      {/* Line Chart - Absolute Numbers */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-center">
          Evolução das Votações por Mês
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fill: '#666' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#666' }}
              />
              <Tooltip
                formatter={(value: unknown, name: string) => [
                  Number(value),
                  name === 'favorableVotes' ? 'Votos Favoráveis' : 
                  name === 'contraryVotes' ? 'Votos Contrários' : 'Abstenções'
                ]}
                labelFormatter={(label) => `Mês: ${label}`}
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="favorableVotes"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981' }}
                name="Votos Favoráveis"
                isAnimationActive={!reducedMotion}
              />
              <Line
                type="monotone"
                dataKey="contraryVotes"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4, fill: '#ef4444' }}
                name="Votos Contrários"
                isAnimationActive={!reducedMotion}
              />
              <Line
                type="monotone"
                dataKey="abstentions"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#f59e0b' }}
                name="Abstenções"
                isAnimationActive={!reducedMotion}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Area Chart - Stacked */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-center">
          Distribuição Proporcional dos Votos
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fill: '#666' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#666' }}
              />
              <Tooltip
                formatter={(value: unknown, name: string) => [
                  Number(value),
                  name === 'favorableVotes' ? 'Votos Favoráveis' : 
                  name === 'contraryVotes' ? 'Votos Contrários' : 'Abstenções'
                ]}
                labelFormatter={(label) => `Mês: ${label}`}
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                }}
              />
              <Area
                type="monotone"
                dataKey="favorableVotes"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.7}
                isAnimationActive={!reducedMotion}
              />
              <Area
                type="monotone"
                dataKey="contraryVotes"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.7}
                isAnimationActive={!reducedMotion}
              />
              <Area
                type="monotone"
                dataKey="abstentions"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.7}
                isAnimationActive={!reducedMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-center">Resumo do Período</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {chartData.reduce((sum, item) => sum + item.favorableVotes, 0)}
            </div>
            <div className="text-sm text-gray-600">Votos Favoráveis</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {chartData.reduce((sum, item) => sum + item.contraryVotes, 0)}
            </div>
            <div className="text-sm text-gray-600">Votos Contrários</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {chartData.reduce((sum, item) => sum + item.abstentions, 0)}
            </div>
            <div className="text-sm text-gray-600">Abstenções</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {chartData.reduce((sum, item) => sum + item.total, 0)}
            </div>
            <div className="text-sm text-gray-600">Total de Votos</div>
          </div>
        </div>
      </div>
    </div>
  );
}