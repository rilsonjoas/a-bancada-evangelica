import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

interface Vote {
  id: string;
  agendaTitle: string;
  vote: string;
  appliedScore: number;
  voteDate: string;
}

interface VotingHistoryChartProps {
  votes: Vote[];
}

export function VotingHistoryChart({ votes }: VotingHistoryChartProps) {
  if (!votes || votes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Nenhuma votação disponível para análise
      </div>
    );
  }

  // Preparar dados para gráfico de linha (impacto ao longo do tempo)
  const timelineData = votes
    .sort((a, b) => new Date(a.voteDate).getTime() - new Date(b.voteDate).getTime())
    .map((vote, index) => ({
      index: index + 1,
      date: new Date(vote.voteDate).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      score: vote.appliedScore,
      cumulative: votes.slice(0, index + 1).reduce((sum, v) => sum + v.appliedScore, 0),
      title: vote.agendaTitle.substring(0, 30) + (vote.agendaTitle.length > 30 ? '...' : ''),
      vote: vote.vote
    }));

  // Dados para gráfico de pizza (distribuição de votos)
  const voteDistribution = votes.reduce((acc, vote) => {
    acc[vote.vote] = (acc[vote.vote] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(voteDistribution).map(([vote, count]) => ({
    name: vote === 'YES' ? 'Favorável' : vote === 'NO' ? 'Contrário' : vote === 'ABSTENTION' ? 'Abstenção' : 'Ausente',
    value: count,
    vote: vote
  }));

  const COLORS = {
    YES: '#10b981',      // Verde
    NO: '#ef4444',       // Vermelho
    ABSTENTION: '#f59e0b', // Amarelo
    ABSENT: '#6b7280',   // Cinza
    OBSTRUCTION: '#8b5cf6' // Roxo
  };

  // Dados de impacto positivo vs negativo
  const positiveVotes = votes.filter(v => v.appliedScore > 0).length;
  const negativeVotes = votes.filter(v => v.appliedScore < 0).length;
  const neutralVotes = votes.filter(v => v.appliedScore === 0).length;

  const impactData = [
    { name: 'Impacto Positivo', value: positiveVotes, fill: '#10b981' },
    { name: 'Impacto Negativo', value: negativeVotes, fill: '#ef4444' },
    { name: 'Neutro', value: neutralVotes, fill: '#6b7280' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-8">
      {/* Gráfico de linha - Impacto ao longo do tempo */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-center">
          Evolução da Pontuação por Votação
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#666' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#666' }}
              />
              <Tooltip
                formatter={(value: unknown, name: string) => [
                  `${value > 0 ? '+' : ''}${value}`,
                  name === 'score' ? 'Impacto' : 'Acumulado'
                ]}
                labelFormatter={(label) => `Votação: ${label}`}
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 4, fill: '#3b82f6' }}
                name="Impacto da Votação"
              />
              <Line 
                type="monotone" 
                dataKey="cumulative" 
                stroke="#10b981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#10b981' }}
                name="Pontuação Acumulada"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Gráfico de pizza - Distribuição de votos */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-center">
            Distribuição de Votos
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.vote as keyof typeof COLORS] || '#6b7280'} 
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) => [`${value}`, 'Quantidade']}
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

        {/* Gráfico de impacto */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-center">
            Impacto das Votações
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={impactData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {impactData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) => [`${value}`, 'Votações']}
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

      {/* Resumo estatístico */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-center">Resumo das Votações</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{votes.length}</div>
            <div className="text-sm text-gray-600">Total de Votações</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{positiveVotes}</div>
            <div className="text-sm text-gray-600">Impacto Positivo</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{negativeVotes}</div>
            <div className="text-sm text-gray-600">Impacto Negativo</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {votes.reduce((sum, v) => sum + v.appliedScore, 0) > 0 ? '+' : ''}
              {votes.reduce((sum, v) => sum + v.appliedScore, 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Impacto Total</div>
          </div>
        </div>
      </div>
    </div>
  );
}