import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Calculator, Database, CheckCircle, AlertCircle, Info, ExternalLink, Download } from 'lucide-react';
import { SCORE_WEIGHTS, SCORE_CATEGORIES } from '@/types/politician';

const MetodologiaPage = () => {
  const criteriaData = [
    {
      key: 'lifeProtection',
      weight: SCORE_WEIGHTS.lifeProtection,
      name: SCORE_CATEGORIES.lifeProtection,
      description: 'Avalia o posicionamento sobre aborto, eutanásia, pesquisas com células-tronco embrionárias e defesa da vida desde a concepção.',
      indicators: [
        'Votações sobre projetos pró-vida',
        'Projetos de lei protegendo a vida',
        'Posicionamentos públicos sobre aborto',
        'Defesa de políticas de adoção'
      ],
      biblicalBasis: 'Salmos 139:13-16, Jeremias 1:5'
    },
    {
      key: 'familyValues',
      weight: SCORE_WEIGHTS.familyValues,
      name: SCORE_CATEGORIES.familyValues,
      description: 'Analisa o apoio à família tradicional, direitos parentais na educação dos filhos e proteção da instituição familiar.',
      indicators: [
        'Votações sobre definição de família',
        'Defesa da educação domiciliar',
        'Projetos de proteção à infância',
        'Oposição à ideologia de gênero'
      ],
      biblicalBasis: 'Gênesis 2:24, Efésios 6:1-4'
    },
    {
      key: 'moralIntegrity',
      weight: SCORE_WEIGHTS.moralIntegrity,
      name: SCORE_CATEGORIES.moralIntegrity,
      description: 'Examina a conduta pessoal, transparência financeira, histórico de escândalos e comportamento ético.',
      indicators: [
        'Histórico de investigações',
        'Transparência de gastos públicos',
        'Conduta moral pessoal',
        'Cumprimento de promessas eleitorais'
      ],
      biblicalBasis: '1 Timóteo 3:2-7, Provérbios 10:9'
    },
    {
      key: 'socialResponsibility',
      weight: SCORE_WEIGHTS.socialResponsibility,
      name: SCORE_CATEGORIES.socialResponsibility,
      description: 'Considera o cuidado com necessitados, políticas de assistência social e compromisso com justiça social bíblica.',
      indicators: [
        'Apoio a programas sociais',
        'Defesa dos direitos humanos',
        'Políticas para populações vulneráveis',
        'Combate à pobreza e desigualdade'
      ],
      biblicalBasis: 'Isaías 1:17, Mateus 25:35-40'
    },
    {
      key: 'religiousFreedom',
      weight: SCORE_WEIGHTS.religiousFreedom,
      name: SCORE_CATEGORIES.religiousFreedom,
      description: 'Avalia a defesa da liberdade religiosa, proteção do direito de culto e expressão da fé cristã.',
      indicators: [
        'Defesa da liberdade de culto',
        'Proteção de símbolos religiosos',
        'Direito de expressão da fé',
        'Combate à perseguição religiosa'
      ],
      biblicalBasis: 'Atos 4:19-20, 1 Pedro 3:15'
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
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">
              Metodologia de Avaliação
            </h1>
            <p className="text-xl text-primary-foreground/90 leading-relaxed">
              Conheça os critérios objetivos e transparentes que utilizamos para 
              avaliar o testemunho fiel dos parlamentares brasileiros.
            </p>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-16">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="font-serif text-2xl flex items-center space-x-2">
                  <Calculator className="h-6 w-6" />
                  <span>Sistema de Pontuação</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <p className="text-muted-foreground leading-relaxed">
                    Nossa metodologia combina análise quantitativa de votações parlamentares 
                    com avaliação qualitativa de conduta e posicionamentos públicos. Cada 
                    parlamentar recebe uma pontuação de 0 a 100 pontos, calculada através 
                    de cinco critérios principais com pesos diferentes.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Fontes de Dados</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>APIs oficiais da Câmara e Senado</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Dados do TSE e Portal da Transparência</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Posicionamentos públicos verificados</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Histórico de projetos de lei</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Processo de Avaliação</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center space-x-2">
                          <Database className="h-4 w-4 text-blue-600" />
                          <span>Coleta automatizada de dados</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Calculator className="h-4 w-4 text-blue-600" />
                          <span>Cálculo ponderado por critério</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span>Revisão por equipe teológica</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <span>Atualização trimestral</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Criteria Breakdown */}
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
                Critérios de Avaliação
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Cinco áreas fundamentais baseadas em princípios bíblicos sólidos 
                para avaliar o testemunho parlamentar.
              </p>
            </div>

            {criteriaData.map((criteria, index) => (
              <Card key={criteria.key} className="card-elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-serif text-xl flex items-center space-x-3">
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {(criteria.weight * 100).toFixed(0)}%
                      </Badge>
                      <span>{criteria.name}</span>
                    </CardTitle>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {index + 1}
                      </div>
                    </div>
                  </div>
                  <Progress value={criteria.weight * 100} className="h-2" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        {criteria.description}
                      </p>
                      
                      <h4 className="font-semibold text-foreground mb-3">Indicadores Avaliados</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {criteria.indicators.map((indicator, idx) => (
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
                        {criteria.biblicalBasis}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency Section */}
      <section className="py-16 bg-secondary/30">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

            <Card className="card-elevated mt-8">
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
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
              Dúvidas sobre a Metodologia?
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Nossa equipe está sempre disponível para esclarecer questões sobre 
              os critérios, fontes de dados ou processo de avaliação.
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