import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Building, Calendar, Mail, ExternalLink, TrendingUp, TrendingDown, Minus, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePoliticianDetail } from '@/hooks/usePoliticianDetail';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { VotingHistoryChart } from '@/components/charts/VotingHistoryChart';
import { ExpenseAnalysisChart } from '@/components/charts/ExpenseAnalysisChart';

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

  const shareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `Perfil de ${politician.name} - A Bancada Evangélica`,
        text: `Veja o perfil completo de ${politician.name} na plataforma A Bancada Evangélica`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // TODO: Add toast notification
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
                <Badge className={`text-lg px-4 py-2 ${getPerformanceBadge(politician.currentScore?.performanceLevel || 'AVERAGE')}`}>
                  {politician.currentScore?.performanceLabel || 'Sem dados'}
                </Badge>
                
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(politician.currentScore?.overall || 0)}`}>
                    {politician.currentScore?.overall?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-gray-600">Pontuação geral</div>
                </div>

                <Button onClick={shareProfile} variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Score Cards */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">🛡️ Proteção à Vida</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(politician.currentScore?.lifeProtection || 0)}`}>
                  {politician.currentScore?.lifeProtection?.toFixed(1) || '0.0'}
                </div>
                <Progress value={politician.currentScore?.lifeProtection || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">👨‍👩‍👧‍👦 Família</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(politician.currentScore?.familyValues || 0)}`}>
                  {politician.currentScore?.familyValues?.toFixed(1) || '0.0'}
                </div>
                <Progress value={politician.currentScore?.familyValues || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">⚖️ Integridade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(politician.currentScore?.moralIntegrity || 0)}`}>
                  {politician.currentScore?.moralIntegrity?.toFixed(1) || '0.0'}
                </div>
                <Progress value={politician.currentScore?.moralIntegrity || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">✝️ Liberdade Religiosa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(politician.currentScore?.religiousFreedom || 0)}`}>
                  {politician.currentScore?.religiousFreedom?.toFixed(1) || '0.0'}
                </div>
                <Progress value={politician.currentScore?.religiousFreedom || 0} className="mt-2" />
              </CardContent>
            </Card>
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
                   'Este político está sendo avaliado com base em nossos 7 pilares fundamentais. A pontuação reflete seu alinhamento com valores cristãos e evangélicos.'}
                </p>
                
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
                    {((politician.currentScore?.consistencyScore || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Última Atualização:</span>
                  <span className="font-semibold">
                    {politician.currentScore?.lastCalculation ? 
                      new Date(politician.currentScore.lastCalculation).toLocaleDateString('pt-BR') : 
                      'Nunca'
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
                  <Badge variant={politician.expenseAnalysis?.riskLevel === 'LOW' ? 'secondary' : 'destructive'}>
                    {politician.expenseAnalysis?.riskLevel || 'BAIXO'}
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
              <div className="space-y-4">
                {politician.recentVotes?.map((vote, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{vote.agendaTitle}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(vote.voteDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">
                          {vote.appliedScore > 0 ? '+' : ''}{vote.appliedScore} pts
                        </div>
                        <div className="text-sm text-gray-600">Impacto</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getVoteIcon(vote.vote)}
                        <span className="font-medium">{vote.vote}</span>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-8">Nenhuma votação registrada</p>
                )}
              </div>
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