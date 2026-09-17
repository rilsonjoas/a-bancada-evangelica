import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, MapPin, Building, ExternalLink, Award, Lightbulb } from 'lucide-react';
import { APIPolitician } from '@/types/politician';
import { cn } from '@/lib/utils';
import { PoliticalTooltip, POLITICAL_GLOSSARY } from '@/components/common/PoliticalTooltip';
import { FpeTierChip } from '@/components/politicians/FpeTierChip';
import { getPerformanceBadgeColor, getPerformanceLabel } from '@/lib/performance';

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

  const formatScore = (score: number) => score.toFixed(0);
  const formatConsistency = (score: number) => `${(score * 100).toFixed(0)}%`;

  const performanceBadge = {
    label: getPerformanceLabel(politician.scores.performanceLevel, politician.scores.totalVotes),
    color: getPerformanceBadgeColor(politician.scores.performanceLevel, politician.scores.totalVotes),
  };

  return (
    <Card className="card-elevated hover:shadow-elevated transition-all duration-300 group">
      <CardContent className="p-5 md:p-6">
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
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors" title={politician.name}>
                  {politician.name}
                </h3>
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground min-w-0">
                  <div className="flex items-center space-x-1 min-w-0">
                    <Building className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-medium truncate" title={politician.currentParty}>{politician.currentParty}</span>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{politician.currentState}</span>
                  </div>
                </div>
              </div>

              {/* Overall Score */}
              <div className="flex-shrink-0 text-right pl-3 border-l border-border/40">
                <Badge 
                  variant={getScoreBadgeVariant(politician.scores.overall)}
                  className="font-semibold text-sm px-2.5 py-0.5"
                >
                  {formatScore(politician.scores.overall)}
                </Badge>
                <div className="text-[11px] text-muted-foreground mt-1 block whitespace-nowrap">
                  <PoliticalTooltip term="Nota geral" explanation={POLITICAL_GLOSSARY.notaGeral} />
                </div>
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
              {politician.scores.totalVotes != null && politician.scores.totalVotes > 0 && (
                <PoliticalTooltip term="O que significa?" explanation={POLITICAL_GLOSSARY.aderência} className="text-[10px]" />
              )}
              {politician.isFpeMember && (
                <FpeTierChip
                  tier={politician.fpe?.tier}
                  source={politician.fpe?.source}
                  sourceUrl={politician.fpe?.sourceUrl}
                  capturedAt={politician.fpe?.capturedAt}
                />
              )}
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-3 p-1.5 sm:p-2 bg-muted/30 rounded-lg border border-border/30">
              <div className="text-center" title="Proteção à vida desde a concepção (0 a 100 pts)">
                <div className="text-xs sm:text-sm font-bold text-foreground">
                  {formatScore(politician.scores.lifeProtection)}
                </div>
                <div className="text-[10px] font-medium leading-tight text-muted-foreground">Vida</div>
              </div>
              <div className="text-center" title="Fortalecimento da família e infância (0 a 100 pts)">
                <div className="text-xs sm:text-sm font-bold text-foreground">
                  {formatScore(politician.scores.familyValues)}
                </div>
                <div className="text-[10px] font-medium leading-tight text-muted-foreground">Família</div>
              </div>
              <div className="text-center" title="Combate à corrupção e integridade pública (0 a 100 pts)">
                <div className="text-xs sm:text-sm font-bold text-foreground">
                  {formatScore(politician.scores.moralIntegrity)}
                </div>
                <div className="text-[10px] font-medium leading-tight text-muted-foreground">Moral</div>
              </div>
              <div className="text-center" title="Dignidade humana e justiça social (0 a 100 pts)">
                <div className="text-xs sm:text-sm font-bold text-foreground">
                  {formatScore(politician.scores.socialResponsibility)}
                </div>
                <div className="text-[10px] font-medium leading-tight text-muted-foreground">Social</div>
              </div>
              <div className="text-center" title="Proteção à liberdade de culto e expressão (0 a 100 pts)">
                <div className="text-xs sm:text-sm font-bold text-foreground">
                  {formatScore(politician.scores.religiousFreedom)}
                </div>
                <div className="text-[10px] font-medium leading-tight text-muted-foreground">Liberdade Relig.</div>
              </div>
            </div>

            {/* Aviso Didático se a nota for estimativa */}
            {politician.scores.totalVotes === 0 && (
              <div className="mb-3 text-[11px] bg-amber-500/10 text-amber-800 dark:text-amber-300 px-2.5 py-1.5 rounded border border-amber-500/20 leading-tight">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600 inline mr-1 shrink-0" /> <PoliticalTooltip term="Nota estimada" explanation={POLITICAL_GLOSSARY.notaEstimada} /> pela média partidária devido à falta de votações presenciais registradas.
              </div>
            )}

            {/* Statistics */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
              <div className="flex items-center space-x-1">
                <Award className="h-3 w-3" />
                {/* Sem votações não existe consistência a exibir — o valor
                    antigo vinha de um fallback do sync-worker antigo que
                    preservava lixo (100%) no banco */}
                <span>
                  {politician.scores.totalVotes > 0 ? (
                    <>
                      {formatConsistency(politician.scores.consistencyScore)} <PoliticalTooltip term="consistência" explanation={POLITICAL_GLOSSARY.consistência} />
                    </>
                  ) : (
                    'sem votações registradas'
                  )}
                </span>
              </div>
              {politician.scores.totalVotes > 0 && (
                <div>
                  {politician.scores.totalVotes < 5 ? (
                    <span className="font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 text-[11px] leading-none inline-block" title="Poucos votos classificados — a nota é uma base frágil, confira os votos no perfil.">
                      Base frágil ({politician.scores.totalVotes} vota{politician.scores.totalVotes !== 1 ? 'ções' : 'ção'})
                    </span>
                  ) : (
                    <>
                      <span className="font-medium">{politician.scores.totalVotes}</span> votações
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <Badge variant="outline" className="text-xs">
                {politician.currentHouse === 'CAMARA' ? 'Deputado(a)' : 'Senador(a)'}
              </Badge>
              
              <Link to={`/politicos/${politician.id}`} aria-label={`Ver detalhes de ${politician.name}`}>
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