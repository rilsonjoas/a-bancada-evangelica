# História, dificuldades e caminhos

**Escopo deste documento.** O que foi feito no projeto desde a auditoria inicial,
o que quebrou, como foi contornado, e o que fazer da próxima vez. É o registro
que faltava para poder **parar de mexer** sem medo de perder o fio.

**Não é** documentação de uso, nem plano, nem lista de tarefa. Os planos já
existem em `docs/PLANO-*.md`. O histórico de commits está no git. O que segue é
o que **não** está em lugar nenhum: os tropeços, e principalmente os erros de
julgado — inclusive os meus.

---

## 1. O espírito do projeto, e se ele ainda está de pé

Você perguntou se o espírito do projeto ainda está lá. Vou tentar responder de
forma verificável, em vez de dizer que sim.

O README, na seção "Por que isto existe", diz duas coisas que são a bússola:

> "Isso é sobre uma coisa só: verdade sustentada por dado, não por retórica."
>
> "o projeto não existe pra empurrar um partido, existe pra que o voto real
> fique visível."

O espírito, então, nunca foi "nota alta/baixa". É **voto real visível**. A nota é
instrumento, não o fim.

Duas coisas que a auditoria fez e que são o espírito funcionando:

- **O sistema recusou publicar.** Entre 25 e 26/09 os números ficaram congelados
  porque a classificação estava errada. Um projeto que quer aparecer não faz
  isso. Um projeto que quer estar certo faz.
- **Nenhum dos 11 assuntos que sobraram é lixo.** Cada um foi lido, e três
  falsos positivos foram encontrados na última hora (crédito extraordinário
  entrava como política social; uma lei do SUS entrava como integridade moral;
  uma lei ambiental entrava como valores familiares). Isso é o oposto de
  afrouxar para o número ficar bonito.

O que mudou, e é uma mudança real: **o rankeamento deixou de poder se
sustentar só em voto.** Não porque voto seja ruim, mas porque o rol nominal da
Câmara é majoritariamente procedimental e projeto de tema pyssoico morre em
comissão. Isso é um fato sobre o Congresso, não sobre o projeto.

O espírito está de pé. O que está em discussão é **qual dado alimenta a
ordem** — e essa é uma decisão de produto, não uma falha de caráter do projeto.

**Uma ressalva honesta:** o site mudou muito em dois dias, e parte disso foi
comunicação de erro, não constructo. Você tem razão em estranhar. Ver seção 6.

---

## 2. O que foi feito, por fase

Detalhe de cada fase está nos documentos citados. O resumo é para saber o que
existe e não precisa ser refeito.

### 2.1 Fundação que já existia (não toquei)

- Motor de score com versão de fórmula, `score_breakdown`, confiança, bandas.
- Coleta de votos com paginação da API da Câmara.
- Classificação por palavras-chave (`scripts/lib/scan-rules.ts`) — fonte única
  de regras, importada pelo sync da Câmara e do Senado.
- Despesas com detecção de outlier (mediana + MAD + p99), estados explícitos de
  ausência, recibo oficial.
- `GUIA-CURADORIA-DADOS.md` e os `PLANO-*.md`.

### 2.2 Vote quality (D-02) — commits `6ef3972`, `0cdfc53`

Coluna `voteKind` + `voteKindWeight` na pauta, classificador
(`scripts/lib/vote-kind.ts`), backfill e aplicação no motor com multiplicador.

Achado que mudou o entendimento: **61% das votações nominais são
procedimentais** (requerimento, urgência, emenda). A média de peso ficou em
`0,602`.

### 2.3 Correções de classificação — commits em `docs/AUDITORIA-CLASSIFICACAO.md`

Quatro rodadas, cada uma com número antes e depois:

| versão | o que mudou | votos que entravam errados |
|---|---|---|
| 1.1.0 | `sus` passou a respeitar fronteira de palavra | 18.104 (67,4% de todo o acervo) |
| 1.2.0 | exclusões contextuais (anistia de dívida ≠ anistia de crime) | — |
| 1.3.0 | palavra solta `familia` removida | — |
| 1.4.0 | `homicidio` e `crime contra a vida` saíram de Vida | 1.720 |
| 1.5.0 | classificar contra **título + ementa**, não contra a descrição do relator | 1.143 |
| 1.5.0 | crédito extraordinário, Lei 8.080, `crianca` em lei ambiental | 2.938 |

### 2.4 Paginação do acervo — commit `055a970`

Antes, o sync buscava uma única página: **244 de 830** sessões substantivas
(29%). Depois de paginar: **838 sessões, 54.997 votos, 162 pautas**.

### 2.5 Ferramenta de auditoria

`diagnosticarMatch()` devolve **qual palavra casou**, não só o critério. Foi o
que permitiu achar os últimos três falsos positivos sem adivinhar. Antes disso,
corrigir classificador era ler o sintoma e chutar a palavra — que é
exatamente como o `sus` dentro de "sustentável" entrou.

### 2.6 Vote quality corrigido após a paginação — commit `50327b1`

O classificador de tipo de votação tinha rodado **antes** da paginação. As 79
pautas novas nasceram com `voteKind = MERIT`, que é o default do schema — e é
invisível, porque MERIT é justamente o tipo que não reduz nada. Rodar de novo
achou **47 das 153 pautas erradas**.

### 2.7 Descongelamento — commit `797951a`

`NUMBERS_FROZEN = false`. Ver `src/lib/release-state.ts` para o raciocínio
completo e para quando a flag deve ligar de novo.

### 2.8 Teste de consistência — commit `9e91670` e seguintes

`src/__tests__/consistencia-publica.test.ts`, 33 testes que verificam que o
texto público afirma o que o código mede, que faixas do código batem com as
faixas da UI e da API, e que nenhuma versão de regra é citada como número
solto. Hoje a suíte tem **327 testes**.

---

## 3. As dificuldades

### D1. Classificador por palavra-chave é frágil por natureza

**Sintoma.** Uma palavra que aparece por passagem decide o tema de uma pauta.

Por exemplo, a descrição do relator de um projeto de licenciamento ambiental
fala em "sustentabilidade" — e `sus` classificava 67,4% de **todos** os votos
do acervo como Social Responsibility. Não era bug de lista: era o conceito de
classificar por palavra sendo errado para texto administrativo.

**Como foi resolvido.** `SCAN_RULES 1.5.0` passou a casar contra o **objeto
oficial da proposição** — título e ementa — e nada mais. Sem ementa não há
objeto oficial, e sem objeto oficial a pauta não entra no escopo.

**Caminho futuro.** Se for preciso classificar por texto longo de novo, não
usar lista de palavras. Ou usar a proposição estruturada da API, ou aceitar
que o critério é só o objeto oficial. E continuar exigindo, em toda correção,
um número de votos antes e depois.

### D2. A ementa de um decreto de dotação cita o nome do órgão

**Sintoma.** "MPV 1268/2024 — abre crédito extraordinário em favor dos
Ministérios ... do Desenvolvimento e Assistência Social" — a palavra
`assistencia social` está no **nome do órgão destinatário**, não no assunto.
1.826 votos de orçamento entravam como política social.

**Como foi resolvido.** Exclusão `credito extraordinario` na regra de Social.

**Caminho futuro.** Regra geral que vale: **o que a proposição FAZ; o nome do
órgão por onde ela passa não vale.**

### D3. `improbidade` aparecia numa lei do SUS

"São lei de transparência do SUS, não integridade moral" — 386 votos
classificados como Moral por causa de uma referência à Lei 8.429.

**Caminho futuro.** Integridade Moral é, por decisão sua, medida por
**despesa**, não por voto. A pauta nominal de anistia fica como registro
histórico; o critério se sustenta no gasto. Está escrito assim em
`docs/DECISOES-PRODUTO-2026-09-26.md`.

### D4. Prisma Client do container defasado em runtime

**Sintoma.** Depois de `prisma db push` e `npx prisma generate` no container,
o `index.d.ts` **tinha** a coluna nova e o generate reportava sucesso, mas ao
usar o campo em runtime vinha `Cannot read properties of undefined`.


**Como foi resolvido — e esta é a parte importante.** Em vez de depurar a
cadeia do Prisma no container, **tirei a dependência**: a coluna nova foi
removida do schema, e a ementa passou a ser lida do primeiro segmento de
`description` (que é a ementa, por construção do sync). O dado já estava
gravado nas 162 pautas; não havia necessidade de migrar nada.

**Caminho futuro.** Antes de adicionar coluna ao schema e fazer deploy, pesar:
o dado já está em algum campo existente? Parsear é mais barato que migrar
Prisma Client em três ambientes (local, CI, container). Se precisar mesmo
migrar, gerar o client **no container** e verificar o `runtime` — o `index.d.ts`
não mente sobre o que o runtime faz.

### D5. Tabela de backup quebra `prisma db push`

**Sintoma.** Depois de criar `politician_scores_backup_1_0_0` e
`key_agendas_backup_2026_09_26`, o Prisma passou a falhar ao inspecionar o
banco.

**Caminho futuro.** O `prisma db push` introspecta **todas** as tabelas. Depois
de criar qualquer tabela fora do schema, conceder permissão ao papel do
container nela, e lembrar que o `--accept-data-loss` é necessário para
qualquer mudança de coluna.

### D6. A métrica de cobertura do `SyncLog` mente

**Sintoma.** O relatório exibiu **18% de cobertura**. O número real era: 838
sessões substantivas sobre 4.647 sessões totais. O relatório tratava
"substantivas / todas as sessões" como se fosse "quanto do acervo você viu" —
mas não existe denominador externo para isso. Após paginar, todas as páginas
do acervo **foram** vistas; o número é 100% de páginas.

**Ainda não corrigido.** Está anotado em `SyncLog` no
`scripts/recalculate-scores.ts`. O relatório correto deve mostrar: páginas
percorridas, páginas esperadas, e quantidade absoluta de sessões substantivas
examinadas — sem percentual inventado.

### D7. Vote quality aplicado antes da paginação

**Sintoma.** 47 das 153 pautas com voto tinham `voteKind` errado, porque
nasceram com o default depois que a paginação trouxe 79 pautas novas. O erro é
invisível justamente porque MERIT é o tipo que não reduz nada.

**Caminho futuro.** Sempre que o acervo crescer (paginação, nova legislatura,
novo escopo), **rodar o backfill de classificação de novo**, não só o de
score. Recalcular nota com `voteKind` default é medir coisa errada com
aparência de coisa certa.

### D8. Caracteres corrompidos em edições

**Sintoma.** Várias vezes, ao editar texto grande por script, apareceram
  plenário (D12).
Passaram porque **testes e typecheck não checam comentário**.

**Caminho futuro.** Antes de commitizar qualquer texto editado em massa:
`rg -n "[^\x00-\x7F]" docs/ scripts/ src/` e passar o olho. Custo: dez
segundos. Economia: não publicar lixo.

### D9. O teste de consistência exige o nome da regra junto da versão

**Sintoma.** Ao escrever "1.5.0" num documento, o teste de consistência
falhou com "versão citada sem dizer de que regra é".

**Como foi resolvido.** Reescrever como "SCAN_RULES 1.5.0".

**Caminho futuro.** É um teste bom e propositalmente chato. Um número de
versão solto não é auditável. Se ele incomodar, o incômodo é do documento, não
do teste.

### D10. Flake em `MatchPage`

**Sintoma.** Teste instável, sem causa de lógica.

**Como foi resolvido.** `testTimeout` elevado para 15s. O bug de fundo não foi identificado — o sintoma
sumiu. Isso é uma dívida, não uma solução.

**Caminho futuro.** Se voltar, investigar antes de aumentar timeout de novo.

### D11. Trabalho de outra pessoa na mesma árvore

`scripts/render-charts.ts`, `scripts/render-gt1-cards.ts` e PNGs deletados em
`canal-x/` e `gt1-export/` **não são deste trabalho**. Ficaram fora de todos os
commits. Manter assim: `git add` por caminho explícito, nunca `git add -A`.

### D12. A API da Câmara é paginada e o endpoint por padrão devolve uma página

Foi a causa de o acervo estar em 29% sem ninguém perceber. Está em
`scripts/lib/paginacao.ts` e documentado em `docs/AUDITORIA-VOTACOES.md`.

---

## 4. O erro de julgado — o mais importante deste documento

Você tem razão: **quanto mais se mexe, mais piorou**, e o site mudou muito em
dois dias. Parte disso é meu.

O padrão foi este: cada rodada de limpeza era **tecnicamente correta** e
**medível** — saíam 1.143 votos, depois 2.938, e cada número era real. Mas o
objetivo final já estava comprometido desde a primeira hora: **11 assuntos não
sustentam um ranking**, e eu fui fazer a quinta, a sexta rodada de limpeza em
vez de dizer isso no começo.

Duas lições concretas:

1. **Auditoria tem um teto que é fato do mundo, não do código.** Se o dado de
   origem não tem o que a ambição precisa, mais engenharia de classificação
   não cria o dado. Eu devia ter estimado o teto antes de iterar — a resposta
   estava no `docs/AUDITORIA-VOTACOES.md` que eu mesmo escrevi.
2. **Cada mudança em produção tem custo de confiança, e o custo não é
   simétrico.** Uma-banner de aviso honesto custou mais confiança do que a nota
   errada teria custado. Você está certo em desconfiar de "mudou muito em dois
   dias".

Se fosse para fazer diferente: medir o teto do dado **primeiro**, e só depois
prometer interface.

---

## 5. Estado atual, sem arredondar

**Acervo.** 4.647 sessões no total · 838 sessões substantivas · 54.997 votos ·
162 pautas · Câmara dos Deputados e Senado.

**Classificação vigente (SCAN_RULES 1.5.0).** 11 assuntos, **7.330 votos
(13,3%)**.

| critério | assuntos | votos |
|---|---|---|
| Responsabilidade Social | 7 | 5.418 |
| Valores Familiares | 3 | 1.465 |
| Integridade Moral | 1 | 447 |
| Proteção à Vida | 1 | 0 |
| Liberdade Religiosa | 0 | 0 |

Vida tem 1 assunto (`PL 1904/2024`, aborto equiparado a homicídio) e **zero
votos** na base — o projeto existe e está correto, mas a votação nominal dele
não foi capturada. Religião: zero pautas, como a auditoria já previa.

**Vote quality.** Só **30%** das votações nominais são mérito.

| tipo | peso | pautas | votos |
|---|---|---|---|
| Mérito | 1,0 | 61 | 22.398 |
| Requerimento | 0,3 | 38 | 13.412 |
| Requerimento de urgência | 0,2 | 28 | 10.369 |
| Emenda | 0,7 | 25 | 8.525 |
| Redação final | 1,0 | 1 | 293 |

**Notas.** média 58,4 · escala 50–64 · dispersão 3,20 · 504 com voto próprio ·
91 mantêm score de partido.

A escala apertada é consequência de 11 assuntos. Estreita e honesta vale mais
que larga e errada.

**Testes.** 327 passando, typecheck e lint limpos, build OK.

---

## 6. O que fazer (e o que não fazer) quando voltar

### Não fazer

- **Não mexer em classificação sem número antes e depois.** É a única regra
  que tornou este trabalho verificável.
- **Não promover número que não foi medido.** `NUMBERS_FROZEN` existe para
  isso e está em `src/lib/release-state.ts`, com o motivo de cada vez que ligou.
- **Não `git add -A`.** Ver D11.
- **Não confiar em `index.d.ts` para saber se o Prisma Client roda.** Ver D4.
- **Não classificar por texto administrativo.** Ver D1.

### Decisões de produto suas, em aberto

1. **O ranking se sustenta em 11 assuntos?** Minha recomendação: ranking por
   **despesas** (dado dos 421, cobertura total, é o que você mesmo definiu
   como "moral medida por gasto") com **votos como camada visível e fora da
   ordenação**, marcada com "N=11". Isso é trocar a coluna que alimenta a
   fórmula e escrever duas frases honestas — não é reescrever.
2. **Pesos futuros** `Vida 30 / Família 20 / Moral 25 / Social 15 / Religião
   10` — decididos, **não implementados**.
3. **Posição/percentil no lugar da nota 0–100** — decidido, **não
   implementando**.
4. **Rastreamento de comissões** — decidido via tramitação, **não
   implementado**.
5. **Educação política** (por que projetos não chegam ao plenário) — decidido,
   **não implementado**.

### Correções técnicas pendentes, pequenas

- Métrica de cobertura do `SyncLog` (D6) — ainda errada, ainda no ar.
- Ampliar vocabulário com base no acervo real de ementas, se quiser mais
  assunto — com a ciência de que o teto é o corpus nominal.

---

## 7. Se um agente continuar isto

Ler, nesta ordem: este documento → `docs/DECISOES-PRODUTO-2026-09-26.md` (as
decisões e o estado da classificação) → `docs/AUDITORIA-CLASSIFICACAO.md` (o
histórico das quatro rodadas) → `docs/REPRODUCIBILITY.md` (fórmula e
reprodução).

Comandos que produzem estado, na ordem certa:

```bash
npx tsx scripts/reclassificar-pautas.ts            # simulação
npx tsx scripts/classificar-votacoes.ts            # simulação do vote quality
npx tsx scripts/auditar-classificacao.ts           # auditoria por palavra-chave
npx tsx scripts/recalculate-scores.ts --dry-run    # medir efeito antes de gravar
npx tsx scripts/reclassificar-pautas.ts --aplicar
npx tsx scripts/classificar-votacoes.ts --aplicar
npx tsx scripts/recalculate-scores.ts
```

Regra de ouro do fluxo: **simulação antes de `--aplicar`, sempre.** A ordem
importa — corrigir classificação **depois** do vote quality, senão o
`voteKind` das pautas novas fica default de novo (D7).

### Skills sugeridas

- **`diagnosing-bugs`** — para D4 (Prisma Client) e D10 (flake), quando
  voltarem a aparecer. São os dois que precisam de diagnóstico de verdade, não
  de contorno.
- **`code-review`** — para revisar a série de commits `f47dd76`..`797951a` antes
  de continuar mexendo, já que é o bloco mais longo e o mais recente.
- **`research`** — se for buscar como a Câmara expõe proposição estruturada
  (que resolveria D1 pela raiz) ou como buscar a pauta que não chega ao
  plenário (D12).
- **`grill-me`** — para as decisões de produto da seção 6, que são suas e não
  minhas.
