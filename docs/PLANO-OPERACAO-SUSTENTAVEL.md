# Plano de Operação Sustentável

Como manter A Bancada Evangélica confiável sem depender de você ficar
sempre em cima. Escrito em 2026-09-08, a partir de um levantamento real
do estado do projeto — nada aqui é aspiracional sem checar o código.

## Status (atualizado 2026-09-08, mesmo dia)

**Código: pronto e testado (133 testes, tsc limpo, build OK).**
**Operação: falta 1 tarefa manual sua (~5 min) pra ativar o alerta de verdade.**

- [x] Eixo 1 (código) — push Uptime Kuma em todo job do `sync-worker.ts`,
      frescor exposto em `/dados` (`LastSyncStatus`)
- [ ] Eixo 1 (sua parte) — **criar os 7 monitores tipo "Push" no Uptime
      Kuma e colar as URLs no `.env` do VPS** (passo a passo na seção
      "Como criar os monitores" abaixo). Sem isso, os pings não têm
      pra onde ir — não quebra nada, só não alerta ainda.
- [x] Eixo 2 (código) — expiração automática (120 dias), alerta de fila
      (>150), contagem real no painel (corrigiu undercount de UI)
- [x] Eixo 2 (decisão) — **curadoria por evento, não por calendário**
      (decidido 2026-09-08, a seu pedido — nada de ritual fixo de
      revisar toda semana; você só entra quando o alerta disparar)
- [x] Eixo 3 (documentação) — gatilhos definidos, watch list criada
- [ ] Eixo 3 (uso contínuo) — colar link na watch list quando notar
      cobertura relevante (não é uma tarefa única, é um hábito leve)
- [x] Eixo 4 — calendário eleitoral formal, nada a fazer até 01/02/2027

**O que falta pro plano estar "concluído" de verdade**: só a criação
dos monitores no Uptime Kuma. É a única peça manual que transforma
"o código já sabe alertar" em "o alerta realmente chega". O resto —
expiração, contagem, cadência de curadoria, calendário — já está rodando
ou já é decisão registrada, sem ação pendente.

## Como criar os monitores no Uptime Kuma (a única tarefa manual restante)

Uptime Kuma v1 (versão confirmada em produção: 1.23.17) não tem API pra
isso — só dá pela UI logada. 7 monitores tipo **Push**, um por variável
em `.env.example`. Nome alinhado ao padrão que você já usa no painel
(`Projeto · Componente`, ex. "Bancada · API", "Cron · Backup (push)"):

| Variável | Nome sugerido (seu padrão) | Intervalo sugerido |
|---|---|---|
| `UPTIME_KUMA_PUSH_URL_POLITICIANS` | Bancada · Sync Políticos (push) | 1440 min (24h) |
| `UPTIME_KUMA_PUSH_URL_NEWS` | Bancada · Sync Notícias (push) | 1440 min |
| `UPTIME_KUMA_PUSH_URL_SCORES` | Bancada · Recálculo de Scores (push) | 1440 min |
| `UPTIME_KUMA_PUSH_URL_EXPENSES` | Bancada · Sync Gastos (push) | 10080 min (7 dias) |
| `UPTIME_KUMA_PUSH_URL_EXPENSE_ANALYSIS` | Bancada · Análise de Despesas (push) | 10080 min |
| `UPTIME_KUMA_PUSH_URL_LOG_CLEANUP` | Bancada · Limpeza de Logs (push) | 44640 min (31 dias) |
| `UPTIME_KUMA_PUSH_URL_CURATION_QUEUE` | Bancada · Fila de Curadoria (push) | 1440 min |

Passo a passo, 7x: **Add New Monitor → Push → nome da tabela → intervalo
da tabela → Save → copiar a URL do Push → colar no `.env` do VPS na
variável correspondente.** Reiniciar o `bancada-sync-worker` depois de
colar todas.

Uma diferença de fundo pro "Cron · Backup (push)"/"Cron · Disco (push)"
que já existem: aqueles são genéricos de infra (`hetzner-infra`, um por
host, reusado por vários projetos). Estes 7 são só do Bancada — por
isso o prefixo `Bancada ·` em vez de `Cron ·`, seguindo o mesmo padrão
de "Bancada · API" e "Bancada · ML" que já estão no seu painel.

## Princípio central

**Confiabilidade não vem de "estar sempre atualizando" — vem do site
nunca fingir estar mais atual do que realmente está.**

Isso já é a lógica do M2/M3 pausados no ROADMAP ("semana sem sessão =
silêncio honesto"). Este plano generaliza esse princípio pra todo o
projeto: em vez de você carregar a responsabilidade de nunca deixar
nada ficar velho, o site carrega a responsabilidade de **avisar quando
algo está velho**. Isso resolve as duas metas ao mesmo tempo — você não
fica refém de atualizar sempre, e quem visita continua podendo confiar
no que vê (porque o que é frágil é sinalizado, não escondido).

## Diagnóstico do estado atual

### Já é automático (`scripts/sync-worker.ts`, cron)

| Job | Frequência | Desde |
|---|---|---|
| Sincronização de políticos | Diário, 03:00 | — |
| Menções na imprensa (`sync-news`) | Diário, 03:30 | 2026-09-08 (adicionado nesta sessão) |
| Recálculo de scores | Diário, 05:00 | — |
| Gastos parlamentares | Semanal, dom 04:00 | — |
| Análise de despesas suspeitas | Semanal, seg 06:00 | — |
| Limpeza de logs | Mensal, dia 1, 02:00 | — |

### Manual, sem cadência automática

- **Auditoria de filiação FPE** — ROADMAP já registra "revalidação
  trimestral manual" como pendência, mas isso nunca foi de fato
  agendado nem tem lembrete nenhum. Fica só na memória de quem mantém.
- **`PARTY_ALIGNMENT`** (base de partido em `seed-party-scores.ts`) —
  sem cadência até esta sessão. Gatilhos definidos agora (ver Eixo 3).
- **Sync TSE candidatura/receitas** — sazonal, natural que seja manual
  (só faz sentido perto de eleição), mas sem checklist de quando rodar.
- **Curadoria da fila de notícias** (`/admin/noticias`) — 100% humana
  por decisão de produto (nunca vai automatizar a decisão de
  aprovar/rejeitar), mas hoje sem cadência definida nem alerta se a
  fila crescer demais.

### A lacuna que sustenta o resto do plano

Duas coisas concretas que achei ao investigar isso:

1. **`GET /api/stats/last-sync` e `/api/stats/sync-history` já
   existem, são públicos, mas não aparecem em nenhum lugar do
   frontend.** A infraestrutura pra mostrar frescor já foi construída
   e está sem uso.
2. **Falha de cron só grava em `SyncLog` (banco) — não existe alerta
   externo nenhum.** Se um job falhar silenciosamente por dias
   (mudança na API da Câmara, bloqueio do Google News, etc.), a única
   forma de descobrir é alguém checar o banco manualmente. Comparado:
   `hetzner-infra/backup/backup.sh` já resolve exatamente esse
   problema pra backup, com um push pro Uptime Kuma
   (`UPTIME_KUMA_PUSH_URL`) — infra que já existe, já tem alerta real
   (Telegram + e-mail) configurado, e não está sendo usada aqui.

Achado incidental: `docs/GUIA-CURADORIA-DADOS.md` linha 38 ainda diz
"não existe mecanismo de curadoria manual em produção" — mas existe
desde #7 (28/08/2026). Doc desatualizado, vale corrigir quando puder
(baixa prioridade, não bloqueia nada).

---

## Os 4 eixos do plano

### Eixo 1 — Frescor público + alerta de falha (a base de tudo)

Por que vem primeiro: sem isso, os outros 3 eixos dependem de você
continuar vigiando manualmente pra saber se estão funcionando — exatamente
o que você quer deixar de fazer.

- [ ] **Expor frescor na UI.** `/dados` (DadosAbertos) ou rodapé: "Políticos
  sincronizados há Xh · Scores recalculados há Xh · Notícias buscadas há
  Xh" — dado já existe via `lastSync`/`syncHistory`, só falta consumir no
  frontend.
- [ ] **Push monitor no Uptime Kuma por job crítico.** Mesmo padrão do
  `backup.sh`: cada task do `sync-worker.ts` faz um `fetch()` pro push
  URL correspondente ao terminar com sucesso. Uptime Kuma já alerta
  (Telegram/e-mail) se o push não chegar na janela esperada — zero
  código de alerta novo, só reaproveitar infra que já roda.
- [ ] Atualizar `docs/GUIA-CURADORIA-DADOS.md` (linha 38, desatualizada).

### Eixo 2 — Capacidade de curadoria (a fila de notícias)

O gargalo real: a busca agora é automática (Eixo já resolvido nesta
sessão), mas a decisão de aprovar/rejeitar continua 100% sua, por
decisão de produto que não deve mudar (é o que garante "nunca
editorializa").

- [x] **Cadência por evento, não por calendário** (decidido 2026-09-08,
  a pedido do Rilson — sem condição de revisar com frequência fixa e
  quer evitar isso). Sem ritual pré-marcado: você só entra quando o
  alerta abaixo disparar. O sistema já tolera isso — `PENDING` nunca
  aparece pro público, então não curar por um tempo só reduz conteúdo
  publicado, nunca publica algo errado.
- [x] **Alerta de fila grande.** Implementado — `PENDING` > 150 dispara
  push `UPTIME_KUMA_PUSH_URL_CURATION_QUEUE` com status=down. Falta só
  criar o monitor no Uptime Kuma (ver "Status" no topo do documento).
- [x] **Expiração de item esquecido.** Implementado —`PENDING` há mais
  de 120 dias vira `REJECTED` automático (motivo em `SyncLog.details`).
  Roda dentro do próprio job diário de notícias, sem depender de você.
- [ ] Priorização na UI da fila: já existe filtro por fonte/busca
  (`NewsCuration.tsx`) — se o volume da eleição for grande, considerar
  ordenar por "parlamentar com menos menções aprovadas ainda" primeiro,
  pra distribuir atenção em vez de só pegar o que chegou por último.

### Eixo 3 — Cadência de revisão do `PARTY_ALIGNMENT`

Gatilhos já definidos (sessão anterior): **nova legislatura** OU
**cobertura de imprensa relevante sobre a postura de um partido**.

- [ ] **"Watch" leve pro segundo gatilho.** Seção curta (aqui mesmo,
  abaixo) só pra colar link quando você notar algo — sem precisar
  decidir na hora se vale mudar a tabela. Revisão de verdade acontece
  em lote, não item por item.
- [ ] **Processo de revisão, quando disparar** (nova legislatura ou
  acúmulo de watch-items relevantes):
  1. Revisar `PARTY_ALIGNMENT` critério por critério, com fonte nova
     citada (mesmo padrão do que já existe: DIAP, FPE, JRN/Estadão)
  2. Rodar `pnpm scores:seed` (recalcula a base de quem ainda não tem
     voto próprio) seguido de `pnpm scores:recalculate` (reaplica votos
     já sincronizados por cima)
  3. Publicar a mudança na Errata pública — é dado que move nota real
     de gente real, mesma régua da correção da FPE desta sessão
- [ ] **Watch list (colar aqui conforme notar):**
  - _(vazio — nenhum item registrado ainda)_

### Eixo 4 — Calendário eleitoral 2026/2027

| Data | Evento | Ação |
|---|---|---|
| Até 04/10/2026 | Pré-eleição | Nada muda no dado — foco em Eixo 1/2 prontos antes daqui |
| 04/10/2026 | 1º turno | Monitorar volume da fila de notícias — é o pico |
| 25/10/2026 | 2º turno (se houver) | Idem |
| ~dez/2026 | Diplomação (TSE) | Composição final conhecida — só planejamento, sem ação no banco ainda |
| **01/02/2027** | **Posse da 58ª legislatura** | **Gatilho real**, nesta ordem: |
| | | 1. Ressincronizar `politicians` (Câmara/Senado) |
| | | 2. `scores:seed` pros parlamentares novos (sem voto próprio ainda) |
| | | 3. Re-auditar filiação FPE do zero (é por legislatura — pode não existir frente registrada no dia 1, monitorar a API periodicamente) |
| | | 4. Decidir revisão do `PARTY_ALIGNMENT` (Eixo 3) — momento natural, DIAP/imprensa costuma publicar raio-x do Congresso novo nessa época |

---

## Depois de fev/2027 — rotina permanente

Uma vez os 4 eixos implementados e a transição de legislatura feita,
a operação de rotina fica assim:

- **Diário**: nada manual — cron cobre políticos, notícias, scores;
  Uptime Kuma avisa se algo falhar
- **Curadoria da fila**: nenhuma cadência fixa — só quando o alerta de
  fila grande disparar (Eixo 2). Pode passar meses sem precisar entrar.
- **Quando o Watch list (Eixo 3) acumular algo relevante, ou nova
  legislatura**: revisão de `PARTY_ALIGNMENT`
- **Trimestral**: reconfirmar que a auditoria de FPE ainda está
  correta (já era a cadência pretendida, só formalizando)

Nenhum desses itens exige "ficar de olho todo dia" — o Eixo 1 é o que
torna isso possível: se algo quebrar, você fica sabendo por alerta, não
por vigilância.
