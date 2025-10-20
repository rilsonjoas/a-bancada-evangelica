import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Filter, Calendar, TrendingUp, TrendingDown, Users, Vote, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVotingAnalysisData } from '@/hooks/useVotingAnalysisData';
import { VotingTrendsChart } from '@/components/voting/VotingTrendsChart';
import { KeyAgendaCard } from '@/components/voting/KeyAgendaCard';
import { VotingStatsCard } from '@/components/voting/VotingStatsCard';

export function VotingAnalysis() {
  const [filters, setFilters] = useState({
    criteria: '',
    dateRange: '',
    voteType: '',
    search: ''
  });

  const { 
    data: analysisData, 
    isLoading, 
    error 
  } = useVotingAnalysisData(filters);

  const criteriaOptions = [
    { value: 'LIFE_PROTECTION', label: '🛡️ Proteção à Vida' },
    { value: 'FAMILY_VALUES', label: '👨‍👩‍👧‍👦 Valores Familiares' },
    { value: 'MORAL_INTEGRITY', label: '⚖️ Integridade Moral' },
    { value: 'SOCIAL_RESPONSIBILITY', label: '🤝 Responsabilidade Social' },
    { value: 'RELIGIOUS_FREEDOM', label: '✝️ Liberdade Religiosa' }
  ];

  const getVoteTypeIcon = (voteType: string) => {
    switch (voteType) {
      case 'YES': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'NO': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'ABSTENTION': return <Vote className="w-4 h-4 text-yellow-600" />;
      default: return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getVoteTypeLabel = (voteType: string) => {
    switch (voteType) {
      case 'YES': return 'Favorável';
      case 'NO': return 'Contrário';
      case 'ABSTENTION': return 'Abstenção';
      case 'ABSENT': return 'Ausente';
      case 'OBSTRUCTION': return 'Obstrução';
      default: return 'Não definido';
    }
  };

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
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

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Análise de Votações</h1>
            <p className="text-gray-600 mt-2">
              Explore os padrões de votação dos parlamentares em pautas-chave
            </p>
          </div>
          
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros Avançados
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filtros de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar pauta</label>
              <Input
                placeholder="Nome da pauta ou projeto..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Critério</label>
              <Select value={filters.criteria} onValueChange={(value) => updateFilter('criteria', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os critérios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os critérios</SelectItem>
                  {criteriaOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os períodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os períodos</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 3 meses</SelectItem>
                  <SelectItem value="1y">Último ano</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de voto</label>
              <Select value={filters.voteType} onValueChange={(value) => updateFilter('voteType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os votos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os votos</SelectItem>
                  <SelectItem value="YES">Favorável</SelectItem>
                  <SelectItem value="NO">Contrário</SelectItem>
                  <SelectItem value="ABSTENTION">Abstenção</SelectItem>
                  <SelectItem value="ABSENT">Ausente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="agendas">Pautas-Chave</TabsTrigger>
          <TabsTrigger value="politicians">Por Político</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <VotingStatsCard
              title="Total de Votações"
              value={analysisData?.totalVotes || 0}
              subtitle="Monitoradas"
              icon={<Vote className="w-6 h-6" />}
            />
            <VotingStatsCard
              title="Parlamentares Ativos"
              value={analysisData?.activePoliticians || 0}
              subtitle="Com votações"
              icon={<Users className="w-6 h-6" />}
            />
            <VotingStatsCard
              title="Pautas Analisadas"
              value={analysisData?.totalAgendas || 0}
              subtitle="Diferentes"
              icon={<Calendar className="w-6 h-6" />}
            />
            <VotingStatsCard
              title="Consenso Médio"
              value={`${analysisData?.averageConsensus || 0}%`}
              subtitle="Alinhamento"
              icon={<TrendingUp className="w-6 h-6" />}
            />
          </div>

          {/* Summary Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Votos por Critério</CardTitle>
              </CardHeader>
              <CardContent>
                {analysisData?.voteByCriteria ? (
                  <div className="space-y-4">
                    {criteriaOptions.map(criteria => (
                      <div key={criteria.value} className="flex items-center justify-between">
                        <span className="text-sm">{criteria.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ 
                                width: `${(analysisData.voteByCriteria[criteria.value] / analysisData.totalVotes) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {analysisData.voteByCriteria[criteria.value] || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Carregando dados...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendência de Alinhamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Alto Alinhamento (≥80%)</span>
                    <span className="text-green-600 font-bold">
                      {analysisData?.alignmentStats?.high || 0} políticos
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Médio Alinhamento (60-79%)</span>
                    <span className="text-blue-600 font-bold">
                      {analysisData?.alignmentStats?.medium || 0} políticos
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Baixo Alinhamento (<60%)</span>
                    <span className="text-red-600 font-bold">
                      {analysisData?.alignmentStats?.low || 0} políticos
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendências de Votação ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <VotingTrendsChart data={analysisData?.timelineTrends || []} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Agendas Tab */}
        <TabsContent value="agendas" className="space-y-6">
          <div className="grid gap-6">
            {analysisData?.keyAgendas?.map((agenda: any) => (
              <KeyAgendaCard key={agenda.id} agenda={agenda} />
            )) || (
              <div className="text-center py-8 text-gray-500">
                <Vote className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhuma pauta encontrada com os filtros selecionados</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Politicians Tab */}
        <TabsContent value="politicians" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Políticos por Alinhamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisData?.politicianRanking?.map((politician: any, index: number) => (
                  <div key={politician.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold text-gray-500">
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium">{politician.name}</h3>
                        <p className="text-sm text-gray-600">
                          {politician.party} - {politician.state}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {politician.alignmentScore.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {politician.totalVotes} votações
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-8">Carregando ranking...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}