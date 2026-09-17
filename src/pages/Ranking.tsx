import { usePageMeta } from '@/hooks/usePageMeta';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PoliticianCard from '@/components/politicians/PoliticianCard';
import { usePoliticians, usePoliticiansStats } from '@/hooks/usePoliticians';
import { Search, Filter, TrendingUp, Users, Award, BookOpen, BarChart3, Loader2, Church, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APIPolitician } from '@/types/politician';
import { Slider } from '@/components/ui/slider';
import { CRITERIA } from '@/lib/criteria';
import { LastSyncBadge } from '@/components/LastSyncBadge';
import { fmt } from '@/lib/format';

const CRITERIA_LEVELS: Array<{ key: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR'; label: string }> = [
  { key: 'EXCELLENT', label: 'Aderência muito alta' },
  { key: 'GOOD', label: 'Aderência alta' },
  { key: 'AVERAGE', label: 'Aderência moderada' },
  { key: 'POOR', label: 'Aderência baixa' },
];

// ── F4 (2026-08-24): panorama com amostra de TODOS os níveis ──
// Antes a home despejava uma lista longa ordenada pela melhor nota.
// Agora mostra 2 perfis de cada faixa de desempenho (membros da bancada),
// deixando claro que o método avalia todo o espectro — não só o lado bom.
const HighlightsSection: React.FC = () => {
  const excellent = usePoliticians({ performanceLevel: 'EXCELLENT', fpeFilter: true, sortBy: 'score', sortOrder: 'desc', limit: 2 });
  const good = usePoliticians({ performanceLevel: 'GOOD', fpeFilter: true, sortBy: 'score', sortOrder: 'desc', limit: 2 });
  const average = usePoliticians({ performanceLevel: 'AVERAGE', fpeFilter: true, sortBy: 'score', sortOrder: 'desc', limit: 2 });
  const poor = usePoliticians({ performanceLevel: 'POOR', fpeFilter: true, sortBy: 'score', sortOrder: 'desc', limit: 2 });

  const buckets = [
    { level: CRITERIA_LEVELS[0], query: excellent },
    { level: CRITERIA_LEVELS[1], query: good },
    { level: CRITERIA_LEVELS[2], query: average },
    { level: CRITERIA_LEVELS[3], query: poor },
  ];

  const isLoading = buckets.some(b => b.query.isLoading);
  const total = buckets.reduce((acc, b) => acc + (b.query.data?.politicians?.length ?? 0), 0);
  if (!isLoading && total === 0) return null;

  return (
    <section className="py-12 bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h2 className="font-serif text-2xl font-bold text-foreground">Panorama da bancada</h2>
          <p className="text-muted-foreground mt-3 text-sm md:text-base leading-relaxed">
            Uma amostra fixa de <strong>todos os graus de aderência</strong> {' '}entre os membros da bancada com nota calculada — as duas notas mais
            altas de cada faixa. Transparência é mostrar o espectro inteiro,
            não só o lado bom.
          </p>
        </div>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Carregando destaques…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
              {buckets.map(({ level, query }) =>
                (query.data?.politicians ?? []).map((p) => (
                  <div key={p.id} className="space-y-1.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                      Desempenho {level.label}
                    </span>
                    <PoliticianCard politician={p} />
                  </div>
                ))
              )}
            </div>
            <div className="text-center mt-10">
              <a href="#ranking-completo" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Ver o ranking completo e buscar qualquer parlamentar
                <TrendingUp className="h-4 w-4" />
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

const RankingPage = () => {
  usePageMeta("Ranking de Parlamentares | A Bancada Evangélica", "Acompanhe a pontuação e os votos nominais de todos os parlamentares na Câmara e no Senado.");
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedParty, setSelectedParty] = useState('all');
  const [selectedHouse, setSelectedHouse] = useState('all');
  // FPE ativa por padrão — o recorte do projeto É a Frente Parlamentar
  // Evangélica; o usuário leigo deve ver primeiro quem faz parte dela.
  const [fpeFilter, setFpeFilter] = useState(true);
  const [visibleLimit, setVisibleLimit] = useState(20);

  // Reset do limite visível ao alterar filtros de busca
  useEffect(() => {
    setVisibleLimit(20);
  }, [searchTerm, selectedState, selectedParty, selectedHouse, fpeFilter]);

  // ── V2 (2026-08-24, feedback F3): modelo explícito rascunho → aplicar ──
  // O usuário edita os pesos (rascunho), clica em "Aplicar" e aí sim o
  // ranking é recalculado NO NAVEGADOR — com selo visível acima da lista.
  // Antes o efeito era instantâneo porém imperceptível (sem botão, sem
  // feedback) e parecia quebrado. Nota oficial e labels seguem a
  // metodologia pública; isto é uma lente pessoal, não uma segunda verdade.
  const [weightsEnabled, setWeightsEnabled] = useState(false);
  const [draftWeights, setDraftWeights] = useState<Record<string, number> | null>(() => {
    try {
      const saved = localStorage.getItem('bancada-weights-v1');
      return saved ? JSON.parse(saved) as Record<string, number> : null;
    } catch {
      return null;
    }
  });
  const [appliedWeights, setAppliedWeights] = useState<Record<string, number> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (draftWeights) {
      try {
        localStorage.setItem('bancada-weights-v1', JSON.stringify(draftWeights));
      } catch {
        /* storage indisponível: segue funcionando só em memória */
      }
    }
  }, [draftWeights]);

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
    limit: visibleLimit
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

  // Calculate statistics — TODAS as métricas do hero são GLOBAIS
  // (endpoint /stats/overview). F1 (2026-08-24): antes o card "Avaliados"
  // mostrava o total FILTRADO pela FPE (~208) misturado com contagens
  // globais (513 deputados) — o leigo lia contradição. Agora separa:
  // monitorados (todos) × com nota por votos próprios (último score de cada ativo).
  const stats = useMemo(() => {
    if (!statsData) {
      return { monitored: 0, withOwnVotes: 0, avgScore: 0, excellentCount: 0 };
    }

    const dist = statsData.performanceDistribution;
    const monitored = statsData.totalPoliticians ?? 0;
    const withOwnVotes = statsData.withOwnVotes ?? 0;
    const avgScore = statsData.averageScore ?? 0;
    const excellentCount = dist.excellent;

    return { monitored, withOwnVotes, avgScore, excellentCount };
  }, [statsData]);

  // Pesos efetivos + ranking derivado — SÓ quando o usuário aplicou
  const DEFAULT_WEIGHTS: Record<string, number> = {
    lifeProtection: 30,
    familyValues: 25,
    moralIntegrity: 20,
    socialResponsibility: 15,
    religiousFreedom: 10,
  };
  const shownWeights = draftWeights ?? DEFAULT_WEIGHTS;
  const activeWeights = appliedWeights ?? DEFAULT_WEIGHTS;
  const activeTotal = Object.values(activeWeights).reduce((a, b) => a + b, 0);
  const hasCustomWeights = appliedWeights !== null && activeTotal > 0;
  // Há edição não aplicada? (compara rascunho com o que está em vigor)
  const draftIsDirty =
    weightsEnabled &&
    JSON.stringify(shownWeights) !== JSON.stringify(appliedWeights ?? DEFAULT_WEIGHTS);

  const displayPoliticians = useMemo(() => {
    if (!hasCustomWeights || !activeTotal) return politicians;
    return [...politicians]
      .map((p) => {
        let custom = 0;
        for (const c of CRITERIA) {
          // leitura dinâmica do campo do critério num objeto tipado —
          // cast duplo deliberado (TS sugere via unknown)
          const v = (p.scores as unknown as Record<string, number> | undefined)?.[c.field];
          if (typeof v === 'number') custom += v * (activeWeights[c.field] / activeTotal);
        }
        return { ...p, overallScore: Math.round(custom * 10) / 10 };
      })
      .sort((a, b) => b.overallScore - a.overallScore);
  }, [politicians, hasCustomWeights, activeTotal, activeWeights]);

  const applyDraft = () => {
    if (!draftWeights) return;
    setAppliedWeights({ ...draftWeights });
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const restoreDefaults = () => {
    setDraftWeights(null);
    setAppliedWeights(null);
    setWeightsEnabled(false);
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
            {/* Hero Section — Layout 2-Colunas Moderno & Eficiente */}
      <section className="bg-gradient-primary text-primary-foreground py-10 md:py-14 border-b border-blue-900/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Coluna Esquerda: Proposta de Valor e Ações */}
            <div className="lg:col-span-7 space-y-5 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-400 text-xs font-bold uppercase tracking-wider border border-white/15">
                <img src="/marca-white.png" alt="" className="h-4 w-4" />
                <span>TRANSPARÊNCIA PARLAMENTAR</span>
              </div>

              <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                Como a Bancada Evangélica vota
              </h1>

              <p className="text-base sm:text-lg text-primary-foreground/90 leading-relaxed max-w-xl">
                Notas calculadas a partir de <strong>votos nominais públicos</strong> na Câmara e no Senado, sem qualquer avaliação pessoal ou partidária. Quem ainda não votou recebe <strong>estimativa pelo histórico do partido</strong>, sempre sinalizada no perfil.
              </p>

              {/* Três passos compactos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {[
                  "1. Voto registrado em plenário",
                  "2. 5 critérios objetivos",
                  "3. Dados 100% públicos",
                ].map((passo, i) => (
                  <div key={i} className="bg-white/10 rounded-lg px-3 py-2 text-xs font-medium text-white/90 border border-white/10 flex items-center gap-2">
                    <span className="shrink-0 h-4 w-4 rounded-full bg-[#b49a60] text-[#0f172a] text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span>{passo}</span>
                  </div>
                ))}
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link to="/match" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#b49a60] px-6 py-3 text-[#0f172a] font-bold hover:bg-amber-300 transition-colors shadow-md text-sm">
                  Descubra quem vota como você
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/metodologia" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-3 transition-colors text-sm border border-white/15">
                  Ler metodologia completa
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                </Link>
              </div>
            </div>

            {/* Coluna Direita: Painel de Métricas 2x2 */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Atualizado por sincronização dos dados públicos</span>
                  <span className="text-[11px] text-white/70">Congresso Nacional</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/40 rounded-xl p-3.5 border border-white/10">
                    <div className="text-2xl font-bold font-serif text-white">{stats.monitored}</div>
                    <div className="text-xs text-white/80 font-medium">Parlamentares monitorados</div>
                  </div>
                  <div className="bg-slate-950/40 rounded-xl p-3.5 border border-white/10">
                    <div className="text-2xl font-bold font-serif text-amber-400">{stats.withOwnVotes}</div>
                    <div className="text-xs text-white/80 font-medium">Com votos próprios</div>
                  </div>
                  <div className="bg-slate-950/40 rounded-xl p-3.5 border border-white/10">
                    <div className="text-2xl font-bold font-serif text-white">{fmt(stats.avgScore)}</div>
                    <div className="text-xs text-white/80 font-medium">Nota média (0–100)</div>
                  </div>
                  <div className="bg-slate-950/40 rounded-xl p-3.5 border border-white/10">
                    <div className="text-2xl font-bold font-serif text-emerald-400">{stats.excellentCount}</div>
                    <div className="text-xs text-white/80 font-medium">Aderência muito alta</div>
                  </div>
                </div>

                <p className="text-[11px] text-white/75 leading-relaxed pt-1">
                  Notas baseadas em votações plenárias gravadas. Perfis sem votos suficientes usam a estimativa histórica do partido.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <HighlightsSection />

      {/* Filters Section */}
      <section className="py-6 bg-background border-b border-border">
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
                  <SelectTrigger aria-label="Filtrar por estado">
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
                  <SelectTrigger aria-label="Filtrar por partido">
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
                  <SelectTrigger aria-label="Filtrar por casa">
                    <SelectValue placeholder="Casa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Ambas as Casas</SelectItem>
                    <SelectItem value="deputado">Câmara dos Deputados</SelectItem>
                    <SelectItem value="senador">Senado Federal</SelectItem>
                  </SelectContent>
                </Select>

                {/* FPE Filter */}
                <div className="flex items-center space-x-3 p-2.5 sm:p-0 rounded-lg bg-secondary/30 sm:bg-transparent border border-border/40 sm:border-0">
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
      <section className="py-4 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <Card className="transition-all">
            <CardHeader className={weightsEnabled ? "p-6 pb-3" : "p-4 sm:p-5"}>
              <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                <span className="flex items-center space-x-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  <span>Seus pesos</span>
                </span>
                <div className="flex items-center gap-2 pr-1">
                  <label htmlFor="weights-toggle" className="text-sm font-normal text-muted-foreground cursor-pointer select-none">Personalizar</label>
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
                  Puxe os critérios que importam mais pra você, depois clique em{' '}
                  <strong>Aplicar</strong> — o ranking é recalculado no seu
                  navegador. A nota oficial e os rótulos de desempenho seguem a
                  metodologia pública; parlamentares sem nota calculada não são
                  reordenados.
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
                          {shownWeights[c.field]} pts ·{' '}
                          {(() => {
                            const total = Object.values(shownWeights).reduce((a, b) => a + b, 0);
                            return total ? Math.round((shownWeights[c.field] / total) * 100) : 0;
                          })()}
                          %
                        </span>
                      </div>
                      <Slider
                        aria-label={`Peso do critério ${c.label}: ${shownWeights[c.field]} pontos`}
                        min={0}
                        max={40}
                        step={1}
                        value={[shownWeights[c.field]]}
                        onValueChange={(v) =>
                          setDraftWeights({ ...shownWeights, [c.field]: v[0] ?? 0 })
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Button size="sm" onClick={applyDraft} disabled={!draftIsDirty}>
                      {draftIsDirty
                        ? 'Aplicar meus pesos no ranking'
                        : appliedWeights
                          ? 'Pesos aplicados ✓'
                          : 'Mova um slider para personalizar'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={restoreDefaults}>
                      Restaurar padrão da metodologia
                    </Button>
                  </div>
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
      <section id="ranking-completo" className="py-8">
        <div className="container mx-auto px-4" ref={resultsRef}>
          {hasCustomWeights && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-yellow-700/50 dark:bg-yellow-950/30">
              <p className="text-sm text-amber-900 dark:text-yellow-200 leading-relaxed">
                <strong>Ranking ordenado com seus pesos</strong> — uma lente
                pessoal calculada no seu navegador. A nota oficial e os rótulos
                seguem a metodologia pública.
              </p>
              <Button variant="outline" size="sm" onClick={restoreDefaults} className="shrink-0">
                Voltar ao padrão oficial
              </Button>
            </div>
          )}
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
                <strong className="text-foreground">Como ler a nota:</strong> média ponderada
                dos 5 critérios da metodologia — cada um parte do histórico do partido e
                é ajustado pela média dos votos nominais reais daquele parlamentar.
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

              {/* Botão de Paginação / Carregar Mais */}
              {(politiciansData?.total ?? 0) > displayPoliticians.length && (
                <div className="text-center pt-8 pb-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setVisibleLimit((prev) => prev + 20)}
                    className="font-semibold px-8 border-primary/30 hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                  >
                    Carregar mais parlamentares ({displayPoliticians.length} de {politiciansData?.total || 0})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <Award className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">
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

      <div className="container mx-auto px-4 py-6">
        <LastSyncBadge />
      </div>
    </div>
  );
};

export default RankingPage;