import React from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PoliticalTooltipProps {
  term: string;
  explanation: string;
  className?: string;
}

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
