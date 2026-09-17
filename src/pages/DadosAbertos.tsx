import { usePageMeta } from '@/hooks/usePageMeta';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import { formatRelativeTime } from '@/lib/format';

// http://192.168.0.101:3001/politicians não existe mais; API em domínio próprio
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

const SYNC_TYPE_LABEL: Record<string, string> = {
  POLITICIANS: 'políticos',
  VOTES: 'votações',
  EXPENSES: 'gastos parlamentares',
  TSE_DATA: 'dados do TSE',
  SCORES: 'notas (scores)',
  NEWS: 'menções na imprensa',
};

interface LastSyncResponse {
  lastSync: string | null;
  syncType: string | null;
  source: string | null;
}

interface SyncLogEntry {
  id: string;
  sync_type: string;
  source: string | null;
  status: string;
  start_time: string | null;
  end_time: string | null;
  records_processed: number | null;
  records_inserted: number | null;
  records_updated: number | null;
  records_failed: number | null;
  error_message: string | null;
  details: unknown;
}

/**
 * Eixo 1 do docs/PLANO-OPERACAO-SUSTENTAVEL.md — expor frescor real em
 * vez de deixar o dado parecer sempre atualizado. GET /api/stats/last-sync
 * já existia, público, mas não era consumido em nenhum lugar do frontend.
 *
 * >48h sem sincronizar vira um aviso visual (não é erro fatal — o site
 * continua servindo o último dado bom — mas quem visita e quem mantém o
 * projeto veem a mesma informação honesta ao mesmo tempo).
 */
function LastSyncStatus() {
  const { data, isLoading } = useQuery({
    queryKey: ['stats-last-sync'],
    queryFn: () => apiFetch<LastSyncResponse>('/api/stats/last-sync'),
    staleTime: 5 * 60_000,
  });

  if (isLoading) return null;

  const relative = formatRelativeTime(data?.lastSync ?? null);
  if (!relative) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>Nenhuma sincronização registrada ainda.</span>
      </div>
    );
  }

  const hoursAgo = data?.lastSync ? (Date.now() - new Date(data.lastSync).getTime()) / 3_600_000 : Infinity;
  const isStale = hoursAgo > 48;
  const typeLabel = data?.syncType ? SYNC_TYPE_LABEL[data.syncType] ?? data.syncType.toLowerCase() : 'dados';

  return (
    <div
      className={`flex items-center gap-2 text-sm rounded-lg px-4 py-2.5 border ${
        isStale
          ? 'text-amber-700 bg-amber-50 border-amber-200'
          : 'text-green-700 bg-green-50 border-green-200'
      }`}
    >
      {isStale ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
      <span>
        Última sincronização com sucesso ({typeLabel}): <strong>{relative}</strong>
        {isStale && ' — mais tempo que o esperado, verificando'}
      </span>
    </div>
  );
}

/**
 * H6 (2026-08-27, ampliado 2026-09-16): trilha de auditoria legível na
 * página — antes era um link para o JSON cru de /api/stats/sync-history,
 * que ninguém abria. Agora as últimas sincronizações aparecem em tabela,
 * e o link ao JSON bruto continua como "dado aberto" para quem quiser.
 */
function SyncHistoryTable() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['stats-sync-history'],
    queryFn: () => apiFetch<SyncLogEntry[]>('/api/stats/sync-history?limit=8'),
    staleTime: 5 * 60_000,
  });

  if (isLoading) return null;
  if (isError || !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>Não foi possível carregar a trilha de auditoria.</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Tipo</th>
            <th className="px-3 py-2 text-left font-medium">Origem</th>
            <th className="px-3 py-2 text-left font-medium">Status</th>
            <th className="px-3 py-2 text-left font-medium">Registros</th>
            <th className="px-3 py-2 text-left font-medium">Última execução</th>
          </tr>
        </thead>
        <tbody>
          {data.map((log) => (
            <tr key={log.id} className="border-t border-border">
              <td className="px-3 py-2 font-medium">{SYNC_TYPE_LABEL[log.sync_type] ?? log.sync_type.toLowerCase()}</td>
              <td className="px-3 py-2 text-muted-foreground">{log.source ?? '—'}</td>
              <td className="px-3 py-2">
                {log.status === 'SUCCESS' ? (
                  <span className="inline-flex items-center gap-1 text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> OK
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5" /> Falha
                  </span>
                )}
              </td>
              <td className="px-3 py-2 font-mono text-muted-foreground">
                {log.records_inserted ?? 0} ins / {log.records_updated ?? 0} upd
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {formatRelativeTime(log.end_time ?? null)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const DadosAbertos = () => {
  usePageMeta("Dados Abertos & API | A Bancada Evangélica", "Acesse nossos dados abertos e APIs públicas para auditoria e pesquisa.");

  const location = useLocation();
  const today = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
        Dados Abertos — A Bancada Evangélica
      </h1>

      <div className="max-w-xl mx-auto space-y-6">
        <p className="text-muted-foreground leading-relaxed">
          Este projeto disponibiliza os dados de transparência e pontuação dos
          parlamentares brasileiros com base em critérios objetivos da metodologia.
          Os dados podem ser utilizados para pesquisas, jornalismo ou análise pessoal.
        </p>

        <LastSyncStatus />

        <div className="space-y-3">
          <a
            href={`${API_BASE_URL}/api/politicians/export/csv`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-medium hover:bg-muted transition-colors"
            download
          >
            <Download className="h-5 w-5" />
            Baixar ranking completo em CSV
          </a>

          {/* H4 (2026-08-27): Export de votações individuais — auditoria total */}
          <a
            href={`${API_BASE_URL}/api/politicians/export/votes/csv`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-medium hover:bg-muted transition-colors"
            download
          >
            <Download className="h-5 w-5" />
            Baixar votações individuais em CSV
          </a>

          <a
            href={`${API_BASE_URL}/api/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-medium hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
            Explorar a API no Swagger (/api/docs)
          </a>

          {/* H6 (2026-08-27): histórico de auditoria das sincronizações —
              agora legível na própria página, não só JSON cru. */}
          <div className="space-y-3">
            <div>
              <h2 className="font-semibold text-base text-foreground">Trilha de auditoria das sincronizações</h2>
              <p className="text-muted-foreground">
                Cada vez que os dados são atualizados (votações, gastos, notas), um registro é
                gravado com origem e quantidade de linhas.
              </p>
            </div>
            <SyncHistoryTable />
            <a
              href={`${API_BASE_URL}/api/stats/sync-history`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline hover:text-primary transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir histórico completo em JSON bruto
            </a>
          </div>
        </div>

        {/* Checksum / integridade (H4) */}
        <div className="space-y-2 pt-4 border-t border-border text-sm">
          <h2 className="font-semibold text-base text-foreground">Verificação de integridade (checksum)</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cada arquivo CSV baixado é enviado com um cabeçalho{' '}
            <code className="break-all bg-secondary px-1 py-0.5 rounded">X-Content-SHA256</code>{' '}
            contendo o hash SHA-256 do conteúdo. Para conferir que o arquivo não foi
            alterado entre o servidor e você, compare o hash do download com o hash
            local:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-secondary/50 p-3 text-xs leading-relaxed">
            <code>
{`# após baixar o arquivo:
sha256sum bancada-evangelica-votacoes.csv

# o resultado deve ser idêntico ao valor do cabeçalho
# X-Content-SHA256 da resposta HTTP do download`}
            </code>
          </pre>
          <p className="text-muted-foreground leading-relaxed">
            Dessa forma, qualquer pessoa pode verificar que os dados baixados são
            exatamente os publicados nesta plataforma — sem alteração intermediária.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Erros encontrados e corrigidos são anunciados publicamente na{' '}
            <a href="/errata" className="underline hover:text-primary transition-colors">Errata pública</a>.
          </p>
        </div>

        <div className="space-y-2 pt-4 border-t border-border text-sm">
          <h2 className="font-semibold text-base text-foreground">Como citar esses dados</h2>
          <p className="leading-relaxed">
            A Bancada Evangélica — Dados Abertos. Acesso em {today}. Dados
            provenientes de votações nominais públicas da Câmara dos Deputados e do
            Senado Federal. Para detalhes de cálculo, consulte a{' '}
            <a href="/metodologia" className="underline hover:text-primary transition-colors">Metodologia</a>.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            LGPD: os dados são de domínio público (votos nominais e ementas). Não há
            tratamento de dados pessoais sensíveis além do registro público de votação
            parlamentar.
          </p>
        </div>
      </div>
    </div>
  );
};
