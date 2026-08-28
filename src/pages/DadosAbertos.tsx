import { useLocation } from 'react-router-dom';
import { Download, ExternalLink } from 'lucide-react';

// A API vive em domínio próprio (VPS/Railway) — links relativos cairiam
// no domínio do Vercel, onde não existe /api/*. Achado real 2026-08-23.
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

export const DadosAbertos = () => {
  const location = useLocation();
  const today = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
        Dados Abertos — A Bancada Evangélica
      </h1>

      <div className="max-w-xl mx-auto space-y-6">
        <p className="text-muted-foreground leading-relaxed">
          Este projeto disponibiliza os dados de transparência e pontuação dos
          parlamentares brasileiros com base em critérios objetivos da metodologia.
          Os dados podem ser utilizados para pesquisas, jornalismo ou análise pessoal.
        </p>

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

          {/* H6 (2026-08-27): histórico de auditoria das sincronizações */}
          <a
            href={`${API_BASE_URL}/api/stats/sync-history`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-medium hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
            Histórico de auditoria das sincronizações (diff de notas)
          </a>
        </div>

        {/* Checksum / integridade (H4) */}
        <div className="space-y-2 pt-4 border-t border-border text-sm">
          <p className="font-medium">Verificação de integridade (checksum)</p>
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
          <p className="text-muted-foreground">Como citar esses dados:</p>
          <p className="leading-relaxed">
            A Bancada Evangélica{location.pathname}. Acesso em {today}. Dados
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
