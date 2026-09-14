import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RankingPage from "./pages/Ranking";
import SobrePage from "./pages/Sobre";
import MetodologiaPage from "./pages/Metodologia";
import ContatoPage from "./pages/Contato";
import NotFound from "./pages/NotFound";
import Privacidade from "./pages/Privacidade";
import Termos from "./pages/Termos";
import { Analytics } from "@/components/Analytics";

// Code-splitting (2026-09-08): as duas rotas com gráfico mais pesado
// (clustering PCA/KMeans com recharts, radar de comparação) saíam
// bundladas no chunk principal mesmo pra quem nunca visita — build
// mostrava 1,87MB minificado num chunk só. Carregadas só quando
// alguém navega pra /grupos ou /comparacao.
const VotingClusters = lazy(() => import("./pages/VotingClusters"));
const PoliticianComparison = lazy(() =>
  import("./pages/PoliticianComparison").then((m) => ({ default: m.PoliticianComparison }))
);

// Code-splitting (2026-09-14): o chunk principal ainda reclamava 1,78MB.
// As rotas abaixo só são baixadas quando navegadas (perfis de político,
// votação, temas, match e páginas institucionais ficam em chunks próprios).
const PoliticianProfile = lazy(() =>
  import("./pages/PoliticianProfile").then((m) => ({ default: m.PoliticianProfile }))
);
const VotingAnalysis = lazy(() =>
  import("./pages/VotingAnalysis").then((m) => ({ default: m.VotingAnalysis }))
);
const ThemesIndex = lazy(() => import("./pages/ThemesIndex"));
const ThemePage = lazy(() => import("./pages/ThemePage"));
const MatchPage = lazy(() => import("./pages/Match"));
const DadosAbertos = lazy(() =>
  import("./pages/DadosAbertos").then((m) => ({ default: m.DadosAbertos }))
);
const Errata = lazy(() => import("./pages/Errata"));
const NewsCuration = lazy(() => import("./pages/NewsCuration"));

/** Fallback do Suspense pras rotas lazy — mesmo ícone/spinner que o
 * Ranking.tsx já usa em estado de carregamento (Loader2 + animate-spin). */
function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

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
              <Route
                path="/politicos/:id"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <PoliticianProfile />
                  </Suspense>
                }
              />
              <Route
                path="/comparacao"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <PoliticianComparison />
                  </Suspense>
                }
              />
              <Route
                path="/grupos"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <VotingClusters />
                  </Suspense>
                }
              />
              <Route
                path="/votacoes"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <VotingAnalysis />
                  </Suspense>
                }
              />
              <Route
                path="/temas"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <ThemesIndex />
                  </Suspense>
                }
              />
              <Route
                path="/temas/:slug"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <ThemePage />
                  </Suspense>
                }
              />
              <Route
                path="/match"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <MatchPage />
                  </Suspense>
                }
              />
              <Route path="/sobre" element={<SobrePage />} />
              <Route path="/metodologia" element={<MetodologiaPage />} />
              <Route
                path="/dados"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <DadosAbertos />
                  </Suspense>
                }
              />
              <Route
                path="/errata"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Errata />
                  </Suspense>
                }
              />
              <Route
                path="/admin/noticias"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <NewsCuration />
                  </Suspense>
                }
              />
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
