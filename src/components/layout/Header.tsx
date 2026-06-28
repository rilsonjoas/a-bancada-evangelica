import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, BarChart3, Vote, Network, BookMarked, Info, Mail, Search, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Ranking',     href: '/ranking',    icon: BookOpen },
  { name: 'Comparação',  href: '/comparacao', icon: BarChart3 },
  { name: 'Votações',    href: '/votacoes',   icon: Vote },
  { name: 'Grupos ML',   href: '/grupos',     icon: Network },
  { name: 'Metodologia', href: '/metodologia', icon: BookMarked },
  { name: 'Sobre',       href: '/sobre',      icon: Info },
  { name: 'Contato',     href: '/contato',    icon: Mail },
];

const Header = () => {
  const location = useLocation();

  const isActive = (href: string) =>
    href === '/ranking'
      ? location.pathname === '/' || location.pathname === '/ranking'
      : location.pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center gap-6">

          {/* Brand */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
            <div className="bg-gradient-primary p-1.5 rounded-lg shadow-card group-hover:shadow-elevated transition-shadow">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="font-serif text-base font-bold text-foreground leading-none">A Bancada Evangélica</p>
              <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase mt-0.5">
                Transparência Parlamentar
              </p>
            </div>
          </Link>

          {/* Desktop nav — texto apenas, sem ícones */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
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

          {/* Search — desktop */}
          <div className="hidden md:flex items-center ml-auto">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline text-sm">Buscar</span>
            </Button>
          </div>

          {/* Mobile: hamburger placeholder */}
          <div className="md:hidden ml-auto">
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile nav — ícone + label */}
        <nav className="md:hidden border-t border-border py-2">
          <div className="flex items-center justify-around overflow-x-auto gap-1">
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
