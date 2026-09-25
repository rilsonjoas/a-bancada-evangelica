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
