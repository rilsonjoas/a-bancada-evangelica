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
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero */}
      <section className="bg-gradient-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
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
        <div className="container mx-auto px-4 max-w-3xl space-y-6">

          <Card className="card-elevated">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Última atualização: 27 de agosto de 2026. Todo dado publicado nesta
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
                corrigido. Todos os valores publicados refletem a última auditoria
                automática e manual do pipeline.
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 dark:bg-green-950/30 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                <p className="text-sm">
                  <strong className="text-foreground">Última auditoria:</strong> 25 de agosto de
                  2026 — cruzamento da lista de membros da Frente Parlamentar Evangélica com a
                  lista oficial da Câmara (frente 54477).
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
                  <strong className="text-foreground">Correção:</strong> o flag de membro
                  passou a usar 3 fontes combinadas (lista oficial, autodeclaração e
                  imprensa), com a fonte registrada por parlamentar. 21 membros oficiais
                  inativos foram mantidos (filiação ≠ exercício).
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
            <CardContent className="pt-6 space-y-2">
              <p className="font-semibold text-foreground">Encontrou um erro? Avise.</p>
              <p className="text-muted-foreground text-sm">
                Qualquer pessoa — inclusive o próprio parlamentar — pode apontar um dado
                suspeito. Investigamos e, se confirmado, corrigimos publicamente.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  to="/contato"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  Reportar possível erro
                </Link>
                <a
                  href="https://github.com/rilsonjoas/a-bancada-evangelica/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-medium hover:bg-muted transition-colors"
                >
                  Abrir issue no GitHub
                </a>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Projeto independente, sem fins lucrativos — código aberto sob licença MIT
                (github.com/rilsonjoas/a-bancada-evangelica).
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default Errata;