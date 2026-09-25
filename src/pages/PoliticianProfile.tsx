import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Building, Calendar, Mail, TrendingUp, TrendingDown, Minus, Share2, Image as ImageIcon, Info, ExternalLink, Pin, AlertTriangle } from 'lucide-react';
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
import { FlaggedExpensesList } from '@/components/expenses/FlaggedExpensesList';
import { ShareableCard } from '@/components/social/ShareableCard';
import { FpeTierChip } from '@/components/politicians/FpeTierChip';
import { CRITERIA, CRITERIA_BY_KEY, CRITERIA_BY_FIELD } from '@/lib/criteria';
import { fmt } from '@/lib/format';
import { getPerformanceBadgeColor, getPerformanceLabel, ESTIMATED_LABEL } from '@/lib/performance';
import { buildVoteSourceLink } from '@/lib/sources';
import { LastSyncBadge } from '@/components/LastSyncBadge';
import { NewsSection } from '@/components/news/NewsSection';

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-700';
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
    const map: Record<string, { label: string; range: string; description: string }> = {
      EXCELLENT: { label: 'Aderência muito alta', range: '80–100 pts', description: 'Votos registrados aderem de forma elevada e consistente aos critérios publicados' },
      GOOD:      { label: 'Aderência alta', range: '65–79 pts', description: 'Votos registrados aderem à maioria dos critérios publicados' },
      AVERAGE:   { label: 'Aderência moderada', range: '45–64 pts', description: 'Votos divididos entre os critérios, ou nota estimada pela média do partido' },
      POOR:      { label: 'Aderência baixa', range: '0–44 pts',  description: 'Votos registrados divergem da maioria dos critérios publicados' },
    };
    return map[level] ?? { label: 'Sem dados', range: '', description: '' };
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{politician.name}</h1>
                <p className="text-lg md:text-xl text-gray-600 mb-3">{politician.fullName}</p>

                {politician.isFpeMember && (
                  <div className="mb-4">
                    <FpeTierChip
                      tier={politician.fpe?.tier}
                      source={politician.fpe?.source}
                      sourceUrl={politician.fpe?.sourceUrl}
                      capturedAt={politician.fpe?.capturedAt}
                    />
                  </div>
                )}

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

              <div className="flex flex-col items-end gap-2.5">
                <div className="text-right">
                  <Badge className={`text-base font-semibold px-3.5 py-1 ${getPerformanceBadgeColor(politician.currentScore?.performanceLevel, politician.currentScore?.totalVotes)}`}>
                    {getPerformanceLabel(politician.currentScore?.performanceLevel, politician.currentScore?.totalVotes)}
                  </Badge>
                </div>

                <div className="text-right mt-1">
                  <div className={`text-3xl sm:text-4xl font-bold tracking-tight ${getScoreColor(politician.currentScore?.overall || 0)}`}>
                    {politician.currentScore?.overall != null ? fmt(politician.currentScore.overall) : '0,0'}
                    <span className="text-sm text-gray-400 font-normal"> / 100</span>
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mt-0.5">Nota geral</div>
                  {/* Achado real (2026-09-08): sem isto, quem via a nota aqui
                      (visível em toda aba, não só "Votações") não tinha
                      nenhum jeito de saber que ela é estimativa de partido —
                      a explicação só existia escondida na aba Votações,
                      onde a maioria nunca clica. Pergunta óbvia de quem
                      olha "69,0/100" sem ver voto nenhum: "como assim?" */}
                  {(politician.currentScore?.totalVotes ?? 0) === 0 && (
                    <div className="text-[11px] text-amber-700 mt-1.5 max-w-[190px] leading-snug">
                      <Info className="inline w-3 h-3 mr-0.5 -mt-0.5" />
                      Estimativa pelo partido — {politician.name.split(' ')[0]} ainda não tem
                      voto próprio registrado.{' '}
                      <Link to="/metodologia" className="underline hover:text-amber-800">
                        Entenda por quê
                      </Link>
                    </div>
                  )}
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
                    <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-4 sm:p-6">
                      <DialogHeader className="shrink-0 pb-2 border-b border-border">
                        <DialogTitle className="text-lg font-bold">Card de {politician.name}</DialogTitle>
                      </DialogHeader>
                      <div className="overflow-y-auto min-h-0 py-4 flex justify-center">
                        <ShareableCard politician={politician} type="summary" />
                      </div>
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Desempenho</TabsTrigger>
          <TabsTrigger value="voting">Votações</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {!politician.currentScore && (
            <div className="p-4 bg-secondary/30 border border-border rounded-lg flex items-start gap-3 text-sm text-muted-foreground mb-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Nota ainda não calculada para este parlamentar. Os dados aparecem após o próximo ciclo de sincronização.</span>
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
                        <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{fmt(score)}</div>
                        <Progress
                          value={score}
                          aria-label={`${c.label}: ${fmt(score)} de 100 pontos`}
                          className="mt-2 h-1.5"
                        />
                      </>
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground">—</div>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">{c.weight}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Description and Mandates */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Descrição do Desempenho</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  {politician.currentScore?.performanceDescription ||
                   'Este político está sendo avaliado com base em 5 critérios: Proteção à Vida (30%), Defesa da Família (25%), Integridade Moral (20%), Responsabilidade Social (15%) e Liberdade Religiosa (10%).'}
                </p>
                {(() => {
                  const hasVotes = (politician.currentScore?.totalVotes ?? 0) > 0;
                  const lvl = getPerformanceLevelDescription(politician.currentScore?.performanceLevel || 'AVERAGE');
                  if (hasVotes) {
                    if (!lvl.description) return null;
                    return (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border text-sm text-gray-600">
                        <span className="font-medium">{lvl.label}:</span>{' '}
                        {lvl.description}
                      </div>
                    );
                  }
                  return (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border text-sm text-gray-600">
                      <span className="font-medium">{ESTIMATED_LABEL}:</span>{' '}
                      sem voto próprio registrado, a nota é a média histórica de aderência do partido — pode não refletir as escolhas individuais do parlamentar.
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

          {/* #7 (2026-08-28): menções na imprensa com curadoria —
              só APPROVED chegam ao perfil. Não entra na nota. */}
          <NewsSection politicianId={politician.id} />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Desempenho por Critério</CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceChart politician={politician} />
            </CardContent>
          </Card>

          {/* H2 (2026-08-27): Base de cálculo por critério — transparência
              sobre quantos votos sustentam cada nota, com aviso quando a
              base é pequena (confiança baixa). */}
          <Card>
            <CardHeader>
              <CardTitle>Base de Cálculo por Critério</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {CRITERIA.map((c) => {
                    const { label, weight: peso, rationale, field: criteriaKey } = c;
                    const vp = politician.votesPerCriteria?.[criteriaKey];
                    // SÓ dados reais de votos registrados — achado (2026-09-16):
                    // o código antigo FABRICAVA contagem quando o critério tinha
                    // 0 votos (proporção inventada de totalVotes × peso, ou
                    // defaults hardcoded 14/12/10/8/6). 0 honesto > número lindo.
                    const count = vp?.count ?? 0;
                    const lowConfidence = count === 0 || count < 5;
                    return (
                      <div key={criteriaKey} className={`p-3 rounded-lg ${count === 0 ? 'bg-slate-50 border border-slate-200' : lowConfidence ? 'bg-yellow-50 border border-yellow-200' : 'bg-white border border-gray-100'}`}>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{label}</span>
                            {/* O peso é o que o critério vale na nota final. Sem
                                mostrá-lo, o usuário não consegue ponderar um
                                critério de 30% contra um de 10%. */}
                            <span className="text-[11px] text-muted-foreground tabular-nums">{peso} da nota</span>
                            {count === 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-slate-700 bg-slate-200 rounded-full">
                                <Info className="w-3.5 h-3.5" aria-hidden="true" />
                                sem voto medido — nota é a do partido
                              </span>
                            )}
                            {count > 0 && lowConfidence && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-yellow-700 bg-yellow-100 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" aria-hidden="true" />
                                base frágil
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-lg font-semibold text-gray-900">
                              {count} assunto{count !== 1 ? 's' : ''}
                            </span>
                            {count === 0 && (
                              <span className="text-xs text-muted-foreground">
                                (não mede esta pessoa)
                              </span>
                            )}
                            {/* A mesma proposição pode ser votada em várias
                                sessões, e aí o número de votos é maior que o
                                de assuntos. Sem dizer isso, o usuário conta
                                as linhas em /votacoes e não bate com o
                                número aqui. */}
                            {(vp?.votes ?? 0) > count && count > 0 && (
                              <span className="text-xs text-muted-foreground" title="A mesma proposição foi voting em mais de uma sessão">
                                ({vp?.votes} votos)
                              </span>
                            )}
                          </div>
                        </div>
                        {count === 0 && (
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                            {rationale}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
              <p className="text-sm text-muted-foreground border-t pt-3 leading-relaxed">
                <strong>Como ler:</strong> cada nota por critério é calculada a partir
                das votações nominais sobre os <em>assuntos</em> que se encaixam
                naquele tema — um assunto é um projeto de lei ou uma emenda à
                Constituição, não cada vez que ele foi voting. Se a mesma
                proposição passou por várias sessões, ela conta uma vez, com a
                média de tudo que foi voted nela. Acima de 5 assuntos a base é
                considerada sólida; abaixo disso a nota reflete amostra pequena e
                deve ser lida com cautela. Sem assunto nenhum no tema, a nota vem
                da média histórica do partido — nunca de número inventado.{' '}
                <a href="/metodologia" className="text-primary hover:underline">Ver metodologia</a>.
              </p>
              {/* Proveniência em linguagem direta (auditoria 2026-09-25): os
                  critérios sem voto medido (Proteção à Vida 30% + Liberdade
                  Religiosa 10% = 40% do peso) não distinguem uma pessoa da
                  outra. Dizer isso é mais útil que mostrar o número sozinho —
                  e é o que sustenta a confiança no resto. */}
              <p className="text-sm text-muted-foreground border-t pt-3 leading-relaxed">
                <strong>Quanto desta nota vem de voto próprio:</strong>{' '}
                {(() => {
                  const total = (politician.currentScore?.totalVotes ?? 0);
                  const medido = CRITERIA
                    .filter((c) => (politician.votesPerCriteria?.[c.field]?.count ?? 0) > 0)
                    .reduce((acc, c) => acc + Number(c.weight.replace('%', '')), 0);
                  if (total === 0) {
                    return ' nenhuma. Este parlamentar ainda não tem votação nominal registrada, então a nota inteira é estimativa do partido.';
                  }
                  return ` ${medido}% do peso da nota é medido em voto próprio deste parlamentar; os ${100 - medido}% restantes vêm do histórico do partido, porque esses critérios não tiveram votação nominal registrada.`;
                })()}{' '}
                <a href="/metodologia" className="text-primary hover:underline">Entender a metodologia</a>
              </p>
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
                  <span>Nota de Consistência:</span>
                  <span className="font-semibold">
                    {/* Sem votações registradas não existe consistência a
                        medir — exibir "—" em vez do número (linhas antigas
                        mostravam 100% pra quem nunca votou, lixo de uma
                        fórmula antiga do sync-worker preservada no banco). */}
                    {(politician.currentScore?.totalVotes ?? 0) === 0
                      ? '—'
                      : `${fmt((politician.currentScore?.consistencyScore ?? 0) * 100)}%`}
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
                <CardTitle>Análise de Despesas e Cota Parlamentar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Despesas analisadas:</span>
                  <span className="font-semibold">
                    {(politician.expenseAnalysis?.totalCount ?? 0).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Gastos fora do padrão:</span>
                  <span className="font-semibold text-red-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0,
                    }).format(politician.expenseAnalysis?.suspiciousValue ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>% fora do padrão:</span>
                  <span className="font-semibold">
                    {politician.expenseAnalysis?.suspiciousPercentage != null ? fmt(politician.expenseAnalysis.suspiciousPercentage) : '0'}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Padrão geral dos gastos:</span>
                  {!politician.expenseAnalysis?.hasExpenseData ? (
                    <Badge variant="outline">Sem dados</Badge>
                  ) : (
                    <Badge variant={politician.expenseAnalysis?.riskLevel === 'HIGH' ? 'destructive' : politician.expenseAnalysis?.riskLevel === 'MEDIUM' ? 'default' : 'secondary'}>
                      {politician.expenseAnalysis?.riskLevel === 'HIGH'
                        ? 'Atípico'
                        : politician.expenseAnalysis?.riskLevel === 'MEDIUM'
                          ? 'Atenção'
                          : 'Regular'}
                    </Badge>
                  )}
                </div>
                {/* D6 (2026-09-25): "sem dado" é um estado próprio, distinto de
                    "gasto normal". Só 174 dos parlamentares registrados têm
                    despesa no acervo; sem dizer isso, ausência de dado parece
                    despesa limpa. */}
                {!politician.expenseAnalysis?.hasExpenseData && (
                  <p className="text-sm text-muted-foreground border-t pt-3 leading-relaxed">
                    <strong>Sem dados de despesa</strong> para este {politician.currentHouse === 'SENADO' ? 'senador' : 'deputado'} — a cota não
                    está no acervo, o que <strong>não significa</strong> que o gasto
                    esteja em ordem. A cobertura de despesas é parcial: parte da
                    nota de Integridade Moral vem da média histórica do partido
                    (metodologia híbrida) — trate-a como{' '}
                    <strong>estimativa parcial</strong>.
                  </p>
                )}
                <div className="text-xs text-muted-foreground border-t pt-3 space-y-2 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-200">
                  <p className="flex items-start gap-1.5">
                    <Pin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>O que esta análise mede:</strong> Avalia exclusivamente anomalias estatísticas no uso da cota parlamentar oficial — despesas que caem no topo 1% da própria categoria e se afastam da mediana dela. É comparação com o conjunto, não julgamento.</span>
                  </p>
                  <p className="flex items-start gap-1.5 text-slate-600">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>O que NÃO significa:</strong> Não é certidão de Ficha Limpa, atestado de boa conduta moral ou garantia de ausência de processos e condenações judiciais. <a href="/metodologia" className="text-primary font-semibold hover:underline">Ver critérios na metodologia</a>.</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financiamento de Campanha (2022)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {politician.campaignFinance ? (
                  <>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-muted-foreground">Total arrecadado:</span>
                      <span className="text-lg font-bold">
                        R$ {Math.round(politician.campaignFinance.totalReceived).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nº de doações:</span>
                      <span className="font-semibold">{politician.campaignFinance.donationCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maior doação:</span>
                      <span className="font-semibold">
                        R$ {Math.round(politician.campaignFinance.largestDonation).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Doadores:</span>
                      <span className="font-semibold">
                        {politician.campaignFinance.donorPfCount} pessoa{politician.campaignFinance.donorPfCount === 1 ? '' : 's'} física{politician.campaignFinance.donorPfCount === 1 ? '' : 's'} ·{' '}
                        {politician.campaignFinance.donorPjCount} jurídica{politician.campaignFinance.donorPjCount === 1 ? '' : 's'}
                      </span>
                    </div>

                    {politician.campaignFinance.topDonors.length > 0 && (
                      <div className="border-t pt-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                        Maiores doadores
                      </p>
                        <ul className="space-y-1.5">
                          {politician.campaignFinance.topDonors.slice(0, 5).map((d, i) => (
                            <li key={i} className="flex justify-between gap-3 text-sm">
                              <span className="min-w-0 truncate" title={`${d.name} · ${d.doc}`}>
                                {d.name}
                                <span className="text-muted-foreground text-xs ml-1.5">{d.doc}</span>
                              </span>
                              <span className="font-medium shrink-0 tabular-nums">
                                R$ {Math.round(d.amount).toLocaleString('pt-BR')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Decisão de escopo documentada: financiamento é
                        transparência, não critério — doação legal não é
                        crime e insinuar o contrário seria injusto. */}
                    <p className="text-sm text-muted-foreground border-t pt-3 leading-relaxed">
                      Fonte: TSE, prestação de contas eleitorais 2022. Este dado é
                      transparência — <strong>não afeta a nota</strong> do parlamentar.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Este parlamentar não tem receitas registradas na prestação de contas do TSE 2022. Em geral isso ocorre porque ele{' '}
                    <strong>não disputou aquela eleição</strong> — é o caso típico de suplentes que assumiram o mandato depois —{' '}
                    ou porque nenhuma doação foi declarada.
                  </p>
                )}
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
                  // Link da fonte oficial (H1, 2026-08-27): transparência total — cada voto
                  // vira auditable, com link para a Câmara ou Senado.
                  const sourceLink = buildVoteSourceLink(vote as { source?: string; sourceVoteId?: string | null; sourcePropositionId?: string | null });
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
                            {sourceLink.url && (
                              <a
                                href={sourceLink.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                              >
                                {sourceLink.label}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
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
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                  <p className="font-medium flex items-center gap-1.5">
                    <Info className="w-4 h-4 shrink-0" />
                    Então como {politician.name.split(' ')[0]} tem nota sem ter votado nada?
                  </p>
                  <p className="mt-1.5 text-amber-800">
                    A nota de cada critério parte do histórico do partido dele (dado público,
                    calibrado por análises de conduta partidária em legislaturas passadas) —
                    não é um voto individual, é uma estimativa enquanto não existe voto próprio
                    pra ajustar. Quando surgir um voto nominal desse parlamentar num tema
                    relevante, a nota passa a refletir o voto real, não só o partido. Confira a{' '}
                    <Link to="/metodologia" className="underline hover:text-amber-950">Metodologia</Link>{' '}
                    pra ver a fórmula completa.
                  </p>
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
            <CardContent className="space-y-6">
              {politician.expenseAnalysis ? (
                <>
                  <ExpenseAnalysisChart analysis={politician.expenseAnalysis} house={politician.currentHouse} />

                  {/* D2 (2026-09-25): a lista que torna a marcação auditável.
                      O gráfico diz QUANTO está fora do padrão; esta lista diz
                      QUAIS despesas e onde abrir o recibo oficial.
                      Sem dado de despesa, o gráfico JÁ mostra o estado
                      honesto — renderizar a lista aqui duplicaria a mesma
                      mensagem duas vezes. */}
                  {politician.expenseAnalysis.hasExpenseData && (
                    <div id="gastos">
                      <h3 className="text-lg font-semibold mb-1">Despesas marcadas</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Clique numa linha para ver o motivo técnico e o documento oficial.
                      </p>
                      <FlaggedExpensesList politicianId={politician.id} />
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Análise de gastos não disponível para este político
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <LastSyncBadge />
      </div>
    </div>
  );
}