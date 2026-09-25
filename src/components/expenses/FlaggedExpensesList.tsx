import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp, FileWarning, Ban } from "lucide-react";
import { useFlaggedExpenses } from "@/hooks/useFlaggedExpenses";
import type { FlaggedExpense } from "@/types/politician";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v ?? 0);

function LinhaDespesa({ e }: { e: FlaggedExpense }) {
  const [aberto, setAberto] = useState(false);

  return (
    <li className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-accent/40 transition-colors"
        aria-expanded={aberto}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-foreground truncate">
              {formatCurrency(e.netValue)}
            </span>
            <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
              {MESES[(e.month ?? 1) - 1]}/{e.year}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {e.expenseType ?? 'Categoria não informada'}
          </p>
          <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">
            {e.supplierName ?? 'Fornecedor não informado'}
          </p>
        </div>
        {aberto ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        )}
      </button>

      {aberto && (
        <div className="px-3 pb-3 -mt-1 space-y-2 text-xs">
          <div className="rounded-md bg-amber-50 border border-amber-200 p-2.5">
            <p className="font-semibold text-amber-900 mb-1">Por que foi marcada</p>
            <ul className="space-y-0.5">
              {e.reasons.map((r, i) => (
                <li key={i} className="text-amber-800">• {r}</li>
              ))}
            </ul>
          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground">
            <dt>Valor do documento</dt>
            <dd className="text-right tabular-nums">{formatCurrency(e.grossValue)}</dd>
            {e.refundValue ? (
              <>
                <dt>Valor glosado</dt>
                <dd className="text-right tabular-nums text-red-700">
                  − {formatCurrency(e.refundValue)}
                </dd>
              </>
            ) : null}
            <dt>Documento</dt>
            <dd className="text-right truncate">{e.documentNumber}</dd>
            <dt>Origem do dado</dt>
            <dd className="text-right">{e.isSenado ? 'Senado (CEAPS)' : 'Câmara (CEAP)'}</dd>
            <dt>CNPJ/CPF do fornecedor</dt>
            <dd className="text-right">
              {e.hasSupplierDocument ? 'informado' : <span className="text-amber-700">não informado</span>}
            </dd>
          </dl>

          {e.documentUrl ? (
            <a
              href={e.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              Abrir documento oficial
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <p className="text-muted-foreground/80 flex items-center gap-1.5">
              <Ban className="w-3 h-3" />
              A Casa não publicou o documento desta despesa.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Lista das despesas marcadas como fora do padrão (D2, 2026-09-25).
 *
 * É a peça que torna a marcação auditável: o aggregate acima diz QUANTO,
 * esta lista diz QUAIS e onde conferir o recibo na fonte oficial.
 */
export function FlaggedExpensesList({ politicianId }: { politicianId: number }) {
  const { data, isLoading } = useFlaggedExpenses(politicianId, 50);

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        Carregando despesas…
      </div>
    );
  }

  // D6: estado "sem dado" é diferente de "zero gasto fora do padrão".
  if (!data?.hasExpenseData) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <Ban className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-semibold text-foreground">Sem dados de despesa</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          Não há cota parlamentar sincronizada para este parlamentar. Isso
          <strong> não significa gasto normal</strong> — significa que o dado
          não está no acervo. A cobertura de despesas é parcial e está
          documentada em <code>/dados</code>.
        </p>
      </div>
    );
  }

  if (data.totalFlagged === 0) {
    return (
      <div className="rounded-lg border border-border p-6 text-center">
        <p className="text-sm font-semibold text-foreground">
          Nenhuma despesa fora do padrão
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {data.totalCount.toLocaleString('pt-BR')} despesas analisadas, nenhuma no
          topo da cauda da própria categoria.
        </p>
      </div>
    );
  }

  const showing = data.flagged.length;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 border-b border-border">
        <FileWarning className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-sm font-semibold text-foreground">
          {data.totalFlagged.toLocaleString('pt-BR')} despesas marcadas
        </p>
      </div>

      <ul>
        {data.flagged.map((e) => (
          <LinhaDespesa key={e.id} e={e} />
        ))}
      </ul>

      <div className="px-3 py-2.5 bg-muted/40 border-t border-border space-y-1.5">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Marcação <strong>estatística</strong>: a despesa está entre as 1% mais
          caras da própria categoria e também é um desvio em relação à mediana
          dela. Não é acusação nem constatação de irregularidade — pode ser
          erro de digitação, particularidade legítima do mandato, ou algo fora
          do padrão. O método está em <code>/metodologia</code>.
        </p>
        {showing < data.totalFlagged && (
          <p className="text-[11px] text-muted-foreground">
            Mostrando as {showing} de maior valor. O restante está no
            histórico completo —{' '}
            <a
              href={`/api/politicians/${politicianId}/expenses/flagged?limit=200`}
              className="text-primary hover:underline"
            >
              ver todas
            </a>.
          </p>
        )}
      </div>
    </div>
  );
}
