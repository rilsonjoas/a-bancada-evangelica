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

1. **Imagens sem alt** (3 de 13):
   - `PoliticianCard.tsx:66` — foto do político → alt obrigatório: "Foto de {nome}"
   - `ShareableCard.tsx:173` e `:306` — fotos no card compartilhável
2. **Sem skip-link** para o conteúdo principal (`index.html`/`Header`)
3. **aria-label: 0 nas páginas** — Ranking, Metodologia, Sobre, Contato,
   Perfil, Votações, /dados, legais (componentes têm ~19%, roadmap 2026-08-16)
4. **Botões só-com-ícone sem accessible name** — varredura encontrou 1 com
   aria-label/sr-only; mapear todos e nomear

## 🟡 Melhorias

- Accent laranja (#ea580c) com branco ≈ 3.1:1 — usar apenas em UI grande/
  ícones; nunca texto pequeno sobre laranja
- Uniformizar focus-visible nos ~38 componentes ui restantes
- Landmarks semânticos (`<main>`, `<nav aria-label>`)

## Plano de correção (ordem)

1. alt nas 3 imgs *(15 min)*
2. Skip-link + `<main id="conteudo">` *(30 min)*
3. Accessible names em todos os icon-only buttons *(1–2h)*
4. aria-labels por página, começando por Ranking e Perfil *(meio dia)*
5. focus-visible padronizado nos ui components *(2h)*
6. Validação final: Lighthouse + axe DevTools nas 6 páginas principais

*Regra da casa: cada item corrigido referencia este doc no commit.*
