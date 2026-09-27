# Plano pós-eleição

**Escrito em:** 2026-09-27, uma semana antes do 1º turno (04/10/2026).
**Contexto:** `HISTORIA-DIFICULDADES-E-CAMINHOS.md` (ler antes) e
`DECISOES-PRODUTO-2026-09-26.md`.

## O que foi feito antes da eleição (passe de honestidade, 2026-09-27)

Só frontend e texto. Sem mudar fórmula, sem recalcular nota.

- Selo "Aderência alta / moderada / baixa" trocado por "N votos próprios".
  Cor por faixa de nota tirada em todo o site.
- Vida e Liberdade Religiosa (`semVotoMedido` em `src/lib/criteria.tsx`)
  aparecem como "sem voto medido" em vez do número, que é só a semente do
  partido. Continuam na nota geral pelo peso da metodologia, e o site diz isso.
- "Panorama da bancada" por faixa removido. O contador "Aderência muito alta"
  (que mostrava 0) virou "3 de 5 critérios com voto medido".
- Match ("quem vota como você") pergunta só os 3 critérios com voto medido.
  Tirado o atalho que devolvia a nota geral quando o eleitor concordava com
  tudo.
- Perfil: "Base de Cálculo" passou a usar o `subjectCount` do motor. Antes
  usava `votesPerCriteria`, que conta pautas fora do escopo da SCAN_RULES 1.5.0
  e mostrava "Vida: 2 assuntos" para quem o motor gravou 0.
- `PerformanceChart`: pesos fixos 25/20/20/10/5 (somavam 80) trocados pelos de
  `CRITERIA`.
- Preview de link (API `/:id/share` e `scripts/generate-og-pages.ts`) sem a
  faixa de aderência.

**Até o fim do 2º turno (25/10/2026): congelado.** Só correção de bug que
afirme algo falso. Nenhuma mudança de fórmula, classificação ou recálculo em
lote. Cada mudança no ar custa confiança, e esse custo é maior em período
eleitoral.

## A decisão que vem antes de tudo

**O ranking por nota continua sendo o produto principal?**

O dado medido não sustenta ordenar 595 pessoas por uma nota de 0 a 100:

- 11 assuntos, 13% dos votos do acervo.
- 2 de 5 critérios (40% do peso) sem votação nominal nenhuma.
- A nota é 50,4% explicada pelo partido. Os quatro primeiros do ranking FPE são
  do mesmo partido, com a mesma nota.
- 71% dos parlamentares sem despesa registrada, então mover Integridade Moral
  para gasto (D-03) não resolve.

**Recomendação:** trocar o eixo do site de **ranking** para **ficha por
parlamentar**. A nota continua (D-01 vale: "sem número o site parece fraco"),
mas deixa de ser a ordem padrão da lista. A página principal passa a ser busca:
"procure seu deputado".

A ficha mostra, nesta ordem:
1. como votou em cada assunto medido, com o tipo de votação e o peso;
2. o que ele fez nos temas sem voto em plenário: autoria, relatoria e
   tramitação (D-05 e D-07);
3. despesas, onde houver dado;
4. a nota, com a composição ponto a ponto que já existe.

Essa decisão é do Rilson. O resto do plano vale com ou sem ela, mas a ordem das
fases muda.

## Fases

Uma de cada vez, medindo antes e depois (regra que já está na história).

### Fase 1 — Dívidas que afirmam coisa errada (pequenas)

- **`votesPerCriteria` na API.** Filtrar pelo mesmo escopo do motor ou
  derivar de `score_breakdown`. O frontend já contorna isso; a API pública
  ainda devolve o número errado.
- **`semVotoMedido` derivado do dado.** Hoje está fixo em `criteria.tsx`.
  Expor na API, por critério, o total de assuntos medidos no acervo, e a
  tela ler dali. Assim, quando uma votação de Vida entrar, o site muda sozinho.
- **Métrica de cobertura do `SyncLog` (D6).** Trocar o percentual inventado
  por páginas percorridas / esperadas + número absoluto de sessões.
- **Etiquetas no motor.** `performance_label` e `performance_description`
  continuam gravados no banco ("Alinhamento parcial — há votações mistas").
  Decidir se saem da API ou se ficam só como campo interno.

### Fase 2 — Tramitação (D-05 + D-07)

É o que mais agrega, porque transforma "não medimos" em conteúdo com fonte.

- Antes de codar, **medir o teto**: quantas proposições de Vida e Religião
  existem na legislatura, quantas têm tramitação na API, e quantas têm
  autor/relator identificável. Se o número for pequeno, o escopo é pequeno.
- Página por proposição: comissão, data, despacho, relator, situação.
- Na ficha: "autor de X, relator de Y" nos temas sem voto em plenário. É
  dado individual real, que o voto não dá.
- O que a API **não** dá: voto em comissão (`/orgaos/{id}/votacoes` 404 fora
  do Plenário). Não prometer.

### Fase 3 — Reposicionar a home (se a decisão acima for "ficha")

- Home = busca + explicação curta do que o site mede e do que não mede.
- Ranking vira uma página secundária, com a ressalva no topo.
- Rever o Match: com 3 critérios ele diz pouco. Opções: incluir perguntas
  sobre autoria/relatoria da Fase 2, ou tirar do destaque.

### Fase 4 — Nova legislatura (fevereiro de 2027)

A 58ª legislatura começa em 01/02/2027. O acervo inteiro é da 57ª.

- Decidir: o site vira arquivo da 57ª e começa a 58ª do zero, ou mantém as
  duas? Parlamentar reeleito carrega histórico?
- A 58ª começa sem voto nenhum, ou seja, 100% estimativa de partido. Isso
  precisa estar resolvido **antes** de fevereiro, senão o site abre a
  legislatura com 513 notas de partido.
- Rodar o backfill de classificação e de `voteKind` sempre que o acervo crescer
  (D7), não só o recálculo.

### Fase 5 — Integridade Moral por gasto (D-03)

Só depois de resolver a pendência dos 421 sem despesa. Sem isso, 65% da nota
deles vira estimativa de partido. Opção a avaliar: gasto como camada visível
fora da nota, como o voto nos critérios sem dado.

## Não fazer

- Não mexer em classificação sem número antes e depois.
- Não mudar a fórmula e o texto em momentos diferentes (`NUMBERS_FROZEN` existe
  para isso).
- Não fazer uma quinta rodada de limpeza de classificador esperando que ela
  crie dado. O teto é o corpus nominal da Câmara.
- Não `git add -A` (D11).

## Pendências técnicas herdadas

- Flake em `MatchPage` (D10): timeout aumentado, causa desconhecida.
- Prisma Client defasado no container (D4): contornado, não diagnosticado.
