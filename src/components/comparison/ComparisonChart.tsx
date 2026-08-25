import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { fmt } from '@/lib/format';

interface ComparisonChartProps {
  politicians: Array<{
    id: number;
    name: string;
    currentScore?: {
      lifeProtection: number;
      familyValues: number;
      moralIntegrity: number;
      socialResponsibility: number;
      religiousFreedom: number;
      overall: number;
    };
  }>;
}

export function ComparisonChart({ politicians }: ComparisonChartProps) {
  // Preparar dados para o gráfico radar
  const radarData = [
    {
      subject: 'Proteção à Vida',
      ...politicians.reduce((acc, politician, index) => ({
        ...acc,
        [`politician_${index}`]: politician.currentScore?.lifeProtection || 0
      }), {})
    },
    {
      subject: 'Valores Familiares',
      ...politicians.reduce((acc, politician, index) => ({
        ...acc,
        [`politician_${index}`]: politician.currentScore?.familyValues || 0
      }), {})
    },
    {
      subject: 'Integridade Moral',
      ...politicians.reduce((acc, politician, index) => ({
        ...acc,
        [`politician_${index}`]: politician.currentScore?.moralIntegrity || 0
      }), {})
    },
    {
      subject: 'Responsab. Social',
      ...politicians.reduce((acc, politician, index) => ({
        ...acc,
        [`politician_${index}`]: politician.currentScore?.socialResponsibility || 0
      }), {})
    },
    {
      subject: 'Liberdade Religiosa',
      ...politicians.reduce((acc, politician, index) => ({
        ...acc,
        [`politician_${index}`]: politician.currentScore?.religiousFreedom || 0
      }), {})
    }
  ];

  // Preparar dados para o gráfico de barras (pontuação geral)
  const barData = politicians.map(politician => ({
    name: politician.name.split(' ')[0], // Primeiro nome para economizar espaço
    score: politician.currentScore?.overall || 0,
    fullName: politician.name
  }));

  // Cores para cada político
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-8">
      {/* Radar Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-center">
          Comparação por Critérios
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fontSize: 12, fill: '#666' }}
                className="text-xs"
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fontSize: 10, fill: '#666' }}
              />
              {politicians.map((politician, index) => (
                <Radar
                  key={politician.id}
                  name={politician.name}
                  dataKey={`politician_${index}`}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                  dot={{ r: 3, fill: colors[index % colors.length] }}
                />
              ))}
              <Tooltip
                formatter={(value: unknown, name: string) => {
                  const politicianIndex = parseInt(name.split('_')[1]);
                  const politicianName = politicians[politicianIndex]?.name || 'Desconhecido';
                  return [fmt(Number(value)), politicianName];
                }}
                labelFormatter={(label) => `Critério: ${label}`}
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-center">
          Nota geral comparativa
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#666' }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#666' }}
              />
              <Tooltip
                formatter={(value: unknown) => [
                  fmt(value as number),
                  'Nota geral'
                ]}
                labelFormatter={(label, payload) => {
                  const data = payload?.[0]?.payload;
                  return data ? `Político: ${data.fullName}` : `Político: ${label}`;
                }}
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                }}
              />
              <Bar 
                dataKey="score" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-center">Resumo da Comparação</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {politicians.length}
            </div>
            <div className="text-sm text-gray-600">Políticos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {fmt(Math.max(...politicians.map(p => p.currentScore?.overall || 0)))}
            </div>
            <div className="text-sm text-gray-600">Maior Nota</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {fmt(Math.min(...politicians.map(p => p.currentScore?.overall || 0)))}
            </div>
            <div className="text-sm text-gray-600">Menor Nota</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {(politicians.reduce((sum, p) => sum + (p.currentScore?.overall || 0), 0) / politicians.length).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Média</div>
          </div>
        </div>
      </div>
    </div>
  );
}