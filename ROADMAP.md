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

## P1 — Docker & VPS

- [x] Já tem `Dockerfile` na raiz e está rodando no VPS
      (`bancada-api`, `bancada-analysis`, ver `hetzner-infra/RECUPERACAO.md`)
- [x] **`README.md` atualizado**: links, badges e stack técnica corrigidos para apontar para o VPS Hetzner.
- [x] Frontend continua na Vercel (arquitetura intencional, não é gap)

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

- Fora do escopo deste roadmap de engenharia — produto já é real (514
  deputados avaliados, dados oficiais da Câmara), sem mudança proposta
  aqui

## P9 — Documentação

- [ ] Corrigir o `README.md` (ver P1 — Railway desatualizado)
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
