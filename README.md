# A Bancada Evangélica

<p align="center">
  <strong>Monitorando se os parlamentares evangélicos votam como pregam</strong><br/>
  Transparência sobre a Frente Parlamentar Evangélica (FPE) com dados reais da Câmara dos Deputados
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

## Escopo e Regras

### Quem é avaliado

Apenas os membros oficiais da **Frente Parlamentar Evangélica (FPE)** — um grupo formal dentro da Câmara dos Deputados formado por parlamentares que se identificam publicamente com a fé cristã evangélica.

> **Por que não todos os 514 deputados?**
> A avaliação faz sentido dentro de um contrato implícito: o parlamentar que se coloca como representante evangélico aceita ser julgado pelos valores que proclama. Avaliar deputados sem esse vínculo (PT, PSOL, etc.) criaria um ranking sem coerência — a Bancada não é um classificador geral do congresso, é um espelho para o próprio movimento.

### O que é uma "votação evangelicamente relevante"

Uma votação é classificada como relevante quando ela toca diretamente em um dos 5 critérios abaixo. A classificação segue **três camadas**:

1. **Curadoria manual** — o curador (Rilson Joás) revisa e aprova a lista de pautas, com base em fundamentos bíblicos documentados
2. **Referência às posições da FPE** — pautas em que a Frente se posicionou oficialmente (ex: PL 1904/2024 — aborto, PL 2630/2020 — regulação da internet)
3. **Algoritmo de keywords** — varredura das descrições das votações do PLEN contra termos relevantes por critério, com revisão posterior

Toda pauta classificada é registrada como `key_agenda` no banco com: critério, peso e se `SIM` é positivo ou negativo.

### Critério de limite técnico

Votos individuais de parlamentares **só estão disponíveis** em votações do Plenário (PLEN) onde a descrição contém contagem explícita de "Sim: X; Não: Y". Votações de comissões com poder conclusivo (ex: PL 1904/2024 no CPASF) **não retornam votos individuais** na API da Câmara — são excluídas automaticamente.

---

## Critérios de Avaliação

| Critério | Peso | Fundamento |
|---|---|---|
| 🛡️ Proteção à Vida | 30% | Votações sobre aborto, eutanásia, pena de morte |
| 👨‍👩‍👧‍👦 Valores Familiares | 25% | Conceito de família, adoção, liberdade de educação |
| ⚖️ Integridade Moral | 20% | Despesas parlamentares suspeitas + votações de ética |
| 🤝 Responsabilidade Social | 15% | Projetos para populações vulneráveis, saúde pública |
| ✝️ Liberdade Religiosa | 10% | Proteção ao culto, expressão de fé, patrimônio religioso |

Implementados em [`src/services/scoring/criteriaEngine.ts`](src/services/scoring/criteriaEngine.ts).

---

## Metodologia de Pontuação

### Pontuação Híbrida

A pontuação de cada parlamentar é calculada em duas camadas:

**1. Baseline por Partido (seed)**
Quando não há votos reais disponíveis para um critério, o sistema usa o score estimado com base no alinhamento histórico do partido com valores evangélicos. Isso garante que parlamentares recém-eleitos ou sem votações registradas ainda tenham uma pontuação significativa.

Exemplo de seeds: `{ PL: 72, NOVO: 68, PT: 32, PSOL: 28 }`

**2. Ajuste por Votos Reais (delta)**
Para critérios onde existem votações registradas no banco, o sistema aplica deltas sobre o baseline:
- `+10 pts` por voto alinhado com o posicionamento evangélico
- `-10 pts` por voto contrário
- `0 pts` por abstenção ou ausência (sem punição)

A fórmula: `score_final = clamp(baseline + soma_deltas, 0, 100)`

**3. Penalidade de Despesas (Integridade Moral)**
Despesas suspeitas na cota parlamentar reduzem o critério `moral_integrity` em até -25 pts, baseado em: valor alto, glosa e ausência de CNPJ fornecedor.

### Níveis de Desempenho

| Nível | Faixa | Significado |
|---|---|---|
| 🏆 Guardião da Fé | 80–100 pts | Votação consistentemente alinhada |
| ✅ Testemunho Fiel | 65–79 pts | Alinhamento sólido com deslizes pontuais |
| 🔄 Caminhando | 45–64 pts | Postura moderada, indefinida ou inconsistente |
| ⚠️ Precisa Crescer | 0–44 pts | Padrão de votos em conflito com valores declarados |

---

## Dados Atuais (Junho/2026)

- **Banco**: PostgreSQL no Neon (serverless)
- **Deputados**: 514 deputados ativos (filtro por FPE em implementação)
- **Votos reais**: 1.679 votos individuais de 476 parlamentares
- **Pautas com votos individuais disponíveis**:

| Pauta | Critério | Votos |
|---|---|---|
| PL 2630/2020 (regulação da internet) | FAMILY_VALUES | 386 |
| MP 1.165/2023 (Mais Médicos) | SOCIAL_RESPONSIBILITY | 370 |
| Votação social out/2024 | SOCIAL_RESPONSIBILITY | 310 |
| Votação social abr/2025 (1) | SOCIAL_RESPONSIBILITY | 357 |
| Votação social abr/2025 (2) | SOCIAL_RESPONSIBILITY | 259 |

> **Nota**: PL 1904/2024 (aborto) foi votado em comissão com poder conclusivo (CPASF) — sem votos individuais no PLEN. Portanto, `LIFE_PROTECTION` usa apenas o baseline por partido.

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
| APIs externas | Câmara dos Deputados V2 |

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

### Sincronização de dados (ordem recomendada)

```bash
# 1. Importar deputados e mandatos
pnpm sync:camara

# 2. Calcular scores baseline por partido
pnpm scores:seed

# 3. Sincronizar votos reais (57ª legislatura, PLEN)
pnpm sync:votes

# 4. Sincronizar despesas parlamentares
pnpm sync:camara:gastos

# 5. Recalcular scores finais (híbrido: seed + votos + despesas)
pnpm scores:recalculate
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
# .env.example — NUNCA commitar o .env real
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
├── scripts/                     # sync-camara, sync-votes, sync-all-gastos, recalculate-scores
├── railway.toml                 # config deploy Node (Railway)
└── vercel.json                  # rewrite SPA + cache headers
```

---

## Limitações Conhecidas

- **Votos de comissão**: A API da Câmara não retorna votos individuais de comissões, mesmo com poder conclusivo. O PL 1904/2024 (aborto) é o caso mais relevante afetado.
- **Cobertura temporal**: A sincronização cobre a 57ª legislatura (fev/2023–jun/2026). Votações anteriores não estão no banco.
- **Dados de despesas**: O custo parlamentar (cota CEAP) demora ~60 minutos para sincronizar para todos os deputados.
- **FPE membership**: A marcação de quais deputados são membros oficiais da FPE está em implementação. O filtro padrão atual mostra todos os deputados.

---

## Próximos Passos

- [ ] Importar lista oficial de membros da FPE via API da Câmara (`/frentes/{id}/membros`)
- [ ] Campo `is_fpe_member` no banco e filtro padrão no ranking
- [ ] Deploy do serviço Python no Railway + variável `VITE_ANALYSIS_URL` no Vercel
- [ ] Ampliar varredura de votos para trimestres mai/2025–jun/2026
- [ ] Executar sync de despesas e recalcular scores com penalidade moral

---

## Licença

MIT — veja [LICENSE](LICENSE).

---

*Desenvolvido por [Rilson Joás](https://github.com/rilsonjoas) como projeto de portfólio técnico e ferramenta de transparência cívica para o eleitor cristão.*
