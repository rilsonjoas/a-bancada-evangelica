import { Scale, Vote, TrendingDown, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CRITERIA_BY_KEY } from '@/lib/criteria';

export interface ScoreBreakdownItem {
  criteria: string;
  seedPoints: number;
  votePoints: number;
  penaltyPoints: number;
  weight: number;
  finalScore: number;
  subjectCount: number;
  formulaVersion: string;
}

const fmt = (n: number) => n.toFixed(1).replace('.', ',');

/**
 * M4 (2026-09-25): mostra de onde veio cada ponto da nota.
 *
 * Por que isto existe — a auditoria mediu que 91,8% da variância da nota é
 * explicada pelo partido, mas a tela mostrava UM número só. Quem via "69,0
 * / 100" não tinha como saber que a maior parte disso era herança partidária
 * e não voto próprio. Este painel é a resposta honesta a "como assim?",
 * e a base de qualquer confiança no resto do site.
 *
 * Os valores vêm de `score_breakdown`, gravados no recálculo junto com a
 * nota. Não são recalculados aqui: se a fórmula mudar, um componente
 * recomputado na leitura passaria a discordar da nota gravada.
 */
export function ScoreBreakdownPanel({
  items,
  formulaVersion,
}: {
  items: ScoreBreakdownItem[];
  formulaVersion?: string | null;
}) {
  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-muted-foreground" />
            Como esta nota foi montada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            A origem dos pontos desta nota ainda não foi registrada. Ela aparece
            a partir do próximo ciclo de sincronização.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasAnyPenalty = items.some((b) => b.penaltyPoints > 0);
  const hasAnyVote = items.some((b) => b.votePoints !== 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Como esta nota foi montada
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Toda nota é uma soma de três coisas: o que o partido dele historicamente
          defender, o que <em>ele próprio</em> votou, e o que tiramos por gasto
          fora do padrão. Nada é secreto — está nesta tabela.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Origem dos pontos de cada critério: pontos do partido, pontos do voto
              próprio, desconto por gasto e peso do critério.
            </caption>
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="py-2 pr-3 font-semibold">Critério</th>
                <th scope="col" className="py-2 px-2 text-right font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <Scale className="h-3 w-3" aria-hidden="true" />
                    Partido
                  </span>
                </th>
                <th scope="col" className="py-2 px-2 text-right font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <Vote className="h-3 w-3" aria-hidden="true" />
                    Voto próprio
                  </span>
                </th>
                {hasAnyPenalty && (
                  <th scope="col" className="py-2 px-2 text-right font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" aria-hidden="true" />
                      Gasto
                    </span>
                  </th>
                )}
                <th scope="col" className="py-2 px-2 text-right font-semibold">Peso</th>
                <th scope="col" className="py-2 pl-2 text-right font-semibold">Nota</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => {
                const cfg = CRITERIA_BY_KEY[b.criteria];
                const label = cfg?.label ?? b.criteria;
                const Icon = cfg?.Icon;
                return (
                  <tr key={b.criteria} className="border-b last:border-0">
                    <th scope="row" className="py-2.5 pr-3 text-left font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {Icon && <Icon className={`h-3.5 w-3.5 shrink-0 ${cfg?.iconClass ?? ''}`} aria-hidden="true" />}
                        {label}
                      </span>
                    </th>
                    <td className="py-2.5 px-2 text-right tabular-nums text-muted-foreground">
                      {fmt(b.seedPoints)}
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums">
                      {b.votePoints !== 0 ? (
                        <span className={b.votePoints > 0 ? 'text-emerald-700' : 'text-red-700'}>
                          {b.votePoints > 0 ? '+' : '−'}{fmt(Math.abs(b.votePoints))}
                        </span>
                      ) : (
                        <span className="text-muted-foreground" title="Nenhum voto registrado neste critério">
                          0
                        </span>
                      )}
                    </td>
                    {hasAnyPenalty && (
                      <td className="py-2.5 px-2 text-right tabular-nums">
                        {b.penaltyPoints > 0 ? (
                          <span className="text-red-700">−{fmt(b.penaltyPoints)}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    )}
                    <td className="py-2.5 px-2 text-right tabular-nums text-muted-foreground">
                      {Math.round(b.weight * 100)}%
                    </td>
                    <td className="py-2.5 pl-2 text-right tabular-nums font-semibold">
                      {b.finalScore.toFixed(0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-muted-foreground space-y-1.5">
          <p>
            A soma é <strong>arredondada ao ponto inteiro</strong> no fim — por
            isso as partes podem não fechar em centésimos. O que publicamos é a
            própria nota, não um valor recalculado aqui.
          </p>
          <p>
            <strong>Partido</strong> é a média de todos os deputados daquele
            partido neste critério. É o ponto de partida, não um veredito: serve
            para não deixar sem nota quem ainda não votou o bastante.
          </p>
          <p>
            <strong>Voto próprio</strong> é o quanto o voto dele se afasta dessa
            média do partido{hasAnyVote ? `, com base em ${maxSubjects(items)} assuntos distintos` : ''}.
            Quando aparece 0,{' '}
            {hasAnyVote
              ? 'é porque não há voto registrado neste critério'
              : 'é porque este parlamentar ainda não tem voto registrado em nenhum destes critérios'}
            {'— não porque o voto dele foi "neutro".'}
          </p>
          {hasAnyPenalty && (
            <p>
              <strong>Gasto</strong> é o desconto por despesas da cota
              parliamentary fora do padrão. Só afeta Integridade Moral, e só
              apontamos despesas com o link do recibo oficial para você
              conferir.
            </p>
          )}
          {formulaVersion && (
            <p className="text-muted-foreground/70">
              Calculado com a fórmula {formulaVersion}.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function maxSubjects(items: ScoreBreakdownItem[]): number {
  return Math.max(...items.map((b) => b.subjectCount), 0);
}
