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
- [ ] Sem Sentry — sem visibilidade de erro em runtime (front Vercel + API)
- [ ] Rotação de log não auditada (categoria nova, do SHIELD-I)

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
- [ ] `sitemap.xml` — não existe ainda (site tem só um punhado de rotas,
      baixa prioridade, mas é rápido de gerar)
- [ ] **Acessibilidade — checagem rápida feita, gap real (2026-08-16)**:
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
- [ ] #5 Integração TSE — **em andamento, pausado em 2026-08-20** na
      branch `feature/tse-integration` (não mergeada — schema + script
      validados, dry-run ainda não executado contra produção). Status
      detalhado, achados reais já confirmados e próximos passos exatos
      no `ROADMAP.md` dessa branch, não repetidos aqui pra não
      desatualizar dois lugares
- [ ] #6 Fundamentação bíblica na Metodologia — referências já existem
      por critério; falta só o glossário de termos técnicos

## P9 — Documentação

- [x] **Corrigir o `README.md`** (2026-08-20) — ainda dizia Railway
      (URL de docs morta, seção de Deploy inteira errada) mesmo já
      estando no VPS desde 02/08. P1 já dizia "atualizado" antes, mas
      não estava — reescrito de verdade agora, com o fluxo real
      (GitHub Actions → SSH → git pull → make deploy → smoke test).
- [ ] API NestJS: confirmar se já tem Swagger/OpenAPI configurado (o
      NestJS tem suporte de primeira classe pra isso,
      `@nestjs/swagger`) — se não tiver, é o mesmo padrão do SIC
      (Swagger+Scalar) que vale replicar

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
- [ ] **"Liberdade Religiosa aparece com 0 em pautas monitoradas"** — INVESTIGADO (2026-08-21): não é bug de JOIN nem de nome de critério. O endpoint conta apenas `KeyAgenda` existentes (`votes.service.ts:78-81`) e o `sync-votes.ts` nunca casou nenhuma votação do Plenário com as keywords desse critério (`SCAN_RULES:28-44` — "liberdade religiosa/intolerancia religiosa" não apareceu nos títulos de votações nominais desde fev/2023). **Ação real é de curadoria de dados**, não de UI: ampliar keywords (ex.: "liberdade de culto", "símbolos religiosos", projetos específicos) e/ou semear pautas manualmente. NÃO inventar número — 0 com explicação honesta > dado fabricado.
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
- [x] **Página "Sobre" ainda menciona Railway — RESOLVIDO (2026-08-21)**. Cards técnicos reescritos com a realidade: NestJS 11 (dizia "Express 5" — outro erro factual), PostgreSQL na VPS (dizia Neon), Docker + Traefik no Hetzner. Os arquivos `railway.toml` (raiz e analysis/) seguem no repo como histórico morto — remover em commit de limpeza.

### 🟡 Melhoria — UX e produto

- [x] **TSE: zips de prestação de contas (2022) — 451MB — RESOLVIDO (2026-08-21)**. Os 5 zips estavam COMMITADOS (8ac4fb7) e nunca empurrados — o primeiro push seria rejeitado pelo limite de 100MB/arquivo do GitHub. Como os 2 commits locais nunca foram ao remote, rewrite local seguro: reset --soft pra origin/main, unstage dos zips, recommit limpo. Zips continuam no disco local; `data/tse/*.zip` no `.gitignore`; `data/tse/README.md` documenta tamanhos, fontes oficiais (dadosabertos.tse.jus.br) e status da integração pausada. **Lição:** material bruto pesado NUNCA entra no git — processa fora, versiona só resultado limpo.
- [x] **Filtro "Apenas FPE" — RESOLVIDO (2026-08-21)**. Ativo por padrão (o recorte do projeto É a FPE — quem chega deve ver primeiro quem faz parte) e renomeado pra "Frente Parlamentar Evangélica" por extenso.
- [x] **Página de Grupos de Votação precisa de contexto para leigos — RESOLVIDO na primeira dobra (2026-08-21)**. Hero reescrito: abertura em linguagem humana ("deputados que votam juntos, tema a tema — radiografia do comportamento real, além dos rótulos de campanha"); o jargão técnico (KMeans, PCA, silhouette) desceu pra um `<details>` opcional "Como essa análise é feita". Falta ainda 1 frase de interpretação por grupo individual (depende do output real do serviço Python).
- [ ] **Card de compartilhamento — design para incentivar o próprio deputado a compartilhar** — pendente. Depende do fix do proxy de fotos (item Grave acima). Direção: foto em destaque, nota grande e legível, selo do projeto, versão "compartilhável com orgulho" para notas altas + neutra para baixas.
- [x] **Horário de Atendimento na página de Contato — RESOLVIDO (2026-08-21)**. Removido (produto digital não tem expediente).
- [x] **Card de tipos de contato — RESOLVIDO (2026-08-21)**. Removido (não levava a nada).
- [ ] **Missão do site revisitada** — pendente. Lente: watchdog de transparência. Perguntas a responder: a home comunica o método antes do ranking? O leigo entende que nota não é "simpatia política" mas voto nominal registrado? Textos do hero prometem o que os dados entregam?
- [ ] **Ícone do projeto** — pendente. Hoje convivem: favicon SVG (livro preto), Logo.png OG (livro azul em quadrado) e ícone lucide `BookOpen` genérico no header/heroes. Avaliar unificação (logo real no header) com Design Narniano como referência de coerência.
- [ ] **Acessibilidade + responsividade fina** — 12 de 64 componentes têm `aria-label` (~19%). Auditoria completa de contraste, foco, teclado e viewports 375/390/430 nas páginas de dados (tabelas, cards, filtros).
- [x] **`sitemap.xml` — RESOLVIDO (2026-08-21)**. Estático em `public/sitemap.xml` com as 8 rotas + prioridades/changefreq. `robots.txt` já existia.
- [x] **Swagger/OpenAPI no NestJS — JÁ ESTAVA CONFIGURADO** (achado 2026-08-21): `src/api/main.ts:43-70` monta Swagger em `/api/docs` e Scalar em `/api/reference`. Item encerrado sem trabalho — o roadmap não sabia.

---

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

### 🔄 Fase 3 — Dados e profundidade (código pronto 2026-08-21; execução em prod pendente do push)

1. [x] **`sync-votes.ts` enriquecido** — agora busca detalhe+proposição de TODA votação casada e compõe título `SIGLA numero/ano — ementa` + descrição com contexto. **Idempotente:** no re-run atualiza agendas antigas que têm título cru ("Mantido o texto.") — corrige o banco existente sem SQL manual. Custo: ~2 requests a mais por pauta casada (~31), trivial.
2. [x] **Liberdade Religiosa**: `SCAN_RULES` ampliadas ("liberdade de culto", "símbolo religioso", "perseguição religiosa", "assistência espiritual", "folga religiosa"). UI: critério sem pauta exibe "sem votações nominais identificadas no Plenário" em vez de 0 nu. **A verificação real acontece no re-run em prod** — se ainda der 0, o rótulo honesto fica.
3. [ ] **Rodar scripts em produção após push** (ordem importa):
   ```
   ssh narniano@100.67.163.103
   docker exec bancada-worker node_modules/.bin/tsx scripts/sync-votes.ts      # 1. enriquece pautas + novas keywords
   docker exec bancada-worker node_modules/.bin/tsx scripts/recalculate-scores.ts  # 2. recalcula notas (limpa consistência congelada)
   ```
   Verificar depois: `/api/votes/analysis` (agendaByCriteria) e um perfil que tinha consistência 100% com 0 votos.
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

### 🧭 Fase 4 — Marca e polimento
1. Missão revisitada com lente watchdog (home explica método antes do ranking?)
2. Ícone/logo unificado (hoje convivem favicon livro preto, Logo.png azul e BookOpen lucide)
3. Auditoria acessibilidade + responsividade fina (375/390/430px) nas páginas de dados
4. Remover `railway.toml` mortos (raiz e analysis/)
5. Card viral v2 — versão "compartilhável com orgulho" para notas altas

### 🚢 Ritual de deploy deste projeto (diferente do Gerador!)
- **Frontend:** Vercel — deploy automático no push pra `main`
- **API/worker:** GitHub Action `.github/workflows/deploy.yml` — SSH no VPS,
  `git pull` em `/opt/a-bancada-evangelica`, `make deploy service=bancada`,
  smoke test em `/health` com retry 10x
- Ou seja: **push = deploy dos dois lados**, com smoke test embutido.
  Conferir Action verde + `/health` + frontend após cada push.
