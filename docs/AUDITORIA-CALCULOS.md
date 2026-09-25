# Auditoria dos cálculos — o que a nota realmente mede

> Data: **2026-09-25**. Todas as afirmativas aqui foram medidas contra o
> banco de produção, não estimadas. Complementa `REPRODUCIBILITY.md`
> (como recalcular) e `DETECCAO-DESPESAS.md` (método de gasto).
>
> Este documento existe porque a confiança do usuário no critério depende de
> o projeto saber dizer, com honestidade, **o que ele não sabe**.

---

## 1. Resumo em uma frase

**90,8% da variação da nota é explicada pelo partido.** Os 9,2% restantes são
o voto próprio. A nota é, em termos práticos, um identificador de partido com
uma camada fina de individual — e o site apresenta isso como avaliação
individual.

| Medida (513 parlamentares com voto próprio) | Valor |
|---|---|
| Nota média | 63,3 |
| Variância **entre** partidos | 197,6 |
| Variância **dentro** do partido | 20,1 |
| **% da nota explicada pelo partido** | **90,8%** |

Desvio-padrão dentro de cada partido: 3,7 a 5,2 pontos. A média dos partidos
vai de 37,5 (PT) a 78,4 (Republicanos) — 41 pontos de distância.

## 2. De onde vem cada número (o caminho completo)

```
PARTY_ALIGNMENT[partido][critério]   ← tabela hardcoded, 37 partidos × 5
        ↓  + individualNoise(±8)      ← só para desempatar brothers de partido
    seed do critério
        ↓
  + média(applied_score dos votos reais)   ← quando existe voto
  − penalidade de despesa                    ← só em Integridade Moral
        ↓
  clamp 0–100 por critério
        ↓
  nota geral = Σ(critério × peso)
```

O elo fraco é o primeiro: **`PARTY_ALIGNMENT` é uma tabela escrita à mão**
(`scripts/lib/scoring.ts:23-61`), declarada como vinda de "DIAP, FPE, JRN/
Estadão e histórico de votações". Não há fonte auditável por valor, nem
script que a reproduza, nem teste que a valide. Ela é o piso de toda a nota.

## 3. Peso da nota vs. peso do dado

Este é o achado mais grave, e não é de sintaxe — é de desenho:

| Critério | Peso na nota | Pautas | Votos | Parlamentares com voto próprio |
|---|---|---|---|---|
| Proteção à Vida | **30%** | 3 | **0** | **0** |
| Valores Familiares | 25% | 22 | 7.251 | 508 |
| Integridade Moral | 20% | 3 | 359 | 359 |
| Responsabilidade Social | 15% | 55 | 19.250 | 512 |
| Liberdade Religiosa | **10%** | **0** | **0** | **0** |

**40% do peso da nota (Proteção à Vida 30% + Liberdade Religiosa 10%) não tem
um único voto registrado.** Não é que o critério seja ruim — é que ele não tem
base. A "Proteção à Vida", o critério de maior peso, tem 3 pautas e **zero
votos**: o PL 1904/2024 (aborto equiparado a homicídio) aparece 3 vezes no
acervo e nenhuma delas tem votação nominal.

Consequência: 30% da nota de um parlamentar é literalmente o histórico do
partido dele, e o site não diz isso com essas palavras.

## 4. "83 pautas" são 33 assuntos

A mesma proposição é gravada como pauta-chave separada **por sessão de
votação**. O PL 2159/2021 (licenciamento ambiental) aparece **9 vezes**, com
9 `source_id` diferentes e 2.872 votos no total.

| Métrica | Valor |
|---|---|
| Linhas em `key_agendas` | 83 |
| **Assuntos distintos** | **33** |
| Pauta mais repetida | 9 cópias |

Dois problemas, um de exibição e um de cálculo:

1. **Exibição:** a página de um tema mostra o mesmo projeto várias vezes, e o
   site anuncia "83 pautas monitoradas" quando são 33 temas de debate.
2. **Cálculo — este é o mais sério:** `avgDelta` faz média de `applied_score`
   **por linha de voto**, não por assunto distinto. Um parlamentar que votou
   9 vezes no mesmo licenciamento ambiental tem aquele projeto ponderado 9x
   em relação a outro sobre o qual votou uma vez. A média está medindo
   *quantas vezes o projeto foi voting*, não *em que o parlamentar votou*.

Isso também ajuda a explicar o caso do topo da lista: o parlamentar com
maior nota tem **5 votos no total** e notas 100 em Valores Familiares e
Responsabilidade Social.

## 5. Base de_estimativa: 29,7% do Aquieta

| Situação | Parlamentares |
|---|---|
| Com nota | 730 |
| Com voto próprio | 513 |
| **Só estimativa de partido** | **217 (29,7%)** |
| Com menos de 10 votos | 27 |

Para esses 217, a nota é o seed do partido + ruído. O site sinaliza isso na
aba "Desempenho" do perfil, o que é correto — mas a nota aparece no ranking,
nos cards e nas comparações com o mesmo peso visual de uma nota medida.

## 6. O que está certo e deve ser preservado

Nem tudo é problema. Estes acertos sustentam a credibilidade:

- **Média, não soma** nos votos (corrigido 2026-09-08). Soma saturaria em 0 ou
  100 por volume de votação.
- **Penalidade de despesa proporcional** (corrigido 2026-09-25), sem
  saturação: 31 dos 174 parlamentares com despesa saturavam na fórmula antiga.
- **Ausência de dado nunca vira penalidade** nem nota máxima.
- **Presunção de inocência** declarada: sem despesa analisada, Integridade
  Moral não é penalizada.
- **Rótulos neutros** de desempenho (os rótulos morais antigos foram
  neutralizados por decisão editorial).
- **`SCAN_RULES_VERSION` e `EXPENSE_RULES_VERSION`** versionados, com regra
  de$data única e reclassificação coerente.
- **Auditoria de regras descartadas** com taxa de falso positivo medida
  (`DETECCAO-DESPESAS.md` §4).
- **O site se nega a afirmar o que não sabe**: "não é ficha limpa", "zero
  honesto > número fabricado", errata pública.

## 7. Melhorias, em ordem de impacto na confiança

### P0 — publicar o que já se sabe (barato, alto impacto)

1. **Dizer que 40% do peso é seed.** Em `/metodologia` e no perfil, mostrar
   para cada critério: peso, quantas pautas, quantos votos, e se a nota veio
   de voto ou de party. O dado já existe (`votesPerCriteria` está no payload).
2. **Contar distintamente.** Trocar "83 pautas" por "33 assuntos, 83
   sessões de votação", ou agregar por proposição na exibição.
3. **Dividir o ranking em "medido" e "estimado".** Os 217 por estimativa
   não devem compete lado a lado com os 513 medidos sem aviso.
4. **Explicar a média por assunto.** Dizer "média de 12 assuntos" em vez de
   "12 votos", porque são 12 assuntos com pesos desiguais hoje.

### P1 — corrigir o desenho (médio custo, alto impacto)

5. **Média por assunto distinto, não por linha de voto.** Cada proposição
   entra uma vez na média do parlamentar, com peso igual. Isso remove a
   distorção da §4 e é a correção metodológica mais importante da lista.
6. **Separar `KeyAgenda` de `VotingSession`.** Hoje a tabela guarda as duas
   coisas. Separar elimina a duplicata na raiz e permite contar assuntos.
7. **Reequilibrar pesos pelo dado disponível** ou, se blindagem continuar sem
   voto nominal, **declarar na nota** que o critério éestimativa integral.
8. **Procurar o dado que falta para Proteção à Vida.** A 57ª legislatura
  dúvida sobre o aborto foi levada ao Plenário; se não há votação nominal, o
   critério de 30% precisa de outra fonte ou de outro peso.

### P2 — confidence-building (contínuo)

9. Teste que extraia pesos e keywords do código e falhe se o texto
   publicado divergir (o próprio ROADMAP já registra essa falta).
10. `PARTY_ALIGNMENT` com fonte por valor, ou substituta derivação dela de
    voto real.

## 8. O que NÃO recomendo

- **Remover o seed de partido.** Sem ele, quem não votou muito fica sem nota
  alguma, e a comparabilidade entre legislaturas se perde. O problema é ele
  ser invisível, não existir.
- **Rebaixar o peso de Proteção à Vida sem antes buscar o dado.** Trocar um
  peso arbitrário por outro arbitrário não melhora nada.
- **Criar um índice de "nota de adherência real" separado.** Duas notas
  competindo no mesmo ranking confundem mais do que ajudam. Uma nota, com a
  origem declarada, é mais honesta.

Ver também `DECISOES.md` para o histórico destas correções e
`REPRODUCIBILITY.md` §4 para a fórmula executada.

---

## 9. Educação e comissões — o que a medição mostrou (2026-09-25)

Pergunta: vale a pena varrer comissões para habilitar educação (e as outras
pautas acumuladas)?

### 9.1 O que foi medido

| Verificação | Resultado |
|---|---|
| `/orgaos/{id}/votacoes` em 12 comissões (CE, CCJC, CDC…) | **0 votações** em todas |
| 600 órgãos legislativeis na API; 599 fora do Plenário | endpoint existe mas não tem dado de comissão |
| 277 votações em `/proposicoes/{id}/votacoes` (6 temas) | 39 com contagem "Sim:" (voto individual) — **todas marcadas `[PLEN]`** |
| `idVotacao` + `ordemVotacao` (voto posicional) | **0** de 277 |
| `/deputados/{id}/proposicoes` (autorias) | **HTTP 405** — não existe nesta versão da API |
| `/proposicoes?keywords=educacao` | funciona, mas a resposta **não traz autor** |
| `/proposicoes/{id}/autores` | **funciona** — nome do deputado, `tipo`, flag `proponente` |

### 9.2 Resposta: não vale, e não por dificuldade — o dado não existe

Votação de comissão no Brasil é registrada em **ata** (ata da reunião da
comissão), em texto, publicada no portal de cada comissão. A API da Câmara
**não expõe voto individual de comissão em formato estruturado** — não é
falta de varredura, é ausência do dado. A 57ª legislatura, a maior parte dos
projetos de educação morre na comissão e nunca chega ao Plenário com
votação nominal. Por isso o acervo tem **zero** pautas de educação, e
adicionar palavra-chave não muda nada: produziria um critério com 0 voto.

Buscar esse dado exigiria baixar e interpretar atas em PDF, comissão por
comissão, com OCR e parsing de texto livre. É um projeto de outra ordem, com
fragilidade alta e sem garantia de que a ata liste quem votou como (muitas
atas registram apenas o resultado). **Não recomendo.**

### 9.3 O que existe e é melhor: autoria de proposições

`/proposicoes/{id}/autores` devolve, para cada proposição, os deputados
autores com nome e indicação de quem é o proponente. Isso habilita um sinal
**realmente individual, auditável e disponível**:

> **"O que este parlamentar PROPÕE"** — quantos projetos sobre educação,
> meio ambiente, segurança ou tecnologia ele autorou, em que situação estão
> (tramitando, aprovado, arquivado, rejeitado) e com que texto.

Diferenças em relação a voto, e vale ser explícito sobre elas:

| | Voto | Autoria |
|---|---|---|
| Mede | posição frente ao tema | iniciativa no tema |
| Ativo | quem mais vota acaba sendo medido mais | quem mais propõe é medido mais |
| Volume | inflado por sessão repetida (ver §4) | 1 proposição = 1 autoria |
|_available_ | só Plenário com votação nominal | qualquer proposição, independente de tramitação |
| Risco de leitura | "votou contra" parece juízo moral | "propôs" é fato declarável e checável |

Autoria é **fato objetivo**, não posicionamento. Isso a torna mais defensável
que voto para construir confiança — e o usuário pode abrir o projeto e ler.

### 9.4 Plano em fases

**Fase 1 — piloto de mensuração (sem produto).** Escolher 3 temas
(educação, meio ambiente, segurança pública). Para cada um, puxar
`/proposicoes?keywords=X`, filtrar por relevance, e chamar `/autores` em cada
proposição. Medir: quantas proposições por tema, quantos deputados com ao
menos uma autoria, e a distribuição. **Critério de avanço:** se menos de
~40 deputados tiverem autoria em algum tema, o sinal não sustenta página e
a fase para aqui. Custo estimado: algumas centenas de chamadas, ~1h de
script, rodável fora do cron.

**Fase 2 — camada de autoria no modelo.** Tabela `proposition_authorship`
(parlamentar, proposição, tema, situação, é_proponente) + sync próprio,
reaproveitando a fonte única de tema. Publicar CSV em `/dados` junto dos
votos, para o mesmo critério de auditabilidade que já existe.

**Fase 3 — página "O que propôs" no perfil.** Aba ao lado de "Gastos",
separada de "Votações" e explicitamente rotulada como autoria, não como
posição. Sem efeito na nota — autoria não é alinhamento de valores.

**Fase 4 (opcional, só se a fase 1 render) — reavaliar a nota.** Aqui sim
seria possível dar ao tema um peso real, porque agora existiria dado
individual. Mas isso é decisão de produto, não de engenharia, e só depois de
medir.

### 9.5 O que NÃO fazer

- **Não** mapear educação em RESPONSABILIDADE_SOCIAL sem dado: produziria
  um critério inflado artificialmente na maior fatia de pautas (55 de 83).
- **Não** criar um "score de iniciativa" somando autoria à nota. Mistura
  iniciativa com alinhamento de valores, e o site perde a coerência
  conceitual que sustenta sua credibilidade.
- **Não** parsear atas. Custo alto, garantia baixa, e o sinal seria menos
  confiável que a autoria que já está disponível.
