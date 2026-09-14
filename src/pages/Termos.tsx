import { usePageMeta } from '@/hooks/usePageMeta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText, Scale, AlertTriangle, GitBranch, RefreshCw } from 'lucide-react';

export function Termos() {
    usePageMeta("Termos de Uso | A Bancada Evangélica", "Termos de uso e diretrizes para utilização dos dados da plataforma.");

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero */}
      <section className="bg-gradient-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <ScrollText className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">
              Termos de Uso
            </h1>
            <p className="text-primary-foreground/90 mt-3">
              As regras do jogo, com a mesma clareza que exigimos dos outros.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">

          <Card className="card-elevated">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Última atualização: 14 de setembro de 2026. Ao usar este site você
                concorda com estes termos — escritos para serem lidos de verdade.
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">1. O que é o projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                A Bancada Evangélica é uma ferramenta independente de{' '}
                <strong>transparência parlamentar</strong>: cruza votos nominais
                e despesas públicas (dados oficiais da Câmara, do Senado, do TSE
                e do Portal da Transparência) com critérios públicos de avaliação.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Não somos afiliados</strong> a nenhum partido, candidato, denominação religiosa ou organização partidária.</li>
                <li><strong>Não recebemos dinheiro</strong> de campanhas: sem anúncios, sem afiliações (decisão permanente documentada no projeto).</li>
                <li>O código-fonte é aberto (MIT) e a metodologia é publicada e auditável.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                2. Natureza das notas e avaliações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                As notas são o resultado de um <strong>cálculo automatizado e
                reproduzível</strong> sobre registros públicos de votação — não são
                verdades absolutas, diagnósticos pessoais nem recomendação de voto
                obrigatória. Elas medem aderência a critérios declaradamente
                evangélicos, publicados na página de Metodologia.
              </p>
              <p>
                Parlamentares com poucos votos registrados ou análise de gastos
                pendente têm nota marcada como <strong>estimativa parcial</strong> —
                e isso está indicado no próprio perfil.
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                3. Período eleitoral e propaganda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                Este projeto é <strong>jornalismo de dados e controle social</strong>,
                não propaganda eleitoral. Não apoiamos, não atacamos e não
                custeamos candidato, partido ou coligação — e não vinculamos a
                avaliação de um parlamentar a nenhuma chapa ou candidatura.
              </p>
              <p>
                Em períodos de campanha, a plataforma continua operando — inclusive
                porque os <strong>votos nominais do mandato em exercício</strong> são
                registro público disponível a qualquer cidadão. Diferenciamos, no
                entanto, o que é regra permanente do que é contexto eleitoral:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>As notas refletem <strong>votações no mandato</strong>, nunca
                  promessas ou programas de campanha de qualquer candidato;</li>
                <li>Não atualizamos nem destacamos conteúdo para favorecer ou
                  prejudicar ninguém em disputa;</li>
                <li>Comparações ou materiais com conotação eleitoral só são
                  publicados em linguagem factual e neutra (art. 36 da Lei
                  nº 9.504/1997 — propaganda eleitoral é dever do candidato,
                  não nosso).</li>
              </ul>
              <p>
                Parlamentares em exercício que venham a se candidatar em 2026
                permanecem avaliados pelo histórico do mandato — o dado não
                muda porque existe campanha, e trata-se de informação pública
                útil ao eleitor (art. 5º, incisos IV e XIV, da Constituição).
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                4. Direito de resposta e correções
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                Encontrou um dado errado? É parlamentar e discorda da avaliação? O
                canal é o mesmo para todos:{' '}
                <a href="mailto:abancada@narniano.com" className="text-blue-600 hover:underline">
                  abancada@narniano.com
                </a>. Compromissos:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Analisar toda contestação apresentando documentação;</li>
                <li>Corrigir erros comuns em até 15 dias;</li>
                <li>Publicar retificação quando houver, com registro do que mudou.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">5. Uso dos dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                Você pode usar, compartilhar e reutilizar os dados deste projeto,
                inclusive comercialmente, desde que cite a fonte ("A Bancada
                Evangélica — dadosabertos.camara.leg.br / senado.leg.br") e não
                atribua a nós declarações que não fizemos.
              </p>
              <p className="flex items-start gap-2">
                <GitBranch className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <span>
                  Código-fonte sob licença MIT; os textos do site, sob atribuição
                  (CC BY 4.0).
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">6. Limitações de responsabilidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                O serviço é oferecido "no estado em que se encontra". Embora
                sincronizemos com fontes oficiais e testemos o motor de cálculo,
                <strong> não garantimos ausência total de erros</strong> — garantimos
                correção rápida quando apontados. Não nos responsabilizamos por
                decisões tomadas com base exclusiva nas notas aqui exibidas: elas
                existem para informar, não para substituir seu juízo.
              </p>
              <p className="flex items-start gap-2">
                <RefreshCw className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <span>
                  Estes termos podem ser atualizados; a data no topo muda junto, e
                  mudanças relevantes serão destacadas nesta página por 30 dias.
                </span>
              </p>
            </CardContent>
          </Card>

        </div>
      </section>
    </div>
  );
}

export default Termos;
