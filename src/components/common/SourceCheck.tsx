import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

export interface SourceCheckLink {
  label: string;
  url: string | null;
}

interface SourceCheckProps {
  /** O que o leitor encontra na fonte (ex.: "Os votos vêm dos dados abertos da Câmara."). */
  description: string;
  links: SourceCheckLink[];
}

/**
 * "Verifique você mesmo" (Fase A de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * Leva o leitor à fonte oficial do dado exibido. Diz também o limite: o link
 * confirma o dado de origem, não a nota, que é cálculo do site.
 *
 * Sem link válido, não renderiza nada: um bloco de conferência sem nada para
 * conferir seria promessa vazia. Só aceita `https`.
 */
export function SourceCheck({ description, links }: SourceCheckProps) {
  const valid = links.filter(
    (l): l is { label: string; url: string } => !!l.url && l.url.startsWith('https://'),
  );
  if (valid.length === 0) return null;

  return (
    <aside
      aria-label="Verifique você mesmo"
      className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700"
    >
      <p className="font-medium text-gray-900">Verifique você mesmo</p>
      <p className="mt-1">
        {description} A nota é um cálculo nosso, explicado na{' '}
        <Link to="/metodologia" className="text-blue-700 underline hover:text-blue-900">
          Metodologia
        </Link>
        ; o link abaixo confirma o dado de origem.
      </p>
      <ul className="mt-2 space-y-1">
        {valid.map((l) => (
          <li key={l.url}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 py-1 text-blue-700 underline hover:text-blue-900"
            >
              {l.label}
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
