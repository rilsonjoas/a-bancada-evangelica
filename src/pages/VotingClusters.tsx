import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Brain, Users, TrendingUp, BarChart2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useClusterData, type ClusterMember } from '@/hooks/useClusterData';

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
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-6 h-6 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-widest">Análise ML</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Grupos de Votação</h1>
          <p className="text-muted-foreground max-w-2xl">
            Parlamentares agrupados por similaridade de padrão de voto usando{' '}
            <strong>KMeans clustering</strong> sobre a matriz de votações.
            Dimensionalidade reduzida via <strong>PCA</strong> antes do agrupamento.
            O número ótimo de grupos é determinado pelo maior <strong>silhouette score</strong>.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Calculando clusters…</p>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="font-semibold text-foreground">Serviço de análise indisponível</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              O serviço Python ainda não está implantado ou está inicializando.
              Volte em breve.
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
                value={data.silhouette.toFixed(3)}
                sub="0 = aleatório · 1 = perfeito"
              />
              <StatCard
                label="Variância 2D (PCA)"
                value={`${(data.pca_variance_2d * 100).toFixed(1)}%`}
                sub="explicada pelos 2 eixos"
              />
            </div>

            {/* Scatter */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">Visualização 2D (PCA)</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Cada ponto é um parlamentar. Proximidade indica padrão de voto similar.
              </p>
              <ResponsiveContainer width="100%" height={420}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <XAxis dataKey="x" type="number" name="PC1" tick={{ fontSize: 11 }} tickFormatter={v => v.toFixed(1)} />
                  <YAxis dataKey="y" type="number" name="PC2" tick={{ fontSize: 11 }} tickFormatter={v => v.toFixed(1)} />
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
                <h2 className="font-semibold text-foreground">Composição dos grupos</h2>
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
