import { Link } from 'react-router-dom';
import { ArrowRight, FileQuestion } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { THEMES } from '@/lib/themes';
import { useVotingAnalysisData } from '@/hooks/useVotingAnalysisData';
import { usePageMeta } from '@/hooks/usePageMeta';
import { countAgendasByTheme } from '@/lib/themes';

const ThemesIndex = () => {
  const { data } = useVotingAnalysisData({});
  const counts = countAgendasByTheme(data?.keyAgendas ?? []);
  const hasAny = THEMES.some((t) => (counts[t.slug] ?? 0) > 0);

  usePageMeta(
    'Votações por tema — A Bancada Evangélica',
    'Como a bancada evangélica votou por tema: meio ambiente e energia, assistência social, economia e agro, e trânsito. Pautas-chave com o voto de cada parlamentar.'
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <section className="bg-gradient-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">
            Votações por tema
          </h1>
          <p className="text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
            Como a bancada evangélica votou nos temas legislativos mais
            relevantes desta legislatura — cada pauta-chave com o voto de
            cada parlamentar, em linguagem leiga.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {!hasAny && (
            <Card className="card-elevated">
              <CardContent className="text-center py-12 text-gray-500">
                <FileQuestion className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum tema com pautas registradas ainda.</p>
              </CardContent>
            </Card>
          )}
          {hasAny && (
            <div className="grid gap-6 md:grid-cols-2">
              {THEMES.map((t) => {
                const count = counts[t.slug] ?? 0;
                if (count === 0) return null;
                const Icon = t.icon;
                return (
                  <Link key={t.slug} to={`/temas/${t.slug}`} className="group">
                    <Card className="card-elevated h-full transition-shadow hover:shadow-lg">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2 text-primary">
                            <Icon className="w-6 h-6" />
                            <CardTitle className="text-xl group-hover:underline">
                              {t.label}
                            </CardTitle>
                          </div>
                          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {count} {count === 1 ? 'pauta' : 'pautas'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{t.tagline}</p>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                          Ver votações <ArrowRight className="w-4 h-4" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ThemesIndex;