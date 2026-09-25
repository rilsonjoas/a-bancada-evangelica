# Detecção de despesa fora do padrão — método, auditoria e limites

> Documento de referência da aba **Gastos** do perfil de cada parlamentar.
> Complementa `REPRODUCIBILITY.md` (que trata de votos e scoring) — aqui a
> premissa é: **toda afirmação sobre "fora do padrão" tem que ser
> reproduzível a partir de dado público, e nenhuma delas é acusação.**

Data da última revisão: **2026-09-25**. Regra versionada em
`scripts/lib/expense-rules.ts` → `EXPENSE_RULES_VERSION = '2.0.0'`.

---

## 1. O que é a CEAP

Todo parlamentar tem uma verba indenizatória para custear o mandato:
passagens, hospedagem, alimentação, combustível, consultorias, material de
escritório, divulgação. Não é salary — é reembolso de gasto real, e cada
despesa vem com nota fiscal.

- **Câmara** — Cota para o Exercício da Atividade Parlamentar (**CEAP**),
  publicada em `dadosabertos.camara.leg.br/api/v2/deputados/{id}/despesas`
- **Senate** — Cota para o Exercício da Atividade Parlamentar dos Senadores
  (**CEAPS**), em
  `adm.senado.gov.br/adm-dadosabertos/api/v1/senadores/despesas_ceaps/{ano}`

O valor é público por lei. O que o site faz é organizar e comparar — nunca
julgar.

## 2. O problema que existia até 2026-09-25 (e por que a detecção não funcionava)

As regras de suspeita estavam **duplicadas e divergentes** em três lugares:

| Arquivo | Corte de valor | Gravava `suspicion_score`? |
|---|---|---|
| `scripts/sync-all-gastos.ts` | R$ 50.000 | sim |
| `scripts/sync-camara.ts` | R$ 50.000 | sim |
| `scripts/sync-senado.ts` | **R$ 100.000** | **não** (ficava 0) |

Havia ainda um quarto conjunto em `scripts/expense-analyzer.ts` (7 regras)
que **nunca entrou no cron**.

O resultado, medido em produção sobre **74.336 despesas**:

| Métrica | Valor |
|---|---|
| Despesas marcadas `is_suspicious` | **23** (0,03%) |
| Parlamentares com ao menos uma suspeita | **14 de 174** com despesa |
| Percentual médio de suspeita entre quem tem gasto | **0,082%** |

Ou seja: o card "Gastos fora do padrão" mostrava zero para a grande maioria
dos perfis, e a penalidade de Integridade Moral era praticamente constante
para todo mundo. **A feature não estava detectando nada.**

### 2.1 Por que um corte fixo não pode funcionar

O p95 por categoria varia **130x** no acervo real:

| Categoria | mediana | p95 | máximo | máx ÷ mediana |
|---|---|---|---|---|
| Táxi, pedágio e estacionamento | R$ 26 | R$ 499 | R$ 2.700 | **104x** |
| Alimentação do parlamentar | R$ 58 | R$ 153 | R$ 454 | 8x |
| Combustíveis e lubrificantes | R$ 235 | R$ 450 | R$ 9.121 | 39x |
| Consultorias e assessorias | R$ 1.500 | R$ 15.000 | R$ 110.000 | 73x |
| Divulgação da atividade parlamentar | R$ 2.500 | R$ 20.000 | R$ 175.000 | 70x |

Um limiar único em R$ 50.000 é **cego e ruidoso ao mesmo tempo**: uma
despesa de táxi de R$ 5.000 é 200x a mediana da sua categoria e passava
batido, enquanto uma de R$ 60.000 em Bluffticket — normal em gastos de
viagem — seria a única a ser marked.

## 3. O método atual (regras 2.0.0)

Fonte única: **`scripts/lib/expense-rules.ts`**. Os três syncs chamam
`evaluateExpense()`; não existe mais cópia da regra em lugar nenhum.

### 3.1 Corte robusto por categoria — mediana + MAD

Para cada par **(categoria normalizada, ano)** o site calcula a distribuição
de valores e marca a despesa quando ela é simultaneamente:

1. **estatisticamente anômala** — `0,6745 × (valor − mediana) ÷ MAD > 3,5`
   (limiar de Iglewicz-Hoaglin para outlier, convenção da literatura); e
2. **no topo da cauda** — `valor > p99` da própria categoria

**Por que as duas condições.** Com núcleo apertado, o MAD sozinho detesta
"atípico", não "outlier": na distribuição real de táxi/pedágio (mediana
R$ 26, MAD ≈ 2), um valor de R$ 600 dá z = 155 e marcaria ~15% da
categoria. O portão de percentil é o que ancora a taxa de marcação em ~1%
por categoria, por construção, e o MAD garante que o valor alto é mesmo
anômalo e não apenas caro. Para uma ferramenta que afeta a nota de alguém,
ser conservador é o correto.

- `MAD` tem piso de 5% da mediana (senão categoria de valor redondo dá MAD
  0 e a divisão explode)
- Categoria com **n < 30** no ano cai para o pool da categoria entre anos; se
  o pool também for fino, **não há baseline** e valem só as regras absolutas
  — o site prefere não marcar a estimar

### 3.2 Regras absolutas (mantidas)

| Regra | Peso | Isolada, marca? |
|---|---|---|
| Fornecedor sem CNPJ/CPF | 15 | não (15 ≤ 20) |
| Nome de fornecedor genérico ("Pessoa Física", "Diversos") | 15 | não |
| Valor glosado (reembolso recusado pela Casa) | 20 | não (20 ≤ 20) |
| Valor redondo em faixa alta (múltiplo de mil, ≥ R$ 10 mil) | 8 | não |
| Teto absoluto: R$ 50 mil Câmara / R$ 100 mil Senado | 30 | **sim** |

O corte canônico que decide `is_suspicious` é `suspicion_score > 20`
(`SUSPICION_THRESHOLD`), preservado do comportamento anterior.

### 3.3 Resultado medido no acervo real

Rodando o código de produção sobre as 74.336 despesas:

| | Antes | Depois |
|---|---|---|
| Despesas marcadas | 23 (0,03%) | **644 (0,87%)** |
| Parlamentares com sinal | 14 de 174 | **109 de 174** |
| Cobertura de baseline | — | 74.293 de 74.336 (99,9%) |

Distribuição do percentual de despesas fora do padrão por parlamentar:
mediana 0,43% · p75 1,75% · p90 4,53% · máximo 15,65%. Ninguém satura em
100% (verificado: 0 parlamentares com ≥30 despesas e 100% marcadas).

Por categoria, todas as grandes fecham em ~1,00% — a taxa vem por
construção do portão de p99, não de ajuste manual.

## 4. Auditoria das 7 regras do `expense-analyzer.ts`

Cada uma foi medida contra os 174 parlamentares com despesa **antes** de
ser trazida. Resultado:

| Regra | Parlamentares acionados | Veredito |
|---|---|---|
| R1 `HIGH_VALUE` (valor alto) | 23 despesas | **portada** → teto absoluto |
| R2 `UNIDENTIFIED_SUPPLIER` | 12.856 despesas com score 15 | **portada** |
| R3 `SUSPICIOUS_SUPPLIER_NAME` | — | **portada** |
| R4 `SUPPLIER_CONCENTRATION` (1 fornecedor > 50% do mês) | **116/174 = 67%** | descartada |
| R5 `HIGH_FREQUENCY` (>20 despesas do mesmo tipo no mês) | **98/174 = 56%** | descartada |
| R6 `TEMPORAL_PATTERN` (>70% no fim do mês) | **0/174 = 0%** | removida (morta) |
| R7 `ROUND_VALUES` (>30% de valores redondos) | 2/174 = 1% | **portada** |

> **R4 e R5 são ruído, não sinal.** Um parlamentar com 300 despesas
> naturalmente tem um fornecedor principal acima de 50% num mês de cota
> pequena, e naturalmente passa de 20 despesas de combustível. Ligado como
> estava, o analyzer teria marcado **67% de todos os parlamentares** numa
> única rodada — por isso ele nunca entrou no cron.

R4 e R5 não foram jogadas fora em definitivo: a infraestrutura de contexto
(`buildAnalysisContext`) foi preservada, e elas podem ser **reparadas** com
limiares relativos (por exemplo, concentração dentro da própria categoria)
se um dia houver evidência de que carregam sinal.

## 5. Como isso entra na nota

```
despesas → is_suspicious + suspicion_score
        ↓
penalidade = f(percentual de despesas fora do padrão)   ← proporcional
        ↓
moral_integrity = seed do partido + média dos votos − penalidade
        ↓
nota geral = Σ(critério × peso)   ← integridade moral pesa 20%
```

**A penalidade é proporcional, não por contagem.** A fórmula anterior era
`min(25, nº_suspeitas × 3 + score_médio × 0,1)` — punia **volume**: um
parlamentar com 300 despesas batia o teto de 25 só por acumular 9 marcações,
enquanto outro com 5 anomalias reais ficava de fora. Medido depois da
mudaça de regra: 31 dos 174 (18%) saturavam no teto, e a mediana era 6,01.
Esse é o mesmo defeito de saturação que já foi corrigido na média dos votos
em 2026-09-08 (ver `REPRODUCIBILITY.md` §4, item 4) — e que tinha sobrado
na penalidade de despesa.

Efeito máximo no resultado: 25 pontos no critério × 20% de peso = **5,0
pontos** na nota de 0–100.

## 6. Limites conhecidos (leia antes de tirar conclusão)

1. **Cobertura de 24%.** Só **174 dos 730** parlamentares registrados têm
   despesa no acervo. Os demais aparecem sem dado, não com gasto normal.
2. **A marcação é estatística, não jurídica.** Uma despesa no topo 1% da
   categoria pode ser erro de digitação do órgão, particularidade legítima
   do mandato, ou algo fora do padrão. O site diz exatamente o que o corte
   fez e deixa o usuário conferir no recibo oficial.
3. **Não é ficha limpa.** Não há integração com STF, MP, CPI, Conselho de
   Ética, TCU nem operações. Não detecta corrupção, apenas desvio
   estatístico de um valor que o próprio parlamentar declarou.
4. **Só a cota.** Emendas, obras, verbas e convênios não entram — a análise
   não cobre o resto do gasto público, só a verba indenizatória do mandato.
5. **Senadores usam limiar absoluto maior** (R$ 100 mil contra R$ 50 mil) por
   a CEAPS ter teto legislation differently — e a categoria do Senado é
   agregada ("Locomoção, hospedagem, alimentação, combustíveis e
   lubrificantes"), o que torna a mediana por categoria menos informativa
   lá do que na Câmara.
6. **A penalidade de despesa é uma entre cinco componentes do critério
   Integridade Moral.** A maior parte desse critério vem do seed do partido
   e da média de votos — não do gasto.

## 7. Reproduzir

```bash
# 1. Sincronizar as despesas (Câmara e Senado)
pnpm sync:camara:gastos
pnpm sync:senado:gastos

# 2. Ver o antes/depois sem gravar nada
pnpm expenses:recalc --dry-run

# 3. Gravar (grava snapshot de rollback antes, em historical_scores)
pnpm expenses:recalc

# 4. Recalcular as notas — o ranking se move
pnpm scores:recalculate
```

O passo 3 grava um snapshot de todas as notas em `historical_scores` com
`snapshot_reason = 'expense_rules_<versão>'`, para rollback. O passo 4 é
obrigatório porque `recalculate-scores.ts` lê `expense.is_suspicious`.

`--politician=<id>` restringe a um parlamentar, para depuração.

## 8. Testes

`scripts/__tests__/expense-rules.test.ts` — 26 testes cobrindo:
normalização de categoria, mediana/MAD/p99, o portão de percentil (que
impede o MAD de marcar a cauda inteira), a regressão do vazamento de pool
entre categorias (bug real de 2026-09-25, em que uma categoria de 25
despesas recebia baseline com n = 2.746), e a wording das mensagens.
