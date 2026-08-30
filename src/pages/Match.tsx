import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Sparkles, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePoliticians } from "@/hooks/usePoliticians";
import { usePageMeta } from "@/hooks/usePageMeta";
import { MATCH_QUESTIONS, sortByAffinity, type MatchAnswers, type MatchChoice, type AffinityEntry } from "@/lib/match";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchStoryModal } from "@/components/match/MatchStoryModal";

const CHOICES: { value: MatchChoice; label: string; hint: string }[] = [
  { value: "concordo", label: "Concordo", hint: "conta a nota do parlamentar neste critério" },
  { value: "discordo", label: "Não concordo", hint: "conta o reflexo (100 − nota)" },
  { value: "neutro", label: "Pular", hint: "critério sai do cálculo" },
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

  const answer = (choice: MatchChoice) => {
    const q = MATCH_QUESTIONS[step];
    const next = { ...answers, [q.key]: choice };
    setAnswers(next);
    setStep((s) => s + 1);
  };

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
          <div className="container mx-auto px-4">
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
                <p className="mt-6 text-sm text-muted-foreground max-w-2xl mx-auto text-center leading-relaxed">
                  Afinidade não é voto: é proximidade de visão sobre as pautas
                  que a metodologia acompanha. Consulte o perfil de cada um para
                  ver a forma como votou e a consistência. Se você concordou com
                  todos os critérios, esta ordem é exatamente a do{" "}
                  <Link to="/metodologia" className="text-primary hover:underline">
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
  const answeredCount = Object.values(answers).filter(Boolean).length;

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
          <Link
            to="/metodologia"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-blue-100 hover:text-white transition-colors"
          >
            Ver a metodologia completa
          </Link>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-xl">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Pergunta {step + 1} de {MATCH_QUESTIONS.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {answeredCount || 0} respondidas
              </span>
            </div>
            <div
              className="h-2 w-full rounded-full bg-secondary overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round((answeredCount / MATCH_QUESTIONS.length) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${Math.round((answeredCount / MATCH_QUESTIONS.length) * 100)}% respondido`}
            >
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(answeredCount / MATCH_QUESTIONS.length) * 100}%` }}
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
                    className="w-full text-left rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-accent/40 transition-colors px-4 py-3"
                  >
                    <span className="block font-medium text-foreground">{c.label}</span>
                    <span className="block text-sm text-muted-foreground">{c.hint}</span>
                  </button>
                ))}
              </div>

              {step > 0 && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Pergunta anterior
                  </button>
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
