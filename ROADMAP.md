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
- [ ] #5 Integração TSE — EM ANDAMENTO na branch `feature/tse-integration`,
      pausado em 2026-08-20 a pedido do usuário. Status exato abaixo pra
      retomar sem re-investigar do zero.

      **Decisão de escopo** (esclarecida com o usuário, que inicialmente
      não sabia o que o TSE contribuía pra missão do site): dois usos,
      não um. (1) Financiamento de campanha — transparência pura no
      perfil, **não entra na pontuação** (doação legal não é crime,
      misturar com score seria insinuação sem base). (2) Ficha-limpa/
      cassação de candidatura — alimenta Integridade Moral, mesma lógica
      de despesa suspeita já usada hoje.

      **Achado crítico de infra**: dadosabertos.tse.jus.br bloqueia IP de
      nuvem/datacenter (testado daqui e do próprio VPS — 403 nos dois,
      inclusive no CDN direto contornando o portal). **Não dá pra
      automatizar via sync-worker** — precisa de download manual
      (navegador, IP residencial) toda vez que for atualizar. Arquivos
      baixados vão em `data/tse/` (gitignored, grandes demais e
      regeneráveis, não fazem sentido versionados).

      **O que já foi validado contra dado real** (não suposição):
      - CPF bate 100% entre TSE e produção (513/514 — o que falta é
        provavelmente senador eleito em 2018, fora do ciclo 2022)
      - Schema real do CSV mapeado (nomes oficiais do TSE — `NR_CPF_
        CANDIDATO`, `DS_SITUACAO_CANDIDATURA` etc. — diferente do que o
        scaffolding antigo em `src/types/api.ts` supunha)
      - Deputado Federal/Senador ficam sob `DS_ELEICAO = "Eleições
        Gerais Estaduais 2022"`, não "Eleição Geral Federal" como seria
        intuitivo
      - "Motivo de cassação": ~70% do dataset bruto é administrativo
        (indeferimento de coligação, partido invalidado) — **não é
        sobre a pessoa**, isolei só os motivos de conduta pessoal real
        (Ficha Limpa, abuso de poder, compra de voto, gasto ilícito,
        conduta vedada). Cruzando só esses com os 514 atuais: **zero
        resultado** — esperado e correto (quem foi desqualificado não
        teria sido eleito). Vale como infraestrutura duradoura mesmo
        sem efeito hoje (próxima eleição, ou cassação de mandato em
        exercício por outro processo, ainda não coberto)
      - `education_level`/`marital_status`/`occupation` no banco:
        500/0/0 de 514 preenchidos — achado real de valor imediato,
        vem junto na mesma sincronização

      **Já construído nessa branch** (schema validado contra Postgres
      descartável, script com tsc limpo, mas **dry-run ainda não
      executado**):
      - `prisma/schema.prisma`: novo model `PoliticianDisqualification`
      - `scripts/sync-tse-candidatura.ts`: lê `consulta_cand_2022.zip` +
        `motivo_cassacao_2022.zip` de `data/tse/`, preenche biografia,
        grava cassação de conduta pessoal só
      - Dependências novas: `csv-parse`, `iconv-lite`, `unzipper`

      **Próximos passos exatos pra retomar**:
      1. `pnpm sync:tse:candidatura --dry-run` (só lê, não grava) —
         testar antes de rodar de verdade em produção
      2. Se ok, rodar sem `--dry-run`, `prisma db push` (projeto usa
         `db push`, nunca usou `prisma migrate` — não introduzir
         migração versionada, foge do padrão real do projeto)
      3. Financiamento de campanha: usuário já achou o arquivo certo —
         `receitas_candidatos_2022_BRASIL.csv` dentro de
         `prestacao_de_contas_eleitorais_candidatos_2022.zip` (432MB
         descomprimido, schema já conferido no cabeçalho: `NR_CPF_
         CANDIDATO`, `NR_CPF_CNPJ_DOADOR`, `NM_DOADOR`, `VR_RECEITA`).
         Ainda não processado — só cabeçalho e 2 linhas de amostra
      4. Fechar a issue #5 no GitHub só depois de testado em produção
         de verdade, não antes
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
- Monetização (se algum dia fizer sentido) não deveria ser ads — um
  site de transparência parlamentar com ads perde credibilidade;
  financiamento coletivo transparente é mais coerente com o propósito.

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
