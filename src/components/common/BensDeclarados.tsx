import { percentuaisInteiros } from '@/lib/origemRecursos';
import { GRUPOS_BENS } from '@/lib/gruposBens';
import type { BensDeclaradosDto } from '@/hooks/usePoliticianDetail';

type Assets = BensDeclaradosDto;

const brl = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`;


/**
 * Bens declarados ao TSE (Fase D de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * Transparência, não nota e não comparação: sem ranking, sem "mais rico",
 * sem cálculo de crescimento. O texto diz de quem é o valor (declarado pelo
 * candidato), de quando (2022) e o que não é (valor de mercado, auditoria).
 */
export function BensDeclarados({ assets }: { assets: Assets }) {
  const grupos = assets.byType
    ? GRUPOS_BENS.map((g) => ({ ...g, valor: assets.byType![g.key] })).filter((g) => g.valor > 0)
    : [];
  const pct = percentuaisInteiros(grupos.map((g) => g.valor));

  return (
    <section aria-label="Bens declarados" className="space-y-3">
      {assets.unverified || assets.total === null ? (
        <p className="text-sm leading-relaxed">
          Este candidato declarou <strong>{assets.itemCount}</strong> bem(ns) ao TSE em {assets.electionYear}, mas o valor
          informado está acima do limite que o site usa para exibir sem checagem. Por isso o total não é mostrado. A
          declaração original está no TSE.
        </p>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-muted-foreground">Total declarado:</span>
            <span className="text-lg font-bold tabular-nums">{brl(assets.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Bens declarados:</span>
            <span className="font-semibold">{assets.itemCount}</span>
          </div>

          {grupos.length > 0 && (
            <ul className="border-t pt-3 space-y-2">
              {grupos.map((g, i) => (
                <li key={g.key} className="text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{g.label}</span>
                    <span className="shrink-0 tabular-nums">
                      {brl(g.valor)} <span className="text-muted-foreground">({pct[i] === 0 ? 'menos de 1' : pct[i]}%)</span>
                    </span>
                  </div>
                  {g.exemplo && <p className="text-xs text-muted-foreground">{g.exemplo}</p>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
        Valores declarados pelo próprio candidato ao TSE em {assets.electionYear}. Não são valor de mercado e não foram
        auditados por nós. Não afetam a nota.
      </p>
    </section>
  );
}
