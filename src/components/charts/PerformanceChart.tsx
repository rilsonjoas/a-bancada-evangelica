import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { fmt } from '@/lib/format';
import { CRITERIA, CRITERIA_COM_VOTO } from '@/lib/criteria';

interface PerformanceChartProps {
  politician: {
    currentScore?: {
      lifeProtection: number;
      familyValues: number;
      moralIntegrity: number;
      socialResponsibility: number;
      religiousFreedom: number;
      overall: number;
    };
    name: string;
  };
}

export function PerformanceChart({ politician }: PerformanceChartProps) {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  if (!politician.currentScore) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Dados de desempenho não disponíveis
      </div>
    );
  }

  // Gerado de CRITERIA (2026-09-27). Antes eram dois arrays fixos, com
  // pesos 25/20/20/10/5 que somavam 80 e não eram os da metodologia.
  // Critério sem votação nominal medida fica fora dos gráficos: o número
  // dele é a semente do partido, não desempenho do parlamentar.
  const scores = politician.currentScore as unknown as Record<string, number>;
  const data = CRITERIA_COM_VOTO.map((c) => ({
    subject: c.label,
    score: scores[c.field],
    fullMark: 100,
  }));

  const barData = CRITERIA_COM_VOTO.map((c) => ({
    name: c.label,
    score: scores[c.field],
    weight: Number(c.weight.replace('%', '')),
  }));

  const semVoto = CRITERIA.filter((c) => c.semVotoMedido).map((c) => c.label);

  return (
    <div className="space-y-8">
      {semVoto.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {semVoto.join(' e ')} não aparecem nos gráficos: não têm votação nominal
          medida nesta legislatura, e o número deles seria só a estimativa do partido.
        </p>
      )}
      {/* Radar Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-center">
          Radar de Desempenho - {politician.name}
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
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
              <Radar
                name={politician.name}
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.1}
                strokeWidth={2}
                dot={{ r: 4, fill: '#3b82f6' }}
                isAnimationActive={!reducedMotion}
              />
              <Tooltip
                formatter={(value: unknown) => [fmt(value as number), 'Nota']}
                labelFormatter={(label) => `Critério: ${label}`}
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-center">
          Nota por critério (com pesos)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: isMobile ? 10 : 11, fill: '#666' }}
                minTickGap={isMobile ? 40 : 20}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#666' }}
              />
              <Tooltip
                formatter={(value: unknown, name: string) => [
                  `${Number(value).toFixed(1)}`,
                  name === 'score' ? 'Nota' : 'Peso'
                ]}
                labelFormatter={(label) => `Critério: ${label}`}
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Bar
                dataKey="score"
                fill="#3b82f6"
                name="Nota"
                radius={[2, 2, 0, 0]}
                isAnimationActive={!reducedMotion}
              />
              <Bar
                dataKey="weight"
                fill="#64748b"
                name="Peso (%)"
                radius={[2, 2, 0, 0]}
                isAnimationActive={!reducedMotion}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Score Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {politician.currentScore.overall.toFixed(1)}
          </div>
          <div className="text-lg text-gray-700 mb-4">Nota geral ponderada</div>
          <div className="text-sm text-gray-600">
            Calculada com base nos pesos de cada critério conforme nossa metodologia
          </div>
        </div>
      </div>
    </div>
  );
}