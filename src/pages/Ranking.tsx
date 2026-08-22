import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PoliticianCard from '@/components/politicians/PoliticianCard';
import { usePoliticians, usePoliticiansStats } from '@/hooks/usePoliticians';
import { Search, Filter, TrendingUp, Users, Award, BookOpen, BarChart3, Loader2, Church } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APIPolitician } from '@/types/politician';

const RankingPage = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedParty, setSelectedParty] = useState('all');
  const [selectedHouse, setSelectedHouse] = useState('all');
  // FPE ativa por padrão — o recorte do projeto É a Frente Parlamentar
  // Evangélica; o usuário leigo deve ver primeiro quem faz parte dela.
  const [fpeFilter, setFpeFilter] = useState(true);

  // Busca vinda da navbar (?search=) atualiza o campo
  useEffect(() => {
    setSearchTerm(searchParams.get('search') ?? '');
  }, [searchParams]);

  // Hooks da API
  const { data: politiciansData, isLoading: isLoadingPoliticians, error: politiciansError } = usePoliticians({
    search: searchTerm || undefined,
    state: selectedState !== 'all' ? selectedState : undefined,
    party: selectedParty !== 'all' ? selectedParty : undefined,
    house: selectedHouse !== 'all' ? (selectedHouse === 'deputado' ? 'CAMARA' : 'SENADO') : undefined,
    fpeFilter: fpeFilter || undefined,
    sortBy: 'score',
    sortOrder: 'desc',
    limit: 100
  });
  
  const { data: statsData, isLoading: isLoadingStats } = usePoliticiansStats();

  // Extrair dados únicos para filtros
  const filterOptions = useMemo(() => {
    if (!politiciansData?.politicians) return { states: [], parties: [] };
    
    const states = [...new Set(politiciansData.politicians.map(p => p.currentState))].sort();
    const parties = [...new Set(politiciansData.politicians.map(p => p.currentParty))].sort();
    
    return { states, parties };
  }, [politiciansData]);

  // Usar dados da API diretamente (já filtrados)
  const politicians = useMemo(
    () => politiciansData?.politicians ?? [],
    [politiciansData]
  );

  // Calculate statistics — "Média Geral" vem da API (média global real de
  // todos os parlamentares ativos), NÃO da média do top-100 carregado.
  // A média client-side (~86) mentia pra cima frente à global (~66).
  const stats = useMemo(() => {
    if (!politiciansData || !statsData) {
      return { total: 0, avgScore: 0, excellentCount: 0, deputadosCount: 0 };
    }

    const total = politiciansData.total;
    const avgScore = statsData.averageScore ?? 0;
    const excellentCount = statsData.performanceDistribution.excellent;
    const deputadosCount = statsData.houseDistribution.camara;

    return { total, avgScore, excellentCount, deputadosCount };
  }, [politiciansData, statsData]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedState('all');
    setSelectedParty('all');
    setSelectedHouse('all');
    setFpeFilter(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="bg-gradient-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6 text-white">
              Ranking de Testemunho Fiel
            </h1>
            <p className="text-xl text-primary-foreground/90 leading-relaxed mb-8">
              Avaliação independente de parlamentares brasileiros com base em critérios objetivos 
              de integridade moral, defesa da vida, valores familiares e responsabilidade social.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm opacity-90">Avaliados</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{stats.avgScore.toFixed(1)}</div>
                <div className="text-sm opacity-90">Média Geral</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{stats.excellentCount}</div>
                <div className="text-sm opacity-90">Excelentes</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{stats.deputadosCount}</div>
                <div className="text-sm opacity-90">Deputados</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filtros de Busca</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Search Input */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou partido..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* State Filter */}
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Estados</SelectItem>
                    {filterOptions.states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Party Filter */}
                <Select value={selectedParty} onValueChange={setSelectedParty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Partido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Partidos</SelectItem>
                    {filterOptions.parties.map(party => (
                      <SelectItem key={party} value={party}>{party}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* House Filter */}
                <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Casa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Ambas as Casas</SelectItem>
                    <SelectItem value="deputado">Câmara dos Deputados</SelectItem>
                    <SelectItem value="senador">Senado Federal</SelectItem>
                  </SelectContent>
                </Select>

                {/* FPE Filter */}
                <div className="flex items-center space-x-3">
                  <Church className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="fpe-filter"
                      checked={fpeFilter}
                      onCheckedChange={setFpeFilter}
                    />
                    <label htmlFor="fpe-filter" className="text-sm font-medium cursor-pointer select-none">
                      Frente Parlamentar Evangélica
                    </label>
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {(searchTerm || selectedState !== 'all' || selectedParty !== 'all' || selectedHouse !== 'all' || fpeFilter) && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                    {searchTerm && <Badge variant="secondary">"{searchTerm}"</Badge>}
                    {selectedState !== 'all' && <Badge variant="secondary">{selectedState}</Badge>}
                    {selectedParty !== 'all' && <Badge variant="secondary">{selectedParty}</Badge>}
                    {selectedHouse !== 'all' && <Badge variant="secondary">
                      {selectedHouse === 'deputado' ? 'Deputados' : 'Senadores'}
                    </Badge>}
                    {fpeFilter && <Badge variant="secondary">FPE</Badge>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Parlamentares Avaliados
            </h2>
            <div className="text-sm text-muted-foreground">
              Mostrando {politicians.length} de {politiciansData?.total || 0} parlamentares
            </div>
          </div>

          {isLoadingPoliticians ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                <h3 className="font-serif text-lg font-semibold mb-2">Carregando parlamentares...</h3>
                <p className="text-muted-foreground">
                  Aguarde enquanto buscamos os dados mais recentes.
                </p>
              </CardContent>
            </Card>
          ) : politiciansError ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-lg font-semibold mb-2">Erro ao carregar dados</h3>
                <p className="text-muted-foreground mb-4">
                  Houve um problema ao buscar os parlamentares. Tente novamente.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
          ) : politicians.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-lg font-semibold mb-2">Nenhum parlamentar encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar os filtros para encontrar parlamentares.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {politicians.map((politician, index) => (
                <PoliticianCard
                  key={politician.id}
                  politician={politician}
                  rank={index + 1}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <Award className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
              Fortaleça a Democracia Brasileira
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Use essas informações para tomar decisões informadas nas próximas eleições. 
              Conheça a metodologia, compartilhe dados e contribua para uma sociedade mais justa e transparente.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/metodologia">
                <Button size="lg" className="font-medium">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Entender a Metodologia
                </Button>
              </Link>
              <Link to="/votacoes">
                <Button variant="outline" size="lg">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Análise de Votações
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RankingPage;