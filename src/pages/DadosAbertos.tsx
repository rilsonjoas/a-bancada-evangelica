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
      <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
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

          <a
            href={`${API_BASE_URL}/api/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-medium hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
            Explorar a API no Swagger (/api/docs)
          </a>
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
