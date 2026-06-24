# A Bancada Evangélica

<p align="center">
  <strong>Plataforma de transparência parlamentar com análise de padrões de votação via ML</strong><br/>
  Dados reais das APIs da Câmara dos Deputados e do Senado Federal
</p>

<p align="center">
  <a href="https://a-bancada-evangelica.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/demo-live-brightgreen?style=flat-square&logo=vercel" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/scikit--learn-1.5-F7931E?style=flat-square&logo=scikit-learn" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

---

## O que é

**A Bancada Evangélica** avalia todos os parlamentares brasileiros ativos (Câmara + Senado) com base em 5 critérios ponderados derivados de pautas legislativas reais. A plataforma consome as APIs públicas do governo federal, calcula pontuações de forma determinística e as expõe via API REST.

Um segundo serviço em Python aplica **KMeans clustering** sobre a matriz de votações dos deputados, revelando grupos com padrão de voto similar — funcionalidade implementada com scikit-learn e exposta via FastAPI.

**Demo:** [a-bancada-evangelica.vercel.app](https://a-bancada-evangelica.vercel.app)

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel (Frontend)                   │
│  React 18 · TypeScript · Vite · TanStack Query · shadcn │
└────────────────────┬────────────────────────────────────┘
                     │ fetch (VITE_API_URL)
          ┌──────────┴──────────┐
          │                     │
┌─────────▼──────────┐ ┌────────▼───────────┐
│  Railway (API)     │ │  Railway (Analysis) │
│  Express 5 · Prisma│ │  FastAPI · sklearn  │
│  TypeScript        │ │  Python 3.12        │
└─────────┬──────────┘ └────────┬───────────┘
          │                     │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │   Neon PostgreSQL   │
          │   (serverless)      │
          └─────────────────────┘
```

---

## Critérios de Avaliação

Implementados em [`src/services/scoring/criteriaEngine.ts`](src/services/scoring/criteriaEngine.ts):

| Critério | Peso | Base de avaliação |
|---|---|---|
| 🛡️ Proteção à Vida | 30% | Votações sobre aborto e eutanásia |
| 👨‍👩‍👧‍👦 Valores Familiares | 25% | Casamento, adoção, educação |
| ⚖️ Integridade Moral | 20% | Despesas parlamentares + votações de ética |
| 🤝 Responsabilidade Social | 15% | Projetos para populações vulneráveis |
| ✝️ Liberdade Religiosa | 10% | Proteção ao culto e expressão de fé |

---

## Serviço de Análise ML (`analysis/`)

Serviço Python independente que aplica clustering não-supervisionado sobre a matriz de votações:

1. **Coleta**: `load_voting_matrix()` — matriz esparsa (parlamentar × pauta) via psycopg2
2. **Normalização**: `StandardScaler` para remover viés de escala
3. **Redução**: `PCA` preservando 95% da variância explicada
4. **Clustering**: `KMeans` com k ótimo calculado por silhouette score
5. **Visualização**: redução adicional a 2D para scatter plot no frontend

**Endpoints:**
```
GET /api/clusters                       → grupos com coordenadas 2D, silhouette, k
GET /api/deputies/{id}/similar          → n deputados com votação mais próxima
GET /health                             → healthcheck
```

---

## Stack Completa

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · TanStack Query · Recharts |
| API JS | Express 5 · Prisma ORM · TypeScript · tsx |
| API Python | FastAPI · scikit-learn · pandas · numpy · psycopg2 |
| Banco | PostgreSQL (Neon serverless) |
| Deploy | Vercel (frontend) · Railway (backend Node + Python) |
| APIs externas | Câmara dos Deputados V2 · Senado Federal (XML/REST) |

---

## Início Rápido

### Pré-requisitos
- Node.js 18+ e pnpm
- Python 3.12+
- PostgreSQL (Neon ou local)

### Instalação

```bash
git clone https://github.com/rilsonjoas/a-bancada-evangelica.git
cd a-bancada-evangelica

# Dependências Node
pnpm install

# Variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Schema do banco
pnpm db:push

# Desenvolvimento (frontend + API)
pnpm dev:full
```

### Sincronização de dados

```bash
pnpm sync:camara        # 513 deputados da Câmara
pnpm sync:senado        # 81 senadores
pnpm analyze:expenses   # Detecção de despesas suspeitas
```

### Serviço Python (análise ML)

```bash
cd analysis
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
# http://localhost:8001/api/clusters
```

---

## Variáveis de Ambiente

```bash
# .env.example
DATABASE_URL=postgresql://user:pass@host/db?pgbouncer=true&sslmode=require
DIRECT_URL=postgresql://user:pass@host/db?sslmode=require
VITE_API_URL=https://seu-backend.up.railway.app
VITE_ANALYSIS_URL=https://seu-analysis.up.railway.app
PORT=3001
```

---

## API Reference

```
GET /api/politicians              → lista com filtros (estado, partido, casa, score)
GET /api/politicians/ranking      → ranking ordenado por pontuação
GET /api/politicians/:id          → perfil completo com histórico e gastos
GET /api/stats/overview           → estatísticas gerais da plataforma
GET /api/methodology/pillars      → critérios de avaliação
GET /api/methodology/content      → conteúdo dinâmico da metodologia
GET /health                       → healthcheck
```

---

## Estrutura do Projeto

```
├── src/
│   ├── api/server.ts            # Express — API REST principal
│   ├── components/              # UI: cards, gráficos, comparação, social
│   ├── hooks/                   # TanStack Query: usePoliticians, useClusters…
│   ├── lib/
│   │   ├── apiClient.ts         # fetch centralizado com VITE_API_URL
│   │   └── prisma.ts            # singleton PrismaClient
│   ├── pages/                   # Ranking, Perfil, Comparação, Clusters, Metodologia
│   └── services/scoring/
│       └── criteriaEngine.ts    # motor de pontuação determinístico
├── analysis/                    # Serviço Python (FastAPI + sklearn)
│   ├── main.py
│   ├── app/
│   │   ├── database.py          # psycopg2 — matriz de votações
│   │   └── services/clustering.py  # KMeans + PCA + silhouette
│   └── requirements.txt
├── prisma/schema.prisma         # schema PostgreSQL
├── scripts/                     # sync-camara, sync-senado, expense-analyzer
├── railway.toml                 # config deploy Node (Railway)
└── vercel.json                  # rewrite SPA + cache headers
```

---

## Licença

MIT — veja [LICENSE](LICENSE).
