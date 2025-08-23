import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, MapPin, Building, ExternalLink, Award } from 'lucide-react';
import { Politician } from '@/types/politician';
import { cn } from '@/lib/utils';

interface PoliticianCardProps {
  politician: Politician;
  rank?: number;
}

const PoliticianCard: React.FC<PoliticianCardProps> = ({ politician, rank }) => {
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

  const formatScore = (score: number) => score.toFixed(1);

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
              {politician.photo ? (
                <img 
                  src={politician.photo} 
                  alt={politician.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
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
                    <span className="font-medium">{politician.party}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{politician.state}</span>
                  </div>
                </div>
              </div>

              {/* Overall Score */}
              <div className="flex-shrink-0 text-right">
              <Badge 
                variant={getScoreBadgeVariant(politician.overallScore)}
                className="font-semibold text-sm"
              >
                {formatScore(politician.overallScore)}
              </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Testemunho Fiel
                </p>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">
                  {formatScore(politician.scores.lifeProtection)}
                </div>
                <div className="text-xs text-muted-foreground">Vida</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">
                  {formatScore(politician.scores.familyValues)}
                </div>
                <div className="text-xs text-muted-foreground">Família</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">
                  {formatScore(politician.scores.moralIntegrity)}
                </div>
                <div className="text-xs text-muted-foreground">Moral</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">
                  {formatScore(politician.scores.socialResponsibility)}
                </div>
                <div className="text-xs text-muted-foreground">Social</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">
                  {formatScore(politician.scores.religiousFreedom)}
                </div>
                <div className="text-xs text-muted-foreground">Religião</div>
              </div>
            </div>

            {/* Statistics */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
              <div className="flex items-center space-x-1">
                <Award className="h-3 w-3" />
                <span>{politician.voting.alignmentPercentage}% alinhamento</span>
              </div>
              <div>
                <span className="font-medium">{politician.voting.totalVotes}</span> votações
              </div>
              <div>
                <span className="font-medium">{politician.projects.authored + politician.projects.coAuthored}</span> projetos
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {politician.house === 'deputado' ? 'Deputado(a)' : 'Senador(a)'}
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