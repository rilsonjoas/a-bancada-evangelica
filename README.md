# A Bancada Evangélica

<p align="center">
  <strong>Plataforma de transparência parlamentar com avaliação por valores cristãos</strong><br/>
  Parlamentares da 57ª legislatura avaliados em 5 critérios — com dados reais da Câmara dos Deputados e do Senado
</p>

<p align="center">
  <a href="https://a-bancada-evangelica.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/demo-ao%20vivo-brightgreen?style=flat-square&logo=vercel" alt="Demo ao vivo" />
  </a>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Testes-157%20passando-brightgreen?style=flat-square&logo=vitest" />
  <img src="https://img.shields.io/badge/Deploy-Hetzner%20VPS-orange?style=flat-square&logo=hetzner" />
</p>

<p align="center">
  <img src="docs/screenshots/preview.png" alt="A Bancada Evangélica Preview" width="800" />
</p>

---

## O que é

**A Bancada Evangélica** avalia os parlamentares da 57ª legislatura (2023–2027) — 513 deputados federais da Câmara + 82 senadores — com base em 5 critérios objetivos de alinhamento com valores cristãos: proteção à vida, valores familiares, integridade moral, responsabilidade social e liberdade religiosa.

A Frente Parlamentar Evangélica (FPE) é um **filtro opcional** — não um limite. O eleitor pode ver o ranking geral ou ativar o toggle "Apenas FPE" para focar nos deputados que se identificam publicamente como representantes evangélicos (a contagem vigente, com a data da captura oficial, está em `/metodologia`).

> *"O parlamentar que diz falar em nome da fé está de fato defendendo esses valores no plenário?"*

---

## Por que isto existe

Parlamentar que se apresenta como representante de valores cristãos é cobrado por isso na campanha, mas dificilmente depois — o eleitor não tem tempo nem ferramenta pra cruzar discurso com voto real de cada projeto de lei. A imprensa secular cobre o Congresso, mas não com essa lente; a imprensa cristã cobre com essa lente, mas raramente com dado verificável de voto, só de posicionamento público.

Isso é sobre uma coisa só: verdade sustentada por dado, não por retórica. "E tudo o que saia da minha boca revele esta verdade" vale tanto pra mim escrevendo isto quanto pra qualquer parlamentar que citei aqui — os critérios são objetivos, documentados e auditáveis, e o projeto não existe pra empurrar um partido, existe pra que o voto real fique visível.

O projeto avalia os parlamentares da legislatura com dado oficial da Câmara, do Senado e do TSE, metodologia publicada, sem viés partidário declarado. A visão de longo prazo não é audiência de massa — é virar a fonte que jornalista e pesquisador citam quando precisam saber, com dado, se o discurso bate com o voto. Isso se constrói com credibilidade acumulada votação a votação, não com uma campanha de lançamento.

### Decisão permanente: sem anúncio, sem afiliado, sem destaque pago

Este projeto não roda anúncio, não tem afiliado, não vende dado nem destaque pago — por decisão, não por falta de tráfego. Uma ferramenta de fiscalização parlamentar que depende desse tipo de receita carrega, estruturalmente, o incentivo errado: quem paga a conta pode acabar influenciando o que aparece em destaque ou como. O valor real de "A Bancada Evangélica" é ser citável sem essa dúvida pairando — nenhum anunciante, nenhum partido, nenhum parlamentar tem como comprar visibilidade aqui. Isso é o produto, não uma limitação dele.

**Doação, se algum dia existir, é diferente** — é financiamento tipo Wikipedia: quem lê sustenta a existência do projeto, sem comprar nada em troca (sem destaque, sem influência sobre critério, sem logo de patrocinador). Essa porta continua aberta e é candidata a entrar no roadmap em breve (ver `ROADMAP.md`) — o que está fechado pra sempre é qualquer modelo onde alguém paga e o produto muda de forma em troca.

## Stack técnica

| Camada | Tecnologias |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, TanStack Query, shadcn/ui, Tailwind CSS, Recharts |
| **API** | NestJS 11 (IoC/DI), Prisma ORM, PostgreSQL (Hetzner VPS) |
| **Testes** | Vitest, Testing Library (`pnpm test` · `pnpm test:api`) |
| **Infra** | Hetzner VPS (API + Análise ML via Docker), Vercel (frontend) |
| **Fontes de dados** | API oficial da Câmara dos Deputados, CEAP (cota parlamentar) |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                    │
│  React 18 · TypeScript · Vite · TanStack Query · shadcn │
└──────────────────────┬──────────────────────────────────┘
                       │ VITE_API_URL
          ┌────────────▼────────────┐
          │     Hetzner (NestJS)    │
          │  AppModule              │
          │  ├─ PoliticiansModule   │
          │  ├─ VotesModule         │
          │  ├─ PartiesModule       │
          │  ├─ StatsModule         │
          │  ├─ MethodologyModule   │
          │  └─ HealthModule        │
          └────────────┬────────────┘
                       │ Prisma Client
          ┌────────────▼────────────┐
          │    Shared PostgreSQL    │
          │  politicians            │
          │  politician_scores      │
          │  votes · key_agendas    │
          │  mandates · expenses    │
          └─────────────────────────┘
```

A API segue o padrão de **módulos NestJS com injeção de dependência** — cada domínio tem seu próprio `Module`, `Controller` e `Service`. O Prisma é exposto como um `@Global()` singleton via `PrismaModule`.

---

## Funcionalidades

### Implementadas e funcionando

| Feature | Detalhe |
|---|---|
| **Ranking** | Parlamentares ordenados por score, com filtros de estado, partido e casa |
| **Filtro FPE** | Toggle "Apenas FPE" — membros identificados via API da Câmara (contagem vigente em `/metodologia`) |
| **Perfil individual** | Score por critério, histórico de votações, análise de gastos, mandatos |
| **Comparação** | Compare até 4 parlamentares lado a lado em todos os critérios |
| **Análise de Votações** | Votos nominais e pautas monitoradas, com ranking de alinhamento |
| **Alinhamento por partido** | Score médio por partido com segmentação por nível |
| **Metodologia** | Página completa explicando pesos, critérios e fontes de dados |
| **API REST** | 10 endpoints com documentação Swagger em `/api/docs` |
| **Testes** | Suíte automatizada cobrindo componentes, regras de scoring e API (`pnpm test`, `pnpm test:api`) |
| **Sync automático** | Worker próprio (`sync-worker.ts`, node-cron): políticos 03h diário, gastos domingo 04h, scores 05h diário — dado não fica desatualizado numa votação importante |

### Critérios de avaliação

| Critério | Peso | Ícone |
|---|---|---|
| Proteção à Vida | 30% | Shield |
| Valores Familiares | 25% | Home |
| Integridade Moral | 20% | Scale |
| Responsabilidade Social | 15% | Handshake |
| Liberdade Religiosa | 10% | Church |

### Pendente / Roadmap

| Feature | Status |
|---|---|
| Análise ML de clusters de votação (KMeans/PCA) | Serviço Python separado — em implantação |
| Cobertura de despesas (hoje parcial — nem todo parlamentar tem despesa sincronizada) | Ver `docs/DETECCAO-DESPESAS.md` §6 |
| Votos individuais para todas as pautas | PL 1904/2024 e outros tramitaram em comissão sem votação nominal disponível |

### Documentação

| Doc | O que resolve |
|---|---|
| [`docs/REPRODUCIBILITY.md`](docs/REPRODUCIBILITY.md) | Como recalcular todas as notas do zero — pipeline, fontes, fórmula de scoring |
| [`docs/DETECCAO-DESPESAS.md`](docs/DETECCAO-DESPESAS.md) | Como o "fora do padrão" é detectado, auditoria das regras descartadas, limites |
| [`docs/DECISOES.md`](docs/DECISOES.md) | Log de decisões: o que foi escolhido, o que foi descartado e por quê |
| [`docs/AUDITORIA-CALCULOS.md`](docs/AUDITORIA-CALCULOS.md) | **O que a nota realmente mede** — e o que ela não sabe. Comece por aqui |
| [`docs/GUIA-CURADORIA-DADOS.md`](docs/GUIA-CURATORIA-DADOS.md) | Como curar pauta e notícia sem fabricar número |
| [`AGENTS.md`](AGENTS.md) | Regras de trabalho e ordem mínima de verificação |

---

## Dados reais (57ª legislatura)

> **Os números abaixo são um snapshot de 2026-09-14 e envelhecem.** O valor
> **vigente** está em [a-bancada-evangelica.vercel.app](https://a-bancada-evangelica.vercel.app)
> e o histórico de cada sync em `/dados`. Nada aqui deve ser tratado como
> número fixo — ver `docs/REPRODUCIBILITY.md` §7.3, que já pedia exatamente
> isso antes de este bloco existir.

```
Snapshot de 2026-09-14 (o número de hoje é maior — consulte o site):
Parlamentares avaliados:   595 (513 Câmara + 82 Senado)
Com voto próprio:          505
Avaliados só por partido:  89
Votos monitorados:         26.860
Pautas-chave:              83
Média geral:               63,1 / 100

Distribuição de performance (rótulos neutros de aderência, capturado 2026-09-14):
  Aderência muito alta (≥80 pts):    42 parlamentares (7,1%)
  Aderência alta (65–79 pts):       296 parlamentares (49,7%)
  Aderência moderada (45–64 pts):   146 parlamentares (24,5%)
  Aderência baixa (<45 pts):        111 parlamentares (18,7%)
```

**Cobertura desigual entre os dados** — vale saber antes de comparar:

| Dado | Cobertura |
|---|---|
| Votos nominais | completa |
| Despesas (CEAP/CEAPS) | **parcial** — nem todo parlamentar tem despesa sincronizada |
| Membros da FPE | captura datada, auditada contra a lista oficial |

> Só o primeiro está completo. Gasto é o que mais sofre variação, e a
> aba de Gastos marca explicitamente quem não tem dado — ausência de dado
> não é gasto normal. Ver `docs/DETECCAO-DESPESAS.md` §6.

---

## Como rodar localmente

### Pré-requisitos
- Node.js 22+, pnpm 9+
- PostgreSQL (ou conta Neon)

### Setup

```bash
git clone https://github.com/seu-usuario/a-bancada-evangelica.git
cd a-bancada-evangelica
pnpm install
```

Crie um `.env` na raiz (use `.env.example` como base):

```env
DATABASE_URL="postgresql://..."
VITE_API_URL="http://localhost:3001"
```

```bash
# Gerar Prisma Client e aplicar migrations
pnpm db:generate
pnpm db:push

# Sincronizar dados da Câmara (deputados, votos, FPE)
pnpm sync:camara        # ~2 min — busca deputados e mandatos
pnpm sync:votes         # ~3 min — votos nas pautas monitoradas
pnpm sync:fpe           # ~1 min — identifica membros da FPE
pnpm scores:recalculate # recalcula pontuações

# Rodar em desenvolvimento
pnpm dev                # frontend na :8080
pnpm dev:api            # API NestJS na :3001
```

### Testes

```bash
pnpm test               # 32 testes (Vitest + Testing Library)
pnpm test:coverage      # com cobertura
```

---

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/politicians` | Lista com filtros (estado, partido, FPE, score) |
| GET | `/api/politicians/ranking` | Top parlamentares por critério |
| GET | `/api/politicians/:id` | Perfil completo com scores, votos e gastos |
| GET | `/api/votes/analysis` | Análise agregada de votações e pautas-chave |
| GET | `/api/parties/alignment` | Score médio por partido |
| GET | `/api/stats/overview` | Estatísticas gerais do banco |
| GET | `/api/methodology/pillars` | Critérios e pesos |
| GET | `/health` | Health check |

Documentação interativa: `https://api-bancada.narniano.com/api/docs`

---

## Deploy

Self-hosted no VPS Hetzner desde 2026-08-02 — saiu do Railway (trial de 30 dias
expirou em 08/08 e derrubou o deploy sozinho) e do Neon (Postgres agora é o
compartilhado do VPS). Frontend segue no Vercel; API e worker de sync rodam em
containers Docker atrás de Traefik.

Deploy é automático (`.github/workflows/deploy.yml`) no push pra `main`: a
Action conecta via SSH no VPS, dá `git pull` neste repo e roda
`make deploy service=bancada` (definido em `hetzner-infra`), depois confere
com smoke test (retry em `/health` até 10x) antes de considerar concluído.

```bash
# Variáveis de ambiente (arquivo .env no VPS, nunca commitado):
DATABASE_URL       # Postgres compartilhado do VPS (bancada_evangelica_db)
PORT               # 3001, fixo (ver docker-compose.yml em hetzner-infra/bancada/)
FRONTEND_URL       # URL do Vercel (para CORS em prod)
```

O arquivo de entrada é `api-server.cjs` — um bootstrap CJS que resolve o conflito ESM/CJS entre o `"type": "module"` do package.json raiz e os decoradores NestJS que exigem `emitDecoratorMetadata` no modo CommonJS.

---

## Estrutura do projeto

```
a-bancada-evangelica/
├── src/
│   ├── api/                    # NestJS (backend)
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── politicians/        # module · controller · service · dto
│   │   ├── votes/
│   │   ├── parties/
│   │   ├── stats/
│   │   ├── methodology/
│   │   ├── health/
│   │   └── prisma/             # @Global() PrismaService
│   ├── components/             # React components (shadcn/ui)
│   ├── hooks/                  # TanStack Query hooks
│   ├── lib/
│   │   ├── criteria.tsx        # Fonte única dos 5 critérios (ícones, pesos, cores)
│   │   └── apiClient.ts
│   ├── pages/                  # Ranking · Perfil · Comparação · Votações · Grupos · Metodologia
│   └── types/
├── scripts/
│   ├── sync-camara.ts          # Sincroniza deputados da API da Câmara
│   ├── sync-votes.ts           # Importa votos nas pautas monitoradas
│   ├── sync-fpe-members.ts     # Identifica membros da FPE (paginação)
│   └── recalculate-scores.ts   # Recalcula pontuações com base nos votos
├── prisma/
│   └── schema.prisma
├── api-server.cjs              # Entry point CJS para NestJS
└── tsconfig.api.json           # Config TS específica para o backend
```

---

## Licença

MIT — dados públicos da Câmara dos Deputados (camara.leg.br/api)
