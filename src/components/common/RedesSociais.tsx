import { ExternalLink, Facebook, Globe, Instagram, Twitter, Youtube, type LucideIcon } from 'lucide-react';
import type { PoliticianDetail } from '@/hooks/usePoliticianDetail';

type Link = NonNullable<PoliticianDetail['socialLinks']>[number];

const ICONS: Record<Link['platform'], LucideIcon> = {
  instagram: Instagram,
  x: Twitter,
  facebook: Facebook,
  youtube: Youtube,
  website: Globe,
};

const ORIGEM: Record<Link['origin'], string> = {
  CAMARA: 'à Câmara dos Deputados',
  SENADO: 'ao Senado Federal',
  TSE: 'ao TSE, na candidatura de 2022',
};

/**
 * Perfis do parlamentar nas redes (B3 de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * A API entrega a lista já sanitizada e sem os links comprovadamente quebrados;
 * aqui só se renderiza. Cada link leva ícone E nome da rede (nada só por
 * ícone ou cor). O texto diz de onde o link veio e que o site não confere o
 * conteúdo do perfil. Sem links válidos, não renderiza nada.
 */
export function RedesSociais({ links }: { links?: PoliticianDetail['socialLinks'] }) {
  const valid = (links ?? []).filter(
    (l) => (l.url.startsWith('https://') || (l.platform === 'website' && l.url.startsWith('http://'))) && ICONS[l.platform],
  );
  if (valid.length === 0) return null;

  const origem = [...new Set(valid.map((l) => ORIGEM[l.origin]).filter(Boolean))].join(' e ');

  return (
    <section aria-label="Perfis nas redes" className="mt-4">
      <p className="text-xs text-gray-600">
        Perfis informados {origem}. Abrem em outro site; não conferimos o que é publicado neles.
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {valid.map((l) => {
          const Icon = ICONS[l.platform];
          return (
            <li key={l.platform}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm text-blue-700 hover:bg-gray-50 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {l.label}
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
