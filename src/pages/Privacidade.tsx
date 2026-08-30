import { usePageMeta } from '@/hooks/usePageMeta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Database, Mail, Eye, UserCheck } from 'lucide-react';

export function Privacidade() {
    usePageMeta("Política de Privacidade | A Bancada Evangélica", "Conheça nossa política de privacidade e compromisso com a proteção de dados.");

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero */}
      <section className="bg-gradient-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">
              Política de Privacidade
            </h1>
            <p className="text-primary-foreground/90 mt-3">
              Transparência sobre dados vale também para quem faz transparência.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">

          <Card className="card-elevated">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Última atualização: 22 de agosto de 2026. Este documento explica,
                em linguagem simples, quais dados este site trata e por quê —
                em conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei
                nº 13.709/2018).
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                1. Dados de parlamentares
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                Todo o conteúdo de avaliação do site (votos nominais, despesas,
                mandatos) é construído exclusivamente a partir de{' '}
                <strong>fontes públicas oficiais</strong>: APIs abertas da Câmara
                dos Deputados, do Senado Federal, do TSE e do Portal da
                Transparência.
              </p>
              <p>
                São dados de titulares públicos sobre o exercício do mandato —
                cuja publicidade é obrigação legal — tratados com finalidade de{' '}
                <strong>controle social e jornalismo de dados</strong>, sem
                perfil comportamental, sem publicidade direcionada e sem
                transferência a terceiros para marketing.
              </p>
              <p>
                Erros podem acontecer: qualquer parlamentar (ou cidadão) pode
                solicitar correção pelo canal na seção 5, com direito de resposta
                garantido no processo de revisão descrito nas Perguntas Frequentes.
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                2. Formulário de contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                Ao escrever para nós, coletamos <strong>nome, e-mail e mensagem</strong>,
                com a única finalidade de responder à sua solicitação.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Base legal: consentimento (você decide enviar) e legítimo interesse em responder.</li>
                <li>Retenção: mantemos a correspondência pelo prazo necessário ao atendimento e à segurança do projeto; você pode pedir exclusão a qualquer momento.</li>
                <li>Nada é usado para lista de e-mails, newsletter não solicitada ou compartilhamento com terceiros.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                3. Navegação e métricas de audiência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                Usamos análise de audiência <strong>sem cookies identificáveis</strong>{' '}
                (auto-hospedada): contamos páginas vistas de forma agregada e anônima
                — nenhum identificador individual, nenhum rastreamento entre sites,
                nenhuma publicidade.
              </p>
              <p>
                Por isso este site <strong>não exibe banner de cookies</strong>: não
                instala cookies de rastreamento no seu navegador. Se um dia isso
                mudar, esta política será atualizada e o consentimento será pedido
                antes de qualquer cookie não essencial.
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                4. Seus direitos (art. 18 da LGPD)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed">
              <p>
                Você pode solicitar, gratuitamente: confirmação de tratamento,
                acesso aos seus dados, correção, anonimização ou exclusão, e
                informação sobre compartilhamento. Basta escrever para o canal
                abaixo que respondemos em até 15 dias.
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="pt-6 space-y-2">
              <p className="font-semibold text-foreground">5. Canal do titular</p>
              <p className="text-muted-foreground text-sm">
                E-mail:{' '}
                <a href="mailto:abancada@narniano.com" className="text-blue-600 hover:underline">
                  abancada@narniano.com
                </a>
                {' '}· Assunto sugerido: "Privacidade".
              </p>
              <p className="text-sm text-muted-foreground pt-2">
                Projeto independente, mantido por pessoa física, sem fins
                lucrativos — código aberto sob licença MIT (
                <a href="https://github.com/rilsonjoas/a-bancada-evangelica"
                   target="_blank" rel="noopener noreferrer"
                   className="text-blue-600 hover:underline">github.com/rilsonjoas/a-bancada-evangelica</a>).
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default Privacidade;
