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

## 🚦 Mapa de pendências — eleição 2026 (atualizado 16/09)

> Checklist executável do que falta até o 1º turno (04/10). Alt: guardar
> este mapa e só ticar aqui. Legenda: 🔴 bloqueador · 🔵 manual (Rilson)
> · 🟠 decisão · ⚙️ agente executa · 🟢 automático.

### 🔴 Técnicas — FEITAS (14/09)
- [x] **Fabricação nova encontrada e removida (15/09)** — re-auditoria
      anti-fabricação achou o ÚNICO resquício que o guard de 14/09 não
      pegava: `useComparisonData.ts` devolvia "João Silva"/"Parlamentar
      #N" com nota 80 quando a API falhava. Agora propaga erro e a página
      de Comparação mostra "Não foi possível carregar os dados". Guard do
      CI ampliado p/ caçar `MOCK_*` em hooks/pages/data + teste de
      regressão (página e hook).
- [x] Rótulos neutros na fonte + 4 componentes + testes (`ca51739`)
- [x] Repo público + gitleaks 212 commits, 0 leaks (`ca51739`)
- [x] Sitemap 613 URLs — verificado na Vercel ao vivo ✅
- [x] Code-splitting 1,78MB→485KB (−73%) (`3403fa1` + `beaf0df`)
- [x] Termos seção 3 peri-eleitoral Lei 9.504/97 (`26062f6`)
- [x] **Zero dados fabricados no front** (14/09): removidos os fallbacks
      que INVENTAVAM dados quando a API falhava. Achado: 4 lugares
      fabricavam (detalhe na seção "Qualidade de Dados"). Endpoint real
      `/api/agendas/:id/votes` criado + testes. Commit `db87afe`
      (CI com guarda-roupa anti-fabricação). ✅

### 🟢 Automático (verificado em 15/09)
- [x] Recálculo dos labels no DB prod — cron 05h propaga "Aderência…"
      (deploy já no ar) → **CONFIRMADO VIA API (15/09, 09:38)**: produção
      já retorna `performanceLabel: "Aderência alta/moderada"` e
      `lastCalculation: 2026-09-15T05:00:02`. ✅

### 🔵 Manuais (Rilson) — prazo antes do pico 28/09
- [ ] **GT1 · 3 cards de pauta** — [🔴 decisão de dados] o plano pedia
      "liberdade religiosa", mas o banco tem **0 pautas votadas desse
      critério** (achado 21/08, recurrente; regra: 0 honesto > fabricado).
      Decisão registrada 14/09: cards com pautas REAIS do critério
      **Família** (PL 6233 Código Civil · PL 244-C · PL 5122), cada um
      com UTM. ⚙️ conteúdo em produção. **CORRIGIDO 15/09** (Rilson
      feedback 5 itens): dados FPE-only (152/0/0 · 84/75/0 · 159/16/0),
      headline "Como a Bancada Evangélica votou", placar em colunas
      SIM/NÃO/ABST, participação "X dos 225 membros", logo base64 e
      tagline "Transparência Parlamentar". Commit `92d3050`. ⏳ falta
      conferência visual dos PNGs + agendamento.
- [ ] Post X/Twitter: gráficos de votação por partido/estado
- [ ] LinkedIn: Posts 0/1/2 (índice editorial)
- [ ] Pitch imprensa evangélica + jornalistas de dados (10–15 contatos)
      — template revisado e lista de contatos verificada (14 contatos, 9
      com e-mail oficial confirmado; gap: Guiame/Gospel Prime/Gospel Mais/
      Aos Fatos/Congresso em Foco). **ENVIO ADIADO (decisão Rilson 15/09)** —
      a nota vive no vault `12 - Redes sociais/… Pitch de Imprensa.md`;
      reaproveitar para retomar quando der OK. Números do template
      verificados ao vivo (504/594 com votos próprios · 63,1 média ·
      83 pautas · 26.860 votos). Janela ideal era 22–28/09
- [ ] Reddit: copy pronta + feedback de viés (mata 2 pendências)
- [ ] Conferir Umami semanal (segunda): visibilidade por UTM →
      dobrar/abandonar
- [ ] Criar monitors Uptime Kuma `SCORES` + `CURATION_QUEUE` (2/7 hoje)

### 🟠 Decisões
- [ ] Sentry: ativar (1 sessão) vs pausado — **reconfirmado pausado (Rilson 2026-09-15)**
- [ ] North Star metric (aguarda dados Umami)
- [ ] M3 digest/M4 e-mail — manter pausados? — **reconfirmado pausados (Rilson 2026-09-15)**
- [ ] GT1 "liberdade religiosa" — pauta nova de nicho para semear
      manualmente (HOJE: sem dado de voto; cards usam Família)

### 🔵 Contínuas (curadoria)
- [ ] Revisar pendentes `/admin/noticias` (~4.835)
- [ ] Revalidar FPE tier (fonte datada 25/08 → ~25/11) — **reauditada 15/09**:
      a fonte oficial vigente (frente `54477`, legislatura 57) consta agora
      **232 membros**, **−18 vs 250** da auditoria 14/08. A marcação
      `is_fpe_member` no nosso DB espelha a vigência da Câmara. Falta apenas
      persistir o recálculo (cron 05h de 15/09 roda à noite; o job grava o
      label real de quem votou — sem fallback).
      **RECÁLCULO VERIFICADO 15/09 (ao vivo):** cron 05h RODOU e gravou
      `lastCalculation: 2026-09-15T05:00` nos scores ✅, mas descobri um gap
      real: `is_fpe_member` no DB = **225** (210 Câmara + 15 Senado) vs
      **232 oficiais** na fonte. Causa raiz achada: `sync-worker.ts` NUNCA
      chamava `sync:fpe` (só `sync-camara`, `sync-senado`, `sync:news`,
      `scores:recalculate`) — o script rodava só manualmente (`pnpm sync:fpe`).
      **FIX aplicado (commit `…`):** `sync:fpe` adicionado ao job diário de
      políticos (03h) no `sync-worker.ts`, com erro não-fatal (FPE não derruba
      o sync de políticos). Nota: **19 dos 22 faltantes NÃO existem no nosso
      DB** (são suplentes/substitutos que `sync-camara` não traz — o banco tem
      512 deputados vs ~878 ativos na Câmara; questão de escopo dos suplentes,
      não de bug FPE). O fix cobre os 3 que existem mas estavam com flag errada.
      **✓ APLICADO AO BANCO DE PRODUÇÃO (16/09):** `prisma db push` rodado no
      VPS (`docker compose -f ~/hetzner-infra/bancada/docker-compose.yml exec
      bancada-sync-worker pnpm db:push`) — "Your database is now in sync with
      your Prisma schema" — coluna `KeyAgenda.rules_version` (`default 1.0.0`)
      criada. FPE segue com `fpe_captured_at` real do 15/09.
- [ ] Texto da Metodologia sobre party seed
- [x] **Investigar 125 políticos label congelado "Aguardando Análise"
      (auditado 14/09)** — CONCLUÍDO: não é dado fabricado. O label é o
      valor literal que o sync grava quando o político não tem score
      computado (0 votos agregados confirmado no ranking real de
      produção `/api/votes/analysis` → 50 no top-50, todos com 0 votos).
      Decisão: manter "0 honesto > número fabricado" — não criar escalas
      sintéticas pra preencher label. Pendência remanescente é de
      **curadoria/UX** (~125 na vitrine "aguardando" sem votos), não de
      engenharia. Estado: AGUARDANDO decisão editorial do Rilson sobre
      exibir ou ocultar políticos sem voto.

### ✅ Programas de 16/09 — confiabilidade de dados + UI honesta (FECHADO)

> Resumo executivo dos trabalhos de 16/09. Detalhe por seção em
> `docs/REPRODUCIBILITY.md` (auditada na mesma data) e nas mensagens dos
> commits `9eb8b87`, `db73f5d`, `1be2434`, `a0edb05`, `8320a36`.

- [x] **Divergência de média entre endpoints (62,3 × 63,1) eliminada** —
      `votes/analysis` usava TODOS os scores históricos (inclusive de
      políticos inativos/duplicados) enquanto `stats/overview` usava só a
      última nota. Agora a fonte única é `scores.query.ts`
      (`latestActivePoliticianScores` + `summarizeLatestScores`); os três
      consumidores (stats/overview, votes/analysis, parties/alignment)
      fazem as contas sobre o MESMO subconjunto. Teste de regressão
      (2 scores/político → usa o último) incluído. Commit `9eb8b87`.
- [x] **SCAN_RULES versionadas (fonte única)** — extraídas pra
      `scripts/lib/scan-rules.ts` com `SCAN_RULES_VERSION=1.0.0` + helper
      `matchScanRule`. `sync-votes` (Câmara) e `sync-votes-senado`
      passaram a usar o mesmo módulo. Bug real no sync do Senado: gravava
      o ENUM do critério em `keywords` em vez das keywords — corrigido.
      Commit `db73f5d` + push de schema no banco de produção (16/09).
- [x] **Freshness por tipo de dado** — `stats.service.ts` `lastSync()`
      agora expõe `lastSync`/`syncType` (tipo mais antigo, que é o que a
      UI mostra) + `freshness` (mapa `sync_type → end_time` de cada tipo);
      `lastSyncAt`/`lastSyncLabel` no front vêm do tipo mais antigo;
      `LastSyncBadge`/`useLastSync` reescritos; scripts gravam `SyncLog`
      com tipo `VOTES` ao fim dos syncs de Câmara e Senado. Commit `1be2434`.
- [x] **FPE com captura real e rastro** — `fpe_captured_at` gravado de
      verdade, desligados removidos da flag, seed sem data hardcoded,
      `SyncLog` registra `fpeDropped`/`capturedAt`. Commit `1be2434`.
- [x] **Custos/qualidade** — `quality_check` casa por
      `details.action='quality_check'` e compara `totalPoliticians` real.
      Commit `67d3770`.
- [x] **UI 100% honesta** — fim de contagem fabricada no perfil
      (0 honesto + "Sem votos registrados"), card de análise com
      `withOwnVotes` (nota estimada por partido agora é sinalizada no
      ranking), Sobre.tsx com dados vivos em vez de hardcode '19+', e
      `/dados` com tabela dos últimos syncs (SyncHistoryTable). Commit
      `a0edb05`.
- [x] **Documentação** — `docs/REPRODUCIBILITY.md` expandida com todos os
      achados de 15-16/09 (auditoria FPE, quality-check, scores.query,
      SCAN_RULES, bug do Senado). Commit `8320a36`.

### 🎯 Programa "Nota 10" — 16/09: coerência, verdade e entendimento do usuário

> Autoavaliação honesta de 16/09 (dimensões de confiança) e o plano para
> subir cada uma a 10. Estado inicial: **Coerência 9 · Dados verdadeiros
> 9 · Confiabilidade 6,5 · Entendimento 7**. O usuário deve entender SEMPRE
> o que o site mostra, sem precisar do ROADMAP pra isso.

**Diagnóstico completo (baseline 16/09, atualizado 17/09 com Sentry no VPS):**

| Dimensão | Inicial | Atual | Motivo | Falta pra 10 |
|---|---|---|---|---|
| Coerência interna | 9 | 10 | Fonte única em `scores.query.ts` (63,1 bate); FPE explicado no site (suplentes) | — |
| Dados verdadeiros | 9 | 10 | Zero fabricado; badge honesto "Nota estimada por partido" com 0 votos (Alan Rick não mostra mais "Aderência muito alta"); label "Aguardando Análise" eliminado dos syncs | — |
| Confiabilidade | 6,5 | 10 | Smoke test de boot no CI (pegaria Telas Brancas); **Sentry ATIVO no VPS** (17/09, log "Sentry ativo (env=production)"); push monitors prioritários (`SCORES`, `CURATION_QUEUE`) respondendo `{"ok":true}` | — |
| Entendimento do usuário | 7 | 10 | Home/sobre coerentes; Metodologia explica estimativa + FPE + aba viva de estimados; licença MIT; auditoria de leitura completa (12/09–17/09): frases literais, jargão técnico, prazos unificados (15 dias), tooltips de 'Aderência'/'Consistência', distinção AUSENTE/ABSTENÇÃO, CTA de doação sem 'Ministério'; auditoria de confiança do leitor (17/09): recência real (Ranking/Metodologia), selo 'Base frágil' <5 votos, Errata em linguagem de cidadão | — |

**Itens do plano (checklist executável):**

- [x] **CEPT2-1 · Badge honesto no card/perfil** — com 0 votos, mostro
      "Nota estimada por partido" (cor neutra) no card do ranking, perfil,
      comparador, seletor e card de imagem; com votos, mantenho os níveis
      de aderência. Helper central `src/lib/performance.ts` (fonte única).
      Validado no browser: Alan Rick (0 votos) → "Nota estimada por
      partido"; Tarcísio (71 votos) → "Aderência baixa".
- [x] **CEPT2-2 · Metodologia explica o badge** — texto "Perfis nessa
      situação são marcados com o badge 'Nota estimada por partido'…".
- [x] **CEPT2-3 · Licença real no repo** — `LICENSE` MIT criado (GitHub
      mostrava `licenseInfo: null`; README declarava MIT mas o arquivo
      não existia — sem arquivo, a licença não vale). Agora público +
      licenciado.
- [x] **CEPT2-4 · Home/hero fala a verdade** — `Ranking.tsx(:264)` dizia
      "Notas calculadas exclusivamente a partir de votos nominais…
      o voto registrado é o único dado", mas ~91 políticos têm nota
      estimada por partido. Reformulado SEM perder a força da mensagem:
      "Notas calculadas a partir de votos nominais públicos… Quem ainda
      não votou recebe estimativa pelo histórico do partido, sempre
      sinalizada no perfil." Validado em prod. (⚙️ agente)
- [x] **CEPT2-5 · FPE no site** — página Metodologia agora tem seção
      "Reauditoria contínua (15/09/2026)": a marcação espelha a lista
      oficial da frente 54477 (Câmara) e codcol 2583 (Senado); suplentes
      relacionados na lista oficial podem ainda não ter perfil no site
      (diferença é de suplentes fora do exercício, não omissão). Validado
      em prod. (⚙️ agente)
- [x] **CEPT2-6 · Smoke test de boot no CI** — `e2e/boot-smoke.spec.ts`:
      Playwright/Chromium carrega home + metodologia/comparacao/grupos/sobre
      contra o BUILD local (vite preview) e falha se houver pageerror (teria
      pegado o TDZ do recharts). Novo job `boot-smoke` no ci.yml, após
      `pnpm build`. Validado localmente: 2 specs verdes. (⚙️ agente)
- [x] **CEPT2-7 · Aba de estimativas na Metodologia** — seção viva
      "Quem tem nota estimada hoje?" via novo endpoint
      `GET /api/stats/estimated-scores` (mesma fonte única
      `latestActivePoliticianScores`); painel com contadores (ativos × com
      voto × estimados) e lista nominal (15 + resumo), linkando ao perfil.
      Hook `useEstimatedScores` + 2 novos testes de API (31 total).
      Estado de erro honesto quando a API não responde. (⚙️ agente)
- [x] **CEPT2-8 · "Aguardando Análise" fora da UI** — decisão do Rilson
      (a): ELIMINAR o label dos syncs (2026-09-16). `sync-camara` e
      `sync-senado` agora gravam `performance_label = 'Nota estimada por
      partido'` com descrição honesta ("Sem voto próprio registrado, a
      nota é a média histórica de aderência do partido…") — o político sem
      voto vira estimativa direto, coerente com os helpers do front.
- [x] **CEPT2-9 · Sentry** — decisão do Rilson: ATIVAR (2026-09-16). **APLICADO via wizard 2026-09-17 (SENTRY_DSN no VPS).**
      `src/api/common/sentry.ts`: init condicionado a `SENTRY_DSN` (sem o
      DSN, inerte — zero custo; dev/testes intactos), `captureException` no
      `AllExceptionsFilter` (500+), `setupExpressErrorHandler` como último
      middleware, traces 10%. Aplicado no VPS via `scripts/wizard-setup-sentry.sh`
      (2026-09-17): `SENTRY_DSN` + `SENTRY_RELEASE=dc83d25` no `.env` remoto,
      API recriada, log "Sentry ativo (env=production)", secret `SENTRY_DSN`
      no GitHub. `.env.example` documentado.
- [x] **CEPT2-10 · Uptime Kuma (prioritários)** — os 2 monitores de maior
      risco **JÁ ESTÃO ATIVOS** (confirmado 2026-09-17): push URLs
      `SCORES` e `CURATION_QUEUE` → `uptime.narniano.com` respondem
      `{"ok":true}` (esqueletos de 2026-09-08 viraram monitores reais).
      **Decisão 2026-09-17: não criar os 3 HTTP restantes** (raiz do front,
      `/health` API e pautas) — fora do escopo por decisão do Rilson; os 2
      prioritários cobrem o risco de "dado errado exposto". 7/7 não é meta
      mais. (encaminhado 17/09)
- [x] **CEPT2-11 · Nota no csv/hashes** — conferido em prod (2026-09-16):
      CSV do ranking (`/api/politicians/export/csv`) é numérico puro — não
      expõe `performance_label`, nada incoerente após o label honesto;
      CSV de votos (`export/votes/csv`) com `X-Content-SHA256` íntegro
      (hash do header === sha256sum local). REPRODUCIBILITY §11 sem
      divergência.
- [x] **CEPT2-12 · Auditoria de confiança do leitor (17/09)** — recência
      real exposta: data da última sincronização (tipo mais antigo, honesto)
      no painel do hero do Ranking e na seção "Nossa fonte" da Metodologia
      (DadosAbertos já tinha `LastSyncStatus` com stale-check). Perfis com
      menos de 5 votações classificadas exibem selo "Base frágil" no card
      (antes só dentro do perfil). Errata reescrita em linguagem de cidadão:
      entradas de histórico (17/09 auditoria de leitura, 16/09 consistência
      inventada, 08/09 motor de notas + 89 sem histórico, 25/08 FPE) sem
      jargão de dev — nomes de arquivos movidos para nota discreta "Detalhe
      de auditoria". Rótulo "Base frágil" sem tooltip de jargão.

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

- [x] **Uptime Kuma com alerta real**: monitores `api-bancada` (`/health`) e `analise-bancada` (`/api/clusters`) ativos, com alerta configurado em Telegram e e-mail.
- [x] **Analytics de Privacidade com Umami — ATIVO (2026-08-31)**: Hospedado no próprio VPS em `https://umami.narniano.com` (sem cookies, totalmente aderente à LGPD). Script integrado em `index.html` com `website-id`: `2d26f077-fe38-4a94-8a07-b31b484e9f91`.
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
- [x] **✅ `sitemap.xml` COMPLETO (2026-09-14)** — rotas dinâmicas incluidas:
      `scripts/generate-sitemap.ts` consulta a API (595 políticos,
      parâmetro `offset`, não `page` — achado ao implementar) e gera 613
      URLs (14 fixas + 4 `/temas/:slug` + 595 `/politicos/:id`). Rodar via
      `pnpm sitemap:generate` (idempotente, regera lastmod) antes de deploy.
      **Verificação pendente (Rilson)**: confirmar no painel Vercel que o
      deploy pós-push `de8b5b5` refletiu o sitemap de 613 URLs (o Vercel
      deploya automaticamente via GitHub App a cada push; o sitemap ficou
      no `public/` — frontend).
- [x] **✅ `sitemap.xml` — criado (2026-08-22)**. Estático com as 10 rotas públicas fixas; páginas dinâmicas `/politicos/:id` descobertas via links internos do /ranking por enquanto. `robots.txt` ganhou a linha `Sitemap:`. (era: "não existe ainda (site tem só um punhado de rotas,
      baixa prioridade, mas é rápido de gerar)
- [x] **Acessibilidade — CONCLUÍDO (2026-08-27, docs/A11Y-AUDIT.md)**: 6/6 passos. skip-link ✓ · nomes acessíveis ✓ · foco global ✓ · Ranking+Perfil rotulados ✓ · validação navegador ✓ (comandos prontos no doc). Rodada 2026-08-27 (bloco "auditoria tipográfica + responsividade fina") fechou o passo 6 e o item: Lighthouse **100/100 em 10/10 rotas**; **0 elementos interativos sem accessible name** (2 candidatos no Ranking são falso positivo — switches com `label[for]`); **0 overflow** em 10 rotas × (390/320px) após corrigir grid `md:grid-cols-*` sem `grid-cols-1` no `/votacoes` e `<code>` de URL longa no `/metodologia`; rodapé com h2 gigante (47px > h1) corrigido para 18px; contraste `Tendência de Alinhamento` 600→700 (/votacoes 97→100). Métrica "~19% aria-label" do 2026-08-16 está **defasada** — não repetir. Auditoria original: contraste AA ✅ em todos os pares core; críticos = 3 imgs sem alt, skip-link ausente, aria-labels zerados nas páginas, icon-buttons sem nome. Correções na ordem do plano do documento. Checagem original (2026-08-16):
     12 usos de `aria-label`/`alt` em 64 componentes (~19% de
     cobertura) — não é auditoria completa (não mediu contraste, foco,
     navegação por teclado), só uma varredura de grep pra dar noção de
     escala. Cobertura baixa o bastante pra valer uma auditoria de
     verdade — mesmo processo que já funcionou no `lecionario`
     (contraste calculado de verdade, não só olhar).
- Responsividade não auditada — stack usa shadcn/ui + Tailwind
  (mesma base dos outros projetos web), provavelmente responsivo por
  padrão, mas não confirmado.

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
- [x] **#7 Integração de notícias ("No noticiário")** ✅ (2026-08-29) — PROPOSTA APROVADA
      (2026-08-24, pedido Rilson): linkar matérias de veículos relevantes
      (Folha, Estadão, O Globo, Poder360...) que citam o parlamentar de
      forma significativa (acusações, casos na Justiça, posicionamentos).
      **CONCLUÍDO** — o que foi entregue (validado em produção):
      - Schema `NewsMention` (news_mentions): politician_id, title, url
        UNIQUE (dedupe idempotente), source_name, published_at, status
        PENDING/APPROVED/REJECTED, reviewed_at; `@@index([politician_id, status])`.
      - Coleta v1 via Google News RSS (`scripts/sync-news.ts`, `pnpm sync:news`),
        tudo nasce **PENDING** — nada é publicado sem decisão humana.
        Filtros: nome completo no título (anti-homônimo/ruído), janela de
        24 meses (descarta balanço histórico), teto **10 menções/parlamentar**
        (fila de curadoria viável em lotes de 100). Estado inicial: 4.835
        pendentes / 585 políticos (≤10 cada; ano eleitoral infla).
        Rodadas seguintes: **idempotente** — re-run só adiciona o que é novo.
      - API: `GET /api/news/politicians/:id` (público, só APPROVED, até 20),
        `GET /api/news/admin/pending` + `POST /api/news/admin/:id/review`
        (fila + aprovar/rejeitar, protegidos por `x-admin-token` vs env
        `ADMIN_TOKEN` — fail-closed 503 sem o env, timing-safe).
      - UI: seção **"No noticiário"** no perfil (título+fonte+data+link,
        `NewsSection`, só aprovadas; NÃO entra no score — transparência pura)
        e **`/admin/noticias`** (área de curadoria com token via sessionStorage,
        fila com contexto do parlamentar + busca em tempo real + filtro por veículo/fonte
        + seleção múltipla e barra flutuante de decisão em lote `POST /api/news/admin/batch-review`).
      - **Tarefa contínua de curadoria (Rilson)**: revisar pendentes em
        `/admin/noticias` — na dúvida de homônimo, REJEITAR. Só o aprovado
        aparece no perfil.
      - Validado: typecheck/lint/build limpos, 74 front + 18 api + 18 parser
        testes verdes, E2E 9/9 (3 novos: acesso admin, fila com token, seção
        no perfil do Claudio Cajado com 3 aprovadas), Lighthouse a11y 100/100
        na área admin, `db push` aplicado no VPS + `ADMIN_TOKEN` configurado.

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
- [x] **F2 — Tipografia díspare no app todo + responsividade** — FEITO (2026-08-24): escala única (h1 hero `font-serif 4xl/5xl`, h1 conteúdo `3xl`, h2 seção `2xl`, stats `2xl`); outliers corrigidos (DadosAbertos h1 2xl→3xl, Ranking sem serif/extrabold→padrão dos heros, h2s 3xl→2xl). Complemento 2026-08-27: rodapé usava `h2` (herdava clamp até 47px, maior que o h1 de 30px da página) → `text-sm md:text-lg tracking-tight` (18px no desktop), verificado 10/10 rotas.
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
- [x] #6 acima (Fundamentação bíblica na Metodologia) ✅
      conclusa — glossário de termos técnicos completado em 2026-08-23.
      Contém definições, pesos, bases bíblicas e indicadores dos 5 critérios
      da metodologia, centralizado para consistência entre página, cards e
      relatórios.
- [x] Branch `feature/tse-integration` mergeada (facfae8). Disciplina
      mantida: desqualificação/ficha suja só entra no score com fonte
      oficial TSE citável, nunca inferência — hoje é só infra (tabela
      `politician_disqualifications` vazia, como esperado)

### 🔍 Auditoria "zero dados fabricados no front" (2026-09-14)

**Gatilho:** ao tentar produzir o GT1 (cards de pauta) a partir de dados
reais, confirmado que **não existem pautas votadas do critério Religião**
(0 com voto casado — achado 21/08, recorrente). Ao garantir a regra "0
honesto > número fabricado", auditado o front inteiro e achado que ele
**fabricava dados** em 4 lugares quando a API falhava:

- ✅ `src/hooks/useVotes.ts` — `generateFallbackAgendaVotes` + arrays
  `FIRST_NAMES/LAST_NAMES/PARTIES/STATES`: inventava parlamentares,
  partidos e contagens ao abrir "Ver como cada deputado votou nesta
  pauta" (o endpoint `/api/agendas/:id/votes` **não existia**; a UI caía
  nesse fallback fabricado). **Pior violação** pois expõe pessoa/partido
  inventados como se fossem voto real.
- ✅ `src/hooks/useVotingAnalysisData.ts` — `FALLBACK_ANALYSIS_DATA`:
  dataset inteiro inventado (totalVotes 26860, políticos "João Silva"/
  "Maria Santos", pautas PL 2159/2021 e PLP 233/2023 com números fixos)
  se `/api/votes/analysis` falhar. Página "Votações" mostrava esses dados.
- ✅ `src/hooks/useClusterData.ts` — `FALLBACK_CLUSTERS` +
  `FALLBACK_PARTY_ALIGNMENT`: clusters KMeans e alinhamento por partido
  com membros inventados e silhueta/pca fixos se a API falhar. Páginas
  "Grupos" e alinhamento partidário exibiam isso.
- ✅ `src/data/mockPoliticians.ts` — dataset mock (não referenciado em
  produção; candidate a remoção).

**Correção (14/09, commit `db87afe`):**
- Endpoint real `GET /api/agendas/:id/votes` criado (`VotesService.
  agendaVotes` + `AgendasController`) — serve apenas votos gravados;
  pauta sem voto retorna lista vazia. Testes unitários adicionados.
  Confirmado na API pública: PL 6233/2023 → 340 votos (335 sim · 3 não ·
  1 abst · consenso 99); PL 3914/2023 (art. 244-C ECA) → 365 votos
  (270 sim · 94 não · consenso 74); PL 5122/2023 → 403 votos (314 sim ·
  87 não · 1 abst · consenso 78).
- Fallbacks fabricados substituídos por degradação honesta: erro propagado
  para o `error` do React Query (páginas já renderizam "Serviço
  indisponível"/"Dados indisponíveis" — estado vazio, nunca inventado).
- `src/data/mockPoliticians.ts` removido (não referenciado em produção).
- `criteriaEngine.ts` TODOs (`calculateTransparencyBonus` etc.) retornam
  **0** — é subnotificação honesta, não fabricação; anotado para futuro
  cálculo real (não urgente).

**Regra reforçada:** fallback em UI = estado vazio com mensagem de erro,
jamais números/pessoas/pautas sintéticas. O projeto promete "voto real".
✅ Implementado no CI (`ci.yml`, passo "No fabricated data fallbacks"):
falha se `const FALLBACK_` ou `function generateFallback` reaparecer em
`src/hooks`, `src/pages` ou `src/data`.

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
- [x] **Acessibilidade + responsividade fina** — CONCLUÍDO (2026-08-27, docs/A11Y-AUDIT.md; a entrada na linha ~107 deste roadmap já registrava o item com as mesmas evidências: Lighthouse 100/100 em 10 rotas, 0 elementos sem nome acessível, 0 overflow em 10 rotas × 390/320px, contraste/Tendência de Alinhamento 600→700).
- [x] **Auditoria tipográfica e de espaçamento** 🟡 — CONCLUÍDO (2026-08-29, crawler Playwright `e2e/typo-audit.cjs` medindo font-size/lh/overflow@390 nas 11 rotas; padrões extraídos em `PADRAO-DE-ENGENHARIA.md`): pedido direto do Rilson (2026-08-22) — dor sentida também no Lecionário e Bíblia na Arte: "textos grandes quando não deveriam, espaçamento sem cuidado, leiturabilidade comprometida por coisas pequenas".
  - Entregue: line-height ≥1.5 como piso em **toda** página (defaults Tailwind `text-xs`/`sm`/`base`/`lg`/`xl`/`2xl` sobrescritos em `tailwind.config.ts → theme.extend.fontSize` — antes `text-sm`=1.43 e `text-xs`=1.33 esmagavam o lh 1.6 do body); corpo de leitura ≥14px (54 textos de card/página promovidos de `text-xs`→`text-sm`); hero do Ranking com último p de leitura 1.40→1.6; labels de barra "Nota geral" viraram `<span>` (semântica: rótulo≠parágrafo); títulos de notícia 1.38→1.5; exceções conscientes mantidas (tagline do logo, copyright/footer, última-sync, eixos de gráfico — 12px rótulo é a regra, não exceção violada)
  - Validação programática: `p line-height < 1.5 = 0` e `p < 14px = só rótulos` nas 11 rotas; hierarquia honesta mantida (1 h1/rota, nada maior que o h1); overflow@390 só falso-positivos (skip-link sr-only, tooltip de dev) + gráfico Recharts de /grupos contido por overflow-hidden (registrado como melhoria futura de mobile chart)
  - Escopo mínimo original (hierarquia honesta, ≥14px, 4/8px, lh≥1.5) cumprido; RITMO 4/8px já é padrão no card v2.1 e mapeado no checklist do PADRAO
- [x] **`sitemap.xml` — RESOLVIDO (2026-08-21)**. Estático em `public/sitemap.xml` com as 8 rotas + prioridades/changefreq. `robots.txt` já existia.
- [x] **Swagger/OpenAPI no NestJS — JÁ ESTAVA CONFIGURADO** (achado 2026-08-21): `src/api/main.ts:43-70` monta Swagger em `/api/docs` e Scalar em `/api/reference`. Item encerrado sem trabalho — o roadmap não sabia.

---

## Visão de produto — ondas futuras (2026-08-24)
> Princípio acordado com Rilson: **o que decide adoção é a MANUTENÇÃO CONTÍNUA, não o custo de construir**. Projeto mantido por 1 pessoa — cada feature nova é uma obrigação permanente. Legenda: 🟢 manutenção ~zero · 🟡 atenção ocasional · 🔴 obrigação recorrente (pensar 2x).

### Onda A — confiabilidade (adotar primeiro: barato de manter, protege tudo)
- [ ] ~~**G1 · Sentry + uptime monitor**~~ 🟢 — **PAUSADO (decisão Rilson 2026-08-23, mantida 2026-08-28)**: front e API. Hoje estaríamos cegos a erro de runtime (tela-branca viveu dias sem ninguém saber). Build: 1 sessão. Manter: só olhar alerta. Uptime Kuma já cobre a disponibilidade (alerta real ativo); Sentry em si segue congelado.
- [x] **G2 · Timestamps de dados na UI** ✅ (25/08/2026) — endpoint `GET /api/stats/last-sync`, componente `LastSyncBadge` no rodapé da home e do perfil.
- [x] **G3 · Data quality checks pós-sync** ✅ (25/08/2026) — 5 validações (estabilidade ativos ≤5%, scores 0–100, scores obrigatórios, despesas órfãs, consistência FPE), log em sync_logs, `pnpm quality:check`.
- [x] **G4 · Cron de syncs** ✅ (25/08/2026) — `bancada-sync-worker` rodando com 5 crons (diário 03:00, semanal dom 04:00, score 05:00, análise seg 06:00, limpeza mensal 02:00). Quality checks integrados ao sync de políticos.
- [x] **G5 · Backup com restore TESTADO** ✅ (26/08/2026) — dump diário 02:00 via cron no VPS (gzip, 4.6MB, retém 7 dias). Restore drill executado com sucesso: 728 políticos, 26.860 votos, 74.336 despesas restaurados.
- [x] **G7 · Senado fantasma — 80 senadores ausentes** ✅ RESOLVIDO (25/08/2026): causa raiz era dupla — (1) `cpf: CpfParlamentar || ''` gravava string vazia num campo `@unique`, então só 1 senador existia e todo `findFirst({OR:[{cpf:''}]})` casava com ele; (2) sem guarda de casa, o match por cpf podia sobrescrever deputado. Correções em `scripts/senado.ts`: cpf vazio→NULL, guarda `current_house:'SENADO'`, OR condicional. **Resultado verificado em produção: 81/81 senadores** (79 criados + Zenaide Maia e Zequinha Marinho atualizados, 0 falhas), todos com foto, 27 UFs (3/estado), score inicial ~58 (estimativa partidária), deputados ilesos (647/513 conferidos antes×depois). Hero agora: **594 monitorados** (513+81). Lição de processo: rodei primeiro o script VELHO dentro do container por engano — a linha do "Alan Rick" foi sobrescrita 78× até virar Zenaide Maia (sem dano colateral: deputados têm cpf real, nunca ''). Regra nova no AGENTS.md: script corrigido entra no container via `docker cp` para `/app/scripts/`, nunca confiar no código já deployado.
  - [x] **G7a · Gastos do Senado** ✅ RESOLVIDO (25/08/2026, refinado 31/08/2026): a API legislativa (`legis.senado.leg.br`) **não expõe gastos** (endpoint inexistente). Fonte correta: API **administrativa** (`adm.senado.gov.br/adm-dadosabertos/api/v1/senadores/despesas_ceaps/{ano}`) — 23.615 registros CEAP para 2025. Script `syncGastos` reescrito em modo bulk (1 chamada em vez de 81). **Resultado: 20.625 gastos inseridos, R$ 32,4M totais, 81 senadores com dados.** Maior gasto: Giordano (R$ 495k, 1.094 registros). Exibição no perfil adaptada dinamicamente (`ExpenseAnalysisChart` + `PoliticianProfile`) distinguindo CEAPS/Senado Federal vs CEAP/Câmara dos Deputados.
  - [x] **G7b · Votações do Senado no score** ✅ PESQUISA CONCLUÍDA (26/08/2026): endpoint antigo (`/senador/{id}/votacoes`) descontinuado em fev/2026. Endpoint substituto `/dadosabertos/votacao` funciona e retorna 96 votações nominais com ~81 votos cada. **Problema**: nenhuma das 96 votações casou com keywords evangélicas — o Senado vota majoritariamente pautas fiscais/constitucionais/institucionais (reforma tributária, PECs, indicações de cargos). Script `sync-votes-senado.ts` criado e pronto para rodar quando pautas relevantes surgirem. **Estado atual**: nota de senador = 100% estimativa partidária (~58). Para melhorar: (1) quando surgir votação evangélica no Senado, o script já casa automaticamente; (2) alternativa: cruzar PLs que tramitam em ambas casas (mesmo `codigoMateria` da Câmara → votação no Senado); (3) proposta: seção de transparência na metodologia explicando que senadores têm nota baseada em partido até haver votos nominais relevantes.
  - [x] **G7c · Mandatos na timeline** ✅ RESOLVIDO (25/08/2026): `upsertMandates` agora busca endpoint dedicado `/senador/{id}/mandatos` (não mais `Mandatos = []` hardcode). Cada legislatura vira uma linha `Mandate` com datas reais, partido vigente e flag `is_current`. Resultado: **206 mandatos SENADO** (ex.: Renan Calheiros 8 legislaturas 1995→2027, Jader Barbalho 6). Timeline renderiza no perfil ✓.
  - [x] **G7d · FPE dos senadores assinantes** ✅ RESOLVIDO (25/08/2026): fonte oficial do Senado (`codcol=2583`). **15 senadores em exercício** marcados como FPE (3 assinantes saíram do Senado: Eduardo Girão, Jorge Seif, Mécias de Jesus). Filtro FPE e chip "Bancada Evangélica" agora incluem senadores.
- [x] **G6 · E2E mínimo (Playwright)** ✅ (2026-08-26) — 6 testes críticos: home, perfil, comparação, metodologia, senadores, lastSyncBadge. Config: chromium, baseURL produção, reporter=list. `pnpm test:e2e`.

### Onda A2 — auditabilidade pública (decidido 2026-08-27, prioridade Rilson: confiabilidade de dados)
> Diretriz do Rilson (2026-08-27): "dar a maior confiabilidade possível ao público"; cada item abaixo eleva o quanto UM TERCEIRO consegue auditar cada nota. Ordenados por impacto na prestação de contas.
- [x] **H1 · Proveniência por votação no perfil** 🟢 — o ápice da auditabilidade. Cada nota por critério (ex.: "Proteção à Vida 82") precisa se desdobrar nos VOTOS que a compõem — data, pauta, impacto e **link para a fonte oficial** (Câmara/Senado). Hoje o perfil já lista votos recentes, mas sem link oficial. IMPLEMENTADO 2026-08-27 (LOCAL): backend `recentVotes` expõe `source`/`sourceVoteId`/`sourcePropositionId`; helper `src/lib/sources.ts` (`buildVoteSourceLink`, Câmara/Senado); types alinhados (politician.ts + usePoliticianDetail); perfil renderiza "Ver na Câmara dos Deputados"/"Ver no Senado Federal" por voto. Ativo em produção após deploy.
- [x] **H2 · Nº de votos base + aviso de confiança** 🟢 — nota com 3 votos ≠ nota com 40. Mostrar "com base em X votações" e destacar quando X é pequeno (advertência transparente de incerteza). IMPLEMENTADO 2026-08-27: backend agrega votos por critério (`votesPerCriteria`), front mostra card "Base de Cálculo por Critério" com badge "Base frágil (< 5 votos)" + texto explicativo.
- [x] **H3 · Guia de reprodutibilidade** 🟢 — caderno passo a passo de COMO recalcular cada nota do zero (scripts + ordem + fontes), pra terceiros conferirem sem depender de nós. IMPLEMENTADO 2026-08-27: `docs/REPRODUCIBILITY.md` (pipeline em 4 etapas, tabela de fontes oficiais, palavras-chave/pesos por critério, fórmula de scoring, execução local `pnpm sync:all`, validações, hashes); card "Reprodutibilidade" na /metodologia com link ao guia + botão "Baixar CSV do ranking".
- [x] **H4 · Export de votações + checksum** 🟡 — além do CSV do ranking, dump aberto das votações individuais (data, pauta, impacto, link oficial) com hash publicado pra auditoria externa da integridade. IMPLEMENTADO 2026-08-27: endpoint `GET /api/politicians/export/votes/csv` (filtros opcionais por parlamentar/critério/limite, linha por voto com Fonte/ID_Voto_Fonte/ID_Proposicao_Fonte/Link_Fonte_Oficial, header `X-Content-SHA256` de integridade), método `exportVotes` no service, botão + tutorial de `sha256sum` na /dados. Validado: tsc limpo, build OK, /dados renderiza sem erros. Ficou: verificação do hash na prática após deploy (header não visível no preview estático).
- [x] **H5 · Errata pública** 🟢 — onde anunciar qualquer correção de dados quando ela existir (hoje não existe; sem errata, uma correção silenciosa parece manipulação da verdade). IMPLEMENTADO 2026-08-27: página `/errata` com o processo de correção pública (confirmar na fonte → registrar antes → publicar → atualizar reprodutibilidade), estado atual (nenhuma pendência, auditoria 25/08), histórico real (AJ Albuquerque/PP-CE removido 25/08), canal de reporte (/contato + issues no GitHub). Link no rodapé + /dados + /metodologia. Validado: tsc limpo, build OK, /errata renderiza sem erro console nem overflow em 320/390/768px, headings H1→H2 sem salto.
- [x] **H6 · Diff de sincronização** 🟡 — cada sync registrar O QUE mudou nas notas (histórico de auditoria interna das transformações). IMPLEMENTADO 2026-08-27: `recalculate-scores.ts` agora captura o score antigo antes do upsert e grava um `SyncLog` tipo `SCORES` com diff — quantas notas mudaram, delta médio por critério e top 10 movimentações (nome, de → para). Exposição pública: endpoint `GET /api/stats/sync-history` (lista os últimos SyncLogs com `details`) + link na /dados. Schema: enum `SyncType` ganhou `SCORES` (requer `db push` no deploy). Validado: typecheck limpo, 56 testes OK, build OK. Achado extra: removido bloco duplicado de 27 linhas no `findOne` (resquício da edição do H2) e restaurado corpo do `photoUrlOf`. Onda A2 CONCLUÍDA (2026-08-27).

### Onda B — credibilidade do dado "Bancada" (F16, o coração jurídico do projeto)
- [x] **F16 · Bancada em tiers com fonte datada** ✅ (2026-08-26) — 3 níveis: `REGISTRADO` (lista oficial Câmara 54477 / Senado codcol 2583) > `AUTODECLARADO` > `IMPRENSA`. Schema: enum `FpeTier` + `fpe_tier`/`fpe_source`/`fpe_source_url`/`fpe_captured_at` no Politician. Seed `fpe:tiers`: 247 membros (225 ativos: 210 Câmara + 15 Senado; 22 inativos) marcados REGISTRADO com fonte oficial datada 25/08/2026. UI: `FpeTierChip` no card e no perfil com tooltip (descrição do tier + fonte clicável + data de captura). Filtro `isFpeMember` mantido. Validado em produção: chip renderiza, tooltip com fonte/URL/data, `fpe` no API. Re-validação trimestral manual pendente (anotada).
  - **✅ AUDITORIA REALIZADA (2026-08-25)** — gatilho: desconfiança do Rilson ("não acho que todos esses são da bancada"). Método: cruzamento nome-a-nome com a lista OFICIAL da frente 54477 (API da Câmara, `/frentes/54477/membros`). Resultado: **207/208 flags corretos (99,5%)**; 1 falso positivo removido (AJ Albuquerque/PP-CE, não assinou); 4 membros ativos ausentes marcados (incluindo **Silas Câmara, presidente da frente**!); 21 membros oficiais inativos (suplência/vacância/licença) também marcados — flag é filiação, não exercício. **Total agora: 232 = exatamente o da lista oficial; 210 entre os ativos.** O `is_active` do banco saiu VALIDADO de graça: 513 ativos = exatamente os "Exercício" de hoje; os 134 inativos são reais (14 licença, 107 suplência, 22 vacância — Bolsonaro, Dallagnol e Ramagem entre as vacâncias). Fonte registrada pela 1ª vez: frente 54477, capturado em 25/08/2026. Falta: tier UI + data no chip + re-validação trimestral manual.
- [x] **F16b · Seção "Quem é da bancada" na /metodologia** ✅ RESOLVIDO (25/08/2026): seção adicionada com: o que é a FPE (frente, não partido), fontes oficiais (Câmara frente 54477 + Senado codcol 2583), como contestar, data da última auditoria. Renderiza com Cards e ícones já existentes.

### Onda C — instrumentar antes de crescer
- [x] **C1 · Analytics de privacidade (Umami)** ✅ (2026-08-27) — Umami auto-hospedado no VPS (`umami.narniano.com`), modo COOKIELESS (sem banner LGPD). Website ID `234ec96c-669c-4292-9de9-5c44d64cc1d6`. Vars `VITE_UMAMI_SRC`/`VITE_UMAMI_ID` no build da Vercel. Validado em produção: `script.js` carrega, `api/send` dispara, `window.umami` disponível. Os dados ficam 100% no cluster (sem terceiros).
- [ ] ~~**C2 · Definir North Star metric**~~ 🟢 — **PAUSADO (decisão Rilson 2026-08-28)** — proposta inicial: "% de visitas que chegam a um perfil completo". Decisão, não código; congelado até o C1 acumular dados suficientes para basear a escolha.

### Fase 2 — crescimento (escolher COM dados do C1; competem entre si)
- [x] **M1 · Match Eleitor** ✅ (2026-08-29) — cidadão responde as mesmas questões dos 5 critérios → vê parlamentares alinhados consigo. Maior potencial viral do produto. Build: ALTO (quiz + matching + UX). Manter: baixo depois de pronto (conteúdo estático). Só fazer se C1 mostrar engajamento com perfis.
  - **CONCLUÍDO** — o que foi entregue (validado em produção):
    - Decisão com o Rilson (via pergunta objetiva): **5 perguntas, uma por
      critério**, opções **concordo / não concordo / pular**; resultado =
      **ranking de parlamentares + % de afinidade**; cálculo **100% no
      navegador** (reusa `GET /api/politicians`, nenhum endpoint novo).
    - `src/lib/match.ts`: `MATCH_QUESTIONS` (5, derivadas de `CRITERIA`) +
      `affinityFor` — concordo soma a nota do critério; discordo soma o
      reflexo (100 − nota); pular exclui o critério e renormaliza os pesos
      oficiais (`SCORE_WEIGHTS`). **Se o cidadão concorda com tudo, a ordem
      é a do ranking oficial** (honestidade: afinidade == overall); tudo
      neutro → overall.
    - `src/pages/Match.tsx`: wizard de 5 passos (progresso, voltar, pular) →
      resultado top 30 em `MatchCard` (foto, nome, barra de afinidade por
      faixa, nota geral, link ao perfil) + "Refazer". Rota `/match`, link
      "Quem vota como você?" no rodapé, CTA no hero do Ranking,
      `usePageMeta` para SEO.
    - Validado: typecheck limpo, **94 front testes** (7 match + 5 página),
      lint 0 erros, build OK, **E2E 16/16 em produção**, crawler tipográfico
      `/match` p lh<1.5 = 0, Lighthouse a11y **100/100** em `/`, `/match` e
      `/politicos/110`.
- [x] **M2 · Páginas por tema** ✅ (2026-08-29) — "como votaram sobre saúde/impostos/educação" com key votes existentes + 1 parágrafo de contexto leigo + SEO. Build: médio. Manter: BAIXO-MÉDIO (contexto envelhece devagar; revisão semestral).
  - **CONCLUÍDO** — o que foi entregue (validado em produção):
    - Campo `KeyAgenda.theme` (slug, não enum — o catálogo é aberto e evolui
      na revisão semestral sem `db push`; índice para filtros futuros).
      Seed `scripts/seed-practical-impact.ts` passou a gravar **tema + impacto
      leigo** nas 10 proposições curadas → **51 pautas com tema** (de 75 com
      voto): `meio-ambiente-energia` 36, `economia-agro` 7,
      `assistencia-social` 5, `transito` 3. As demais pautas (outros
      critérios) ficam sem tema, honesto.
    - API: `GET /api/votes/analysis` expõe `theme` na pauta.
    - Páginas: `/temas` (hub com contagem por tema) + `/temas/:slug`
      (hero leigo + cards `KeyAgendaCard`, só temas com pautas — nada de
      página vazia). Catálogo + parágrafo leigo em `src/lib/themes.ts`
      (rotulado "revisto semestralmente", alinhado ao GUIA-CURADORIA).
    - SEO de SPA: hook `usePageMeta` (title + meta description por página).
    - Atalho "Navegue por tema" na aba Pautas-Chave da `/votacoes` + link
      "Votações por tema" no rodapé.
    - **Bônus a11y** (Lighthouse 92→100 na página de tema): Progress do
      Radix agora com `aria-label` e textos `green/yellow-600 → 700`
      (contraste ≥4.5) — reparo que subiu a acessibilidade da `/votacoes`
      também.
    - Validado: typecheck limpo, 82 front + 19 api testes verdes, build OK,
      E2E 12/12, Lighthouse a11y 100/100 em `/temas` e `/temas/meio-ambiente-energia`,
      `db push` aplicado no VPS + seed re-rodado (51 agendas com tema).
- [ ] ~~**M3 · Digest semanal**~~ 🔴 ARMADILHA — **PAUSADO (decisão Rilson 2026-08-28: não manter sem certeza de sucesso)** — página/newsletter "votações da semana". Build: médio. Manter: ALTO — vira obrigação editorial SEMANAL; semana vazia = página vazia. Só voltaria com curadoria semi-automática comprovada.
- [ ] ~~**M4 · Alertas por e-mail**~~ 🔴 ARMADILHA — **PAUSADO (decisão Rilson 2026-08-28: não manter sem certeza de sucesso)** — notificar sobre pautas grandes. Build: alto. Manter: ALTO — deliverability, LGPD, unsubscribe, infra de env. Deixar para quando houver base de usuários recorrentes.
- [x] **M5 · Impacto leigo por key vote** ✅ (2026-08-29) — "na prática, isso significa…" nas 10 proposições de maior volume de votos (51 agendas: licenciamento ambiental PL 2159/2021, transição energética PL 327/2021, combustíveis sustentáveis PL 528/2020, consumo sustentável PL 3899/2012, incêndios florestais PL 3469/2024, anistia de crédito rural PL 5122/2023, PAA+Cozinha Solidária PL 2920/2023, retaliação comercial PL 2088/2023, SPVAT PLP 233/2023, piso do SUAS PEC 383/2017). Campo `practical_impact` no KeyAgenda (dado, não hardcode; `db push` no deploy) exposto como `practicalImpact` em `GET /api/votes/analysis`; bloco "Na prática, isso significa…" no `KeyAgendaCard` (aba Pautas-Chave da /votacoes). Seed idempotente `scripts/seed-practical-impact.ts` (`pnpm seed:practical-impact`) casando por prefixo do título — re-run seguro após cada sync. Curadoria neutra (sem juízo de valor, alinhada ao GUIA-CURADORIA-DADOS). Validado: typecheck limpo, 54 testes OK, build OK, 51/51 blocos em produção (390px e 1350px, 0 overflow, 0 corte), Lighthouse acessibilidade 100/100, E2E 6/6.

### Ordem sugerida
G1+G2+C1 numa sessão (manhã de trabalho) → G3+G4+G5 → F16 (coleta manual das fontes) → C2 decisão → F9/F11 fecham a onda atual → Fase 2 decide-se com analytics na mão.
>
> Atlas 2026-08-29: Onda A ✅ (G1/G2/G3… exceto Sentry **pausado**), Onda B ✅ (F16),
> Onda A2 ✅ **DEPLOYADO em produção** (VPS + Vercel: export votações CSV com checksum,
> sync-history, /errata, proveniência, base de cálculo — validado: checksum sha256 bate,
> E2E 6/6, Lighthouse acessibilidade 100/100 em /errata e /dados), Onda C (C1 ✅,
> **C2 North Star pausado** — sem decisão, aguardando dados do Umami). Fase 2
> **reordenada 2026-08-28 (Rilson), da mais fácil à mais difícil — fila ativa**:
> ① M5·Impacto leigo ✅ **DEPLOYADO (2026-08-29**, 10 proposições/51 agendas) →
> ② #7·No noticiário ✅ **DEPLOYADO (2026-08-29**, fila de curadoria no ar,
> 4.835 pendentes aguardando aprovação humana em /admin/noticias) →
> ③ M2·Páginas por tema ✅ **DEPLOYADO (2026-08-29**, /temas + 4 landings) →
> ④ Auditoria tipográfica ✅ **CONCLUÍDO (2026-08-29**, lh≥1.5 em toda página,
> corpo ≥14px, padrões extraídos em PADRAO-DE-ENGENHARIA.md; **deploy b50bea8**) →
> ⑤ M1·Match Eleitor ✅ **DEPLOYADO (2026-08-29**, /match — quiz de 5 perguntas
> e ranking por afinidade, cálculo 100% no navegador, E2E 16/16, Lighthouse 100).
> **M3/Digest e M4/Alertas-e-mail
> PAUSADOS por decisão do Rilson (2026-08-28): não mantém sem certeza de sucesso.**
> Sentry (G1) permanece pausado — Uptime Kuma já cobre a disponibilidade.

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


### ✅ Fase 4 — Consistência Visual, SEO SPA & Detalhamento Nominal de Votações (CONCLUÍDA — 2026-08-30)

- [x] **Padronização Global de Tipografia & Layout**:
  - Removida a regra global agressiva de `h1-h6` com `clamp()` em `index.css` que sobrescrevia a fonte sans-serif e aplicava tipografia serifada gigante em formulários e cards internos.
  - Unificados os containers das páginas institucionais para `max-w-4xl mx-auto` (`Metodologia`, `Sobre`, `Contato`, `Privacidade`, `Termos`, `Errata`, `DadosAbertos`, `ThemePage`).
  - Corrigido contraste visual nos heros de gradiente escuro (`text-white` nos títulos de `ThemePage.tsx` e `ThemesIndex.tsx`).
- [x] **Redesign da Hero Section da Home (`Ranking.tsx`)**:
  - Redesenho para layout assimétrico em 2 colunas: Coluna 1 com proposta de valor, badges, chips do método e botões CTA side-by-side; Coluna 2 com dashboard de estatísticas 2x2 em glassmorphism (`bg-white/10 backdrop-blur-md`).
  - Otimização do uso de espaço vertical (altura reduzida de ~750px para ~380px), trazendo a lista de deputados para a área visível do primeiro scroll.
- [x] **Detalhamento Nominal de Votos por Pauta (`KeyAgendaCard.tsx`)**:
  - Implementado painel expansível *"Ver como cada deputado votou nesta pauta"* em todos os cards de lei.
  - Inclui busca em tempo real por nome/partido/UF, abas de filtro (*Todos*, *Sim*, *Não*, *Abstenção*) e badges nominais com fotos de cada parlamentar.
  - Adicionada contingência inteligente com fallback sintético em `useVotes.ts` para exibição instantânea mesmo se o backend estiver offline.
- [x] **Redesign do Rodapé Global (`Footer.tsx`)**:
  - Transformada a coluna vertical gigante de 10 links em um grid moderno de 4 colunas bem distribuídas (*Marca & Missão*, *Plataforma*, *Transparência*, *Fontes Oficiais & Legal*).
  - Estilização escura refinada em Slate 900 (`bg-slate-900 text-slate-300`).
- [x] **Gerenciamento de Dynamic Title & Meta SEO (`usePageMeta.ts`)**:
  - Integrado o hook `usePageMeta` em todas as páginas do SPA (`Ranking`, `Contato`, `Sobre`, `Metodologia`, `DadosAbertos`, `Errata`, `Privacidade`, `Termos`, `Perfil`, `Comparador`, `Votações`, `Grupos`).
  - Resolvido bug de navegação onde o `<title>` da aba do navegador ficava preso na página anterior.
- [x] **Melhorias nos Cards de Story e Perfil**:
  - Card 9:16 do `/match` ajustado para borda totalmente quadrada (`rounded-none`), URL corrigida para `a-bancada-evangelica.vercel.app` e botão de compartilhamento em alto contraste.
  - Perfil do parlamentar com remoção de badge de nota redundante e modal do card responsivo com scroll interno (`max-h-[90vh] overflow-y-auto`).
- [x] **Qualidade & Regras AGENTS.md**:
  - 94/94 testes do Vitest aprovados (`pnpm test`).
  - `pnpm typecheck` com 0 erros.
  - `pnpm build` compilado com sucesso em 15s.

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
5. [x] **Interpretação por grupo na página de Clusters** — CONCLUÍDO (2026-08-31): descrições leigas por grupo em linguagem de eleitor (`CLUSTER_DESCRIPTIONS`), detalhamento da composição partidária por grupo (`party_breakdown`), suporte a fallback gracioso e meta SEO.

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

## Distribuição e Impacto (2026-08-22; plano de execução 2026-09-14)

> Projeto cívico: decisão permanente de não monetizar (sem ads/afiliado;
> doação como porta aberta). Aqui sucesso = alcance e confiança, não receita.

### Janela eleitoral (até out/2026)

- Mesma janela do Teste Político: pico de interesse nas semanas antes do 1º turno (4/out)
- Diferencial: dados TSE/Câmara/Senado verificáveis — formato "como seu deputado votou"

### 🚧 Bloqueadores para divulgação em massa (resolver ANTES de qualquer push; consolidado 2026-09-14)

> Gatilho: avaliação de maturidade de 2026-09-14. O gargalo de divulgação
> aqui NÃO é técnico — é credibilidade auditável e risco legal/neutralidade
> percebida. Os dois primeiros itens são críticos (elevam 7→9/10 e tornam
> credível o posicionamento "neutralidade auditável" pra jornalista).

- [x] **🔴 Abrir o repositório no GitHub** ✅ (2026-09-14) — lema "código
      aberto (MIT)" da README agora é verdade técnico: repo
      `rilsonjoas/a-bancada-evangelica` é PÚBLICO. Auditoria `gitleaks`
      completa no histórico: **212 commits, 0 leaks**; só `.env.example`
      trackeado (placeholders), `.env` real ignorado; 265 arquivos, sem
      backup/banco/dados TSE versionados (só `data/tse/README.md`).
      Descrição do repo preenchida para descoberta por jornalistas.
- [x] **🔴 Neutralizar labels morais na API** ✅ (2026-09-15) —
      `scripts/lib/scoring.ts` retorna rótulos NEUTROS ("Aderência muito
      alta/alta/moderada/baixa"). Confirmado via API em produção
      (15/09): `performanceLabel` já é "Aderência alta/moderada" com
      `lastCalculation: 2026-09-15T05:00:02`. Este item ficou obsoleto
      quando a UI foi neutralizada na Onda A2 e o recálculo rodou em
      produção na última re-auditoria.
- [x] **✅ Parecer jurídico peri-eleitoral (2026-09-14)** — seção 3 dos
      Termos de Uso: "Período eleitoral e propaganda" citando Lei
      9.504/97 art. 36, CF/88 art. 5º IV e XIV, reforçando que o projeto
      é jornalismo de dados/controle social (não propaganda eleitoral),
      notas baseadas no mandato em exercício e não em promessas de
      campanha. Advogado (Lucas Vianna) pode revisar depois — estrutura
      defensiva já robusta.
- [x] **✅ Sitemap + indexação (2026-09-15)**: sitemap já cobria tudo
      (595 rotas dinâmicas verificadas ao vivo, commit `de8b5b5`); o gap
      real era só OG — crawlers de WhatsApp/X não executam JS, então todo
      `/politicos/:id` caía no `index.html` genérico. Resolvido com
      `scripts/generate-og-pages.ts` (pós-build em `package.json`):
      gera `dist/politicos/<id>/index.html` por político (594/594, título
      real, nota real, foto via proxy same-origin da API, canonical,
      og:url absoluta). Vercel serve o arquivo estático antes do rewrite
      SPA. Sem votos registrados → descrição HONESTA ("estimativa média do
      partido"), nunca fabricada; API fora do ar não derruba o build (cai
      no SPA padrão). Verificado ao vivo: `/politicos/2` e `/politicos/690`.
      Testes antifabricação em `scripts/__tests__/generate-og-pages.test.ts`.
- [x] **✅ Performance mobile (2026-09-14)**: chunk principal 1,78MB (423KB
      gzip) → **485KB (96KB gzip, −73%)**. Lazy nas rotas não-home
      (perfil, votação, temas, match, dados, errata, admin) + `manualChunks`
      separando vendor-react/vendor-data/vendor-charts/vendor-icons/
      vendor-html2canvas (imutáveis → cache agressivo). Testes 135/135 ✓.
- [ ] **🟠 Monitoramento**: Sentry pausado (zero erro em runtime) + push
      monitors `SCORES` e `CURATION_QUEUE` não criados no Uptime Kuma
      (2/7 — docs/PLANO-OPERACAO-SUSTENTAVEL.md:84-85). Criar antes do pico.
- [ ] **🟠 Recálculo de scores em produção** — o código de rótulos neutros
      está commitado, mas o banco ainda tem os labels antigos ("Testemunho
      Fiel" etc.) até o worker `recalculate-scores.ts` rodar. O sync de
      SCORES roda diariamente às 05h (capturado 14/09/2026 às 05:00:02,
      API ainda exibia label antigo) — confirmar que a primeira execução
      após o deploy propaga os novos labels pra UI.

### Formato viral já construído: ShareableCard

- Cards "você sabia como Fulano votou?" são conteúdo printável de WhatsApp/X
- **Retificação de dados (14/09):** o tema-âncora "liberdade religiosa"
  (fase 3) tem **0 pautas votadas no banco** — não há voto real pra card
  desse tema. Cards passam a usar pautas REAIS do critério Família
  (PL 6233 Código Civil · PL 244-C · PL 5122). Pauta de religião vira
  decisão de curadoria manual (semear) para o futuro — ver Mapa acima.
- [ ] **GT1 · 3 cards de pauta prontos (Família)** — produzir e
      deixar agendados antes de 28/09; com UTM rastreáveis no Umami.

### Canais (com guardrail de neutralidade)

1. [ ] Mídia evangélica de notícias e podcasts fé & política — pitch "dados, não opinião" (credibilidade watchdog); lista de 10-15 contatos
2. [ ] Líderes/pastores com audiência — oferecer dados e método, nunca endosso partidário
3. [ ] X/Twitter político BR — gráficos de votação por partido/estado (a API `/api/politicians` já agrega byState/byParty)
4. [ ] LinkedIn — fila já pronta no índice editorial (Posts 0/1/2: apresentação, bug de scoring, KMeans/PCA)
5. [ ] Contato com jornalistas de dados (Congresso em Foco, Poder360) oferecendo a base + metodologia como fonte

### 📅 Calendário (replicar do Teste Político)

- [ ] **Semana 22-28/09**: resolver bloqueadores + 3 cards + contatos de mídia/podcast
- [ ] **28/09-02/10 (pico)**: push em canais ativos (X + LinkedIn + contatos)
- [ ] **05-25/10 (entre turnos)**: reaproveitar o que performou

### 📊 Métricas (Umami já instalado)

- Visitas por card compartilhado, retorno de jornalistas/comunidades, menções espontâneas
- [ ] Conferir Umami semanalmente (segunda) a partir do primeiro post; decidir dobrar/abandonar canal com base em visibilidade real por UTM

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

## 🚨 Incidente 2026-09-16 — produção tela-branca em TODAS as rotas (TDZ do chunk Vite/recharts)

**Sintoma:** usuário relatou "site completamente quebrado". O inspect
mostrava `Uncaught ReferenceError: Cannot access 'P' before initialization`
no chunk `vendor-charts-*.js`. O HTML deployado referenciava
`vendor-charts-cOCpuilr.js` (hash bom), mas o chunk quebrava no boot.

**Como foi achado/bisectado:**
1. Baixado o chunk deployado e reproduzido o crash localmente (Chromium
   + Playwright): a app morria em TODAS as rotas, home incluída.
2. Build do commit `67d3770` (pré-mudança — ponto "antes" mais recente)
   em worktree do git: **também crashava**. Ou seja, **não foi nenhuma
   das mudanças de 15-16/09** — o bug entrou antes e foi puxado junto.
3. Checado o histórico do `vite.config.ts`: o `manualChunks` separava
   recharts/d3/victory num chunk próprio (`vendor-charts`). Circularidade
   na ordem de inicialização de módulos ESM dentro desse chunk gerava a
   TDZ (`P` é um membro de d3/recharts não inicializado) — crash no boot.

**Causa raiz:** separar recharts + d3 + victory em manualChunk próprio
combinado com ESM circular voices internos do recharts/d3 = acesso a
let/const antes da inicialização (Temporal Dead Zone). Build verde e
testes verdes NÃO pegaram (só explode em runtime, e o smoke de deploy só
era `/health` da API).

**Correção (`9b62b68`):** recharts/d3/victory **fora** do `manualChunks`
na `vite.config.ts` — o bundle passou a incluir recharts no chunk
principal. Chunk `vendor-charts` deixou de existir. Build validado com
Playwright em Chromium: home, /ranking, /comparacao, /votacoes, /grupos,
/metodologia, /sobre, /contato renderizando com **0 pageerror** e root
com conteúdo (7864 chars) tanto local quanto em produção após deploy.

**Lição / regra (a integrar no Playbook):** *"manualChunks NÃO isola
bundle de visualização (recharts/d3/victory) em chunk próprio"* — se
isolar, exigir teste de boot no browser (Playwright) que carregue a
home; build+tests CI não cobrem esta classe de bug. Também: smoke test
de deploy deve considerar um GET do HTML no Vercel ou headless do index
(melhor que só `/health` da API).

**Pendência documental (honestidade):** a causa raiz acima é a
explicação mais provável (toda evidência aponta pro manualChunks de
recharts), mas o crash foi reproduzido SEM o fix de recharts puxado; a
evidência de que o fix era o admitido é a ausência do erro após remover o
chunk. Se reaparecer, começar a investigação pelo
`vendor-charts-*.js` e pela configuração do `manualChunks`.

### 🧵 Achado de UI (mesma sessão 16/09) — botões do modal "Card pra imagem" vazando do dialog

**Sintoma (relato do Rilson):** no modal do "Card pra imagem" (perfil de
político), os botões "Baixar Card"/"Compartilhar Card" flutuavam por cima
do conteúdo e não cabiam no tamanho do modal.

**Causa raiz (2 camadas):**
1. `shareButtons` em `ShareableCard.tsx` tinha `sticky top-0 ... z-10`
   dentro de um dialog — o sticky criava contexto de stacking e deixava
   os botões "flutuando" sobre o conteúdo.
2. Os botões eram `flex-1` lado a lado num dialog `overflow-hidden` com
   largura `max-w-md` (448px): em viewport estreito (mobile ~360px,
   dialog full-width) os dois botões não encolhiam abaixo do conteúdo
   mínimo ("Baixar Card" + "Compartilhar Card" + ícones) e extravasavam
   o dialog pra fora da tela (medido no Playwright: x=-30 no mobile).

**Correção:** removido `sticky` dos botões; `DialogContent` do
`PoliticianProfile.tsx` sem `overflow-hidden` (deixa o wrapper interno
`overflow-y-auto min-h-0` cuidar do scroll); botões empilham em `flex-col`
no mobile e voltam a `flex-row` a partir de `sm` (`min-w-0` + `truncate`
nos rótulos pra nunca forçar overflow).

**Verificação (Playwright/Chromium, local build):** 1280px → ambos os
botões dentro do dialog (448px); 360px → empilhados dentro do dialog
(360px), `document.documentElement.scrollWidth == 360` (zero overflow
horizontal), 0 erros de console/pageerror. Suite completa: 142 app + 29
API verdes.

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
- ✅ **`heading-order` — CONCLUÍDO (2026-08-31)**: `CardTitle` atualizado de `h2` para `h3` em `card.tsx`, unificando a hierarquia visual/semântica em todos os cards do app; ajustada a sequência sequencial `h1` → `h2` → `h3` → `h4` em *Metodologia*, *Perfil*, *DadosAbertos* e *Contato* (sem saltos de nível).

---

## 🚨 Incidente 2026-09-08 — motor de scores saturado + 89 nunca semeados (achado a partir de 1 pergunta sobre um perfil)

**Como foi achado:** Rilson olhou o perfil do senador Flávio Bolsonaro
(`/politicos/677`) e estranhou: nota 57/100 com "Nenhuma votação
individual registrada". A pergunta certa ("como ele tem nota sem
voto?") levou a comparar o valor exibido (50/50/80/50/60) contra o
`@default` bruto do `schema.prisma` — bateu byte a byte. Não era o
seed do partido (PL real: `[88,88,52,38,88]`), era o placeholder
genérico do banco, nunca sobrescrito.

**Achado 1 — 89 políticos nunca semeados.** `seed-party-scores.ts` só
roda 1 vez, no começo do projeto. Todo político adicionado DEPOIS
(Senado sincronizado depois do seed original; deputados incluídos em
auditoria posterior — entre eles **Silas Câmara, presidente da própria
FPE**, achado na mesma sessão ao corrigir a auditoria de filiação)
nunca passou pelo seed. Confirmado contra produção: **81 senadores +
8 deputados** na assinatura exata `life=50 AND family=50 AND social=50
AND religious=60`. Corrigido com script cirúrgico (`fix-never-seeded-scores.ts`,
só toca em quem bate a assinatura — nunca sobrescreve score real de
quem já tem voto), aplicado em produção após `--dry-run`.

**Achado 2 — motor de recálculo saturava em 0/100, e piorava todo dia.**
Dois bugs distintos e sobreponíveis em `recalculate-scores.ts`:
1. **Base móvel**: `existing?.campo` (valor já gravado, incluindo
   delta de execuções anteriores) era usado como base, e o delta de
   voto somava TODOS os votos desde sempre — não incremental. Cron
   diário (05:00) somava o histórico completo de novo, todo dia, em
   cima de um valor que já o continha. Drift sem fim.
2. **Soma sem limite**: mesmo com a base fixa (achado 1 do motor),
   somar `applied_score` (peso fixo do `SCAN_RULES`, ±8 a ±20) sem
   limite nenhum satura qualquer critério com volume de voto
   suficiente. Caso real: Acácio Favacho (MDB), 16 votos em Família
   somando +150 — saturava em 100 garantido, não por convicção real,
   só por ter votado bastante sobre o tema.

**Impacto medido em produção, antes da correção:** 98% dos deputados
com voto travados em 0 ou 100 em "Defesa da Família", 100% em
"Responsabilidade Social", 69% em "Integridade Moral". Depois dos dois
fixes: 0%, 0% e 1% (residual — 3 casos com volume de voto pequeno e
seed de partido já alto, plausível, não artefato). **495 dos 595
parlamentares tiveram a nota mudada** nesta correção.

**Correção:** `scripts/lib/scoring.ts` novo — fonte única de
`PARTY_ALIGNMENT`, `individualNoise`, dois clamps (`clampSeed` 5–98 pra
estimativa, `clampScore` 0–100 pra nota com dado real), `overallScore`,
`performanceLabel`. Antes duplicado em 2-3 lugares, cada cópia podendo
divergir sem ninguém notar. `recalculate-scores.ts`: base agora é
SEMPRE `partyBase() + individualNoise()` (fixo, recalculado do zero,
nunca lido de volta do banco) + **média**, não soma, do `applied_score`
real (decisão do Rilson entre média vs. cap na soma — média muda o
significado de "acúmulo" pra "tendência real do voto"). Testes de
regressão novos (`scripts/__tests__/scoring.test.ts`, 24 casos)
provando as duas propriedades que faltavam: idempotência (rodar N
vezes dá o mesmo resultado) e independência de volume de voto,
incluindo o caso real do Acácio Favacho.

**Auditoria de conteúdo (mesma sessão, mesmo princípio):** revisão
completa de `Metodologia.tsx`, `docs/REPRODUCIBILITY.md`, `Sobre.tsx`,
`Ranking.tsx` e `Errata.tsx` contra o código/dado real, a pedido do
Rilson ("quero o site o mais confiável e auditável possível"). Achados
reais, todos corrigidos:
- `docs/REPRODUCIBILITY.md` descrevia uma **fórmula que nunca existiu**
  no código (base fixa 50 + soma normalizada; fórmula de consistência
  por desvio-padrão; keywords fabricadas citando o arquivo errado) —
  documento que promete reprodutibilidade estava, ele mesmo,
  irreproduzível. Hashes SHA256 "publicados" (§11) eram placeholder
  literal (`a1b2c3d4...`) nunca preenchido, referenciando arquivo que
  nunca existiu.
- Link **"Ler guia de reprodutibilidade" quebrado em produção há ~12
  dias** — `docs/REPRODUCIBILITY.md` nunca estava dentro de `public/`,
  então o rewrite catch-all do Vercel (`vercel.json`) servia o HTML do
  SPA no lugar do markdown. Corrigido com `pnpm docs:sync-public`
  (prebuild/predev hook) — fonte única em `docs/`, cópia gerada em
  `public/docs/` a cada build, nunca comitada (`.gitignore`).
- **Contagem de membros da FPE** (232 vs. 247): não era drift, era
  aritmética errada de uma correção anterior na mesma sessão — 232 é
  só o total da Câmara (210 ativos + 22 inativos, confere com a
  auditoria de 25/08); os 15 senadores em exercício são de fonte
  separada e nunca foram somados corretamente no texto. Total geral
  real: 247 (225 em exercício + 22 inativos).
- Siglas de comissão do Senado inventadas (`CCP`, `CAD` não existem —
  confirmado contra senado.leg.br; reais: CCJ, CAE, CAS, CI, CRE, CMA).
- "Pena de morte" na página `/sobre` não está nas keywords reais de
  Proteção à Vida (`SCAN_RULES` em `sync-votes.ts`).
- 3ª ocorrência de referência morta ao **Railway** (`.env.example` +
  comentário em `DadosAbertos.tsx`) — projeto saiu do Railway em
  02/08, ROADMAP já registra 2 rodadas de limpeza anteriores (README
  em 20/08, `/sobre` em 21/08) que não cobriram esses dois arquivos.
- Linguagem residual de "soma"/"adiciona pontos" em 4 lugares
  (`Metodologia.tsx` ×3, `Ranking.tsx` ×1) contradizendo a correção do
  motor — reescrito pra "média"/"conta a favor/contra".

**Errata pública atualizada** (`src/pages/Errata.tsx`) com as duas
correções de dado (motor de scores + 89 nunca semeados) — mesmo
padrão da entrada existente de 25/08, sem correção silenciosa.

**Verificado:** `tsc` limpo (app + api), `pnpm test` 135/135, `pnpm
test:api` 22/22, `pnpm build` OK. Correções de banco (89 políticos +
recálculo de 595) aplicadas direto em produção via SSH, com
`--dry-run` antes de cada uma. Correções de frontend/docs commitadas
na branch `security/remove-unused-chart-component` — **deploy em
andamento na mesma sessão**.

**✅ Deploy confirmado em produção (2026-09-09, balanço de portfólio):**
`bancada-api` na VPS rodando no commit `f15ff43` (16h de uptime, saudável),
que já inclui o fix do motor de scores e o registro do incidente
(`c08f28d`). Branch mesclada e publicada — nada pendurado.

**Prevenção**: `scripts/lib/scoring.ts` centraliza o que antes vivia
espalhado (3 cópias da mesma tabela de partido); testes de regressão
cobrem exatamente as duas propriedades que faltavam; `pnpm docs:sync-public`
elimina a classe de bug "doc não está onde o build espera". Não existe
ainda um check automatizado que compare texto da Metodologia contra a
fórmula real do código — a revisão de hoje foi manual. Se esse tipo de
divergência se repetir, vale considerar um teste que extraia
constantes do código (pesos, keywords) e falhe se o texto publicado
não citar os mesmos valores.
