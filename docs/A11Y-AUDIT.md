# Auditoria de Acessibilidade — linha de base (2026-08-23)

Auditoria estática inicial (código + tokens). Correções viram commits
referenciando este documento. Meta: WCAG 2.1 AA.

## ✅ O que já passa

| Item | Evidência |
|---|---|
| Idioma da página | `<html lang="pt-BR">` |
| Contraste foreground/background | 16.69:1 |
| Contraste primary | 12.66:1 |
| Contraste secondary | 15.17:1 |
| Contraste muted-foreground/bg | 5.20:1 (AA texto normal) |
| Contraste card | 16.69:1 |
| focus-visible parcial | 11/49 componentes ui já têm |

## 🔴 Críticos (corrigir primeiro)

1. ~~**Imagens sem alt**~~ **RETIFICADO (2026-08-23): falso positivo do grep
   monolinha** — o `alt` estava na linha seguinte do JSX multiline.
   Re-auditado com parser multiline: **13/13 imgs com alt** ✅
   *(lição registrada: grep de JSX exige `re.S` ou equivalente)*
2. **Skip-link** — ✅ IMPLEMENTADO (2026-08-23): `<a href="#conteudo">`
   como primeiro elemento focável + `<main id="conteudo" tabIndex={-1}>`;
   visível só no foco via `sr-only`/`focus:not-sr-only`.
3. **aria-label: 0 nas páginas** — Ranking, Metodologia, Sobre, Contato,
   Perfil, Votações, /dados, legais (componentes têm ~19%, roadmap 2026-08-16)
4. **Botões só-com-ícone sem accessible name** — ✅ RESOLVIDO (2026-08-23):
   varredura regex completa achou 10 botões-ícone; 9 já tinham sr-only/aria
   (shadcn), 1 corrigido (`PoliticianSelector.tsx` fechar → aria-label).
   Falso positivo descartado: botão Enviar do Contato tem texto visível.

## 🟡 Melhorias

- Accent laranja (#ea580c) com branco ≈ 3.1:1 — usar apenas em UI grande/
  ícones; nunca texto pequeno sobre laranja
- ~~Uniformizar focus-visible nos ~38 componentes~~ ✅ RESOLVIDO (2026-08-23):
   regra global `:focus-visible { outline: 2px solid hsl(var(--ring)); offset 2 }`
   no index.css — quem tem ring próprio mantém; o resto herda o contorno.
   Mais barato e à prova de componente novo.
- Landmarks semânticos (`<main>`, `<nav aria-label>`)

## Plano de correção (ordem)

1. alt nas 3 imgs *(15 min)*
2. Skip-link + `<main id="conteudo">` *(30 min)*
3. Accessible names em todos os icon-only buttons *(1–2h)*
4. aria-labels por página — ✅ CONCLUÍDO (2026-08-23): Ranking
   (busca + sliders de peso) e Perfil (barras de critério) já tinham;
   fechado agora Comparação (busca? não — remover político nomeado,
   card "Adicionar" virou botão de verdade com Enter/Espaço, barras
   com "X de 100"), Grupos (aria-expanded no expandir, gráficos
   Recharts com role="img" + descrição) e Votações (busca + selects
   de critério/período rotulados).
5. focus-visible padronizado nos ui components *(2h)*
6. **Validação final — ✅ EXECUTADA (2026-08-23, meta batida)**: a
   validação no navegador desta máquina reproduziu o NO_FCP da sessão
   anterior — e a investigação mostrou que não era ambiente:
   **produção estava tela-branca desde o push do commit `b7cf4b1`**
   (rota `/dados` adicionada sem import → `ReferenceError:
   DadosAbertos is not defined` crashava o React inteiro no boot;
   a página em si também usava Chakra UI, nunca instalado). Corrigido:
   import + página reescrita em Tailwind; verificado localmente com
   screenshot headless (home pinta 380KB vs 5.7KB branco antes).
   Deployado e revalidado com Lighthouse (acessibilidade, mobile):

   | Página | Antes | Depois |
   |---|---|---|
   | / (home/ranking) | 90 | **100** |
   | /metodologia | 89 ❌ | **98** |
   | /politicos/:id | 92 | **98** |
   | /sobre | 94 | **100** |
   | /dados | 94 | **98** |
   | /contato | 95 | **98** |

   Correções que subiram as notas (além dos itens 1–5): logo do Header
   com aria-label (link sem nome no mobile, afetava todas as páginas),
   selects de filtro do Ranking rotulados, switch "Personalizar" com
   `<label htmlFor>`, `CardTitle` global h3→h2 (hierarquia), progressbars
   da Metodologia nomeadas, verdes/amarelos/vermelhos 600→700 em textos
   pequenos (contraste AA).

   **Restante documentado (não bloqueia, notas ≥95):**
   - `heading-order` em Metodologia/Perfil/Dados/Contato — h3/h4
     "pulando" níveis dentro de componentes (ex.: h4 após h2 do card).
     Exige revisão de hierarquia componente a componente.
   - Metodologia ainda pode ganhar pontos com os h4s internos.

   Comando pra revalidar a qualquer momento:
   ```bash
   npx lighthouse https://a-bancada-evangelica.vercel.app/ \
     --only-categories=accessibility --view
   ```

*Regra da casa: cada item corrigido referencia este doc no commit.*

---

## ✳️ Rodada 2026-08-27 — auditoria tipográfica + responsividade fina

Correções locais (aguardando commit). Meta: checar que as 10 rotas
mantêm acessibilidade 100 e overflow zera no mobile.

### Tipografia
- **Rodapé com h2 gigante**: "Navegação" e "Fontes de Dados" herdavam o
  `clamp` global de h2 (47px no desktop), ficando **maiores que o h1 da
  própria página** (30px). Corrigido com `text-sm md:text-lg tracking-tight`
  (mantém semântica de heading + serif; 18px no desktop < h1). Verificado:
  h1=30px, h2 rodapé=18px → hierarquia OK.
- **Hierarquia de headings**: re-auditada via DOM nas 8 páginas de dados —
  nenhum salto de descida (heading-order ✓).

### Responsividade fina (overflow)
Varredura de `scrollWidth > clientWidth` nas 10 rotas em 390px e 320px
(com o widget de pesquisa de terceiros removido — era falso positivo):
- **`/votacoes` mobile (390px)**: overflow de 3px. Causa: grids
  `md:grid-cols-2/3/4` sem `grid-cols-1` no mobile — track usa
  `min-content` e estica os cards além do container. Fix: `grid-cols-1`
  adicionado aos 4 grids da página (minmax(0,1fr)). Resultado: 390=390.
- **`/metodologia` 320px**: overflow de 18px. Causa: `<code>` com URL longa
  (`legis.senado.leg.br/dadosabertos/votacao`) sem quebra de linha. Fix:
  `break-all`. Resultado: 320=320.

### Acessibilidade (Lighthouse 100 em 10/10 rotas)
- **`/votacoes`**: `Tendência de Alinhamento` usava `text-green/blue/red-600`
  em texto pequeno → contraste insuficiente (único item segurando a página
  em 97). Corrigido para 700, seguindo o padrão já aplicado no resto do
  projeto. Resultado: /votacoes 97 → **100**.
- Estado final Lighthouse: `/`, `/votacoes`, `/metodologia`, `/dados`,
  `/sobre`, `/contato`, `/grupos`, `/privacidade`, `/termos` = **100**.

*Nota de método: durante a varredura foi identificado um widget de pesquisa
de terceiros (`tsqd-transitions-container`) injetado no DOM do ambiente,
que gerava overflow imaginário. Sempre removê-lo antes de medir o layout do
app.*

### Acessible names — item do roadmap está concluído (métrica defasada)
O roadmap (2026-08-16) dizia "aria-label ~19% dos componentes". Re-auditado
via DOM nas 10 rotas: **0 elementos interativos sem accessible name**.
- 2 candidatos (switches `fpe-filter` e `weights-toggle` no Ranking) são
  **falso positivo** — têm accessible name via `label[for]`
  ("Frente Parlamentar Evangélica", "Personalizar").
- Coberto também pelo Lighthouse 100/100 em todas as rotas (audits de
  "discernible text" + "associated labels" passam).
- Conclusão: o item de aria-labels/nomes acessíveis **não requer mais
  correção**. A métrica de ~19% não refletia as correções do 2026-08-23.

---

### 🎯 H1 · Proveniência por votação no perfil (2026-08-27) — IMPLEMENTADO LOCALMENTE
Parte da Onda A2 (auditabilidade pública). Cada voto no perfil agora expõe:
- `source` (CAMARA/SENADO), `sourceVoteId`, `sourcePropositionId`
- Link "Ver na Câmara dos Deputados" / "Ver no Senado Federal" direto no
  cartão do voto, apontando para a página oficial da tramitação/materia.
- Helper `buildVoteSourceLink` em `src/lib/sources.ts`.
- Backend (`politicians.service.ts`) expõe os 3 campos no DTO `recentVotes`.
- Types `usePoliticianDetail.ts` e `politician.ts` alinhados.
- Aguarda deploy no VPS para os links ficarem ativos (API roda no cluster).

---

### 🎯 H2 · Nº de votos base + aviso de confiança (2026-08-27) — IMPLEMENTADO LOCALMENTE
Parte da Onda A2. Cada critério agora mostra quantas votações compõem a nota
(`votesPerCriteria` no DTO), com aviso visual **"Base frágil (X votos)"** quando
a contagem é < 5.
- Backend: agregação por critério via `groupBy` em `politicians.service.ts`,
  exposto como `votesPerCriteria` no detalhe do político.
- Types: `APIPoliticianDetails` + `usePoliticianDetail` com `votesPerCriteria`.
- Front: card "Base de Cálculo por Critério" na aba Desempenho do perfil,
  listando os 5 critérios com contagem e badge amarelo quando < 5 votos.
- Texto explicativo orientando o eleitor sobre como interpretar a base.
- Aguarda deploy no VPS para dados reais (API roda no cluster).

### 🎯 H3 · Guia de reprodutibilidade (2026-08-27) — IMPLEMENTADO LOCALMENTE
Parte da Onda A2. Caderno passo a passo para qualquer pessoa recalcular as notas
do zero, sem depender da nossa infraestrutura.
- `docs/REPRODUCIBILITY.md`: pipeline completo (coleta → classificação →
  scoring → publicação), tabela de fontes oficiais (Câmara/Senado/TSE),
  palavras-chave e pesos por critério (30/25/20/15/10), fórmula de scoring,
  execução local (`pnpm sync:all`), validações de qualidade, hashes de verificação.
- Front: card "Reprodutibilidade" na /metodologia com link pro guia + botão
  "Baixar CSV do ranking".
- Placeholders a validar no próximo passo: hashes concretos e `docs/SYNC-LOG-*`.

### 🎯 H4 · Export de votações + checksum (2026-08-27) — IMPLEMENTADO LOCALMENTE
Parte da Onda A2. Dump aberto das votações individuais com hash de integridade.
- Endpoint `GET /api/politicians/export/votes/csv`: uma linha por voto
  (ID, parlamentar, data, pauta, critério, voto, impacto, fonte oficial e link),
  filtros opcionais por parlamentar/critério/limite, header `X-Content-SHA256`.
- Service: método `exportVotes` (agrega Vote + KeyAgenda + Politician, sem os
  joins pesados do findOne).
- Front: botão "Baixar votações individuais em CSV" + tutorial de verificação
  via `sha256sum` na /dados.
- Validação: tsc limpo, build OK, /dados renderiza sem erros. Hash prático a
  conferir após deploy (header não aparece no preview estático).

### 🎯 H5 · Errata pública (2026-08-27) — IMPLEMENTADO LOCALMENTE
Parte da Onda A2. Página pública onde toda correção de dados é anunciada —
nunca correção silenciosa.
- Nova rota `/errata` (src/pages/Errata.tsx); link no rodapé e na /dados e
  na /metodologia.
- Conteúdo: por que errata pública; estado atual (sem pendência; auditoria
  25/08 da lista FPE); histórico real (AJ Albuquerque/PP-CE removido);
  processo em 4 passos (confirmar na fonte → registrar → publicar →
  atualizar reprodutibilidade); canais de reporte (/contato + issues GitHub).
- Acessibilidade validada: headings H1→H2 sem salto; sem overflow em 320/390/
  768px; sem erros de console no preview.

### 🎯 H6 · Diff de sincronização (2026-08-27) — IMPLEMENTADO LOCALMENTE
Parte da Onda A2 (último item — Onda A2 CONCLUÍDA). Histórico de auditoria das
transformações das notas a cada recálculo.
- `scripts/recalculate-scores.ts`: captura o score antigo antes do upsert e grava
  um `SyncLog` (tipo `SCORES`, novo valor no enum) com `details` = { totalRevised,
  changedCount, unchangedCount, criteriaDelta (delta médio por critério),
  biggestMovers (top 10 por |delta|) }.
- Endpoint público `GET /api/stats/sync-history` (StatsService.syncHistory +
  StatsController) + link na /dados.
- Schema: `SyncType` ganhou `SCORES` → requer `prisma db push` no deploy.
- Limpeza: removido bloco duplicado morto (~27 linhas) no `findOne` de
  politicians.service.ts (resquício da edição do H2 — tipo TS quebrava); restaurado
  o corpo do `photoUrlOf`. typecheck + 56 testes + build OK.

### ✅ Rodada 2026-08-28 — varredura de overflow completa (pré-deploy)

Rodamos a varredura de **26 combinações (13 rotas × 390/320px)** antes do deploy
da Onda A2 e achamos 3 overflows **pré-existentes** (não vieram da Onda A2):

1. **`/` e `/ranking` a 320px (64px)** — botão `whitespace-nowrap` "Ver detalhes"
   (123px) + badge (92px) excediam a linha de 158px do card.
   Fix: `flex flex-wrap items-center justify-between gap-x-2 gap-y-1` no rodapé
   do `PoliticianCard` — agora o botão quebra pra linha de baixo quando falta espaço.
2. **`/grupos` a 320px (112px) e 390px (42px)** — tooltip do Recharts com
   `visibility:hidden` ainda expandia o `scrollWidth` do documento (wrapper absolute
   além do chart). Fix: `overflow-hidden` nos dois containers de gráfico (`BarChart`
   de partidos e `ScatterChart` de ACP em `VotingClusters.tsx`). O tooltip continua
   aparecendo no hover dentro do chart.
3. **`/dados` a 320px (79px) e 390px (9px)** — o bloco `<pre>` do tutorial do checksum
   (H4) com `break-all` no `<pre>` mas `white-space:pre` nas quebras de linha não
   quebrava → `overflow-x-auto` no `<pre>` (rolagem interna, sem estourar a página).

**Resultado: 26/26 sem overflow.** Acessibilidade geral mantida (Lighthouse 100,
0 elementos sem nome) — os fix foram layout-only, sem mudar rótulos nem hierarquia.
Observação: console ainda mostra warnings de chave duplicada no React em `/`
(e.g. labels de critério), sem impacto funcional — anotado como dívida técnica.

### ✅ Rodada 2026-08-28b — key duplicada no React (partidos em /grupos)

Warnings "Encountered two children with the same key" (em `/`, `/ranking`,
`/votacoes` e `/grupos`) vinham da tabela "Ver dados em tabela" de
`PartyAlignmentChart` (VotingClusters.tsx:178 `key={p.party}`): a query
`parties.service.ts` agrupava por `(current_party, current_house)`, então
partidos com bancada em Câmara **e** Senado (REPUBLICANOS, PSD, PP, PL, UNIÃO,
MDB…) voltavam 2× com a mesma key — além de aparecerem 2× no gráfico de barras.

Fix na fonte (correção semântica, não só cosmética):
- `src/api/parties/parties.service.ts`: `GROUP BY p.current_party` apenas
  (antes incluía `p.current_house`); campo `house` removido do SELECT/map/tipo.
  Agora cada partido tem UMA linha agregando Câmara+Senado (score, contagem).
- `src/hooks/useClusterData.ts`: `house` removido da interface `PartyAlignment`
  (nenhum consumidor usava).
- Validado com `page.route` simulando a resposta agregada → 0 warnings.
- typecheck + 56 testes + build OK. **Efícação só em produção após deploy**
  (API não roda neste ambiente).
