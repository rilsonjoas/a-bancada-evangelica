import React, { useState } from "react";
import { TrendingUp, TrendingDown, Minus, Users, Calendar, Info, ChevronDown, ChevronUp, Search } from "lucide-react";
import { CriteriaLabel, CRITERIA_BY_KEY } from "@/lib/criteria";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { fmt } from "@/lib/format";
import { useAgendaVotes } from "@/hooks/useVotes";
import { API_BASE_URL } from "@/lib/apiClient";

interface KeyAgendaCardProps {
  agenda: {
    id: string;
    title: string;
    description: string;
    practicalImpact?: string | null;
    criteria: string;
    totalVotes: number;
    favorableVotes: number;
    contraryVotes: number;
    abstentions: number;
    consensusScore: number;
    firstVoteDate?: string | null;
    lastVoteDate?: string | null;
  };
}

export function KeyAgendaCard({ agenda }: KeyAgendaCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [voteFilter, setVoteFilter] = useState<"ALL" | "YES" | "NO" | "ABSTENTION">("ALL");

  const { data: agendaVotesData, isLoading: loadingVotes } = useAgendaVotes(isExpanded ? agenda.id : "");

  const getCriteriaColor = (criteria: string) =>
    CRITERIA_BY_KEY[criteria]?.badgeClass ?? "bg-gray-100 text-gray-800";

  const rationale = CRITERIA_BY_KEY[agenda.criteria]?.rationale;

  const formatDate = (iso?: string | null) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return null;
    }
  };
  const firstDate = formatDate(agenda.firstVoteDate);
  const lastDate = formatDate(agenda.lastVoteDate);

  const getConsensusLevel = (score: number) => {
    if (score >= 80) return { label: "Alto Consenso", color: "text-green-700" };
    if (score >= 60) return { label: "Consenso Moderado", color: "text-blue-600" };
    if (score >= 40) return { label: "Baixo Consenso", color: "text-yellow-700" };
    return { label: "Muito Polarizado", color: "text-red-600" };
  };

  const safe = (n: number) => (agenda.totalVotes > 0 ? n : 0);
  const favorablePercentage = safe((agenda.favorableVotes / agenda.totalVotes) * 100);
  const contraryPercentage = safe((agenda.contraryVotes / agenda.totalVotes) * 100);
  const abstentionPercentage = safe((agenda.abstentions / agenda.totalVotes) * 100);

  const consensus = getConsensusLevel(agenda.consensusScore);
  const hasVotes = agenda.totalVotes > 0;

  const votesList = agendaVotesData?.votes || [];

  const filteredVotes = votesList.filter((v) => {
    const matchesSearch =
      v.politician.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.politician.currentParty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.politician.currentState.toLowerCase().includes(searchQuery.toLowerCase());

    if (voteFilter === "YES") return matchesSearch && (v.voteType === "YES" || v.voteType === "SIM" as any);
    if (voteFilter === "NO") return matchesSearch && (v.voteType === "NO" || v.voteType === "NAO" as any);
    if (voteFilter === "ABSTENTION") return matchesSearch && (v.voteType === "ABSTENTION" || v.voteType === "ABSENT");

    return matchesSearch;
  });

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="font-serif text-xl font-bold mb-2">{agenda.title}</CardTitle>
            <p className="text-muted-foreground text-sm mb-3">{agenda.description}</p>
            <div className="flex items-center gap-3">
              <Badge className={`text-xs ${getCriteriaColor(agenda.criteria)}`}>
                <CriteriaLabel criteriaKey={agenda.criteria} />
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{hasVotes ? `${agenda.totalVotes} votos nominais` : "Sem votos registrados"}</span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-2xl font-bold ${consensus.color}`}>
              {fmt(agenda.consensusScore)}%
            </div>
            <div className="text-sm text-muted-foreground">{consensus.label}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {rationale && (
          <div className="flex items-start gap-2.5 rounded-lg bg-secondary/40 p-3 text-sm">
            <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-0.5">Por que esta pauta está neste critério?</p>
              <p className="text-muted-foreground leading-relaxed">{rationale}</p>
            </div>
          </div>
        )}

        {agenda.practicalImpact && (
          <div className="flex items-start gap-2.5 rounded-lg bg-primary/5 p-3 border border-primary/10 text-sm">
            <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-0.5">Na prática, isso significa…</p>
              <p className="text-muted-foreground leading-relaxed">{agenda.practicalImpact}</p>
            </div>
          </div>
        )}

        {(firstDate || lastDate) && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Votações em plenário entre {firstDate} e {lastDate}
          </p>
        )}

        {hasVotes && (
          <div className="space-y-3 pt-2">
            {/* Bars */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Favoráveis</span>
                </div>
                <div>
                  <span className="font-bold text-emerald-600">{agenda.favorableVotes}</span>
                  <span className="text-muted-foreground ml-1">({fmt(favorablePercentage)}%)</span>
                </div>
              </div>
              <Progress value={favorablePercentage} className="h-2 bg-emerald-100" />

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  <span className="font-semibold">Contrários</span>
                </div>
                <div>
                  <span className="font-bold text-rose-600">{agenda.contraryVotes}</span>
                  <span className="text-muted-foreground ml-1">({fmt(contraryPercentage)}%)</span>
                </div>
              </div>
              <Progress value={contraryPercentage} className="h-2 bg-rose-100" />

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-1.5">
                  <Minus className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold">Abstenções / Ausentes</span>
                </div>
                <div>
                  <span className="font-bold text-amber-600">{agenda.abstentions}</span>
                  <span className="text-muted-foreground ml-1">({fmt(abstentionPercentage)}%)</span>
                </div>
              </div>
              <Progress value={abstentionPercentage} className="h-2 bg-amber-100" />
            </div>

            {/* Expand / Collapse Button */}
            <div className="pt-3 border-t border-border flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="font-sans text-xs font-bold text-primary border-primary/30 hover:bg-primary/5"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1.5" />
                    Ocultar votos dos parlamentares
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-1.5" />
                    Ver como cada deputado votou nesta pauta ({agenda.totalVotes})
                  </>
                )}
              </Button>
            </div>

            {/* Expanded Voter List Section */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-border space-y-3 bg-muted/20 p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por deputado, partido ou estado (ex: SP)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 text-xs h-9 bg-background"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={voteFilter === "ALL" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVoteFilter("ALL")}
                      className="text-xs h-9 px-2.5"
                    >
                      Todos
                    </Button>
                    <Button
                      variant={voteFilter === "YES" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVoteFilter("YES")}
                      className="text-xs h-9 px-2.5 text-emerald-700 border-emerald-300"
                    >
                      Sim ({agenda.favorableVotes})
                    </Button>
                    <Button
                      variant={voteFilter === "NO" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVoteFilter("NO")}
                      className="text-xs h-9 px-2.5 text-rose-700 border-rose-300"
                    >
                      Não ({agenda.contraryVotes})
                    </Button>
                  </div>
                </div>

                {loadingVotes ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    Carregando votos dos parlamentares...
                  </div>
                ) : filteredVotes.length > 0 ? (
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-2 flex items-center justify-between">
                      <span>Exibindo <strong>{filteredVotes.length}</strong> parlamentares</span>
                      {searchQuery && <span>Filtro de busca ativo</span>}
                    </div>
                    <div className="max-h-96 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin">
                    {filteredVotes.map((v) => {
                      const isSim = v.voteType === "YES" || v.voteType === "SIM" as any;
                      const isNao = v.voteType === "NO" || v.voteType === "NAO" as any;

                      return (
                        <div
                          key={v.id}
                          className="flex items-center justify-between bg-background p-2.5 rounded-lg border border-border/60 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={`${API_BASE_URL}/api/politicians/${v.politician.id}/photo`}
                              alt={v.politician.name}
                              className="w-7 h-7 rounded-full object-cover bg-slate-200"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/placeholder-avatar.png";
                              }}
                            />
                            <div>
                              <Link
                                to={`/politicos/${v.politician.id}`}
                                className="font-bold text-foreground hover:text-primary transition-colors"
                              >
                                {v.politician.name}
                              </Link>
                              <div className="text-[11px] text-muted-foreground">
                                {v.politician.currentParty} · {v.politician.currentState}
                              </div>
                            </div>
                          </div>

                          <Badge
                            className={`text-[10px] font-bold ${
                              isSim
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : isNao
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}
                          >
                            {isSim ? "VOTOU SIM" : isNao ? "VOTOU NÃO" : "ABSTENÇÃO"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    {votesList.length === 0
                      ? "Os votos individuais desta votação estão registrados no placar geral do Congresso."
                      : "Nenhum parlamentar encontrado para esta busca."}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
