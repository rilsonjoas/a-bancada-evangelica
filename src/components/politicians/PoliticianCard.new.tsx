import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, MapPin, Building, ExternalLink, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos atualizados para dados reais do banco
interface PoliticianScore {
  lifeProtection: number;
  familyValues: number;
  moralIntegrity: number;
  socialResponsibility: number;
  religiousFreedom: number;
  overall: number;
  performanceLevel: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  performanceLabel: string;
  totalVotes: number;
  consistencyScore: number;
}

interface PoliticianData {
  id: number;
  name: string;
  currentParty: string;
  currentState: string;
  currentHouse: 'CAMARA' | 'SENADO';
  photoUrl?: string;
  scores: PoliticianScore;
}

interface PoliticianCardProps {
  politician: PoliticianData;
  rank?: number;
}

const PoliticianCard: React.FC<PoliticianCardProps> = ({ politician, rank }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    if (score >= 40) return 'outline';
    return 'destructive';
  };

  const getPerformanceBadge = (level: string) => {
    const badges = {
      'EXCELLENT': { variant: 'default', label: 'Excelente', color: 'bg-green-100 text-green-800' },
      'GOOD': { variant: 'secondary', label: 'Bom', color: 'bg-yellow-100 text-yellow-800' },
      'AVERAGE': { variant: 'outline', label: 'Médio', color: 'bg-orange-100 text-orange-800' },
      'POOR': { variant: 'destructive', label: 'Insuficiente', color: 'bg-red-100 text-red-800' },
    };
    return badges[level as keyof typeof badges] || badges.AVERAGE;
  };

  const formatScore = (score: number) => score.toFixed(0);
  const formatConsistency = (score: number) => `${(score * 100).toFixed(0)}%`;

  const performanceBadge = getPerformanceBadge(politician.scores.performanceLevel);

  return (
    <Card className="hover:shadow-lg transition-all duration-300 group border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Rank Badge */}
          {rank && (
            <div className="flex-shrink-0">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                rank <= 3 
                  ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white" 
                  : "bg-gray-100 text-gray-700"
              )}>
                {rank}
              </div>
            </div>
          )}

          {/* Photo */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
              {politician.photoUrl ? (
                <img 
                  src={politician.photoUrl} 
                  alt={politician.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {politician.name}
                </h3>
                
                <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Building className="h-3 w-3" />
                    <span className="font-medium">{politician.currentParty}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{politician.currentState}</span>
                  </div>
                </div>
              </div>

              {/* Overall Score */}
              <div className="flex-shrink-0 text-right">
                <Badge 
                  variant={getScoreBadgeVariant(politician.scores.overall)}
                  className="font-semibold text-sm"
                >
                  {formatScore(politician.scores.overall)}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  Testemunho Fiel
                </p>
              </div>
            </div>

            {/* Performance Level */}
            <div className="mb-3">
              <Badge 
                className={cn("text-xs", performanceBadge.color)}
                variant="outline"
              >
                {performanceBadge.label}
              </Badge>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              <div className="text-center">
                <div className={cn("text-sm font-bold", getScoreColor(politician.scores.lifeProtection))}>
                  {formatScore(politician.scores.lifeProtection)}
                </div>
                <div className="text-xs text-gray-500">Vida</div>
              </div>
              <div className="text-center">
                <div className={cn("text-sm font-bold", getScoreColor(politician.scores.familyValues))}>
                  {formatScore(politician.scores.familyValues)}
                </div>
                <div className="text-xs text-gray-500">Família</div>
              </div>
              <div className="text-center">
                <div className={cn("text-sm font-bold", getScoreColor(politician.scores.moralIntegrity))}>
                  {formatScore(politician.scores.moralIntegrity)}
                </div>
                <div className="text-xs text-gray-500">Moral</div>
              </div>
              <div className="text-center">
                <div className={cn("text-sm font-bold", getScoreColor(politician.scores.socialResponsibility))}>
                  {formatScore(politician.scores.socialResponsibility)}
                </div>
                <div className="text-xs text-gray-500">Social</div>
              </div>
              <div className="text-center">
                <div className={cn("text-sm font-bold", getScoreColor(politician.scores.religiousFreedom))}>
                  {formatScore(politician.scores.religiousFreedom)}
                </div>
                <div className="text-xs text-gray-500">Religião</div>
              </div>
            </div>

            {/* Statistics */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <Award className="h-3 w-3" />
                <span>{formatConsistency(politician.scores.consistencyScore)} consistência</span>
              </div>
              <div>
                <span className="font-medium">{politician.scores.totalVotes}</span> votações
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {politician.currentHouse === 'CAMARA' ? 'Deputado(a)' : 'Senador(a)'}
              </Badge>
              
              <Link to={`/politicos/${politician.id}`}>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  Ver detalhes
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PoliticianCard;