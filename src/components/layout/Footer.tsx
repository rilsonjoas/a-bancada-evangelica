import { Link } from 'react-router-dom';
import { BookOpen, Mail, Github, ExternalLink } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary/30 border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-primary p-2 rounded-lg shadow-card">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground">
                  A Bancada Evangélica
                </h3>
                <p className="text-xs text-muted-foreground">
                  MONITORANDO A BANCADA EVANGÉLICA
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Monitorando se os membros da Frente Parlamentar Evangélica votam em
              consonância com os valores cristãos que declaram representar.
              Dados públicos, metodologia aberta.
            </p>
            <div className="flex items-center space-x-4">
              <a 
                href="mailto:contato@abancadaevangelica.org.br"
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a 
                href="https://github.com/rilsonjoas/a-bancada-evangelica"
                className="text-muted-foreground hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="font-serif font-semibold text-foreground mb-4">Navegação</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Ranking de Parlamentares
                </Link>
              </li>
              <li>
                <Link 
                  to="/metodologia" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Metodologia
                </Link>
              </li>
              <li>
                <Link 
                  to="/sobre" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Sobre o Projeto
                </Link>
              </li>
              <li>
                <Link 
                  to="/contato" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* External Links */}
          <div>
            <h4 className="font-serif font-semibold text-foreground mb-4">Fontes de Dados</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://dadosabertos.camara.leg.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1"
                >
                  <span>Câmara dos Deputados</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://legis.senado.leg.br/dadosabertos/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1"
                >
                  <span>Senado Federal</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.tse.jus.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1"
                >
                  <span>TSE</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://portaldatransparencia.gov.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1"
                >
                  <span>Portal da Transparência</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                © {currentYear} A Bancada Evangélica. Projeto independente de transparência democrática.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Licenciado sob MIT. 
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;