import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BookOpen, BarChart3, Vote, Network, BookMarked, Info, Mail, Search, Menu, UserCircle2, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePoliticians } from "@/hooks/usePoliticians";
import { matchThemes } from "@/lib/themes";

const navigation = [
  { name: "Ranking",     href: "/ranking",    icon: BookOpen },
  { name: "Comparação",  href: "/comparacao", icon: BarChart3 },
  { name: "Votações",    href: "/votacoes",   icon: Vote },
  // /temas estava só no rodapé —combined com a busca que só olhava nome de
  // parlamentar, os temas eram inalcançáveis de dentro do site (achado real
  // 2026-09-25, a partir de comentário de usuário dizendo que "educação e
  // meio ambiente não existem aqui").
  { name: "Temas",       href: "/temas",      icon: LayoutGrid },
  { name: "Grupos",      href: "/grupos",     icon: Network },
  { name: "Metodologia", href: "/metodologia", icon: BookMarked },
  { name: "Sobre",       href: "/sobre",      icon: Info },
  { name: "Contato",     href: "/contato",    icon: Mail },
];

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const isActive = (href: string) =>
    href === "/ranking"
      ? location.pathname === "/" || location.pathname === "/ranking"
      : location.pathname.startsWith(href);

  // Autocomplete ao vivo na navbar
  const querySearch = searchTerm.trim().length >= 2 ? searchTerm.trim() : undefined;
  const { data: searchData } = usePoliticians({
    search: querySearch,
    limit: 5,
  });

  // Temas também são buscáveis: a busca só olhava nome de parlamentar, então
  // "meio ambiente" não retornava nada apesar de a página existir.
  const themeResults = matchThemes(searchTerm);
  const searchResults = searchData?.politicians ?? [];

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    navigate(`/ranking?search=${encodeURIComponent(q)}#ranking-completo`);
    setSearchTerm("");
    setSearchOpen(false);
    setMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById("ranking-completo");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center gap-6">
          {/* Brand */}
          <Link to="/" aria-label="A Bancada Evangélica — página inicial" className="flex shrink-0 items-center gap-2.5 group">
            <div className="bg-gradient-primary p-1.5 rounded-lg shadow-card group-hover:shadow-elevated transition-shadow">
              <img src="/marca-white.png" alt="" aria-hidden="true" className="h-5 w-5" />
            </div>
            <div className="leading-tight block min-w-0">
              <p className="font-serif text-[15px] sm:text-base font-bold text-foreground leading-none truncate">A Bancada Evangélica</p>
              <p className="text-[9px] sm:text-[10px] font-medium tracking-widest text-muted-foreground uppercase mt-0.5 truncate hidden sm:block">
                Transparência Parlamentar
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search — desktop */}
          <div className="hidden md:flex items-center ml-auto gap-2 relative">
            {searchOpen ? (
              <form onSubmit={submitSearch} className="flex items-center gap-2 relative">
                <Input
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar parlamentar ou tema..."
                  className="h-9 w-56 lg:w-64"
                  aria-label="Buscar parlamentar ou tema"
                />
                <Button type="submit" size="sm" variant="ghost" aria-label="Confirmar busca">
                  <Search className="h-4 w-4" />
                </Button>

                {/* Autocomplete Dropdown ao vivo */}
                {searchTerm.trim().length >= 2 && (
                  <div className="absolute top-full right-0 mt-2 w-72 lg:w-80 bg-popover border border-border shadow-2xl rounded-xl overflow-hidden z-50 p-2 space-y-1">
                    <div className="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider border-b border-border/50 pb-1 mb-1">
                      Sugestões de busca
                    </div>
                    {searchResults.length === 0 && themeResults.length === 0 ? (
                      <div className="text-xs text-muted-foreground p-3 text-center">
                        Nada encontrado para "{searchTerm}" — nem parlamentar nem tema
                      </div>
                    ) : (
                      <>
                        {searchResults.map((p) => (
                          <Link
                            key={p.id}
                            to={`/politicos/${p.id}`}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchTerm("");
                            }}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                          >
                            {p.photoUrl ? (
                              <img
                                src={p.photoUrl}
                                alt={p.name}
                                className="w-8 h-8 rounded-full object-cover bg-secondary flex-shrink-0"
                              />
                            ) : (
                              <UserCircle2 className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{p.currentParty} · {p.currentState}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs font-bold shrink-0">
                              {p.scores.overall.toFixed(0)}
                            </Badge>
                          </Link>
                        ))}

                        {themeResults.length > 0 && (
                          <>
                            <div className="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider border-b border-border/50 pb-1 mb-1">
                              Temas
                            </div>
                            {themeResults.map((t) => (
                              <Link
                                key={t.slug}
                                to={`/temas/${t.slug}`}
                                onClick={() => {
                                  setSearchOpen(false);
                                  setSearchTerm("");
                                }}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                              >
                                <t.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-foreground truncate">{t.label}</p>
                                  <p className="text-[11px] text-muted-foreground truncate">{t.tagline}</p>
                                </div>
                              </Link>
                            ))}
                          </>
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => submitSearch()}
                      className="w-full text-center text-xs font-semibold text-primary hover:underline py-2 border-t border-border mt-1 block"
                    >
                      Ver todos os resultados no ranking →
                    </button>
                  </div>
                )}
              </form>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => setSearchOpen(true)}
                aria-label="Abrir busca"
              >
                <Search className="h-4 w-4" />
                <span className="hidden lg:inline text-sm">Buscar</span>
              </Button>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="lg:hidden ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label={searchOpen ? "Fechar busca" : "Abrir busca"}
            >
              <Search className="h-5 w-5" />
            </Button>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Abrir menu de navegação">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] px-4">
                <SheetHeader className="px-1">
                  <SheetTitle className="font-serif text-left">A Bancada Evangélica</SheetTitle>
                </SheetHeader>
                <form onSubmit={submitSearch} className="flex items-center gap-2 mt-2 mb-4">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar..."
                    className="h-9"
                    aria-label="Buscar parlamentar ou tema no menu"
                  />
                  <Button type="submit" size="sm" aria-label="Confirmar busca">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>

                <nav className="flex flex-col gap-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
