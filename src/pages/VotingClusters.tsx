import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  LabelList,
} from 'recharts';
import { Brain, Users, TrendingUp, BarChart2, ChevronDown, ChevronUp, AlertCircle, Award } from 'lucide-react';
import { useState } from 'react';
import { useClusterData, usePartyAlignment, type ClusterMember } from '@/hooks/useClusterData';
import { fmt } from '@/lib/format';

const CLUSTER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
];

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-foreground">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

interface TooltipPayload {
  payload: ClusterMember & { clusterLabel: string };
}

function ClusterTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-md p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground">{d.name}</p>
      <p className="text-muted-foreground">{d.party} · {d.state}</p>
      <p className="text-xs text-muted-foreground mt-1">{d.clusterLabel}</p>
    </div>
  );
}

function ClusterCard({ cluster, color, index }: {
  cluster: { label: string; size: number; members: ClusterMember[] };
  color: string;
  index: number;
}) {
  const [open, setOpen] = useState(index === 0);
  const parties = [...new Set(cluster.members.map(m => m.party))].slice(0, 5);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between p-4 bg-card hover:bg-accent/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <div>
            <p className="font-semibold text-foreground text-sm">{cluster.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {parties.join(', ')}{parties.length < [...new Set(cluster.members.map(m => m.party))].length ? '…' : ''}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="p-4 bg-background border-t border-border max-h-64 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {cluster.members.map(m => (
              <a
                key={m.id}
                href={`/politicos/${m.id}`}
                className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors py-1 px-2 rounded hover:bg-accent/50"
              >
                <span className="font-medium truncate">{m.name}</span>
                <span className="text-muted-foreground flex-shrink-0">{m.party}/{m.state}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const ALIGNMENT_COLOR: Record<string, string> = {
  alta: '#10b981',
  moderada: '#f59e0b',
  baixa: '#ef4444',
  sem_dados: '#6b7280',
};

const LEVEL_LABEL: Record<string, string> = {
  alta: 'Alta (≥70)',
  moderada: 'Moderada (50–70)',
  baixa: 'Baixa (<50)',
  sem_dados: 'Sem dados',
};

function PartyAlignmentChart() {
  const { data, isLoading, isError } = usePartyAlignment();

  if (isLoading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (isError || !data || data.parties.length === 0) return (
    <div className="flex items-center justify-center h-32 text-center">
      <p className="text-sm text-muted-foreground">
        {isError
          ? 'Serviço indisponível'
          : 'Dados de pontuação ainda não calculados. Rode os scripts de sync primeiro.'}
      </p>
    </div>
  );

  const top20 = data.parties.slice(0, 20).map(p => ({
    party: p.party,
    score: p.avg_score ?? 0,
    level: p.alignment_level,
    count: p.politician_count,
  }));

  return (
    <div
      role="img"
      aria-label="Gráfico de barras: score médio de alinhamento por partido nos 5 critérios; cores indicam nível (verde alta, âmbar moderada, vermelho baixa)"
    >
      <ResponsiveContainer width="100%" height={Math.max(280, top20.length * 28)}>
      <BarChart data={top20} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="party" width={90} tick={{ fontSize: 11 }} interval={0} />
        <Tooltip
          formatter={(v: number) => [`${fmt(v)} pts`, 'Score médio']}
          labelFormatter={(label) => {
            const item = top20.find(p => p.party === label);
            return item ? `${label} (${item.count} parlamentares)` : label;
          }}
        />
        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
          {top20.map((entry, i) => (
            <Cell key={i} fill={ALIGNMENT_COLOR[entry.level]} fillOpacity={0.85} />
          ))}
          <LabelList dataKey="score" position="right" formatter={(v: number) => fmt(v, 0)} style={{ fontSize: 11 }} />
        </Bar>
        </BarChart>
      </ResponsiveContainer>
      <details className="mt-4">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
          Ver dados em tabela
        </summary>
        <table className="w-full text-xs mt-2">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1 font-medium">Partido</th>
              <th className="py-1 font-medium text-right">Score médio</th>
              <th className="py-1 font-medium text-right">Parlamentares</th>
              <th className="py-1 font-medium text-right">Nível</th>
            </tr>
          </thead>
          <tbody>
            {top20.map(p => (
              <tr key={p.party} className="border-t border-border">
                <td className="py-1 font-medium">{p.party}</td>
                <td className="py-1 text-right">{fmt(p.score)}</td>
                <td className="py-1 text-right">{p.count}</td>
                <td className="py-1 text-right">{LEVEL_LABEL[p.level] ?? p.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

export default function VotingClusters() {
  const { data, isLoading, isError } = useClusterData();

  const scatterData = data?.clusters.flatMap((cluster, ci) =>
    cluster.members.map(m => ({
      ...m,
      clusterLabel: cluster.label,
      clusterIndex: ci,
    }))
  ) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">

        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-6 h-6 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-widest">Análise ML</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Grupos de Votação</h1>
          <p className="text-muted-foreground max-w-3xl mb-3">
            Quando organizamos os parlamentares pelo jeito que eles votam —
            sem olhar partido nem religião — surgem <strong>grupos naturais</strong>:
            deputados e senadores que votam juntos, tema a tema. É uma radiografia
            do comportamento real de voto, além dos rótulos de campanha.
          </p>
          {/* Nota técnica para quem quiser profundidade */}
          <details className="max-w-3xl text-sm text-muted-foreground">
            <summary className="cursor-pointer select-none font-medium text-foreground hover:text-primary transition-colors">
              Como essa análise é feita (para quem gosta de detalhes)
            </summary>
            <p className="mt-2 leading-relaxed">
              Cada parlamentar vira um ponto no espaço das votações; o algoritmo{' '}
              <strong>KMeans</strong> agrupa pontos parecidos, com as dimensões
              reduzidas antes por <strong>PCA</strong>. O número de grupos não é
              escolhido à mão: usamos o maior <strong>silhouette score</strong>{' '}
              (medida de quão bem cada ponto encaixa no seu grupo).
            </p>
          </details>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Calculando clusters…</p>
          </div>
        )}

        {/* Alinhamento por partido — sempre visível (dados da API NestJS) */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-serif text-2xl font-bold text-foreground">Alinhamento por partido</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Score médio nos 5 critérios evangélicos.{' '}
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> alta (≥70)
            </span>{' · '}
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> moderada (50–70)
            </span>{' · '}
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> baixa (&lt;50)
            </span>
          </p>
          <PartyAlignmentChart />
        </div>

        {/* Error — clusters indisponíveis, mas alinhamento já apareceu acima */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-border rounded-lg bg-card">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
            <p className="font-semibold text-foreground">Agrupamento ML indisponível</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              A análise de clusters KMeans requer um serviço Python separado que ainda está sendo implantado.
              Os dados de alinhamento por partido acima estão disponíveis normalmente.
            </p>
          </div>
        )}

        {/* Content */}
        {data && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Parlamentares"
                value={data.total_politicians.toLocaleString('pt-BR')}
                sub="com votos registrados"
              />
              <StatCard
                label="Grupos encontrados"
                value={String(data.k_used)}
                sub="k ótimo por silhouette"
              />
              <StatCard
                label="Silhouette score"
                value={fmt(data.silhouette, 3)}
                sub="0 = aleatório · 1 = perfeito"
              />
              <StatCard
                label="Variância 2D (PCA)"
                value={`${fmt(data.pca_variance_2d * 100)}%`}
                sub="explicada pelos 2 eixos"
              />
            </div>

            {/* Scatter */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-serif text-2xl font-bold text-foreground">Visualização 2D (PCA)</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Cada ponto é um parlamentar. Proximidade indica padrão de voto similar.
              </p>
              <div
                role="img"
                aria-label="Gráfico de dispersão: cada ponto é um parlamentar posicionado pelas duas primeiras componentes principais dos votos; pontos próximos indicam padrão de votação similar. A composição completa dos grupos está na lista abaixo."
              >
              <div aria-hidden="true">
              <ResponsiveContainer width="100%" height={420}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <XAxis dataKey="x" type="number" name="PC1" tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} />
                  <YAxis dataKey="y" type="number" name="PC2" tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} />
                  <Tooltip content={<ClusterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  {data.clusters.map((cluster, ci) => (
                    <Scatter
                      key={cluster.id}
                      name={cluster.label}
                      data={cluster.members.map(m => ({ ...m, clusterLabel: cluster.label }))}
                      fill={CLUSTER_COLORS[ci % CLUSTER_COLORS.length]}
                    >
                      {cluster.members.map((_, mi) => (
                        <Cell
                          key={mi}
                          fill={CLUSTER_COLORS[ci % CLUSTER_COLORS.length]}
                          fillOpacity={0.75}
                        />
                      ))}
                    </Scatter>
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
              </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4">
                {data.clusters.map((c, ci) => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[ci % CLUSTER_COLORS.length] }} />
                    <span className="text-xs text-muted-foreground">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cluster list */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-serif text-2xl font-bold text-foreground">Composição dos grupos</h2>
                <TrendingUp className="w-3 h-3 text-muted-foreground ml-auto" />
                <span className="text-xs text-muted-foreground">clique para expandir</span>
              </div>
              <div className="flex flex-col gap-3">
                {data.clusters.map((cluster, ci) => (
                  <ClusterCard
                    key={cluster.id}
                    cluster={cluster}
                    color={CLUSTER_COLORS[ci % CLUSTER_COLORS.length]}
                    index={ci}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
