import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Calculator, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  ExternalLink, 
  Download,
  Shield,
  Heart,
  Scale,
  Home,
  Users,
  Cross,
  Zap
} from 'lucide-react';

const MetodologiaPage = () => {
  const pilarsData = [
    {
      key: 'lifeProtection',
      icon: Shield,
      weight: 25,
      name: '🛡️ Proteção à Vida',
      description: 'Analisamos os votos e posicionamentos em projetos de lei sobre aborto, eutanásia, pesquisa com células-tronco embrionárias e outras pautas de bioética. Verificamos também a autoria de proposições que visam proteger a vida em todas as suas fases.',
      whyImportant: 'A Bíblia ensina que a vida é um dom sagrado de Deus e que fomos criados à Sua imagem e semelhança (Gênesis 1:27). Desde o ventre materno, somos conhecidos e formados por Ele (Salmo 139:13-16). Defender a vida, do mais vulnerável ao mais idoso, é um mandamento fundamental da fé.',
      howItHelps: 'Você poderá identificar claramente quais políticos são uma barreira contra a cultura da morte e quais se posicionam ativamente para proteger os nascituros e os indefesos, tratando a vida como inegociável.',
      indicators: [
        'Votações sobre projetos pró-vida',
        'Projetos de lei protegendo a vida',
        'Posicionamentos públicos sobre aborto',
        'Defesa de políticas de adoção'
      ],
      biblicalBasis: 'Gênesis 1:27, Salmo 139:13-16'
    },
    {
      key: 'familyValues',
      icon: Home,
      weight: 20,
      name: '👨‍👩‍👧‍👦 Defesa da Família',
      description: 'Monitoramos votos e discursos relacionados ao conceito de família, casamento, adoção, educação domiciliar (homeschooling) e o direito dos pais na formação moral e educacional dos filhos, combatendo a erotização infantil e a ideologia de gênero nas escolas.',
      whyImportant: 'A família é a primeira e mais fundamental instituição criada por Deus (Gênesis 2:24). É o alicerce da sociedade e o ambiente onde os filhos devem ser instruídos "no caminho em que devem andar" (Provérbios 22:6). Proteger a família é proteger o futuro da nação.',
      howItHelps: 'A plataforma mostra quais parlamentares defendem ativamente o modelo familiar bíblico e a autoridade dos pais, e quais apoiam pautas que buscam redefinir ou enfraquecer essa instituição sagrada.',
      indicators: [
        'Votações sobre definição de família',
        'Defesa da educação domiciliar',
        'Projetos de proteção à infância',
        'Oposição à ideologia de gênero'
      ],
      biblicalBasis: 'Gênesis 2:24, Provérbios 22:6'
    },
    {
      key: 'moralIntegrity',
      icon: Scale,
      weight: 20,
      name: '⚖️ Integridade Moral e Transparência',
      description: 'Este é um critério de caráter. Analisamos o histórico do político, incluindo processos judiciais e investigações por corrupção, improbidade administrativa ou outros crimes. A existência de condenações (trânsito em julgado) gera uma penalidade severa na pontuação. Também monitoramos o uso da cota parlamentar para identificar gastos excessivos ou suspeitos.',
      whyImportant: 'A Palavra de Deus exalta a honestidade e a integridade: "O justo anda na sua integridade; bem-aventurados serão os seus filhos depois dele" (Provérbios 20:7). Um líder cristão deve ser "irrepreensível" (1 Timóteo 3:2) e um bom administrador dos recursos que lhe foram confiados, pois toda autoridade vem de Deus.',
      howItHelps: 'Esta análise ajuda a ir além do "rouba, mas faz". Você poderá avaliar o caráter do político e sua conduta ética, escolhendo representantes que honrem a confiança pública e administrem com retidão, e não para benefício próprio.',
      indicators: [
        'Histórico de investigações',
        'Transparência de gastos públicos',
        'Conduta moral pessoal',
        'Cumprimento de promessas eleitorais'
      ],
      biblicalBasis: 'Provérbios 20:7, 1 Timóteo 3:2'
    },
    {
      key: 'mandateZeal',
      icon: Zap,
      weight: 10,
      name: '🏛️ Zelo e Responsabilidade no Mandato',
      description: 'Medimos a dedicação do parlamentar ao seu trabalho. Isso inclui a frequência e assiduidade nas sessões de votação, a participação ativa em comissões importantes e a transparência na gestão de seu gabinete e de sua agenda pública.',
      whyImportant: 'A Bíblia nos instrui a fazer tudo com excelência, "de todo o coração, como para o Senhor, e não para os homens" (Colossenses 3:23). Um mandato é um serviço, uma mordomia. Espera-se que um representante eleito demonstre zelo, diligência e responsabilidade no cumprimento de suas funções.',
      howItHelps: 'Com estes dados, você pode diferenciar o político que realmente trabalha e honra o seu voto daquele que é ausente e pouco produtivo. É uma medida clara do comprometimento do parlamentar com a função para a qual foi eleito.',
      indicators: [
        'Frequência nas sessões',
        'Participação em comissões',
        'Transparência do gabinete',
        'Gestão da agenda pública'
      ],
      biblicalBasis: 'Colossenses 3:23'
    },
    {
      key: 'legislativeProduction',
      icon: BookOpen,
      weight: 10,
      name: '📜 Produção Legislativa Relevante',
      description: 'Não basta votar certo; é preciso ser proativo. Neste pilar, avaliamos a autoria e a relatoria de projetos de lei que são relevantes para os valores defendidos pela plataforma. Analisamos a qualidade e o impacto das propostas, bem como os discursos e a defesa pública dessas pautas em plenário e na mídia.',
      whyImportant: 'A sabedoria é um atributo essencial para quem governa (Provérbios 8:15-16). Um legislador cristão deve usar seu intelecto e sua influência para propor leis justas, que promovam o bem e restrinjam o mal, refletindo a sabedoria que vem do alto.',
      howItHelps: 'Você poderá identificar os parlamentares que são verdadeiros líderes e protagonistas na defesa das pautas cristãs, e não apenas seguidores. Este critério revela quem tem iniciativa e capacidade de influenciar positivamente a legislação do país.',
      indicators: [
        'Autoria de projetos relevantes',
        'Relatoria em comissões',
        'Discursos em plenário',
        'Defesa pública de pautas'
      ],
      biblicalBasis: 'Provérbios 8:15-16'
    },
    {
      key: 'socialResponsibility',
      icon: Heart,
      weight: 10,
      name: '🤝 Responsabilidade Social',
      description: 'Analisamos o posicionamento em pautas voltadas para a justiça social, o cuidado com os vulneráveis (pobres, órfãos, viúvas, idosos), a dignidade do trabalhador e políticas de combate à pobreza, sempre sob uma ótica de responsabilidade fiscal e sustentabilidade.',
      whyImportant: 'A fé sem obras é morta (Tiago 2:26). A Bíblia está repleta de mandamentos sobre cuidar do necessitado e praticar a justiça (Isaías 1:17, Miquéias 6:8). Uma fé genuína se manifesta em compaixão e ação concreta em favor dos mais fracos da sociedade.',
      howItHelps: 'Permite avaliar se a fé declarada pelo político se traduz em políticas públicas de compaixão e cuidado com o próximo, mostrando se ele possui uma visão integral do Evangelho que inclui a justiça social.',
      indicators: [
        'Apoio a programas sociais',
        'Defesa dos direitos humanos',
        'Políticas para populações vulneráveis',
        'Combate à pobreza e desigualdade'
      ],
      biblicalBasis: 'Tiago 2:26, Isaías 1:17, Miquéias 6:8'
    },
    {
      key: 'religiousFreedom',
      icon: Cross,
      weight: 5,
      name: '✝️ Liberdade Religiosa',
      description: 'Monitoramos a defesa do direito fundamental à liberdade de crença, de culto e de expressão religiosa. Isso inclui votos em leis que possam cercear a pregação do Evangelho, a atuação de igrejas e missionários, o ensino religioso confessional e a objeção de consciência.',
      whyImportant: 'Jesus nos ordenou a "ir por todo o mundo e pregar o evangelho" (Marcos 16:15). A liberdade religiosa é a garantia fundamental que permite à Igreja cumprir sua missão sem a interferência indevida do Estado. É o direito de "dar a Deus o que é de Deus" (Mateus 22:21).',
      howItHelps: 'Você saberá quais políticos estão vigilantes e atuam para proteger o direito constitucional da igreja de existir, de se expressar e de influenciar a sociedade, garantindo que as futuras gerações possam viver e proclamar sua fé livremente.',
      indicators: [
        'Defesa da liberdade de culto',
        'Proteção de símbolos religiosos',
        'Direito de expressão da fé',
        'Combate à perseguição religiosa'
      ],
      biblicalBasis: 'Marcos 16:15, Mateus 22:21'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="bg-gradient-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6 text-white">
              Nossa Metodologia de Avaliação
            </h1>
            <h2 className="text-2xl mb-6 text-white/90">
              Um Guia para o Voto Consciente
            </h2>
            <p className="text-xl text-primary-foreground/90 leading-relaxed">
              A plataforma A Bancada Evangélica não é uma lista de "políticos aprovados", mas sim uma ferramenta de discernimento.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="card-elevated mb-16">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="font-serif text-2xl font-bold text-foreground mb-4">
                    Nossa Missão
                  </h3>
                </div>
                <div className="space-y-6 text-muted-foreground leading-relaxed">
                  <p>
                    Nossa missão é equipar o eleitor cristão com dados objetivos e análises criteriosas para que ele possa, 
                    em oração e com sabedoria, tomar a melhor decisão de acordo com sua consciência e seus princípios de fé.
                  </p>
                  <p>
                    Nossa metodologia foi construída sobre a crença de que a atuação de um parlamentar vai muito além do discurso. 
                    Ela se reflete em votos, na gestão do mandato, na integridade pessoal e na defesa ativa dos valores que professa. 
                    Por isso, avaliamos os políticos através de 7 pilares fundamentais, cada um com um peso específico, 
                    que juntos formam um panorama completo de sua performance.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Methodology Table */}
            <Card className="card-elevated mb-16">
              <CardHeader>
                <CardTitle className="font-serif text-2xl text-center">
                  A Estrutura dos 7 Pilares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">Pilar de Avaliação</th>
                        <th className="text-center py-3 px-4 font-semibold">Peso</th>
                        <th className="text-left py-3 px-4 font-semibold">Foco Principal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pilarsData.map((pilar, index) => (
                        <tr key={pilar.key} className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">{pilar.name}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="secondary">{pilar.weight}%</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {pilar.description.substring(0, 100)}...
                          </td>
                        </tr>
                      ))}
                      <tr className="border-b-2 border-primary bg-primary/5">
                        <td className="py-3 px-4 font-bold">Total</td>
                        <td className="py-3 px-4 text-center font-bold">100%</td>
                        <td className="py-3 px-4 font-bold">Pontuação Geral do Político</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Detailed Criteria */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
                Detalhamento de Cada Critério
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                A seguir, explicamos o que cada pilar significa, por que ele é vital para o cristão 
                e como os dados coletados ajudam você a tomar uma decisão informada.
              </p>
            </div>

            <div className="space-y-12">
              {pilarsData.map((pilar, index) => {
                const IconComponent = pilar.icon;
                return (
                  <Card key={pilar.key} className="card-elevated">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary/10 p-3 rounded-lg">
                            <IconComponent className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="font-serif text-2xl">{pilar.name}</CardTitle>
                            <Badge variant="secondary" className="mt-2">
                              Peso: {pilar.weight}%
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                      <Progress value={pilar.weight} className="h-3" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* O Que Avaliamos */}
                      <div>
                        <h4 className="font-semibold text-foreground mb-3 flex items-center space-x-2">
                          <Calculator className="h-4 w-4" />
                          <span>O Que Avaliamos</span>
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {pilar.description}
                        </p>
                      </div>

                      {/* Por Que é Importante */}
                      <div>
                        <h4 className="font-semibold text-foreground mb-3 flex items-center space-x-2">
                          <Cross className="h-4 w-4" />
                          <span>Por Que é Importante para o Cristão</span>
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {pilar.whyImportant}
                        </p>
                      </div>

                      {/* Como Isso Ajuda */}
                      <div>
                        <h4 className="font-semibold text-foreground mb-3 flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Como Isso Ajuda na Sua Decisão</span>
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {pilar.howItHelps}
                        </p>
                      </div>

                      {/* Grid com indicadores e base bíblica */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                        <div>
                          <h4 className="font-semibold text-foreground mb-3">Indicadores Avaliados</h4>
                          <div className="space-y-2">
                            {pilar.indicators.map((indicator, idx) => (
                              <div key={idx} className="flex items-center space-x-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                <span className="text-muted-foreground">{indicator}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-secondary/30 rounded-lg p-4">
                          <h4 className="font-semibold text-foreground mb-3 flex items-center space-x-2">
                            <BookOpen className="h-4 w-4" />
                            <span>Base Bíblica</span>
                          </h4>
                          <p className="text-sm text-muted-foreground italic">
                            {pilar.biblicalBasis}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
                Transparência e Imparcialidade
              </h2>
              <p className="text-lg text-muted-foreground">
                Nosso compromisso com a verdade e integridade do processo avaliativo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5" />
                    <span>Limitações</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start space-x-2">
                      <Info className="h-4 w-4 mt-0.5 text-amber-600" />
                      <span>Dados baseados em informações públicas disponíveis</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Info className="h-4 w-4 mt-0.5 text-amber-600" />
                      <span>Avaliação limitada ao período de mandato atual</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Info className="h-4 w-4 mt-0.5 text-amber-600" />
                      <span>Critérios podem evoluir com feedback da comunidade</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Info className="h-4 w-4 mt-0.5 text-amber-600" />
                      <span>Não considera fatores pessoais não públicos</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Garantias</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                      <span>Metodologia aberta e código-fonte público</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                      <span>Dados verificáveis através de fontes oficiais</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                      <span>Processo de revisão por equipe multidisciplinar</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                      <span>Canal aberto para contestações e correções</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="card-elevated">
              <CardContent className="py-8 text-center">
                <Database className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-serif text-xl font-semibold mb-4">
                  Acesso aos Dados e Código
                </h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Acreditamos na transparência total. Todo nosso código, metodologia 
                  e dados estão disponíveis publicamente para auditoria e contribuições.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <Button variant="outline" size="lg">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver no GitHub
                  </Button>
                  <Button variant="outline" size="lg">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Dados (CSV)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
              Fortaleça a Democracia Brasileira
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Use essas informações para tomar decisões informadas nas próximas eleições. 
              Conheça a metodologia, compartilhe dados e contribua para uma sociedade mais justa e transparente.
            </p>
            <Button size="lg" className="font-medium">
              <ExternalLink className="h-4 w-4 mr-2" />
              Entrar em Contato
            </Button>
            
            <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground italic">
                  "Comprai a verdade e não a vendais" - Provérbios 23:23
                </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MetodologiaPage;