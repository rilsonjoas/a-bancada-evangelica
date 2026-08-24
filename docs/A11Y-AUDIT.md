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
