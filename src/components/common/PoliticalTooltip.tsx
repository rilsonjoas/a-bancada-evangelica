import React from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PoliticalTooltipProps {
  term: string;
  explanation: string;
  className?: string;
}

export const POLITICAL_GLOSSARY: Record<string, string> = {
  votaçãoNominal: "Votação em plenário onde o voto individual (Sim, Não ou Abstenção) de cada parlamentar é registrado nominalmente em ata pública.",
  fpe: "Frente Parlamentar Evangélica — grupo oficial de deputados e senadores declarados membros da bancada no Congresso Nacional.",
  notaGeral: "Pontuação de 0 a 100 baseada na aderência dos votos registrados às 5 pautas da metodologia. Não avalia a pessoa, fé ou caráter.",
  notaEstimada: "Quando o parlamentar esteve ausente ou participou de poucas votações classificadas, a nota é estimativa pela média histórica do partido.",
  consistência: "Percentual de votações presenciais onde o parlamentar manteve o posicionamento em relação à sua média geral.",
  aderência: "Medida de quanto os votos registrados do parlamentar acompanham os critérios da metodologia. Quanto maior, mais próximo do padrão considerado alinhado.",
};

export const PoliticalTooltip: React.FC<PoliticalTooltipProps> = ({ term, explanation, className = "" }) => {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 cursor-help border-b border-dashed border-muted-foreground/50 hover:border-primary text-foreground transition-colors ${className}`}>
            {term}
            <Info className="h-3 w-3 text-muted-foreground hover:text-primary inline shrink-0" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs p-3 leading-relaxed bg-slate-900 text-slate-100 border-slate-800 shadow-xl z-50">
          <p>{explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
