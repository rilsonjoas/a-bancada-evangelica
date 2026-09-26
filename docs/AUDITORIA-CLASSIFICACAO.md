# Classificação de pautas está errada — 67% dos votos casam por substring

**Data:** 2026-09-26 · **Severidade: P0, site pausing**
**Documento irmão:** `docs/AUDITORIA-VOTACOES.md` (bug de paginação, 29% de cobertura)

Este documento registra o achado mais grave da auditoria. Ele **anula a
premissa** de todo o resto: a nota que o site publica é calculada a partir de
votos classificados no assunto errado.

---

## 1. O achado, em uma linha

A palavra-chave `sus` — pretendendo ser o sistema de saúde — é uma
**substring** da palavra `sustentavel`. Um projeto de
**licenciamento ambiental** foi classificado como "Responsabilidade Social"
porque o texto dele menciona "desenvolvimento sustentável".

## 2. A cadeia exata

1. `scripts/lib/scan-rules.ts` tem a regra
   `{ criteria: 'SOCIAL_RESPONSIBILITY', keywords: ['saude publica', 'sus', 'atendimento a vitimas'] }`.
   `sus` são três letras.

2. `matchScanRule()` normaliza o texto e testa
   `n.includes(k)` — **substring, sem fronteira de palavra**.
   (`scripts/lib/scan-rules.ts:71`)

3. `scripts/sync-votes.ts:212` monta o texto a casar concatenando
   **quatro** campos, entre eles a descrição longa da proposição e o campo
   `keywords` da própria API da Câmara (`sync-votes.ts:103,123`). O texto é
   grande, e qualquer palavra que contenha `sus` dispara.

4. `sustentavel` contém `sus`. `consumo`, `consumidor`, `construcao`,
   `resultado`, `conclusao`, `suspeita`, `suspensao` também.

### 2.1 Prova empírica (PL 2159/2021)

Pauta com mais votos do sistema (2.872):

| | |
|---|---|
| Título real | "PL 2159/2021 — Dispõe sobre o **licenciamento ambiental**…" |
| Critério atribuído | `SOCIAL_RESPONSIBILITY` |
| Keywords que dispararam | `saude publica`, **`sus`**, `atendimento a vitimas` |
| `sus` casa na **ementa**? | **Não** |
| `keywords` da API? | **None** |
| Onde casa, então? | Na descrição da proposição: `ap.descricao` do parecer → "**sustentavel**" (6 ocorrências) |

O PROJECT não é sobre saúde. É sobre licenciamento ambiental, e entrou como
responsabilidade social por causa da sílaba de "sustentável".

## 3. A escala do estrago

| | pautas | votos | % de todos os votos |
|---|---|---|---|
| Classificadas pela regra do `sus` | **52** | **18.104** | **67,4%** |

Os 12 maiores, com o critério que receberam:

| Pauta | Criterio atribuido | Votos |
|---|---|---|
| PL 2159/2021 — licenciamento ambiental | Responsabilidade Social | 2.872 |
| PL 327/2021 — Transição Energética | Responsabilidade Social | 2.814 |
| PL 528/2020 — Lei de Shopping Centers | Responsabilidade Social | 2.469 |
| PL 3899/2012 — Estímulo à Produção | Responsabilidade Social | 2.259 |
| PL 3469/2024 — Código Florestal | Responsabilidade Social | 2.052 |
| PL 5122/2023 — Liquidação de dívida | **Valores Familiares** | 1.632 |
| MPV 1268/2024 — Crédito extraordinário | **Valores Familiares** | 1.447 |
| PL 2920/2023 — Aquisição de Alimentos | **Valores Familiares** | 1.157 |
| PL 2597/2024 — Contratos de seguro privado | **Integridade Moral** | 359 |

## 4. Não é só o `sus`

Outras palavras-chave são ativas dentro de palavras maiores, com o mesmo
mecanismo:

| keyword | dispara dentro de |
|---|---|
| `sus` | sustentável, consumo, consumidor, construção, resultado, conclusão, suspeita, suspensão |
| `familia` | familiar, familiares, família de servidores, família do produtor rural |
| `crianca` | crianças, infância |
| `crenca` | crenças |

E há falsos positivos que **não** são de substring, mas de **sentido
invertido** — a palavra está lá, mas o assunto é outro:

- `MORAL_INTEGRITY` via `prescricao` / `amnistia`: "PL 2597/2024 — normas
  gerais em **contratos de seguro privado**". "Prescrição" (statute of
  limitations) é palavra legítima de direito securitário. A proposição não é
  sobre integridade moral.
- `MORAL_INTEGRITY` via `anistia`: "PL 1536/2024 — concede anistia ao
  pagamento das **parcelas mensais**". Anistia de **dívida**, não política.
- `FAMILY_VALUES` via `familia` em "MPV 1268/2024 — **Abre crédito
  extraordinário**". A palavra família aparece no decreto Orçamentário
  (família de servidores servidores).

## 5. Votos procedurais dentro da nota

Das 830 sessões substantivas que existem:

| tipo | n | % |
|---|---|---|
| Requerimento de retirada | 249 | 30% |
| Mérito | 247 | 29% |
| Emenda | 167 | 20% |
| **Requer urgência** | **159** | **19%** |
| Redação final | 8 | 1% |

**Requer urgência** é procedural: "o projeto entra logo na pauta ou não".
Votar SIM pode ser wanting fechar a pauta, não defender o tema. Ainda assim
entra na nota com peso de voto posicional, como se fosse uma posição sobre
o mérito.

## 6. O que isso invalida

| Afirmação | Estado |
|---|---|
| "A nota reflete o voto do parlamentar" | **Não.** Setenta por cento dos votos está no critério errado. |
| "91% → 37% a party explain a variance" | O cálculo está certo; **a entrada está errada**. A métrica mede a fórmula sobre dados mal classificados. |
| "Responsabilidade Social 15% do peso" | 67% dos votos do sistema foram parar aí, em boa parte por `sus`. |
| "Valores Familiares" (PL 5122 liquidação de dívida) | Não é pauta de família. |
| "Integridade Moral" (contratos de seguro) | Não é pauta de integridade. |

A nota **não** está "um pouco errada" — está errada no assunto da maioria
absoluta dos votos que ela consome.

## 7. Correção proposta (ordem de execução)

### 7.1 Match por fronteira de palavra (imediato, P0)

Trocar `includes` por casar palavra inteira, com acento já normalizado:

```ts
function matchScanRule(text: string): ScanRule | null {
  const n = normalize(text);
  for (const rule of SCAN_RULES) {
    for (const k of rule.keywords) {
      // \b Unicode-aware: com acento já removido, \b funciona para português
      const re = new RegExp(`(?:^|[^a-z0-9])${escapeRe(normalizar(k))}(?:[^a-z0-9]|$)`);
      if (re.test(n)) return rule;
    }
  }
  return null;
}
```

Isso mata `sus` dentro de `sustentavel` e mantém o acerto de `saude publica`.

### 7.2 Corrigir keywords que são ambíguas por sentido (P0)

- `sus` → `sistema unico de saude` e/ou exigir fronteira + contexto
  (ou exigir que `sus` venha acompanhado de "saude"/"publica").
- `prescricao` (moral) → `prescricao penal`, `anistia de repressao` —
  tirar a palavra solta, que é comum em direito.
- `anistia` (moral) → `anistia` só com contexto político.

### 7.3 Teste que impede a volta (P0)

Um teste que, dado o texto real de cada pauta já classificada, verifica se
o critério continua casando. E um teste **negativo**: cada keyword precisa
casar o seu texto de exemplo e **NÃO** casar um texto onde aparece dentro de
outra palavra.

### 7.4 Suspender a nota enquanto não corrigir (P0)

**Números congelados de novo** até a reclassificação rodar. Publicar nota
calculada sobre 67% de voto no critério errado é pior que não publicar
número — é publicar número com cara de dado e conteúdo de chute.

## 8. O que NÃO fazer antes de corrigir

- **Não** implementar a paginação agora. Traz 3x mais dado, mas
  o dado entra errado. Primeiro o classificador, depois o volume.
- **Não** mexer nos pesos. Recalibrar peso sobre dado errado é afinar a
  lente de um telescópio apontado para o lado.

## 9. Ordem de trabalho

1. Corrigir `matchScanRule` para fronteira de palavra + testes. (P0)
2. Congelar os números de novo. (P0)
3. Auditar as 83 pautas já classificadas: quantas sobrevivem ao matcher
   corrigido? (P0)
4. Reclassificar tudo; medir quantos critérios ficam com dado real. (P0)
5. **Só então** decidir o peso de Proteção à Vida / Liberdade Religiosa. (P1)
6. Paginação do sync. (P1)
7. Reavaliar o que é voto de mérito vs procedimental. (P2)
8. Recalibrar a fórmula, se ainda fizer sentido. (P2)

---

## 10. MEDIÇÃO DE SOBREVIVÊNCIA (rodada depois da correção)

Rodado em produção com o classificador corrigido, comparando o critério que o
banco gravou com o que a `SCAN_RULES` 1.1.0 devolve para o título + descrição
armazenados. Script: `scripts/medir-sobrevivencia.ts` (não grava nada).

```
SCAN_RULES 1.1.0 — sobrevivência das pautas

Pautas: 83 | mantem 11 | mudam 7 | sem regra 65
Votos:  26860 total
  mantem o critério ....... 2559 (9.5%)
  mudam ou perdem .......... 24301 (90.5%)
```

**Só 9,5% dos votos do sistema estão no critério certo.**

### 10.1 Maiores mudanças

| votos | de | para | pauta |
|---|---|---|---|
| 419+413+403+397 | FAMILY_VALUES | MORAL_INTEGRITY | PL 5122/2023 — liquidação, anistia e rebate de **dívidas** |
| 414 | SOCIAL_RESPONSIBILITY | SEM REGRA | PDL 171/2026 — Susta efeitos do Decreto 12.887/2026 |
| 406, 379 | FAMILY_VALUES | SEM REGRA | PL 2920/2023 — Programa de Aquisição de Alimentos |
| 402 | FAMILY_VALUES | SEM REGRA | PL 6461/2019 — Estatuto do Aprendiz |
| 390, 382, 381, 377 | SOCIAL_RESPONSIBILITY | SEM REGRA | PL 3899/2012 — Estímulo à Produção |
| 382 | SOCIAL_RESPONSIBILITY | SEM REGRA | PLP 233/2023 — Seguro Obrigatório |
| 380 | SOCIAL_RESPONSIBILITY | SEM REGRA | PDL 65/2023 — Susta efeitos de Resolução |
| 376 | SOCIAL_RESPONSIBILITY | SEM REGRA | PL 528/2020 — Lei dos Shopping Centers |

### 10.2 Ressalva honesta desta medição

O sync casa contra **quatro** campos concatenados (descrição da votação,
descrição da proposição, ementa e `keywords` da API), mas no banco só
sobrevive **título + descrição**. A medição de 9,5% é, portanto, um **piso
otimista**: com o texto completo, parte das 65 pautas "sem regra" poderia
casar de novo — e parte delas casaria **errado** de novo, que é o problema
que estamos corrigindo.

Ainda assim, a direção é inequívoca: das 83 pautas, só 11 continuam no
mesmo critério, e a maior parte do acervo perde classificação por completo.
Não é ruído de medição; é o dado.

## 11. Estado do site até a reclasificación

`NUMBERS_FROZEN = true` (segunda vez, motivo novo). A nota é o produto: um
número com cara de medição, calculado sobre 9,5% de dado correto, convence
mais do que informa — e é exatamente o oposto do propósito do site.

---

## 12. Correção de um número meu (13,8%, não 9,5%)

A medição da §10 estava **subestimada por um bug no meu próprio script**. Eu
mapeava `SOCIAL_RESPONSIBILITY` para `'SOCIAL_RESP'` — que não existe no
enum `CriteriaType`. Duas consequências:

- ao gravar, o Prisma rejeitava com `Expected CriteriaType`;
- na medição, **toda pauta SOCIAL que continuava SOCIAL era contada como
  "mudou de critério"**, porque `'SOCIAL_RESP' !== 'SOCIAL_RESPONSIBILITY'`.

`matchScanRule` já devolve o valor do enum. Mapeamento não era necessário.
Corrigido (commit `5e408bf`).

**Medição corrigida, com `SCAN_RULES` 1.2.0:**

```
Pautas: 83 | mantem 14 | mudam 0 | deixam de casar 69
Votos:  26860
  mantem ............ 3705 (13.8%)
  mudam de criterio . 0 (0.0%)
  param de contar ... 23155 (86.2%)
```

O 9,5% que reportei antes era pessimista. E o "muda de critério" era **zero**:
toda pauta que ainda casa, continua no mesmo critério. Nenhuma realoca — só
69 deixam de contar. Reclassificação aplicada em 2026-09-26.

## 13. O que restou de dado medido, por critério

| Critério | peso | pautas | votos | parlamentares com voto |
|---|---|---|---|---|
| Valores Familiares | 25% | 7 | 2.559 | 468 |
| Responsabilidade Social | 15% | 3 | 1.146 | 487 |
| **Integridade Moral** | **20%** | **0** | **0** | — |
| **Proteção à Vida** | **30%** | **0** | **0** | — |
| **Liberdade Religiosa** | **10%** | **0** | **0** | — |

**Só 2 dos 5 critérios têm dado medido. 60% do peso da nota (Vida +
Liberdade Religiosa + Moral) ficou sem medição depois da limpeza.**

## 14. Resíduo: palavra inteira ainda não é o bastante

Das 5 proposições que sobreviveram, 4 fazem sentido:

| pauta | critério | voto |
|---|---|---|
| PEC 383/2017 — recursos mínimos para assistência social | Social | 823 ✅ |
| PL 3914/2023 — Estatuto da Criança (Lei 8.069) | Família | 724 ✅ |
| PL 4364/2020 — Política Nacional de Cuidado Integral | Social | 323 ✅ |
| PL 2275/2022 — prevenção e primeiros socorros | Família | 388 ⚠️ |

E uma **não**:

| pauta | critério | voto |
|---|---|---|
| **MPV 1268/2024 — Abre crédito extraordinário** | **Valores Familiares** | **1.447** ❌ |

É um **decreto orçamentário**. Casa `familia` porque o decreto menciona
"família de servidores" — e essa é uma correspondência de PALAVRA INTEIRA,
legítima, que ainda assim é do assunto errado. São 1.447 votos: **39% de todo
o dado que sobreviveu à limpeza**.

**Por que a arquitetura atual não resolve isso.** O sync casa contra quatro
campos concatenados, entre eles a descrição longa da proposição, que é
documento administrativo cheio de palavras de uso geral. Correspondência de
palavra em texto administrativo não separa assunto de vocabulário.

**A correção de raiz, que ainda não foi feita:** casar contra a **ementa**
(objeto oficial da proposição), e não contra descrição administrativa. E
onde a ementa não existe, **não classificar** — em vez de tentar adivinhar.

**Por isso o recálculo de nota NÃO foi rodado.** Com 39% do dado sobrevivente
vindo de um decreto orçamentário, recalcular agora produziria uma nota
correta-em-cima-de-dado-errado — o mesmo erro de ontem, com nome novo.

---

## 15. Estado final do dado medido (após 1.3.0 e reclassificação)

Reclassificação aplicada e nota recalculada. Este é o retrato honesto do que
o site consegue medir hoje.

**Cinco assuntos. Só isso.**

| Critério | peso | assuntos | pautas | votos | parlamentares |
|---|---|---|---|---|---|
| Responsabilidade Social | 15% | 3 | 7 | 2.593 | 501 |
| Valores Familiares | 25% | 2 | 3 | 1.112 | 458 |
| **Integridade Moral** | **20%** | **0** | **0** | **0** | — |
| **Proteção à Vida** | **30%** | **0** | **0** | **0** | — |
| **Liberdade Religiosa** | **10%** | **0** | **0** | **0** | — |

Os cinco assuntos que sobraram:

| critério | assunto | votos |
|---|---|---|
| Social | MPV 1268/2024 — abre crédito extraordinário aos Ministérios | 1.447 |
| Social | PEC 383/2017 — recursos mínimos para assistência social (SUAS) | 823 |
| Família | PL 3914/2023 — Estatuto da Criança: crime de violência patrimonial | 724 |
| Família | PL 2275/2022 — prevenção e primeiros socorros, campanha "Recrutando Anjos" | 388 |
| Social | PL 4364/2020 — Política Nacional de Cuidado Integral (Alzheimer) | 323 |

**60% do peso da nota (Vida 30% + Moral 20% + Liberdade Religiosa 10%) está
sem nenhum dado medido.** E os 40% restantes são sustentados por cinco
assuntos — dos quais **três são dotação orçamentária ou campanha de
prevenção**, que é sinal posicional mais fraco que votação de mérito.

## 16. Party variance com o dado limpo

```
parlamentares com voto: 497
party variance: 50,4%
```

Caiu de 91,3% para 50,4% — mas **esse número não deve ser lido como
"corrigimos a fórmula"**. Ele mede a fórmula sobre um acervo que perdeu 86%
dos votos. A queda de party variance aqui é majoritariamente **perda de
dado**, não um pequeno ajuste de peso.

## 17. Resposta à pergunta original

A pergunta era: "Proteção à Vida e Liberdade Religiosa podem ficar de fora
do cálculo enquanto não tivermos dados relevantes?"

Resposta, agora com dado limpo: **o problema é maior do que esses dois.**

| | |
|---|---|
| Critérios com dado medido | **2 de 5** |
| Assuntos medidos no total | **5** |
| Peso sem dado | **60%** |
| Antes da limpeza (achado de 25/09) | 3 critérios, 33 assuntos, mas 67% deles classificados errado |

Ou seja: a premissa "temos bastante dado, e só dois critérios escaparam" era
falsa. Nunca tivemos. O que a auditoria de ontem encontrou como "40% sem
base medida" era, na verdade, a ponta visível de um acervo em que **86% dos
votos não eram do assunto que o site dizia**.

A decisão de peso agora pode ser tomada sobre dado verdadeiro — e ela
provavelmente será menor, não maior, do que se decidisse com o acervo de
ontem.
