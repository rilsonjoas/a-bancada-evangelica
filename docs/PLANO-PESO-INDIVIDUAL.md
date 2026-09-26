# Plano de peso individual — M1 a M5

> Data: 2026-09-25. Complementa `PLANO-CONSISTENCIA.md` (teste de
> consistência) e responde a um pedido explícito do Rilson:
> *"eu prefiro que o posicionamento pessoal do congressista valha bem mais
> que o partido, bem mais mesmo."*
>
> Estado: **aprovado, aguardando execução.**

---

## 1. O diagnóstico em uma frase

A nota é 91,8% partido porque é aritmética, não porque o voto não conte:

| Fonte | Amplitude medida no acervo |
|---|---|
| Seed do partido (`PARTY_ALIGNMENT`) | **~70 pontos** (PT 18 → Republicanos 88) |
| Sinal de voto (`applied_score` médio) | **24 pontos** (p10 −12 → p90 +12) |

Com `nota = seed + delta`, o voto entra multiplicado por 1 contra um termo de
amplitude 70. **Não é que o voto pese pouco na fórmula — é que o outro termo é
enorme.**

E o dado individual não é escasso: por critério, a mediana é de **7 assuntos**
distintos, e **72% dos critérios medidos têm 5 ou mais**. O sinal existe e é
confiável na maioria dos casos. A fórmula só não o usa.

## 2. Simulação medida antes de codar (acervo real, 504 parlamentares com voto)

Nenhum código de produção foi tocado para isto — a simulação roda sobre o
acervo exportado do banco, com o motor real de `scoring.ts`.

| Cenário | voto × | seed | % da variância que é partido |
|---|---|---|---|
| **Hoje** | ×1 | 100% | **91,8%** |
| M1a — só dobrar o voto | ×2 | 100% | 88,0% |
| M1b — dobrar voto + seed 50% | ×2 | 50% | 61,9% |
| **M1c — triplicar voto + seed 50%** | ×3 | 50% | **49,4%** |
| M1d — triplicar voto + seed 30% | ×3 | 30% | 23,5% |
| M1e — triplicar + seed 30% + confiança | ×3 | 30% | 44,6% |

### Três conclusões que contrariam a intuição

1. **Dobrar o voto sozinho quase não faz nada** (91,8% → 88,0%). Para o voto
   competir, é preciso encolher o seed. As duas alavancas precisam andar
   juntas — uma sozinha quase não produz efeito.

2. **M1c (×3 + seed 50%) chega em 49,4%**: o voto passa a ser metade da nota.
   É o alvo recomendado. O seed continua pesando 50%, então o partido não
   desaparece e a reprodutibilidade do guia continua válida.

3. **Confiança (M2) não soma, subtrai** quando o seed já está encolhido
   (23,5% → 44,6% em M1d→M1e). Faz sentido: encolher o seed dá mais peso ao
   voto, e voto de quem tem 1 assunto é ruído. Confiança **reforça** o peso do
   voto onde o voto é confiável e o reduz onde não é.
   **Consequência de ordem: M2 entra DEPOIS de M1c, medida isolada.**

## 3. As cinco mudanças, na ordem de execução

Cada uma é precedida de snapshot, tem teste de regressão e é medida
antes/depois.
`EXPENSE_RULES_VERSION`/`SCAN_RULES_VERSION` não se aplicam aqui — a fórmula
vive em `recalculate-scores.ts` e precisa de uma `SCORE_FORMULA_VERSION`
própria (ver M0).

### M0 — Versionar a fórmula (obrigatório antes de qualquer uma)

Hoje não há versão da fórmula de score: `PARTY_ALIGNMENT` e os pesos podem
mudar sem âncora nenhuma, e o diff de `SyncLog` não diz com que fórmula cada
nota foi calculada. Sem isso, M1–M5 são mudancinha sem rastro.

- `SCORE_FORMULA_VERSION` em `scripts/lib/scoring.ts`, junto de
  `SCAN_RULES_VERSION`/`EXPENSE_RULES_VERSION` (o padrão já existe)
- gravado em `politician_scores` e no `details` do `SyncLog`
- a decomposição por critério (M4) fica versionada junto

### M4 — Decomposição visível (primeiro, risco zero)

Antes de mexer na matemática, mostrar a verdade de hoje. A nota deixa de ser
um número e passa a ser: **"40 pontos vieram do partido, 18 do seu voto, 3
foram descontados por despesa"**. Barras empilhadas no perfil, tooltip na
home.

Impacto de confiança: alto. Risco: zero, não muda nota. Serve de ligne de base
para o usuário comparar antes/depois de M1c.

### M1c — Peso do voto ×3 + seed a 50% do desvio

- multiplicador do delta 1 → 3
- seed: `55 + (PARTY_ALIGNMENT[partido][critério] − 55) × 0.5`
  (encolhe em direção à média, preservando o *rank* dos partidos)
- snapshot antes, medição de 91,8% → esperado 49,4%
- **não satura** (verificado na simulação: 0 saturados em todos os cenários)

### M2 — Confiança encolhe base fraca (medida isolada, depois de M1c)

O peso do voto de um critério escala com o número de assuntos que o
sustentam (mediana 7, mas 28% dos critérios têm só 1). Padrão estatístico
`1/√n`, com piso e teto explícitos. Um critério com 1 assunto não vale o mesmo
que um com 14 — e o partido pesa mais justamente onde o voto não é
confiável, que é coerente com "zero honesto > número fabricado".

### M3 — Consistência entra na nota (o Relson escolheu a opção (b))

A consistência (coerência entre os votos de cada parlamentar) já é calculada
(`consistency_score`) e nunca pesou em nada. É o sinal mais individual que
existe: ninguém mais vota como você nas suas pautas. Entra na nota com peso
modesto (~5–8%), com a decomposição mostrando a parcela.

### M5 — Derivar o seed do voto real (só depois de ver M1–M4)

`PARTY_ALIGNMENT` é escrita à mão com fonte genérica. Substituir por cálculo
real (média do partido por critério, sobre os votos de todos os seus
membros) reduz o peso do partido *por construção* e ainda torna a nota
reprodutível por terceiro, que é o que o guia promete. É a mais próxima do
pedido e a que mais move a nota — entra por último, com a evidência de
M1–M4 na mão.

## 4. Requisito de aceitação: tudo explicado ao usuário

Nenhuma das M1–M5 entra sem que o usuário consiga ler, em linguagem leiga,
**de onde veio cada ponto da nota dele**. Isso não é nota de rodapé — é parte
do critério de aceitação de cada mudança:

| Mudança | O que tem que aparecer na tela | Onde |
|---|---|---|
| M0 | "versão da fórmula: X" e a data do último recálculo | perfil, `/dados` |
| M4 | decomposição por critério e por fonte | perfil (barras empilhadas) |
| M1c | "sua nota: 55 do partido + 22 do seu voto − 3 de despesa = 74", com o multiplicador explicado | perfil, `/metodologia` |
| M2 | "base fraca: 1 assunto" vs "base sólida: 7 assuntos" por critério | perfil |
| M3 | "consistência: 92% — votou de forma coerente em 8 assuntos" | perfil |
| M5 | "base do partido derivada dos votos de N membros, não escrita à mão" | `/metodologia` |

Toda mudança também vai para:
- `DECISOES.md` — com o número medido antes e depois
- `REPRODUCIBILITY.md` §4 — fórmula real executada
- `AUDITORIA-CALCULOS.md` §1 — o "90,8% é partido" vira número histórico

## 5. Verificação de cada passo

Nenhum passo é "aplicar e rezar". Para cada M:

1. snapshot de rollback (o `historical_scores` já existe para isso)
2. teste de regressão da fórmula (saturação, monotonicidade, seed
   encolhido preserva rank de partido)
3. `recalculate-scores --dry-run` no VPS, medir % de variância do partido
4. comparar com a simulação — divergência grande = parar e investigar
5. só então gravar, e conferir em produção
6. update visual do perfil (screenshot lido) antes de fechar o commit

## 6. O que NÃO entra

- **Não mexo nos 5 critérios nem nos pesos 30/25/20/15/10.** O pedido é
  sobre peso do *indivíduo*, não sobre o que é medido. Mudar o conjunto de
  critérios agora seria trocar um problema conhecido por um desconhecido.
- **Não removo o seed.** Sem ele, quem tem 1 voto fica sem nota. O problema é
  ele ser grande demais e pouco transparente, não existir.
- **Não publico fórmula nova com texto velho.** O Rilson foi explícito:
  tudo junto, methodology atualizada no mesmo tempo que o código entra.

## 7. Pergunta em aberto (respondida pelo Rilson em 2026-09-25)

**Fazer tudo junto e sem entrada de errata.** Justificativa aceita: projeto
novo, nada divisive do público geral ainda, e errata agora seria teatro.
Plano: as correções entram em ordem, tudo testado, e só então a
`/metodologia`, o README e o resto das páginas de texto são atualizados
para refletir a fórmula final — nunca no meio, para não haver fórmula nova
com texto velho.
