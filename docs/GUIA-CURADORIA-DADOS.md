# Guia de Curadoria de Dados

Como o projeto decide quais votações "contam" para cada critério — e
como você ajuda a melhorar isso.

## Como funciona hoje

`src/api/votacoes/sync-votes.ts` contém o `SCAN_RULES`: para cada um dos
5 critérios, uma lista de keywords casada contra o título/descrição da
votação. Casou → a votação entra na apuração daquele critério.

### O caso real que motivou este guia (Liberdade Religiosa)

Até 2026-08-21 as keywords do critério eram tão estreitas ("liberdade
religiosa", "intolerancia religiosa") que **nenhuma votação do Plenário
desde fev/2023 casou** — o critério mostrava 0. A investigação concluiu:
não era bug de JOIN, era vocabulário. Títulos reais falam em "símbolos
religiosos", "liberdade de culto", ou citam projetos específicos sem usar
a expressão-chave.

## Regra de ouro do projeto

**Zero honesto > número fabricado.** Nunca amplie keywords "pra aparecer
número": cada keyword nova precisa de evidência real (link de votação na
Câmara/Senado cujo título casa com ela).

## Como propor uma keyword nova

1. Encontre a votação oficial (dadosabertos.camara.leg.br) cujo título
   justifique a keyword
2. Abra PR editando `SCAN_RULES` em `sync-votes.ts`, linkando a votação
   na descrição do PR
3. O mantenedor reprocessa o sync e confere o impacto no score antes do
   merge — keywords mudam notas públicas, então toda mudança é discutida

## Sobre pautas semeadas manualmente

Pautas relevantes não casadas por keyword devem ser reportadas em issue
(com link oficial) e ficam registradas como dívida de vocabulário.

## Curadoria manual em produção (atualizado 2026-09-08)

Esta parte do guia estava desatualizada — dizia "ainda não existe
mecanismo de curadoria manual em produção", mas existe desde a #7
(2026-08-28): menções na imprensa por parlamentar (`NewsMention`), com
fila em `/admin/noticias` protegida por `ADMIN_TOKEN`. Busca automática
diária (`sync-news.ts`, cron 03:30); decisão de aprovar/rejeitar é
sempre humana, nunca automática — mesma regra de ouro deste guia, "zero
honesto > número fabricado", aplicada a notícia em vez de voto: uma
menção não citada errado é melhor que uma matéria errada publicada.
Cadência e gestão da fila (alerta de fila grande, expiração de item
esquecido) documentadas em `docs/PLANO-OPERACAO-SUSTENTAVEL.md`.
