import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
  const criteria = [
    { key: 'lifeProtection', label: '🛡️ Proteção à Vida', weight: '25%' },
    { key: 'familyValues', label: '👨‍👩‍👧‍👦 Valores Familiares', weight: '20%' },
    { key: 'moralIntegrity', label: '⚖️ Integridade Moral', weight: '20%' },
    { key: 'socialResponsibility', label: '🤝 Responsabilidade Social', weight: '10%' },
    { key: 'religiousFreedom', label: '✝️ Liberdade Religiosa', weight: '5%' }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 font-bold';
    if (score >= 60) return 'text-blue-600 font-semibold';
    if (score >= 40) return 'text-yellow-600 font-medium';
    return 'text-red-600 font-bold';
  };

  const getBestInCriteria = (criteriaKey: string) => {
    return politicians.reduce((best, current) => {
      const bestScore = best.currentScore?.[criteriaKey as keyof typeof best.currentScore] || 0;
      const currentScore = current.currentScore?.[criteriaKey as keyof typeof current.currentScore] || 0;
      return currentScore > bestScore ? current : best;
    });
  };

  const getWorstInCriteria = (criteriaKey: string) => {
    return politicians.reduce((worst, current) => {
      const worstScore = worst.currentScore?.[criteriaKey as keyof typeof worst.currentScore] || 100;
      const currentScore = current.currentScore?.[criteriaKey as keyof typeof current.currentScore] || 100;
      return currentScore < worstScore ? current : worst;
    });
  };

  const getRankIcon = (politician: ComparisonTableProps['politicians'][number], criteriaKey: string) => {
    const best = getBestInCriteria(criteriaKey);
    const worst = getWorstInCriteria(criteriaKey);
    
    if (politician.id === best.id && politicians.length > 1) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    if (politician.id === worst.id && politicians.length > 1) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
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
                <span>🏆 Pontuação Geral</span>
                <Badge variant="secondary" className="text-xs">100%</Badge>
              </div>
            </td>
            {politicians.map(politician => (
              <td key={politician.id} className="text-center p-4">
                <div className="flex flex-col items-center gap-1">
                  <div className={`text-lg ${getScoreColor(politician.currentScore?.overall || 0)}`}>
                    {politician.currentScore?.overall?.toFixed(1) || '0.0'}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {politician.currentScore?.performanceLabel || 'Sem dados'}
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
                  <span>{criterion.label}</span>
                  <Badge variant="outline" className="text-xs">{criterion.weight}</Badge>
                </div>
              </td>
              {politicians.map(politician => (
                <td key={politician.id} className="text-center p-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`text-lg ${getScoreColor(politician.currentScore?.[criterion.key as keyof typeof politician.currentScore] || 0)}`}>
                      {(politician.currentScore?.[criterion.key as keyof typeof politician.currentScore] || 0).toFixed(1)}
                    </div>
                    {getRankIcon(politician, criterion.key)}
                  </div>
                </td>
              ))}
            </tr>
          ))}

          {/* Estatísticas adicionais */}
          <tr className="border-b bg-gray-50">
            <td className="p-4 font-semibold">📊 Total de Votações</td>
            {politicians.map(politician => (
              <td key={politician.id} className="text-center p-4">
                <div className="text-lg font-medium">
                  {politician.currentScore?.totalVotes || 0}
                </div>
              </td>
            ))}
          </tr>

          <tr className="border-b bg-gray-50">
            <td className="p-4 font-semibold">🎯 Consistência</td>
            {politicians.map(politician => (
              <td key={politician.id} className="text-center p-4">
                <div className="text-lg font-medium">
                  {((politician.currentScore?.consistencyScore || 0) * 100).toFixed(0)}%
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
            <span>Pontuação intermediária</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-600">
          * Os pesos mostrados refletem a importância de cada critério na pontuação geral conforme nossa metodologia
        </div>
      </div>
    </div>
  );
}