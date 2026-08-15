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

- [ ] Sem Sentry, sem Uptime Kuma confirmado pra este domínio
      especificamente (verificar se `a-bancada-evangelica.vercel.app` e
      a API do VPS estão nos monitores existentes)
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
- [ ] Acessibilidade — não auditado neste levantamento
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
