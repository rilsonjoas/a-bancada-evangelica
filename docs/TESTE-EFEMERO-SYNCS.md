# Teste dos syncs do TSE em banco descartável (2026-11-02)

Os syncs `sync:tse:redes`, `sync:tse:bens` e `sync:tse:receitas` foram alterados na Fase E e nunca tinham rodado contra um banco. Esta página registra como foram testados de ponta a ponta **sem tocar na produção**, e o que se mediu. Dá para repetir antes do deploy.

## Ambiente
- Postgres 16 em contêiner descartável, dados em memória (`--tmpfs`), só em `127.0.0.1:5440`, nome `bancada-pg-efemero`. Nada a ver com os contêineres de outros projetos.
- `DATABASE_URL` e `DIRECT_URL` apontando para ele, **definidos explicitamente** (o `.env` do repositório não traz `DIRECT_URL`, e o Prisma carrega o `.env`: conferir o alvo antes de qualquer `db push`).
- Esquema criado com `pnpm db:push --skip-generate --accept-data-loss` (também prova que o `db push` das 3 colunas e da tabela nova funciona num banco limpo).
- Semeado com **dados públicos do TSE** (nada de produção): os 513 deputados federais eleitos em 2022 (com CPF, como em produção) e os 81 senadores eleitos em 2018 e 2022 (sem CPF, como em produção).

```bash
docker run -d --rm --name bancada-pg-efemero -e POSTGRES_PASSWORD=teste -e POSTGRES_DB=bancada \
  --tmpfs /var/lib/postgresql/data -p 127.0.0.1:5440:5432 postgres:16-alpine
export DATABASE_URL=postgresql://postgres:teste@127.0.0.1:5440/bancada DIRECT_URL=$DATABASE_URL
pnpm db:push --skip-generate --accept-data-loss
# semear as fichas (script de uma vez só, não versionado) e então:
pnpm sync:tse:redes --dry-run && pnpm sync:tse:redes
pnpm sync:tse:bens && pnpm sync:tse:receitas
docker stop bancada-pg-efemero   # apaga tudo
```

## O que se verificou (todos com os dados reais do TSE)
| Teste | Resultado |
|---|---|
| `db push` num banco vazio | cria `tse_social_urls`, `candidate_assets`, `source_breakdown`, `sq_candidato` |
| Redes 2022, dry-run e gravação | 513 casadas, 452 com redes (88%); gravou 452; segunda execução: 452 "já iguais", 0 gravadas (idempotente) |
| Redes 2026 depois de 2022 | 450 passam para 2026; 58 sem redes em 2026 ficam com 2022 |
| Redes 2018 depois de 2026 | 176 preservadas (ano mais novo vence), 1 gravada (não tinha nada) |
| `--ano 2025` | erro claro, nada gravado |
| Bens 2022, 2026 e 2018 | 497, 450 e 314 linhas; **hash das linhas de 2022 idêntico antes e depois de importar 2026 e 2018**; 481 pessoas com 2 ou mais eleições; 0 marcadas "sem verificação" |
| Financiamento 2022 | 513 gravados, **8 deles do DF** (via `BRASIL.csv` em streaming); 0 sem `sq_candidato` ou sem divisão por origem; soma das categorias = total (diferença máxima de ~5e-10) |
| Financiamento 2026 | **recusado**: 33,4% final, nada gravado |
| Financiamento 2018 | 99,3% final; 324 gravados; 2022 intacto |
| API `findOne` (serviço real) | financiamento com 7 categorias, bens com grupos, redes com origem `TSE`, nenhum JSON cru vazando; listagem funciona |
| `--senadores` em bens, redes e receitas | 2022: 27 de 81 fichas casadas; 2018: 57 de 81; senadores com bens 2022 (27) e 2018 (56), financiamento 2022 (27, R$ 96,6 mi), redes (27); **0 CPFs de senador gravados** |
| Interruptores de ano na API | padrão: só 2022, sem histórico; `BANCADA_ANOS_BENS=2022,2026`: histórico com 2 eleições; valor inválido: cai no padrão e avisa no log |

## O que este teste NÃO prova
- Foi feito com 513 deputados eleitos em 2022 e 81 senadores, **não** com as 733 fichas reais de produção (que têm suplentes, ex-deputados e dados de outras origens). Os números de produção esperados continuam sendo os da seção 7 do levantamento (redes 563, bens 619, financiamento 502 para a Câmara).
- Não testa o deploy, o cron nem a carga da API.
- Não substitui conferir 3 fichas à mão contra o TSE depois da importação real.
