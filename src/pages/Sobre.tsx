import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Target, Eye, Shield, Users, Mail, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

const SobrePage = () => {
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
              Sobre o Projeto
            </h1>
            <p className="text-xl text-primary-foreground/90 leading-relaxed">
              Conheça nossa missão de fortalecer a democracia brasileira através da 
              transparência parlamentar baseada em valores cristãos sólidos.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
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
                  Promover transparência parlamentar através da avaliação objetiva de 
                  deputados e senadores brasileiros com base em critérios bíblicos e 
                  valores cristãos fundamentais.
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
                <CardTitle className="font-serif text-xl">Visão</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Ser referência nacional em análise parlamentar cristã, contribuindo 
                  para eleições mais conscientes e um Brasil alinhado com princípios 
                  bíblicos de justiça e retidão.
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
                <CardTitle className="font-serif text-xl">Valores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Integridade, transparência, imparcialidade e compromisso com a verdade. 
                  Fundamentados na Palavra de Deus para avaliar e informar com justiça 
                  e amor.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Description */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground mb-6">
                Por que A Bancada Evangélica?
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Vivemos tempos desafiadores onde a política brasileira precisa de maior 
                  transparência e alinhamento com valores sólidos. Como cristãos, temos 
                  a responsabilidade de escolher líderes que representem nossos princípios 
                  e lutem por uma sociedade mais justa.
                </p>
                <p>
                  <strong className="text-foreground">A Bancada Evangélica</strong> nasceu 
                  da necessidade de fornecer informações claras e objetivas sobre o 
                  desempenho parlamentar, baseadas em critérios bíblicos como defesa da 
                  vida, proteção da família, integridade moral e responsabilidade social.
                </p>
                <p>
                  Somos um projeto independente, apartidário e transparente. Não recebemos 
                  financiamento de partidos políticos ou grupos de interesse. Nossa única 
                  agenda é a verdade e o fortalecimento da democracia brasileira.
                </p>
              </div>
            </div>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Nossos Princípios</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Badge variant="secondary" className="text-xs">30%</Badge>
                    <div>
                      <h4 className="font-semibold text-foreground">Proteção à Vida</h4>
                      <p className="text-sm text-muted-foreground">
                        Defesa da vida desde a concepção até a morte natural
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="secondary" className="text-xs">25%</Badge>
                    <div>
                      <h4 className="font-semibold text-foreground">Valores Familiares</h4>
                      <p className="text-sm text-muted-foreground">
                        Proteção da família tradicional e dos direitos parentais
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="secondary" className="text-xs">20%</Badge>
                    <div>
                      <h4 className="font-semibold text-foreground">Integridade Moral</h4>
                      <p className="text-sm text-muted-foreground">
                        Transparência, honestidade e conduta exemplar
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="secondary" className="text-xs">15%</Badge>
                    <div>
                      <h4 className="font-semibold text-foreground">Responsabilidade Social</h4>
                      <p className="text-sm text-muted-foreground">
                        Cuidado com os necessitados e justiça social
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="secondary" className="text-xs">10%</Badge>
                    <div>
                      <h4 className="font-semibold text-foreground">Liberdade Religiosa</h4>
                      <p className="text-sm text-muted-foreground">
                        Proteção do direito de culto e expressão da fé
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
              Nossa Equipe
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Somos cristãos comprometidos com a verdade, formados por diversas áreas 
              do conhecimento e unidos pela visão de um Brasil melhor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="card-elevated text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-2">Pesquisadores</h3>
                <p className="text-sm text-muted-foreground">
                  Cientistas políticos, teólogos e jornalistas especializados em 
                  análise parlamentar e acompanhamento legislativo.
                </p>
              </CardContent>
            </Card>

            <Card className="card-elevated text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-2">Teólogos</h3>
                <p className="text-sm text-muted-foreground">
                  Pastores e estudiosos das Escrituras que garantem o alinhamento 
                  dos critérios com os princípios bíblicos fundamentais.
                </p>
              </CardContent>
            </Card>

            <Card className="card-elevated text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-2">Desenvolvedores</h3>
                <p className="text-sm text-muted-foreground">
                  Programadores cristãos dedicados a criar ferramentas tecnológicas 
                  para o avanço do Reino de Deus.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="card-elevated">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
                Junte-se ao Movimento
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
                Compartilhe este projeto, ore por nosso trabalho e ajude a construir 
                um Brasil com líderes íntegros e compromissados com os valores do Reino.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link to="/metodologia">
                  <Button size="lg" className="font-medium">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Conhecer a Metodologia
                  </Button>
                </Link>
                <Link to="/contato">
                  <Button variant="outline" size="lg">
                    <Mail className="h-4 w-4 mr-2" />
                    Entrar em Contato
                  </Button>
                </Link>
              </div>
              
              <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground italic">
                  "Bem-aventurada é a nação cujo Deus é o Senhor" - Salmos 33:12
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default SobrePage;