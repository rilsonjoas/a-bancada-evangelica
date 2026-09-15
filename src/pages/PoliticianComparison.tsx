import { usePageMeta } from '@/hooks/usePageMeta';
import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, X, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useComparisonData, type ComparisonPolitician } from '@/hooks/useComparisonData';
import { usePoliticianSearch } from '@/hooks/usePoliticianSearch';
import { PoliticianSelector } from '@/components/comparison/PoliticianSelector';
import { ComparisonChart } from '@/components/comparison/ComparisonChart';
import { ComparisonTable } from '@/components/comparison/ComparisonTable';

export function PoliticianComparison() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSelectingPolitician, setIsSelectingPolitician] = useState(false);
  
  // Get politician IDs from URL params
  const politicianIds = searchParams.get('ids')?.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) || [];
  
  const {
  data: comparisonData, isLoading, error } = useComparisonData(politicianIds);

  const addPolitician = (politicianId: number) => {
    if (!politicianIds.includes(politicianId) && politicianIds.length < 4) {
      const newIds = [...politicianIds, politicianId];
      setSearchParams({ ids: newIds.join(',') });
    }
    setIsSelectingPolitician(false);
  };

  const removePolitician = (politicianId: number) => {
    const newIds = politicianIds.filter(id => id !== politicianId);
    if (newIds.length === 0) {
      setSearchParams({});
    } else {
      setSearchParams({ ids: newIds.join(',') });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-700';
    return 'text-red-600';
  };

  const getPerformanceBadge = (level: string) => {
    const variants = {
      EXCELLENT: 'bg-green-100 text-green-800',
      GOOD: 'bg-blue-100 text-blue-800',
      AVERAGE: 'bg-yellow-100 text-yellow-800',
      POOR: 'bg-red-100 text-red-800'
    };
    return variants[level as keyof typeof variants] || variants.AVERAGE;
  };

  const compareScores = (politician1: ComparisonPolitician, politician2: ComparisonPolitician, criterion: string) => {
    const score1 = politician1.currentScore?.[criterion] || 0;
    const score2 = politician2.currentScore?.[criterion] || 0;
    
    if (score1 > score2) return 'higher';
    if (score1 < score2) return 'lower';
    return 'equal';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16 text-red-700">
          Não foi possível carregar os dados.{" "}
          <Link to="/comparar" className="underline">Tente novamente</Link>.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao ranking
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Comparar Parlamentares</h1>
            <p className="text-gray-600 mt-2">
              Escolha até 4 parlamentares e veja as notas de cada critério lado a lado
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {politicianIds.length === 0 && (
        <div className="text-center py-16">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Nenhum parlamentar escolhido ainda</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Quer saber quem vota mais alinhado com os critérios que você valoriza?
            Escolha até 4 parlamentares e compare as notas de cada um, lado a lado.
          </p>
          <Button onClick={() => setIsSelectingPolitician(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Escolher o primeiro parlamentar
          </Button>
        </div>
      )}

      {/* Comparison Content */}
      {comparisonData && comparisonData.length > 0 && (
        <div className="space-y-8">
          {/* Politicians Overview Cards */}
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
            {comparisonData.map((politician, index) => (
              <Card key={politician.id} className="relative snap-center min-w-[85vw] md:min-w-0 shrink-0 md:shrink">
                <Button
                  onClick={() => removePolitician(politician.id)}
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remover ${politician.name} da comparação`}
                >
                  <X className="w-4 h-4" />
                </Button>
                
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={politician.photoUrl} alt={politician.name} />
                      <AvatarFallback>
                        {politician.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{politician.name}</h3>
                      <p className="text-sm text-gray-600">
                        {politician.currentParty} - {politician.currentState}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(politician.currentScore?.overall || 0)}`}>
                        {politician.currentScore?.overall?.toFixed(1) || '0.0'}
                      </div>
                      <Badge className={`${getPerformanceBadge(politician.currentScore?.performanceLevel || 'AVERAGE')}`}>
                        {politician.currentScore?.performanceLabel || 'Sem dados'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Proteção à Vida</span>
                        <span className="font-medium">
                          {politician.currentScore?.lifeProtection?.toFixed(0) || '0'}
                        </span>
                      </div>
                      <Progress
                        value={politician.currentScore?.lifeProtection || 0}
                        className="h-2"
                        aria-label={`Proteção à Vida: ${politician.currentScore?.lifeProtection?.toFixed(0) || '0'} de 100`}
                      />
                      
                      <div className="flex justify-between text-xs">
                        <span>👨‍👩‍👧‍👦 Família</span>
                        <span className="font-medium">
                          {politician.currentScore?.familyValues?.toFixed(0) || '0'}
                        </span>
                      </div>
                      <Progress
                        value={politician.currentScore?.familyValues || 0}
                        className="h-2"
                        aria-label={`Valores Familiares: ${politician.currentScore?.familyValues?.toFixed(0) || '0'} de 100`}
                      />
                      
                      <div className="flex justify-between text-xs">
                        <span>Integridade Moral</span>
                        <span className="font-medium">
                          {politician.currentScore?.moralIntegrity?.toFixed(0) || '0'}
                        </span>
                      </div>
                      <Progress
                        value={politician.currentScore?.moralIntegrity || 0}
                        className="h-2"
                        aria-label={`Integridade Moral: ${politician.currentScore?.moralIntegrity?.toFixed(0) || '0'} de 100`}
                      />
                    </div>

                    <Link to={`/politicos/${politician.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Ver perfil completo
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Add Politician Card */}
            {politicianIds.length < 4 && (
              <Card
                className="border-dashed border-2 cursor-pointer hover:border-blue-500 transition-colors snap-center min-w-[85vw] md:min-w-0 shrink-0 md:shrink"
                role="button"
                tabIndex={0}
                aria-label="Adicionar parlamentar à comparação"
                onClick={() => setIsSelectingPolitician(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsSelectingPolitician(true);
                  }
                }}
              >
                <CardContent className="flex items-center justify-center h-full min-h-40 sm:min-h-64">
                  <div className="text-center text-gray-500">
                    <Plus className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-medium">Adicionar parlamentar</p>
                    <p className="text-sm">Clique para selecionar</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Detailed Comparison */}
          {comparisonData.length >= 2 && (
            <>
              {/* Comparison Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparação Visual dos Critérios</CardTitle>
                </CardHeader>
                <CardContent>
                  <ComparisonChart politicians={comparisonData} />
                </CardContent>
              </Card>

              {/* Detailed Comparison Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparação Detalhada</CardTitle>
                </CardHeader>
                <CardContent>
                  <ComparisonTable politicians={comparisonData} />
                </CardContent>
              </Card>

              {/* Side by Side Analysis */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Melhor Desempenho por Critério</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { key: 'lifeProtection', label: 'Proteção à Vida' },
                        { key: 'familyValues', label: '👨‍👩‍👧‍👦 Valores Familiares' },
                        { key: 'moralIntegrity', label: 'Integridade Moral Moral' },
                        { key: 'socialResponsibility', label: '🤝 Responsabilidade Social' },
                        { key: 'religiousFreedom', label: 'Liberdade Religiosa' }
                      ].map(criterion => {
                        const topPolitician = comparisonData.reduce((best, current) => {
                          const bestScore = best.currentScore?.[criterion.key] || 0;
                          const currentScore = current.currentScore?.[criterion.key] || 0;
                          return currentScore > bestScore ? current : best;
                        });

                        return (
                          <div key={criterion.key} className="flex items-center justify-between">
                            <span className="text-sm">{criterion.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{topPolitician.name}</span>
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-bold text-green-600">
                                {topPolitician.currentScore?.[criterion.key]?.toFixed(0) || '0'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Estatísticas da Comparação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Parlamentares comparados:</span>
                        <span className="font-semibold">{comparisonData.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Maior pontuação geral:</span>
                        <span className="font-semibold text-green-600">
                          {Math.max(...comparisonData.map(p => p.currentScore?.overall || 0)).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Menor pontuação geral:</span>
                        <span className="font-semibold text-red-600">
                          {Math.min(...comparisonData.map(p => p.currentScore?.overall || 0)).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Diferença máxima:</span>
                        <span className="font-semibold">
                          {(Math.max(...comparisonData.map(p => p.currentScore?.overall || 0)) - 
                            Math.min(...comparisonData.map(p => p.currentScore?.overall || 0))).toFixed(1)} pts
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* Politician Selector Modal */}
      {isSelectingPolitician && (
        <PoliticianSelector
          excludeIds={politicianIds}
          onSelect={addPolitician}
          onClose={() => setIsSelectingPolitician(false)}
        />
      )}
    </div>
  );
}