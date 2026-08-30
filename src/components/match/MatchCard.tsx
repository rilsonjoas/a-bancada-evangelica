import { useState } from "react";
import { Link } from "react-router-dom";
import { UserCircle2, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AffinityEntry } from "@/lib/match";

function affinityColor(affinity: number) {
  if (affinity >= 75) return "bg-green-600";
  if (affinity >= 60) return "bg-yellow-600";
  if (affinity >= 40) return "bg-orange-500";
  return "bg-red-600";
}

/** Card do resultado do Match Eleitor: foto, nome e afinidade com o cidadão. */
export function MatchCard({
  entry,
  rank,
  onShareStory,
}: {
  entry: AffinityEntry;
  rank?: number;
  onShareStory?: (entry: AffinityEntry) => void;
}) {
  const { politician, affinity } = entry;
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = politician.photoUrl && !imgFailed;

  return (
    <Card className="card-elevated h-full">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-start gap-3">
          {showPhoto ? (
            <img
              src={politician.photoUrl}
              alt={`Foto de ${politician.name}`}
              onError={() => setImgFailed(true)}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <span className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <UserCircle2 className="w-7 h-7" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <Link
              to={`/politicos/${politician.id}`}
              className="font-semibold text-foreground line-clamp-2 hover:underline"
            >
              {politician.name}
            </Link>
            <p className="text-sm text-muted-foreground truncate">
              {politician.currentParty} · {politician.currentState}
              {politician.currentHouse === "SENADO" ? " · Senador" : " · Deputado"}
            </p>
          </div>
          {rank !== undefined && rank <= 3 && (
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
              {rank}
            </span>
          )}
        </div>

        <div className="mt-4 flex-1">
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <span className="text-sm text-muted-foreground">
              <abbr
                title="Afinidade calculada com as mesmas notas da metodologia (proteção à vida, família, integridade, responsabilidade social e liberdade religiosa). Concordar conta a nota; discordar conta o reflexo (100 − nota); pular descarta o critério."
              >
                Afinidade com você
              </abbr>
            </span>
            <span className="text-lg font-bold text-foreground">{affinity.toFixed(0)}%</span>
          </div>
          <div
            className="h-2 w-full rounded-full bg-secondary overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(affinity)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Afinidade de ${affinity.toFixed(0)}% com você`}
          >
            <div
              className={`h-full rounded-full ${affinityColor(affinity)}`}
              style={{ width: `${Math.max(4, Math.round(affinity))}%`} }
            />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            Nota {politician.scores.overall.toFixed(1)}
          </span>
          <div className="flex items-center gap-2">
            {onShareStory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShareStory(entry)}
                className="h-8 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400"
                title="Gerar card para Story do Instagram/WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 mr-1" />
                Story
              </Button>
            )}
            <Link
              to={`/politicos/${politician.id}`}
              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              Ver perfil
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
