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

> **Importante**: as APIs oficiais mudam. O histórico real de cada sync
> (o que rodou, quando, quantos registros) fica em `SyncLog` no banco —
> público via `GET /api/stats/sync-history` (corrigido em 2026-09-08:
> este guia citava um arquivo `docs/SYNC-LOG-2026-08-27.md` que nunca
> existiu no repositório).

---

## 3. Classificação de votações → Pautas-chave

Cada votação nominal é cruzada com **palavras-chave** dos 5 critérios. Se houver match, a votação vira uma **pauta-chave** (KeyAgenda), com um **peso fixo** (`weight`) e um sinal (`simIsPositive`) que decide se votar SIM soma ou subtrai.

**Regras reais** (`SCAN_RULES`, definidas em `scripts/sync-votes.ts` — corrigido em 2026-09-08, este guia citava um arquivo errado, `src/lib/criteria.tsx`, que só guarda texto descritivo, não as keywords que decidem o match):

| Critério | Peso | Keywords reais (`SCAN_RULES`) | SIM é positivo? |
|----------|------|-------------------------------|------------------|
| **Proteção à Vida** (30%) | 20 | `aborto`, `nascituro`, `eutanasia`, `interrupcao da gravidez` | Não (votar SIM nessas pautas é contrário) |
| | 15 | `protecao da vida`, `direito a vida`, `crime contra a vida`, `homicidio` | Sim |
| **Valores Familiares** (25%) | 15 | `familia`, `casamento`, `adocao`, `menor de idade`, `crianca`, `estatuto da crianca` | Sim |
| | 15 | `identidade de genero`, `diversidade sexual`, `homoafetiv`, `transexual` | Não |
| **Integridade Moral** (20%) | 15 | `corrupcao`, `improbidade`, `ficha limpa`, `transparencia publica`, `lei anticorrupcao` | Sim |
| | 12 | `amnistia`, `anistia`, `prescricao`, `indulto` | Não |
| **Responsabilidade Social** (15%) | 10 | `assistencia social`, `bolsa familia`, `beneficio social`, `populacao em situacao de rua` | Sim |
| | 8 | `saude publica`, `sus`, `atendimento a vitimas` | Sim |
| **Liberdade Religiosa** (10%) | 20 | `liberdade religiosa`, `liberdade de culto`, `discriminacao religiosa`, `intolerancia religiosa`, `expressao religiosa`, `simbolo religioso`, `perseguicao religiosa` | Sim |
| | 10 | `laicidade`, `ensino religioso`, `crenca`, `assistencia espiritual`, `folga religiosa` | Sim |

**Lógica de match** (em `scripts/sync-votes.ts` → função `matchRule`):
1. Pega o texto da votação/proposição (ementa + título)
2. Normaliza (lowercase, remove acentos, pontuação)
3. Testa as regras **em ordem** — a primeira cujo array de keywords casar decide o critério, peso e sinal (não é "qualquer regra que casar", é a primeira)
4. Se houver match → cria/atualiza `KeyAgenda` com `criteria` = aquele critério
5. `applied_score` do voto = `peso` se (voto=SIM e simIsPositive) ou (voto=NÃO e !simIsPositive); `-peso` no caso contrário; `0` se abstenção/ausência/obstrução
6. Votos **sem match** em nenhuma regra → **não entram no scoring** (são ignorados)

> **Verificável**: a lista completa de pautas-chave geradas está no CSV de export (`/api/politicians/export/csv?criteria=...`) e na tabela `key_agendas` do banco.

---

## 4. Scoring por parlamentar

**Corrigido em 2026-09-08** — a fórmula anterior deste guia (base fixa 50 +
soma normalizada) nunca bateu com o código real; ficou sem verificação
desde a criação do guia (27/08). A fórmula abaixo é a real, extraída de
`scripts/lib/scoring.ts` + `scripts/recalculate-scores.ts`.

Para **cada parlamentar** e **cada um dos 5 critérios**:

```
1. Seed do partido (fixo, nunca lido de volta do banco — ver §8):
   seed = clamp5a98( PARTY_ALIGNMENT[partido][critério] + individualNoise(id, índice_do_critério) )

   PARTY_ALIGNMENT vem de scripts/lib/scoring.ts — histórico real de
   alinhamento por partido (fonte: DIAP, FPE, JRN/Estadão, 56ª/57ª
   legislaturas). Partido sem entrada na tabela usa [55,55,65,60,55].

   individualNoise(id, i) = round(((seed_pseudoaleatório(id,i) % 17) - 8) * 0.9)
   onde seed_pseudoaleatório(id,i) = (id*31 + i*17) % 100 — só existe pra
   dois políticos do mesmo partido não terem nota idêntica; não tem
   nenhum significado além disso.

2. Seja V = conjunto de votos nominais REAIS do parlamentar que casaram
   com uma pauta-chave (KeyAgenda) daquele critério (ver §3)

3. Se V estiver vazio → Score_critério = seed (fica na estimativa de
   partido; ver "Base de pontuação" na página /metodologia)

4. Se V não estiver vazio → Score_critério = clamp0a100( seed + média(applied_score de V) )
   MÉDIA, não soma — deliberado (achado real 2026-09-08): somar sem
   limite faz qualquer parlamentar com volume suficiente de voto
   saturar em 0 ou 100 só por ter votado muito, não por ser realmente
   extremo. A média mede tendência, não volume.

Integridade Moral tem um passo extra, sempre aplicado (com ou sem voto):
   penalidade = min(25, despesas_suspeitas_count*3 + despesa_suspeita_média*0.1)
   Score_moral = clamp0a100( seed_moral + média(applied_score de V, ou 0 se V vazio) - penalidade )
```

**Duas funções de clamp diferentes, de propósito**:
- `clamp5a98` (só no seed) — nunca deixa a ESTIMATIVA de partido, por si
  só, parecer uma certeza absoluta (0 ou 100)
- `clamp0a100` (na nota final, com dado real aplicado) — aqui um extremo
  pode ser genuinamente justificado por voto/despesa real

Se `Total_votos = 0` em TODOS os 5 critérios → a nota inteira é
estimativa de partido (ver Metodologia, seção "Limitações").

> **Implementação real**: `scripts/lib/scoring.ts` (seed, clamps,
> `individualNoise`, pesos, `performanceLabel`) + `scripts/recalculate-scores.ts`
> (orquestra o híbrido, roda no sync-worker diário 05:00). Testes de
> regressão em `scripts/__tests__/scoring.test.ts`, incluindo o caso
> real que motivou a correção de hoje (16 votos somando +150 vs. a
> média de +9,4).

---

## 5. Nota geral (ponderada) + Ranking

```
Overall = Σ (Score_critério_i × Peso_i)   // pesos: 30/25/20/15/10 = 100%
```

**Ranking**: ordenação decrescente por `Overall`. Empates quebrados por `Total_votos` (mais votos = melhor rank).

---

## 6. Consistência

**Corrigido em 2026-09-08** — a fórmula anterior (desvio-padrão entre os
5 critérios) não é a real; nunca foi verificada contra o código.

```
Consistência = (nº de votos com applied_score ≠ 0) / (total de votos registrados)
```
- Mede **participação real**: SIM/NÃO conta, abstenção/ausência/obstrução não
- 100% = o parlamentar se posicionou em toda votação relevante que apareceu
- 0% = só absteve/faltou, ou não tem voto nenhum registrado (`totalVotes = 0` → consistência sempre 0, exibida como "—" no perfil, nunca como 0% — ver achado 2026-08-22 em `recalculate-scores.ts`)
- **Não** mede o quão parecidos os 5 critérios são entre si — isso não é o que a palavra "consistência" descreve aqui

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

# Snapshot real conferido em 2026-09-08 (vai continuar mudando — não trate
# como valor fixo, é só pra você saber a ordem de grandeza esperada):
# - 595 políticos ativos (513 Câmara + 82 Senado)
# - Membros FPE: ver contagem oficial + data na página /metodologia
#   ("Quem é da Bancada Evangélica") — não duplicar esse número aqui,
#   é exatamente o tipo de inconsistência entre documentos que este
#   guia existe pra evitar
# - Scores 0–100 para todos com total_votes > 0; sem voto = estimativa
#   de partido (ver §4)
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

## 11. Hashes de referência

**Corrigido em 2026-09-08** — esta seção prometia uma tabela de hashes
"publicados a cada sync" num arquivo `docs/CSV-HASHES-YYYY-MM-DD.txt`
que **nunca existiu** (as duas linhas abaixo eram placeholder literal,
nunca preenchido: `a1b2c3d4...`). Não existe pipeline de publicação de
hash histórico — não fingir que existe.

O mecanismo real de integridade é o que §7.5 já descreve corretamente:
cada resposta de `GET /api/politicians/export/votes/csv` vem com o
header `X-Content-SHA256`, calculado **na hora**, específico daquele
download. Não há (ainda) um hash histórico publicado por data — se
quiser comparar dois momentos no tempo, baixe o CSV nas duas datas e
guarde os headers você mesmo.

---

## 12. Contato / Dúvidas

- **Email**: abancada@narniano.com
- **GitHub**: https://github.com/rilsonjoas/a-bancada-evangelica
- **Issues**: abra uma issue com label `reproducibility`

---

*Este guia é parte da Onda A2 — Auditabilidade Pública (H3, 2026-08-27).  
Qualquer discrepância entre este guia e o código = bug. Reporte.*