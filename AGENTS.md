# AGENTS.md — regras de trabalho neste repo

## Regra de ouro: verificação em runtime, sempre (pedido explícito do Rilson, 2026-08-25)
Build/typecheck/testes verdes NÃO significam que a aplicação funciona. É obrigação do agente **rodar e olhar sozinho** antes de dar qualquer coisa por pronta:

1. **Verificação visual obrigatória para UI**: subir `pnpm preview`, tirar screenshots headless das telas tocadas (desktop 1350px + mobile 390px) e **LER as imagens** — overlap, texto cortado, layout quebrado, contraste. PNG ~5KB = tela branca; >50KB = pintou.
2. **Sanidade de dados obrigatória para mudanças de dados/números**: somas têm que fechar (ex.: distribuição de desempenho ≤ total de ativos; 648 notas para 514 políticos = impossível e o agente deve CAÇAR isso sozinho). Cruzar resposta da API com o banco quando possível (`ssh narniano@167.233.254.53 'docker exec postgres-shared psql ...'`).
3. **Verificação pós-deploy em produção**: DOM/screenshot da URL pública + endpoints de API tocados. Deploy local verde ≠ produção certa.
4. **Anomalias se investigam, não se ignoram**: número estranho, gráfico vazio, card sumindo — investigar causa raiz antes de seguir; reportar o que achou mesmo quando for artefato (ex.: animação do Recharts não completa sob `--virtual-time-budget`; confirmar com espera real via CDP antes de "consertar").
5. **Interação real com Radix Tabs/Sliders**: `.click()` sintético NÃO troca aba — usar CDP `Input.dispatchMouseEvent` (mousePressed/mouseReleased nas coordenadas do elemento).

## Git — lição de 2026-08-25 (quase-commit no repo errado)
- **SEMPRE passar `workdir` explícito** em todo comando git. O diretório padrão da sessão é o vault Obsidian, que é um repo git com remote próprio — `git add -A` solto ali commita coisas alheias.
- **Após todo push, conferir a linha `To github.com:...`** no output. Se o repo não for o esperado: PARAR, avisar o usuário, remediar. Nunca force-push sem autorização explícita.
- Commitar só o que foi pedido; `git add -A` apenas quando certeza do escopo do diretório.

## Ordem mínima de verificação (resumo operacional)
1. `pnpm typecheck` (app + api) — zero erros
2. `pnpm test` — 56/56 ou mais, nunca menos
3. `pnpm lint` — 0 errors (3 warnings react-refresh pré-existentes)
4. `pnpm build` — "✓ built"
5. Preview + screenshots + leitura das imagens + sanidade de números
6. Commit (workdir!) → push → conferir remote → pipelines verdes → validação em produção

Detalhes completos e armadilhas históricas: ver seção "🧯 Playbook" no ROADMAP.md.
