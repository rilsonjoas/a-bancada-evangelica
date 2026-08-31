import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileQuestion, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyAgendaCard } from '@/components/voting/KeyAgendaCard';
import { useVotingAnalysisData } from '@/hooks/useVotingAnalysisData';
import { usePageMeta } from '@/hooks/usePageMeta';
import { themeBySlug } from '@/lib/themes';

const ThemePage = () => {
  const { slug = '' } = useParams();
  const theme = themeBySlug(slug);

  const [sortBy, setSortBy] = useState<'votes' | 'consensus' | 'title'>('votes');

  const { data } = useVotingAnalysisData({});

  const rawAgendas = useMemo(
    () => (data?.keyAgendas ?? []).filter((a) => a.theme === slug),
    [data, slug]
  );

  const agendas = useMemo(() => {
    const list = [...rawAgendas];
    if (sortBy === 'votes') {
      return list.sort((a, b) => b.totalVotes - a.totalVotes);
    }
    if (sortBy === 'consensus') {
      return list.sort((a, b) => b.consensusScore - a.consensusScore);
    }
    if (sortBy === 'title') {
      return list.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
    }
    return list;
  }, [rawAgendas, sortBy]);

  usePageMeta(
    theme
      ? `${theme.label} — como a bancada votou | A Bancada Evangélica`
      : 'Tema não encontrado | A Bancada Evangélica',
    theme ? theme.description : undefined
  );

  if (!theme) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="card-elevated">
              <CardContent className="text-center py-12">
                <FileQuestion className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">
                  Este tema não existe ou ainda não tem pautas registradas.
                </p>
                <Link
                  to="/temas"
                  className="inline-flex items-center gap-2 text-primary font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar para Votações por tema
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  const Icon = theme.icon;
  const totalVotes = agendas.reduce((sum, a) => sum + a.totalVotes, 0);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <section className="bg-gradient-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            to="/temas"
            className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/80 hover:text-primary-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Votações por tema
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <Icon className="w-8 h-8 text-amber-400" />
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">{theme.label}</h1>
          </div>
          <p className="text-primary-foreground/90 max-w-3xl leading-relaxed">
            {theme.description}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-gray-600 border-b pb-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <span className="font-medium">
                {agendas.length} {agendas.length === 1 ? 'pauta-chave' : 'pautas-chave'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{totalVotes} votos registrados</span>
              <span aria-hidden="true">·</span>
              <span>Curadoria semestral</span>
            </div>

            {agendas.length > 1 && (
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-44 h-9 text-xs bg-background" aria-label="Ordenar pautas">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="votes">Mais votadas</SelectItem>
                    <SelectItem value="consensus">Maior consenso</SelectItem>
                    <SelectItem value="title">Título (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {agendas.length === 0 ? (
            <Card className="card-elevated">
              <CardContent className="text-center py-12 text-gray-500">
                <FileQuestion className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>
                  Nenhuma pauta-chave deste tema com voto registrado ainda.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {agendas.map((agenda) => (
                <KeyAgendaCard key={agenda.id} agenda={agenda} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ThemePage;