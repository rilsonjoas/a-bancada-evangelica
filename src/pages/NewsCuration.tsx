import { useState, useCallback, useMemo } from 'react';
import {
  Newspaper,
  ExternalLink,
  Calendar,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff,
  LogOut,
  Search,
  CheckSquare,
  Square,
  Filter,
  CheckCheck,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/apiClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const TOKEN_KEY = 'admin_news_token';

interface PendingMention {
  id: number;
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string;
  politician: {
    id: number;
    name: string;
    party: string;
    state: string;
    photoUrl: string | null;
  };
}

/** #7 — Área de curadoria de notícias aprimorada.
 * Suporta busca rápida, filtros por veículo/fonte, seleção individual e em lote. */
export default function NewsCurationPage() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? '');
  const [tokenInput, setTokenInput] = useState('');
  const [saved, setSaved] = useState(!!token);
  const [error, setError] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState<boolean>(false);
  const [showToken, setShowToken] = useState(false);

  // Filtros locais de curadoria
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const headersFor = useCallback(
    (t: string) => ({ 'Content-Type': 'application/json', 'x-admin-token': t }),
    [],
  );

  const { data: pending = [], refetch, isLoading } = useQuery({
    queryKey: ['news-pending', token],
    queryFn: async () => {
      if (!token) return [];
      const res = await apiFetch('/api/news/admin/pending', { headers: headersFor(token) });
      return res as PendingMention[];
    },
    enabled: !!saved && !!token,
  });

  // Contagem real da fila (Eixo 2, docs/PLANO-OPERACAO-SUSTENTAVEL.md) —
  // `pending` acima trunca em 100 (limite do endpoint /admin/pending, pra
  // manter a página leve). Sem isso, a fila podia ter 300 itens e a UI
  // mostrar "100 pendentes carregadas" como se fosse o total, escondendo
  // o backlog real justo quando ele mais importa (período eleitoral).
  const { data: totalPendingCount } = useQuery({
    queryKey: ['news-pending-count', token],
    queryFn: async () => {
      const res = await apiFetch('/api/news/admin/pending/count', { headers: headersFor(token) });
      return (res as { count: number }).count;
    },
    enabled: !!saved && !!token,
  });

  // Lista de veículos únicos para filtro
  const sources = useMemo(() => {
    const set = new Set<string>();
    pending.forEach((m) => {
      if (m.sourceName) set.add(m.sourceName);
    });
    return Array.from(set).sort();
  }, [pending]);

  // Aplicação de busca e filtros
  const filteredPending = useMemo(() => {
    return pending.filter((m) => {
      const matchesSource = selectedSource === 'ALL' || m.sourceName === selectedSource;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.politician.name.toLowerCase().includes(q) ||
        m.politician.party.toLowerCase().includes(q) ||
        m.politician.state.toLowerCase().includes(q) ||
        m.sourceName.toLowerCase().includes(q);
      return matchesSource && matchesQuery;
    });
  }, [pending, selectedSource, searchQuery]);

  // Atualização otimista do cache local
  const removeItemsFromCache = (idsToRemove: number[]) => {
    const idSet = new Set(idsToRemove);
    queryClient.setQueryData<PendingMention[]>(['news-pending', token], (old) =>
      old ? old.filter((m) => !idSet.has(m.id)) : [],
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      idsToRemove.forEach((id) => next.delete(id));
      return next;
    });
  };

  const reviewSingle = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setActionInFlight(true);
    setError(null);
    try {
      await apiFetch(`/api/news/admin/${id}/review`, {
        method: 'POST',
        headers: headersFor(token),
        body: JSON.stringify({ status }),
      });
      removeItemsFromCache([id]);
    } catch (e) {
      setError((e as Error).message || 'Falha ao salvar decisão');
    } finally {
      setActionInFlight(false);
    }
  };

  const reviewBatch = async (status: 'APPROVED' | 'REJECTED') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setActionInFlight(true);
    setError(null);
    try {
      await apiFetch('/api/news/admin/batch-review', {
        method: 'POST',
        headers: headersFor(token),
        body: JSON.stringify({ ids, status }),
      });
      removeItemsFromCache(ids);
    } catch (e) {
      setError((e as Error).message || 'Falha ao processar lote');
    } finally {
      setActionInFlight(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredPending.map((m) => m.id);
    const allSelected = visibleIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const saveToken = () => {
    if (!tokenInput.trim()) return;
    sessionStorage.setItem(TOKEN_KEY, tokenInput.trim());
    setToken(tokenInput.trim());
    setSaved(true);
    setError(null);
  };

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken('');
    setSaved(false);
    setTokenInput('');
    setSelectedIds(new Set());
  };

  const visibleAllSelected =
    filteredPending.length > 0 &&
    filteredPending.every((m) => selectedIds.has(m.id));

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Curadoria de Notícias</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Só menções <Badge variant="outline">Aprovadas</Badge> aparecem no perfil do parlamentar.
            Rejeite homônimos e matérias irrelevantes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </div>

      {!saved ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Acesso restrito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Esta área é exclusiva do administrador. Insira o token de curadoria.
            </p>
            <div className="flex gap-2">
              <Input
                type={showToken ? 'text' : 'password'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveToken()}
                placeholder="Token de administrador"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowToken((v) => !v)}
                title={showToken ? 'Ocultar' : 'Mostrar'}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button onClick={saveToken} disabled={!tokenInput.trim()}>
                Entrar
              </Button>
            </div>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Header da sessão com contadores e filtros */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{pending.length} pendentes carregadas</Badge>
              {filteredPending.length !== pending.length && (
                <span className="text-muted-foreground">({filteredPending.length} filtradas)</span>
              )}
              {/* Total real da fila (Eixo 2) — só aparece quando difere do
                  carregado, pra não duplicar informação nos dias normais
                  em que a fila cabe toda em 100. */}
              {typeof totalPendingCount === 'number' && totalPendingCount > pending.length && (
                <Badge variant="destructive" title="A fila tem mais itens do que a página carrega de uma vez">
                  {totalPendingCount} no total
                </Badge>
              )}
            </div>
            <button onClick={logout} className="inline-flex items-center gap-1 hover:text-red-600">
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>

          {/* Barra de busca e filtros rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/40 p-3 rounded-lg border border-border">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, parlamentar, partido ou fonte..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">Todas as fontes ({sources.length})</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ações em lote e controles de seleção */}
          {filteredPending.length > 0 && (
            <div className="flex items-center justify-between bg-background p-2.5 rounded-md border text-sm">
              <button
                onClick={toggleSelectAllVisible}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium text-xs sm:text-sm"
              >
                {visibleAllSelected ? (
                  <CheckSquare className="h-4 w-4 text-primary" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {visibleAllSelected ? 'Desmarcar visíveis' : 'Selecionar visíveis'} ({filteredPending.length})
              </button>
              {selectedIds.size > 0 && (
                <span className="text-xs font-semibold text-primary">
                  {selectedIds.size} selecionada(s)
                </span>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}

          {isLoading && <p className="text-sm text-gray-500 py-8 text-center">Carregando fila de curadoria…</p>}

          {!isLoading && pending.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-lg">Fila vazia 🎉</p>
              <p className="text-sm mt-1">Todas as menções coletadas já foram revisadas.</p>
            </div>
          )}

          {!isLoading && pending.length > 0 && filteredPending.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="font-medium text-sm">Nenhum resultado para a busca/filtro</p>
              <Button variant="link" size="sm" onClick={() => { setSearchQuery(''); setSelectedSource('ALL'); }}>
                Limpar filtros
              </Button>
            </div>
          )}

          {/* Cards de curadoria */}
          {filteredPending.map((m) => {
            const isChecked = selectedIds.has(m.id);
            return (
              <Card
                key={m.id}
                className={`transition-colors ${
                  isChecked ? 'border-primary bg-primary/5 shadow-sm' : 'bg-white hover:border-gray-300'
                }`}
              >
                <CardContent className="pt-5">
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    {/* Checkbox individual */}
                    <button
                      onClick={() => toggleSelect(m.id)}
                      className="mt-1 text-muted-foreground hover:text-primary shrink-0"
                      title={isChecked ? 'Desmarcar' : 'Selecionar'}
                    >
                      {isChecked ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>

                    {/* Dados do Parlamentar */}
                    <div className="flex items-center gap-3 md:w-64 shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={m.politician.photoUrl ?? undefined} />
                        <AvatarFallback>{m.politician.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-tight">{m.politician.name}</p>
                        <p className="text-xs text-gray-500">
                          {m.politician.party} · {m.politician.state}
                        </p>
                        <p className="text-[10px] text-amber-600 mt-0.5">Confira: verifique homônimos</p>
                      </div>
                    </div>

                    {/* Matéria / Título / Fonte */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-normal">{m.title}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-500">
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {m.sourceName}
                        </Badge>
                        {m.publishedAt && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(m.publishedAt).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                        >
                          Abrir matéria original
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    {/* Botões individuais de Ação */}
                    <div className="flex items-center gap-2 md:flex-col md:justify-center shrink-0 w-full md:w-auto mt-2 md:mt-0">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 md:flex-none"
                        onClick={() => reviewSingle(m.id, 'APPROVED')}
                        disabled={actionInFlight}
                      >
                        <Check className="h-4 w-4 mr-1" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 md:flex-none text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                        onClick={() => reviewSingle(m.id, 'REJECTED')}
                        disabled={actionInFlight}
                      >
                        <X className="h-4 w-4 mr-1" /> Rejeitar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating Action Bar para ações em lote */}
      {saved && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-4 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <span className="text-sm font-semibold whitespace-nowrap">
            {selectedIds.size} selecionada(s)
          </span>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={() => reviewBatch('APPROVED')}
              disabled={actionInFlight}
            >
              <CheckCheck className="h-4 w-4 mr-1.5" /> Aprovar Lote
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
              onClick={() => reviewBatch('REJECTED')}
              disabled={actionInFlight}
            >
              <XCircle className="h-4 w-4 mr-1.5" /> Rejeitar Lote
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-300 hover:text-white"
              onClick={() => setSelectedIds(new Set())}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}