import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Building, Calendar, Mail, TrendingUp, TrendingDown, Minus, Share2, Image as ImageIcon, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { usePoliticianDetail } from '@/hooks/usePoliticianDetail';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { VotingHistoryChart } from '@/components/charts/VotingHistoryChart';
import { ExpenseAnalysisChart } from '@/components/charts/ExpenseAnalysisChart';
import { ShareableCard } from '@/components/social/ShareableCard';
import { CRITERIA, CRITERIA_BY_KEY } from '@/lib/criteria';

export function PoliticianProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: politician, isLoading, error } = usePoliticianDetail(parseInt(id || '0'));

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !politician) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Político não encontrado</h1>
          <p className="text-gray-600 mb-6">O político solicitado não foi encontrado em nossa base de dados.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao ranking
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getPerformanceBadge = (level: string) => {
    const variants = {
      EXCELLENT: 'bg-green-100 text-green-800',
      GOOD: 'bg-blue-100 text-blue-800',
      AVERAGE: 'bg-yellow-100 text-yellow-800',
      POOR: 'bg-red-100 text-red-800'
    };
    return variants[level as keyof typeof variants] || variants.AVERAGE;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVoteIcon = (vote: string) => {
    switch (vote) {
      case 'YES': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'NO': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getVoteLabel = (vote: string) => {
    switch (vote) {
      case 'YES': return 'SIM';
      case 'NO': return 'NÃO';
      case 'ABSTENTION': return 'Abstenção';
      case 'OBSTRUCTION': return 'Obstrução';
      default: return 'Ausente';
    }
  };

  const getCriteriaLabel = (criteria: string) =>
    CRITERIA_BY_KEY[criteria]?.label ?? criteria;

  const getPerformanceLevelDescription = (level: string) => {
    const map: Record<string, { range: string; description: string }> = {
      EXCELLENT: { range: '80–100 pts', description: 'Alinhamento elevado e consistente com os valores evangélicos' },
      GOOD:      { range: '65–79 pts', description: 'Bom alinhamento — maioria das votações favoráveis às pautas cristãs' },
      AVERAGE:   { range: '45–64 pts', description: 'Alinhamento parcial — votações mistas ou dados estimados por partido' },
      POOR:      { range: '0–44 pts',  description: 'Histórico frequentemente divergente dos valores cristãos' },
    };
    return map[level] ?? { range: '', description: '' };
  };

  const shareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `Perfil de ${politician.name} - A Bancada Evangélica`,
        text: `Veja o perfil completo de ${politician.name} na plataforma A Bancada Evangélica`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao ranking
        </Link>

        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={politician.photoUrl} alt={politician.name} />
            <AvatarFallback className="text-2xl">
              {politician.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{politician.name}</h1>
                <p className="text-xl text-gray-600 mb-4">{politician.fullName}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {politician.currentParty}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {politician.currentState}
                  </div>
                  <div className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {politician.currentHouse === 'CAMARA' ? 'Câmara dos Deputados' : 'Senado Federal'}
                  </div>
                  {politician.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${politician.email}`} className="text-blue-600 hover:underline">
                        {politician.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="text-right">
                  <Badge className={`text-lg px-4 py-2 ${getPerformanceBadge(politician.currentScore?.performanceLevel || 'AVERAGE')}`}>
                    {politician.currentScore?.performanceLabel || 'Sem dados'}
                  </Badge>
                  {(() => {
                    const lvl = getPerformanceLevelDescription(politician.currentScore?.performanceLevel || 'AVERAGE');
                    return (
                      <div className="mt-1 text-xs text-gray-500 flex items-center justify-end gap-1">
                        <Info className="w-3 h-3" />
                        <span>{lvl.range}</span>
                      </div>
                    );
                  })()}
                </div>

                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(politician.currentScore?.overall || 0)}`}>
                    {politician.currentScore?.overall?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-gray-600">Pontuação geral (0–100)</div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={shareProfile} variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartilhar
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Card pra imagem
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Card de {politician.name}</DialogTitle>
                      </DialogHeader>
                      <ShareableCard politician={politician} type="summary" />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="voting">Votações</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {!politician.currentScore && (
            <div className="p-4 bg-secondary/30 border border-border rounded-lg flex items-start gap-3 text-sm text-muted-foreground mb-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Pontuação ainda não calculada para este parlamentar. Os dados aparecem após o próximo ciclo de sincronização.</span>
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {CRITERIA.map(c => {
              const score = politician.currentScore
                ? ((politician.currentScore[c.field as keyof typeof politician.currentScore] as number) ?? 0)
                : null;
              return (
                <Card key={c.key}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                      <c.Icon className={`h-3.5 w-3.5 shrink-0 ${c.iconClass}`} />
                      <span className="truncate">{c.label}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {score !== null ? (
                      <>
                        <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score.toFixed(1)}</div>
                        <Progress value={score} className="mt-2 h-1.5" />
                      </>
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground">—</div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{c.weight}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Description and Mandates */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Descrição da Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  {politician.currentScore?.performanceDescription ||
                   'Este político está sendo avaliado com base em 5 critérios: Proteção à Vida (30%), Defesa da Família (25%), Integridade Moral (20%), Responsabilidade Social (15%) e Liberdade Religiosa (10%).'}
                </p>
                {(() => {
                  const lvl = getPerformanceLevelDescription(politician.currentScore?.performanceLevel || 'AVERAGE');
                  if (!lvl.description) return null;
                  return (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border text-sm text-gray-600">
                      <span className="font-medium">{politician.currentScore?.performanceLabel}:</span>{' '}
                      {lvl.description}
                    </div>
                  );
                })()}
                
                {politician.birthDate && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      Nascimento: {new Date(politician.birthDate).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Mandatos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {politician.mandates?.map((mandate, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">
                          {mandate.house === 'CAMARA' ? 'Deputado Federal' : 'Senador'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {mandate.party} - {mandate.state}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div>{new Date(mandate.startDate).getFullYear()}</div>
                        {mandate.isCurrent && (
                          <Badge variant="secondary" className="text-xs">Atual</Badge>
                        )}
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">Nenhum mandato registrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Performance por Critério</CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceChart politician={politician} />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total de Votações:</span>
                  <span className="font-semibold">{politician.currentScore?.totalVotes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Score de Consistência:</span>
                  <span className="font-semibold">
                    {/* Sem votações registradas não existe consistência a
                        medir — exibir "—" em vez do número (linhas antigas
                        mostravam 100% pra quem nunca votou, lixo de uma
                        fórmula antiga do sync-worker preservada no banco). */}
                    {(politician.currentScore?.totalVotes ?? 0) === 0
                      ? '—'
                      : `${((politician.currentScore?.consistencyScore ?? 0) * 100).toFixed(1)}%`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Última Atualização:</span>
                  <span className="font-semibold">
                    {politician.currentScore?.lastCalculation
                      ? new Date(politician.currentScore.lastCalculation).toLocaleDateString('pt-BR')
                      : 'Nunca'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise de Integridade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Gastos Suspeitos:</span>
                  <span className="font-semibold text-red-600">
                    R$ {politician.expenseAnalysis?.suspiciousValue?.toLocaleString('pt-BR') || '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>% Suspeitos:</span>
                  <span className="font-semibold">
                    {politician.expenseAnalysis?.suspiciousPercentage?.toFixed(1) || '0'}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Nível de Risco:</span>
                  <Badge variant={(politician.expenseAnalysis?.riskLevel || 'LOW') === 'LOW' ? 'secondary' : 'destructive'}>
                    {/* Tradução PT-BR — a API manda o enum em inglês
                        (HIGH/MEDIUM/LOW); renderizar cru era ver "LOW" no meio
                        da página em português. Mesmo mapping de
                        ExpenseAnalysisChart. */}
                    {politician.expenseAnalysis?.riskLevel === 'HIGH'
                      ? 'Alto'
                      : politician.expenseAnalysis?.riskLevel === 'MEDIUM'
                        ? 'Médio'
                        : 'Baixo'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Voting Tab */}
        <TabsContent value="voting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Votações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {politician.recentVotes?.length > 0 ? politician.recentVotes.map((vote, index) => {
                  const isPositive = vote.appliedScore > 0;
                  const isNegative = vote.appliedScore < 0;
                  const borderColor = isPositive ? 'border-l-green-500' : isNegative ? 'border-l-red-500' : 'border-l-gray-300';
                  return (
                    <div key={index} className={`p-4 border rounded-lg border-l-4 ${borderColor} bg-white`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm leading-snug">{vote.agendaTitle}</h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500">
                              {new Date(vote.voteDate).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-secondary/50 rounded-full text-muted-foreground">
                              {getCriteriaLabel(vote.criteria)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Impacto */}
                          <div className="text-right">
                            <div className={`font-bold text-sm ${isPositive ? 'text-green-700' : isNegative ? 'text-red-700' : 'text-gray-500'}`}>
                              {vote.appliedScore > 0 ? '+' : ''}{vote.appliedScore} pts
                            </div>
                            <div className="text-xs text-gray-400">no critério</div>
                          </div>

                          {/* Voto */}
                          <div className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg ${
                            vote.vote === 'YES' ? 'bg-green-50 border border-green-200' :
                            vote.vote === 'NO'  ? 'bg-red-50 border border-red-200' :
                            'bg-gray-50 border border-gray-200'
                          }`}>
                            {getVoteIcon(vote.vote)}
                            <span className={`text-xs font-bold ${
                              vote.vote === 'YES' ? 'text-green-700' :
                              vote.vote === 'NO'  ? 'text-red-700' : 'text-gray-600'
                            }`}>
                              {getVoteLabel(vote.vote)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Explicação do impacto */}
                      {vote.appliedScore !== 0 && (
                        <div className={`mt-2 text-xs px-2 py-1 rounded ${isPositive ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                          {isPositive
                            ? `✓ Voto alinhado com o posicionamento evangélico em ${getCriteriaLabel(vote.criteria)}`
                            : `✗ Voto contrário ao posicionamento evangélico em ${getCriteriaLabel(vote.criteria)}`
                          }
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <p className="text-gray-500 text-center py-8">Nenhuma votação individual registrada para este político.</p>
                )}
              </div>

              {politician.recentVotes?.length === 0 && (
                <div className="mt-4 p-4 bg-secondary/20 rounded-lg text-sm text-muted-foreground">
                  <Info className="inline w-4 h-4 mr-1" />
                  A pontuação deste político é estimada com base no alinhamento histórico do seu partido, pois ainda não há votos individuais registrados. Confira a{' '}
                  <Link to="/metodologia" className="text-primary underline">Metodologia</Link>{' '}
                  para entender como isso funciona.
                </div>
              )}
            </CardContent>
          </Card>

          {politician.recentVotes && politician.recentVotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Análise de Votações</CardTitle>
              </CardHeader>
              <CardContent>
                <VotingHistoryChart votes={politician.recentVotes} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Gastos Parlamentares</CardTitle>
            </CardHeader>
            <CardContent>
              {politician.expenseAnalysis ? (
                <ExpenseAnalysisChart analysis={politician.expenseAnalysis} />
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Análise de gastos não disponível para este político
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}