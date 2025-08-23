import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-serif text-6xl font-bold text-primary mb-4">404</h1>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            Página não encontrada
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            A página que você está procurando não existe ou foi movida. 
            Que tal voltar ao ranking de parlamentares?
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/">
            <Button size="lg" className="font-medium">
              <Home className="h-4 w-4 mr-2" />
              Ir para o Ranking
            </Button>
          </Link>
          <div>
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à página anterior
            </Button>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground font-mono italic">
            "Porque eu sei os pensamentos que tenho a vosso respeito" - Jeremias 29:11
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
