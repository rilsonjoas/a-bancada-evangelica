# Plano de ação — teste de consistência e confiabilidade dos dados

> Data: 2026-09-25. Deriva de `AUDITORIA-CALCULOS.md` e de 4 bugs achados
> em produção nesta semana, todos da mesma família: **o que o site publica
> não é o que o código mede.**
>
> Frase que resume o objetivo, do próprio Rilson: *"enquanto a gente não
> tiver isso junto, o app é só uma carcaça falsa."*

---

## 0. O que motivou isto (para quem entra agora)

Quatro bugs, nenhum pego por teste, lint ou build:

| # | Bug | Como se manifestava | Desde |
|---|---|---|---|
| 1 | `votesPerCriteria` sobrescrevia em vez de somar | Quem tem 41 votos aparecia com "1 votação" | 27/08 |
| 2 | Chave de enum (`FAMILY_VALUES`) contra chave de campo (`familyValues`) | Card "Base de Cálculo" mostrava **0 para os 595 parlamentares** | 27/08 |
| 3 | Rótulo afirmava o que a métrica não media | "Nota que resume o padrão das despesas" sobre um número que era score de valores | — |
| 4 | 12 dos 20 indicadores publicados não têm medição | Página promete o que o código não faz | — |

O padrão: **typecheck, lint, 198 testes e build passaram em todos os quatro.**
Teste que só verifica que o código roda como escrito não pega código que
lies sobre si mesmo.

---

## 1. Fase 1 — o teste gigante (2 dias de trabalho)

Um único arquivo de teste que falha quando a página mente. Substitui
"testes por critério" por **testes por afirmação publicada**.

### 1.1 Pesos e critérios

| Teste | Falha se |
|---|---|
| Pesos de `criteria.tsx` somam 100 | alguém edita um peso e não ajusta o resto |
| A ordem do array é ordem decrescente | o eixo do gráfico muda de ordem |
| Os 5 `field` batem com o que a API devolve | o casamento de chave quebra de novo (bug 2) |
| Todo `field` tem peso > 0 e rótulo | critério sem rótulo |

### 1.2 Indicadores publicados × o que o `SCAN_RULES` mede

O teste mais importante. Para cada um dos 20 indicadores que a
`/metodologia` publica, verificar se existe keyword no `SCAN_RULES` que o
cobre. Hoje o resultado é:

| Critério | Indicadores com medição | Sem medição |
|---|---|---|
| Proteção à Vida | 1 de 4 | 3 |
| Defesa da Família | 2 de 4 | 2 |
| Integridade Moral | 1 de 4 | 3 |
| Responsabilidade Social | 1 de 4 | 3 |
| Liberdade Religiosa | 3 de 4 | 1 |
| **Total** | **8 de 20** | **12** |

E o inverso: **38 keywords do `SCAN_RULES` não aparecem em nenhum indicador
publicado** — a página não conta ao usuário o que o sistema realmente
procura (aborto, eutanásia, ficha limpa,Symbolsiconsreligious, anistia,
prescrição, SUS, bolsa família…).

O teste não vai exigir que todo indicador vire medido — isso é decisão de
produto. Vai exigir **explicitude**: ou o indicador aponta para a keyword
que o mede, ou ele é marcado como "não medimos isso" na própria página.

### 1.3 Fórmulas declaradas × código

| Teste | Falha se |
|---|---|
| "soma ponderada nos pesos 30/25/20/15/10" | a fórmula muda e o texto não |
| "penalidade = …" em REPRODUCIBILITY | `recalculate-scores.ts` diverge |
| Rótulos de desempenho (`performance.ts`) | divergem de `scoring.ts:performanceLabel` |
| Faixas de score das 4 categorias | mudam num lugar só |
| `EXPENSE_RULES_VERSION` e `SCAN_RULES_VERSION` | citados em docs desatualizados |

### 1.4 Números publicados × banco

A `/dados` e o README publicam números. O teste consulta a API e falha se
divergirem além de uma tolerância declarada:

- soma das 4 faixas de desempenho = total deotá/nota
- total de parlamentares com voto + sem voto = total avaliado
- "8 critérios"/"5 critérios" bate com o array
- qualquer número com data de snapshot passa a ter essa data visível

### 1.5 Texto que afirma o que não é medido

Teste de **string proibida** na `/metodologia`. Termos que hoje prometem
capacidade inexistente e devem falhar o build se aparecerem sem uma
ressalva na mesma frase:

| Termo | Por que é proibido |
|---|---|
| "histórico de processos judiciais" | não há integração com STF/MP |
| "investigações por corrupção" | idem |
| "condenações" | idem |
| "ficha limpa" | o próprio site diz que não é |
| "trânsito em julgado" | só existe num seed não consumido |
| "posicionamentos públicos" | o sistema só lê votação nominal |

Allowlist explícita para o caso legitimate: a frase pode aparecer **se**
contiver "não é", "não medimos", "não há integração".

### 1.6 Onde esse teste roda

- `pnpm test` local (rápido, sem banco)
- `pnpm test:api` para o que precisa de mock
- **O CI roda tudo junto** — a falha de typecheck estrita que vi hoje
  mostrou que o CI é mais rigoroso que minha verificação manual; o teste
  precisa rodar nos dois caminhos.

---

## 2. Fase 2 — corrigir o que o teste accuse (3 dias)

Ordem por dano ao usuário, não por esforço:

### 2.1 Os 12 indicadores sem medição (P0)

Três caminhos possíveis, por indicador:

- **(a) Apagar** da página o que não medimos. É a opção mais honesta e a
  mais barata. Perde texto que soa bem e não explica nada.
- **(b) Reescrever** para descrever o que o código faz de fato
  ("votações nominais com 'aborto' no título" em vez de "posicionamentos
  públicos").
- **(c) Implementar** a medição — só para casos com dado público real e
  barato. Exemplo: "Gastos parlamentares dentro do padrão" **existe** de
  verdade (a penalidade de despesa), só não é declarado como tal.

**Recomendação:** (b) para a maioria, (c) para o que já tem dado, (a) para
o que é puro discurso.

### 2.2 A descrição de Integridade Moral (P0)

O pior caso de todos. Hoje a página diz que se analisa "histórico de
processos judiciais, investigações por corrupção ou improbidade" — e não
existe nenhuma integração com STF, MP, CPI, Conselho de Ética, TCU nem
operações. Quem lê acredita numa verificação que não existe.

O que o critério **realmente** mede: seed do partido + voto em
corrupção/improbidade/ficha limpa/transparência − penalidade de despesa.
Precisa ser escrito assim, e precisa dizer que **despesa é a menor das
três componentes**.

### 2.3 As 38 keywords não declaradas (P1)

A página não diz ao usuário que o sistema procura "aborto", "eutanásia",
"ficha limpa", "símbolo religioso", "anistia", "prescrição", "SUS". Sem
isso ele não consegue prever por que um voto entrou ou não.

Proposta: uma seção "O que o sistema procura" listando as keywords por
critério, com link para o guia de curadoria. Transparência radical: mostra
inclusive as que podem ser discutíveis ("identidade de genero",
"diversidade sexual" dentro de Valores Familiares), que é melhor que
esconder e ser descoberto.

### 2.4 Números de pauta: 83 linhas vs 33 assuntos (P1)

`/votacoes`, `/temas` e README dizem "83 pautas". São 33 assuntos em 83
sessões. A tabulação de votos já foi corrigida; a contagem em texto,
não.

### 2.5 `PARTY_ALIGNMENT` com fonte por valor (P1, decisão sua)

90,8% da variância da nota é o partido, e a tabela é escrita à mão com uma
fonte genérica ("DIAP, FPE, JRN/Estadão"). Sem fonte auditável por valor,
a nota não é reproduzível por terceiro — e o guia promete reprodutibilidade.

### 2.6 Faixas de desempenho (P2)

A auditoria achou a tabela com os mesmos percentuais de 2026-09-14. Se
"42 parlamentares em aderência muito alta (7,1%)" for verdade hoje, muda
sozinho com o dado; se for fixo no texto, envelhece. Teste do item 1.4
resolve.

---

## 3. Fase 3 — o dado público continua confiável (paralelo)

Consistência entre código e texto é metade. A outra metade é o dado
faltar.

| Lacuna | Estado | Esforço |
|---|---|---|
| Proteção à Vida sem voto nominal | 0 votos em 3 pautas | buscar dado (comissões não têm) |
| Liberdade Religiosa sem pauta | 0 pautas | idem |
| 174 de 730 com despesa | 24% de cobertura | Estender sync (40–60 min) |
| 217 de 730 só com estimativa | 29,7% | É consequência do dado, não bug |
| Meio ambiente dentro de Responsabilidade Social | 55 de 83 pautas | Reclassificar, move ranking |
| 33 assuntos, 9 votados até 9 vezes | Estrutural | Separar pauta de sessão |

---

## 4. Perguntas para o Rilson (leigos, com o porquê)

**P1 — Os 12 indicadores sem medição: apagar, reescrever ou implementar?**
Apagar tira texto que soa bem. Reescrever é mais barato e honesto.
Implementar é o ideal mas custa mais e alguns não têm dado público
("posicionamentos públicos sobre aborto" exigiria monitorar declaração —
isso é outro projeto). Minha sugestão: reescrever o que tem dado, apagar
o que não tem.

**P2 — A descrição de Integridade Moral que promete processos judiciais.**
Posso reescrever para o que é medido de verdade. É a correção mais
importante de todas, mas significa admitir publicamente que o critério não
faz o que a página dizia. Você prefere reescrever agora, ou manter o texto
e acrescentar a ressalva?

**P3 — Mostrar as keywords, incluindo as discutíveis?**
Sugiro mostrar tudo, com link para o guia. Argumento: se a busca por
"identidade de genero" dentro de Valores Familiares é questionável, esconder
não resolve — só faz alguém achar que é scanners. Expor e explicar é a
postura do projeto.

**P4 — Ordem de execução.** Proponho: Fase 1 (teste) → 2.2 (Integridade
Moral) → 2.1 (indicadores) → 2.3 (keywords) → 2.4/2.6 (números) → Fase 3.
Ou prefere que eu ataque primeiro a página com a Fase 1 pronta, para não
demorar a ter nada visível?

**P5 — `PARTY_ALIGNMENT` (90,8% da nota).** Documentar a fonte de cada
valor, ou derivar de voto real? A segunda opção é ambiciosa e pode mudar
muita nota. A primeira é um trabalho de pesquisa.

---

## 5. O que NÃO entra no plano (e por quê)

- **Refazer o modelo de nota.** Os 5 critérios são defensáveis; a
  inconsistência é de transparência, não de desenho.
- **Nota descalar o score.** 90,8% ser partido é um achado sobre o dado
  disponível, não um defeito da fórmula. Mudar a fórmula agora seria trocar
  um problema conhecido e documentado por um desconhecido.
- **Parser de atas de comissão.** Medido: o dado não existe em formato
  estruturado, e é caro.
