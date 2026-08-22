# Contribuindo para A Bancada Evangélica

Obrigado pelo interesse! Este projeto é um **watchdog cívico**: calcula,
a partir de votos nominais públicos (Câmara/Senado/TSE), como a Frente
Parlamentar Evangélica vota segundo critérios objetivos. Três regras que
definem o caráter do projeto:

1. **Neutralidade partidária** — nenhum texto, código ou exemplo pode
   favorecer/criticar partido ou candidato. Monitoramos padrões de voto,
   nunca pessoas.
2. **Dados só de fontes oficiais** — Câmara, Senado e TSE. Toda
   informação tem proveniência linkada; nada de estimativa "de cabeça".
3. **Zero honesto > número fabricado** — se um critério não tem votações
   suficientes, ele mostra 0 com explicação. Nunca inflamos dado.

## Setup de desenvolvimento

```bash
pnpm install --frozen-lockfile
pnpm db:generate          # gera o client Prisma
pnpm dev                  # API + web em desenvolvimento
pnpm test                 # vitest — precisa estar verde antes do PR
pnpm lint                 # 0 erros obrigatório
```

## Como trabalhamos

- Commits e issues em **português**, estilo conventional (`fix:`,
  `feat:`, `docs:`, `chore:`)
- Todo PR descreve **o porquê**, não só o o-que
- Correção de bug SEMPRE vem com teste de regressão que falhava antes
- CI verde obrigatório (lint + testes + build das imagens)

## Onde ajuda é bem-vinda HOJE

1. **Curadoria de dados** — ampliar keywords dos critérios (guia em
   `docs/GUIA-CURADORIA-DADOS.md`)
2. **Acessibilidade** — ~80% dos componentes sem `aria-label`;
   contraste/foco/teclado nas páginas de dados
3. **Documentação** — API NestJS e serviço Python de clustering

## O que NÃO aceitamos

- Mudança de pesos/critérios da metodologia sem discussão prévia em
  issue (ela é pública e versionada)
- Conteúdo partidário, proselitismo ou tom de ataque pessoal
