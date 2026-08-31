import React from "react";
import { Link } from "react-router-dom";
import { Mail, Github, ExternalLink, ShieldCheck, Database, FileText, Heart } from "lucide-react";
import { DonationModal } from "@/components/common/DonationModal";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20 font-sans">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12">
          
          {/* Brand & Mission — 4 cols */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-tr from-amber-500 to-blue-600 p-2 rounded-xl shadow-md">
                <img src="/marca-white.png" alt="" aria-hidden="true" className="h-6 w-6" />
              </div>
              <div>
                <p className="font-serif text-lg font-bold text-white tracking-tight">
                  A Bancada Evangélica
                </p>
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  TRANSPARÊNCIA PARLAMENTAR
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Monitorando o posicionamento dos parlamentares brasileiros através de dados públicos e votos nominais registrados na Câmara e no Senado.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href="mailto:abancada@narniano.com"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors border border-slate-700/60"
                title="Contato por Email"
              >
                <Mail className="h-3.5 w-3.5 text-amber-400" />
                <span>Contato</span>
              </a>
              <a
                href="https://github.com/rilsonjoas/a-bancada-evangelica"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors border border-slate-700/60"
                title="Código-fonte no GitHub"
              >
                <Github className="h-3.5 w-3.5 text-amber-400" />
                <span>GitHub</span>
              </a>
              <DonationModal>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-xs text-red-200 transition-colors border border-red-800/60 font-medium"
                >
                  <Heart className="h-3.5 w-3.5 text-red-400 fill-current" />
                  <span>Apoie este projeto</span>
                </button>
              </DonationModal>
            </div>
          </div>

          {/* Col 2: Plataforma — 2 cols */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Plataforma</span>
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="text-slate-300 hover:text-white transition-colors">
                  Ranking de Parlamentares
                </Link>
              </li>
              <li>
                <Link to="/match" className="text-slate-300 hover:text-white transition-colors">
                  Match Eleitor (Quiz)
                </Link>
              </li>
              <li>
                <Link to="/comparacao" className="text-slate-300 hover:text-white transition-colors">
                  Comparador de Votações
                </Link>
              </li>
              <li>
                <Link to="/temas" className="text-slate-300 hover:text-white transition-colors">
                  Votações por Tema
                </Link>
              </li>
              <li>
                <Link to="/grupos" className="text-slate-300 hover:text-white transition-colors">
                  Grupos de Votação (KMeans)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Metodologia & Transparência — 2 cols */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Transparência</span>
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/metodologia" className="text-slate-300 hover:text-white transition-colors">
                  Metodologia
                </Link>
              </li>
              <li>
                <Link to="/dados" className="text-slate-300 hover:text-white transition-colors">
                  Dados Abertos (API)
                </Link>
              </li>
              <li>
                <Link to="/errata" className="text-slate-300 hover:text-white transition-colors">
                  Errata Pública
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-slate-300 hover:text-white transition-colors">
                  Sobre o Projeto
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-slate-300 hover:text-white transition-colors">
                  Fale Conosco
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Fontes & Legal — 3 cols */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>Fontes Oficiais</span>
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://www.camara.leg.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  Câmara dos Deputados <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www12.senado.leg.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  Senado Federal <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://divulgacandcontas.tse.jus.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  TSE Receitas <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
            </ul>

            <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
              <Link to="/privacidade" className="hover:text-amber-400 transition-colors">
                Privacidade
              </Link>
              <span>·</span>
              <Link to="/termos" className="hover:text-amber-400 transition-colors">
                Termos de Uso
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© {currentYear} A Bancada Evangélica. Projeto independente de transparência pública.</p>
          <p className="text-[11px]">Licenciado sob MIT · Dados públicos abertos.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
