import React from 'react';
import { TrendingUp, TrendingDown, Minus, Users, Calendar, Info } from 'lucide-react';
import { CriteriaLabel, CRITERIA_BY_KEY } from '@/lib/criteria';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { fmt } from '@/lib/format';

interface KeyAgendaCardProps {
  agenda: {
    id: string;
    title: string;
    description: string;
    practicalImpact?: string | null;
    criteria: string;
    totalVotes: number;
    favorableVotes: number;
    contraryVotes: number;
    abstentions: number;
    consensusScore: number;
    firstVoteDate?: string | null;
    lastVoteDate?: string | null;
  };
}

export function KeyAgendaCard({ agenda }: KeyAgendaCardProps) {
  const getCriteriaColor = (criteria: string) =>
    CRITERIA_BY_KEY[criteria]?.badgeClass ?? 'bg-gray-100 text-gray-800';

  const rationale = CRITERIA_BY_KEY[agenda.criteria]?.rationale;

  const formatDate = (iso?: string | null) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return null; }
  };
  const firstDate = formatDate(agenda.firstVoteDate);
  const lastDate = formatDate(agenda.lastVoteDate);

  const getConsensusLevel = (score: number) => {
    if (score >= 80) return { label: 'Alto Consenso', color: 'text-green-700' };
    if (score >= 60) return { label: 'Consenso Moderado', color: 'text-blue-600' };
    if (score >= 40) return { label: 'Baixo Consenso', color: 'text-yellow-700' };
    return { label: 'Muito Polarizado', color: 'text-red-600' };
  };

  const safe = (n: number) => (agenda.totalVotes > 0 ? n : 0);
  const favorablePercentage = safe((agenda.favorableVotes / agenda.totalVotes) * 100);
  const contraryPercentage = safe((agenda.contraryVotes / agenda.totalVotes) * 100);
  const abstentionPercentage = safe((agenda.abstentions / agenda.totalVotes) * 100);

  const consensus = getConsensusLevel(agenda.consensusScore);

  const hasVotes = agenda.totalVotes > 0;

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
                <span>{hasVotes ? `${agenda.totalVotes} votos` : 'Sem votos registrados'}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${consensus.color}`}>
              {fmt(agenda.consensusScore)}%
            </div>
            <div className="text-sm text-gray-600">{consensus.label}</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Contexto pro eleitor — o que o critério cobre e quando foi votado.
            Sem isso o card era só "Valores Familiares +15 pts" sem sentido. */}
        {rationale && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-secondary/40 p-3">
            <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-0.5">Por que esta pauta está neste critério?</p>
              <p className="text-muted-foreground leading-relaxed">{rationale}</p>
            </div>
          </div>
        )}
        {agenda.practicalImpact && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-primary/5 p-3 border border-primary/10">
            <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-0.5">Na prática, isso significa…</p>
              <p className="text-muted-foreground leading-relaxed">{agenda.practicalImpact}</p>
            </div>
          </div>
        )}
        {(firstDate || lastDate) && (
          <p className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Votações entre {firstDate} e {lastDate}
          </p>
        )}
        {!hasVotes && (
          <p className="text-sm text-muted-foreground text-center py-4 italic">
            Votos ainda não registrados para esta pauta no banco de dados.
          </p>
        )}
        {hasVotes && <div className="space-y-4">
          {/* Voting Distribution */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-700" />
                <span className="text-sm font-medium">Favoráveis</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-green-700">{agenda.favorableVotes}</span>
                <span className="text-sm text-gray-500 ml-1">
                  ({fmt(favorablePercentage)}%)
                </span>
              </div>
            </div>
            <Progress value={favorablePercentage} className="h-2" aria-label="Percentual de votos favoráveis" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium">Contrários</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-red-600">{agenda.contraryVotes}</span>
                <span className="text-sm text-gray-500 ml-1">
                  ({fmt(contraryPercentage)}%)
                </span>
              </div>
            </div>
            <Progress value={contraryPercentage} className="h-2" aria-label="Percentual de votos contrários" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-yellow-700" />
                <span className="text-sm font-medium">Abstenções</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-yellow-700">{agenda.abstentions}</span>
                <span className="text-sm text-gray-500 ml-1">
                  ({fmt(abstentionPercentage)}%)
                </span>
              </div>
            </div>
            <Progress value={abstentionPercentage} className="h-2" aria-label="Percentual de abstenções" />
          </div>

          {/* Visual Summary */}
          <div className="flex items-center justify-center pt-4 border-t">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-lg font-bold text-green-700">{agenda.favorableVotes}</div>
                <div className="text-xs text-gray-600">Favoráveis</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">{agenda.contraryVotes}</div>
                <div className="text-xs text-gray-600">Contrários</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-700">{agenda.abstentions}</div>
                <div className="text-xs text-gray-600">Abstenções</div>
              </div>
            </div>
          </div>
        </div>}
      </CardContent>
    </Card>
  );
}