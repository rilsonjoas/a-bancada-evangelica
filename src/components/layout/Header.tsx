import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { BookOpen, BarChart3, Vote, Network, BookMarked, Info, Mail, Search, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Ranking',     href: '/ranking',    icon: BookOpen },
  { name: 'Comparação',  href: '/comparacao', icon: BarChart3 },
  { name: 'Votações',    href: '/votacoes',   icon: Vote },
  { name: 'Grupos',      href: '/grupos',     icon: Network },
  { name: 'Metodologia', href: '/metodologia', icon: BookMarked },
  { name: 'Sobre',       href: '/sobre',      icon: Info },
  { name: 'Contato',     href: '/contato',    icon: Mail },
];

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isActive = (href: string) =>
    href === '/ranking'
      ? location.pathname === '/' || location.pathname === '/ranking'
      : location.pathname.startsWith(href);

  // A busca da navbar leva pro ranking com o termo na URL — o Ranking
  // lê ?search= no estado inicial e o usuário já cai na lista filtrada.
  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    navigate(`/ranking?search=${encodeURIComponent(q)}`);
    setSearchTerm('');
    setSearchOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center gap-6">

          {/* Brand */}
          <Link to="/" aria-label="A Bancada Evangélica — página inicial" className="flex shrink-0 items-center gap-2.5 group">
            <div className="bg-gradient-primary p-1.5 rounded-lg shadow-card group-hover:shadow-elevated transition-shadow">
              {/* Marca unificada (2026-08-22): favicon.svg branco em vez do ícone lucide genérico */}
              <img src="/marca-white.png" alt="" aria-hidden="true" className="h-5 w-5" />
            </div>
            <div className="leading-tight block min-w-0">
              <p className="font-serif text-[15px] sm:text-base font-bold text-foreground leading-none truncate">A Bancada Evangélica</p>
              <p className="text-[9px] sm:text-[10px] font-medium tracking-widest text-muted-foreground uppercase mt-0.5 truncate hidden sm:block">
                Transparência Parlamentar
              </p>
            </div>
          </Link>

          {/* Desktop nav — texto apenas, sem ícones */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {navigation.map(item => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search — desktop: abre input inline */}
          <div className="hidden md:flex items-center ml-auto gap-2">
            {searchOpen ? (
              <form onSubmit={submitSearch} className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar parlamentar..."
                  className="h-8 w-48 lg:w-56"
                  aria-label="Buscar parlamentar"
                />
                <Button type="submit" size="sm" variant="ghost" aria-label="Confirmar busca">
                  <Search className="h-4 w-4" />
                </Button>
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

          {/* Mobile: hamburger funcional (Sheet com navegação + busca) */}
          <div className="lg:hidden ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label={searchOpen ? 'Fechar busca' : 'Abrir busca'}
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
                    placeholder="Buscar parlamentar..."
                    aria-label="Buscar parlamentar"
                  />
                  <Button type="submit" size="icon" variant="secondary" aria-label="Buscar">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
                <nav className="flex flex-col gap-1">
                  {navigation.map(item => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive(item.href)
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Busca mobile aberta */}
        {searchOpen && (
          <form onSubmit={submitSearch} className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou partido..."
                className="pl-10"
                aria-label="Buscar por nome ou partido"
              />
            </div>
          </form>
        )}

        {/* Mobile nav horizontal — só em telas ≥sm (entre mobile puro e lg),
            onde cabe; abaixo disso o hamburger resolve */}
        <nav className="hidden sm:flex lg:hidden border-t border-border py-2">
          <div className="flex items-center justify-around overflow-x-auto gap-1 w-full">
            {navigation.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors shrink-0',
                    isActive(item.href)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
