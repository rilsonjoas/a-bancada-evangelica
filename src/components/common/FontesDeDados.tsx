import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { FONTES_DE_DADOS } from '@/lib/sources';

/**
 * "De onde vem cada dado" (Fase A de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * Lista as fontes oficiais do catálogo `FONTES_DE_DADOS`, com o que cada uma
 * fornece, para qualquer pessoa conferir a origem sem precisar abrir o código.
 */
export function FontesDeDados() {
  return (
    <section aria-labelledby="fontes-oficiais-titulo" className="space-y-2 pt-4 border-t border-border text-sm">
      <h2 id="fontes-oficiais-titulo" className="font-semibold text-base text-foreground">
        De onde vem cada dado
      </h2>
      <p className="text-muted-foreground leading-relaxed">
        Parlamentares, votações, despesas e financiamento de campanha vêm de dados abertos
        oficiais; as menções na imprensa vêm de busca no Google Notícias. A nota também usa uma
        estimativa a partir do histórico do partido, explicada na{' '}
        <Link to="/metodologia" className="underline hover:text-primary transition-colors">
          Metodologia
        </Link>
        . Cada fonte abaixo leva à página de origem, onde dá para conferir os arquivos originais.
      </p>
      <ul className="space-y-3">
        {FONTES_DE_DADOS.map((f) => (
          <li key={f.id}>
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 py-1 font-medium text-foreground underline hover:text-primary transition-colors"
            >
              {f.nome}
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
            <p className="text-muted-foreground leading-relaxed">{f.fornece}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
