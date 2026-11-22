import { GRUPOS_BENS } from '@/lib/gruposBens';
import type { BensDeclaradosDto } from '@/hooks/usePoliticianDetail';

const brl = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`;

/**
 * Bens declarados em cada eleição, lado a lado (decisão D2 de
 * docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * Só aparece com DUAS ou mais eleições. Mostra os valores brutos e NADA mais:
 * sem diferença, sem percentual, sem seta, sem cor de alerta, sem ranking. A
 * diferença entre duas declarações pode vir de compra, venda, nova avaliação,
 * mudança na forma de declarar ou erro; o site não tem como saber qual.
 */
export function EvolucaoBens({ history }: { history?: ReadonlyArray<BensDeclaradosDto> }) {
  const anos = (history ?? []).filter((h) => h && Number.isFinite(h.electionYear));
  if (anos.length < 2) return null;

  const linhas = GRUPOS_BENS.filter((g) => anos.some((a) => (a.byType?.[g.key] ?? 0) > 0));

  return (
    <section aria-labelledby="bens-eleicoes-titulo" className="mt-4 border-t pt-3">
      <h3 id="bens-eleicoes-titulo" className="text-sm font-semibold text-foreground">
        Bens declarados em cada eleição
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Os valores abaixo foram declarados pelo próprio candidato em cada eleição. Mostramos lado a lado, sem calcular
        diferença: ela pode vir de compra, venda, nova avaliação, mudança na forma de declarar ou erro, e o site não
        tem como saber qual.
      </p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Bens declarados ao TSE por eleição, em reais</caption>
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th scope="col" className="py-1.5 pr-2 font-medium">Grupo</th>
              {anos.map((a) => (
                <th key={a.electionYear} scope="col" className="py-1.5 pl-2 text-right font-medium tabular-nums">
                  {a.electionYear}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border font-semibold">
              <th scope="row" className="py-1.5 pr-2 text-left font-semibold">Total declarado</th>
              {anos.map((a) => (
                <td key={a.electionYear} className="py-1.5 pl-2 text-right tabular-nums whitespace-nowrap">
                  {a.total === null ? 'não exibido' : brl(a.total)}
                </td>
              ))}
            </tr>
            {linhas.map((g) => (
              <tr key={g.key} className="border-b border-border">
                <th scope="row" className="py-1.5 pr-2 text-left font-normal">{g.label}</th>
                {anos.map((a) => (
                  <td key={a.electionYear} className="py-1.5 pl-2 text-right tabular-nums whitespace-nowrap">
                    {a.byType ? brl(a.byType[g.key]) : 'não exibido'}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" className="py-1.5 pr-2 text-left font-normal">Bens declarados</th>
              {anos.map((a) => (
                <td key={a.electionYear} className="py-1.5 pl-2 text-right tabular-nums whitespace-nowrap">{a.itemCount}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
