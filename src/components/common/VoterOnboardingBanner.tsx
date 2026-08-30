import React, { useState, useEffect } from "react";
import { Sparkles, MapPin, Search, CheckCircle2, X, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const VoterOnboardingBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      return localStorage.getItem("bancada-onboarding-dismissed") !== "true";
    } catch {
      return true;
    }
  });

  const dismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem("bancada-onboarding-dismissed", "true");
    } catch {
      /* storage indisponível */
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white border-b border-blue-800/50 shadow-md relative overflow-hidden py-5">
      <div className="container mx-auto px-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 max-w-4xl">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Guia Prático para o Eleitor</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold mb-2">
              Como funciona A Bancada Evangélica?
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4 max-w-3xl">
              Nossa missão é trazer transparência total aos votos nominais gravados no Congresso Nacional.
              Aqui você avalia fatos e dados oficiais — sem enquete, sem declaração e sem julgamento de fé.
            </p>

            {/* 3 Didactic Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" /> Busque pelo seu Estado
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                    Filtre os deputados e senadores da sua região para acompanhar como votaram.
                  </p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Faça o teste de 5 perguntas
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                    Descubra instantaneamente quais parlamentares mais votam de acordo com a sua visão.
                  </p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Analise a Nota Geral (0–100)
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                    Veja os pontos em Proteção à Vida, Família, Moral, Social e Liberdade Religiosa.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Link to="/match">
                <Button size="sm" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs">
                  Fazer teste de afinidade agora <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
              <Link to="/metodologia" className="text-xs text-amber-300 hover:underline font-semibold flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Ler detalhes da Metodologia
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Entendi, fechar aviso"
            aria-label="Fechar guia didático"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
