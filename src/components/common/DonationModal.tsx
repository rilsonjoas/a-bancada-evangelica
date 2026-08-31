import { useState } from 'react';
import { Heart, Copy, Check, ShieldCheck, Server, Sparkles, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DonationModalProps {
  children?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PIX_KEY = 'abancada@narniano.com';

export function DonationModal({ children, isOpen, onOpenChange }: DonationModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback manual se clipboard falhar
    }
  };

  const modalBody = (
    <DialogContent className="max-w-lg bg-background p-6 rounded-xl border border-border shadow-2xl">
      <DialogHeader className="text-left space-y-2">
        <div className="flex items-center gap-2">
          <div className="bg-red-50 dark:bg-red-950/40 p-2 rounded-full text-red-600 dark:text-red-400">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <DialogTitle className="text-xl font-bold font-serif">
            Apoie o Projeto Independente
          </DialogTitle>
        </div>
        <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
          Inspirado no modelo Wikipedia: mantido exclusivamente por leitores e cidadãos engajados, sem qualquer vínculo partidário ou comercial.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 my-2">
        {/* Pilares da independência */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-muted/40 rounded-lg border border-border/50 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground block font-medium">Sem Anúncios ou Ads</strong>
              <span className="text-muted-foreground">Zero banners patrocinados ou interesse comercial.</span>
            </div>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg border border-border/50 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground block font-medium">Sem Destaque Pago</strong>
              <span className="text-muted-foreground">Nenhum candidato pode pagar para subir no ranking.</span>
            </div>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg border border-border/50 flex items-start gap-2.5 sm:col-span-2">
            <Server className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground block font-medium">Para onde vai a sua doação?</strong>
              <span className="text-muted-foreground">
                Custeio dos servidores Hetzner (VPS), sincronização diária de dados abertos da Câmara/Senado e infraestrutura do watchdog.
              </span>
            </div>
          </div>
        </div>

        {/* Chave Pix para contribuição */}
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-3 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Chave PIX (E-mail)</span>
            <span className="text-[11px] text-slate-400">Qualquer valor ajuda!</span>
          </div>

          <div className="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-sm">
            <span className="truncate selection:bg-amber-500 selection:text-slate-950">{PIX_KEY}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopy}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shrink-0 text-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copiar PIX
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="text-center pt-2 text-xs text-muted-foreground border-t border-border">
        Deus abençoe seu apoio à transparência pública e ao voto consciente no Brasil.
      </div>
    </DialogContent>
  );

  if (children) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        {modalBody}
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {modalBody}
    </Dialog>
  );
}
