import { useMemo, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Sparkles, MapPin, Keyboard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePoliticians } from "@/hooks/usePoliticians";
import { usePageMeta } from "@/hooks/usePageMeta";
import { MATCH_QUESTIONS, sortByAffinity, type MatchAnswers, type MatchChoice, type AffinityEntry } from "@/lib/match";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchStoryModal } from "@/components/match/MatchStoryModal";

const CHOICES: { value: MatchChoice; label: string; hint: string; keyHint: string }[] = [
  { value: "concordo", label: "Concordo", hint: "conta a nota do parlamentar neste critério", keyHint: "1" },
  { value: "discordo", label: "Não concordo", hint: "conta o reflexo (100 − nota)", keyHint: "2" },
  { value: "neutro", label: "Pular", hint: "critério sai do cálculo", keyHint: "3" },
];

const VISIBLE_RESULTS = 30;

const MatchPage = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<MatchAnswers>({});
  const [selectedState, setSelectedState] = useState("all");
  const [storyEntry, setStoryEntry] = useState<AffinityEntry | null>(null);

  usePageMeta(
    "Quem vota como você? — A Bancada Evangélica",
    "Responda 5 perguntas e veja quais parlamentares mais se aproximam da sua visão, calculado localmente com as mesmas notas da metodologia."
  );

  const { data, isLoading, error } = usePoliticians({
    limit: 500,
    sortBy: "score",
    sortOrder: "desc",
  });

  const totalEvaluated = data?.politicians?.length ?? 0;
  const finished = step >= MATCH_QUESTIONS.length;

  const statesList = useMemo(() => {
    if (!data?.politicians) return [];
    return [...new Set(data.politicians.map((p) => p.currentState))].sort();
  }, [data]);

  const ranked = useMemo(
    () => (data ? sortByAffinity(data.politicians, answers) : []),
    [data, answers]
  );

  const filteredRanked = useMemo(() => {
    if (selectedState === "all") return ranked;
    return ranked.filter((r) => r.politician.currentState === selectedState);
  }, [ranked, selectedState]);

  const answer = useCallback(
    (choice: MatchChoice) => {
      const q = MATCH_QUESTIONS[step];
      if (!q) return;
      setAnswers((prev) => ({ ...prev, [q.key]: choice }));
      setStep((s) => s + 1);
    },
    [step]
  );

  // Teclas de atalho 1, 2, 3 no quiz
  useEffect(() => {
    if (finished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se o usuário estiver digitando em um input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === '1') answer('concordo');
      else if (e.key === '2') answer('discordo');
      else if (e.key === '3') answer('neutro');
      else if (e.key === 'Backspace' && step > 0) setStep((s) => s - 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finished, step, answer]);

  if (finished) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <section className="bg-gradient-primary text-primary-foreground py-10">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-white">
              Parlamentares mais próximos de você
            </h1>
            <p className="text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Ordenados por afinidade com suas respostas, usando as mesmas notas
              da metodologia. Concordar conta a nota; discordar conta o reflexo
              (100 − nota); pular descarta o critério.
            </p>
          </div>
        </section>

        <section className="py-10">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  Mostrando {filteredRanked.length} de {totalEvaluated} parlamentares avaliados — cálculo local no seu navegador.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* State Filter */}
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="w-48 bg-card" aria-label="Filtrar por estado">
                      <SelectValue placeholder="Todos os Estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Estados ({totalEvaluated})</SelectItem>
                      {statesList.map((st) => (
                        <SelectItem key={st} value={st}>
                          Estado: {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAnswers({});
                    setStep(0);
                    setSelectedState("all");
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Refazer o teste
                </button>
              </div>
            </div>

            {isLoading && (
              <div role="status" className="text-center py-16 text-muted-foreground">
                Calculando afinidades…
              </div>
            )}
            {error && (
              <div className="text-center py-16 text-red-700">
                Não foi possível carregar os dados.{" "}
                <Link to="/match" className="underline">Tente novamente</Link>.
              </div>
            )}
            {!isLoading && !error && (
              <>
                {filteredRanked.length === 0 ? (
                  <Card className="my-8">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Nenhum parlamentar encontrado no estado de <strong>{selectedState}</strong>.
                    </CardContent>
                  </Card>
                ) : (
                  <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredRanked.slice(0, VISIBLE_RESULTS).map((entry, i) => (
                      <li key={entry.politician.id}>
                        <MatchCard entry={entry} rank={i + 1} onShareStory={(e) => setStoryEntry(e)} />
                      </li>
                    ))}
                  </ol>
                )}
                <p className="mt-8 text-sm text-muted-foreground max-w-2xl mx-auto text-center leading-relaxed">
                  Afinidade não é voto: é proximidade de visão sobre as pautas
                  que a metodologia acompanha. Consulte o perfil de cada um para
                  ver a forma como votou e a consistência. Se você concordou com
                  todos os critérios, esta ordem é exatamente a do{" "}
                  <Link to="/metodologia" className="text-primary hover:underline font-semibold">
                    ranking oficial
                  </Link>
                  .
                </p>
              </>
            )}
          </div>
        </section>

        {/* Modal do Card de Story */}
        <MatchStoryModal
          entry={storyEntry}
          isOpen={storyEntry !== null}
          onClose={() => setStoryEntry(null)}
        />
      </div>
    );
  }

  const question = MATCH_QUESTIONS[step];
  const progressPercent = Math.round((step / MATCH_QUESTIONS.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <section className="bg-gradient-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-white">
            Quem vota como você?
          </h1>
          <p className="text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Cinco perguntas sobre as pautas que orientam esta metodologia. No fim,
            você vê os parlamentares mais próximos da sua visão — calculado
            localmente, sem mandar nada pra lugar nenhum.
          </p>
          <div className="mt-3 flex items-center justify-center gap-3 text-xs text-blue-100">
            <Link to="/metodologia" className="hover:text-white transition-colors underline">
              Ver a metodologia completa
            </Link>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Keyboard className="w-3.5 h-3.5" /> Use as teclas [1, 2, 3] no teclado
            </span>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-xl">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Pergunta {step + 1} de {MATCH_QUESTIONS.length}
              </span>
              <span className="text-sm font-semibold text-primary">
                {progressPercent}% concluído
              </span>
            </div>
            <div
              className="h-2.5 w-full rounded-full bg-secondary overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progressPercent}% respondido`}
            >
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <Card className="card-elevated">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wide mb-2">
                <Sparkles className="w-4 h-4" />
                {question.label}
              </div>
              <h2 className="font-serif text-xl md:text-2xl font-bold mb-6">
                {question.question}
              </h2>

              <div className="space-y-3">
                {CHOICES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    aria-pressed={answers[question.key] === c.value}
                    onClick={() => answer(c.value)}
                    className="w-full flex items-center justify-between text-left rounded-lg border border-border bg-card hover:border-primary hover:bg-accent/40 transition-colors px-4 py-3.5 group focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <div>
                      <span className="block font-semibold text-foreground group-hover:text-primary transition-colors">
                        {c.label}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">{c.hint}</span>
                    </div>
                    <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-mono font-semibold text-muted-foreground bg-muted border border-border rounded group-hover:border-primary/50 group-hover:text-foreground">
                      {c.keyHint}
                    </kbd>
                  </button>
                ))}
              </div>

              {step > 0 && (
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Pergunta anterior
                  </button>
                  <span className="text-xs text-muted-foreground">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Backspace</kbd> para voltar
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default MatchPage;
