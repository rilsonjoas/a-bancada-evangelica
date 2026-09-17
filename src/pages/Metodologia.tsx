import { usePageMeta } from '@/hooks/usePageMeta';
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
  FileText,
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
  usePageMeta("Metodologia Oficial | A Bancada Evangélica", "Entenda em detalhes como é calculado o score dos 5 critérios baseados em votos nominais públicos.");

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
      description: 'Analisamos o caráter do político: histórico de processos judiciais, investigações por corrupção ou improbidade, e o uso da cota parlamentar. Despesas que destoam do padrão estatístico do conjunto penalizam esta pontuação (diferença estatística, não acusação). A nota parte do histórico de conduta do partido nas últimas legislaturas — nunca de uma acusação presumida contra o político — e só é penalizada quando há despesa analisada fora do padrão.',
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
      label: 'Aderência muito alta',
      range: '80 – 100 pontos',
      color: 'bg-green-100 border-green-300 text-green-800',
      iconColor: 'text-green-600',
      description: 'Votos registrados aderem de forma elevada e consistente aos critérios publicados na grande maioria das votações avaliadas.'
    },
    {
      icon: Award,
      level: 'GOOD',
      label: 'Aderência alta',
      range: '65 – 79 pontos',
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      iconColor: 'text-blue-600',
      description: 'Votos registrados aderem à maioria dos critérios publicados, com divergências pontuais em critérios secundários.'
    },
    {
      icon: Target,
      level: 'AVERAGE',
      label: 'Aderência moderada',
      range: '45 – 64 pontos',
      color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      iconColor: 'text-yellow-600',
      description: 'Votos registrados divididos entre favoráveis e contrários aos critérios, ou amostra de votações ainda insuficiente para classificação mais precisa.'
    },
    {
      icon: Activity,
      level: 'POOR',
      label: 'Aderência baixa',
      range: '0 – 44 pontos',
      color: 'bg-red-100 border-red-300 text-red-800',
      iconColor: 'text-red-600',
      description: 'Votos registrados divergem da maioria dos critérios publicados nas votações avaliadas.'
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
                <img src="/marca-white.png" alt="" aria-hidden="true" className="h-12 w-12" />
              </div>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6 text-white">
              Nossa Metodologia de Avaliação
            </h1>
            <p className="text-2xl mb-6 text-white/90 font-medium">
              Um Guia para o Voto Consciente
            </p>
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
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                    Nossa Missão
                  </h2>
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
                    que juntos formam a nota geral (0 a 100 pontos). Os rótulos de nível descrevem a aderência dos votos registrados aos critérios publicados — não avaliam a pessoa, seu caráter ou sua fé.
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
                              <Progress value={c.weight} className="h-1 w-16" aria-label={`Peso do critério ${c.name}: ${c.weight}%`} />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">
                            {c.description.substring(0, 80)}...
                          </td>
                        </tr>
                      ))}
                      <tr className="border-b-2 border-primary bg-primary/5">
                        <td className="py-3 px-4 font-bold">Nota geral</td>
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
                  O que cada nível de desempenho significa
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
                            <div className="text-xs font-semibold">{pl.range}</div>
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
                  é positivo; votar <em>contra</em> é negativo. O critério final usa a <strong>média</strong> do
                  impacto em pontos de todos os votos daquele parlamentar no critério — não a soma. Isso importa:
                  soma cresceria sem limite conforme mais votações relevantes surgem (quem votou 20 vezes puxaria
                  mais nota que quem votou 2, só por volume); média mede a tendência real do voto dele, não quantas
                  vezes o tema apareceu em pauta.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-green-800 text-sm">Impacto Positivo</div>
                      <div className="text-sm text-green-700 mt-1">Voto alinhado com os valores evangélicos — conta a favor na média do critério correspondente</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-red-800 text-sm">Impacto Negativo</div>
                      <div className="text-sm text-red-700 mt-1">Voto contrário ao posicionamento evangélico — conta contra na média do critério correspondente</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <Minus className="h-5 w-5 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-700 text-sm">Neutro / Ausente</div>
                      <div className="text-sm text-gray-600 mt-1">Abstenção, obstrução ou ausência — não altera a pontuação, mas reduz o índice de consistência</div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Exemplo real:</strong> O PL 2630/2020 (Marco Civil da Internet) foi classificado como
                    <em> Defesa da Família</em>. Deputados que votaram <strong>SIM</strong> nesta lei receberam
                    <strong className="text-red-600"> -10 pts</strong> nesta votação, pois o posicionamento evangélico
                    era contrário ao projeto. Deputados que votaram <strong>NÃO</strong> receberam
                    <strong className="text-green-700"> +10 pts</strong>. Se o mesmo deputado tiver outras votações
                    em Família, o critério final é a média entre todas — não a soma desta com as demais.
                  </p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Base de pontuação:</strong> Cada critério parte do histórico de alinhamento do partido do
                    político nas últimas legislaturas (ver Reprodutibilidade) — não de um valor fixo igual pra todo
                    mundo. A média dos votos individuais, quando existem, ajusta esse ponto de partida pra cima ou
                    pra baixo; despesas fora do padrão fazem o mesmo em Integridade Moral.
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
                    <div className="text-sm text-green-700 mt-1">Alta consistência — vota em quase todas as pautas</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-700">50–79%</div>
                    <div className="text-sm text-yellow-700 mt-1">Consistência moderada — ausências frequentes</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-700">0–49%</div>
                    <div className="text-sm text-red-700 mt-1">Baixa consistência — muitas abstenções ou ausências</div>
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
                      {' '}em cada critério e é ajustada pela <strong>média de todos os votos nominais
                      registrados</strong> naquele critério — não pela soma, de propósito: a soma cresceria
                      sem limite conforme mais votações relevantes fossem surgindo, então quem votou 20
                      vezes puxaria mais nota que quem votou 2 só por volume, não por convicção. A média
                      reflete a tendência real do voto, tenha ele acontecido 1 vez ou 20. Integridade
                      Moral também considera despesas públicas fora do padrão estatístico (penalidade proporcional).
                    </p>
                    <p>
                      Consequência honesta: enquanto um parlamentar tem poucos votos registrados ou
                      análise de gastos pendente, a nota dele é uma <strong>estimativa parcial</strong> —
                      herança partidária ajustada pelo que já se sabe. Perfis nessa situação são marcados
                      com o badge <strong>"Nota estimada por partido"</strong> (cor neutra) no perfil e no
                      ranking, em vez dos níveis de aderência. A estimativa vira medição conforme mais
                      votações nominais são incorporadas.
                    </p>
                    <p>
                      <strong>Caso real: Integridade Moral sem despesa analisada ainda.</strong> Quando não
                      há despesa da cota parlamentar analisada pra um político, não existe penalidade a
                      aplicar — a nota de Integridade Moral permanece exatamente na base herdada do
                      histórico do partido (ex.: um parlamentar pode aparecer com 77 nesse critério sem
                      nenhum escândalo associado a ele especificamente). Não é nota inflada nem erro: é o
                      ponto de partida do partido, sem prejulgamento e sem dado individual ainda pra
                      ajustá-lo. O perfil mostra essa condição explicitamente — o badge de risco some e
                      uma nota explicativa aparece no card de estatísticas — em vez de escondê-la atrás
                      de um número que pareceria definitivo.
                    </p>
                    <p className="text-sm leading-relaxed">
                      Fórmula final: soma ponderada dos 5 critérios nos pesos 30/25/20/15/10, limitada a
                      0–100. O motor completo é código aberto:{' '}
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
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
                Detalhamento de Cada Critério
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
                              Peso: {criterio.weight}% na nota geral
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                      <Progress value={criterio.weight} max={35} className="h-3" aria-label={`Peso do critério ${criterio.name}: ${criterio.weight}% de 35`} />
                    </CardHeader>
                    <CardContent className="space-y-5 text-sm font-sans">
                      <div>
                        <h4 className="font-sans text-sm font-bold text-foreground mb-2 flex items-center space-x-2">
                          <Calculator className="h-4 w-4 text-primary shrink-0" />
                          <span>O Que Avaliamos</span>
                        </h4>
                        <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                          {criterio.description}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-sans text-sm font-bold text-foreground mb-2 flex items-center space-x-2">
                          <Cross className="h-4 w-4 text-primary shrink-0" />
                          <span>Por Que é Importante para o Cristão</span>
                        </h4>
                        <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                          {criterio.whyImportant}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-sans text-sm font-bold text-foreground mb-2 flex items-center space-x-2">
                          <Users className="h-4 w-4 text-primary shrink-0" />
                          <span>Como Isso Ajuda na Sua Decisão</span>
                        </h4>
                        <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                          {criterio.howItHelps}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                        <div>
                          <h4 className="font-sans text-sm font-bold text-foreground mb-2 flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                            <span>Indicadores Avaliados</span>
                          </h4>
                          <div className="space-y-1.5 pl-1">
                            {criterio.indicators.map((indicator, idx) => (
                              <div key={idx} className="flex items-center space-x-2 text-xs sm:text-sm">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                                <span className="text-muted-foreground font-sans">{indicator}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-secondary/30 rounded-lg p-4 border border-border/40">
                          <h4 className="font-sans text-sm font-bold text-foreground mb-2 flex items-center space-x-2">
                            <BookOpen className="h-4 w-4 text-primary shrink-0" />
                            <span>Base Bíblica</span>
                          </h4>
                          <p className="font-sans text-xs sm:text-sm text-muted-foreground italic leading-relaxed">
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

      {/* FPE Membership Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
                Quem é da Bancada Evangélica?
              </h2>
              <p className="text-lg text-muted-foreground">
                Como identificamos os integrantes da Frente Parlamentar Evangélica do Congresso Nacional.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="font-serif text-lg font-bold flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>O que é a FPE?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>
                    A <strong className="text-foreground">Frente Parlamentar Evangélica do Congresso Nacional</strong> é uma frenteparlamentar — não é partido, bancada partidária ou caucus. Qualquer parlamentar pode assiná-la, independentemente de sigla ou religião.
                  </p>
                  <p>
                    A frente reúne deputados e senadores que se declaram aliados ao evangélicismo parlamentar. A filiação é <strong className="text-foreground">declarada pelo próprio parlamentar</strong> e registrada em taquigrafia do Senado ou da Câmara.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="font-serif text-lg font-bold flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Nossa fonte</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>
                    Usamos <strong className="text-foreground">exclusivamente fontes oficiais</strong>:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span><strong className="text-foreground">Câmara:</strong> API de frentes parlamentares (frente 54477)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span><strong className="text-foreground">Senado:</strong> composição da frente (codcol 2583)</span>
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    Não usamos listas de imprensa, redes sociais ou autodeclaração verbal.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="card-elevated mb-8">
              <CardHeader>
                <CardTitle className="font-serif text-lg font-bold flex items-center space-x-2">
                  <Info className="h-5 w-5" />
                  <span>Classificação e contestação</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  Cada perfil exibe um chip <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800 border border-purple-200">Bancada Evangélica</span> quando o parlamentar é membro registrado. O chip inclui a data da última auditoria.
                </p>
                <p>
                  <strong className="text-foreground">Dados desatualizados?</strong> Se você sabe que um parlamentar entrou ou saiu da frente, entre em contato conosco. Atualizamos a classificação e registramos a correção na próxima auditoria.
                </p>
                <p>
                  Correções aplicadas são anunciadas publicamente na{' '}
                  <a href="/errata" className="underline hover:text-primary transition-colors">Errata pública</a>.
                </p>
                <p className="text-sm text-muted-foreground">
                  Auditoria base: 25 de agosto de 2026, cruzando nome a nome contra a lista oficial da frente 54477 (Câmara). Dos 208 deputados já marcados antes da auditoria, 207 flags estavam corretos (99,5% de precisão; 1 falso positivo removido). Mais importante: a auditoria também <strong className="text-foreground">encontrou 4 membros ativos que estavam faltando</strong> — incluindo <strong className="text-foreground">Silas Câmara, presidente da própria frente</strong> — e marcou 22 membros oficiais da Câmara hoje inativos (licença, suplência ou vacância; flag é filiação declarada, não exercício do mandato).
                </p>
                <p className="text-sm text-muted-foreground">
                  Reauditoria contínua (15/09/2026): a marcação neste site espelha a lista oficial vigente da frente 54477 (Câmara) e da composição do colegiado no Senado (codcol 2583). Como o cadastro de políticos é alimentado pelos perfis de mandato ativo, alguns <strong className="text-foreground">suplentes relacionados na lista oficial</strong> ainda não têm perfil aqui — a diferença entre a contagem oficial e a do site é de suplentes/substitutos fora do exercício, não de omissão de quem está registrado. Cada perfil marcado exibe a <strong className="text-foreground">data da última captura</strong> da filiação, e a sincronização diária atualiza os flags automaticamente.
                </p>
              </CardContent>
            </Card>
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
                  <CardTitle className="font-serif text-lg font-bold flex items-center space-x-2">
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
                  <CardTitle className="font-serif text-lg font-bold flex items-center space-x-2">
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
                      <span>Presunção de inocência aplicada — sem despesa analisada fora do padrão, Integridade Moral nunca é penalizada; a nota nunca parte de uma acusação</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                      <span>Canal aberto para contestações e correções de dados</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Seção: Como os votos são selecionados */}
            <Card className="card-elevated mb-8">
              <CardHeader>
                <CardTitle className="font-serif text-lg font-bold flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Como os votos são selecionados para a nota</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Nem todas as votações da Câmara e do Senado entram na nota de um político. Apenas <strong className="text-foreground">votações nominais que tratam de pautas evangelicamente relevantes</strong> são contabilizadas. A seleção funciona assim:
                </p>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p><strong className="text-foreground">1. Busca automática por palavras-chave</strong></p>
                  <p>
                    O sistema analisa a descrição e ementa de cada votação nominal buscando termos como <em>aborto, eutanásia, liberdade religiosa, família, casamento, adoção, corrupção, improbidade, saúde pública</em> e outros — organizados por critério (Proteção à Vida, Valores Familiares, Integridade Moral, Responsabilidade Social, Liberdade Religiosa).
                  </p>
                  <p><strong className="text-foreground">2. Cada votação detectada vira uma pauta-chave</strong></p>
                  <p>
                    Quando uma votação casa com uma palavra-chave, ela vira uma <em>pauta-chave</em> vinculada ao critério correspondente. O voto individual do político nessa votação recebe uma pontuação positiva ou negativa conforme o alinhamento com valores evangélicos.
                  </p>
                  <p><strong className="text-foreground">3. Votos sem correspondência não entram na nota</strong></p>
                  <p>
                    Votações sobre pautas que não são evangelicalmente relevantes (reforma tributária, orçamento, indicações de cargos, etc.) <strong className="text-foreground">não são contabilizadas</strong>. Isso é intencional: a nota reflete posicionamento em pautas que importam para a comunidade cristã, não performance legislativa geral.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2 dark:bg-amber-950/30 dark:border-amber-800">
                  <p className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <strong className="text-foreground">Senadores: nota atualmente baseada em partido</strong>
                  </p>
                  <p>
                    A API de dados abertos do Senado Federal expõe apenas <strong className="text-foreground">96 votações nominais plenárias</strong> entre 2023 e 2026 — a grande maioria sobre reforma tributária, indicações de cargos e questões orçamentárias. Nenhuma delas tratou de temas como aborto, família, liberdade religiosa ou integridade moral.
                  </p>
                  <p>
                    Isso <strong className="text-foreground">não significa que os senadores não votaram sobre essas pautas</strong>. A maioria dessas votações ocorre em <strong className="text-foreground">comissões com poder conclusivo</strong> (CCJ, CAS, CAE, CI, etc.), cujos dados individuais de voto <strong className="text-foreground">não são disponibilizados pela API pública do Senado</strong>.
                  </p>
                  <p>
                    <strong className="text-foreground">Resultado:</strong> a nota de senadores é estimada com base no histórico de alinhamento do partido ao longo das legislaturas. Assim que a API do Senado disponibilizar votos individuais de comissões, o cálculo de notas será atualizado automaticamente.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Fonte:</strong> dados coletados de <code className="break-all">legis.senado.leg.br/dadosabertos/votacao</code> em 26/08/2026. O endpoint antigo por senador (<code className="break-all">/senador/[id]/votacoes</code>) foi descontinuado em fevereiro de 2026.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* H3 (2026-08-27): Guia de Reprodutibilidade */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Reprodutibilidade — Como recalcular as notas do zero
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Qualquer pessoa pode reproduzir exatamente as notas publicadas neste site,
                  a partir dos dados brutos oficiais, sem depender da nossa infraestrutura.
                  Publicamos o <strong>guia passo a passo completo</strong> com fontes,
                  fórmulas, scripts e hashes de verificação.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" asChild>
                    <a href="/docs/REPRODUCIBILITY.md" target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      Ler guia de reprodutibilidade
                    </a>
                  </Button>
                  <Button variant="secondary" asChild>
                    <a href="/api/politicians/export/csv" download>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar CSV do ranking
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground border-t pt-3">
                  O guia inclui: APIs oficiais usadas, palavras-chave por critério, fórmula
                  de scoring, scripts determinísticos (recalculate-scores.ts), validações de
                  qualidade, e hashes SHA256 dos CSVs publicados para auditoria de integridade.
                </p>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardContent className="py-8 text-center">
                <Database className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="font-serif text-xl font-semibold mb-4">
                  Acesso aos Dados e Código
                </h2>
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
