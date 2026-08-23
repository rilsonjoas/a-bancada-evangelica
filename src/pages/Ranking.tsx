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
import { Search, Filter, TrendingUp, Users, Award, BookOpen, BarChart3, Loader2, Church, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APIPolitician } from '@/types/politician';
import { Slider } from '@/components/ui/slider';
import { CRITERIA } from '@/lib/criteria';

const RankingPage = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedParty, setSelectedParty] = useState('all');
  const [selectedHouse, setSelectedHouse] = useState('all');
  // FPE ativa por padrão — o recorte do projeto É a Frente Parlamentar
  // Evangélica; o usuário leigo deve ver primeiro quem faz parte dela.
  const [fpeFilter, setFpeFilter] = useState(true);

  // ── V1 (2026-08-22): pesos personalizados do usuário ──
  // Ranking recalculado NO NAVEGADOR sobre os sub-scores que a API já
  // devolve. Nota oficial e labels de desempenho seguem a metodologia
  // pública; isto é uma lente pessoal, não uma segunda verdade.
  const [weightsEnabled, setWeightsEnabled] = useState(false);
  const [customWeights, setCustomWeights] = useState<Record<string, number> | null>(() => {
    try {
      const saved = localStorage.getItem('bancada-weights-v1');
      return saved ? JSON.parse(saved) as Record<string, number> : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (customWeights) {
      try {
        localStorage.setItem('bancada-weights-v1', JSON.stringify(customWeights));
      } catch {
        /* storage indisponível: segue funcionando só em memória */
      }
    }
  }, [customWeights]);

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

  // Pesos efetivos + ranking derivado quando o usuário personalizou
  const DEFAULT_WEIGHTS: Record<string, number> = {
    lifeProtection: 30,
    familyValues: 25,
    moralIntegrity: 20,
    socialResponsibility: 15,
    religiousFreedom: 10,
  };
  const effectiveWeights = customWeights ?? DEFAULT_WEIGHTS;
  const weightTotal = Object.values(effectiveWeights).reduce((a, b) => a + b, 0);

  const displayPoliticians = useMemo(() => {
    if (!weightsEnabled || !weightTotal) return politicians;
    return [...politicians]
      .map((p) => {
        let custom = 0;
        for (const c of CRITERIA) {
          const v = (p.scores as Record<string, number> | undefined)?.[c.field];
          if (typeof v === 'number') custom += v * (effectiveWeights[c.field] / weightTotal);
        }
        return { ...p, overallScore: Math.round(custom * 10) / 10 };
      })
      .sort((a, b) => b.overallScore - a.overallScore);
  }, [politicians, weightsEnabled, weightTotal, effectiveWeights]);

  const restoreDefaults = () => {
    setCustomWeights(null);
    try {
      localStorage.removeItem('bancada-weights-v1');
    } catch {
      /* storage indisponível — nada a recuperar */
    }
  };

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
                {/* Marca real (2026-08-22): logo do projeto no lugar do ícone genérico */}
                <img src="/marca-white.png" alt="" aria-hidden="true" className="h-12 w-12" />
              </div>
            </div>
            {/* Lente watchdog (2026-08-22): o método vem ANTES do ranking.
                O leigo precisa entender que a nota não é "simpatia política":
                é voto nominal registrado, verificável por qualquer pessoa. */}
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white tracking-tight">
              Como a Bancada Evangélica vota
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 leading-relaxed max-w-2xl mx-auto mb-6">
              Notas calculadas exclusivamente a partir de{' '}
              <strong>votos nominais públicos</strong> registrados na Câmara e no Senado.
              Sem enquete, sem declaração, sem simpatia — o voto registrado é o único dado.
            </p>
            {/* Três passos do método */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-8 text-sm">
              {[
                'Votação nominal acontece na Câmara ou no Senado',
                'Cruzamos cada voto com os 5 critérios da metodologia',
                'Nota pública, aberta e verificável por qualquer pessoa',
              ].map((passo, i) => (
                <div key={i} className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm flex items-start gap-2 text-left">
                  <span className="shrink-0 h-5 w-5 rounded-full bg-[#b49a60] text-[#0f172a] text-[11px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="opacity-95 leading-snug">{passo}</span>
                </div>
              ))}
            </div>
            <Link to="/metodologia" className="inline-flex items-center gap-2 text-[#b49a60] hover:text-amber-300 font-semibold transition-colors">
              Ler a metodologia completa
              <TrendingUp className="h-4 w-4" />
            </Link>
            <div className="mt-6" />
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
                      aria-label="Buscar parlamentar por nome ou partido"
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

      {/* Pesos personalizados — V1 (2026-08-22) */}
      <section className="py-6 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <SlidersHorizontal className="h-5 w-5" />
                  <span>Seus pesos</span>
                </span>
                <div className="flex items-center gap-2 pr-1">
                  <span className="text-sm font-normal text-muted-foreground">Personalizar</span>
                  <Switch
                    id="weights-toggle"
                    checked={weightsEnabled}
                    onCheckedChange={setWeightsEnabled}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            {weightsEnabled && (
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-6">
                  Puxe os critérios que importam mais pra você — o ranking é
                  recalculado no seu navegador. A nota oficial e os rótulos de
                  desempenho continuam seguindo a metodologia pública.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                  {CRITERIA.map((c) => (
                    <div key={c.key}>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor={`w-${c.field}`} className="text-sm font-medium flex items-center gap-2">
                          <c.Icon className={`h-4 w-4 ${c.iconClass}`} />
                          {c.label}
                        </label>
                        <span className="text-sm font-bold tabular-nums">
                          {effectiveWeights[c.field]} pts ·{' '}
                          {weightTotal ? Math.round((effectiveWeights[c.field] / weightTotal) * 100) : 0}%
                        </span>
                      </div>
                      <Slider
                        aria-label={`Peso do critério ${c.label}: ${effectiveWeights[c.field]} pontos`}
                        min={0}
                        max={40}
                        step={1}
                        value={[effectiveWeights[c.field]]}
                        onValueChange={(v) =>
                          setCustomWeights({ ...effectiveWeights, [c.field]: v[0] ?? 0 })
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <Button variant="ghost" size="sm" onClick={restoreDefaults}>
                    Restaurar padrão da metodologia
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Padrão oficial: Vida 30 · Família 25 · Moral 20 · Social 15 · Religião 10
                  </span>
                </div>
              </CardContent>
            )}
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
              Mostrando {displayPoliticians.length} de {politiciansData?.total || 0} parlamentares
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
              {/* Como ler a nota — lente watchdog: escopo honesto e explícito */}
              <div className="rounded-xl border border-border bg-muted/40 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Como ler a nota:</strong> soma ponderada
                das votações nominais registradas nos 5 critérios da metodologia.
                Ela mede o <strong className="text-foreground">voto registrado</strong> —
                não mede fé, discurso nem intenção.{' '}
                <Link to="/metodologia" className="underline font-medium">
                  Ver como cada critério é calculado
                </Link>.
              </div>
              {displayPoliticians.map((politician, index) => (
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