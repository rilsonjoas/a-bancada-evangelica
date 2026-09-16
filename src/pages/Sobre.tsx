import { usePageMeta } from '@/hooks/usePageMeta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Target, Eye, Shield, Database, Code2, Brain, Github, ExternalLink, Heart } from 'lucide-react';
import { DonationModal } from '@/components/common/DonationModal';
import { Link } from 'react-router-dom';
import { usePoliticiansStats } from '@/hooks/usePoliticians';
import { useVotingAnalysisData } from '@/hooks/useVotingAnalysisData';
import { useClusterData, usePartyAlignment } from '@/hooks/useClusterData';

const SobrePage = () => {
  usePageMeta("Sobre o Projeto | A Bancada Evangélica", "Saiba mais sobre nossa missão, metodologia de cálculo e transparência de dados abertos.");

  // Números vivos da API — antes eram hardcode ("1.679+", "5") que já
  // divergia do README e da página de Votações. Mesma fonte pra todo o site.
  const { data: statsData } = usePoliticiansStats();
  const { data: votingData } = useVotingAnalysisData({});
  const { data: clusterData } = useClusterData();
  const { data: partyAlignment } = usePartyAlignment();

  const fmt = (n: number | undefined) => (n ?? 0).toLocaleString('pt-BR');

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero */}
      <section className="bg-gradient-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <img src="/marca-white.png" alt="" aria-hidden="true" className="h-12 w-12" />
              </div>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-white">
              Sobre o Projeto
            </h1>
            <p className="text-xl text-primary-foreground/90 leading-relaxed">
              Parlamentares brasileiros avaliados por critérios objetivos 
              de valores cristãos — com filtro opcional para a 
              Frente Parlamentar Evangélica.
            </p>
          </div>
        </div>
      </section>

      {/* Missão / Visão / Valores */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <Card className="card-elevated text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-accent p-3 rounded-lg">
                    <Target className="h-6 w-6 text-accent-foreground" />
                  </div>
                </div>
                <CardTitle className="font-serif text-lg font-bold">Missão</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Fornecer ao cidadão dados transparentes e verificáveis
                  sobre como os parlamentares brasileiros se posicionam em pautas
                  que afetam a família, a vida e a liberdade religiosa.
                </p>
              </CardContent>
            </Card>

            <Card className="card-elevated text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-accent p-3 rounded-lg">
                    <Eye className="h-6 w-6 text-accent-foreground" />
                  </div>
                </div>
                <CardTitle className="font-serif text-lg font-bold">Escopo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Todos os parlamentares são avaliados — com filtro opcional para a <strong className="text-foreground">Frente Parlamentar Evangélica (FPE)</strong>,
                  o grupo formal de deputados que se identificam publicamente com a fé
                  cristã evangélica.
                </p>
              </CardContent>
            </Card>

            <Card className="card-elevated text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-accent p-3 rounded-lg">
                    <Shield className="h-6 w-6 text-accent-foreground" />
                  </div>
                </div>
                <CardTitle className="font-serif text-lg font-bold">Princípio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Dados públicos, metodologia aberta e código-fonte disponível.
                  Não há financiamento partidário. Os dados vêm diretamente das
                  APIs oficiais da Câmara dos Deputados.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Perguntas fundamentais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground mb-6">
                FPE como filtro, não como limite
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Todos os parlamentares brasileiros são avaliados pelos mesmos 5 critérios
                  objetivos — independentemente de partido, crença ou região. A plataforma
                  aplica a mesma régua para qualquer deputado ou senador.
                </p>
                <p>
                  O filtro da <strong className="text-foreground">Frente Parlamentar Evangélica (FPE)</strong> está disponível
                  como opção para quem quer focar nos parlamentares que se identificam
                  publicamente com a fé cristã evangélica e aceitaram ser avaliados
                  por esses valores.
                </p>
                <p>
                  Assim, a plataforma serve tanto para accountability interno do movimento
                  quanto para qualquer cidadão que queira entender o posicionamento dos
                  seus representantes sob essa perspectiva.
                </p>
              </div>
            </div>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Estado atual dos dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'Parlamentares com notas', value: fmt(statsData?.totalPoliticians), note: 'Câmara e Senado, mandatos ativos' },
                    { label: 'Votos reais registrados', value: fmt(votingData?.totalVotes), note: 'Votações nominais do Plenário' },
                    { label: 'Pautas monitoradas', value: fmt(votingData?.totalAgendas), note: 'Classificadas nos 5 critérios' },
                    { label: 'Partidos no ranking', value: partyAlignment ? String(partyAlignment.total_parties ?? 0) : '—', note: 'Mediana ≥ 3 parlamentares ativos' },
                    { label: 'Grupos de votação', value: clusterData ? fmt(clusterData.clusters?.length) : '—', note: clusterData ? `KMeans · silhueta ${clusterData.silhouette?.toFixed(2) ?? 'n/d'}` : 'Serviço ML indisponível' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.note}</p>
                      </div>
                      <Badge variant="secondary" className="font-mono text-sm">{item.value}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stack técnica */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Code2 className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-widest">Tecnologia</span>
            </div>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
              Arquitetura do Projeto
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tecnologia moderna com implantação em produção, dados reais e análise por aprendizado de máquina.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Code2 className="h-6 w-6" />,
                title: 'Frontend',
                items: ['React 18 + TypeScript', 'Vite + Tailwind CSS', 'shadcn/ui + Recharts', 'TanStack Query', 'Implantação: Vercel'],
              },
              {
                icon: <Database className="h-6 w-6" />,
                title: 'API + Banco',
                items: ['NestJS 11 + Prisma ORM', 'PostgreSQL (VPS)', 'Implantação: Docker + Traefik (Hetzner)', 'Sincronização automática em segundo plano', 'APIs da Câmara V2'],
              },
              {
                icon: <Brain className="h-6 w-6" />,
                title: 'Análise ML',
                items: ['Python 3.12 + FastAPI', 'scikit-learn KMeans', 'PCA + StandardScaler', 'Índice de silhueta', 'Serviço dedicado'],
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: 'Dados',
                items: ['API Câmara V2 (REST)', 'Sincronização automática', 'Cálculo de notas determinístico', 'Metodologia auditável', 'Código aberto (MIT)'],
              },
            ].map(col => (
              <Card key={col.title} className="card-elevated">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-primary">{col.icon}</div>
                    <CardTitle className="font-serif text-lg font-bold">{col.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {col.items.map(item => (
                      <li key={item} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Critérios */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-8 text-center">
            Critérios de Avaliação
          </h2>
          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[
                  { pct: '30%', title: 'Proteção à Vida', desc: 'Votações sobre aborto, eutanásia, proteção ao nascituro' },
                  { pct: '25%', title: 'Valores Familiares', desc: 'Conceito de família, casamento, adoção, proteção à infância' },
                  { pct: '20%', title: 'Integridade Moral', desc: 'Despesas fora do padrão estatístico + votações sobre corrupção/improbidade' },
                  { pct: '15%', title: 'Responsabilidade Social', desc: 'Assistência social, saúde pública, populações vulneráveis' },
                  { pct: '10%', title: 'Liberdade Religiosa', desc: 'Liberdade de culto, expressão religiosa, combate à intolerância' },
                ].map(c => (
                  <div key={c.title} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <Badge variant="secondary" className="text-xs font-mono mt-0.5 flex-shrink-0">{c.pct}</Badge>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{c.title}</p>
                      <p className="text-sm text-muted-foreground">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border text-center">
                <Link to="/metodologia">
                  <Button variant="outline" size="sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Ver metodologia completa
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <Card className="card-elevated max-w-4xl mx-auto">
            <CardContent className="py-10 text-center">
              <Github className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
                Código aberto e auditável
              </h2>
              <p className="text-muted-foreground mb-6">
                Todo o código-fonte, scripts de sincronização e a metodologia de cálculo de notas
                estão disponíveis no GitHub. Qualquer pessoa pode verificar, reproduzir
                ou contribuir.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="https://github.com/rilsonjoas/a-bancada-evangelica"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg">
                    <Github className="h-4 w-4 mr-2" />
                    Ver no GitHub
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </a>
                <Link to="/metodologia">
                  <Button variant="outline" size="lg">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Metodologia
                  </Button>
                </Link>
                <DonationModal>
                  <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-medium">
                    <Heart className="h-4 w-4 mr-2 fill-current" />
                    Apoiar o Projeto (PIX)
                  </Button>
                </DonationModal>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default SobrePage;
