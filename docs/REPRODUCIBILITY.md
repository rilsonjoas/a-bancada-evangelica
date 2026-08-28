# Guia de Reprodutibilidade — Como recalcular as notas do zero

> **Objetivo**: permitir que qualquer pessoa (jornalista, pesquisador, cidadão) reproduza exatamente as notas publicadas no site, a partir dos dados brutos oficiais, sem depender da nossa infraestrutura.
>
> **Versão**: 1.0 (2026-08-27)  
> **Responsável**: Rilson / A Bancada Evangélica  
> **Licença**: MIT — use, adapte, compartilhe.

---

## 1. Visão geral do pipeline

O cálculo segue 4 etapas sequenciais, cada uma determinística (mesmo input → mesmo output):

```
Dados brutos oficiais (Câmara/Senado/TSE)
        ↓
1. SYNC — Coleta e normalização (scripts/sync-*.ts)
        ↓
2. CLASSIFICAÇÃO — Cada votação → pauta-chave (critério + peso)
        ↓
3. SCORING — Por parlamentar: soma ponderada dos votos por critério
        ↓
4. AGREGAÇÃO — Nota geral (ponderada) + ranking + consistência
        ↓
Resultado final: notas 0–100 por critério + nota geral + rank
```

**Requisitos**: Node.js 20+, PostgreSQL 15+, acesso à internet (APIs oficiais).

---

## 2. Fontes de dados oficiais (primárias)

| Fonte | Endpoint | O que traz | Script de sync |
|-------|----------|------------|----------------|
| **Câmara — Deputados** | `https://dadosabertos.camara.leg.br/api/v2/deputados` | Lista de deputados, mandatos, partido, UF | `scripts/sync-camara.ts` |
| **Câmara — Votações** | `https://dadosabertos.camara.leg.br/api/v2/votacoes` | Votações nominais (evento, data, proposição, como cada deputado votou) | `scripts/sync-votes.ts` |
| **Câmara — Frentes** | `https://dadosabertos.camara.leg.br/api/v2/frentes/54477/membros` | Membros oficiais da Frente Parlamentar Evangélica (FPE) | `scripts/sync-fpe-members.ts` |
| **Câmara — Despesas** | `https://dadosabertos.camara.leg.br/api/v2/deputados/{id}/despesas` | CEAPs (gastos parlamentares) | `scripts/sync-camara.ts` (despesas) |
| **Senado — Senadores** | `https://legis.senado.leg.br/dadosabertos/senador/lista/atual` | Lista de senadores, mandatos, partido, UF | `scripts/sync-senado.ts` |
| **Senado — Votações** | `https://legis.senado.leg.br/dadosabertos/votacao` | Votações nominais do Senado (desde fev/2026) | `scripts/sync-votes-senado.ts` |
| **Senado — Despesas (CEAP)** | `https://adm.senado.gov.br/adm-dadosabertos/api/v1/senadores/despesas_ceaps/{ano}` | Gastos CEAP dos senadores | `scripts/sync-all-gastos.ts` |
| **Senado — FPE** | `https://legis.senado.leg.br/dadosabertos/collegiado/2583/membros` | Membros da bancada evangélica no Senado (codcol=2583) | `scripts/sync-fpe-members.ts` |
| **TSE — Prestação de contas 2022** | `https://dadosabertos.tse.jus.br/prestacao_contas/2022/` | Doações de campanha declaradas | `scripts/sync-tse-receitas.ts` + `sync-tse-candidatura.ts` |

> **Importante**: as APIs oficiais mudam. Versões exatas usadas no último sync estão registradas em `docs/SYNC-LOG-2026-08-27.md` (gerado a cada rodada).

---

## 3. Classificação de votações → Pautas-chave

Cada votação nominal é cruzada com **palavras-chave** dos 5 critérios. Se houver match, a votação vira uma **pauta-chave** (KeyAgenda).

**Palavras-chave por critério** (definidas em `src/lib/criteria.tsx`):

| Critério | Peso | Palavras-chave (exemplos) |
|----------|------|---------------------------|
| **Proteção à Vida** (30%) | `lifeProtection` | `aborto`, `vida`, `nascituro`, `eutanásia`, `anticoncepcao`, `planejamento familiar` |
| **Valores Familiares** (25%) | `familyValues` | `família`, `casamento`, `união estável`, `adocao`, `guarda`, `filhos`, `educação familiar` |
| **Integridade Moral** (20%) | `moralIntegrity` | `corrupção`, `lavagem`, `improbidade`, `ética`, `conduta`, `decoro`, `rachadinha` |
| **Responsabilidade Social** (15%) | `socialResponsibility` | `saúde`, `educação`, `assistência social`, `idoso`, `pessoa com deficiência`, `saneamento`, `habitação` |
| **Liberdade Religiosa** (10%) | `religiousFreedom` | `liberdade religiosa`, `culto`, `igreja`, `templo`, `objeção de consciência`, `liberdade de crença` |

**Lógica de match** (em `scripts/sync-votes.ts` → função `classifyAgenda`):
1. Pega `ementa` + `titulo` + `keywords` da votação/proposição
2. Normaliza (lowercase, remove acentos, pontuação)
3. Para cada critério, testa se **qualquer** palavra-chave aparece no texto
4. Se houver match → cria/atualiza `KeyAgenda` com `criteria` = aquele critério
5. Uma votação pode cair em **múltiplos** critérios (ex.: aborto + família)
6. Votos **sem match** em nenhum critério → **não entram no scoring** (são ignorados)

> **Verificável**: a lista completa de pautas-chave geradas está no CSV de export (`/api/politicians/export/csv?criteria=...`) e na tabela `key_agendas` do banco.

---

## 4. Scoring por parlamentar

Para **cada parlamentar** e **cada critério**:

```
Seja V = conjunto de votações nominais do parlamentar que casaram com pautas-chave daquele critério
Para cada v ∈ V:
  - voto = SIM → +1 ponto
  - voto = NÃO → -1 ponto
  - voto = ABSTENÇÃO/AUSENTE → 0 pontos

Score_bruto = soma(pontos de v ∈ V)
Total_votos = |V|

Score_final_critério = clamp( 50 + (Score_bruto / Total_votos) * 50 , 0, 100 )
```

**Explicação da fórmula**:
- Base 50 = neutro (presunção de inocência / ponto de partida)
- Cada voto alinhado puxa +50/Total_votos; cada voto contrário puxa -50/Total_votos
- Resultado clampado em [0, 100]
- Se `Total_votos = 0` → **não há score calculado** (usa estimativa partidária)

> **Implementação**: `scripts/recalculate-scores.ts` (roda no sync-worker diário 05:00). Função pura, sem side effects.

---

## 5. Nota geral (ponderada) + Ranking

```
Overall = Σ (Score_critério_i × Peso_i)   // pesos: 30/25/20/15/10 = 100%
```

**Ranking**: ordenação decrescente por `Overall`. Empates quebrados por `Total_votos` (mais votos = melhor rank).

---

## 6. Consistência

```
Consistência = 1 - (desvio_padrão_dos_5_scores / 50)
```
- 100% = todos os 5 critérios têm a mesma nota
- 0% = variação máxima entre critérios

---

## 7. Como rodar localmente (passo a passo)

### 7.1 Preparação

```bash
# 1. Clone o repo
git clone https://github.com/rilsonjoas/a-bancada-evangelica.git
cd a-bancada-evangelica

# 2. Instale dependências
pnpm install

# 3. Suba o PostgreSQL (Docker)
docker compose -f hetzner-infra/bancada/docker-compose.yml up -d postgres-shared

# 4. Configure .env (copie .env.example)
cp .env.example .env
# Edite DATABASE_URL para apontar pro postgres local
# DATABASE_URL="postgresql://bancada_app:senha@localhost:5432/bancada_evangelica_db"
```

### 7.2 Rodar syncs completos (ordem importa)

```bash
# Dentro do container da API (ou local se tiver TS compilado):
# O comando pnpm sync:all roda tudo na ordem certa
pnpm sync:all
```

**O que `sync:all` faz** (definido em `package.json`):
1. `sync-camara` → deputados + mandatos + despesas
2. `sync-senado` → senadores + mandatos
3. `sync-fpe-members` → marca FPE (Câmara frente 54477 + Senado codcol 2583)
4. `sync-votes` → votações Câmara + classificação pautas-chave
5. `sync-votes-senado` → votações Senado (pronto, aguarda pautas relevantes)
6. `sync-tse-candidatura` + `sync-tse-receitas` → financiamento 2022
7. `sync-all-gastos` → despesas Senado (CEAP)
8. `scores:recalculate` (`recalculate-scores.ts`) → roda scoring completo (etapas 3-5 acima)

> **Tempo estimado**: 15–30 min na primeira vez (download de ~500MB de dados). Syncs incrementais depois são < 5 min.

### 7.3 Verificar resultado

```bash
# Quantidade de políticos, votos, pautas
pnpm quality:check

# Deve mostrar (valores aproximados agosto/2026):
# - 594 políticos (513 Câmara + 81 Senado)
# - ~26.860 votos
# - ~74.336 despesas
# - 247 membros FPE (210 Câmara + 15 Senado ativos + 22 inativos)
# - Scores 0–100 para todos com total_votes > 0
```

### 7.4 Gerar CSV de dados abertos (igual ao site)

```bash
# Exporta ranking completo (igual ao botão "Baixar CSV" da página /dados)
curl "http://localhost:3001/api/politicians/export/csv" > ranking_reproduzido.csv

# Compare com o CSV oficial do site (mesmo hash = reprodução exata)
sha256sum ranking_reproduzido.csv
# Deve bater com o hash publicado em docs/CSV-HASHES-2026-08-27.txt
```

### 7.5 Export de votações individuais + checksum (H4, 2026-08-27)

```bash
# Dump auditorável: UMA linha por voto (data, pauta, critério, impacto,
# fonte oficial e link). Filtros opcionais: ?politicianId=, ?criteria=, ?limit=
curl -D - "http://localhost:3001/api/politicians/export/votes/csv" -o votacoes.csv
#  ^- os headers incluem X-Content-SHA256, o hash de integridade do arquivo

# Verificação local de integridade:
sha256sum votacoes.csv
# Deve ser idêntico ao valor do header X-Content-SHA256 da resposta.
```

### 7.6 Histórico de auditoria das sincronizações (H6, 2026-08-27)

```bash
# Cada recálculo de notas grava um SyncLog tipo SCORES com o diff:
# quantas notas mudaram, delta médio por critério e top movimentações.
curl "http://localhost:3001/api/stats/sync-history?limit=10"
# Ex.: details.criteriaDelta.FAMILY_VALUES = { changed: 3, avgDelta: 4.5 }
```

---

## 8. Scripts-chave (para auditoria de código)

| Script | Função | Entrada | Saída |
|--------|--------|---------|-------|
| `scripts/sync-votes.ts` | Baixa votações + classifica pauta-chaves | APIs Câmara/Senado | Tabelas `votes`, `key_agendas` |
| `scripts/recalculate-scores.ts` | **Coração do scoring** — recalcula notas; registra diff no `SyncLog` tipo `SCORES` (H6) | `votes` + `politician_scores` atuais | Tabela `politician_scores` + histórico de auditoria |
| `scripts/sync-fpe-members.ts` | Marca membros FPE com tier/fonte/data | APIs oficiais frentes | Colunas `fpe_*` em `politicians` |
| `src/api/politicians/politicians.service.ts` → `exportVotes()` | Dump de votações individuais p/ auditoria (H4) | Tabela `votes` | CSV com fonte oficial e link |
| `src/api/politicians/politicians.service.ts` → `formatScore()` | Formata score do banco para API | `PoliticianScore` | DTO com notas 0–100 + metadata |

> **Dica de auditoria**: leia `recalculate-scores.ts` — determinístico, sem
> dependências externas; no fim grava o diff das notas no `SyncLog`.

---

## 9. Validações de qualidade (quality checks)

Após cada sync, o worker roda `pnpm quality:check` que valida:

1. **Estabilidade de ativos** ≤ 5% variação vs dia anterior
2. **Scores no range** 0–100 para todos
3. **Scores obrigatórios** — todo político ativo com votos tem 5 scores
4. **Despesas órfãs** = 0 (toda despesa tem político válido)
5. **Consistência FPE** — contagem bate com fontes oficiais (Câmara 54477 + Senado 2583)

Falha em qualquer check → alerta no log + sync não marca como "sucesso".

---

## 10. Reprodução pontual (um político só)

Para auditar **um parlamentar específico** (ex.: ID 550):

```bash
# 1. Pegue os votos dele do banco
psql $DATABASE_URL -c "
  SELECT v.vote_type, v.applied_score, v.vote_date, ka.title, ka.criteria
  FROM votes v
  JOIN key_agendas ka ON ka.id = v.key_agenda_id
  WHERE v.politician_id = 550
  ORDER BY v.vote_date DESC;
"

# 2. Some manualmente por critério usando a fórmula da seção 4
# 3. Compare com o score no site (/politicos/550 → aba Desempenho)
```

---

## 11. Hashes de referência (agosto/2026)

| Arquivo | SHA256 | Gerado em |
|---------|--------|-----------|
| `ranking_completo.csv` | `a1b2c3d4...` (atualizar no deploy) | 2026-08-27 |
| `votacoes_individuais.csv` | `e5f6g7h8...` | 2026-08-27 |

> Os hashes são publicados a cada sync bem-sucedido em `docs/CSV-HASHES-YYYY-MM-DD.txt`.

---

## 12. Contato / Dúvidas

- **Email**: abancada@narniano.com
- **GitHub**: https://github.com/rilsonjoas/a-bancada-evangelica
- **Issues**: abra uma issue com label `reproducibility`

---

*Este guia é parte da Onda A2 — Auditabilidade Pública (H3, 2026-08-27).  
Qualquer discrepância entre este guia e o código = bug. Reporte.*