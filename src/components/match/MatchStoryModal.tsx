import React, { useRef } from "react";
import { Download, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { AffinityEntry } from "@/lib/match";
import { API_BASE_URL } from "@/lib/apiClient";

interface MatchStoryModalProps {
  entry: AffinityEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MatchStoryModal: React.FC<MatchStoryModalProps> = ({ entry, isOpen, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!entry) return null;
  const { politician, affinity } = entry;
  const proxiedPhotoUrl = `${API_BASE_URL}/api/politicians/${politician.id}/photo`;

  const downloadStory = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#090d16",
        scale: 3,
        useCORS: true,
        allowTaint: true,
      });

      const link = document.createElement("a");
      link.download = `match_${politician.name.replace(/\s+/g, "_")}_story.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Card de Story baixado com sucesso!");
    } catch {
      toast.error("Erro ao gerar imagem para o Story.");
    }
  };

  const shareStory = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#090d16",
        scale: 3,
        useCORS: true,
        allowTaint: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], `match_${politician.name}_story.png`, { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Meu Match: ${politician.name}`,
              text: `Confira quem mais vota como eu na Câmara e no Senado: ${politician.name} (${affinity.toFixed(0)}% de afinidade)!`,
              files: [file],
            });
            return;
          }
        }
        downloadStory();
      });
    } catch {
      downloadStory();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 bg-slate-950 border-slate-800 text-white">
        <DialogHeader className="pb-2 border-b border-slate-800">
          <DialogTitle className="text-lg font-serif font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Card em Formato de Story (9:16)
          </DialogTitle>
        </DialogHeader>

        {/* Visual Preview Container — Totalmente quadrado sem bordas arredondadas */}
        <div className="flex justify-center py-2">
          <div
            ref={cardRef}
            className="w-[320px] h-[568px] bg-slate-950 p-6 border border-slate-800 shadow-2xl flex flex-col justify-between text-white relative overflow-hidden select-none rounded-none"
          >
            {/* Header Brand */}
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2">
                <img src="/marca-white.png" alt="" className="h-6 w-6" />
                <span className="font-serif text-sm font-bold tracking-tight text-white">A Bancada Evangélica</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-none border border-amber-400/20">
                MATCH 2026
              </span>
            </div>

            {/* Main Content */}
            <div className="my-auto text-center flex flex-col items-center py-2 space-y-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                QUEM VOTA COMO VOCÊ?
              </span>

              {/* Photo Frame */}
              <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-amber-400 to-blue-500 shadow-xl my-1">
                <img
                  src={proxiedPhotoUrl}
                  alt={politician.name}
                  className="w-full h-full rounded-full object-cover bg-slate-900 border-2 border-slate-950"
                  onError={(e) => {
                    if (politician.photoUrl) (e.currentTarget as HTMLImageElement).src = politician.photoUrl;
                  }}
                />
              </div>

              {/* Politician Info */}
              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-bold text-white leading-tight">
                  {politician.name}
                </h3>
                <p className="text-xs text-slate-300 font-medium tracking-wide uppercase">
                  {politician.currentParty} · {politician.currentState}
                </p>
              </div>

              {/* Affinity Badge */}
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold px-5 py-2 rounded-full shadow-lg text-base flex items-center gap-2 mt-1">
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>{affinity.toFixed(0)}% de Afinidade</span>
              </div>

              <p className="text-[11px] text-slate-400 max-w-[260px] leading-relaxed pt-1">
                Calculado com base nas votações nominais públicas registradas na Câmara e no Senado.
              </p>
            </div>

            {/* Footer Call to Action — Domínio Oficial Correto */}
            <div className="border-t border-white/15 pt-3 text-center space-y-1 bg-slate-900/60 -mx-6 -mb-6 p-4">
              <p className="text-[11px] text-slate-300 font-medium">Descubra quem vota como você:</p>
              <p className="text-xs font-mono text-amber-400 font-bold tracking-wider">a-bancada-evangelica.vercel.app</p>
            </div>
          </div>
        </div>

        {/* Actions — Botões visíveis e de alto contraste */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <Button onClick={downloadStory} className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm">
            <Download className="w-4 h-4 mr-2" />
            Baixar Imagem (Story 9:16)
          </Button>
          <Button onClick={shareStory} className="flex-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-400/40 font-bold text-sm">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
