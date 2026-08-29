import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RankingPage from "./pages/Ranking";
import SobrePage from "./pages/Sobre";
import MetodologiaPage from "./pages/Metodologia";
import ContatoPage from "./pages/Contato";
import { PoliticianProfile } from "./pages/PoliticianProfile";
import { PoliticianComparison } from "./pages/PoliticianComparison";
import VotingClusters from "./pages/VotingClusters";
import { VotingAnalysis } from "./pages/VotingAnalysis";
import NotFound from "./pages/NotFound";
import Privacidade from "./pages/Privacidade";
import Termos from "./pages/Termos";
import { Analytics } from "@/components/Analytics";
import { DadosAbertos } from "./pages/DadosAbertos";
import Errata from "./pages/Errata";
import NewsCuration from "./pages/NewsCuration";

/** Rola pro topo a cada navegação — sem isso o SPA mantém a altura da
 * página anterior e o usuário "cai" no meio da página seguinte. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Analytics />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col">
          {/* Skip-link (A11Y-AUDIT.md item 2): primeiro elemento focável —
              aparece ao Tab, some ao clicar/blur. Alvo: main#conteudo. */}
          <a
            href="#conteudo"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:font-medium"
          >
            Pular para o conteúdo principal
          </a>
          <Header />
          <main id="conteudo" tabIndex={-1} className="flex-1">
            <Routes>
              <Route path="/" element={<RankingPage />} />
              <Route path="/ranking" element={<RankingPage />} />
              <Route path="/politicos/:id" element={<PoliticianProfile />} />
              <Route path="/comparacao" element={<PoliticianComparison />} />
              <Route path="/grupos" element={<VotingClusters />} />
              <Route path="/votacoes" element={<VotingAnalysis />} />
              <Route path="/sobre" element={<SobrePage />} />
              <Route path="/metodologia" element={<MetodologiaPage />} />
              <Route path="/dados" element={<DadosAbertos />} />
              <Route path="/errata" element={<Errata />} />
              <Route path="/admin/noticias" element={<NewsCuration />} />
              <Route path="/contato" element={<ContatoPage />} />
              <Route path="/privacidade" element={<Privacidade />} />
              <Route path="/termos" element={<Termos />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
      {/* React Query Devtools - only in development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
