import React from 'react';
import { TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';
import { CRITERIA, CriteriaLabel } from '@/lib/criteria';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { fmt } from '@/lib/format';
import { getPerformanceLabel } from '@/lib/performance';

interface ComparisonTableProps {
  politicians: Array<{
    id: number;
    name: string;
    currentParty: string;
    currentState: string;
    photoUrl: string;
    currentScore?: {
      lifeProtection: number;
      familyValues: number;
      moralIntegrity: number;
      socialResponsibility: number;
      religiousFreedom: number;
      overall: number;
      performanceLevel: string;
      performanceLabel: string;
      totalVotes: number;
      consistencyScore: number;
    };
  }>;
}

export function ComparisonTable({ politicians }: ComparisonTableProps) {
  const criteria = CRITERIA;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 font-bold';
    if (score >= 60) return 'text-blue-600 font-semibold';
    if (score >= 40) return 'text-yellow-600 font-medium';
    return 'text-red-600 font-bold';
  };

  type ScoreField = keyof NonNullable<ComparisonTableProps['politicians'][number]['currentScore']>;

  const getFieldScore = (p: ComparisonTableProps['politicians'][number], field: string) =>
    ((p.currentScore?.[field as ScoreField] ?? 0) as number);

  const getRankIcon = (politician: ComparisonTableProps['politicians'][number], field: string) => {
    if (politicians.length < 2) return <Minus className="w-4 h-4 text-gray-400" />;
    const best = politicians.reduce((a, b) => getFieldScore(a, field) >= getFieldScore(b, field) ? a : b);
    const worst = politicians.reduce((a, b) => getFieldScore(a, field) <= getFieldScore(b, field) ? a : b);
    if (politician.id === best.id) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (politician.id === worst.id) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4 font-semibold">Critério</th>
            {politicians.map(politician => (
              <th key={politician.id} className="text-center p-4 min-w-32">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={politician.photoUrl} alt={politician.name} />
                    <AvatarFallback className="text-xs">
                      {politician.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium text-center">
                    {politician.name.split(' ')[0]}
                    <br />
                    <span className="text-xs text-gray-500">
                      {politician.currentParty}
                    </span>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Pontuação Geral */}
          <tr className="border-b bg-blue-50">
            <td className="p-4 font-semibold">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-yellow-500" /> Nota geral</span>
                <Badge variant="secondary" className="text-xs">100%</Badge>
              </div>
            </td>
            {politicians.map(politician => (
              <td key={politician.id} className="text-center p-4">
                <div className="flex flex-col items-center gap-1">
                  <div className={`text-lg ${getScoreColor(politician.currentScore?.overall || 0)}`}>
                    {politician.currentScore?.overall != null ? fmt(politician.currentScore.overall) : '—'}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getPerformanceLabel(politician.currentScore?.performanceLevel, politician.currentScore?.totalVotes)}
                  </Badge>
                  {getRankIcon(politician, 'overall')}
                </div>
              </td>
            ))}
          </tr>

          {/* Critérios individuais */}
          {criteria.map(criterion => (
            <tr key={criterion.key} className="border-b hover:bg-gray-50">
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <CriteriaLabel criteriaKey={criterion.key} />
                  <Badge variant="outline" className="text-xs">{criterion.weight}</Badge>
                </div>
              </td>
              {politicians.map(politician => (
                <td key={politician.id} className="text-center p-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`text-lg ${getScoreColor(getFieldScore(politician, criterion.field))}`}>
                      {fmt(getFieldScore(politician, criterion.field))}
                    </div>
                    {getRankIcon(politician, criterion.field)}
                  </div>
                </td>
              ))}
            </tr>
          ))}

          {/* Estatísticas adicionais */}
          <tr className="border-b bg-gray-50">
            <td className="p-4 font-semibold">Total de Votações</td>
            {politicians.map(politician => (
              <td key={politician.id} className="text-center p-4">
                <div className="text-lg font-medium">
                  {politician.currentScore?.totalVotes || 0}
                </div>
              </td>
            ))}
          </tr>

          <tr className="border-b bg-gray-50">
            <td className="p-4 font-semibold">Consistência</td>
            {politicians.map(politician => (
              <td key={politician.id} className="text-center p-4">
                <div className="text-lg font-medium">
                  {fmt((politician.currentScore?.consistencyScore || 0) * 100, 0)}%
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-3">Legenda:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span>Melhor pontuação no critério</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span>Menor pontuação no critério</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="w-4 h-4 text-gray-400" />
            <span>Nota intermediária</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-600">
          * Os pesos mostrados refletem a importância de cada critério na pontuação geral conforme nossa metodologia
        </div>
      </div>
    </div>
  );
}