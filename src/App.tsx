import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RankingPage from "./pages/Ranking";
import SobrePage from "./pages/Sobre";
import MetodologiaPage from "./pages/Metodologia";
import ContatoPage from "./pages/Contato";
import { PoliticianProfile } from "./pages/PoliticianProfile";
import { PoliticianComparison } from "./pages/PoliticianComparison";
import NotFound from "./pages/NotFound";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<RankingPage />} />
              <Route path="/ranking" element={<RankingPage />} />
              <Route path="/politicos/:id" element={<PoliticianProfile />} />
              <Route path="/comparacao" element={<PoliticianComparison />} />
              <Route path="/sobre" element={<SobrePage />} />
              <Route path="/metodologia" element={<MetodologiaPage />} />
              <Route path="/contato" element={<ContatoPage />} />
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
