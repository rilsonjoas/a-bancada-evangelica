# Log de decisões — registro do que se decidiu e por quê

> Cada entrada: o que foi decidido, as alternativas descartadas (com o
> motivo), e como verificar. Complementa `REPRODUCIBILITY.md` (como
> recalcular) e `DETECCAO-DESPESAS.md` (método de despesa).
>
> Convenção: uma decisão só entra aqui depois de **medida**, nunca de
> estimada. "Acho que funciona" não entra.

---

## 2026-09-25 — Detecção de despesa fora do padrão

**Origem**: comentário de usuário dizendo que o critério de gasto deveria
usar mediana em vez de média, porque "um outlier grande distorce o corte
pra todo mundo".

### O que a sugestão estava certa — e o que o diagnóstico tinha errado

A intuição era boa; o diagnóstico não correspondia ao código. **Não existia
média nenhuma** definindo o corte — eram três constantes literais
(`> 50.000`, `> 0` glosa, sem CNPJ), aplicadas uma a uma sem comparar com o
conjunto. E a média simples que existia de verdade
(`recalculate-scores.ts`, `avgSuspicion`) só pesava `× 0,1` dentro de um
teto de 25 pontos: um outlier máximo movia a nota em 0,65 ponto.

O defeito real era outro, e maior: as regras **não detectavam nada** —
23 marcas em 74.336 despesas (0,03%).

**Decisões e alternativas:**

| # | Decidido | Descartado | Motivo |
|---|---|---|---|
| D1 | Penalidade **proporcional** à % de despesas fora do padrão | `nº_suspeitas × 3` (o que existia) | Punia volume, não gravidade. 31 de 174 (18%) saturavam no teto de 25 — o mesmo defeito de saturação já corrigido na média dos votos em 2026-09-08 |
| D2 | **Lista** das despesas marcadas, com link para o recibo oficial | Só agregados | 41.855 despesas (56%) têm `document_url` e 100% têm `supplier_name`. O site afirmava uma diferença estatística sem dar como conferir — incompatível com a tese de auditabilidade |
| D3 | **Remover** o "Medidor de Integridade" da aba de gastos | Manter renomeado | Ele mostra `moral_integrity` (critério de valores, majoritariamente seed do partido) com a legenda dizendo que "resume o quanto as **despesas** seguem o padrão". Afirmação falsa. O critério já aparece em "Visão Geral" |
| D4 | Cor por **% fora do padrão**; remover a escala 0–100 do gráfico | Manter as duas fontes | A escala dizia "100 = Excelente" (nota alta = bom) enquanto a cor vinha de `suspiciousPct` (alto = ruim): um parlamentar com 85/100 renderizava **barra vermelha**. Duas leituras contraditórias na mesma tela |
| D6 | Selo **"sem dados de despesa"** nos 174→730 sem cobertura | Esconder a aba / nada | Só 174 dos 730 têm despesa. Sem o selo, ausência de dado parece gasto normal |
| D7 | **Reaproveitar** `expense-analyzer.ts`, não remover | Apagar o arquivo | Descartado após leitura: o arquivo tem a agregação mensal e uma fórmula de integridade **por proporção** que é exatamente a abordagem do D1 — só nunca foi ligado. Teria sido erro jogar fora |

### 4 das 7 regras do analyzer foram descartadas por medição

| Regra | Aciona em | Veredito |
|---|---|---|
| R4 concentração de fornecedor | 116/174 = 67% | ruído |
| R5 frequência alta | 98/174 = 56% | ruído |
| R6 padrão temporal | 0/174 = 0% | morta |
| R7 valores redondos | 2/174 = 1% | mantida |

> O motivo histórico de o analyzer nunca ter entrado no cron está
> provavelmente aqui: ligado como estava, teria marcado 67% de todos os
> parlamentares numa rodada.

### Bugs encontrados e corrigidos no caminho

1. **Vazamento de pool entre categorias** (em `computeBaselines`) — o loop
   interno percorria todos os buckets sem filtrar pela categoria, então uma
   categoria com 25 despesas recebia baseline com n = 2.746 e mediana
   R$ 1.490 em vez de R$ 28.000. Só apareceu ao rodar contra os dados reais;
   os testes passavam porque usavam uma categoria só. Teste de regressão
   adicionado.
2. **Mensagem inflando evidência** — dizia "muito acima do padrão" para
   qualquer valor acima do p99, inclusive 1,5x o p99. Reescrita para factual.
3. **Percentual invertido na mensagem** — `p99` é o quantil, mas o texto
   imprimia "Entre as 99% despesas mais caras" em vez de 1%.
4. **Teste flaky** — o fixture da distribuição de táxi usava `Math.random()`
   e a asserção mudava de resultado entre rodadas. Substituído por
   determinístico.

### Onde isso está

- Regras: `scripts/lib/expense-rules.ts` (fonte única, versionada)
- Backfill com corte robusto: `scripts/recalc-expense-flags.ts`
  (`--dry-run`, snapshot de rollback, log em `sync_logs`)
- Testes: `scripts/__tests__/expense-rules.test.ts` (26)
- Método e limites: `DETECCAO-DESPESAS.md`

---

## 2026-09-25 — Temas Legislation e descoberta

**Origem**: segundo comentário do mesmo usuário — "deveria ter questões
também sobre educação e meio ambiente, pra mim pautas fundamentais".

### Meio ambiente já existia, como tema — e era invisível

`meio-ambiente-energia` estava no catálogo com 36 pautas, mas `/temas` não
estava na navegação principal (só no rodapé) e a busca da navbar só
consultava nome de parlamentar. Digitar "meio ambiente" não retornava nada
mesmo com a página existente. Por isso a impressão de que o tema não existia.

**Decidido:** `/temas` entra na navegação principal (desktop e mobile) e a
busca passa a casar com o catálogo de temas, incluindo por slug com hífen
("meio-ambiente", o que o usuário digita depois de copiar a URL).

### Educação: bloqueada estruturalmente, e isso é um achado

Não é falta de dado: a base tem **83 pautas-chave e zero sobre educação**.
`SCAN_RULES` classifica pautas nos 5 critérios por palavra-chave, e educação
não tem palavra-chave em regra nenhuma — logo nunca é capturada. O zero é a
saída esperada do pipeline atual.

Três saídas possíveis, todas com custo real:

| Opção | Custo |
|---|---|
| Mapear educação em RESPONSABILIDADE_SOCIAL | Mexe no score desse critério (o maior, 55 pautas) e **move o ranking** |
| Caminho só-tema (`criteria` nulo, scoring ignora) | Exige migration; não distorce nota |
| Deixar fora | Não atende o pedido |

**Decidido pelo Rilson: opção 1** (mapear em RESPONSABILITY_SOCIAL). É uma
afirmação defensável — educação como responsabilidade social — e
documentada como tal. **Consequência aceita:** o ranking muda e os números
declarados em README e `/metodologia` precisam ser re-verificados e
corrigidos, com entrada na `/errata` se divergirem.

**Pré-condição antes de publicar:** medir se existem pautas de educação que
chegaram ao Plenário com votação nominal registrada. Sem elas o
critério fica com zero voto, que é pior do que não existir. **Não publicar
critério com 0 votos.**

---

## 2026-09-25 — Números fixos no README

Observação do Rilson: os números da página inicial não deveriam mudar
sozinhos, e o README não deveria ter número fixo.

- **Home: já é automático.** Os números vêm de `stats` na API
  (`Ranking.tsx:313-325`) e o painel exibe "Dados de {data} atualizados em
  {timestamp}". Não há número fixo na home. Nada a fazer.
- **`/metodologia`: correto como está.** Os números de auditoria ali
  (208 membros, 207 corretos) são um registro datado ("Auditoria base: 25 de
  agosto de 2026") — histórico, não variável. Devem continuar fixos.
- **README: era o único lugar com número fixo desatualizado** — 595
  parlamentares (a API devolve 730), 209 FPE, 26.860 votos, média 63,1.
  Ironia: o próprio `REPRODUCIBILITY.md` §7.3 diz para não tratar número
  como fixo e para não duplicar contagem entre documentos.

**Decidido:** manter os números no README (dão escala ao leitor que chega
pelo GitHub) com **carimbo de data e fonte**, marcados como snapshot, e
remeter o número vigente ao site. Apagar todos deixaria o README vago sem
resolver o problema real, que é *detectar* divergência.

---

## 2026-09-25 — Auditoria geral dos cálculos

Pedido do Rilson: "eles precisam ter realmente confiança em nossos critérios
e em como tudo funciona". Auditoria completa em `docs/AUDITORIA-CALCULOS.md`.

### Os quatro achados que mudam a conversa

1. **90,8% da variância da nota é explicada pelo partido** (variance entre
   partidos 197,6 vs dentro 20,1, n=513 com voto próprio). A nota é
   essencialmente um identificador de partido com camada fina individual.
2. **40% do peso não tem um único voto.** Proteção à Vida (30%) tem 3 pautas e
   0 votos; Liberdade Religiosa (10%) tem 0 pautas e 0 votos. Ambas são 100%
   seed de partido.
3. **"83 pautas" são 33 assuntos.** A mesma proposição é gravada por sessão
   de votação (até 9x) e a `avgDelta` pesa por linha de voto — então um
   projeto repetido pesa 9x outro.
4. **29,7% dos parlamentares (217) só têm estimativa de partido.**

### O que ficou registrado, não implementado

- Pautas acumuladas (meio ambiente, tecnologia, PEC da blindagem, outras
  PECs) → `ROADMAP.md`, seção "Pautas acumuladas". **Nada foi implementado**,
  conforme pedido explícito.
- Correções metodológicas pendentes → `ROADMAP.md`, com ordem sugerida.
- Educação: varredura de comissões **descartada por medição** (o dado não
  existe em formato estruturado). Plano alternativo com autoria de
  proposições, em 4 fases, começando por um piloto de medição.

---

## 2026-09-25 — Peso do voto individual sobre o partido (M0–M5)

Pedido do Rilson: *"prefiro que o posicionamento pessoal do congressista
valha bem mais que o partido, bem mais mesmo."*

### A intuição está certa, e a causa é aritmética

A nota é 91,8% partido porque `nota = seed + delta` onde o seed tem
amplitude ~70 pontos e o delta tem 24. O voto não pesa pouco — o outro
termo é enorme. E o dado não é escasso: mediana de 7 assuntos por
critério, 72% com 5 ou mais.

### Simulação medida antes de codar (acervo real, 504 parlamentares)

| Cenário | voto × | seed | % partido |
|---|---|---|---|
| hoje | ×1 | 100% | 91,8% |
| dobrar voto sozinho | ×2 | 100% | 88,0% |
| dobrar + seed 50% | ×2 | 50% | 61,9% |
| **M1c triplicar + seed 50%** | ×3 | 50% | **49,4%** |
| triplicar + seed 30% | ×3 | 30% | 23,5% |
| triplicar + seed 30% + confiança | ×3 | 30% | 44,6% |

Duas conclusões que mudaram a ordem de execução:

1. **Dobrar o voto sozinho quase não faz nada** (91,8% → 88,0%). As duas
   alavancas precisam andar juntas.
2. **Confiança subtrai** quando o seed já está encolhido (23,5% → 44,6%).
   Encolher o seed dá mais peso ao voto, e voto de 1 assunto é ruído. Por
   isso M2 entra **depois** de M1c, medida isolada — somar as duas
   alavancas às cegas empurraria a variância de volta pro partido.

### Alvo escolhido

**M1c: voto ×3 + seed a 50%** → 49,4%. O voto passa a ser metade da nota,
o partido continua pesando (não vira score individual puro) e a
reprodutibilidade do guia continua válida com seed documentado.

### M3 — consistência com peso (o Rilson escolheu (b))

Consistência já era calculada e não pesava em nada. É o sinal mais
individual que existe. Entra na nota com peso modesto.

### Sem errata, e tudo junto

Decisão do Rilson: projeto novo, nada divulgado a público geral, errata
agora seria teatro. Ordem: código → teste → verificação → só então
`/metodologia` e demais textos. **Nunca fórmula nova com texto velho** —
seria exatamente o problema que o teste de consistência existe para evitar.

### Requisito de aceitação

Cada mudança entra com a explicação ao usuário, em linguagem leiga, de onde
veio cada ponto da nota dele. Tabela de obrigação em
`PLANO-PESO-INDIVIDUAL.md` §4. Não é nota de rodapé: é critério de
aceitação.

Plano completo: `PLANO-PESO-INDIVIDUAL.md`. Execução: `ROADMAP.md`,
seção "Peso do voto individual vs. partido (M0–M5)".

## 2026-09-26 — Congelar os números durante a recalibração (M4)

**Situação.** A fórmula está sendo recalibrada (M1c–M5). O `NUMBERS_FROZEN`
em `src/lib/release-state.ts` substitui os quatro números agregados da home
(730 monitorados, 513 com voto próprio, 62,75 de média, 291 de aderência
muito alta) por um aviso explicando o motivo.

**Alternativas descartadas.**

| Opção | Por que não |
|---|---|
| Congelar a página inteira | O ranking e cada perfil continuam válidos e verificáveis. Tirar tudo não protege nada. |
| Mostrar o número novo com o texto velho | É exatamente a incoerência que a auditoria encontrou. Pior que não mostrar. |
| Congelar só no banco | Congelar no banco impede a recalibração, que é o trabalho. Congela-se a exibição. |

**Como reverter.** `NUMBERS_FROZEN = false`, no mesmo commit que atualizar
`/metodologia` e o README. O arquivo não tem outra dependência.

**Por que M4 traz texto no mesmo commit.** Decomposição visual sem a
explicação é um número bonito que o usuário não entende de onde veio — e
entender de onde veio é o problema do projeto. O texto da fórmula e a
correção das afirmações falsas entraram aqui, não depois.

## 2026-09-26 — Declinar de medidas que não temos (Integridade Moral)

A `/metodologia` afirmava "histórico de processos judiciais, investigações
por corrupção ou improbidade". A auditoria confirmou que não existe
integração com STF, MP, TCU, CPI ou Conselho de Ética.

**Decisão.** Descrever só o que é medido (uso da cota parlamentar) e dizer
explicitamente que processos e investigações não são usados e por quê.

**Alternativas descartadas.**

| Opção | Por que não |
|---|---|
| Apagar o trecho sem explicar | O usuário que já leu a afirmação falso não sabe que ela foi removida. |
| Integrar STF/MP agora | Fonte, escopo legal e taxa de acerto de identificação não existem no projeto. Seria um produto novo, não uma correção. |
| Manter com "parcialmente" | Não existe medição parcial. Ou mede, ou não mede. |

Os indicadores de Integridade Moral também foram trocados: eram 4 frases
sobre investigações e conduta pública, e passaram a descrever as quatro
regras de despesa que o código realmente executa.

## 2026-09-26 — A decomposição é gravada, não calculada na leitura

`score_breakdown` é escrito pelo `recalculate-scores.ts` no mesmo passo que
a nota, e não é recalculado pela API na hora de ler.

**Por quê.** Se a fórmula mudar, um componente recomputado na leitura
passaria a divergir da nota gravada — e o painel mostraria as contas de uma
fórmula com o resultado de outra. O erro seria silencioso e plausível, que é
o pior tipo.

**Consequência aceita.** A decomposição só existe depois do primeiro
recálculo pós-M4, e o painel mostra um estado vazio honesto antes disso
("ainda não foi registrada"), em vez de esconder a ausência.

## 2026-09-26 — A soma não fecha em centésimos, e dizemos isso

`clampScore` arredonda a soma para inteiro; os componentes são exibidos com
uma casa. Um caso real do banco: 50 − 11,8 = 38,2, e a nota publicada é 38.

**Decisão.** Mostrar a nota final como inteiro (é o que ela é) e escrever
que a soma é arredondada ao ponto inteiro.

**Alternativas descartadas.**

| Opção | Por que não |
|---|---|
| Mostrar "38,2" na tabela | Falso. A nota gravada é 38. |
| Ajustar o seed para a conta fechar | Falsifica o componente. O seed é o que é. |
| Não mostrar casas decimais em tudo | Perde informação real: 11,8 de penalidade é o dado que o usuário quer. |

## 2026-09-26 — O teste gigante (Fase 1 do PLANO-CONSISTENCIA)

`src/__tests__/consistencia-publica.test.ts` — 29 testes que falham quando a
página mente. Substitui "teste por critério" por **teste por afirmação
publicada**: o que o texto diz tem que bater com o que o código faz.

**Regra de desenho que vale mais que cada teste.** O arquivo NÃO exige que
todo indicador vire medido — isso é decisão de produto. Exige
**explicitude**: todo indicador sem medição tem que estar declarado em
`INDICADORS_NAO_MEDIDOS`. Publicar indicador sem lastro continua sendo erro;
o que muda é que agora ele é *conhecido* e versionado, e a lista só encolhe.

**Os seis problemas reais que ele achou no primeiro rodar** (todos
corrigidos no mesmo commit):

| # | Achado | Correção |
|---|---|---|
| 1 | `expect(valor, mensagem)` não é suportado nesta versão do Vitest — a mensagem virava o valor medido e quebrava `toBeGreaterThan` | Reescrito sem o segundo argumento |
| 2 | O splitter de frase quebrava por linha, e uma negação partida em duas virava "promessa" de processo judicial | Colapsa whitespace antes de quebrar em frase |
| 3 | A extração comparava `moralIntegrity` com `MORAL_INTEGRITY` — o underscore fazia 4 indicadores **medidos** aparecerem como não medidos | Normaliza sem underscore |
| 4 | O teste de peso procurava a chave do enum, mas a doc escreve o rótulo | Casa pelo rótulo |
| 5 | A checagem de versão acusava a doc errada de defasamento | Cada regra aponta para o seu doc |
| 6 | 4 indicadores prometiam "pro-vida", "proteção a infância", "posicionamentos públicos" e "assistência a carentes" — nenhum casava com keyword, e "posicionamentos públicos" prometia leitura de discurso que o sistema não faz | Reescritos nos termos que o código mede de fato |

**Achados de conteúdo que sobraram e foram corrigidos na página:** os
indicadores de Proteção à Vida e Valores Familiares eram vagos ou
inexistentes como medição. Dizer "Votações sobreprojects pró-vida" não é
mentira, mas é inútil: o usuário não descobre o que é procurado. Agora cada
indicador nomeia o termo que o `SCAN_RULES` casa.

**Regra geral sobre termo proibido:** termo dentro de crase é citação, não
promessa. `ficha limpa` numa tabela que lista as keywords do `SCAN_RULES` é o
registro do que o código busca — o oposto de prometer checagem de ficha limpa.

**Autoteste (1.6).** Um teste de texto proibido que absolve tudo não protege
nada. A seção 1.6 prova que a allowlist absolve uma negativa e **não**
absolve uma promessa, que o splitter acha frases, e que o normalizador tira
acento. Se a regra de detecção quebrar, o 1.6 falha antes de o 1.5 virar
falso-verde.

## 2026-09-26 — M1c: seed a 20%, não 50% (a meta do plano não era alcançável no 50%)

Medido nos 504 parlamentares com voto real, com a confiança do M2 já dentro:

| `SEED_SHRINK` | % da variância que é partido |
|---|---|
| 0,40 | 74,7% |
| 0,30 | 63,4% |
| 0,25 | 54,3% |
| **0,20** | **37,6%** *(medido em produção)* |

O plano chutava 0,5 e prometia 49,4%. **O chute errava**: no dado real, 0,5
dá 58%. A simulação do plano não tinha o ruído individual (±8) nem a
penalidade de despesa.

**Por que 0,20 e não 0,25.** O pedido foi o voto próprio pesar *mais* que o
partido. 0,25 deixa o partido na maioria (54,3%). 0,20 entrega 58,4% da
variação dentro do partido, que é o pedido. A ordem entre os partidos
continua preservada — só a distância entre eles diminuiu.

**O que M2 custou.** A confiança (que encolhe o voto de quem tem pouco) joga
contra o M1c na métrica de variância partidária: sozinha ela empurra de 46,8%
para 74,7%. As duas metas não podem ser persiguitas com o mesmo número, e a
resposta foi compensar o `SEED_SHRINK`, não escolher uma das duas.

Medido em produção depois do recálculo: **37,6%** (a simulação previa 41,6%).

## 2026-09-26 — M3: a "consistência" media a coisa errada

A coluna `consistency_score` media
`(votos com applied_score ≠ 0) / (total de votos)` — ou seja, **cobertura
de dado**: "das minhas votações, quantas caíram num tema que pontuamos?".
É uma pergunta sobre o nosso cadastro, não sobre a pessoa. O nome prometia
coerência entre assuntos; a fórmula media outra coisa. Mesma classe de erro
do "histórico de processos judiciais" na metodologia: **rótulo que promete
mais que o dado.**

**Decisão.** Passa a medir posição — taxa de votos alinhados sobre os
votações pontuadas — e entra na nota com ±3 pontos, escalados por
`min(1, votos/10)`. Um voto só rende +0,3 de 100: ruído, não sinal.

**Alternativas descartadas.**

| Opção | Por que não |
|---|---|
| Deixar como estava, só corrigir o texto | O texto mentia para o lado fácil; o dado continuava errado. |
| Premiar coerência *com o partido* | Iria na direção oposta ao pedido: reforçaria a herança partidária que o M1c existe para reduzir. |
| Peso forte na consistência | Coerência é sinal fraco. Peso forte é inventar precisão — e o usuário pediu "modesto". |

## 2026-09-26 — M5 recusado: derivar `PARTY_ALIGNMENT` dos votos

O plano previa derivar a tabela de alinhamento por partido dos votos reais.
Medi antes de decidir, três abordagens, todas ruins:

1. **Média ingênua do `applied_score` normalizado** → **PT 83,9 em Valores
   Familiares**, acima de REPUBLICANOS (61,9). Não é erro de conta: as
   pautas de família são dominadas por projetos de proteção à infância, em que
   quase todo mundo vota junto. "Conservador" e "esteve presente" viram a
   mesma coisa.
2. **Desvio em relação à média da câmara** → PSOL em 265 em Integridade
   Moral, e sete partidos batendo exatamente −90,4 (votaram igual na única
   pauta que existe naquele critério).
3. **Amostra por partido** → Integridade Moral tem 359 votos para 20
   partidos: ~18 por partido.

**Decisão: M5 não entra.** A tabela permanece, e a `/metodologia` passou a
dizer que é **estimativa editorial** — que é a verdade — em vez de citar
fontes que não sustentam cada valor.

**Por que não "deixar para depois".** As três falhas não são falta de
esforço, são falta de dado. Integridade Moral nunca vai ter votos suficientes;
não há versão futura desse código que conserte com os dados de hoje.

**Consequência aceita, e é a maior pendência do projeto:** Proteção à Vida
(30%) e Liberdade Religiosa (10%) não têm pauta-chave nenhuma. São 40% do
peso sem base medida, e agora isso está escrito na página pública.

## 2026-09-26 — Timeout de teste: 5s → 15s

`MatchPage.test.tsx` falhou 1 de 10 rodadas da suíte completa, com 6/6
passando isolado. Timeout de 5s (default) com 24 arquivos em paralelo.

**Decisão:** `testTimeout: 15s` em `vite.config.ts`.

**Alternativa descartada:** marcar o arquivo como lento. Não resolve — o
problema é a máquina de CI, não o teste. Falso vermelho treina a ignorar o
build, e o build é a última coisa que ainda é confiável aqui.
