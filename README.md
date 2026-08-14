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
| GET | `/health` | Health check (Railway) |

Documentação interativa: `https://a-bancada-evangelica-production.up.railway.app/api/docs`

---

## Deploy

O deploy é automático via **Railway** no push para `main`.

> **⚠️ Atenção:** O Railway é gratuito apenas por 30 dias. Após esse período, o backend deixará de funcionar a menos que seja migrado para uma alternativa (ex.: Render, Fly.io, Coolify, ou um VPS próprio).

```bash
# Variáveis de ambiente necessárias no Railway:
DATABASE_URL       # Neon PostgreSQL connection string
PORT               # definida automaticamente pelo Railway
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
