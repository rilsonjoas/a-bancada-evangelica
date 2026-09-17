import { usePageMeta } from '@/hooks/usePageMeta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, FileWarning, Mail, History, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * H5 (2026-08-27): Errata pública.
 * Correções de dados anunciadas publicamente — sem correção silenciosa.
 * Hoje não há erro em aberto; o registro do processo e o histórico tornam
 * qualquer correção futura auditable.
 */
export function Errata() {
    usePageMeta("Errata Pública | A Bancada Evangélica", "Registro transparente de correções, auditorias e atualizações da base de dados.");

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero */}
      <section className="bg-gradient-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <FileWarning className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">
              Errata pública
            </h1>
            <p className="text-primary-foreground/90 mt-3">
              Correção silenciosa parece manipulação da verdade. Aqui, toda correção
              de dados do site é anunciada publicamente.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">

          <Card className="card-elevated">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Última atualização: 17 de setembro de 2026. Todo dado publicado nesta
                plataforma pode ser auditado conforme a{' '}
                <Link to="/metodologia" className="text-blue-600 hover:underline">
                  Metodologia
                </Link>{' '}
                e o{' '}
                <Link to="/dados" className="text-blue-600 hover:underline">
                  Dados Abertos
                </Link>.
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Por que uma errata pública?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                Este site nasce de votações nominais públicas e documentos oficiais.
                São fontes confiáveis, mas <strong>nenhum processo é infalível</strong>:
                uma pauta pode ser mal classificada, um voto pode ser atribuído ao
                parlamentar errado, uma lista de membros pode estar defasada.
              </p>
              <p>
                Quando um erro é encontrado e corrigido, o compromisso é fazer isso{' '}
                <strong>à luz do dia</strong>: registrar o que estava errado, o que
                passou a estar certo, quando a correção entrou no ar e por quê.
                Uma correção feita em silêncio — sem histórico — faz o leitor
                duvidar da própria nota, não do erro corrigido.
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Estado atual: nenhuma correção pendente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                Não há, neste momento, nenhum dado conhecido como incorreto e não
                corrigido. Todos os valores publicados passaram pela última verificação
                automática e pela revisão manual dos dados.
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 dark:bg-green-950/30 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                <p className="text-sm">
                  <strong className="text-foreground">Última auditoria:</strong> 17 de setembro de
                  2026 — auditoria de leitura dos textos públicos (ver histórico abaixo).
                  Auditoria anterior, 08 de setembro de 2026 — motor de cálculo das notas
                  revisado e corrigido; 25 de agosto de 2026 — cruzamento da lista de membros da
                  Frente Parlamentar Evangélica com a lista oficial da Câmara (frente 54477).
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Histórico de correções aplicadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">2026-09-17</Badge>
                  <span className="font-semibold text-foreground">
                    Auditoria de leitura — revisão de todos os textos públicos do site
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">O que estava errado:</strong> erros de
                  digitação ("Integridade Moral Moral"), frases que só faziam sentido para
                  quem programa computadores ("Execute os scripts de sincronização primeiro"),
                  rótulos diferentes para a mesma coisa ("TSE Receitas" em um lugar,
                  "DivulgaCandContas" em outro) e prazo de resposta de contestação diferente
                  em páginas diferentes (48 horas em um lugar, 15 dias em outro).
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Correção:</strong> revisão completa dos
                  textos. Prazo de contestação unificado em 15 dias. Quando um parlamentar não
                  comparece à sessão, o site agora mostra <strong className="text-foreground">"AUSENTE"</strong>
                  em vez de "ABSTENÇÃO" — o Congresso registra as duas situações e nós as
                  tratamos como o que são. Perfis com pouquíssimos votos classificados (menos
                  de 5) recebem o aviso de <strong className="text-foreground">"Base frágil"</strong>.
                  E o ranking passou a informar a data real da última atualização dos dados.
                </p>
              </div>
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">2026-09-16</Badge>
                  <span className="font-semibold text-foreground">
                    Indicador de "consistência" inventado para quem não tinha votos
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">O que estava errado:</strong> parlamentares
                  sem nenhuma votação registrada apareciam com "100% de consistência" — um
                  número que não vinha de nada real, era gerado automaticamente pelo sistema
                  antigo.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Correção:</strong> sem votações, não há
                  consistência a exibir, e o site mostra "sem votações registradas". Preferimos
                  não informar a mostrar número inventado.
                </p>
              </div>
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">2026-09-08</Badge>
                  <span className="font-semibold text-foreground">
                    Erro no cálculo das notas (afetou centenas de parlamentares)
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">O que estava errado:</strong> encontramos,
                  a partir de uma pergunta sobre o perfil de um senador, dois erros no
                  cálculo das notas. (1) O recálculo diário partia da nota do dia anterior em
                  vez do histórico fixo do partido — na prática, os votos eram contados de
                  novo todos os dias, e a nota só crescia ou só caía até estagnar. (2) O efeito
                  de cada voto era somado sem limite em vez de transformado em média — alguém
                  com muitos votos no mesmo tema estagnava em 0 ou 100 só pelo volume, não
                  pela posição real.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Impacto medido:</strong> antes da
                  correção, 98% dos deputados com voto estavam com nota travada em 0 ou 100 em
                  "Defesa da Família" e 100% em "Responsabilidade Social". Depois, 0% e 1%.
                  As notas de 495 dos 595 parlamentares mudaram nesta correção — a maioria delas
                  nunca tinha refletido voto real, era consequência de um erro na conta.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Correção:</strong> a nota de cada tema
                  agora parte sempre do histórico do partido calculado do zero, e o efeito de
                  cada voto é a média de todos os votos no tema, não a soma. O novo cálculo é
                  protegido por testes que garantem: repetir várias vezes dá o mesmo resultado,
                  e votos em grande quantidade não inflam a nota.
                  <span className="block mt-2 text-xs text-muted-foreground/70">
                    Detalhe de auditoria: <code className="text-xs bg-secondary px-1 py-0.5 rounded">recalculate-scores.ts</code>,{' '}
                    <code className="text-xs bg-secondary px-1 py-0.5 rounded">scripts/__tests__/scoring.test.ts</code>
                  </span>
                </p>
              </div>
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">2026-09-08</Badge>
                  <span className="font-semibold text-foreground">
                    89 parlamentares nunca tinham recebido o histórico do próprio partido
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">O que estava errado:</strong> 81 senadores
                  e 8 deputados (todos incorporados ao projeto depois da única sessão em que o
                  histórico dos partidos foi carregado — entre eles Silas Câmara, presidente da
                  própria Frente Parlamentar Evangélica) ficaram sem esse histórico: a nota
                  deles usava um valor genérico, igual para qualquer partido, em vez dos dados
                  reais do partido.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Correção:</strong> os 89 receberam o
                  histórico real do próprio partido.
                  <span className="block mt-2 text-xs text-muted-foreground/70">
                    Detalhe de auditoria: <code className="text-xs bg-secondary px-1 py-0.5 rounded">scripts/fix-never-seeded-scores.ts</code>
                  </span>
                </p>
              </div>
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">2026-08-25</Badge>
                  <span className="font-semibold text-foreground">
                    Correção de membro da Frente Parlamentar Evangélica
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">O que mudou:</strong>{' '}
                  AJ Albuquerque (PP-CE) foi removido do grupo "bancada evangélica" —
                  ele figurava na lista com base em declaração própria, mas a auditoria
                  contra a lista oficial da Câmara (frente 54477) mostrou que não
                  consta como signatário da frente.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Correção:</strong> a marcação de membro
                  passou a usar 3 fontes combinadas (lista oficial, autodeclaração e
                  imprensa), com a fonte registrada por parlamentar. 21 membros oficiais
                  inativos foram mantidos (ser membro não é o mesmo que estar em exercício).
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Como uma correção é anunciada
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed">
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong className="text-foreground">Confirmação:</strong> o erro é
                  cruzado com a fonte oficial antes de qualquer mudança.
                </li>
                <li>
                  <strong className="text-foreground">Registro prévio:</strong> a
                  correção entra neste histórico com data marcada para ir ao ar.
                </li>
                <li>
                  <strong className="text-foreground">Publicação:</strong> as notas são
                  recalculadas e o registro desta página é atualizado no mesmo fluxo.
                </li>
                <li>
                  <strong className="text-foreground">Fonte atualizada:</strong> o
                  documento de reprodutibilidade e os dados abertos apontam para a versão
                  corrigida.
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Protocolo de Solicitação de Retificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Qualquer pessoa — cidadãos, jornalistas, parlamentares ou assessorias — pode solicitar a verificação de um dado publicado.
                Para garantir imparcialidade, todas as solicitações são auditadas com base estrita nas fontes oficiais.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <strong className="text-foreground block font-medium mb-1">1. Fonte primária obrigatória</strong>
                  <span className="text-muted-foreground">Envie o link do diário da Câmara, Senado ou TSE que comprova a divergência.</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <strong className="text-foreground block font-medium mb-1">2. Análise em até 15 dias</strong>
                  <span className="text-muted-foreground">Conferimos o dado com a fonte e recalculamos a pontuação se a divergência for confirmada.</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <strong className="text-foreground block font-medium mb-1">3. Publicação pública</strong>
                  <span className="text-muted-foreground">Toda retificação aceita fica registrada nesta página com data e motivo.</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  to="/contato"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
                >
                  <Mail className="h-4 w-4" />
                  Enviar solicitação de retificação
                </Link>
                <a
                  href="https://github.com/rilsonjoas/a-bancada-evangelica/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-medium hover:bg-muted transition-colors text-sm"
                >
                  Abrir issue no GitHub
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default Errata;