import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, MapPin, Building, ExternalLink, Award } from 'lucide-react';
import { APIPolitician } from '@/types/politician';
import { cn } from '@/lib/utils';

interface PoliticianCardProps {
  politician: APIPolitician;
  rank?: number;
}

const PoliticianCard: React.FC<PoliticianCardProps> = ({ politician, rank }) => {
  const [imageError, setImageError] = useState(false);
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-poor';
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
    <Card className="card-elevated hover:shadow-elevated transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Rank Badge */}
          {rank && (
            <div className="flex-shrink-0">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                rank <= 3 ? "bg-gradient-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
              )}>
                {rank}
              </div>
            </div>
          )}

          {/* Photo */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center overflow-hidden border border-card-border">
              {politician.photoUrl && !imageError ? (
                <img
                  src={politician.photoUrl}
                  alt={politician.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" data-testid="user-icon" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {politician.name}
                </h3>
                
                <div className="flex items-center space-x-3 mt-1 text-sm text-muted-foreground">
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
                <p className="text-xs text-muted-foreground mt-1 max-w-[76px] leading-tight ml-auto">
                  Testemunho Fiel
                </p>
              </div>
            </div>

            {/* Performance Level + Bancada */}
            <div className="mb-3 flex items-center flex-wrap gap-1.5">
              <Badge
                className={cn("text-xs", performanceBadge.color)}
                variant="outline"
              >
                {performanceBadge.label}
              </Badge>
              {politician.isFpeMember && (
                <Badge
                  variant="outline"
                  className="text-xs bg-purple-50 text-purple-800 border-purple-200"
                  title="Integrante da Frente Parlamentar Evangélica"
                >
                  Bancada Evangélica
                </Badge>
              )}
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">
                  {formatScore(politician.scores.lifeProtection)}
                </div>
                <div className="text-[10px] leading-tight text-muted-foreground">Vida</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">
                  {formatScore(politician.scores.familyValues)}
                </div>
                <div className="text-[10px] leading-tight text-muted-foreground">Família</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">
                  {formatScore(politician.scores.moralIntegrity)}
                </div>
                <div className="text-[10px] leading-tight text-muted-foreground">Moral</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">
                  {formatScore(politician.scores.socialResponsibility)}
                </div>
                <div className="text-[10px] leading-tight text-muted-foreground">Social</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">
                  {formatScore(politician.scores.religiousFreedom)}
                </div>
                <div className="text-[10px] leading-tight text-muted-foreground">Religião</div>
              </div>
            </div>

            {/* Statistics */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
              <div className="flex items-center space-x-1">
                <Award className="h-3 w-3" />
                {/* Sem votações não existe consistência a exibir — o valor
                    antigo vinha de um fallback do sync-worker antigo que
                    preservava lixo (100%) no banco */}
                <span>
                  {politician.scores.totalVotes > 0
                    ? `${formatConsistency(politician.scores.consistencyScore)} consistência`
                    : 'sem votações registradas'}
                </span>
              </div>
              {politician.scores.totalVotes > 0 && (
                <div>
                  <span className="font-medium">{politician.scores.totalVotes}</span> votações
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {politician.currentHouse === 'CAMARA' ? 'Deputado(a)' : 'Senador(a)'}
              </Badge>
              
              <Link to={`/politicos/${politician.id}`}>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary-hover">
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