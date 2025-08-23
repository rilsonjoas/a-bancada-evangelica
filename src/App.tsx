import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RankingPage from "./pages/Ranking";
import SobrePage from "./pages/Sobre";
import MetodologiaPage from "./pages/Metodologia";
import ContatoPage from "./pages/Contato";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
              <Route path="/politicos/:id" element={<NotFound />} /> {/* Placeholder - página de perfil será implementada */}
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
