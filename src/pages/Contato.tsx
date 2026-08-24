import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageCircle, Github, Send, HelpCircle, BookOpen, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/apiClient';

const ContatoPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Achado real 2026-08-16: esse formulário era decorativo — só mostrava
  // o toast de sucesso e não mandava nada pra lugar nenhum. Agora chama
  // POST /api/contact de verdade (backend usa Resend).
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      toast({
        title: "Mensagem enviada!",
        description: "Obrigado pelo contato. Responderemos em breve.",
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      toast({
        title: "Não foi possível enviar",
        description: "Tente de novo em alguns instantes, ou escreva direto pra abancada@narniano.com.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const faqItems = [
    {
      question: "Como são coletados os dados dos parlamentares?",
      answer: "Utilizamos exclusivamente APIs oficiais da Câmara dos Deputados, Senado Federal, TSE e Portal da Transparência. Todos os dados são públicos e verificáveis."
    },
    {
      question: "Com que frequência os dados são atualizados?",
      answer: "Cadastro e gastos dos parlamentares são sincronizados automaticamente da Câmara e do Senado toda semana, e as notas são recalculadas diariamente. As votações do Plenário são incorporadas por curadoria sempre que há sessões relevantes para nossos critérios — por isso o total de pautas monitoradas cresce em ritmo variável."
    },
    {
      question: "Como posso contestar uma avaliação?",
      answer: "Entre em contato conosco apresentando documentação que comprove inconsistências. Temos um processo rigoroso de revisão para correções."
    },
    {
      question: "O projeto tem ligação com partidos políticos?",
      answer: "Não. Somos completamente independentes e apartidários. Não recebemos financiamento de partidos ou grupos políticos."
    },
    {
      question: "Posso colaborar com o projeto?",
      answer: "Sim! Somos um projeto de código aberto. Programadores, teólogos, cientistas políticos e voluntários são bem-vindos."
    },
    {
      question: "Como garantem a imparcialidade das avaliações?",
      answer: "Nossa metodologia é transparente, baseada em critérios objetivos e revisada por uma equipe multidisciplinar de cristãos comprometidos com a verdade."
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
              Entre em Contato
            </h1>
            <p className="text-xl text-primary-foreground/90 leading-relaxed">
              Tire suas dúvidas, faça sugestões ou colabore conosco para fortalecer 
              a transparência parlamentar no Brasil.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="font-serif text-2xl flex items-center space-x-2">
                  <Send className="h-6 w-6" />
                  <span>Envie sua Mensagem</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Nome Completo *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                      Assunto *
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Sobre o que você gostaria de falar?"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Mensagem *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Escreva sua mensagem detalhada aqui..."
                    />
                  </div>
                  
                  <Button type="submit" size="lg" className="w-full font-medium" disabled={sending}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {sending ? 'Enviando...' : 'Enviar Mensagem'}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    Responderemos em até 48 horas úteis. Todos os campos são obrigatórios.
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="font-serif text-xl flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Informações de Contato</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Email Principal</h3>
                      <a
                        href="mailto:abancada@narniano.com"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        abancada@narniano.com
                      </a>
                      <p className="text-xs text-muted-foreground mt-1">
                        Para dúvidas gerais, sugestões e parcerias
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Github className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">GitHub</h3>
                      <p className="text-sm text-muted-foreground">github.com/rilsonjoas/a-bancada-evangelica</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Para colaborações técnicas e issues
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
                Perguntas Frequentes
              </h2>
              <p className="text-lg text-muted-foreground">
                Respostas para as dúvidas mais comuns sobre nosso projeto.
              </p>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <Card key={index} className="card-elevated">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg text-foreground">
                      {item.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">
                Não encontrou a resposta que procurava?
              </p>
              <Button variant="outline" size="lg" asChild>
                <a href="mailto:abancada@narniano.com?subject=D%C3%BAvida%20sobre%20a%20Bancada%20Evang%C3%A9lica">
                  <Mail className="h-4 w-4 mr-2" />
                  Fazer uma Pergunta
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <BookOpen className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
              Fortaleça este Ministério
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Compartilhe nosso trabalho, ore por nossa missão e ajude a construir 
              um Brasil com líderes íntegros e compromissados com os valores do Reino.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                size="lg"
                className="font-medium"
                onClick={async () => {
                  const shareData = {
                    title: 'A Bancada Evangélica',
                    text: 'Transparência parlamentar: como seus representantes votam nos valores que você defende?',
                    url: window.location.origin,
                  };
                  try {
                    if (navigator.share) {
                      await navigator.share(shareData);
                    } else {
                      await navigator.clipboard.writeText(window.location.origin);
                      toast({ title: 'Link copiado!', description: 'Cole onde quiser compartilhar o projeto.' });
                    }
                  } catch {
                    // usuário cancelou o share nativo — nada a fazer
                  }
                }}
              >
                Compartilhar Projeto
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="https://github.com/rilsonjoas/a-bancada-evangelica" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  Contribuir no GitHub
                </a>
              </Button>
            </div>
            
            <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground italic">
                  "Portanto, ide e fazei discípulos de todas as nações" - Mateus 28:19
                </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContatoPage;