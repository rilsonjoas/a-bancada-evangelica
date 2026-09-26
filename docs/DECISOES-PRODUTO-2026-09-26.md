# Decisões de produto — 2026-09-26

**Status:** aprovadas pelo Rilson em 2026-09-26, em construção.
**Contexto completo:** `REGISTRO-2026-09-26.md`

Este arquivo existe para não nos perdermos. Cada decisão registra **o que foi
escolhido, o que foi recusado, e por quê** — porque a parte que mais importa
aqui não é a escolha, é o que ela custou.

---

## D-01 — A nota permanece

**Escolhido:** a nota 0–100 continua no site.

**Recusado:** tirar a nota e publicar só "posição por tema". Eu propus; o
Rilson recusou com o argumento certo: **sem número o site parece fraco.** O
gancho de um site de transparência é o número, e um número honesto com
anatomia vale mais que um site sem número.

**O que muda em vez disso:** a nota passa a mostrar de que é feita. Três
componentes visíveis, cada uma com sua origem:

```
Nota = critérios de voto (75%) + integridade moral por gasto (25%)
```

Dentro dos 75% de voto, cada critério é `semente do partido (encolhida a 20%)
+ voto próprio (×3, com peso por qualidade e confiança por base)`.

**A pergunta que a nota passa a responder:** "de onde saiu esse número?",
e não "o que esse número quer dizer". A segunda continua sendo um juicio de
valor que o site não tem direito de fazer sozinho — a primeira é fato
verificável.

**Consequência aceita:** a nota continua sendo **50,4% explicada pelo
partido** (medido). Um número que ainda é majoritariamente herdado, mas que
agora diz isso na tela em vez de esconder.

## D-02 — Peso por qualidade de votação

**Escolhido:** o tipo da votação pesa, e o peso é visível ao usuário.

| tipo | peso | Sessions | por quê |
|---|---|---|---|
| votação de mérito | **1,0** | 253 (30%) | é posição sobre o assunto |
| emenda a proposição | **0,7** | 167 (20%) | posição sobre parte; herda o assunto da mãe |
| outro requerimento | **0,3** | 249 (30%) | é sobre processo |
| requerimento de urgência | **0,2** | 153 (18%) | é sobre entrar na pauta |

**Transparência exigida pelo Rilson:** o usuário tem que ver isso. Cada voto
que compõe a nota mostra o tipo e o peso que teve. Sem isso, o peso por
qualidade é arbitrário escondido.

**Medido:** 48% das votações são procedimentais. Hoje elas pesam como se
fossem de mérito.

## D-03 — Despesa: uma origem só, dentro de Integridade Moral

**Escolhido:** o desenho em que **cada critério é medido pelo dado que
realmente existe para ele.**

| critério | peso | medido por |
|---|---|---|
| Proteção à Vida | 30% | voto — **sem dado** (0 assuntos) |
| Valores Familiares | 20% | voto (2 assuntos, 1.112 votos) |
| **Integridade Moral** | **25%** | **gasto — nunca voto (0 assuntos)** |
| Responsabilidade Social | 15% | voto (3 assuntos, 2.593 votos) |
| Liberdade Religiosa | 10% | voto — **sem dado** (0 assuntos) |

**Os 5 pontos que a Moral ganhou saíram de Valores Familiares** (25% → 20%),
decidido pelo Rilson. Proteção à Vida **mantém 30%**, mesmo sem dado — e o
site declara isso.

**Por que a Moral deixa de ser critério de voto:** ela tem **zero assuntos
medidos**. Manter um critério de posição com 25% de peso e nenhuma votação
seria a mesma falha que acabamos de consertar. Como não há voto, o critério
passa a ser o que ele sempre foi na prática: **conduta**, medida pela cota
parlamentar.

**A despesa entra uma vez só.** A alternativa — despesa como componente
global de 15% *e* dentro da Moral — contaria a mesma despesa duas vezes.
Descartado.

**Por que a Moral subiu para 25% e não ficou em 20%:** é o único critério
com dado individual robusto no acervo — 74.336 despesas de 174
parlamentares, que não dependem de existir votação nominal.

## D-04 — A camada "acompanhada, sem dado" fica fora da ordenação

**Escolhido:** Vida, Moral (voto) e Religiosa saem da ordenação do ranking
e vivem em página própria. **Com pedido explícito do Rilson: deixar claro
para o usuário.**

**Recusado:** manter no ranking com peso zero. Peso zero é um número que
mente sobre o próprio peso — parece que pesa, não pesa.

## D-05 — Rastreamento de comissões: sim

**Escolhido:** rastrear proposição por tramitação.

**O que isso entrega (medido na API):** órgão, situação, data, despacho,
relator. Permite dizer com fonte oficial que *n* projetos sobre um tema
passaram pela comissão *X* e o que aconteceu com cada um.

**O que NÃO entrega:** votação nominal. `/orgaos/{id}/votacoes` só responde
para o Plenário (180); comissão dá **404**, `/deputados/{id}/votacoes` dá
**405**, e a tramitação não tem campo de votação.

**Consequência aceita:** comissão resolve o problema de **assunto**, não o de
**posicionar a pessoa**. São coisas diferentes, e a documentação diz isso
para ninguém contar com o que não existe.

## D-06 — Desvio do partido: formulação neutra, sem julgamento

**Escolhido:** desvio **nunca** penaliza. A nota já está com o sinal
correto, porque o `applied_score` vem assinado.

| situação | o que a nota faz |
|---|---|
| afastou-se do partido **a favor** dos critérios | **sobe** |
| afastou-se do partido **contra** os critérios | **cai** |
| seguiu o partido | acompanha a média |

**Não existe métrica separada de desvio**, e não vai existir: seria contar
o mesmo voto duas vezes. O desvio é **camada de exibição**, não de pontuação.

**Formulação aprovada:** neutra, e **dizendo em qual critério**. Exemplo do
texto: *"afastou-se do partido em 2 de 3 assuntos — saúde e família, nos dois
casos a favor dos critérios"*. Sem adjetivo, sem "maverick", sem "não segue
o partido".

**Decisão do Rilson:** o ranking **aceita ordenação por desvio** — mas a
ordenação principal continua sendo a **nota do congressista**, que é quem o
usuário quer acompanhar. A ordenação por desvio é secundária.

## D-07 — Educação política como função do site

**Escolhido:** o site passa a explicar **por que não existe voto em
determinado assunto**. Motivo dado pelo Rilson: muitas vezes as pautas não
entram, e é importante que o cidadão pressione deputados a mostrarem
posicionamento.

**Escopo:** não é blog, é ferramenta. Cada proposição rastreada mostra o
caminho real — que comissão, quando, o que aconteceu, quem era o relator.

**Por que isso serve a transparência, e não só ao marketing:** converte
"não medimos isso" de desculpa em **explicação com fonte oficial**. A
limitação do site vira o conteúdo dele.

## D-08 — Transparência do que o site não sabe

**Regra permanente do Rilson:** tudo que o site **não sabe** fica escrito
que não sabe, com o método à vista. Reforça D-04 e D-07 e é o princípio que
virou o teste de consistência.

---

## Pendência em aberto antes de codar

**421 dos 595 parlamentares ativos (71%) não têm nenhuma despesa
registrada.** Como Integridade Moral passa a 25% medida **só** por gasto,
esses 421 ficam com:

| critério | peso | de onde vem para eles |
|---|---|---|
| Proteção à Vida | 30% | estimativa do partido — sem dado |
| Valores Familiares | 20% | voto + partido |
| **Integridade Moral** | **25%** | **estimativa do partido — sem dado de gasto** |
| Responsabilidade Social | 15% | voto + partido |
| Liberdade Religiosa | 10% | estimativa do partido — sem dado |

Ou seja: **para 421 parlamentares, 65% da nota vem de estimativa de
partido.** Isso precisa de decisão do Rilson antes de codar, porque é a
mesma armadilha que acabamos de desmontar, só que com outro nome.

## Ordem de execução acordada

Uma coisa de cada vez, medido, para que a causa do efeito seja atribuível.
Misturar dois pesos e ver o número mudar é exatamente o erro da simulação
que errou de 49,4% para 58%.

1. **Peso por qualidade de votação** (D-02) — sozinho, com a
   transparência na tela
2. **Transparência da fórmula** (D-01) — a anatomia de três componentes no
   perfil, que já existe desde o M4
3. **Integridade Moral por gasto** (D-03) — depois de resolver a pendência
4. **Ranking por desvio** (D-06) e **formulação neutra** no perfil
5. **Rastreamento de comissões** (D-05) e **educação política** (D-07)

---

## Resultado medido do D-02 (aplicado 2026-09-26)

Classificação aplicada em produção e nota recalculada.

| tipo | peso | pautas com voto | das quais ativas |
|---|---|---|---|
| mérito | 1,0 | 30 | 4 |
| redação final | 1,0 | 1 | 0 |
| emenda a proposição | 0,7 | 15 | 1 |
| requerimento | 0,3 | 19 | 3 |
| urgência | 0,2 | 10 | 2 |

**399 de 595 notas mudaram.**

### A base restante, sujeito por sujeito

Dos 8 assuntos que ainda sustentam a nota:

| critério | tipo | peso | assuntos |
|---|---|---|---|
| Valores Familiares | mérito | 1,0 | 1 |
| Valores Familiares | requerimento | 0,3 | 1 |
| Valores Familiares | urgência | 0,2 | 1 |
| Proteção à Vida | mérito | 1,0 | 1 |
| Responsabilidade Social | mérito | 1,0 | 2 |
| Responsabilidade Social | emenda | 0,7 | 1 |
| Responsabilidade Social | requerimento | 0,3 | 1 |
| Responsabilidade Social | urgência | 0,2 | 1 |

**Metade da base restante é procedimental.** Não foi o peso que encolheu o
sinal — foi a revelação de que metade do que tínhamos era o tipo mais fraco
de evidência.

### O achado que o D-02 expôs (e que é da paginação)

**29 das 75 pautas com voto (39%) não têm NENHUMA votação de mérito.** A
única votação que capturamos delas foi o requerimento de urgência.

Confirmado em dois casos que já conhecíamos como sendo de mérito:

> "PL 2275/2022 — Dispõe sobre medidas para prevenção e primeiros socorros"
> `Aprovado o Requerimento de Urgência (Art. 155 do RICD). Sim: 401;` — e só.

> "PL 4364/2020 — Política Nacional de Cuidado Integral"
> `Aprovado o Requerimento de Urgência (Art. 155 do RICD). Sim: 366;` — e só.

Ou seja: **a gente capturou a votação processual e perdeu a de mérito.** Não
por erro de classificação, mas porque o bug de paginação (§
`AUDITORIA-VOTACOES.md`) fez o sync nunca alcançar a página onde a votação
de mérito estava.

**Consequência:** o peso por tipo não é um ajuste de nerdagem. Ele tornará
visível, na nota, que a maior parte do nosso dado é fraco. E a correção
desse dado é a **paginação**, que agora é segura de fazer porque o
classificador está certo.

### O que fazer com isso

Nada. Está registrado, e é honesto publicar assim. O caminho é:
1. paginação (já é a pendência da auditoria de votações);
2. com a página certa alcançada, reclassificar e remedir;
3. só então avaliar se o D-02 produz a separação entre pessoas que a nota
   precisa ter.
