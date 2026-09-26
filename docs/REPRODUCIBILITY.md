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
| **Câmara — Despesas** | `https://dadosabertos.camara.leg.br/api/v2/deputados/{id}/despesas` | CEAP (cota parlamentar do deputado) | `scripts/sync-all-gastos.ts` (todos) · `scripts/sync-camara.ts` (por deputado) |
| **Senado — Senadores** | `https://legis.senado.leg.br/dadosabertos/senador/lista/atual` | Lista de senadores, mandatos, partido, UF | `scripts/sync-senado.ts` |
| **Senado — Votações** | `https://legis.senado.leg.br/dadosabertos/votacao` | Votações nominais do Senado (desde fev/2026) | `scripts/sync-votes-senado.ts` |
| **Senado — Despesas (CEAPS)** | `https://adm.senado.gov.br/adm-dadosabertos/api/v1/senadores/despesas_ceaps/{ano}` | CEAPS (cota parlamentar do senador) | `scripts/sync-senado.ts` (subcomando `gastos`) |
| **Senado — FPE** | `https://legis.senado.leg.br/dadosabertos/collegiado/2583/membros` | Membros da bancada evangélica no Senado (codcol=2583) | `scripts/sync-fpe-members.ts` |
| **TSE — Prestação de contas 2022** | `https://dadosabertos.tse.jus.br/prestacao_contas/2022/` | Doações de campanha declaradas | `scripts/sync-tse-receitas.ts` + `sync-tse-candidatura.ts` |

> **Auditoria FPE (2026-09-16)**: `sync-fpe-members.ts` agora grava
> `fpe_captured_at` com a data REAL da captura (antes o seed escrevia
> `25/08/2026` hardcoded dentro de um recálculo de tiers, fazendo o
> campo parecer X e ser Y) e `fpe_source` constante. Quem saiu da lista
> oficial é DESMARCADO (fpe_* limpos) — antes, quem deixou a frente
> continuava marcado como membro silenciosamente. O SyncLog do FPE
> registra `fpeDropped` e `capturedAt`. O seed de tiers não sobrescreve
> mais uma captura já registrada.

> **Importante**: as APIs oficiais mudam. O histórico real de cada sync
> (o que rodou, quando, quantos registros) fica em `SyncLog` no banco —
> público via `GET /api/stats/sync-history` (corrigido em 2026-09-08:
> este guia citava um arquivo `docs/SYNC-LOG-2026-08-27.md` que nunca
> existiu no repositório).

> **Regras de classificação de despesa**: a fonte única é
> `scripts/lib/expense-rules.ts` (`EXPENSE_RULES_VERSION`). O método, a
> auditoria das regras descartadas e os limites estão em
> **`docs/DETECCAO-DESPESAS.md`**. Decisões e alternativas descartadas com
> justificativa em **`docs/DECISOES.md`**.

---

## 3. Classificação de votações → Pautas-chave

> **P0 corrigido em 2026-09-26 — o casamento era por SUBSTRING.**
> Até `SCAN_RULES` 1.0.0, `matchScanRule` usava `n.includes(k)`, e a keyword
> `sus` (sistema de saúde) é substring de `sustentavel`, `consumo`,
> `consumidor`, `construcao`, `resultado`, `suspeita`, `suspensao`. O
> **PL 2159/2021 — licenciamento ambiental** foi classificado como
> "Responsabilidade Social" e virou a maior pauta do sistema (2.872 votos).
> **67,4% de todos os votos do banco (18.104 de 26.860) entraram por essa
> regra.** A 1.1.0 casa por **palavra inteira**
> (`(?<![a-z0-9])…(?![a-z0-9])`). Análise completa e pendências abertas em
> **`docs/AUDITORIA-CLASSIFICACAO.md`**.

> **1.2.0 — falso positivo de SENTIDO (corrigido no mesmo dia).** A fronteira
> resolveu o substring, mas `prescricao` e `anistia` são palavras INTEIRAS
> legítimas fora de integridade moral: "PL 2597/2024 — contratos de seguro
> privado" casava `prescricao` (prescrição é termo corrente em direito
> securitário) e "PL 5122/2023 — liquidação, anistia e rebate de dívidas"
> casava `anistia` (anistia de dívida, não de crime). A 1.2.0 acrescenta o campo
> **`exclusoes`** à regra: contexto presente DESFAZ o casamento. A lista não
> é chute — é o contexto que apareceu no acervo real, medido.
>
> **1.3.0 — a palavra solta `familia` saiu de Valores Familiares.** Medido:
> "MPV 1268/2024 — Abre crédito extraordinário" (1.447 votos, 39% do dado
> sobrevivente) casava `familia` e entrava como Valores Familiares. A
> ementa oficial diz "Agricultura Familiar" e "Família e Combate à Fome" —
> é decreto orçamentário. **Trocar o local do casamento (ementa em vez de
> descrição) não resolvia**, porque a palavra está na ementa oficial, em
> sentido administrativo. O que resolve é trocar a KEYWORD.
>
> **Ainda aberto (P1):** `totalAgendas` na API contava 83 pautas e só 75
> apareciam (8 sem voto). Corrigido. E as pautas arquivadas continuam no
> banco, por rastro — o cálculo de score agora as EXCLUI.

Cada votação nominal é cruzada com **palavras-chave** dos 5 critérios. Se houver match, a votação vira uma **pauta-chave** (KeyAgenda), com um **peso fixo** (`weight`) e um sinal (`simIsPositive`) que decide se votar SIM soma ou subtrai.

**Regras reais** (`SCAN_RULES`, definidas em `scripts/lib/scan-rules.ts` — fonte ÚNICA, criada em 2026-09-16; este guia citava `scripts/sync-votes.ts` como dono das regras até 16/09, quando cada sync mantinha **sua própria cópia** e as duas cópias divergiram. Agora `sync-votes.ts` (Câmara) e `sync-votes-senado.ts` importam o mesmo módulo, e cada pauta-chave grava `rules_version = SCAN_RULES_VERSION` (hoje `1.3.0`) para que reclassificações futuras saibam quais pautas foram classificadas por qual conjunto de regras):

| Critério | Peso | Keywords reais (`SCAN_RULES`) | SIM é positivo? |
|----------|------|-------------------------------|------------------|
| **Proteção à Vida** (30%) | 20 | `aborto`, `nascituro`, `eutanasia`, `interrupcao da gravidez` | Não (votar SIM nessas pautas é contrário) |
| | 15 | `protecao da vida`, `direito a vida`, `crime contra a vida`, `homicidio` | Sim |
| **Valores Familiares** (25%) | 15 | `casamento`, `adocao`, `menor de idade`, `crianca`, `estatuto da crianca`, `direito da crianca`, `violencia contra a crianca` | Sim |
| | 15 | `identidade de genero`, `diversidade sexual`, `homoafetiv`, `transexual` | Não |
| **Integridade Moral** (20%) | 15 | `corrupcao`, `improbidade`, `ficha limpa`, `transparencia publica`, `lei anticorrupcao` | Sim |
| | 12 | `amnistia`, `anistia`, `prescricao`, `indulto` | Não |
| **Responsabilidade Social** (15%) | 10 | `assistencia social`, `bolsa familia`, `beneficio social`, `populacao em situacao de rua` | Sim |
| | 8 | `saude publica`, `sus`, `atendimento a vitimas` | Sim |
| **Liberdade Religiosa** (10%) | 20 | `liberdade religiosa`, `liberdade de culto`, `discriminacao religiosa`, `intolerancia religiosa`, `expressao religiosa`, `simbolo religioso`, `perseguicao religiosa` | Sim |
| | 10 | `laicidade`, `ensino religioso`, `crenca`, `assistencia espiritual`, `folga religiosa` | Sim |

> **Corrigido 2026-09-16 (Senado)**: o sync do Senado gravava `keywords = [rule.criteria]` (o enum, não as palavras-chave) — impossibilitava reclassificar e divergia da Câmara. Agora grava as keywords reais do módulo compartilhado.

**Lógica de match** (em `scripts/lib/scan-rules.ts` → função `matchScanRule`):
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
   penalidade = f(percentual de despesas fora do padrão)   ← PROPORCIONAL
   Score_moral = clamp0a100( seed_moral + média(applied_score de V, ou 0 se V vazio) - penalidade )

   A fórmula era `min(25, despesas_suspeitas_count*3 + score_médio*0.1)`,
   que punia VOLUME e não gravidade — medido em 2026-09-25: 31 dos 174
   parlamentares com despesa saturavam no teto de 25 pontos (18%), e a
   mediana era 6,01. É o mesmo defeito de saturação corrigido no item 4
   acima, que tinha sobrado aqui. O método de detecção e a fórmula
   exata estão em DETECCAO-DESPESAS.md §5.

   ATENÇÃO ao ler a nota de Integridade Moral: despesa é só UMA das
   componentes. A maior parte do critério vem do seed do partido e da
   média dos votos. Uma nota alta em Integridade Moral NÃO significa
   "gastos em ordem" — e por isso a aba de Gastos não mostra essa nota
   (ver DECISOES.md, D3).
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

**Fórmula em produção: `SCORE_FORMULA_VERSION = 1.2.0`** (2026-09-26).

Três parcelas, nesta ordem:

```
1. seed   = encolhe(average_do_partido_no critério, SEED_SHRINK) + ruído(±8)
2. voto   = média_por_assunto(desvio_do_parlamentar_vs_média_do_partido)
            × VOTE_WEIGHT_MULT
            × confiança(nº de assuntos)
3. gasto  = penalidade das despesas fora do padrão (só Integridade Moral)

Score_critério = limita( seed + voto − gasto , 0 , 100 )
Overall        = limita( Σ (Score_critério × Peso) + bônus_de_coerência , 0 , 100 )
```

| Constante | Valor | O que faz |
|---|---|---|
| Pesos | 30/25/20/15/10 | Soma 100% |
| `VOTE_WEIGHT_MULT` | **3.0** | Multiplica o desvio do voto próprio |
| `SEED_SHRINK` | **0.2** | Encolhe a herança partidária para 20% do desvio da média global (55) |
| `CONFIDENCE_HALF_AT` | **4** | Com 4 assuntos, o voto entra com metade do peso |
| `CONSISTENCY_MAX_POINTS` | **3** | Bônus de coerência, de −3 a +3 |
| Peso por tipo de votação | mérito 1,0 · redação final 1,0 · emenda 0,7 · requerimento 0,3 · urgência 0,2 | Uma votação sobre processo não pesa como uma sobre o tema |

### 5.2 Peso por tipo de votação (D-02, 2026-09-26)

Medido no acervo: **61% das votações substantivas são procedimentais**.
Um requerimento de urgência pergunta "entra na pauta hoje?"; um voto de
mérito pergunta "você apoia isto?". Tratá-los igual é tratar pergunta de
processo como posição sobre tema.

| tipo | peso | o que decide | n | % |
|---|---|---|---|---|
| mérito | 1,0 | posição sobre o assunto | 309 | 37% |
| redação final | 1,0 | a versão que vai ao sanction | 8 | 0% |
| emenda a proposição | 0,7 | posição sobre parte da proposição | 111 | 13% |
| requerimento | 0,3 | é sobre processo | 249 | 30% |
| urgência | 0,2 | é sobre entrar na pauta | 153 | 18% |

**Peso médio aplicado a uma votação: 0,602** (era 1,0 para todas).

O peso mora em `key_agendas.vote_kind_weight`, e não em `votes`, porque o
tipo é propriedade da **sessão de votação** — todos os votos de uma pauta
vêm da mesma deliberação. Classificador: `scripts/lib/vote-kind.ts`;
backfill: `scripts/classificar-votacoes.ts`.

**Precedências do classificador, que não são óbvias** e estão em teste:
1. "redação final" antes de "emenda" — "redação final da emenda nº 3" não é
   emenda;
2. "requerimento de urgência" antes de "requerimento" — os dois casam, e sem
   a ordem o de urgência perderia o peso próprio;
3. "Proposta de Emenda à Constituição" é a PEC **indo a voto**, ou seja
   mérito — não é emenda dentro dela;
4. "requerimento" ganha de "emenda" quando os dois aparecem, porque é o que
   a Câmara formalmente classifica.

**Efeito medido** (504 parlamentares com voto próprio real, `eta²` =
fração da variância da nota explicada pela média do partido):

| | variância partidária |
|---|---|
| Antes (`VOTE_WEIGHT_MULT=1`, `SEED_SHRINK=1`) | **91,4%** |
| Agora (`3.0` / `0.2` + confiança) | **37,6%** |

Ou seja: a nota passou a ser majoritariamente determinada pelo voto da
pessoa, não pelo partido. `eta²` de 37,6% significa que 62,4% da variação
entre notas é **dentro** do partido — voto próprio, coerência e gasto.

> 37,6% é a **medição feita em produção** depois do recálculo de 2026-09-26.
> A simulação em SQL previa 41,6%; a diferença vem de a simulação
> aproximar a ordem de clamp/arredondamento. A tabela acima é medição.

> **A simulação do plano errou.** `PLANO-PESO-INDIVIDUAL.md` previa 49,4%
> para o par original (`3.0` / `0.5`). Medido no dado real esse par dá 58%.
> A simulação não tinha o ruído individual nem a penalidade de despesa. A
> tabela acima é medição, não previsão — e é por isso que os valores finais
> divergem do plano.

### 5.1 Por que `PARTY_ALIGNMENT` NÃO é derivado dos votos (M5 recusado)

`PARTY_ALIGNMENT` é uma tabela escrita à mão, com a fonte declarada como
"DIAP, FPE, análises do JRN/Estadão e histórico de votações". **Nenhum valor
individualmente verificável existe para ela.** O plano previa derivá-la dos
votos reais (M5). Medi antes de decidir, e as três tentativas foram ruins:

| Critério | Votos gravados | Partidos |
|---|---|---|
| Responsabilidade Social | 19.250 | 21 |
| Valores Familiares | 7.251 | 21 |
| Integridade Moral | **359** | 20 |
| Proteção à Vida | **0** | — |
| Liberdade Religiosa | **0** | — |

**1. A média ingênua produz absurdo.** Média do `applied_score` normalizado
dá **PT 83,9 em Valores Familiares**, acima de REPUBLICANOS (61,9). Não é
erro de conta: o conjunto de pautas de família é dominado por projetos de
proteção à infância, em que quase todo mundo vota junto. "Conservador" e
"esteve presente" viram a mesma coisa, e o número não distingue nada.

**2. A versão por desvio da câmara amplifica ruído.** Medindo o quanto o
partido se afasta da média da câmara em cada votação, os valores explodem:
PSOL chega a 265 em Integridade Moral, e sete partidos batem exatamente
−90,4 — todos votaram igual em cima da única pauta que injurem.

**3. Amostra por partido é pequena demais.** Integridade Moral tem 359 votos
para 20 partidos: ~18 por partido. Isso não estima posição de partido, estima
o voto de um punhado de_ARMADO parliamentary.

**Decisão: M5 não entra.** Manter a tabela, mas **declarar que é estimativa
editorial** — o que é a verdade — em vez de citar fontes que não sustentam
cada valor. Derivar custaria mais em credibilidade do que rende em precisão.

> Pendência real: **Proteção à Vida (30%) e Liberdade Religiosa (10%) não têm
> pauta-chave nenhuma** — 40% do peso sem base medida. Isso é a lacuna mais
> grave que resta, e está em `ROADMAP.md`.

**Ruído individual (±8):** `individualNoise(id, critério)` é pseudoaleatório
e determinístico pelo ID. Existe para que dois parlamentares do mesmo partido
nunca tenham seed idêntica. Contribui com no máximo ±8 por critério — bem
abaixo do sinal de voto depois do M1c, então não é o que sustenta a
variância dentro do partido.

**Ranking**: ordenação decrescente por `Overall`. Empates quebrados por `Total_votos` (mais votos = melhor rank).

**"A última nota de cada político ativo" tem UMA fonte (2026-09-16):**
`src/api/scores/scores.query.ts` (`latestActivePoliticianScores` +
`summarizeLatestScores`). Antes cada endpoint (overview, ranking, votos,
partidos) tinha a própria cópia da query — e elas divergiram: o ranking do
site dizia média 63,1 enquanto `/api/votes/analysis` dizia 62,3, porque um
deles contava **todas as linhas** de `politician_scores` (histórico +
inativos) em vez da última por ativo. Desde 16/09 todos consomem o mesmo
módulo; o summary também expõe `withOwnVotes` (quem tem voto próprio vs.
quem está só com estimativa de partido), usado na média de partidos e nos
cards da UI.

---

## 6. Consistência

**Isto estava errado até 2026-09-26, e o nome mentia.**

A fórmula que este guia descrevia até ontem:

```
Consistência = (nº de votos com applied_score ≠ 0) / (total de votos registrados)
```

media **cobertura de dado** — "das minhas votações, quantas caíram num tema
que nós pontuamos?". É uma pergunta sobre o nosso cadastro, não sobre a
pessoa, e a coluna se chamava `consistency_score`.

**Agora mede posição (M3):**

```
Consistência = (votações alinhadas) / (votações pontuadas)      // campo exibido
Bônus        = (taxa − 0,5) × 2 × 3 × min(1, votações/10)     // ±3 pontos
```

- `applied_score > 0` é o lado alinhado (o sinal já vem aplicado no sync)
- Alinhar em vida, família e religião conta como coerente; alternar conta como incoerente
- 10 votos pontuados = bônus inteiro. Abaixo disso o bônus cai proporcionalmente
- Sem voto pontuado: consistência 0 e bônus 0. A UI exibe "—", nunca 0% (achado 2026-08-22, mantido)
- O bônus entra **somado por fora** dos cinco critérios: é um sinal transversal, não um sexto critério

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
| `scripts/lib/scan-rules.ts` | **Fonte única das SCAN_RULES** + `SCAN_RULES_VERSION` + `matchScanRule` — importado por Câmara e Senado (2026-09-16) | Texto da votação | Critério + peso + keywords + versão |
| `scripts/sync-votes.ts` | Baixa votações + classifica pauta-chaves | APIs Câmara/Senado | Tabelas `votes`, `key_agendas` (com `rules_version`) |
| `scripts/sync-votes-senado.ts` | Votações nominais do Senado + pautas-chave | API Senado | Tabelas `votes`, `key_agendas` |
| `scripts/recalculate-scores.ts` | **Coração do scoring** — recalcula notas; registra diff no `SyncLog` tipo `SCORES` (H6) | `votes` + `politician_scores` atuais | Tabela `politician_scores` + histórico de auditoria |
| `scripts/sync-fpe-members.ts` | Marca membros FPE com tier/fonte/data | APIs oficiais frentes | Colunas `fpe_*` em `politicians` |
| `src/api/scores/scores.query.ts` | Fonte única da "última nota por político ativo" (2026-09-16) | Tabela `politician_scores` | Scores vigentes + summary (média, distribuição, withOwnVotes) |
| `src/api/politicians/politicians.service.ts` → `exportVotes()` | Dump de votações individuais p/ auditoria (H4) | Tabela `votes` | CSV com fonte oficial e link |
| `src/api/politicians/politicians.service.ts` → `formatScore()` | Formata score do banco para API | `PoliticianScore` | DTO com notas 0–100 + metadata |

> **Dica de auditoria**: leia `recalculate-scores.ts` — determinístico, sem
> dependências externas; no fim grava o diff das notas no `SyncLog`.

---

## 9. Validações de qualidade (quality checks)

Após cada sync, o worker roda `pnpm quality:check` que valida:

1. **Estabilidade de ativos** ≤ 5% variação vs dia anterior — **corrigido 2026-09-16**: a checagem lia `details.totalPoliticians` de um SyncLog, campo que nenhum sync gravava → a validação **nunca passava de verdade** (comparava contra `undefined` e seguia). Agora casa o log pelo `details.action = 'quality_check'` (não por `skip: 1`, que interceptava o log errado) e **grava o SyncLog em todo check**, inclusive sucesso, com `totalPoliticians` real + resultados. Uma base que "sempre passou" mas nunca comparou nada virou uma checagem que se audita.
2. **Scores no range** 0–100 para todos
3. **Scores obrigatórios** — todo político ativo com votos tem 5 scores
4. **Despesas órfãs** = 0 (toda despesa tem político válido)
5. **Consistência FPE** — corrigido 2026-09-08: a checagem real (`checkFpeConsistency`) só confere se a contagem de membros ativos está numa faixa plausível (0 < N < 450) — **não compara contra a API oficial em tempo real**. Um erro de contagem dentro dessa faixa passaria sem alerta. A comparação de verdade contra Câmara 54477 + Senado 2583 é o que `sync-fpe-members.ts` faz na hora do sync, não este check

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
---

## 9. Versões das regras (o que era, o que é)

| Regra | Versão | Onde mora | Onde é documentada |
|---|---|---|---|
| `SCAN_RULES` | **1.3.0** | `scripts/lib/scan-rules.ts` | seção 3 deste guia |
| `EXPENSE_RULES` | 2.0.0 | `scripts/lib/expense-rules.ts` | `docs/DETECCAO-DESPESAS.md` |
| `SCORE_FORMULA` | **1.2.0** | `scripts/lib/scoring.ts` | seção 5 deste guia |

A versão da fórmula é gravada em `politician_scores.formula_version` a cada
recálculo e exposta pela API no perfil de cada parlamentar. Duas notas com
versões diferentes são, por definição, notas de regras diferentes — é isso que
torna a auditoria possível depois de uma recalibração.
