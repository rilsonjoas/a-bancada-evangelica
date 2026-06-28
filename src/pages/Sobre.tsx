import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Target, Eye, Shield, Database, Code2, Brain, Github, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const SobrePage = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero */}
      <section className="bg-gradient-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-white">
              Sobre o Projeto
            </h1>
            <p className="text-xl text-primary-foreground/90 leading-relaxed">
              Monitorando se os membros da Frente Parlamentar Evangélica
              votam em consonância com os valores que declaram representar.
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
                <CardTitle className="font-serif text-xl">Missão</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Fornecer ao eleitor cristão dados transparentes e verificáveis
                  sobre como os parlamentares evangélicos votam nas pautas que afetam
                  a família, a vida e a liberdade religiosa.
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
                <CardTitle className="font-serif text-xl">Escopo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  O foco é a <strong className="text-foreground">Frente Parlamentar Evangélica (FPE)</strong> —
                  o grupo formal de deputados que se identificam publicamente com a fé
                  cristã evangélica e, por isso, aceitam ser avaliados pelos seus valores.
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
                <CardTitle className="font-serif text-xl">Princípio</CardTitle>
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
                Por que só a FPE?
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Avaliar todos os 513 deputados por critérios cristãos seria injusto e sem sentido:
                  um deputado do PSOL ou do PT nunca se apresentou como representante
                  evangélico — não há contrato implícito.
                </p>
                <p>
                  A lógica é diferente para quem integra a FPE.
                  Ao fazer parte do grupo, o parlamentar afirma publicamente que representa
                  a fé cristã evangélica. A plataforma apenas verifica se os votos confirmam
                  essa declaração.
                </p>
                <p>
                  É accountability interno do movimento — não um julgamento externo.
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
                    { label: 'Deputados com scores', value: '514', note: 'Câmara, 57ª legislatura' },
                    { label: 'Votos reais registrados', value: '1.679+', note: 'De 5 pautas do Plenário' },
                    { label: 'Pautas monitoradas', value: '5', note: 'PLEN com votos individuais' },
                    { label: 'Partidos no ranking', value: '19+', note: 'Com ≥ 3 deputados ativos' },
                    { label: 'Clusters de votação (ML)', value: '2', note: 'KMeans · silhouette 0.27' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.note}</p>
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
              Stack moderna com deploy em produção, dados reais e análise ML.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Code2 className="h-6 w-6" />,
                title: 'Frontend',
                items: ['React 18 + TypeScript', 'Vite + Tailwind CSS', 'shadcn/ui + Recharts', 'TanStack Query', 'Deploy: Vercel'],
              },
              {
                icon: <Database className="h-6 w-6" />,
                title: 'API + Banco',
                items: ['Express 5 + Prisma ORM', 'PostgreSQL (Neon)', 'Deploy: Railway', 'Scripts de sync tsx', 'APIs da Câmara V2'],
              },
              {
                icon: <Brain className="h-6 w-6" />,
                title: 'Análise ML',
                items: ['Python 3.12 + FastAPI', 'scikit-learn KMeans', 'PCA + StandardScaler', 'Silhouette score', 'Deploy: Railway'],
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: 'Dados',
                items: ['API Câmara V2 (REST)', 'Sincronização automática', 'Scoring determinístico', 'Metodologia auditável', 'Código aberto (MIT)'],
              },
            ].map(col => (
              <Card key={col.title} className="card-elevated">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-primary">{col.icon}</div>
                    <CardTitle className="font-serif text-lg">{col.title}</CardTitle>
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
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-8 text-center">
            Critérios de Avaliação
          </h2>
          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[
                  { pct: '30%', title: 'Proteção à Vida', desc: 'Votações sobre aborto, eutanásia, pena de morte' },
                  { pct: '25%', title: 'Valores Familiares', desc: 'Conceito de família, adoção, liberdade de educação' },
                  { pct: '20%', title: 'Integridade Moral', desc: 'Despesas parlamentares suspeitas + votações de ética' },
                  { pct: '15%', title: 'Responsabilidade Social', desc: 'Projetos para populações vulneráveis, saúde pública' },
                  { pct: '10%', title: 'Liberdade Religiosa', desc: 'Proteção ao culto, expressão de fé, patrimônio religioso' },
                ].map(c => (
                  <div key={c.title} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <Badge variant="secondary" className="text-xs font-mono mt-0.5 flex-shrink-0">{c.pct}</Badge>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.desc}</p>
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
          <Card className="card-elevated max-w-2xl mx-auto">
            <CardContent className="py-10 text-center">
              <Github className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
                Código aberto e auditável
              </h2>
              <p className="text-muted-foreground mb-6">
                Todo o código-fonte, scripts de sincronização e a metodologia de scoring
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
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default SobrePage;
