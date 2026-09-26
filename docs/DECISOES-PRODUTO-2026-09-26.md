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

---

## Resultado da paginação (medido 2026-09-26)

Sincronização completa com paginação corrigida.

| | antes | depois |
|---|---|---|
| pautas | 83 | **162** |
| votos individuais | 26.860 | **54.997** |
| sessões substantivas vistas | 244 | **838** |
| assuntos medidos | 6 | **71** |

Vida saiu de 0 para 3 assuntos e Religiosa de 0 para 2 — o que parecia
"esses temas não são mensuráveis" era "a gente não estava coletando".

### E o que a paginação expôs

Com 6 assuntos os falsos positivos não apareciam. Com 71, apareceram em
bloco, e a revisão um a um era inviável sem saber a causa. Daí a nova
ferramenta `scripts/auditar-classificacao.ts`, que agrupa as pautas pela
**palavra-chave que decidiu cada uma**, com o volume que cada uma carrega.

O que ela mostrou, e que é o achado de hoje:

| palavra | volume | o que realmente é |
|---|---|---|
| `assistencia social` (Social) | 6.500 votos, 17 pautas | parte PEC 383/2017 (correta), parte projeto de estágio (incidental) |
| `homicidio` (Vida) | 1.720 votos, 5 pautas | **nenhuma** sobre vida intrauterina — todas Código Penal e Lei de Execução Penal |
| `improbidade` (Moral) | 1.077 votos, 3 pautas | Lei 8.429 é Improbidade (correto); Lei 8.080 é o SUS (incidental) |
| `populacao em situacao de rua` (Social) | 1.410 votos, 4 pautas | Política de Trabalho Digno — plausível |

`homicidio` saiu na **SCAN_RULES 1.4.0**. Homicídio é crime contra pessoa
**já nascida**, e proteção à vida neste site é sobre a vida que ainda não
começou. O critério ficou sem dado — e isso é a verdade, não falha nossa.

### A verificação que fecha a questão de Vida e Religião

Na fonte, não por inferência:

- a API de proposições da Câmara devolve **5** proposições indexadas por
  "aborto", e **só uma** tem qualquer registro de tramitação no plenário;
- "liberdade religiosa" e "laicidade" devolvem **zero** proposições;
- de 829 ementas resolvidas do acervo de plenário, **zero** são sobre
  aborto ou vida intrauterina.

**O plenário da Câmara não vota esses temas em votação nominal.** Projeto
com valor nesse país passa por comissão, e comissão não está na API
(`/orgaos/{id}/votacoes` só responde para o 180).

Isso muda o peso da decisão D-07: a camada educativa deixou de ser
diferencial e virou **a única via** para Vida, Moral e Religiosa. O site não
falha nesses temas — ele explica por que não pode medi-los, e mostra quem
decidiu o destino de cada projeto.

### Estado depois da reclassificação

| critério | pautas | assuntos | votos |
|---|---|---|---|
| Responsabilidade Social | 29 | 14 | 10.867 |
| Valores Familiares | 6 | 4 | 2.152 |
| Integridade Moral | 4 | 4 | 1.524 |
| **Proteção à Vida** | **0** | **0** | **0** |
| **Liberdade Religiosa** | **0** | **0** | **0** |

Nota recalculada: média 60,3, escala 50–69, 505 com voto próprio, 51,3% de
variação partidária. 457 de 595 notas mudaram.

### A correção de raiz: casar contra título + ementa (1.5.0, feita)

`description` concatena três textos: ementa, descrição do relator e
descrição da votação. Só a ementa é o objeto oficial da proposição; as
outras duas são documento administrativo, onde qualquer palavra aparece
por acaso. A classificação agora usa **`textoParaClassificar(titulo,
description)`**, que fica só com o título e o primeiro segmento do
`description` (que é a ementa, por construção do sync).

Foi a raiz de quase todo falso positivo:

| | volume que entrava no critério errado |
|---|---|
| `sus` dentro de "sustentável" (1.1.0) | 67,4% de todos os votos |
| `homicidio` em projeto de Código Penal (1.4.0) | 1.720 votos |
| descrição do relator (1.5.0) | mais 1.143 votos |

### Estado depois da correção de arquitetura (1.5.0)

Quatro rodadas de auditoria, cada uma mensurável. O que caiu foi falso
positivo; o que ficou foi lido assunto por assunto.

| rodada | assunto que entrava | votos que entravam errados |
|---|---|---|
| 1.1.0 — `sus` dentro de "sustentável" | 830 | 18.104 (67,4% de tudo) |
| 1.2.0 — exclusões contextuais | — | — |
| 1.3.0 — palavra solta `familia` | — | — |
| 1.4.0 — `homicidio` (Código Penal) | 5 | 1.720 |
| 1.5.0 — descrição do relator fora | 3 | 1.143 |
| 1.5.0 — crédito extraordinário, Lei 8.080, `crianca` em lei ambiental | 3 | 2.938 |

**Hoje: 11 assuntos, 7.330 votos, 13,3% do acervo.** Escore recalculado:
média 58,8, escala 50–66, 504 com voto próprio.

| critério | assuntos | votos |
|---|---|---|
| Responsabilidade Social | 7 | 5.418 |
| Valores Familiares | 3 | 1.465 |
| Integridade Moral | 1 | 447 |
| Proteção à Vida | 1 | 0 |
| Liberdade Religiosa | 0 | 0 |

### Os 11 assuntos, lidos um a um

✅ PEC 383/2017 (SUAS) · PEC 14/2021 (proteção social, SUS) · MPV 1164/2023
(Bolsa Família) · PL 2245/2023 (trabalho digno) · PL 4364/2020 (cuidados) ·
PL 424/2015 e PL 10106/2018 (Leis 8.080) · PL 3914/2023 (Estatuto da Criança) ·
PL 1520/2021 (homicídio de criança como crime hediondo) · PL 2162/2023
(anistia aos participantes das manifestações) · PL 2275/2022 (prevenção para
crianças) · PL 1904/2024 (aborto equiparado a homicídio).

Nenhum resto é lixo de classificação. O que resta é pouco porque o corpus
é pouco: de 5 proposições sobre aborto, **1** chegou ao plenário nominal
desde 2023; sobre liberdade religiosa, **nenhuma**.

### E "moral" tem 1 assunto só

Motivo: Integridade Moral é, por decisão do usuário, medida por **despesa**,
não por voto. A pauta nominal de anistia entra como registro histórico, mas
o critério de Moral se sustenta no gasto — que é onde há 421 Assembleia
inteira com dado.

### Achado do mesmo dia: 70% das votações nominais são procedimentais

O vote quality tinha sido aplicado ANTES da paginação. Quando a paginação
trouxe 79 pautas novas, elas nasceram com `voteKind = MERIT` (o default do
schema) — e o erro é invisível, porque MERIT é justamente o tipo que não
reduz nada. Rodar o classificador de novo achou **47 das 153 pautas com voto
erradas**.

| tipo | peso | pautas | votos |
|---|---|---|---|
| Mérito | 1,0 | 61 | 22.398 |
| Requerimento | 0,3 | 38 | 13.412 |
| Requerimento de urgência | 0,2 | 28 | 10.369 |
| Emenda | 0,7 | 25 | 8.525 |
| Redação final | 1,0 | 1 | 293 |

**Só 30% das votações nominais são decisão de mérito.** O resto é
requerimento, urgência e emenda. Isso não é detalhe: é a diferença entre
"deputado X votou a favor do projeto Y" e "deputado X pediu urgência no
projeto Y", que são fatos completamente distintos sobre o mesmo nome.

Nota recalculada: média 58,4, escala 50–64, dispersão 3,20, 504 com voto
próprio. A escala apertou porque são 11 assuntos — a nota é honesta e
estreita, e estreita é melhor que larga e errada.

### O método se pagou

Cada rodada é mensurável: a auditoria por palavra-chave diz o que errou e
quanto, a correção é uma linha, e a reclassificação mostra o saldo. É o que
falta repetir para os quatro subjects errados.
