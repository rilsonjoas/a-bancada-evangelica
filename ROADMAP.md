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

- [ ] **Remover `db_cluster-27-10-2025@05-42-20.backup.gz` do histórico
      do git.** Achado em 2026-08-08: um dump completo do Postgres
      (schema `auth.*` do Supabase inteiro — `auth.users`,
      `auth.sessions`, `auth.refresh_tokens`, etc.) está commitado na
      raiz do repo. **Verificado: a tabela `auth.users` está vazia
      nesse dump específico — não vazou credencial real.** O repo
      também é privado, o que reduz a exposição atual. Mas é a mesma
      prática de risco já corrigida no biblia-na-arte nesta sessão
      (backup de 463MB removido do histórico via `git-filter-repo`) —
      vale limpar do mesmo jeito antes que aconteça de novo com dado
      real dentro. `.gitignore` já bloqueia `.env` corretamente, só
      faltou cobrir arquivos de backup (`*.backup.gz`, `*.sql.gz`)
- [ ] Confirmar se o rate limiting existe nas rotas de auth da API
      NestJS (não verificado neste levantamento — os outros 2 projetos
      não tinham antes de eu checar, vale a mesma checagem aqui)
- [ ] `pnpm audit` no CI (nem CI existe ainda, ver P3)

## P1 — Docker & VPS

- [x] Já tem `Dockerfile` na raiz e está rodando no VPS
      (`bancada-api`, `bancada-analysis`, ver `hetzner-infra/RECUPERACAO.md`)
- [ ] **`README.md` está desatualizado**: badge e tabela de stack ainda
      dizem "Deploy: Railway", mas o backend já está no VPS Hetzner
      desde antes desta sessão. `railway.toml` também ainda está na
      raiz do repo — decidir se mantém como fallback documentado ou
      remove
- [x] Frontend continua na Vercel (arquitetura intencional, não é gap)

## P2 — Saúde & Resiliência

- [ ] Não auditado — categoria nova (fusão com o SHIELD, 2026-08-09).
      Confirmar se a API NestJS tem endpoint de health check testando
      dependência real (banco), e se trata `SIGTERM` graciosamente

## P3 — CI/CD

- [ ] **Não existe `.github/workflows/` hoje** — apesar de ter 32 testes
      reais (`vitest run`) e lint (`eslint .`) configurados, nada disso
      roda sozinho em push/PR. É o mesmo buraco dos outros 2 projetos
      já no VPS — nenhum dos 3 tem CI ainda
- [ ] `pnpm audit` como parte do mesmo workflow

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

- [ ] Depende 100% do backup geral do VPS (`hetzner-infra/backup/`) —
      não auditado se cobre `bancada_evangelica_db` especificamente.
      Categoria nova (fusão com SHIELD)

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
