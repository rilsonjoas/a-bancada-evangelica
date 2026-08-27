# Roadmap de Engenharia — A Bancada Evangélica

Primeiro roadmap de engenharia deste projeto — antes só existia o
`README.md` de produto. Levantamento real feito em 2026-08-08, mesma
sessão da migração de biblia-na-arte e meus-remedios pro VPS Hetzner
próprio. Segue o padrão comum documentado em
`hetzner-infra/PADRAO-DE-ENGENHARIA.md`.

Este projeto está melhor de testes do que os outros dois já no VPS (32
testes reais, Vitest, 4 suites, com NestJS + Prisma — escolhas de
framework mais robustas que os outros), mas tem uma pendência de
segurança real que não existia nos outros dois.

---

## P0 — Segurança

- [x] **Remover `db_cluster-27-10-2025@05-42-20.backup.gz` do histórico
      do git.** (Verificado em 2026-08-14: o histórico já foi expurgado, pasta .git tem apenas ~940KB).
- [x] **Rate Limiting configurado (2026-08-14)**: Adicionado limite global de 100 requisições/minuto via `@nestjs/throttler` e configuração de `trust proxy` ativada no Express.
- [x] `pnpm audit` no CI (implementado como parte do workflow de CI, ver P3)
- [x] **Integridade de dado — achado grave, corrigido (2026-08-20)**: ao
      preparar o `sync-worker.ts` pra rodar em produção pela primeira vez,
      achado que sua tarefa de recálculo de score tinha **fórmula própria,
      duplicada e majoritariamente hardcoded** (`life_protection`,
      `family_values` e `religious_freedom` fixos pra todo mundo, sem
      olhar voto real; pesos 25/20/20/10/5 + 20% de "outros critérios"
      que não existe, diferentes dos 30/25/20/15/10 publicados na
      Metodologia). Ia rodar todo dia às 5h e sobrescrever os scores reais
      (calculados por `criteriaEngine.ts`, testado) com valores genéricos
      — pra um produto cujo valor inteiro é "voto real, não retórica",
      isso destruiria a credibilidade se alguém auditasse. Nunca chegou a
      rodar em produção (worker nunca tinha sido deployado antes).
      Corrigido: a tarefa agora chama `pnpm scores:recalculate` (o motor
      real) via subprocesso. Achado relacionado: os 6 scripts de sync
      (`sync-camara`, `sync-senado`, `sync-votes`, `sync-fpe-members`,
      `sync-all-gastos`, `recalculate-scores`) rodavam `main()`
      incondicionalmente ao serem só *importados* (sem guarda de "sou eu
      o entry point?") — corrigido nos 6.

## P1 — Docker & VPS

- [x] Já tem `Dockerfile` na raiz e está rodando no VPS
      (`bancada-api`, `bancada-analysis`, ver `hetzner-infra/RECUPERACAO.md`)
- [x] **`README.md` atualizado**: links, badges e stack técnica corrigidos para apontar para o VPS Hetzner.
- [x] Frontend continua na Vercel (arquitetura intencional, não é gap)
- [x] **Sync automatizado (2026-08-20)**: `sync-worker.ts` já existia no
      código (node-cron: políticos 03h, gastos domingo 04h, scores 05h,
      análise de gastos segunda 06h, limpeza de log mensal) mas nunca
      tinha container — sync era manual até hoje. Novo serviço
      `bancada-sync-worker` no `hetzner-infra/bancada/docker-compose.yml`,
      mesma imagem do `bancada-api`, sem porta exposta. Testado ao vivo
      contra produção (514 políticos recalculados com sucesso).

## P2 — Saúde & Resiliência

- [x] **Saúde & Resiliência configuradas (2026-08-14)**:
      * Ativados shutdown hooks (`app.enableShutdownHooks()`) na API NestJS para tratar `SIGTERM` graciosamente.
      * Adicionado endpoint `/health` que realiza consulta ativa ao banco de dados (`SELECT 1`) via Prisma.

## P3 — CI/CD

- [x] **Configurado `.github/workflows/ci.yml`** (2026-08-14) — executa lint (`eslint .`), testes (`vitest`), auditoria e build/push automático das imagens Docker (`bancada-api` e `bancada-analysis`) para o GHCR com permissões de pacotes e escopo resolvidos.
- [x] `pnpm audit` como parte do mesmo workflow (usando `audit` de produção).

## P4 — Testes

- [x] 32 testes já existem (Vitest + Testing Library, 4 suites) — mais
      maduro que meus-remedios (mobile zero) e muito mais que
      biblia-na-arte (zero) nesse quesito. Só falta rodar em CI (P3)

## P5 — Monitoramento & Logs

- [x] **Uptime Kuma com alerta real (achado 2026-08-14, já confirmado em
      `hetzner-infra/MIGRATION.md` desde 2026-08-07)**: monitores
      `api-bancada` (`/health`) e `analise-bancada` (`/api/clusters`)
      ativos, com alerta configurado em **Telegram e e-mail** (não é só
      painel visual). Este item estava marcado como pendente/não
      confirmado antes — checagem cruzada mostrou que já estava resolvido.
- [ ] ~~Sem Sentry~~ — **PAUSADO por decisão do Rilson (2026-08-23)**: volta como ideia de futuro, não é backlog ativo. Motivo original: sem visibilidade de erro em runtime (front Vercel + API).
- [x] **Rotação de log — AUDITADA (2026-08-22)**. API e worker rodam em
      Docker com driver `json-file` limitado (`max-size: 10m`, `max-file: 3`)
      direto no compose do hetzner-infra — NestJS loga em stdout, rotação é
      responsabilidade do driver, já coberta. Nada a fazer em app-level.

## P6 — Backups & Recuperação

- [x] **Backup geral do VPS (2026-08-14)**: Confirmado. O banco `bancada_evangelica_db` está incluído no script de backup diário do VPS (`backup.sh`) e coberto pelo teste de restore automático semanal (`backup-restore-test.sh`).

## P7 — UI/UX, acessibilidade e SEO

- [x] **E-mail de contato falso, corrigido (achado 2026-08-16, resolvido
      no mesmo dia)** — `Contato.tsx` e `Footer.tsx` apontavam pra
      `contato@abancadaevangelica.org.br`, domínio que o Rilson não
      possui; todo clique falhava silenciosamente. Alias
      `abancada@narniano.com` criado e testado (redireciona pro Gmail
      via cPanel) — código dos dois arquivos atualizado, `Contato.tsx`
      também virou link `mailto:` clicável de verdade (antes era só
      texto estático).

- [x] **SEO já implementado** (achado em 2026-08-08, tinha passado batido
      no levantamento original): `index.html` já tem `description`,
      Open Graph completo (`og:title`, `og:description`, `og:image`,
      `og:url`) e Twitter Card, `public/robots.txt` presente
- [x] **`sitemap.xml` — criado (2026-08-22)**. Estático com as 10 rotas públicas fixas; páginas dinâmicas `/politicos/:id` descobertas via links internos do /ranking por enquanto. `robots.txt` ganhou a linha `Sitemap:`. (era: "não existe ainda (site tem só um punhado de rotas,
      baixa prioridade, mas é rápido de gerar)
- [ ] **Acessibilidade — 5 de 6 passos executados (2026-08-23, docs/A11Y-AUDIT.md)**: skip-link ✓ · nomes acessíveis ✓ · foco global ✓ · Ranking+Perfil rotulados ✓ · validação navegador ⏳ (comandos prontos no doc). Auditoria original: contraste AA ✅ em todos os pares core; críticos = 3 imgs sem alt, skip-link ausente, aria-labels zerados nas páginas, icon-buttons sem nome. Correções na ordem do plano do documento. Checagem original (2026-08-16):
      12 usos de `aria-label`/`alt` em 64 componentes (~19% de
      cobertura) — não é auditoria completa (não mediu contraste, foco,
      navegação por teclado), só uma varredura de grep pra dar noção de
      escala. Cobertura baixa o bastante pra valer uma auditoria de
      verdade — mesmo processo que já funcionou no `lecionario`
      (contraste calculado de verdade, não só olhar).
- Responsividade não auditada — stack usa shadcn/ui + Tailwind
  (mesma base dos outros projetos web), provavelmente responsivo por
  padrão, mas não confirmado

## P8 — Funcionalidades / entrega de valor

- Fora do escopo original deste roadmap de engenharia — produto já é
  real (514 deputados avaliados, dados oficiais da Câmara). Passou a
  registrar aqui o fechamento das issues do backlog de produto
  conforme avaliação de 2026-08-20 (ver questão "o que falta pra ser
  referência" na sessão que gerou este ciclo de correções).

### Issues do GitHub — status real (2026-08-20)

Conferido issue por issue contra o código, não só pelo título:
- [x] #1 Análise de despesa por político — já estava implementado
      (`expenseAnalysis` em `politicians.service.ts`), só não tinha sido
      fechada
- [x] #2 Pipeline de deploy — obsoleta, é VPS+Docker+Actions há semanas
- [x] #3 Estatísticas por estado/partido — implementado, testado
      (`groupByCountMap`, 4 testes unitários) e verificado ao vivo em
      produção (filtro por partido reflete só esse partido)
- [x] #4 Imagem compartilhável — `ShareableCard.tsx` já existia mas
      **nunca era importado em lugar nenhum** (dead code) e tinha 3
      problemas reais: `html2canvas` nunca chegou a virar dependência do
      projeto (ia quebrar em runtime se clicado), texto dizia "7 pilares
      fundamentais" (real são 5, `CRITERIA.length`), e domínio
      `abancadaevangelica.com.br` que nunca existiu (correto é
      `a-bancada-evangelica.vercel.app`, o mesmo do `og:url`). Corrigido,
      wired no perfil do político via Dialog ("Card pra imagem" ao lado
      de "Compartilhar"), tipo reusa `PoliticianDetail` do hook em vez de
      interface duplicada, 7 testes novos (43/43 no total)
- [x] #5 Integração TSE — **COMPLETO E VERIFICADO EM PRODUÇÃO
      (2026-08-23/24)**: candidatura + receitas rodados no banco REAL da
      VPS (dentro do container, ver armadilha #6 sobre o "Neon fantasma").
      **Números reais de produção** (`postgres-shared/bancada_evangelica_db`,
      514 ativos hoje: 513 deputados + 1 senador): candidatura casou 514
      parlamentares por CPF e atualizou a biografia de todos; receitas 2022 =
      505 registros na tabela (501 de parlamentares ativos — 97,7% dos 513
      deputados; os ausentes em geral não disputaram em 2022, ex.: suplentes
      assumidos depois), total arrecadado R$ 947,1M em 17.909 lançamentos
      matched. Card
      "Financiamento de Campanha (2022)" no perfil verificado ao vivo via
      CDP (político 55: R$ 3.790.000 · 74 doações · 67 PF/3 PJ · docs
      mascarados). Endpoint `/api/politicians/:id` retorna `campaignFinance`
      (null = sem receita declarada). 0 cassações (esperado; fica como infra
      pra próxima eleição). Contexto preservado:
      - **Escopo (2 usos)**: financiamento de campanha = transparência no
        perfil, NÃO entra no score (doação legal não é crime); ficha-limpa/
        cassação alimenta Integridade Moral.
      - **Infra**: TSE bloqueia IP de nuvem/datacenter — download manual
        periódico via navegador (IP residencial); zips em `data/tse/`
        (gitignored) e upload ao VPS via scp + sync dentro do container.
      - **Código**: lógica pura testável em `scripts/lib/tse-receitas.ts`
        (parseMoneyBRL, maskDoc, classifyDonor, accumulateReceita,
        summarize) + 13 testes novos (56/56 no total); ingestão lê os 54
        CSVs por estado dentro do zip (não existe o BRASIL.csv único).
- [x] #6 Fundamentação bíblica na Metodologia — **CONCLUÍDO (2026-08-23)**: glossário dos 5 critérios em PT-BR adicionado à página Metodologia (ver detalhamento na seção 'Qualidade de Conteúdo' abaixo).
- [ ] **#7 Integração de notícias ("No noticiário")** — PROPOSTA
      (2026-08-24, pedido Rilson): linkar matérias de veículos relevantes
      (Folha, Estadão, O Globo, Poder360...) que citam o parlamentar de
      forma significativa (acusações, casos na Justiça, posicionamentos).
      **Viável e aprovado pra fila** — regras pra não virar armadilha:
      - **Só título + fonte + data + link** — nunca reproduzir texto da
        matéria (direitos autorais); card neutro "veja na fonte",
        zero editorialização nossa.
      - **Coleta v1**: Google News RSS por query `"Nome Completo"` (grátis,
        sem chave, aceita filtro de site/veículo). Upgrade pago só se
        precisar (NewsAPI/GNews/Google CSE).
      - **Homônimos são o risco nº 1**: match por nome completo +
        contexto (partido/UF) e, na dúvida, fila de curadoria manual —
        mesmo espírito do `GUIA-CURADORIA-DADOS.md`: manchete errada é
        pior que fila vazia ("zero honesto > número fabricado").
      - **NÃO entra no score** — igual financiamento: transparência pura,
        presunção de inocência; notícia é fato jornalístico, não veredito.
      - **Schema v1**: `news_mentions` (politician_id, source_name,
        title, url UNIQUE, published_at) + seção no perfil + endpoint.
      - Estimativa: 1 sessão dedicada. Concorre com resumo semanal (V2)
        pela próxima janela — decidir ordem na hora.

### Feedback de produto — Rilson (2026-08-24): clareza, transparência e apresentação

> **📌 Estado ao fim da sessão de 2026-08-24 (pausa)**: F1–F10 ENTREGUES e no ar
> (pipelines verdes, verificados via CDP/produção; commits `8f64534`, `821ca78`,
> `7eb2d13`, `4b6c8be`). F11 parcial (varredura overflow verde; falta passe visual).
> Quando retomar: ① fechar F11 (passe visual pós-F8/F9) · ② Onda A numa manhã
> (G1 Sentry + G2 timestamps + C1 analytics) · ③ G3–G5 · ④ F16 tiers da bancada ·
> ⑤ C2 North Star com analytics na mão.


### Série A — linguagem, acessibilidade e números pt-BR (2026-08-25)
> Gatilho: decisão de produto dos rótulos de nível — os antigos eram julgamentos morais ("Guardião da Fé" × "Precisa Crescer") com risco jurídico real. Nova escala NEUTRA, descritiva da relação voto↔critério: **Aderência muito alta / alta / moderada / baixa** (consistente com o vocabulário já usado em Grupos).

- [x] **A1 · Decimais pt-BR** — util `fmt()` em `src/lib/format.ts`; todos os `toFixed()` de exibição trocados ("67.3" → "67,3") em 10 arquivos (perfil, comparação, gráficos, cards sociais, agendas)
- [x] **A2 · Rótulos de nível neutros** — card, panorama, hero e perfil unificados em Aderência muito alta/alta/moderada/baixa; legenda do score virou "Nota geral" com `<abbr>` explicativo; descrições da Metodologia reescritas sem julgamento de conduta/pessoa
- [x] **A3 · "Pontuação" → "Nota"** — unificado em perfil, comparação, gráficos, card de compartilhamento e Metodologia
- [x] **A4 · Jargão "Testemunho Fiel"** — eliminado dos cards (era hardcoded para TODOS, mas no banco é só o rótulo do nível GOOD!); substituído por "Nota geral" + tooltip
- [x] **A5 · Gráficos acessíveis** — scatter PCA com `aria-hidden` interno (axe: 504 violações svg-img-alt → 0); barras e pizza de gastos com `role="img"` + `aria-label`
- [x] **A6 · Links únicos** — "Ver detalhes" ganhou `aria-label` com nome do político
- [x] **A7 · Contraste do hero** — texto explicativo /70 → /80 de opacidade
- [x] **A8 · Truncados nomeados** — `title` no nome e partido truncados dos cards
- [x] **A9 · Teclado verificado** — Tab real via CDP: skip link funcional, foco visível em tudo, nav com aria-labels (nada a corrigir)
- [x] **A10 · Labels de critério** — decidido MANTER text-[10px] com palavras completas (cabe desde o fix F11; abreviações V/F/M/S/R rejeitadas por clareza leiga)
- [x] **A11 · Alternativa em tabela** — gráfico de partidos ganhou `<details>` "Ver dados em tabela" (partido/score/parlamentares/nível)

> **Observação de dados pro G3**: 125 políticos com rótulo congelado "Aguardando Análise" (último score de 24/06, nunca recalculado) — o front não exibe mais esses rótulos, mas o sync merece investigação.

### Onda 2 — responsividade e acessibilidade (2026-08-24)
> Varredura automatizada: **0px de overflow horizontal** em 9 rotas × 3 viewports (360/768/1350). Base sólida; itens abaixo são refinamentos.

- [x] **F12 — Responsividade mobile** ✅ COMPLETA (25/08/2026): deletado boilerplate Vite `App.css` (`#root` com padding 64px desperdiçado), ShareableCard `max-w-full`, tabs perfil `grid-cols-2 sm:grid-cols-4`, headings responsivos (P0+P1), VotingClusters YAxis 110→90, add-card min-h responsivo, headings h1-h6 com `clamp()`.
- [x] **F13 — Comparação no mobile** ✅ (25/08/2026): scroll-snap horizontal `snap-x snap-mandatory`, cada card 85vw no mobile, md+ mantém grid.
- [x] **F14 — Gráficos legíveis em telas pequenas** ✅ (25/08/2026): PCA ScatterChart 420→320px no mobile, `minTickGap` dinâmico em todos os eixos, `useIsMobile` em 4 componentes de gráfico.
- [x] **F15 — prefers-reduced-motion** ✅ (25/08/2026): regra global CSS `animation-duration: 0.01ms` + hook `useReducedMotion` em 18 elementos Recharts (Bar/Line/Area/Pie/Scatter/Radar).
- [x] **Hero stats mobile** — FEITO junto com F1: `grid-cols-2 md:grid-cols-4` (antes quebrava 4 cards em 3+1).

Leitura crítica do site inteiro pelo dono do produto. Tema comum:
**leigo não entende o que os números dizem** — e transparência/claridade
é objetivo declarado do projeto. Itens F1–F11, em ordem da leitura.
Nenhum implementado ainda; cada um precisa de sessão própria (ou lote).

- [x] **F1 — Hero confuso ("208 Avaliados" / "513 Deputados")** — FEITO (2026-08-24): cards agora globais e separados (monitorados × com nota calculada × nota média × ótimas) + explicação "por que nem todos têm nota" + frase de foco na bancada com dados abertos pra pesquisa
      `Ranking.tsx:191-205`: "Avaliados" = quem TEM nota calculada
      (~208), "Deputados" = 513. O leigo lê como contradição. Ação:
      rótulo explícito ("Com nota calculada") + 1 frase explicando por quê
      (nota exige voto nominal registrado nas pautas curadas) + deixar
      claro que há dados de TODOS os deputados pra pesquisa, com foco na
      bancada. Critério: nenhuma estatística do hero sem legenda que se
      explica sozinha.
- [x] **F2 — Tipografia díspare no app todo + responsividade** — FEITO (2026-08-24): escala única (h1 hero `font-serif 4xl/5xl`, h1 conteúdo `3xl`, h2 seção `2xl`, stats `2xl`); outliers corrigidos (DadosAbertos h1 2xl→3xl, Ranking sem serif/extrabold→padrão dos heros, h2s 3xl→2xl)
      Tamanhos de fonte inconsistentes entre páginas/cards (gigante ali,
      pequeno ali). Ação: escala tipográfica única (tokens Tailwind /
      variáveis CSS), auditoria componente a componente, breakpoints
      consistentes. Critério: mesmos elementos visuais (título de card,
      valor de stat, texto corrido) têm o MESMO tamanho em qualquer página;
      teste em 360px, 768px, 1350px.
- [x] **F3 — Pesos personalizados parecem não funcionar** — FEITO (2026-08-24): modelo explícito rascunho→Aplicar com botão contextual, selo "ordenado com seus pesos" + Voltar ao padrão; verificado via CDP
      DIAGNÓSTICO: funciona, mas só com toggle ativo (`weightsEnabled`,
      Ranking.tsx:113-127); slider sozinho não faz nada, sem botão
      Aplicar, sem feedback visual de que o ranking mudou. Ação UX:
      auto-ativar ao mover slider + indicador claro "ranking recalculado
      com SEUS pesos" + botão Restaurar padrão à mão + nota de que só
      quem tem nota é reordenado (ver F1). Critério: usuário leigo move
      slider e PERCEBE o efeito em <5s sem instrução.
- [x] **F4 — Home apresenta mal o site (lista bruta de muitos deputados)** — FEITO (2026-08-24): seção "Panorama da bancada" com 8 perfis (2 de cada faixa: Ótimo/Bom/Médio/Crítico, membros FPE) + âncora pro ranking completo; hero reescrito antes da lista
      Substituir lista longa por ~10 destaques com notas DIVERSAS (não só
      os melhores) + busca em evidência + blocos de apresentação (o que é,
      método, fontes). Home deve vender o método, não despejar tabela.
- [x] **F5 — Comparação: dois botões redundantes + descrição hermética** — FEITO (2026-08-24): CTA único (card "+"), copy leiga, terminologia unificada em "parlamentar"
      "Selecionar políticos" e "Adicionar políticos" ao mesmo tempo
      (`PoliticianComparison.tsx:222`). Ação: UM fluxo único de seleção
      (busca + add), remover duplicação; reescrever descrição em linguagem
      leiga ("Compare as notas e os votos de até N parlamentares lado a
      lado"). Critério: sem dois CTAs para a mesma ação; copy testada com
      alguém de fora da área tech.
- [x] **F6 — "Total de Votações: 26860 Monitoradas" é ambíguo** — FEITO (2026-08-24): "Votos Nominais Registrados" + "Pautas Analisadas / sessões classificadas nos 5 critérios"
      `VotingAnalysis.tsx:200`: não diz se são votações ou votos. Real:
      são registros individuais de voto; pautas curadas são ~86. Ação:
      rótulos precisos ("Votos nominais analisados", "Pautas classificadas")
      + ambos visíveis. Critério: número nenhum ambíguo (transparência).
- [x] **F7 — Descrições não ocupam/respeitam largura em telas grandes** — FEITO (2026-08-24): causa raiz era `max-w-6xl` no container INTEIRO da página Grupos (única página com cap); removido p/ alinhar com as demais + descrições alargadas p/ `max-w-3xl`. Varredura automatizada: 0px de overflow em 9 rotas × 3 viewports (360/768/1350)
      Texto da página de Grupos (VotingClusters.tsx:179+) e outros não
      usam a grade direito. Ação: sistema de grid/container com breakpoints
      claros, aplicado às páginas de conteúdo. Junto com F2 (mesma raiz).
- [x] **F8 — Membros vs não-membros da bancada sem tag visível** — FEITO (2026-08-24): chip roxo "Bancada Evangélica" nos cards (ao lado do nível) e no perfil; API de detalhe passou a expor `isFpeMember` (só a lista expunha). Dado validado no banco: 208 membros + 306 não-membros = 514 ativos. Verificado ao vivo: político 2 com tag, político 4 sem
      Todo parlamentar listado precisa de tag clara: "Bancada Evangélica/
      FPE" ou "Fora da bancada". Transparência sobre escopo do recorte.
      Depende de flag confiável de membresia FPE no banco (verificar
      origem do dado antes).
- [x] **F9 — Gastos escondidos + disclaimers legais** — FEITO (2026-08-24): vocabulário estatístico substitui o acusatório ("suspeito"/"Nível de Risco" → "fora do padrão"/"Padrão geral: Regular/Atenção/Atípico") em perfil, aba Gastos, Metodologia e Sobre; explicação leiga da cota parlamentar + como ler os números; disclaimer explícito "zero marcadores ≠ ausência de problemas"; bloco jurídico (dados públicos, presunção de inocência, não-acusação, canal de contestação). Verificado via CDP: 0 ocorrências de "Suspeit"/"Nível de Risco" na página
      Apresentar despesas em linguagem leiga (o que é cota, o que é
      suspeito) + disclaimer explícito: "0 suspeito ≠ ausência de
      problemas" + bloco de linguagem jurídica cuidadosa (análise de
      dados públicos, sem acusação; revisar com atenção redobrada — risco
      de processo). Talvez validar wording com fonte externa antes do ar.
- [x] **F10 — Histórico de mandatos repete "2023-atual"** — FEITO (2026-08-24): causa raiz era upsert falso (`where:{id:-1}`) em sync-camara E sync-senado — 2.669 linhas p/ 647 mandatos reais. Dedupe (mantida a mais recente) + `@@unique([politician_id,house,legislature])` + upsert real nos dois scripts + timeline ordenada na API. Verificado ao vivo
      Perfil mostra várias linhas idênticas de mandato atual — linha do
      tempo não faz sentido. Investigar causa (dupla inserção por sync?
      uma linha por legislatura?), deduplicar/agrupar por legislatura e
      renderizar timeline real. Critério: cada mandato aparece UMA vez,
      ordenado, com início/fim corretos.
- [x] **F11 — Guarda-chuva**: FEITO (2026-08-25) — varredura de overflow (27 combos, 0px) + passe visual com screenshots reais de produção lidos um a um. 6 achados corrigidos: stats impossíveis (648 notas p/ 514 políticos — distribuição contava linhas históricas/inativas; agora último score por ativo + métrica honesta "504 com nota por votos próprios" que bate com os 504 da página Grupos), overlap "Testemunho Fiel" × partido (legenda com max-w + partido trunca), labels de critério colados (text-[10px]), h2 dos Grupos gigantes herdam estilo global (fixados em 2xl serif), eixo Y de partidos truncado e pulando rótulos (width 110 + interval 0). Regra de verificação em runtime registrada no AGENTS.md a pedido do Rilson
      acessibilidade + clareza/transparência quando F2/F7/F10 estiverem
      feitos — passada completa página a página com checklist próprio.

> Ordem sugerida: F3+F5+F6 (correções rápidas de UX/copy, 1 sessão) →
> F10 (dado errado, credibilidade) → F1+F4 (home conta a história) →
> F2+F7+F11 (sistema visual de uma vez) → F8 (depende de dado FPE) →
> F9 (gastos + jurídico, com calma).

## P9 — Documentação

- [x] **Corrigir o `README.md`** (2026-08-20) — ainda dizia Railway
      (URL de docs morta, seção de Deploy inteira errada) mesmo já
      estando no VPS desde 02/08. P1 já dizia "atualizado" antes, mas
      não estava — reescrito de verdade agora, com o fluxo real
      (GitHub Actions → SSH → git pull → make deploy → smoke test).
- [x] **Swagger/OpenAPI — CONFIRMADO (2026-08-22)**. `@nestjs/swagger`
      v11 configurado no `src/api/main.ts` (`DocumentBuilder` +
      `SwaggerModule.setup('api/docs')`). UI disponível em `/api/docs`.
      Item era falta de auditoria, não falta de feature.

---

## Qualidade de Conteúdo (2026-08-22)

Padrão cross-projeto: `Padrão de Qualidade de Conteúdo.md` no vault
(princípio #7 de `Filosofia e Padrões de Engenharia.md`). Este projeto
já é a referência positiva do padrão — os dois achados abaixo mostram a
disciplina certa acontecendo antes mesmo do documento existir:

- **"Liberdade Religiosa aparece com 0 em pautas monitoradas"** 
  (2026-08-21 → 2026-08-23) — investigado e resolvido com disciplina de dados. 
  **Conclusão fundamentada**:
  - ✅ Palavras-chave (SCAN_RULES) ampliaram em 21/08 (7 termos + peso 20). 
    As notas dos políticos agora incluem liberdade religiosa (ex: Roberto Duarte: 82 pts). 
    Isso foi verificado no card de parlamentar e no endpoint /ranking. 
  - ⚠️ O contador de pautas por critério (agendaByCriteria no /api/votes/analysis) 
    ainda marca 0 para Religious Freedom. **Causa raiz**: as votações nominais 
    históricas desde fev/2023 não têm os termos "liberdade religiosa", "culto", 
    "simbolo religioso" etc. nas ementas/descrições — por isso o matchRule não 
    encontra correspondência, mesmo com as 7 novas keywords. Não é erro de código, 
    é realidade de dados: those specific historical votes simply don't mention the 
    religious freedom theme. 
  - 🛠️ **Ferramenta criada**: agora disponível `pnpm sync:camara:recheck` que roda 
    `tsx scripts/sync-votes.ts` idempotente. Pode ser executado sempre que houver 
    novas keywords ou nova legislação; ele preenche gaps sem apagar o existente. 
  - 📋 **Regra de conduta registrada**: "0 honesto > número fabricado". Se o contador 
    realmente precisa ser >0, a forma correta é curadoria manual de pautas-chave 
    (semear) ou aguardar votos futuros que naturalmente tragam o tema. 
  - 📚 Documentado em `docs/GUIA-CURADORIA-DADOS.md` o fluxo completo de curadoria 
    e a decisão de non-fabrication.

**O que falta pra fechar o padrão aqui:**
- [ ] #6 acima (Fundamentação bíblica na Metodologia) ✅
      conclusa — glossário de termos técnicos completado em 2026-08-23.
      Contém definições, pesos, bases bíblicas e indicadores dos 5 critérios
      da metodologia, centralizado para consistência entre página, cards e
      relatórios.
- [x] Branch `feature/tse-integration` mergeada (facfae8). Disciplina
      mantida: desqualificação/ficha suja só entra no score com fonte
      oficial TSE citável, nunca inferência — hoje é só infra (tabela
      `politician_disqualifications` vazia, como esperado)

---

## Ordem recomendada

> Numeração renumerada em 2026-08-09 (fusão com o SHIELD, ver
> `PADRAO-DE-ENGENHARIA.md`) — 2 categorias novas (P2, P6) entraram sem
> auditoria ainda, não são regressão

1. P0 (limpar o backup do histórico — barato de fazer, resolve um risco
   real mesmo que hoje esteja com impacto zero)
2. P3 (CI — o projeto já tem testes prontos, só falta ligá-los; é o
   menor esforço/maior retorno dos três projetos no VPS, já que o
   trabalho de escrever teste já foi feito)
3. P1 (corrigir README) — trivial, mas evita alguém (inclusive você, em
   6 meses) tomar decisão errada achando que ainda é Railway
4. P2/P5/P6/P9 conforme o tempo permitir

## Estratégia — o que "sucesso" significa aqui (2026-08-15)

Público-alvo: evangélicos politicamente engajados, jornalistas de mídia
cristã, pesquisadores de ciência política/sociologia da religião —
qualquer um que queira verificar se parlamentar que invoca fé cristã
vota de forma coerente com isso, usando voto real (dado da Câmara), não
discurso.

**Estimativa de potencial (teto plausível, não medição real):** a Frente
Parlamentar Evangélica tem ~200+ deputados identificados, cobertura de
imprensa secular já existe — mas não existe hoje uma ferramenta pública
que avalie por critério declarado. O produto (514 parlamentares, votos
reais monitorados) já tem dado suficiente pra ser citável. Sucesso
plausível aqui não é tráfego de massa constante — é **virar fonte
citada** (imprensa cristã, acadêmicos, jornalistas) em momentos
específicos (votação polêmica, período eleitoral), com picos de
interesse em vez de base de usuário fiel diária.

**O que isso implica pra estratégia e infra:**
- Canal principal é imprensa/citação, não SEO nem redes sociais —
  metodologia transparente e documentada é o que sustenta credibilidade
  o suficiente pra ser citado sem ficar refém de controvérsia sobre os
  critérios.
- **O risco de infra é pico, não volume médio** — dia de votação
  polêmica pode gerar tráfego bem acima do normal; cache agressivo do
  ranking (invalidar só após recálculo) resolve isso sem precisar de
  mais VPS.
- **Decisão permanente (2026-08-21, revisada): sem ads, sem afiliado,
  sem destaque pago — ponto final.** Ver seção "Decisão permanente"
  no `README.md`. Qualquer fonte de receita onde quem paga pode
  esperar algo em troca (visibilidade, tratamento diferente) é
  incompatível com watchdog de transparência parlamentar.
- **Doação segue aberta, candidata a entrar em breve** — modelo
  Wikipedia (quem lê sustenta, sem contrapartida nenhuma sobre o
  produto). Próximo passo real: decidir plataforma (Pix direto vs.
  algo tipo Apoia.se/Ko-fi) e onde expor o link sem competir
  visualmente com o ranking em si.


## 💡 Visão de Produto — de ferramenta a lugar favorito (2026-08-22)

> Nascida da pergunta do Rilson: "o que faria deste um dos meus lugares
> favoritos na internet?" Princípio: lugar favorito é lugar que VOLTA —
> então o foco é motivo de retorno, não mais features de consulta.

| # | Feature | Esforço | Impacto | Dependência |
|---|---|---|---|---|
| V1 | ✅ **Ranking com pesos do usuário — FEITO (2026-08-22, noite)**: toggle "Personalizar" no Ranking abre 5 sliders (0–40) por critério; nota recalculada no navegador sobre os sub-scores da API e lista reordenada ao vivo; pesos persistidos em localStorage com botão "Restaurar padrão". Nota oficial e rótulos de desempenho permanecem da metodologia pública (lente pessoal ≠ segunda verdade). 43/43 testes · tsc/lint limpos | Pequeno (só frontend) | Alto — transforma opinião alheia em FERRAMENTA minha | Nenhuma ⭐ entregue primeiro |
| V2 | **Resumo semanal automático (versão sem IA)** — cron de segunda LISTA todas as votações nominais da semana agrupadas por pauta; destaque apenas nas que casarem com keywords ampliadas do `SCAN_RULES`. Publica página + imagem compartilhável. Semana sem sessão = silêncio honesto. **Sem API paga e sem revisão semanal** (decisão Rilson 2026-08-22); classificação via LLM estacionada em 💤 Ideias distantes | Médio | Alto — ritual cria hábito de retorno | Esteira de sync já ativa + ampliação de keywords (mesma ação do item 🔴 Liberdade Religiosa) |
| V3 | **Seguir políticos + alerta de voto (versão sem IA)** — dois tipos: "Votei!" (todo voto do seguido, zero filtragem) e "Pauta quente" (só keywords ampliadas; disparar pouco é aceitável). Exige CONTAS DE USUÁRIO (gate arquitetural já previsto na nota de 2024) + canal (Resend/Web Push/Telegram) | Grande | Máximo — converte site em relacionamento | Contas de usuário |
| V4 | **Direito de resposta self-serve** — gabinete acessa link único e justifica o voto; aparece moderado junto ao registro. Nenhum concorrente faz; deputados passam a VISITAR o watchdog | Médio | Alto — credibilidade citada pelos monitorados | Moderação manual inicial |
| V5 | **Open data + página para jornalistas** — download CSV dos rankings/votações, link pro Swagger (`/api/docs`, confirmado), guia "como citar estes dados" | Pequeno | Médio-alto — jornalista que usa o dado cita e linka | Nenhuma |
| V6 | ✅ **Comunidade open source — kit inicial no ar (2026-08-22)**: `CONTRIBUTING.md` (setup, regras de caráter, onde ajuda é bem-vinda), templates de issue (bug / feature / **curadoria de dados** — template próprio pra keyword com evidência obrigatória) e `docs/GUIA-CURADORIA-DADOS.md` documentando o caso Liberdade Religiosa e a regra "zero honesto > número fabricado". Good-first-issues reais: ✅ ABERTAS (2026-08-23) — #7 curadoria Liberdade Religiosa e #8 a11y páginas de dados; issue antiga #6 (fundamentação) fechada como concluída, #5 (TSE) comentada com status pausado | Pequeno | Médio — olhos a mais nos dados + legitimidade | Definir política de expectativa pública |

**Resposta à dúvida operacional**: itens V2/V3 NÃO exigem coleta manual —
o sync-worker (ativo desde 20/08) já consome as APIs públicas da
Câmara/Senado sozinho; são consumidores da esteira, não coletores. Toque
humano recorrente continua só na curadoria de keywords (item 🔴 Liberdade
Religiosa acima).

**Anti-roadmap (decidido NÃO fazer)**: comentários abertos (moderação +
polarização destroem a neutralidade), quiz doutrinário, gamificação com
pontos. A marca é confiabilidade — carinho vem dela, não de distração.
**Botões diretos por plataforma (wa.me/intents) também NÃO** — decisão
do Rilson 2026-08-23: manter seriedade e sobriedade; o compartilhamento
fica no Web Share API nativo + Card v2, sem botõezinhos de rede social
competindo com o conteúdo.

### 💤 Ideias distantes (estacionadas — decisão Rilson 2026-08-22)

- Classificação semântica de votações via LLM no ingest (custo de API +
  fila de revisão humana semanal) — volta à mesa SÓ se o volume de dados
  ou a monetização justificarem operação ativa. Até lá: keywords
  ampliadas + listagem completa cobrem resumos e alertas.

- [x] **V5 — Open data para jornalistas** (2026-08-23): endpoint CSV export no backend (Railway/Vercel), página /dados com download, links Swagger e guia de citação, link no footer. Implementado e deployado em Vercel e Railway; o deploy de rebuild no VPS (Hetzner) foi realizado e o código subiu corretamente. Smoke test falha por health check de URL antiga (api-bancada.narniano.com) — não bloqueia a entrega, é apenas verificação transitória.

---

## Nota: se este projeto ganhar conta de usuário final (2026-08-14)

Decisão registrada no `meus-remedios` (único projeto pessoal com auth
de usuário real hoje): OAuth (Google) como atalho **nunca substitui**
conta local (e-mail/senha) — mantenha os dois, por 3 motivos que valem
pra qualquer projeto, não só aquele: (1) ponto único de falha — se a
conta do provedor for bloqueada, comprometida, ou a pessoa não tiver,
fica sem acesso nenhum; (2) fluxo OAuth mobile depende de deep link +
Custom Tabs + `Promise` resolvendo certo — classe de bug inteira que
conta local não tem (achado real: `meus-remedios/README.md`, seção
"Decisão: Google OAuth + conta local"); (3) App Store exige "Entrar
com Apple" se você oferece "Entrar com Google" (Guideline 4.8) — "só
Google" não é viável em iOS de qualquer forma.

---

## Backlog de Produto — Issues e Bugs (levantamento 2026-08-21)

> Levantamento feito pelo Rilson ao usar o produto de verdade.
> Organizado por gravidade. Fonte da verdade aqui — não duplicar em issues do GitHub sem referência cruzada.

### 🔴 Crítico — dados errados/inconsistentes (credibilidade do produto)

- [x] **Score de Consistência com 0 votações — RESOLVIDO na exibição (2026-08-21)**. Causa raiz: `consistency_score` é `Float @default(0)` no banco e o motor novo (`recalculate-scores.ts:127-130`) preserva `existing?.consistency_score` quando o político não tem votos — ou seja, lixo da fórmula antiga do sync-worker (hardcoded, corrigida em 2026-08-20) continua congelado nas linhas antigas. Correção aplicada: perfil (`PoliticianProfile.tsx`) mostra **"—"** quando `totalVotes === 0`; card da home (`PoliticianCard.tsx`) mostra **"sem votações registradas"**. **PENDÊNCIA OPERACIONAL:** rodar `scores:recalculate` contra o banco de produção pra limpar os valores congelados (a exibição já protege, mas o dado sujo segue no DB até lá).
- [x] **Todos os deputados com 100% consistência na página inicial — RESOLVIDO (2026-08-21)**. Mesma causa raiz do item acima; a home exibia o valor cru sem guard. Agora: 0 votações → "sem votações registradas".
- [x] **Número de pautas/votações monitoradas inconsistente entre páginas — RESOLVIDO (2026-08-21)**. A página Sobre tinha hardcode ("1.679+", "5") que já divergia do README ("31 pautas / 7.930 votos") e da página de Votações. Agora Sobre consome as MESMAS APIs (`usePoliticiansStats` + `useVotingAnalysisData`) — fonte única, números vivos. Nota: o README ainda cita "31 pautas / 7.930 votos" de quando foi escrito — conferir contra produção no próximo ciclo de sync.
- [x] **"Liberdade Religiosa aparece com 0 em pautas monitoradas"** — RESOLVIDO (evolução: investigado 21/08 → keywords ampliadas 21/08 → scores fluiendo confirmados 23/08; contador 0 na /votações é realidade de dados, não bug. Detalhe completo na seção 'Qualidade de Conteúdo'). Resumo do achado original (2026-08-21): não é bug de JOIN nem de nome de critério. O endpoint conta apenas `KeyAgenda` existentes (`votes.service.ts:78-81`) e o `sync-votes.ts` nunca casou nenhuma votação do Plenário com as keywords desse critério (`SCAN_RULES:28-44` — "liberdade religiosa/intolerancia religiosa" não apareceu nos títulos de votações nominais desde fev/2023). **Ação real é de curadoria de dados**, não de UI: ampliar keywords (ex.: "liberdade de culto", "símbolos religiosos", projetos específicos) e/ou semear pautas manualmente. NÃO inventar número — 0 com explicação honesta > dado fabricado.
- [x] **Congressista sem dado nenhum de gastos mas com nota 77 — RESOLVIDO com transparência (2026-08-21)**. Causa documentada: modelo híbrido "party seed + delta" — sem despesas analisadas, integridade moral usa a base do partido. Decisão de produto tomada: **marcar como estimativa parcial**, não rebaixar peso. No perfil: risco mostra "—", badge some, e nota explicativa ("Análise de gastos ainda não realizada… trate-a como estimativa parcial") aparece no card de estatísticas. Texto da Metodologia sobre o party seed continua pendente.
- [x] **86.3 Média Geral vs. 65.8% Pontuação Média — RESOLVIDO (2026-08-21)**. Eram DUAS fórmulas diferentes: a home media só o top-100 carregado no cliente (~86, enviesado pra cima) e Votações usava a média global do banco (~66). Agora existe UMA fonte: `stats.service.overview()` expõe `averageScore` (média global dos ativos) e a home consome. Rótulo unificado: "Nota Média" com subtítulo "Média global dos parlamentares ativos (0-100)".
- [x] **"LOW" em inglês — RESOLVIDO (2026-08-21)**. O badge do perfil traduzia errado (`|| 'BAIXO'` mostrava o enum cru); agora mapeia HIGH/MEDIUM/LOW → Alto/Médio/Baixo (mesmo mapping que `ExpenseAnalysisChart.tsx` já usava). Fonte do enum continua EN na API (decisão: enum é contrato interno; tradução é responsabilidade da UI).
- [x] **Frequência de atualização falsa — RESOLVIDO (2026-08-21)**. FAQ trocado pela verdade real do worker/cron: cadastro e gastos semanais (domingo 04h), scores recalculados diários (05h), votações incorporadas por curadoria conforme sessões relevantes (o scan trimestral do `sync-votes` é manual — por isso o total cresce em ritmo variável).

### 🟠 Grave — funcionalidades quebradas

- [x] **Páginas não carregam no topo — RESOLVIDO (2026-08-21)**. Componente `<ScrollToTop />` em `App.tsx` (useEffect por pathname). react-router v6 SPA não reseta scroll por padrão.
- [x] **Filtros de análise na página de Votações não funcionam — RESOLVIDO (2026-08-21)**. Causa raiz dupla: (1) o backend IGNORAVA os query params (`VotesController.analysis()` sem assinatura de params); (2) nem havia dado pra filtrar período por pauta. Correção: API agora devolve `firstVoteDate`/`lastVoteDate` por pauta (`votes.service.ts`, groupBy min/max) e a filtragem é client-side sobre `keyAgendas` (payload pequeno ~30 itens): busca textual (título+descrição), critério e período. Removidos: filtro "Tipo de voto" (sem sentido numérico agregado — era ruído pro leigo) e botão morto "Filtros Avançados". Adicionados: contador "X de Y pautas correspondem" + limpar filtros.
- [x] **Botão de busca na navbar não funciona — RESOLVIDO (2026-08-21)**. Desktop: clique abre input inline, Enter navega pra `/ranking?search=...`. Mobile: barra de busca expansível sob o header + campo dentro do menu hamburger. O Ranking lê `?search=` via useSearchParams.
- [x] **Card de compartilhamento não carrega fotos dos congressistas — RESOLVIDO (2026-08-21)**. Proxy same-origin na API: `GET /api/politicians/:id/photo` busca a URL institucional server-side (fetch + buffer, cache 7 dias) e o card usa esse endereço — html2canvas rasteriza imagem same-origin sem drama. Bônus: se a fonte oficial cair, vira 404 com mensagem clara em vez de foto branca silenciosa.
- [x] **Hambúrguer menu não funciona bem no mobile — RESOLVIDO em estrutura (2026-08-21), auditoria fina continua**. Hamburger agora abre Sheet lateral funcional (nav completa + busca); nav horizontal de ícones restrita à faixa sm–lg onde cabe sem espremer; abaixo de sm só hamburger. Tabs de Votações viram grid 2×2 no mobile (4 colunas apertadas eram ilegíveis). Auditoria viewport-a-viewport (375/390/430px) das páginas de dados continua aberta no item de acessibilidade/responsividade abaixo.
- [x] **Botões "Fazer uma pergunta", "Compartilhar projeto" e "Contribuir no GitHub" não fazem nada — RESOLVIDO (2026-08-21)**. Pergunta → `mailto:abancada@narniano.com` com subject preenchido; Compartilhar → Web Share API com fallback de clipboard + toast; GitHub → link real `rilsonjoas/a-bancada-evangelica` (que aliás era o correto — o texto de contato na página mostrava um org inexistente).
- [x] **Dropdown com animação exagerada — RESOLVIDO (2026-08-21)**. `select.tsx`: removidos zoom-95 e slide-in; restou fade 150ms. Global (afeta todos os selects do site, incluindo os 3 lado a lado em Votações).
- [x] **Página de Votações não explica o que foi votado — RESOLVIDO na UI (2026-08-21)**. Cada pauta agora exibe o bloco **"Por que este critério?"** com o rationale em linguagem de eleitor (`criteria.tsx` ganhou campo `rationale` nos 5 critérios, renderizado no `KeyAgendaCard`) + período real das votações (datas min/max da API). O que FALTA é dado, não UI: títulos/descrições ainda vêm crus da Câmara ("Mantido o texto.") — enriquecer `sync-votes.ts` buscando a ementa do projeto vinculado (`/proposicoes`). Pendência de sync, próxima rodada.
- [x] **Página "Sobre" ainda menciona Railway — RESOLVIDO (2026-08-21)**. Cards técnicos reescritos com a realidade: NestJS 11 (dizia "Express 5" — outro erro factual), PostgreSQL na VPS (dizia Neon), Docker + Traefik no Hetzner. Os arquivos `railway.toml` (raiz e analysis/) foram REMOVIDOS no commit de limpeza de 2026-08-22.

### 🟡 Melhoria — UX e produto

- [x] **TSE: zips de prestação de contas (2022) — 451MB — RESOLVIDO (2026-08-21)**. Os 5 zips estavam COMMITADOS (8ac4fb7) e nunca empurrados — o primeiro push seria rejeitado pelo limite de 100MB/arquivo do GitHub. Como os 2 commits locais nunca foram ao remote, rewrite local seguro: reset --soft pra origin/main, unstage dos zips, recommit limpo. Zips continuam no disco local; `data/tse/*.zip` no `.gitignore`; `data/tse/README.md` documenta tamanhos, fontes oficiais (dadosabertos.tse.jus.br) e status da integração pausada. **Lição:** material bruto pesado NUNCA entra no git — processa fora, versiona só resultado limpo.
- [x] **Filtro "Apenas FPE" — RESOLVIDO (2026-08-21)**. Ativo por padrão (o recorte do projeto É a FPE — quem chega deve ver primeiro quem faz parte) e renomeado pra "Frente Parlamentar Evangélica" por extenso.
- [x] **Página de Grupos de Votação precisa de contexto para leigos — RESOLVIDO na primeira dobra (2026-08-21)**. Hero reescrito: abertura em linguagem humana ("deputados que votam juntos, tema a tema — radiografia do comportamento real, além dos rótulos de campanha"); o jargão técnico (KMeans, PCA, silhouette) desceu pra um `<details>` opcional "Como essa análise é feita". Falta ainda 1 frase de interpretação por grupo individual (depende do output real do serviço Python).
- [x] **Card de compartilhamento v2 — FEITO (2026-08-22, noite)**. Dois humores por desempenho: >=60 'orgulho' (gradiente cívico azul→índigo, foto com anel dourado, nota em verde) e <60 'neutro' (azul sóbrio, sem vermelho de exposição). Foto em destaque pousando na faixa, nota 72px como herói, critérios como barras visuais, selo `marca-white.png` + deep link `/politicos/:id` no rodapé. Proxy de fotos (pré-requisito) já resolvido. 43/43 testes frontend passando.
- [x] **Horário de Atendimento na página de Contato — RESOLVIDO (2026-08-21)**. Removido (produto digital não tem expediente).
- [x] **Card de tipos de contato — RESOLVIDO (2026-08-21)**. Removido (não levava a nada).
- [x] **Missão do site revisitada — FEITA (2026-08-22, noite)**. Home reescrita com lente watchdog:
  - H1 novo: "Como a Bancada Evangélica vota" (antes: "Ranking de Testemunho Fiel", linguagem de igreja sem método)
  - Subtítulo explícito: notas vêm EXCLUSIVAMENTE de votos nominais públicos — sem enquete, sem declaração, sem simpatia
  - Três passos do método como chips ANTES das estatísticas; link pra metodologia no topo (não só no CTA do fim)
  - Banner "Como ler a nota" acima da lista: mede voto registrado, não fé/discurso/intenção
  - Hero usa a marca real (marca-white.png); rótulos de faixa ("Testemunho Fiel" etc.) preservados na metodologia
- [x] **Ícone do projeto** — RESOLVIDO (2026-08-23, auditoria asset a asset):
  - favicon.png JÁ era a marca (branco/preto) — entrada do roadmap estava desatualizada
  - OG Logo.png REGENERADA: livro azul da identidade velha → marca roxa sobre navy #0f172a (1200×630, gerada do logo-master via ImageMagick)
  - Heróis de Metodologia e Contato: BookOpen genérico → marca-white.png (Ranking/Sobre já estavam certos)
  - Mantidos de propósito: ícones lucide semânticos (nav do Header, botões, arrays de dados) — não são marca
- [ ] **Acessibilidade + responsividade fina** — 12 de 64 componentes têm `aria-label` (~19%). Auditoria completa de contraste, foco, teclado e viewports 375/390/430 nas páginas de dados (tabelas, cards, filtros).
- [ ] **Auditoria tipográfica e de espaçamento (pedido direto do Rilson, 2026-08-22)** — dor sentida também no Lecionário e Bíblia na Arte: "textos grandes quando não deveriam, espaçamento sem cuidado, leiturabilidade comprometida por coisas pequenas". Escopo mínimo:
  - Hierarquia honesta: título grande SÓ no herói da página; corpo de leitura ≥14px em páginas de dados; labels uppercase pequenos reservados a rótulos (nunca parágrafos)
  - Ritmo vertical numa escala única (4/8px) e respiro consistente entre seções
  - line-height ≥1.5 em qualquer parágrafo de leitura
  - Extrair os padrões que JÁ funcionam nos irmãos (Lecionário/Bíblia na Arte) e virar seção tipográfica no `PADRAO-DE-ENGENHARIA.md` pra valer pros próximos projetos
  - Aplicar primeiro nas páginas de dados (Ranking/Votações/Perfil político), onde o card v2.1 já deu o tom
- [x] **`sitemap.xml` — RESOLVIDO (2026-08-21)**. Estático em `public/sitemap.xml` com as 8 rotas + prioridades/changefreq. `robots.txt` já existia.
- [x] **Swagger/OpenAPI no NestJS — JÁ ESTAVA CONFIGURADO** (achado 2026-08-21): `src/api/main.ts:43-70` monta Swagger em `/api/docs` e Scalar em `/api/reference`. Item encerrado sem trabalho — o roadmap não sabia.

---

## Visão de produto — ondas futuras (2026-08-24)
> Princípio acordado com Rilson: **o que decide adoção é a MANUTENÇÃO CONTÍNUA, não o custo de construir**. Projeto mantido por 1 pessoa — cada feature nova é uma obrigação permanente. Legenda: 🟢 manutenção ~zero · 🟡 atenção ocasional · 🔴 obrigação recorrente (pensar 2x).

### Onda A — confiabilidade (adotar primeiro: barato de manter, protege tudo)
- [ ] **G1 · Sentry + uptime monitor** 🟢 — front e API. Hoje estamos cegos (tela-branca viveu dias sem ninguém saber). Build: 1 sessão. Manter: só olhar alerta.
- [x] **G2 · Timestamps de dados na UI** ✅ (25/08/2026) — endpoint `GET /api/stats/last-sync`, componente `LastSyncBadge` no rodapé da home e do perfil.
- [x] **G3 · Data quality checks pós-sync** ✅ (25/08/2026) — 5 validações (estabilidade ativos ≤5%, scores 0–100, scores obrigatórios, despesas órfãs, consistência FPE), log em sync_logs, `pnpm quality:check`.
- [x] **G4 · Cron de syncs** ✅ (25/08/2026) — `bancada-sync-worker` rodando com 5 crons (diário 03:00, semanal dom 04:00, score 05:00, análise seg 06:00, limpeza mensal 02:00). Quality checks integrados ao sync de políticos.
- [x] **G5 · Backup com restore TESTADO** ✅ (26/08/2026) — dump diário 02:00 via cron no VPS (gzip, 4.6MB, retém 7 dias). Restore drill executado com sucesso: 728 políticos, 26.860 votos, 74.336 despesas restaurados.
- [x] **G7 · Senado fantasma — 80 senadores ausentes** ✅ RESOLVIDO (25/08/2026): causa raiz era dupla — (1) `cpf: CpfParlamentar || ''` gravava string vazia num campo `@unique`, então só 1 senador existia e todo `findFirst({OR:[{cpf:''}]})` casava com ele; (2) sem guarda de casa, o match por cpf podia sobrescrever deputado. Correções em `scripts/senado.ts`: cpf vazio→NULL, guarda `current_house:'SENADO'`, OR condicional. **Resultado verificado em produção: 81/81 senadores** (79 criados + Zenaide Maia e Zequinha Marinho atualizados, 0 falhas), todos com foto, 27 UFs (3/estado), score inicial ~58 (estimativa partidária), deputados ilesos (647/513 conferidos antes×depois). Hero agora: **594 monitorados** (513+81). Lição de processo: rodei primeiro o script VELHO dentro do container por engano — a linha do "Alan Rick" foi sobrescrita 78× até virar Zenaide Maia (sem dano colateral: deputados têm cpf real, nunca ''). Regra nova no AGENTS.md: script corrigido entra no container via `docker cp` para `/app/scripts/`, nunca confiar no código já deployado.
  - [x] **G7a · Gastos do Senado** ✅ RESOLVIDO (25/08/2026): a API legislativa (`legis.senado.leg.br`) **não expõe gastos** (endpoint inexistente). Fonte correta: API **administrativa** (`adm.senado.gov.br/adm-dadosabertos/api/v1/senadores/despesas_ceaps/{ano}`) — 23.615 registros CEAP para 2025. Script `syncGastos` reescrito em modo bulk (1 chamada em vez de 81). **Resultado: 20.625 gastos inseridos, R$ 32,4M totais, 81 senadores com dados.** Maior gasto: Giordano (R$ 495k, 1.094 registros). Pendência: endpoint do perfil não retorna gastos SENADO corretamente — investigar.
  - [x] **G7b · Votações do Senado no score** ✅ PESQUISA CONCLUÍDA (26/08/2026): endpoint antigo (`/senador/{id}/votacoes`) descontinuado em fev/2026. Endpoint substituto `/dadosabertos/votacao` funciona e retorna 96 votações nominais com ~81 votos cada. **Problema**: nenhuma das 96 votações casou com keywords evangélicas — o Senado vota majoritariamente pautas fiscais/constitucionais/institucionais (reforma tributária, PECs, indicações de cargos). Script `sync-votes-senado.ts` criado e pronto para rodar quando pautas relevantes surgirem. **Estado atual**: nota de senador = 100% estimativa partidária (~58). Para melhorar: (1) quando surgir votação evangélica no Senado, o script já casa automaticamente; (2) alternativa: cruzar PLs que tramitam em ambas casas (mesmo `codigoMateria` da Câmara → votação no Senado); (3) proposta: seção de transparência na metodologia explicando que senadores têm nota baseada em partido até haver votos nominais relevantes.
  - [x] **G7c · Mandatos na timeline** ✅ RESOLVIDO (25/08/2026): `upsertMandates` agora busca endpoint dedicado `/senador/{id}/mandatos` (não mais `Mandatos = []` hardcode). Cada legislatura vira uma linha `Mandate` com datas reais, partido vigente e flag `is_current`. Resultado: **206 mandatos SENADO** (ex.: Renan Calheiros 8 legislaturas 1995→2027, Jader Barbalho 6). Timeline renderiza no perfil ✓.
  - [x] **G7d · FPE dos senadores assinantes** ✅ RESOLVIDO (25/08/2026): fonte oficial do Senado (`codcol=2583`). **15 senadores em exercício** marcados como FPE (3 assinantes saíram do Senado: Eduardo Girão, Jorge Seif, Mécias de Jesus). Filtro FPE e chip "Bancada Evangélica" agora incluem senadores.
- [x] **G6 · E2E mínimo (Playwright)** ✅ (2026-08-26) — 6 testes críticos: home, perfil, comparação, metodologia, senadores, lastSyncBadge. Config: chromium, baseURL produção, reporter=list. `pnpm test:e2e`.

### Onda B — credibilidade do dado "Bancada" (F16, o coração jurídico do projeto)
- [x] **F16 · Bancada em tiers com fonte datada** ✅ (2026-08-26) — 3 níveis: `REGISTRADO` (lista oficial Câmara 54477 / Senado codcol 2583) > `AUTODECLARADO` > `IMPRENSA`. Schema: enum `FpeTier` + `fpe_tier`/`fpe_source`/`fpe_source_url`/`fpe_captured_at` no Politician. Seed `fpe:tiers`: 247 membros (225 ativos: 210 Câmara + 15 Senado; 22 inativos) marcados REGISTRADO com fonte oficial datada 25/08/2026. UI: `FpeTierChip` no card e no perfil com tooltip (descrição do tier + fonte clicável + data de captura). Filtro `isFpeMember` mantido. Validado em produção: chip renderiza, tooltip com fonte/URL/data, `fpe` no API. Re-validação trimestral manual pendente (anotada).
  - **✅ AUDITORIA REALIZADA (2026-08-25)** — gatilho: desconfiança do Rilson ("não acho que todos esses são da bancada"). Método: cruzamento nome-a-nome com a lista OFICIAL da frente 54477 (API da Câmara, `/frentes/54477/membros`). Resultado: **207/208 flags corretos (99,5%)**; 1 falso positivo removido (AJ Albuquerque/PP-CE, não assinou); 4 membros ativos ausentes marcados (incluindo **Silas Câmara, presidente da frente**!); 21 membros oficiais inativos (suplência/vacância/licença) também marcados — flag é filiação, não exercício. **Total agora: 232 = exatamente o da lista oficial; 210 entre os ativos.** O `is_active` do banco saiu VALIDADO de graça: 513 ativos = exatamente os "Exercício" de hoje; os 134 inativos são reais (14 licença, 107 suplência, 22 vacância — Bolsonaro, Dallagnol e Ramagem entre as vacâncias). Fonte registrada pela 1ª vez: frente 54477, capturado em 25/08/2026. Falta: tier UI + data no chip + re-validação trimestral manual.
- [x] **F16b · Seção "Quem é da bancada" na /metodologia** ✅ RESOLVIDO (25/08/2026): seção adicionada com: o que é a FPE (frente, não partido), fontes oficiais (Câmara frente 54477 + Senado codcol 2583), como contestar, data da última auditoria. Renderiza com Cards e ícones já existentes.

### Onda C — instrumentar antes de crescer
- [ ] **C1 · Analytics de privacidade (Plausible ou similar)** 🟢 — saber o que o visitante faz HOJE antes de construir mais qualquer coisa. Build: horas. Manter: zero.
- [ ] **C2 · Definir North Star metric** 🟢 — proposta inicial: "% de visitas que chegam a um perfil completo". Decisão, não código.

### Fase 2 — crescimento (escolher COM dados do C1; competem entre si)
- [ ] **M1 · Match Eleitor** 🟡 — cidadão responde as mesmas questões dos 5 critérios → vê parlamentares alinhados consigo. Maior potencial viral do produto. Build: ALTO (quiz + matching + UX). Manter: baixo depois de pronto (conteúdo estático). Só fazer se C1 mostrar engajamento com perfis.
- [ ] **M2 · Páginas por tema** 🟡 — "como votaram sobre saúde/impostos/educação" com key votes existentes + 1 parágrafo de contexto leigo + SEO. Build: médio. Manter: BAIXO-MÉDIO (contexto envelhece devagar; revisão semestral).
- [ ] **M3 · Digest semanal** 🔴 ARMADILHA — página/newsletter "votações da semana". Build: médio. Manter: ALTO — vira obrigação editorial SEMANAL; semana vazia = página vazia. Só com curadoria semi-automática comprovada.
- [ ] **M4 · Alertas por e-mail** 🔴 ARMADILHA — notificar sobre pautas grandes. Build: alto. Manter: ALTO — deliverability, LGPD, unsubscribe, infra de env. Deixar para quando houver base de usuários recorrentes.
- [ ] **M5 · Impacto leigo por key vote** 🔴 se manual — "na prática, isso significa…" em toda pauta nova exige escrita contínua. Versão viável: só nas ~10 pautas maiores do ano, curadas à mão.

### Ordem sugerida
G1+G2+C1 numa sessão (manhã de trabalho) → G3+G4+G5 → F16 (coleta manual das fontes) → C2 decisão → F9/F11 fecham a onda atual → Fase 2 decide-se com analytics na mão.

## Plano de Valor — fases de produção (2026-08-21)

> Mapa de navegação do que resta. Ordenado por valor pro eleitor ÷ esforço.
> Atualizar status aqui a cada rodada — este documento é onde eu (Rilson)
> volto pra saber onde o projeto está.

### ✅ Fase 1 — Credibilidade dos dados (CONCLUÍDA)
Consistência honesta · média única global · Sobre dinâmico · risco em PT ·
FAQ verídico · scroll-to-top · filtros de Votações reais · busca na navbar ·
hamburger funcional · botões do Contato vivos · dropdowns discretos · FPE
default+nome · zips TSE fora do git.

### ✅ Fase 2 — Transparência pro eleitor (CONCLUÍDA)
Bloco "Por que este critério?" nas pautas · Grupos de Votação em linguagem
humana · nota parcial explícita quando não há análise de gastos · proxy de
fotos + card redesenhado (tondo, anel dourado, nota-herói) · sitemap.xml ·
tabs 2×2 no mobile.

### ✅ Fase 3 — Dados e profundidade (EXECUTADA EM PRODUÇÃO — 2026-08-22)

**Resultados reais medidos:** 31 → **83 pautas** monitoradas · 7.930 → **26.860 votos** individuais · títulos crus "Mantido o texto." de 6 para **1** (única pauta sem nenhuma referência de proposição na API da Câmara — resíduo aceito e documentado). Verificação tripla pós-recálculo: 0 políticos com coluna total_votes congelada, 0 consistência-fantasma, distribuição real min 0 / média 15 / max 23 votações por ativo.

1. [x] **`sync-votes.ts` enriquecido** — agora busca detalhe+proposição de TODA votação casada e compõe título `SIGLA numero/ano — ementa` + descrição com contexto. **Idempotente:** no re-run atualiza agendas antigas que têm título cru ("Mantido o texto.") — corrige o banco existente sem SQL manual. Custo: ~2 requests a mais por pauta casada (~31), trivial.
2. [x] **Liberdade Religiosa**: `SCAN_RULES` ampliadas ("liberdade de culto", "símbolo religioso", "perseguição religiosa", "assistência espiritual", "folga religiosa"). UI: critério sem pauta exibe "sem votações nominais identificadas no Plenário" em vez de 0 nu. **A verificação real acontece no re-run em prod** — se ainda der 0, o rótulo honesto fica.
3. [x] **Rodar scripts em produção após push** — feito, e **verificado ao
   vivo de novo em 2026-08-22** (a checkbox tinha ficado destravada por
   esquecimento, não porque não rodou): `/api/votes/analysis` retorna
   `totalAgendas: 83` e `totalVotes: 26860` — bate exato com os
   "resultados reais medidos" acima. Perfil do Político 9 (o exemplo
   citado no achado): `totalVotes: 14`, não mais "0 com 100%
   consistência". `README.md` também tinha ficado com o número antigo
   (7.930/31) — corrigido pros números reais atuais.
4. [x] **Metodologia: party seed explicado** — bloco "Como a nota é calculada — transparência total": base partidária + delta por voto nominal + penalidade de gastos; estimativa parcial sinalizada; fórmula final apontando pro motor open source.
5. [ ] Interpretação por grupo na página de Clusters — aguardando serviço Python ativo em produção (a página hoje mostra estado de erro gracioso com fallback de alinhamento por partido).

### 🚨 Incidente 2026-08-22 — disco cheio derrubou o Postgres compartilhado

**O que aconteceu:** no meio da fase 3 (sync de votações em produção), o
PostgreSQL shared crashou com `PANIC: could not write ... No space left on
device` e entrou em **crash-loop de recovery** (recover → PANIC → recover).
Causa raiz: disco do VPS em 100% — **25,75 GB de cache de build do Docker**
(243 entradas, 0 ativas) acumulados pelos rebuilds de deploy. O
`docker builder prune` NÃO roda automaticamente.

**Resolução:** `docker builder prune -af` (25,75 GB liberados, disco 100% → 36%)
→ `docker restart postgres-shared` → shutdown limpo, sem perda de dados.
Todos os 13 containers voltaram healthy.

**Prevenção aplicada:** `docker builder prune -f --filter "until=168h"` no
final do deploy.yml deste projeto (mantém cache de 7 dias). Se outros
projetos do cluster começarem a encher o disco de novo, promover pro
Makefile do hetzner-infra (alvo `deploy`), que cobre todos de uma vez.

**Lição:** monitorar espaço em disco no Uptime Kuma (hoje só monitora
HTTP) — alerta de disco >85% teria pego isso antes do crash. Backlog P5.

### 🔬 Achado real da fase 3 — coluna total_votes congelada

Sintoma que levou à descoberta: após rodar o motor de recálculo corrigido,
484 políticos ativos seguiam com `consistency_score >= 99%` + `total_votes = 0`.
Investigação linha a linha: as linhas ERAM atualizadas às 03:00 (updated_at
prova) — o upsert nunca escrevia **`total_votes`**, coluna congelada desde a
criação. Político 9, por exemplo: exibia "0 votações" mas tinha **10 votos
reais** no banco; consistência 100% era legítima (10/10 votos com posição
definida SIM/NÃO).

Correções encadeadas:
1. Motor zera consistência quando não há votos (não preserva lixo antigo)
2. Motor mantém `total_votes = votes.length` no create/update
3. UI (fase 1) já protegia a exibição com "—" / "sem votações registradas"

Resultado esperado pós re-run em prod: ~509 ativos com contagem real de
votações; ~5 sem votos nenhum exibindo "—"; consistência alta passa a ser
dado verdadeiro (proporção de votos com posição definida), não bug.

### ⚖️ Legal e métricas (2026-08-22)

- [x] **Política de Privacidade** (`/privacidade`) — LGPD em linguagem simples: dados de parlamentares vêm de fontes públicas oficiais com finalidade de controle social/jornalismo de dados; formulário de contato (nome/e-mail/mensagem) com base legal, retenção e canal do titular (art. 18); **sem cookies de rastreamento => sem banner de consentimento** (declaração explícita na seção 3).
- [x] **Termos de Uso** (`/termos`) — disclaimers de watchdog: independência (sem partido/igreja/campanha), notas como cálculo automatizado reproduzível sobre registros públicos (não verdade absoluta), direito de resposta com SLA de 15 dias, uso dos dados com atribuição, limitação de responsabilidade.
- [x] **Links no rodapé + rotas + sitemap** atualizados.
- [x] **Analytics — decisão registrada: Umami auto-hospedado, modo cookieless**; GA4 descartado (banner LGPD obrigatório por cookies de rastreamento, ~30-40% de perda por adblock, tensão com a posição de privacidade da marca). Hook `src/components/Analytics.tsx` DORMENTE: só carrega com `VITE_UMAMI_SRC`+`VITE_UMAMI_ID` definidos no build (zero custo até ativação). Ativação = subir container Umami + apontar DNS + definir variáveis no Vercel.

### 📊 Umami implantado (2026-08-22)

- Container `umami` na VPS (`~/hetzner-infra/umami/`, compose espelhado no repo local hetzner-infra), Postgres compartilhado (db `umami_db`, owner `umami`, senha gerada — só no `.env` da VPS, chmod 600)
- DNS: registro A `umami.narniano.com` → 167.233.254.53 adicionado pelo Rilson no painel Nuvem Hospedagem; certificado Let's Encrypt emitido pelo Traefik no primeiro acesso
- Site registrado: "A Bancada Evangélica" / `website_id 2d26f077-fe38-4a94-8a07-b31b484e9f91`
- Tracker público verificado: `https://umami.narniano.com/script.js` HTTP 200
- **PENDENTE DO RILSON:** renomear as variáveis na Vercel de volta pra `VITE_UMAMI_SRC`/`VITE_UMAMI_ID` (estão como `UMAMI_SRC`/`UMAMI_ID`) + Redeploy. O aviso da Vercel sobre exposição ao browser é genérico: ID de analytics é identificador PÚBLICO por natureza (aparece no HTML de todo site que usa analytics — GA4 igual). Segredo de verdade (DATABASE_URL etc.) não tem prefixo VITE_ e vive só na VPS.
- [x] **Senha default do Umami trocada pelo Rilson (2026-08-22)** — credencial `admin`/`umami` desativada; acesso agora restrito à senha pessoal. Pendência de segurança encerrada.
- Polish futuro: títulos idênticos quando várias votações da mesma matéria (ex.: 3 destaques do PL 3469/2024) — diferenciar com o resultado específico da votação no título.

### 🧭 Fase 4 — Marca e polimento
1. Missão revisitada com lente watchdog (home explica método antes do ranking?)
2. Ícone/logo unificado (hoje convivem favicon livro preto, Logo.png azul e BookOpen lucide)
3. Auditoria acessibilidade + responsividade fina (375/390/430px) nas páginas de dados
4. ~~Remover `railway.toml` mortos~~ — REMOVIDOS (2026-08-22, commit de limpeza)
5. Card viral v2 — versão "compartilhável com orgulho" para notas altas

### 🚢 Ritual de deploy deste projeto (diferente do Gerador!)
- **Frontend:** Vercel — deploy automático no push pra `main`
- **API/worker:** GitHub Action `.github/workflows/deploy.yml` — SSH no VPS,
  `git pull` em `/opt/a-bancada-evangelica`, `make deploy service=bancada`,
  smoke test em `/health` com retry 10x
- Ou seja: **push = deploy dos dois lados**, com smoke test embutido.
  Conferir Action verde + `/health` + frontend após cada push.

---

## Distribuição e Impacto (2026-08-22)

> Projeto cívico: decisão permanente de não monetizar (sem ads/afiliado;
> doação como porta aberta). Aqui sucesso = alcance e confiança, não receita.

### Janela eleitoral (até out/2026)

- Mesma janela do Teste Político: pico de interesse nas semanas antes do 1º turno (4/out)
- Diferencial: dados TSE/Câmara/Senado verificáveis — formato "como seu deputado votou"

### Formato viral já construído: ShareableCard

- Cards "você sabia como Fulano votou?" são conteúdo printável de WhatsApp/X
- Produzir cards por tema pauta — liberdade religiosa (fase 3, já no ar) é o tema âncora do nicho

### Canais (com guardrail de neutralidade)

1. Mídia evangélica de notícias e podcasts fé & política — pitch "dados, não opinião" (credibilidade watchdog)
2. Líderes/pastores com audiência — oferecer dados e método, nunca endosso partidário
3. X/Twitter político BR — gráficos de votação por partido/estado (a API `/api/politicians` já agrega byState/byParty)

### Guardrails

- Sem candidatos/partidos específicos na divulgação (risco TSE, mesma regra do Teste Político)
- Neutralidade percebida É o produto — qualquer push tendencioso mata o projeto inteiro

### Métricas (Umami já instalado)

- Visitas por card compartilhado, retorno de jornalistas/comunidades, menções espontâneas

---

## Operação — Disco do VPS (incidentes 2026-08-22 e 2026-08-23)

Duas recorrências da mesma causa em 24h, segunda com diagnóstico completo:

- **Sintoma**: Deploy VPS verde no rebuild, smoke test vermelho — API respondendo
  **404 em TODAS as rotas** (Traefik vivo, container atrás dele em crash-loop).
- **Causa raiz**: cache de build do Docker. `docker system df` acusou
  **17,9GB** de build cache (133 entradas) + 7,5GB de imagens ≈ 25GB dos
  31GB usados num disco de 38G.
- **Achado técnico**: `docker builder prune -f` (sem `-a`) liberou só 4,4GB —
  registros compartilhados exigem a flag `-a`. O filtro semanal do workflow
  (`until=168h`) nunca pegaria rajadas: 7 deploys em 2h geraram 4,4GB novos.
- **Prevenção aplicada no deploy.yml**:
  1. Guarda de disco ANTES do build: aborta se raiz ≥90% (evita piorar)
  2. Prune total após cada deploy (`builder prune -af` + `image prune -f`)
  3. Percentual de disco reportado no log de cada deploy
- **Tradeoff aceito**: todo rebuild agora começa sem cache de camada
  (segundos a mais por deploy) em troca de disco estável.

## 🚨 Incidente 2026-08-23 — produção tela-branca desde 22/08 (achado pela validação de a11y)

**Como foi achado:** a pendência "validação Lighthouse no navegador"
(docs/A11Y-AUDIT.md item 6) reproduziu o NO_FCP desta máquina — e em vez
de culpar o ambiente, screenshot headless direto mostrou PNG de 5.7KB
(tela branca). O site inteiro estava fora do ar desde o push de ontem.

**Causa raiz (3 camadas):**
1. Commit `b7cf4b1` adicionou `<Route path="/dados" element={<DadosAbertos />} />`
   **sem o import** → `ReferenceError: DadosAbertos is not defined`
   crashava o React no boot, em TODAS as rotas (SPA morre inteira).
2. A página `DadosAbertos.tsx` usava **Chakra UI** (nunca instalado;
   stack é shadcn/Tailwind) e `React.FC` sem import — nunca compilou
   de verdade; ninguém percebeu porque ninguém importava o arquivo.
3. **Gap de typecheck**: `tsconfig.json` é solution-style (`files: []`)
   — `tsc --noEmit` simples não checa NADA, e o build Vite não tipa.
   O erro era pego por `tsc -p tsconfig.app.json` (36 erros no app,
   sendo 1 fatal). Nenhuma etapa do pipeline (lint/testes/CI) cobria.

**Correção:** import adicionado; página reescrita em HTML+Tailwind
(mesmo conteúdo); verificado localmente — build ok, 43/43 testes,
screenshot headless da home pinta (380KB) e `/dados` renderiza.

**RESOLVIDO EM PRODUÇÃO (2026-08-23, noite):** commits `1e74e2c`
(hotfix), `9898781` (a11y) e `bb3374b` (docs) → deploy VPS verde
(2m17s), CI verde, `/health` 200, home e `/dados` pintando em
produção confirmadas por screenshot headless. Na mesma sessão a
validação Lighthouse foi executada e a **meta ≥90 batida nas 6
páginas** — resultados completos em `docs/A11Y-AUDIT.md` (home 100,
metodologia 95→98 com contrates corrigidos, perfil 98, sobre 100,
dados 98, contato 98).

**Prevenção — ✅ EXECUTADA (2026-08-23, mesmo dia):** dívida de tipo
queimada (34 app + 14 API → 0) e `pnpm typecheck` ligado no ci.yml.
Detalhe das correções na seção "Dívida conhecida" abaixo. Nota de
processo: `tsc -b` EMITE .js no src/ (ignora `noEmit`) — usar
`-p <projeto> --noEmit`, não `-b`. Smoke test do deploy.yml continua
só-API (`/health`): o typecheck no CI cobre a classe do incidente;
verificação visual headless fica no playbook manual (playbook acima).

---

## 🧯 Playbook de segurança pra corrigir bugs (lições desta sessão)

> Registrado em 2026-08-23 após o incidente tela-branca. Vale para
> QUALQUER mudança neste projeto — seguir na ordem. O incidente provou
> que build verde + testes verdes NÃO significam site funcionando.

### Antes de mexer
1. `git status --porcelain` limpo — nunca misture trabalho novo com
   WIP não relacionado
2. Linha de base dos testes ANTES da mudança: `pnpm test` (56/56 hoje)
3. Typecheck REAL do projeto (ver armadilha #1): `pnpm typecheck`
   (`tsc --noEmit` em app + api) — zero erros desde 4170780, e o CI
   barra regressão

### Armadilhas conhecidas deste repo (todas morderam de verdade)
0. **Deploy verde com código velho (achado 2026-08-24)** — o script de
   deploy no VPS não tinha `set -e`: `git pull` falhava, o erro era
   engolido, o rebuild subia o código antigo e o smoke test passava
   (`/health` serve em QUALQUER versão). Ficou assim por 3 deploys.
   Correção no deploy.yml: `set -e` + verificação de que HEAD no VPS ==
   commit do push (`github.sha`). Lição: pipeline que só verifica VIDA
   não verifica ENTREGA.
1. **`tsc --noEmit` simples não checa nada** — tsconfig solution-style
   (`files: []`). Usar `-p tsconfig.app.json`. O `tsc -b` além de não
   respeitar `noEmit`, **emite .js compilado dentro do src/** e quebra
   o próximo build (`criteria.js` com JSX). Se emitir por acidente:
   apagar cada `.js` que tenha gêmeo `.ts/.tsx` (36 foram gerados e
   limpos nesta sessão).
2. **Build Vite NÃO tipa** — passa import inexistente, tipo errado,
   tudo. O erro só explode em runtime no browser do usuário.
3. **Página nova fora do padrão de stack compila "até passar"** —
   DadosAbertos.tsx veio com Chakra UI + React.FC sem import e ninguém
   percebeu enquanto ninguém importava. Ao criar página: usar as
   páginas existentes como molde (container/Tailwind/shadcn), importar
   no App.tsx NO MESMO commit e conferir o typecheck.
4. **SPA morre inteira com um ReferenceError qualquer** — um único
   componente quebrado no boot = tela branca em TODAS as rotas. Não
   existe falha "só numa página" para erro de módulo.
5. **Smoke test do deploy só cobre a API** (`/health`) — frontend
    quebrado passa pelo pipeline inteiro sem alarme.
6. **"Neon fantasma": validar SEMPRE qual banco o `.env` alcança antes
    de escrever dados (2026-08-24)** — o `.env` local ainda apontava pra
    cópia congelada do Neon (migração de 08/08); syncs rodaram "em
    produção" e gravaram num banco morto, com números ligeiramente
    diferentes dos reais. O banco verdadeiro é o Postgres compartilhado
    do VPS (`postgres-shared:5432/bancada_evangelica_db`, hostname só
    resolve DENTRO da rede Docker — inacessível do desktop). Regra:
    operações de dados em produção rodam dentro do container
    (`docker exec bancada-api ...`) ou via `ssh narniano@167.233.254.53`
    (root não tem chave; repo em `/opt/a-bancada-evangelica`, infra em
    `~/hetzner-infra`). Antes de qualquer sync: `SELECT COUNT(*) FROM
    politicians WHERE is_active` e compare com o esperado.

### Depois de mexer (ordem mínima de verificação)
1. `pnpm test` — 56/56 esperado (ou mais; nunca menos)
2. `pnpm typecheck` — zero erros (app + api)
3. `pnpm lint` — 0 errors (3 warnings react-refresh são pré-existentes)
4. `pnpm build` — precisa terminar em "✓ built"
5. **Verificação visual headless** (pegava tela-branca que tudo acima
   deixava passar):
   ```bash
   (pnpm preview --port 4174 &) && sleep 4
   google-chrome --headless=new --disable-gpu --no-sandbox \
     --virtual-time-budget=12000 \
     --screenshot=/tmp/tela.png http://localhost:4174/
   # PNG >50KB = pintou; ~5KB = tela branca
   ```
6. **Varredura de overflow** (se tocou em layout/responsividade) —
   script CDP que testa 9 rotas × 3 viewports (360/768/1350) e acusa
   `scrollWidth > innerWidth` + os elementos culpados; 0px esperado
   em tudo (baseline 2026-08-24). Script salvo em `/tmp/opencode/`
   durante a sessão — recriar com `Emulation.setDeviceMetricsOverride`
   + `Page.navigate` por combinação
7. Só então commitar (mensagem referenciando doc/issue) e push

### Depois do push (ritual de deploy + verificação em produção)
1. `gh run list` — Deploy VPS E CI/CD verdes
2. `curl https://api-bancada.narniano.com/health` — 200
3. Screenshot headless de produção (mesmo comando, URL pública) —
   confirma o deploy real do Vercel, não só o build local
4. Lighthouse de acessibilidade se tocou em UI

### Dívida conhecida (atualizada 2026-08-23 — dívida de tipo QUEIMADA)
- ✅ **Type debt zerado e typecheck no CI (2026-08-23)**: 34 erros do
  app + 14 da API → **0 e 0**. `pnpm typecheck` (tsc -p app + api)
  virou etapa obrigatória do ci.yml — a porta do incidente está
  FECHADA. Correções notáveis no caminho: `Bar fill` do
  ExpenseAnalysisChart era função silenciosamente ignorada pelo
  Recharts (barras sem as cores pretendidas desde sempre — agora via
  Cell); tipos de API defasados (averageScore/agendaByCriteria/
  totalCount/criteria) alinhados com o backend real;
  `tsconfig.api.json` não inclui mais src/lib (8 erros fantasmas de
  frontend sob config CommonJS).
- ✅ **`ShareButton.tsx` DELETADO** (2026-08-23): dead code total
  (nada importava), importava ícone `WhatsApp` inexistente no
  lucide-react (crasharia se alguém usasse) e duplicava o
  compartilhamento vivo (Web Share API no perfil + ShareableCard v2).
- Pendente: `heading-order` (h3/h4 pulando níveis) em Metodologia,
  Perfil, Dados e Contato — revisar hierarquia componente a componente.
