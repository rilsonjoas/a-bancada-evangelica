import React from 'react';
import { TrendingUp, TrendingDown, Minus, Users, Calendar } from 'lucide-react';
import { CriteriaLabel, CRITERIA_BY_KEY } from '@/lib/criteria';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface KeyAgendaCardProps {
  agenda: {
    id: string;
    title: string;
    description: string;
    criteria: string;
    totalVotes: number;
    favorableVotes: number;
    contraryVotes: number;
    abstentions: number;
    consensusScore: number;
  };
}

export function KeyAgendaCard({ agenda }: KeyAgendaCardProps) {
  const getCriteriaColor = (criteria: string) =>
    CRITERIA_BY_KEY[criteria]?.badgeClass ?? 'bg-gray-100 text-gray-800';

  const getConsensusLevel = (score: number) => {
    if (score >= 80) return { label: 'Alto Consenso', color: 'text-green-600' };
    if (score >= 60) return { label: 'Consenso Moderado', color: 'text-blue-600' };
    if (score >= 40) return { label: 'Baixo Consenso', color: 'text-yellow-600' };
    return { label: 'Muito Polarizado', color: 'text-red-600' };
  };

  const favorablePercentage = (agenda.favorableVotes / agenda.totalVotes) * 100;
  const contraryPercentage = (agenda.contraryVotes / agenda.totalVotes) * 100;
  const abstentionPercentage = (agenda.abstentions / agenda.totalVotes) * 100;

  const consensus = getConsensusLevel(agenda.consensusScore);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{agenda.title}</CardTitle>
            <p className="text-gray-600 text-sm mb-3">{agenda.description}</p>
            <div className="flex items-center gap-3">
              <Badge className={`text-xs ${getCriteriaColor(agenda.criteria)}`}>
                <CriteriaLabel criteriaKey={agenda.criteria} />
              </Badge>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{agenda.totalVotes} votos</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${consensus.color}`}>
              {agenda.consensusScore.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">{consensus.label}</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Voting Distribution */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Favoráveis</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-green-600">{agenda.favorableVotes}</span>
                <span className="text-sm text-gray-500 ml-1">
                  ({favorablePercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            <Progress value={favorablePercentage} className="h-2" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium">Contrários</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-red-600">{agenda.contraryVotes}</span>
                <span className="text-sm text-gray-500 ml-1">
                  ({contraryPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            <Progress value={contraryPercentage} className="h-2" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium">Abstenções</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-yellow-600">{agenda.abstentions}</span>
                <span className="text-sm text-gray-500 ml-1">
                  ({abstentionPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            <Progress value={abstentionPercentage} className="h-2" />
          </div>

          {/* Visual Summary */}
          <div className="flex items-center justify-center pt-4 border-t">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">{agenda.favorableVotes}</div>
                <div className="text-xs text-gray-600">Favoráveis</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">{agenda.contraryVotes}</div>
                <div className="text-xs text-gray-600">Contrários</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">{agenda.abstentions}</div>
                <div className="text-xs text-gray-600">Abstenções</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}