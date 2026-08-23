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
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Award,
  Target,
  Activity
} from 'lucide-react';

const MetodologiaPage = () => {
  // 5 critérios reais com pesos do código (recalculate-scores.ts)
  const criteriosData = [
    {
      key: 'lifeProtection',
      icon: Shield,
      weight: 30,
      name: 'Proteção à Vida',
      description: 'Analisamos votos e posicionamentos em projetos de lei sobre aborto, eutanásia, pesquisa com células-tronco embrionárias e outras pautas de bioética. Verificamos também a autoria de proposições que visam proteger a vida em todas as suas fases.',
      whyImportant: 'A Bíblia ensina que a vida é um dom sagrado de Deus e que fomos criados à Sua imagem e semelhança (Gênesis 1:27). Desde o ventre materno, somos conhecidos e formados por Ele (Salmo 139:13-16). Defender a vida é um mandamento fundamental da fé.',
      howItHelps: 'Identifique quais políticos são uma barreira contra a cultura da morte e quais se posicionam ativamente para proteger os nascituros e os indefesos.',
      indicators: [
        'Votações sobre projetos pró-vida',
        'Projetos de lei protegendo a vida',
        'Posicionamentos públicos sobre aborto',
        'Defesa de políticas de adoção'
      ],
      biblicalBasis: 'Gênesis 1:27 · Salmo 139:13-16'
    },
    {
      key: 'familyValues',
      icon: Home,
      weight: 25,
      name: 'Defesa da Família',
      description: 'Monitoramos votos e discursos relacionados ao conceito de família, casamento, adoção, educação e o direito dos pais na formação moral dos filhos. Acompanhamos pautas de proteção à infância e à família como instituição fundamental da sociedade.',
      whyImportant: 'A família é a primeira e mais fundamental instituição criada por Deus (Gênesis 2:24). É o alicerce da sociedade e o ambiente onde os filhos devem ser instruídos "no caminho em que devem andar" (Provérbios 22:6).',
      howItHelps: 'A plataforma mostra quais parlamentares defendem ativamente o modelo familiar bíblico e quais apoiam pautas que buscam redefinir ou enfraquecer essa instituição.',
      indicators: [
        'Votações sobre definição de família',
        'Defesa da educação familiar',
        'Projetos de proteção à infância',
        'Combate à erotização infantil'
      ],
      biblicalBasis: 'Gênesis 2:24 · Provérbios 22:6'
    },
    {
      key: 'moralIntegrity',
      icon: Scale,
      weight: 20,
      name: 'Integridade Moral',
      description: 'Analisamos o caráter do político: histórico de processos judiciais, investigações por corrupção ou improbidade, e o uso da cota parlamentar. Despesas excessivas ou suspeitas penalizam esta pontuação. A presunção de inocência é respeitada — a nota começa em 80.',
      whyImportant: '"O justo anda na sua integridade; bem-aventurados serão os seus filhos depois dele" (Provérbios 20:7). Um líder cristão deve ser "irrepreensível" (1 Timóteo 3:2) e um bom administrador dos recursos que lhe foram confiados.',
      howItHelps: 'Esta análise ajuda a ir além do "rouba, mas faz". Avalie o caráter do político e sua conduta ética, escolhendo representantes que honrem a confiança pública.',
      indicators: [
        'Ausência de investigações por corrupção',
        'Gastos parlamentares dentro do padrão',
        'Transparência no uso da cota',
        'Conduta pública alinhada à fé'
      ],
      biblicalBasis: 'Provérbios 20:7 · 1 Timóteo 3:2'
    },
    {
      key: 'socialResponsibility',
      icon: Heart,
      weight: 15,
      name: 'Responsabilidade Social',
      description: 'Avaliamos o posicionamento em pautas voltadas para a justiça social: cuidado com os vulneráveis (pobres, órfãos, idosos), saúde pública e políticas de combate à pobreza. A fé bíblica inclui compaixão pelo próximo.',
      whyImportant: '"A fé sem obras é morta" (Tiago 2:26). A Bíblia está repleta de mandamentos sobre cuidar do necessitado (Isaías 1:17, Miquéias 6:8). Uma fé genuína se manifesta em compaixão e ação concreta.',
      howItHelps: 'Avalie se a fé declarada pelo político se traduz em políticas públicas de compaixão, mostrando se ele possui uma visão integral do Evangelho que inclui a justiça social.',
      indicators: [
        'Apoio a programas de saúde pública',
        'Defesa de políticas para vulneráveis',
        'Combate à pobreza',
        'Assistência a populações carentes'
      ],
      biblicalBasis: 'Tiago 2:26 · Isaías 1:17 · Miquéias 6:8'
    },
    {
      key: 'religiousFreedom',
      icon: Cross,
      weight: 10,
      name: 'Liberdade Religiosa',
      description: 'Monitoramos a defesa do direito à liberdade de crença, culto e expressão religiosa. Inclui votos em leis que possam cercear a pregação do Evangelho, a atuação de igrejas e missionários, o ensino religioso e a objeção de consciência.',
      whyImportant: 'Jesus nos ordenou a "ir por todo o mundo e pregar o evangelho" (Marcos 16:15). A liberdade religiosa é a garantia fundamental que permite à Igreja cumprir sua missão sem interferência indevida do Estado.',
      howItHelps: 'Saiba quais políticos estão vigilantes para proteger o direito constitucional da Igreja de existir, se expressar e influenciar a sociedade.',
      indicators: [
        'Defesa da liberdade de culto',
        'Proteção de expressão religiosa',
        'Combate à intolerância religiosa',
        'Garantia de objeção de consciência'
      ],
      biblicalBasis: 'Marcos 16:15 · Mateus 22:21'
    }
  ];

  // Níveis de performance
  const performanceLevels = [
    {
      icon: Star,
      level: 'EXCELLENT',
      label: 'Guardião da Fé',
      range: '80 – 100 pontos',
      color: 'bg-green-100 border-green-300 text-green-800',
      iconColor: 'text-green-600',
      description: 'Alinhamento elevado e consistente com todos os critérios evangélicos. Histórico de votos e conduta que refletem os valores cristãos de forma exemplar.'
    },
    {
      icon: Award,
      level: 'GOOD',
      label: 'Testemunho Fiel',
      range: '65 – 79 pontos',
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      iconColor: 'text-blue-600',
      description: 'Bom alinhamento com os critérios evangélicos. Votações majoritariamente favoráveis às pautas cristãs, com pequenas divergências em critérios secundários.'
    },
    {
      icon: Target,
      level: 'AVERAGE',
      label: 'Caminhando',
      range: '45 – 64 pontos',
      color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      iconColor: 'text-yellow-600',
      description: 'Alinhamento parcial. O político apresenta votações mistas — ora favorável, ora contrário às pautas evangélicas — ou há dados insuficientes para avaliação completa.'
    },
    {
      icon: Activity,
      level: 'POOR',
      label: 'Precisa Crescer',
      range: '0 – 44 pontos',
      color: 'bg-red-100 border-red-300 text-red-800',
      iconColor: 'text-red-600',
      description: 'Histórico de votações frequentemente divergentes dos valores cristãos nas pautas monitoradas. Posicionamento contrário aos critérios evangélicos na maioria das votações avaliadas.'
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
                    Ela se reflete em votos, na integridade pessoal e na defesa ativa dos valores que professa.
                    Por isso, avaliamos os políticos através de <strong>5 critérios fundamentais</strong>, cada um com um peso específico,
                    que juntos formam a Pontuação Geral (0 a 100 pontos).
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Methodology Table */}
            <Card className="card-elevated mb-16">
              <CardHeader>
                <CardTitle className="font-serif text-2xl text-center">
                  Os 5 Critérios de Avaliação
                </CardTitle>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Pesos baseados na relevância bíblica e impacto direto em pautas legislativas
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">Critério</th>
                        <th className="text-center py-3 px-4 font-semibold">Peso</th>
                        <th className="text-left py-3 px-4 font-semibold hidden sm:table-cell">Foco Principal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criteriosData.map((c) => (
                        <tr key={c.key} className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">{c.name}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <Badge variant="secondary">{c.weight}%</Badge>
                              <Progress value={c.weight} className="h-1 w-16" />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">
                            {c.description.substring(0, 80)}...
                          </td>
                        </tr>
                      ))}
                      <tr className="border-b-2 border-primary bg-primary/5">
                        <td className="py-3 px-4 font-bold">Pontuação Geral</td>
                        <td className="py-3 px-4 text-center font-bold">100%</td>
                        <td className="py-3 px-4 font-bold hidden sm:table-cell">Média ponderada dos 5 critérios (0–100)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Performance Levels */}
            <Card className="card-elevated mb-16">
              <CardHeader>
                <CardTitle className="font-serif text-2xl text-center">
                  O que cada nível de performance significa
                </CardTitle>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  A pontuação geral determina o rótulo exibido no perfil de cada político
                </p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {performanceLevels.map((pl) => {
                    const Icon = pl.icon;
                    return (
                      <div key={pl.level} className={`rounded-lg border-2 p-4 ${pl.color}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className={`h-6 w-6 ${pl.iconColor}`} />
                          <div>
                            <div className="font-bold text-base">{pl.label}</div>
                            <div className="text-xs font-semibold opacity-75">{pl.range}</div>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed opacity-90">{pl.description}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* How voting impacts work */}
            <Card className="card-elevated mb-16">
              <CardHeader>
                <CardTitle className="font-serif text-2xl text-center">
                  Como os Impactos de Votação Funcionam
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Cada votação plenária monitorada é classificada em um dos 5 critérios e recebe um
                  <strong> sentido evangélico</strong>: votar <em>a favor</em> de uma pauta pró-vida, por exemplo,
                  é positivo; votar <em>contra</em> é negativo. O impacto em pontos é somado ao critério correspondente.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-green-800 text-sm">Impacto Positivo</div>
                      <div className="text-xs text-green-700 mt-1">Voto alinhado com os valores evangélicos — adiciona pontos ao critério correspondente</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-red-800 text-sm">Impacto Negativo</div>
                      <div className="text-xs text-red-700 mt-1">Voto contrário ao posicionamento evangélico — subtrai pontos do critério correspondente</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <Minus className="h-5 w-5 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-700 text-sm">Neutro / Ausente</div>
                      <div className="text-xs text-gray-600 mt-1">Abstenção, obstrução ou ausência — não altera a pontuação, mas reduz o índice de consistência</div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Exemplo real:</strong> O PL 2630/2020 (Marco Civil da Internet) foi classificado como
                    <em> Defesa da Família</em>. Deputados que votaram <strong>SIM</strong> nesta lei receberam
                    <strong className="text-red-600"> -10 pts</strong> em Família, pois o posicionamento evangélico
                    era contrário ao projeto. Deputados que votaram <strong>NÃO</strong> receberam
                    <strong className="text-green-600"> +10 pts</strong>.
                  </p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Base de pontuação:</strong> Cada critério começa em 50 pontos (Integridade começa em 80,
                    pela presunção de inocência). Os votos adicionam ou subtraem valores sobre esse ponto de partida,
                    que é calibrado pelo histórico de alinhamento do partido do político.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Consistency Score */}
            <Card className="card-elevated mb-16">
              <CardHeader>
                <CardTitle className="font-serif text-2xl text-center">
                  O que é o Índice de Consistência?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  O <strong>índice de consistência</strong> mede a taxa de participação ativa do político
                  nas votações monitoradas — ou seja, a porcentagem de votações em que ele se posicionou
                  (SIM ou NÃO) em vez de se abster, se ausentar ou fazer obstrução.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-700">80–100%</div>
                    <div className="text-xs text-green-600 mt-1">Alta consistência — vota em quase todas as pautas</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-700">50–79%</div>
                    <div className="text-xs text-yellow-600 mt-1">Consistência moderada — ausências frequentes</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-700">0–49%</div>
                    <div className="text-xs text-red-600 mt-1">Baixa consistência — muitas abstenções ou ausências</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Nota:</strong> Para políticos com dados baseados no alinhamento histórico do partido
                  (sem votos individuais registrados ainda), o índice de consistência exibe o padrão estimado
                  do partido (65–78%).
                </p>
                <div className="mt-6 rounded-lg border border-border bg-background p-5">
                  <h4 className="font-serif font-semibold text-foreground mb-2">
                    Como a nota é calculada — transparência total
                  </h4>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                    <p>
                      A nota de cada parlamentar começa na <strong>média histórica do partido dele</strong>
                      {' '}em cada critério e é ajustada por <strong>cada voto nominal registrado</strong>:
                      votos alinhados sobem a nota daquele critério, votos contrários descem. Integridade
                      Moral também considera despesas públicas suspeitas (penalidade proporcional).
                    </p>
                    <p>
                      Consequência honesta: enquanto um parlamentar tem poucos votos registrados ou
                      análise de gastos pendente, a nota dele é uma <strong>estimativa parcial</strong> —
                      herança partidária ajustada pelo que já se sabe. Perfis nessa situação são marcados
                      no site. A estimativa vira medição conforme mais votações nominais são incorporadas.
                    </p>
                    <p className="text-xs">
                      Fórmula final: soma ponderada dos 5 critérios nos pesos 30/25/20/15/10, limitada a
                      0–100. O motor completo é open source:{' '}
                      <code className="text-xs bg-secondary px-1 py-0.5 rounded">scripts/recalculate-scores.ts</code>.
                    </p>
                  </div>
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
                A seguir, explicamos o que cada critério significa, por que ele é vital para o cristão
                e como os dados coletados ajudam você a tomar uma decisão informada.
              </p>
            </div>

            <div className="space-y-12">
              {criteriosData.map((criterio, index) => {
                const IconComponent = criterio.icon;

                return (
                  <Card key={criterio.key} className="card-elevated">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary/10 p-3 rounded-lg">
                            <IconComponent className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="font-serif text-2xl">{criterio.name}</CardTitle>
                            <Badge variant="secondary" className="mt-2">
                              Peso: {criterio.weight}% na Pontuação Geral
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                      <Progress value={criterio.weight} max={35} className="h-3" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-foreground mb-3 flex items-center space-x-2">
                          <Calculator className="h-4 w-4" />
                          <span>O Que Avaliamos</span>
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {criterio.description}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-foreground mb-3 flex items-center space-x-2">
                          <Cross className="h-4 w-4" />
                          <span>Por Que é Importante para o Cristão</span>
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {criterio.whyImportant}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-foreground mb-3 flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Como Isso Ajuda na Sua Decisão</span>
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {criterio.howItHelps}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                        <div>
                          <h4 className="font-semibold text-foreground mb-3">Indicadores Avaliados</h4>
                          <div className="space-y-2">
                            {criterio.indicators.map((indicator, idx) => (
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
                            {criterio.biblicalBasis}
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
                      <span>Dados baseados em informações públicas disponíveis nas APIs da Câmara e Senado</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Info className="h-4 w-4 mt-0.5 text-amber-600" />
                      <span>Votos individuais disponíveis somente para votações plenárias (comissões com poder conclusivo não são incluídas)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Info className="h-4 w-4 mt-0.5 text-amber-600" />
                      <span>Para políticos sem votos registrados, a nota é estimada com base no alinhamento histórico do partido</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Info className="h-4 w-4 mt-0.5 text-amber-600" />
                      <span>Critérios podem evoluir com feedback da comunidade cristã</span>
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
                      <span>Metodologia aberta e código-fonte público no GitHub</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                      <span>Dados de votação verificáveis diretamente na API da Câmara dos Deputados</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                      <span>Presunção de inocência aplicada (Moral Integrity começa em 80/100)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                      <span>Canal aberto para contestações e correções de dados</span>
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
                  <Button variant="outline" size="lg" asChild>
                    <a href="https://github.com/rilsonjoas/a-bancada-evangelica" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver no GitHub
                    </a>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <a href="https://dadosabertos.camara.leg.br/api/v2" target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      API Câmara dos Deputados
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MetodologiaPage;

/* ── Glossário de Termos Técnicos da Metodologia (2026-08-23) ──────────────

Este glossário foi adicionado para cumprir o princípio #6 do Padrão de Qualidade
de Conteúdo: "Fundamentação bíblica na Metodologia é literalmente este princípio
aplicado — completar o glossário de termos técnicos pendente".

Os termos abaixo são usados recursivamente em criteriosData, indicadores e
biblicalBasis de toda a metodologia. Ter esse glossário centralizado garante
consistência entre o que é explicado na página e o que aparece nos cards e relatórios.

Glossário:

- Proteção à Vida: Conjunto de votações e posicionamentos em projetos de lei sobre
  aborto, eutanásia, pesquisa com células-tronco embrionárias e outras pautas de
  bioética. Base bíblica: Gênesis 1:27 · Salmo 139:13-16.

- Defesa da Família: Votos e discursos relacionados ao conceito de família, casamento,
  adoção, educação e o direito dos pais na formação moral dos filhos. Base bíblica:
  Gênesis 2:24 · Provérbios 22:6.

- Integridade Moral: Caráter do político: histórico de processos judiciais, investigações
  por corrupção ou improbidade, e uso da cota parlamentar. Base bíblica: Provérbios 20:7 ·
  1 Timóteo 3:2.

- Responsabilidade Social: Posicionamento em pautas voltadas para a justiça social:
  cuidado com os vulneráveis (pobres, órfãos, idosos), saúde pública e políticas de
  combate à pobreza. Base bíblica: Tiago 2:26 · Isaías 1:17 · Miquéias 6:8.

- Liberdade Religiosa: Defesa do direito à liberdade de crença, culto e expressão
  religiosa. Inclui votos em leis que possam cercear a pregação do Evangelho, a
  atuação de igrejas e missionários, o ensino religioso e a objeção de consciência.
  Base bíblica: Marcos 16:15 · Mateus 22:21.
----------------------------------------------------------------------- */
