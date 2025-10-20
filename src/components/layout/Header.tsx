import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Mail, Search, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const Header = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Ranking', href: '/ranking', icon: BookOpen },
    { name: 'Comparação', href: '/comparacao', icon: BarChart3 },
    { name: 'Metodologia', href: '/metodologia', icon: BookOpen },
    { name: 'Sobre', href: '/sobre', icon: Users },
    { name: 'Contato', href: '/contato', icon: Mail }
  ];

  const isActive = (href: string) => {
    if (href === '/ranking') {
      return location.pathname === '/' || location.pathname === '/ranking';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header className="bg-nav-background border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-background/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-gradient-primary p-2 rounded-lg shadow-card group-hover:shadow-elevated transition-all duration-300">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-serif text-xl font-bold text-foreground">
                A Bancada Evangélica
              </h1>
              <p className="text-xs text-muted-foreground">
                TRANSPARÊNCIA PARLAMENTAR
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "nav-link flex items-center space-x-2 font-medium text-sm",
                    isActive(item.href) && "nav-link-active"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Search Button - Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Search className="h-4 w-4" />
              <span className="ml-2 hidden lg:inline">Buscar</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-border py-3">
          <div className="flex justify-around">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center space-y-1 px-2 py-1 rounded-lg transition-colors",
                    isActive(item.href) 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{item.name}</span>
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