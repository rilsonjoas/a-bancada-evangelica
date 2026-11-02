import { CATEGORIAS_ORIGEM, percentuaisInteiros, percentualFundosPublicos, type BySource } from '@/lib/origemRecursos';

const brl = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`;

/**
 * "De onde veio o dinheiro" (Fase C de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * Mostra a divisão da arrecadação por origem declarada ao TSE. É transparência,
 * não nota: o texto diz que fundo público chegar à campanha é a regra, para
 * ninguém ler o número como indício de irregularidade.
 */
export function OrigemDosRecursos({ bySource }: { bySource: BySource }) {
  const itens = CATEGORIAS_ORIGEM.map((c) => ({ ...c, valor: bySource[c.key] })).filter((c) => c.valor > 0);
  if (itens.length === 0) return null;

  const pct = percentuaisInteiros(itens.map((i) => i.valor));
  const publicos = percentualFundosPublicos(bySource);
  const resumo = itens.map((it, i) => `${it.label}: ${pct[i]}%`).join('; ');

  return (
    <section aria-labelledby="origem-recursos-titulo" className="border-t pt-3">
      <h3 id="origem-recursos-titulo" className="text-sm font-semibold text-foreground">
        De onde veio o dinheiro
      </h3>
      {publicos !== null && publicos > 0 && (
        <p className="mt-1 text-sm leading-relaxed">
          <strong>{publicos}%</strong> do dinheiro da campanha veio de fundos públicos (Fundo Eleitoral e Fundo
          Partidário).
        </p>
      )}

      <div
        role="img"
        aria-label={`Origem do dinheiro. ${resumo}.`}
        className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-gray-100"
      >
        {itens.map((it, i) => (
          <div key={it.key} style={{ width: `${(it.valor / itens.reduce((a, b) => a + b.valor, 0)) * 100}%`, backgroundColor: it.cor }} data-pct={pct[i]} />
        ))}
      </div>

      <ul className="mt-3 space-y-2">
        {itens.map((it, i) => (
          <li key={it.key} className="text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: it.cor }} />
                <span className="font-medium">{it.label}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                {brl(it.valor)} <span className="text-muted-foreground">({pct[i] === 0 ? 'menos de 1' : pct[i]}%)</span>
              </span>
            </div>
            <p className="ml-[18px] text-xs text-muted-foreground">{it.explicacao}</p>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Origem conforme declarada pelo candidato ao TSE. Receber dinheiro dos fundos públicos pelo partido é a regra
        das campanhas de 2022, não indício de irregularidade.
      </p>
    </section>
  );
}
