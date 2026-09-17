import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FpeTierChipProps {
  tier?: 'REGISTRADO' | 'AUTODECLARADO' | 'IMPRENSA' | null;
  source?: string | null;
  sourceUrl?: string | null;
  capturedAt?: string | null;
  className?: string;
}

const TIER_LABEL: Record<string, string> = {
  REGISTRADO: 'Lista oficial',
  AUTODECLARADO: 'Autodeclarado',
  IMPRENSA: 'Imprensa',
};

const TIER_DESC: Record<string, string> = {
  REGISTRADO: 'Integrante confirmado na lista oficial da Frente Parlamentar Evangélica.',
  AUTODECLARADO: 'Filiado auto-declarado integrante da bancada, sem confirmação em lista oficial.',
  IMPRENSA: 'Identificado pela imprensa como integrante, sem confirmação oficial própria.',
};

const TIER_COLOR: Record<string, string> = {
  REGISTRADO: 'bg-purple-50 text-purple-800 border-purple-200',
  AUTODECLARADO: 'bg-amber-50 text-amber-800 border-amber-200',
  IMPRENSA: 'bg-gray-100 text-gray-700 border-gray-300',
};

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function FpeTierChip({ tier, source, sourceUrl, capturedAt, className }: FpeTierChipProps) {
  const [open, setOpen] = useState(false);
  if (!tier) return null;
  const label = TIER_LABEL[tier] ?? tier;

  return (
    <span className={cn('relative inline-flex', className)}>
      <Badge
        variant="outline"
        className={`cursor-help gap-1 text-xs ${TIER_COLOR[tier] ?? ''}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        {tier === 'REGISTRADO' ? <CheckCircle2 className="h-3 w-3" /> : <Info className="h-3 w-3" />}
        {label}
      </Badge>
      {open && (
        <span className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-border bg-background p-3 text-xs shadow-lg">
          <p className="font-semibold mb-1">{label}</p>
          <p className="text-muted-foreground mb-2">{TIER_DESC[tier] ?? ''}</p>
          {source && (
            <p className="text-muted-foreground">
              <strong className="text-foreground font-medium">Fonte:</strong> {source}
            </p>
          )}
          {capturedAt && (
            <p className="text-muted-foreground mt-1">
              <strong className="text-foreground font-medium">Captura:</strong> {formatDate(capturedAt)}
            </p>
          )}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Verificar na fonte <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </span>
      )}
    </span>
  );
}
