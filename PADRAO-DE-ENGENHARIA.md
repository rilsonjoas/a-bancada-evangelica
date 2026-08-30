# PADRAO-DE-ENGENHARIA

Padrões que já funcionaram neste projeto e valem pros próximos (este repo é a
referência; uma cópia do ambiente VPS fica em `hetzner-infra/PADRAO-DE-ENGENHARIA.md`).

## TIPOGRAFIA E RITMO VERTICAL

Extraído da auditoria de 2026-08-29 (crawler Playwright em
`e2e/typo-audit.cjs`, medindo font-size, line-height e overflow@390 nas
11 rotas). Meta: texto de leitura nunca CPU-comprometido em mobile.

### Regras que valem em qualquer página de dados

1. **Corpo de leitura ≥ 14px** e **line-height ≥ 1.5** em qualquer `<p>`.
   - `p` com `text-xs` (12px) em corpo é ruim para legibilidade: **não use `<p>` para rótulos**.
     Rótulo vira `<span>` (ex.: "Nota geral" das barras de ranking).
   - `text-xs` (12px) é exceção de rótulo: badges, chips, eixos de gráfico,
     tagline do logo, copyright de rodapé, timestamps de "última atualização".
2. **`line-height` ≥ 1.5 é o piso do DESIGN SYSTEM, não só leitura.**
   Override no `tailwind.config.ts → theme.extend.fontSize`:
   - `xs: 12px/1.5`, `sm: 14px/1.5`, `base: 16px/1.625`, `lg: 18px/1.625`,
     `xl: 20px/1.6`, `2xl: 24px/1.5`, `3xl/4xl: 1.4/1.333`.
   - Isso corrige o default do Tailwind que deixava `text-sm` em 1.43 e
     `text-xs` em 1.33 — esmagando o `line-height: 1.6` global do `body`.
3. **Armadilha conhecida:** `text-lg`/`text-xl` trazem line-height embutido
   (1.4) que **vence** uma `leading-relaxed` companheira (mesma especificidade,
   ordem no CSS decide). Não combine `leading-*` com `text-*` esperando o
   primeiro; ajuste pelo token de `fontSize`.
4. **Hierarquia honesta:** um único `h1` por rota; `h2` seções; `h3` items.
   Nenhum `h3/div` pode ser maior que o `h1` (título grande só no hero).
   Body/paragraphs nunca virar `display: font-serif text-2xl` para "fingir" título.
5. **Overflow@390:** validar via crawler antes de subir. Falsos positivos reais:
   skip-link `sr-only` (fora da tela de propósito), `pre` de código (aceita
   scroll-x), tooltips de extensão de dev. Causa real a tratar: gráfico Recharts
   com largura fixa em container `overflow-hidden` (medir `scrollWidth`).
6. **Ritmo 4/8px:** espaçamentos verticais sempre múltiplos de 4 (`mt-1`/`mb-2`/
   `py-3`/`gap-4`). Nunca `1px` ou valores ímpares arbitrários.

### Checklist rápido antes do merge de UI

- [ ] `rg "<p className=\"text-xs"` → cada caso é rótulo legítimo ou vira `text-sm`/`<span>`
- [ ] `rg "leading-snug|leading-tight"` → só em títulos/heads de card, nunca parágrafo
- [ ] 1 `h1` por rota; nada maior que o `h1`
- [ ] crawler (viewport 1350 + re-check 390): `p lh<1.5 = 0` em todas as rotas