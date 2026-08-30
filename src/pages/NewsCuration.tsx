import { useState, useCallback } from 'react';
import { Newspaper, ExternalLink, Calendar, ShieldCheck, Check, X, RefreshCw, AlertTriangle, Eye, EyeOff, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/apiClient';
import { useQuery } from '@tanstack/react-query';

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

/** #7 — Área de curadoria de notícias. Todo item coletado nasce PENDING;
 * só APPROVED é publicado no perfil. Aprovar/Rejeitar é decisão humana. */
export default function NewsCurationPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? '');
  const [tokenInput, setTokenInput] = useState('');
  const [saved, setSaved] = useState(!!token);
  const [error, setError] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState<number | null>(null);
  const [showToken, setShowToken] = useState(false);

  const headersFor = useCallback(
    (t: string) => ({ 'Content-Type': 'application/json', 'x-admin-token': t }),
    [],
  );

  const { data: pending, refetch, isLoading } = useQuery({
    queryKey: ['news-pending', token],
    queryFn: async () => {
      if (!token) return [];
      const res = await apiFetch('/api/news/admin/pending', { headers: headersFor(token) });
      return res as PendingMention[];
    },
    enabled: !!saved && !!token,
  });

  const review = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setActionInFlight(id);
    setError(null);
    try {
      await apiFetch(`/api/news/admin/${id}/review`, {
        method: 'POST',
        headers: headersFor(token),
        body: JSON.stringify({ status }),
      });
      await refetch();
    } catch (e) {
      setError((e as Error).message || 'Falha ao salvar decisão');
    } finally {
      setActionInFlight(null);
    }
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
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Curadoria de Notícias</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Só menções <Badge variant="outline">Aprovadas</Badge> aparecem no perfil do parlamentar.
            Rejeite homônimos e matérias irrelevantes.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      {!saved ? (
        <Card className="max-w-md">
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
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Badge variant="secondary">Fila aberta</Badge>
            <button onClick={logout} className="inline-flex items-center gap-1 hover:text-red-600">
              <LogOut className="h-3 w-3" /> Sair
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}

          {isLoading && <p className="text-sm text-gray-500">Carregando fila…</p>}

          {!isLoading && pending && pending.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Fila vazia 🎉</p>
              <p className="text-sm">Todas as menções coletadas já foram revisadas.</p>
            </div>
          )}

          {pending?.map((m) => (
            <Card key={m.id} className="bg-white">
              <CardContent className="pt-5">
                <div className="flex flex-col md:flex-row gap-4">
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
                      {/* CUIDADO: homônimos! Confira nome completo + partido/UF antes de aprovar */}
                      <p className="text-[10px] text-amber-600 mt-0.5">Confira: verifique homônimos</p>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-normal">{m.title}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-500">
                      <span>{m.sourceName}</span>
                      {m.publishedAt && (
                        <span className="inline-flex items-center gap-0.5">
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
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Abrir matéria original
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:flex-col md:justify-center shrink-0">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => review(m.id, 'APPROVED')}
                      disabled={actionInFlight !== null}
                    >
                      <Check className="h-4 w-4 mr-1" /> Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => review(m.id, 'REJECTED')}
                      disabled={actionInFlight !== null}
                    >
                      <X className="h-4 w-4 mr-1" /> Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}