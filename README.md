# A Bancada Evangélica

<p align="center">
  <strong>Monitorando se os parlamentares evangélicos votam como pregam</strong><br/>
  Plataforma de transparência sobre a Frente Parlamentar Evangélica (FPE) com dados reais da Câmara dos Deputados
</p>

<p align="center">
  <a href="https://a-bancada-evangelica.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/demo-live-brightgreen?style=flat-square&logo=vercel" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/scikit--learn-1.5-F7931E?style=flat-square&logo=scikit-learn" />
  <img src="https://img.shields.io/badge/Tests-32%20passing-brightgreen?style=flat-square&logo=vitest" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

---

## Missão

**A Bancada Evangélica** é uma plataforma de accountability que avalia se os membros da **Frente Parlamentar Evangélica (FPE)** votam em consonância com os valores cristãos que declaram representar.

O eleitor evangélico precisa de transparência para responder: *"O parlamentar que diz falar em nome da fé está de fato defendendo esses valores no plenário?"*

---

## Estado Real do Projeto (Junho/2026)

> Este é um projeto em desenvolvimento ativo. Os dados abaixo refletem o estado atual da base, não o escopo final.

### O que está funcionando

| O quê | Situação |
|---|---|
| Ranking com 514 deputados scorados | ✅ Funcionando |
| Votos reais sincronizados | ✅ 7.544 votos de 509 parlamentares |
| Scores híbridos (partido + votos) | ✅ 509 parlamentares ajustados |
| Gastos parlamentares (CEAP) | ⚠️ 96 de 513 deputados (sync em andamento) |
| Análise ML de clusters de votação | ✅ 2 blocos via KMeans/PCA |
| Alinhamento por partido | ✅ 19+ partidos no ranking |
| Perfil completo com abas | ✅ Visão Geral, Performance, Votações, Gastos |
| API com Swagger/OpenAPI | ✅ Documentação automática em `/api/docs` |
| Testes automatizados | ✅ 32 testes passando (Vitest + Testing Library) |
| Filtro por FPE | ❌ Ainda não implementado |
| Votos do critério Proteção à Vida | ❌ PL 1904/2024 foi votado em comissão — sem votos individuais disponíveis na API |

### Escopo atual vs. escopo pretendido

**Pretendido:** avaliar apenas os ~200 membros oficiais da FPE com base nos valores que declaram representar.

**Atual:** todos os 514 deputados ativos da 57ª legislatura são scorados usando os mesmos 5 critérios. O campo `is_fpe_member` e o filtro de FPE estão pendentes de implementação.

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
│  NestJS 11 · Prisma│ │  FastAPI · sklearn  │
│  TypeScript · DI   │ │  Python 3.12        │
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

## API NestJS — Arquitetura Modular

A API foi construída com **NestJS 11**, substituindo um servidor Express monolítico por uma arquitetura modular com Injeção de Dependência, decorators TypeScript e documentação OpenAPI automática.

### Módulos

```
src/api/
├── main.ts                    # Bootstrap: NestFactory, Swagger, ValidationPipe, CORS
├── app.module.ts              # Root module — orquestra todos os feature modules
├── prisma/
│   ├── prisma.module.ts       # @Global() — PrismaService disponível em toda a API
│   └── prisma.service.ts      # extends PrismaClient com lifecycle hooks NestJS
├── politicians/
│   ├── politicians.module.ts
│   ├── politicians.controller.ts   # @Controller, @Get, @ParseIntPipe, @ApiTags
│   ├── politicians.service.ts      # @Injectable, lógica de negócio, Prisma queries
│   └── dto/
│       ├── query-politicians.dto.ts  # class-validator: @IsOptional, @IsString
│       └── query-ranking.dto.ts
├── parties/parties.{controller,service,module}.ts
├── stats/stats.{controller,service,module}.ts
├── methodology/methodology.{controller,service,module}.ts
├── health/health.{controller,module}.ts
└── common/filters/http-exception.filter.ts  # @Catch() global — JSON de erro com CORS
```

### Endpoints documentados (Swagger em `/api/docs`)

```
GET /health                       → healthcheck para Railway
GET /api/politicians              → lista com filtros (estado, partido, casa)
GET /api/politicians/ranking      → ranking ordenado por pontuação
GET /api/politicians/:id          → perfil: score, votos, gastos, mandatos
GET /api/parties/alignment        → alinhamento médio por partido
GET /api/stats/overview           → distribuição de performance geral
GET /api/methodology/pillars      → critérios com pesos
GET /api/methodology/content      → conteúdo descritivo
GET /api/methodology/full         → metodologia completa
```

### Por que NestJS?

| Aspecto | Express (antes) | NestJS (agora) |
|---|---|---|
| Estrutura | Arquivo único `server.ts` com 700 linhas | Módulos independentes, separação de responsabilidades |
| Injeção de Dependência | Manual (`const prisma = new PrismaClient()`) | Automática via decorators e IoC container |
| Documentação API | Zero | Swagger/OpenAPI gerado automaticamente |
| Validação de entrada | Nenhuma | `class-validator` + `ValidationPipe` global |
| Testabilidade | Difícil (acoplamento direto) | Services isolados, fácil de mockar |
| Organização | Sem convenção | Convenção clara: controller → service → repository |

---

## Testes Automatizados

32 testes passando, organizados em 4 suítes com **Vitest** + **Testing Library**:

```
✓ src/services/scoring/__tests__/criteriaEngine.test.ts    (8 testes)
✓ src/components/voting/__tests__/VotingStatsCard.test.tsx  (7 testes)
✓ src/components/politicians/__tests__/PoliticianCard.test.tsx (11 testes)
✓ src/lib/__tests__/utils.test.ts                          (6 testes)
```

### O que é testado

**Motor de pontuação (`criteriaEngine.test.ts`)**
- Classificação de performance por faixas de score (0–100)
- Valores de borda exatos (80 = excellent, 79 = good, etc.)
- Score composto calculado dentro do intervalo `[0, 100]`
- Análise detalhada para contexto vazio (baseline neutro)

**Componentes React (`PoliticianCard`, `VotingStatsCard`)**
- Renderização de dados reais via `@testing-library/react`
- Verificação de links de navegação (`href` correto para `/politicos/:id`)
- Fallback de foto faltante (ícone padrão)
- Contagem de votos e badge de performance

**Utilitários (`utils.test.ts`)**
- Funções de formatação de strings e números

```bash
pnpm test           # modo watch
pnpm test --run     # CI / execução única
```

---

## Serviço de Análise ML (`analysis/`)

Serviço Python independente que aplica clustering não-supervisionado sobre a matriz de votações:

1. **Coleta**: `load_voting_matrix()` — matriz esparsa (parlamentar × pauta) via psycopg2
2. **Normalização**: `StandardScaler` para remover viés de escala
3. **Redução**: `PCA` preservando 95% da variância explicada antes do clustering
4. **Clustering**: `KMeans` com k ótimo calculado por silhouette score
5. **Visualização**: segunda redução PCA a 2D para scatter plot no frontend
6. **Nomeação neutra**: clusters ordenados por score evangélico médio

**Silhouette atual:** 0.270 (escala 0–1, onde 1 = clusters perfeitos)

**Endpoints:**
```
GET /api/clusters               → grupos com coordenadas 2D, silhouette, k usado
GET /api/deputies/{id}/similar  → n deputados com padrão de votação mais próximo
GET /health                     → healthcheck
```

---

## Critérios de Avaliação

| Critério | Peso | Votos reais disponíveis |
|---|---|---|
| 🛡️ Proteção à Vida | 30% | ❌ Zero (PL 1904/2024 foi em comissão) |
| 👨‍👩‍👧‍👦 Valores Familiares | 25% | ✅ PL 2630/2020 + outros |
| ⚖️ Integridade Moral | 20% | ⚠️ Gastos de 96/513 deputados |
| 🤝 Responsabilidade Social | 15% | ✅ Maioria dos votos registrados |
| ✝️ Liberdade Religiosa | 10% | ❌ Zero |

> **Consequência direta:** com Proteção à Vida (30%) sem votos reais, os scores tendem a ficar mais altos do que deveriam — especialmente para partidos com baseline elevado. A média atual (≈ 85 pts) provavelmente cairá quando mais critérios tiverem votos reais.

---

## Metodologia de Pontuação

### Scoring Híbrido

**1. Baseline por partido (seed)**

```
PL/Republicanos/PP/União → 70–90 pts
NOVO/PSD/MDB → 55–68 pts
PT/PSOL/PCdoB → 20–35 pts
```

**2. Ajuste por votos reais (delta)**

- `SIM` alinhado → `+8` a `+15 pts`
- `NÃO` contrário → `-8` a `-15 pts`
- Abstenção/ausência → `0 pts`

Fórmula: `score_final = clamp(baseline + Σ(deltas), 0, 100)`

**3. Penalidade por gastos suspeitos (Integridade Moral)**

Despesas com valor atípico, glosa ou sem CNPJ reduzem `moral_integrity` em até −25 pts.

### Níveis de Desempenho

| Nível | Faixa |
|---|---|
| 🏆 Guardião da Fé | 80–100 pts |
| ✅ Testemunho Fiel | 65–79 pts |
| 🔄 Caminhando | 45–64 pts |
| ⚠️ Precisa Crescer | 0–44 pts |

---

## Dados Atuais (Junho/2026)

```
Deputados scorados:          514 (57ª legislatura, Câmara)
Votos reais registrados:   7.544 (de 247 votações substantivas do PLEN)
Parlamentares com votos:     509
Pautas classificadas:          8 (FAMILY_VALUES e SOCIAL_RESPONSIBILITY)
Gastos sincronizados:        96 de 513 deputados
Clusters de votação (ML):      2 (Bloco Conservador / Bloco Progressista)
Partidos no ranking:          19+ (com ≥ 3 deputados ativos)
```

---

## Stack Completa

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · TanStack Query · Recharts |
| API | **NestJS 11** · Prisma ORM · TypeScript · Swagger/OpenAPI · class-validator |
| API Python | FastAPI · scikit-learn · pandas · numpy · psycopg2 |
| Banco | PostgreSQL (Neon serverless, com pgbouncer pooler) |
| Testes | Vitest · Testing Library (React + jsdom) |
| Deploy | Vercel (frontend) · Railway (API Node + Python) |
| Dados | API aberta da Câmara dos Deputados V2 |

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
pnpm install
cp .env.example .env
# Edite .env com suas credenciais
pnpm db:push
pnpm dev:full
```

### Comandos

```bash
pnpm dev          # Frontend (Vite, porta 8080)
pnpm dev:api      # API NestJS (porta 3001) — http://localhost:3001/api/docs
pnpm dev:full     # Frontend + API em paralelo
pnpm test         # Suíte de testes (watch mode)
pnpm test --run   # CI — execução única
```

### Pipeline de dados (ordem recomendada)

```bash
pnpm sync:camara          # 1. Deputados e mandatos
pnpm scores:seed          # 2. Baseline por partido
pnpm sync:votes           # 3. Votos reais (57ª legislatura, PLEN)
pnpm sync:camara:gastos   # 4. Despesas CEAP (~60 min para 513 deputados)
pnpm scores:recalculate   # 5. Score final: seed + votos + penalidade de gastos
```

### Serviço Python

```bash
cd analysis
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

---

## Variáveis de Ambiente

```bash
# .env.example
DATABASE_URL=postgresql://user:pass@host-pooler/db?pgbouncer=true&sslmode=require
DIRECT_URL=postgresql://user:pass@host-direct/db?sslmode=require
VITE_API_URL=https://seu-backend.up.railway.app
VITE_ANALYSIS_URL=https://seu-analysis.up.railway.app
PORT=3001
```

> `DATABASE_URL` usa o pooler do Neon (para Prisma em runtime). `DIRECT_URL` usa conexão direta (para migrations).

---

## Estrutura do Projeto

```
├── src/
│   ├── api/
│   │   ├── main.ts                      # Bootstrap NestJS
│   │   ├── app.module.ts                # Root module
│   │   ├── prisma/                      # PrismaModule @Global
│   │   ├── politicians/                 # Controller + Service + Module + DTOs
│   │   ├── parties/                     # Controller + Service + Module
│   │   ├── stats/                       # Controller + Service + Module
│   │   ├── methodology/                 # Controller + Service + Module
│   │   ├── health/                      # Healthcheck (Railway)
│   │   └── common/filters/              # AllExceptionsFilter global
│   ├── components/
│   │   ├── politicians/__tests__/       # 11 testes: PoliticianCard
│   │   └── voting/__tests__/           # 7 testes: VotingStatsCard
│   ├── services/scoring/
│   │   ├── criteriaEngine.ts            # Motor de pontuação determinístico
│   │   └── __tests__/                  # 8 testes: scoring engine
│   ├── lib/__tests__/                   # 6 testes: utilitários
│   ├── hooks/                           # TanStack Query: usePoliticians, useClusters…
│   └── pages/                          # Ranking, Perfil, Comparação, Clusters, Sobre
├── analysis/                            # Serviço Python (FastAPI + sklearn)
├── prisma/schema.prisma                 # Schema PostgreSQL completo
├── scripts/                            # sync-camara, sync-votes, recalculate-scores…
├── api-server.cjs                       # Bootstrap CJS — resolve conflito ESM/NestJS
├── tsconfig.api.json                    # TS config para NestJS (emitDecoratorMetadata)
├── railway.toml                         # Deploy Railway: healthcheck + restart policy
└── vercel.json                          # Rewrite SPA + headers de cache
```

---

## Limitações Conhecidas

**Dados:**
- Votos individuais de **comissões** não estão disponíveis na API da Câmara. O PL 1904/2024 (aborto) foi votado no CPASF, não no Plenário.
- **Proteção à Vida** (30%) e **Liberdade Religiosa** (10%) usam apenas o baseline de partido, sem votos reais.
- O sync de gastos cobre apenas os últimos 2 anos (2025–2026).

**Escopo:**
- O filtro de membros da FPE **ainda não está implementado**. O ranking atual mostra todos os 514 deputados da 57ª legislatura.

---

## Próximos Passos

- [ ] Importar lista oficial de membros da FPE via `/frentes/{id}/membros`
- [ ] Campo `is_fpe_member` no schema e filtro padrão no ranking
- [ ] Ampliar varredura de votos para critérios com zero cobertura (Vida, Liberdade Religiosa)
- [ ] Completar sync de despesas e rodar `scores:recalculate` final
- [ ] Testes de integração para a API NestJS (supertest)
- [ ] Revisão manual das classificações de pauta

---

## Licença

MIT — veja [LICENSE](LICENSE).

---

*Desenvolvido por [Rilson Joás](https://github.com/rilsonjoas) como projeto de portfólio técnico e ferramenta de transparência cívica para o eleitor cristão.*
