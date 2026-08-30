import { Newspaper, ExternalLink, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePoliticianNews, type NewsMention } from '@/hooks/usePoliticianNews';

interface NewsSectionProps {
  politicianId: number;
}

/**
 * Seção "No noticiário" (#7) no perfil do parlamentar.
 * Mostra apenas menções aprovadas na curadoria (nunca PENDING/REJECTED).
 * Design de confiança: título+fonte+data+link, sem editorializar texto.
 */
export function NewsSection({ politicianId }: NewsSectionProps) {
  const { data: mentions, isLoading } = usePoliticianNews(politicianId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" /> No noticiário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!mentions || mentions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-4 w-4" /> No noticiário
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Menções na imprensa curadas manualmente — não usadas na nota.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {mentions.map((m: NewsMention) => (
          <a
            key={m.id}
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 border rounded-lg bg-white hover:border-primary/40 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-normal line-clamp-2">{m.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-500">
                  <span>{m.sourceName}</span>
                  {m.publishedAt && (
                    <span className="inline-flex items-center gap-0.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(m.publishedAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
            </div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}