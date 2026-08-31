import { usePageMeta } from '@/hooks/usePageMeta';
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Users, Vote, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVotingAnalysisData } from '@/hooks/useVotingAnalysisData';
import { VotingTrendsChart } from '@/components/voting/VotingTrendsChart';
import { KeyAgendaCard } from '@/components/voting/KeyAgendaCard';
import { VotingStatsCard } from '@/components/voting/VotingStatsCard';
import { CRITERIA } from '@/lib/criteria';
import { THEMES, countAgendasByTheme } from '@/lib/themes';

export function VotingAnalysis() {
  usePageMeta(
    'Análise de Votações | A Bancada Evangélica',
    'Acompanhe o histórico de votações nominais da Câmara e do Senado classificadas nos 5 critérios morais e éticos.'
  );

  const [filters, setFilters] = useState({
    criteria: '',
    dateRange: '',
    search: '',
  });

  const [selectedTheme, setSelectedTheme] = useState<string>('ALL');

  const {
    data: analysisData,
    isLoading,
    error
  } = useVotingAnalysisData({});

  // Filtros aplicados no cliente sobre a lista de pautas — o payload é
  // pequeno (~30 pautas) e agora cada pauta carrega firstVoteDate/
  // lastVoteDate da API.
  const filteredAgendas = useMemo(() => {
    if (!analysisData?.keyAgendas) return [];
    return analysisData.keyAgendas.filter(a => {
      if (filters.criteria && a.criteria !== filters.criteria) return false;
      if (selectedTheme !== 'ALL' && a.theme !== selectedTheme) return false;
      if (
        filters.search &&
        !`${a.title} ${a.description}`.toLowerCase().includes(filters.search.toLowerCase())
      ) return false;
      if (filters.dateRange && a.lastVoteDate) {
        const last = new Date(a.lastVoteDate);
        const now = new Date();
        if (filters.dateRange === '30d' && (now.getTime() - last.getTime()) > 30 * 864e5) return false;
        if (filters.dateRange === '90d' && (now.getTime() - last.getTime()) > 90 * 864e5) return false;
        if (filters.dateRange === '1y' && (now.getTime() - last.getTime()) > 365 * 864e5) return false;
        if (/^\d{4}$/.test(filters.dateRange) && String(last.getFullYear()) !== filters.dateRange) return false;
      }
      return true;
    });
  }, [analysisData, filters, selectedTheme]);

  const hasActiveFilters = Boolean(filters.criteria || filters.dateRange || filters.search || selectedTheme !== 'ALL');

  const countsByTheme = useMemo(
    () => countAgendasByTheme(analysisData?.keyAgendas ?? []),
    [analysisData]
  );

  const updateFilter = (key: string, value: string) => {
    // Radix Select não aceita value="", usamos "all" como sentinel e convertemos para ""
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }));
  };

  // Converte "" → "all" para o Select (sentido inverso para exibição)
  const selectValue = (v: string) => v === '' ? 'all' : v;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao ranking
        </Link>
        <Card>
          <CardContent className="py-16 text-center">
            <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-serif text-lg font-semibold mb-2">Dados de votação indisponíveis</h3>
            <p className="text-muted-foreground">Não foi possível carregar a análise de votações. Tente novamente mais tarde.</p>
          </CardContent>
        </Card>
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Análise de Votações</h1>
            <p className="text-gray-600 mt-2">
              Explore os padrões de votação dos parlamentares em pautas-chave
            </p>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar pauta</label>
              <Input
                placeholder="Nome da pauta ou projeto..."
                aria-label="Buscar pauta por nome ou projeto"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Critério</label>
              <Select value={selectValue(filters.criteria)} onValueChange={(value) => updateFilter('criteria', value)}>
                <SelectTrigger aria-label="Filtrar por critério">
                  <SelectValue placeholder="Todos os critérios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os critérios</SelectItem>
                  {CRITERIA.map(c => (
                    <SelectItem key={c.key} value={c.key}>
                      <span className="flex items-center gap-1.5">
                        <c.Icon className={`h-3.5 w-3.5 ${c.iconClass}`} />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={selectValue(filters.dateRange)} onValueChange={(value) => updateFilter('dateRange', value)}>
                <SelectTrigger aria-label="Filtrar por período">
                  <SelectValue placeholder="Todos os períodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 3 meses</SelectItem>
                  <SelectItem value="1y">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {filteredAgendas.length} de {analysisData?.keyAgendas?.length ?? 0} pautas correspondem aos filtros
                <span className="hidden md:inline"> (afetam a lista em "Pautas-Chave")</span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({ criteria: '', dateRange: '', search: '' });
                  setSelectedTheme('ALL');
                }}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="agendas">Pautas-Chave</TabsTrigger>
          <TabsTrigger value="politicians">Por Político</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <VotingStatsCard
              title="Votos Nominais Registrados"
              value={analysisData?.totalVotes || 0}
              subtitle="Registros individuais de como cada parlamentar votou"
              icon={<Vote className="w-6 h-6" />}
            />
            <VotingStatsCard
              title="Parlamentares Ativos"
              value={analysisData?.activePoliticians || 0}
              subtitle="Com votações registradas"
              icon={<Users className="w-6 h-6" />}
            />
            <VotingStatsCard
              title="Pautas Analisadas"
              value={analysisData?.totalAgendas || 0}
              subtitle="Sessões de votação classificadas nos 5 critérios"
              icon={<Calendar className="w-6 h-6" />}
            />
            <VotingStatsCard
              title="Nota Média"
              value={`${analysisData?.averageScore?.toFixed(1) ?? '—'}`}
              subtitle="Média global dos parlamentares ativos (0-100)"
              icon={<TrendingUp className="w-6 h-6" />}
            />
          </div>

          {/* Summary Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pautas Monitoradas por Critério</CardTitle>
              </CardHeader>
              <CardContent>
                {analysisData?.agendaByCriteria ? (
                  <div className="space-y-4">
                    {CRITERIA.map(c => {
                      const count = analysisData.agendaByCriteria[c.key] ?? 0;
                      const total = analysisData.totalAgendas || 1;
                      return (
                        <div key={c.key} className="flex items-center justify-between gap-3 min-w-0">
                          <span className="text-sm flex flex-col min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 min-w-0">
                              <c.Icon className={`h-3.5 w-3.5 shrink-0 ${c.iconClass}`} />
                              <span className="truncate min-w-0">{c.label}</span>
                            </span>
                            {/* Honestidade > número nu: quando o sync nunca
                                identificou votação nominal pra esse critério,
                                dizer isso em vez de um "0" sem contexto */}
                            {count === 0 && (
                              <span className="text-xs text-muted-foreground mt-0.5">
                                sem votações nominais identificadas no Plenário
                              </span>
                            )}
                          </span>
                          {count > 0 && (
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all"
                                  style={{
                                    width: `${(count / total) * 100}%`,
                                    backgroundColor: c.barColor,
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold w-8 text-right">{count}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                    <span className="text-green-700 font-bold">
                      {analysisData?.alignmentStats?.high || 0} políticos
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Médio Alinhamento (60-79%)</span>
                    <span className="text-blue-700 font-bold">
                      {analysisData?.alignmentStats?.medium || 0} políticos
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Baixo Alinhamento (&lt;60%)</span>
                    <span className="text-red-700 font-bold">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navegue por tema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTheme('ALL')}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    selectedTheme === 'ALL'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10'
                  }`}
                >
                  Todos os temas ({analysisData?.keyAgendas?.length ?? 0})
                </button>
                {THEMES.map((t) => {
                  const count = countsByTheme[t.slug] ?? 0;
                  if (count === 0) return null;
                  const Icon = t.icon;
                  const isSelected = selectedTheme === t.slug;
                  return (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => setSelectedTheme(isSelected ? 'ALL' : t.slug)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {t.label}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary/80'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-6">
            {filteredAgendas.length > 0 ? (
              filteredAgendas.map((agenda) => (
                <KeyAgendaCard key={agenda.id} agenda={agenda} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Vote className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>
                  {hasActiveFilters
                    ? 'Nenhuma pauta encontrada com os filtros selecionados'
                    : 'Nenhuma pauta com votações registradas no momento'}
                </p>
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
                {(analysisData?.politicianRanking?.length ?? 0) > 0
                  ? analysisData!.politicianRanking.map((politician: { id: number; name: string; party: string; state: string; alignmentScore: number; totalVotes: number }, index: number) => (
                    <div key={politician.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 text-center text-sm font-bold ${index < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                          #{index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{politician.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {politician.party} · {politician.state}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-base font-bold ${politician.alignmentScore >= 70 ? 'text-green-600' : politician.alignmentScore >= 50 ? 'text-blue-600' : 'text-red-600'}`}>
                          {politician.alignmentScore.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))
                  : <p className="text-muted-foreground text-center py-8">Carregando ranking...</p>
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}