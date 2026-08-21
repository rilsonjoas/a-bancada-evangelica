# A Bancada Evangélica

<p align="center">
  <strong>Plataforma de transparência parlamentar com avaliação por valores cristãos</strong><br/>
  514 deputados federais avaliados em 5 critérios — com dados reais da Câmara dos Deputados
</p>

<p align="center">
  <a href="https://a-bancada-evangelica.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/demo-ao%20vivo-brightgreen?style=flat-square&logo=vercel" alt="Demo ao vivo" />
  </a>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Testes-32%20passando-brightgreen?style=flat-square&logo=vitest" />
  <img src="https://img.shields.io/badge/Deploy-Hetzner%20VPS-orange?style=flat-square&logo=hetzner" />
</p>

---

## O que é

**A Bancada Evangélica** avalia todos os deputados federais da 57ª legislatura (2023–2027) com base em 5 critérios objetivos de alinhamento com valores cristãos: proteção à vida, valores familiares, integridade moral, responsabilidade social e liberdade religiosa.

A Frente Parlamentar Evangélica (FPE) é um **filtro opcional** — não um limite. O eleitor pode ver o ranking geral ou ativar o toggle "Apenas FPE" para focar nos 209 deputados que se identificam publicamente como representantes evangélicos.

> *"O parlamentar que diz falar em nome da fé está de fato defendendo esses valores no plenário?"*

---

## Por que isto existe

Parlamentar que se apresenta como representante de valores cristãos é cobrado por isso na campanha, mas dificilmente depois — o eleitor não tem tempo nem ferramenta pra cruzar discurso com voto real de cada projeto de lei. A imprensa secular cobre o Congresso, mas não com essa lente; a imprensa cristã cobre com essa lente, mas raramente com dado verificável de voto, só de posicionamento público.

Isso é sobre uma coisa só: verdade sustentada por dado, não por retórica. "E tudo o que saia da minha boca revele esta verdade" vale tanto pra mim escrevendo isto quanto pra qualquer parlamentar que citei aqui — os critérios são objetivos, documentados e auditáveis, e o projeto não existe pra empurrar um partido, existe pra que o voto real fique visível.

Hoje são 514 deputados avaliados com dado oficial da Câmara, metodologia publicada, sem viés partidário declarado. A visão de longo prazo não é audiência de massa — é virar a fonte que jornalista e pesquisador citam quando precisam saber, com dado, se o discurso bate com o voto. Isso se constrói com credibilidade acumulada votação a votação, não com uma campanha de lançamento.

### Decisão permanente: sem anúncio, sem afiliado, sem destaque pago

Este projeto não roda anúncio, não tem afiliado, não vende dado nem destaque pago — por decisão, não por falta de tráfego. Uma ferramenta de fiscalização parlamentar que depende desse tipo de receita carrega, estruturalmente, o incentivo errado: quem paga a conta pode acabar influenciando o que aparece em destaque ou como. O valor real de "A Bancada Evangélica" é ser citável sem essa dúvida pairando — nenhum anunciante, nenhum partido, nenhum parlamentar tem como comprar visibilidade aqui. Isso é o produto, não uma limitação dele.

**Doação, se algum dia existir, é diferente** — é financiamento tipo Wikipedia: quem lê sustenta a existência do projeto, sem comprar nada em troca (sem destaque, sem influência sobre critério, sem logo de patrocinador). Essa porta continua aberta e é candidata a entrar no roadmap em breve (ver `ROADMAP.md`) — o que está fechado pra sempre é qualquer modelo onde alguém paga e o produto muda de forma em troca.

## Stack técnica

| Camada | Tecnologias |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, TanStack Query, shadcn/ui, Tailwind CSS, Recharts |
| **API** | NestJS 11 (IoC/DI), Prisma ORM, PostgreSQL (Hetzner VPS) |
| **Testes** | Vitest, Testing Library (32 testes, 4 suites) |
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
| **Ranking** | 514 parlamentares ordenados por score, com filtros de estado, partido e casa |
| **Filtro FPE** | Toggle "Apenas FPE" — 209 membros identificados via API da Câmara |
| **Perfil individual** | Score por critério, histórico de votações, análise de gastos, mandatos |
| **Comparação** | Compare até 4 parlamentares lado a lado em todos os critérios |
| **Análise de Votações** | 7.930 votos, 31 pautas monitoradas, ranking de alinhamento |
| **Alinhamento por partido** | Score médio por partido com segmentação por nível |
| **Metodologia** | Página completa explicando pesos, critérios e fontes de dados |
| **API REST** | 10 endpoints com documentação Swagger em `/api/docs` |
| **Testes** | 32 testes automatizados cobrindo componentes e lógica de UI |
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
| Sincronização completa de gastos CEAP | Script pronto (`pnpm sync:camara`), dados parciais |
| Votos individuais para todas as pautas | PL 1904/2024 e outros tramitaram em comissão sem votação nominal disponível |

---

## Dados reais (57ª legislatura)

```
Parlamentares ativos:   514
Com scores calculados:  514 (100%)
Votos monitorados:      7.930
Pautas-chave:           31
Membros da FPE:         209 / 514 (40,6%)

Distribuição de performance:
  Guardião da Fé (≥80 pts):   133 parlamentares (25,9%)
  Aliado (65–79 pts):          215 parlamentares (41,8%)
  Parcial (45–64 pts):         213 parlamentares (41,4%)
  Divergente (<45 pts):         85 parlamentares (16,5%)
```

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
