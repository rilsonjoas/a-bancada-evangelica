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
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/scikit--learn-1.5-F7931E?style=flat-square&logo=scikit-learn" />
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
| Filtro por FPE | ❌ Ainda não implementado |
| Votos do critério Proteção à Vida | ❌ PL 1904/2024 foi votado em comissão — sem votos individuais disponíveis na API |

### Escopo atual vs. escopo pretendido

**Pretendido:** avaliar apenas os ~200 membros oficiais da FPE com base nos valores que declaram representar.

**Atual:** todos os 514 deputados ativos da 57ª legislatura são scorados usando os mesmos 5 critérios. O campo `is_fpe_member` e o filtro de FPE estão pendentes de implementação.

Isso significa que o ranking hoje inclui deputados que nunca se identificaram como representantes evangélicos — o que torna a avaliação deles pela metodologia evangélica questionável. O sistema já foi construído para suportar o filtro; falta importar a lista oficial.

---

## Critérios de Avaliação

| Critério | Peso | Votos reais disponíveis |
|---|---|---|
| 🛡️ Proteção à Vida | 30% | ❌ Zero (PL 1904/2024 foi em comissão) |
| 👨‍👩‍👧‍👦 Valores Familiares | 25% | ✅ PL 2630/2020 + outros |
| ⚖️ Integridade Moral | 20% | ⚠️ Gastos de 96/513 deputados |
| 🤝 Responsabilidade Social | 15% | ✅ Maioria dos votos registrados |
| ✝️ Liberdade Religiosa | 10% | ❌ Zero |

> **Consequência direta:** os scores atuais são predominantemente determinados pelo baseline de partido (seed) + ajustes de Responsabilidade Social e Valores Familiares. Proteção à Vida (30% do peso) e Liberdade Religiosa (10%) ainda usam apenas a estimativa por partido.

---

## Metodologia de Pontuação

### Scoring Híbrido

**1. Baseline por partido (seed)**
Quando não há votos reais para um critério, o score parte de um estimativa histórica por partido:

```
PL/Republicanos/PP/União → 70–90 pts
NOVO/PSD/MDB → 55–68 pts
PT/PSOL/PCdoB → 20–35 pts
```

**2. Ajuste por votos reais (delta)**
Para critérios com votações registradas, deltas são aplicados sobre o baseline:
- `SIM` alinhado → `+8` a `+15 pts` (dependendo do peso da pauta)
- `NÃO` contrário → `-8` a `-15 pts`
- Abstenção/ausência → `0 pts`

Fórmula: `score_final = clamp(baseline + Σ(deltas), 0, 100)`

**3. Penalidade por gastos suspeitos (Integridade Moral)**
Despesas com valor atípico, glosa ou sem CNPJ reduzem `moral_integrity` em até −25 pts.

### Níveis de Desempenho

| Nível | Faixa | Significado |
|---|---|---|
| 🏆 Guardião da Fé | 80–100 pts | Votação consistentemente alinhada |
| ✅ Testemunho Fiel | 65–79 pts | Alinhamento sólido com deslizes pontuais |
| 🔄 Caminhando | 45–64 pts | Postura moderada, indefinida ou inconsistente |
| ⚠️ Precisa Crescer | 0–44 pts | Padrão de votos em conflito com valores declarados |

### Limitação de calibração

Com Proteção à Vida (30%) sem votos reais, os scores tendem a ficar mais altos do que deveriam — especialmente para partidos com baseline elevado. A média atual (≈ 85 pts) provavelmente cairá quando mais critérios tiverem votos reais.

---

## Dados Atuais (Junho/2026)

```
Deputados scorados:          514 (57ª legislatura, Câmara)
Votos reais registrados:   7.544 (de 247 votações substantivas do PLEN)
Parlamentares com votos:     509
Pautas classificadas:          8 (entre FAMILY_VALUES e SOCIAL_RESPONSIBILITY)
Gastos sincronizados:        96 de 513 deputados (sync rodando ~60 min)
Despesas suspeitas:            5 registros
Clusters de votação (ML):      2 (Bloco Conservador / Bloco Progressista)
Partidos no ranking:          19+ (com ≥ 3 deputados ativos)
```

### Votações com votos individuais disponíveis

| Pauta | Critério | Descrição técnica |
|---|---|---|
| PL 2630/2020 | FAMILY_VALUES | Marco das fake news / regulação da internet |
| MP 1.165/2023 | SOCIAL_RESPONSIBILITY | Programa Mais Médicos |
| Emenda out/2024 | SOCIAL_RESPONSIBILITY | Emenda do Senado nº 28 |
| Votações abr/2025 | SOCIAL_RESPONSIBILITY | Múltiplas votações da semana legislativa de 29/04/2025 |

> Votos individuais só estão disponíveis em votações do Plenário com contagem explícita "Sim: X; Não: Y". Comissões com poder conclusivo (caso do PL 1904/2024 — aborto) não expõem votos individuais na API da Câmara.

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

## Serviço de Análise ML (`analysis/`)

Serviço Python independente que aplica clustering não-supervisionado sobre a matriz de votações:

1. **Coleta**: `load_voting_matrix()` — matriz esparsa (parlamentar × pauta) via psycopg2
2. **Normalização**: `StandardScaler` para remover viés de escala
3. **Redução**: `PCA` preservando 95% da variância explicada antes do clustering
4. **Clustering**: `KMeans` com k ótimo calculado por silhouette score
5. **Visualização**: segunda redução PCA a 2D para scatter plot no frontend
6. **Nomeação neutra**: clusters ordenados por score evangélico médio, nomeados sem referência a partido dominante

**Silhouette atual:** 0.270 (escala 0–1, onde 1 = clusters perfeitos)

**Endpoints:**
```
GET /api/clusters               → grupos com coordenadas 2D, silhouette, k usado
GET /api/deputies/{id}/similar  → n deputados com padrão de votação mais próximo
GET /health                     → healthcheck
```

O endpoint `GET /api/parties/alignment` foi movido para o Express para funcionar sem dependência do serviço Python.

---

## Stack Completa

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · TanStack Query · Recharts |
| API JS | Express 5 · Prisma ORM · TypeScript · tsx |
| API Python | FastAPI · scikit-learn · pandas · numpy · psycopg2 |
| Banco | PostgreSQL (Neon serverless, com pgbouncer pooler) |
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

### Pipeline de dados (ordem recomendada)

```bash
# 1. Importar deputados e mandatos da Câmara
pnpm sync:camara

# 2. Calcular scores baseline por partido
pnpm scores:seed

# 3. Sincronizar votos reais (57ª legislatura, apenas PLEN com votos individuais)
pnpm sync:votes

# 4. Sincronizar despesas parlamentares — cota CEAP (~60 min para 513 deputados)
pnpm sync:camara:gastos

# 5. Recalcular scores finais (híbrido: seed + votos + penalidade de gastos)
pnpm scores:recalculate
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

> `DATABASE_URL` usa o pooler do Neon (para Prisma em runtime). `DIRECT_URL` usa conexão direta (para migrations e o serviço Python, que não suporta o parâmetro `pgbouncer`).

---

## API Reference

```
GET /api/politicians              → lista com filtros (estado, partido, casa)
GET /api/politicians/ranking      → ranking ordenado por pontuação
GET /api/politicians/:id          → perfil completo: score, votos, gastos, mandatos
GET /api/parties/alignment        → alinhamento médio por partido
GET /api/stats/overview           → estatísticas gerais (distribuição de performance)
GET /api/methodology/pillars      → critérios de avaliação com pesos
GET /api/methodology/full         → conteúdo completo da metodologia
GET /health                       → healthcheck
```

---

## Estrutura do Projeto

```
├── src/
│   ├── api/server.ts              # Express — API REST principal
│   ├── components/                # UI: cards, gráficos, comparação
│   ├── hooks/                     # TanStack Query: usePoliticians, useClusters…
│   ├── lib/
│   │   ├── apiClient.ts           # fetch centralizado com VITE_API_URL
│   │   └── prisma.ts              # singleton PrismaClient
│   ├── pages/                     # Ranking, Perfil, Comparação, Clusters, Metodologia, Sobre
│   └── services/scoring/
│       └── criteriaEngine.ts      # motor de pontuação determinístico
├── analysis/                      # Serviço Python (FastAPI + sklearn)
│   ├── main.py
│   ├── app/
│   │   ├── database.py            # psycopg2 — leitura da matriz de votações
│   │   └── services/clustering.py # KMeans + PCA + silhouette
│   └── requirements.txt
├── prisma/schema.prisma           # schema PostgreSQL completo
├── scripts/                       # sync-camara, sync-votes, sync-all-gastos, recalculate-scores
├── railway.toml                   # config deploy Node no Railway
└── vercel.json                    # rewrite SPA + headers de cache
```

---

## Limitações Conhecidas

**Dados:**
- Votos individuais de **comissões** não estão disponíveis na API da Câmara, mesmo quando a comissão tem poder conclusivo. O PL 1904/2024 (aborto) é o caso mais relevante — foi votado no CPASF, não no Plenário.
- O critério **Proteção à Vida** (30% do peso) usa apenas o baseline de partido, sem votos reais.
- O critério **Liberdade Religiosa** (10%) também não tem votações PLEN registradas ainda.
- A sincronização de gastos cobre apenas os **últimos 2 anos** (2025–2026) e demora ~60 min para todos os deputados.

**Escopo:**
- O filtro de membros da FPE **ainda não está implementado**. O ranking atual mostra todos os 514 deputados da 57ª legislatura.
- Scores com Proteção à Vida sem votos reais tendem a ser **inflados para partidos com baseline alto**.

---

## Próximos Passos

- [ ] Importar lista oficial de membros da FPE via `/frentes/{id}/membros`
- [ ] Campo `is_fpe_member` no schema e filtro padrão no ranking/busca
- [ ] Ampliar varredura de votos para critérios com zero cobertura (Vida, Liberdade Religiosa)
- [ ] Completar sync de despesas e rodar `scores:recalculate` final
- [ ] Revisão manual das classificações de pauta (keyword algorithm pode gerar falsos positivos)
- [ ] Testes automatizados (zero cobertura atual)

---

## Licença

MIT — veja [LICENSE](LICENSE).

---

*Desenvolvido por [Rilson Joás](https://github.com/rilsonjoas) como projeto de portfólio técnico e ferramenta de transparência cívica para o eleitor cristão.*
