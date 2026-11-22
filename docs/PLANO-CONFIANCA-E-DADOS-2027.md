# Plano de confiança e dados: fontes verificáveis, redes sociais, bens e origem dos recursos

**Escrito em:** 2026-11-01. **Status:** proposta, nada implementado. Depende de aprovação do Rilson para cada fase.
**Relação com outros planos:** complementa `PLANO-POS-ELEICAO.md` (que decide ranking × ficha e cobre tramitação e a 58ª legislatura). Nenhuma fase abaixo muda fórmula, classificação ou nota. Tudo vai para a ficha, fora da nota.

## 1. Medições feitas em 2026-11-01

Fontes: API pública (`api-bancada.narniano.com`, 598 fichas) e os zips do TSE em `data/tse/` mais o `rede_social_candidato_2022.zip` baixado hoje.

| Item | Resultado |
|---|---|
| Financiamento 2022 na ficha | 494 de 513 deputados; 0 de 85 senadores (o zip de 2022 só cobre 27 senadores) |
| Despesas | Câmara: 101 de 513 com dado; Senado: 73 de 85. Entre as 174 fichas com dado, 50 têm `riskLevel: HIGH` (conferir como aparece na tela) |
| Maior doador / total recebido | Mediana de 87%; em 436 das 494 fichas passa de 50%. O maior doador é o próprio partido. Estimativa por nome, não por origem |
| Bens declarados 2022 | 524 de 540 eleitos (DF + Sen) têm ao menos um bem. Mediana R$ 1,07 mi, máximo R$ 158 mi |
| Redes sociais no TSE 2022 | 479 de 540 eleitos (89%) declararam ao menos uma. 44.931 URLs no país, texto livre |
| Redes sociais já no banco | `social_media_urls` é preenchido por `sync-camara.ts` e `sync-senado.ts`, mas **a API não devolve e a tela não mostra** |
| Links de fonte na ficha | Nenhum link por dado. Só a Metodologia e o rodapé citam as fontes |

## 2. Respostas às perguntas

### BrasilAPI ajuda?

Hoje, não vale integrar.

- `/cnpj/v1/{cnpj}` devolve razão social, situação cadastral e sócios. Os doadores PJ que guardamos têm documento **mascarado** (decisão de minimização de dados), então nem dá para consultar. E o topo dos doadores é órgão partidário. O quadro societário (QSA) é o cruzamento acusatório que decidimos não fazer.
- `/eleicoes/candidaturas` exige município, cargo, eleição e ano. Foi feita para eleição municipal e não traz bens, receitas ou redes.
- IBGE, feriados, CEP, FIPE e câmbio não têm uso aqui. `/cpf/v1` só valida formato, e não devemos tocar em CPF completo.
- É um projeto comunitário. Colocar no caminho crítico seria somar um ponto de falha sem ganho.

Revisitar só se entrar uma camada de fornecedores de despesa. Aí o CNPJ ajuda a mostrar "nome oficial e situação cadastral".

### Linkar as redes sociais do TSE?

Sim, com regras. A fonte principal deve ser a oficial do mandato, e o TSE entra como complemento.

- **Câmara e Senado primeiro.** O campo `redeSocial` da Câmara é do mandato atual e já está no banco. O TSE é autodeclarado em 2022, e o arquivo tem lixo: Orkut, Flickr, dois perfis de Facebook quase iguais para a mesma pessoa.
- **Lista de plataformas aceitas:** Instagram, Facebook, X/Twitter, YouTube, TikTok, Kwai, Telegram, LinkedIn e site pessoal. O resto (Orkut, Flickr etc.) fica fora.
- Só `https`, sem parâmetros de rastreio (`utm_*`, `si`, `t`, `igshid`), no máximo um perfil por plataforma (menor `NR_ORDEM_REDE_SOCIAL`), e a origem aparece: "Informado pela Câmara" ou "Declarado ao TSE em 2022".
- `rel="noopener noreferrer nofollow"`, ícone simples, nenhum widget ou script de terceiro (privacidade do leitor).
- Botão "link errado?" levando ao canal de errata que já existe. Não dá para checar link quebrado automaticamente: as plataformas bloqueiam robôs.
- Não ler nem classificar conteúdo de post. Isso contraria "zero honesto > número fabricado".

### Links para o leitor conferir os dados?

Sim, e é a mudança de maior retorno em confiança. O "Verifique você mesmo" vai em cada bloco da ficha:

- Votos: página do deputado na Câmara / senador no Senado e endpoint da votação (os mesmos que o sync consome).
- Financiamento e bens: DivulgaCandContas do TSE, com o `SQ_CANDIDATO`.
- Despesas: portal da cota parlamentar de cada casa.
- Cada link vem com "fonte, data de captura" (`DT_GERACAO` do arquivo ou `capturedAt` do sync).

Limite importante: o link confirma o dado de origem, **não a nota**. A nota é cálculo nosso. O texto do bloco diz isso e aponta para a Metodologia.

**Padrões de URL a conferir no navegador antes de usar** (não consegui validar por script, o DivulgaCandContas é uma SPA):
- `https://divulgacandcontas.tse.jus.br/divulga/#/candidato/2022/{CD_ELEICAO}/{UF}/{SQ_CANDIDATO}`
- `https://www.camara.leg.br/deputados/{id}`
- Perfil do senador e página de despesas de cada casa.

## 3. Princípios (valem para todas as fases)

1. Todo número na tela tem fonte, data e link. Se não tiver, não entra.
2. A ficha diz o que **não** medimos.
3. Dado autodeclarado é rotulado como autodeclarado. Valor absurdo (erro de digitação) é sinalizado como "valor declarado sem verificação", nunca reescrito.
4. Camadas novas ficam fora da nota e podem ser desligadas por chave.
5. Nenhuma frase que sugira irregularidade a partir de cruzamento automático.
6. Toda camada nova entra automatizada, monitorada, com chave de desligar e um documento. Sem os quatro, não entra.

## 4. Fases

Ordem pensada para ir do mais barato e reversível ao que exige migração.

### Fase A: "Verifique você mesmo" (esforço: pequeno, ~1 dia)

**Andamento (2026-11-01, nada commitado nem no ar):**
- [x] A1. `buildPoliticianProfileLink` em `src/lib/sources.ts` (arquivo que já existia, ampliado em vez de criar `fontes.ts`). Perfis da Câmara e do Senado conferidos com HTTP 200. A URL `/cota-parlamentar` da Câmara deu 404 e **não** foi usada.
- [x] A2. API devolve `legislatureId` na ficha. Em produção, 733 de 733 fichas têm o `legislature_id` preenchido, só dígitos, sem duplicata (consulta somente leitura, 2026-11-01).
- [x] A3. Componente `SourceCheck`, mostrado no fim do card "Histórico de Votações Recentes" (aba Votações). Sem link válido, não renderiza nada. Só `https`.
- [x] A4. Catálogo `FONTES_DE_DADOS` (`sources.ts`) e seção "De onde vem cada dado" em `/dados`.
  **Mudança de desenho:** em vez de uma página `/fontes` nova, a seção entrou em `/dados`, que já tem CSV, trilha de auditoria, checksum e errata. Um terceiro lugar para citar fontes duplicaria o que existe. O texto não diz que "tudo é oficial": cita o Google Notícias e a estimativa pelo histórico do partido.
  **Mudança de desenho:** o bloco da ficha não é recolhido. Com uma frase e um link, recolher só esconderia a conferência.
- [ ] A5. Links por bloco para financiamento e bens (DivulgaCandContas). O `SQ_CANDIDATO` já é guardado (Fases C e D). **Bloqueado: não consegui confirmar o padrão de URL.** O DivulgaCandContas responde 403 (Access Denied, proteção anti-robô) tanto à API REST (`/divulga/rest/v1/candidatura/buscar/...`) quanto a um navegador automatizado nesta máquina; a busca na web não achou documentação do link direto. Para destravar, só você: abrir um candidato de 2022 no navegador normal e me mandar a URL da barra de endereço (sugestão: Marina Silva, SP, `SQ_CANDIDATO` 250001613818, eleição 546). Sem isso, não se publica link nenhum.
- [x] A6. `buildExpenseLink` + bloco "Verifique você mesmo" na aba Gastos (aparece mesmo sem dado de despesa, que é quando o leitor mais precisa). Câmara: `https://www.camara.leg.br/transparencia/gastos-parlamentares?deputado={id}`; Senado: `https://www6g.senado.leg.br/transparencia/sen/{cod}/`. **Verificado em 2026-11-02:** os 85 senadores ativos e 26 deputados de amostra respondem 200 e a página traz o nome do parlamentar certo; um id inexistente na Câmara não traz nome. A URL `/deputados/{id}/cota-parlamentar` dá 404 e não é usada. O texto diz que a marcação de gastos fora do padrão é cálculo nosso. Amostra de deputados: 26 de 513, não todos.
- [x] A7 / E1. `pnpm registrar:fontes --gravar` (`scripts/registrar-fontes.ts`, lógica em `scripts/lib/capturas.ts`, 23 testes entre lógica e tela) calcula o SHA-256 de cada zip de `data/tse/` (inclusive subpastas) e grava `src/lib/capturas.ts` (arquivo gerado, versionado no git). `/dados` mostra a seção recolhida "Arquivos de origem e seus hashes (SHA-256)" (`ArquivosDeOrigem.tsx`): tipo, ano, data de captura, tamanho, link do TSE quando se sabe a origem, observação e o hash inteiro em linha própria (selecionável, não cortado em tela de 375 px). Primeiro registro: 13 arquivos. **Desvio do plano, de propósito:** em vez de tabela no banco, o registro é um arquivo versionado: não exige migration (menos risco de deploy), o histórico fica no git e a página não depende de endpoint novo. O texto diz que hash diferente costuma ser republicação do TSE, não adulteração (aconteceu com os de 2022), e que a lista registra o que foi baixado, não necessariamente o que já alimenta o site. Os baixados em agosto ficam sem endereço de download (não foi anotado) em vez de um palpite.

**Antes do deploy:** conferir a ficha de um deputado e de um senador em produção, clicar no link do bloco e confirmar que abre o parlamentar certo. Rodar a consulta de preenchimento de `legislature_id` de novo.

### Fase B: Redes sociais (esforço: pequeno a médio, ~2–3 dias)

**Andamento (2026-11-01, nada commitado nem no ar):**
- [x] B1. Sanitizador `src/api/politicians/social-links.ts` + `socialLinks` na ficha (`findOne`). 68 testes do sanitizador (casos reais de produção), 5 de integração. Verificado por mutação (4 regras quebradas de propósito, todas pegas) e contra os 733 registros reais. Relatório em `AUDITORIA-REDES-SOCIAIS-2026-11-01.md`.
  - A API **não** devolve o JSON cru; só a lista sanitizada.
  - Achado: o formato real é `{redes:[...]}` (Câmara, 60% das fichas) e `{website}` (Senado, 22%), diferente do comentário do schema.
  - Achado: 27 de 158 links de YouTube (17%) dão 404. Decisão pendente (ver seção 7).
- [x] B2 (código e testes; FALTA aplicar a coluna e rodar a importação no banco de produção, ver pendência 6 e conferências 26-28). Coluna nova `politicians.tse_social_urls Json?` (aditiva, anulável), em coluna própria porque `sync-camara`/`sync-senado` regravam `social_media_urls` inteiro. `scripts/sync-tse-redes.ts` (`pnpm sync:tse:redes --dry-run`) casa por CPF (`consulta_cand_2022` × `politicians.cpf`), guarda as URLs cruas `{ano:2022, redes:[...]}` e aborta se a coluna não existir. A API sanitiza na leitura, com o mesmo sanitizador e a mesma lista de ocultos; a Câmara/Senado tem prioridade e o TSE só preenche redes que faltam (`origin: 'TSE'`, e o texto da ficha cita "ao TSE, na candidatura de 2022"). 13 testes novos na lógica de importação e 11 no sanitizador/serviço/componente.
  - **Medido com dados reais** (733 fichas de produção, CPF só como hash, nada gravado): 648 fichas da Câmara casam com candidatura 2022; 563 têm redes no TSE (2.358 URLs); o sanitizador descarta 711 (TikTok 173, Telegram 29, LinkedIn 27, Flickr 12, Gettr 9, links de login, `instagran.com` etc.: redes que o site não exibe ou lixo, nenhum perfil das 4 redes aceitas perdido). 322 fichas ganham uma plataforma nova, 210 delas não tinham nenhum link. Em 250 casos o TSE traz outro perfil da mesma rede que a Câmara; vale o da Câmara.
  - **Efeito final na ficha:** links 1.154 → 1.874; fichas com ao menos um link 410 → 620 de 733 (85%). 720 links vêm do TSE.
  - **Auditoria de links refeita incluindo o TSE:** 356 links de YouTube, 320 ok, 36 quebrados (+9 novos, todos 404 duplos), 0 inconclusivos. `links-quebrados.ts` agora tem 36.
  - **Não cobre o Senado:** o banco não tem CPF de senador (0/85) e não se casa por nome. Fica para a Fase E.
  - **Limite:** são redes declaradas pelo candidato em 2022; podem estar desatualizadas (o auditor só pega YouTube) e o site não confere o conteúdo.
  - **Risco de deploy (leia):** como o Prisma lê todas as colunas, subir o código novo ANTES de `prisma db push` derruba a ficha e a lista de todo parlamentar. A ordem é: `db push` (coluna anulável, aditiva) → deploy → `sync:tse:redes`.
- [x] B3. `src/components/common/RedesSociais.tsx` no cabeçalho da ficha (abaixo de partido/UF/e-mail). Cada link tem ícone E nome da rede, 44 px de altura, `target=_blank` com `rel="noopener noreferrer"` e aviso `(abre em nova aba)` para leitor de tela. Texto fixo: "Perfis informados à Câmara/ao Senado. Abrem em outro site; não conferimos o que é publicado neles." Não renderiza nada sem links; só `https` (http só para site pessoal do Senado). Sem contadores, seguidores ou destaque: só o link. 5 testes; verificado com Playwright em 1100 px e 375 px (sem overflow, links de 44 px) e com lista vazia (seção ausente). Revisão ética: nenhum número na tela, nenhum default, nada que empurre o usuário; a única afirmação é de origem do link, que é verdadeira.
- [x] B4. `pnpm auditar:links` (`scripts/auditar-links.ts`, lógica em `scripts/lib/auditar-links.ts`, 21 testes). Lê as redes do banco (ou de `--entrada arquivo.json`), consulta só os links de YouTube com `curl` (o `fetch` do Node falha com "Headers Overflow" nas respostas 200 do YouTube) e grava `src/api/politicians/links-quebrados.ts` com `--gravar`. Só esconde com 404/410 em DUAS consultas (navegador e idioma diferentes, 30 s de intervalo); timeout, 403, 429 e 5xx são "inconclusivo" e o link continua aparecendo. Quem voltou a responder 200 sai da lista; recusa rodar com menos de 500 fichas. Primeira rodada (733 fichas de produção, 158 links): 131 ok, 27 quebrados, 0 inconclusivos; os 27 são exatamente os da auditoria manual. Efeito na API: 1.181 → 1.154 links, YouTube 158 → 131, fichas com algum link continuam 410. Teste de mutação: relaxar a regra de duas consultas e incluir 403 como ausência quebram testes, os dois pegos. `buildSocialLinks` também passa ao link seguinte da mesma rede quando o primeiro está na lista. **Rodar de novo antes de cada deploy relevante e a cada atualização da Câmara.**

**Plano original da fase, mantido como referência:**
- Passo 1: a API devolve `social_media_urls` já gravado, passando pelo sanitizador (lista de plataformas, `https`, sem rastreio).
- Passo 2: `scripts/sync-tse-redes.ts` lê o `rede_social_candidato_2022.zip`, liga `SQ_CANDIDATO` → CPF → parlamentar (mesma ligação do `sync-tse-candidatura.ts`) e grava só plataformas ausentes na fonte oficial. Exige coluna ou tabela nova, com `origem` e `capturado_em`.
- Passo 3: linha de ícones no topo do perfil, com a origem no `title`.
- Testes: sanitizador (Orkut, `http`, parâmetros de rastreio, URL malformada) e "oficial vence TSE".
- Medir antes e depois: % de fichas com ao menos uma rede. Meta: acima de 90% da Câmara.
- Cuidado já aprendido: ao adicionar coluna, conferir toda função SQL, DTO e mapper manual da entidade, e conferir o endpoint real em produção depois do deploy. O CI verde não prova que a migration rodou.

### Fase C: Origem dos recursos de campanha (código e testes prontos em 2026-11-02; falta aplicar no banco)
Medido nas receitas de 2022 de deputados federais e senadores (10.662 candidatos, R$ 3,60 bi), com os dois campos do TSE `DS_FONTE_RECEITA` (tipo de fundo) e `DS_ORIGEM_RECEITA`:
fundo eleitoral (FEFC) 80,2%, pessoas físicas 8,9%, fundo partidário 6,4%, recursos próprios 2,2%, outros recursos do partido 1,8%, repasses de outros candidatos 0,2%, outras 0,2%. Nenhuma origem de pessoa jurídica aparece (empresas não podiam doar em 2022).
- [x] Categorias que não se sobrepõem, em `categorizarReceita` (`scripts/lib/tse-receitas.ts`). O fundo vence a origem (FEFC repassado por outro candidato continua sendo fundo eleitoral). Origem desconhecida vai para "outras" e nunca some: a soma das categorias é sempre o total.
- [x] Colunas novas em `campaign_finance` (aditivas, anuláveis): `source_breakdown Json?` e `sq_candidato String?` (o `SQ_CANDIDATO` fica guardado para o A5).
- [x] `sync-tse-receitas.ts` grava os dois campos. Rodar de novo (`pnpm sync:tse:receitas --dry-run`, depois sem a flag) para preencher quem já está no banco.
- [x] API: `campaignFinance.bySource` (camelCase) só sai se as 7 categorias existem, são números não negativos e a soma bate com o total arrecadado (tolerância R$ 1). Caso contrário `null`, e a ficha não mostra a divisão.
- [x] Ficha (`OrigemDosRecursos.tsx`): frase "N% do dinheiro da campanha veio de fundos públicos", barra com descrição para leitor de tela, lista com valor, % (inteiros que somam 100; origem minúscula aparece como "menos de 1%") e uma frase por categoria. Aviso fixo de que fundo público é a regra e não indício de irregularidade. Sem cor de alerta.
- [x] Rebaixado: "Maior doação" saiu do card; "N jurídicas" saiu da linha de doadores (em 2022 eram diretórios de partido, e a leitura natural era "empresas doaram"); a lista de maiores doadores ficou recolhida num `<details>` com o título "Maiores origens individuais (inclui o próprio partido)". O campo `largestDonation` continua na API.
- **Achado grave, corrigido no código:** o zip de 2022 traz 26 arquivos por estado e **nenhum do DF**; o sync lia só os por estado, então os **8 deputados do DF estavam com 0 financiamento em produção** (confirmado por consulta somente leitura: DF 8 ativos, 0 com financiamento; os outros 11 sem financiamento são suplentes/não candidatos). Agora o sync lê, em streaming, as linhas do `BRASIL.csv` só dos estados sem arquivo próprio (sem contar duas vezes). Conferido contra cálculo independente em Python: DF = 3.367 linhas, 228 candidatos (deputado federal e senador), R$ 89,99 mi, igual nos dois; memória ~144 MB. Cobertura esperada depois do reimport: 494 → 502 de 513.
- Verificação: soma por categoria = total em todos os 10.434 candidatos dos arquivos por estado (0 que não fecham); total R$ 3.507,84 mi + DF 89,99 mi = 3.597,83 mi, igual ao cálculo independente. Teste de mutação: 4 regras quebradas de propósito (origem vencendo o fundo, BRASIL sem filtro de estado, API aceitando soma que não fecha, arredondamento simples dos percentuais), os 4 pegos.
- [ ] Ainda não feito: cobrir senadores (sem CPF no banco; Fase E, com 2018 para os 54 senadores).
- [ ] Ainda não feito: a ficha mostra o "Maiores origens individuais" recolhido, mas o texto "Fonte: TSE" ainda não tem link por candidato (A5).

### Fase D: Bens declarados (código e testes prontos em 2026-11-02; falta aplicar no banco)
- [x] Tabela nova `candidate_assets` (aditiva), uma linha por parlamentar e eleição (`@@unique([politician_id, election_year])`, então 2018 e 2026 entram sem mudar o desenho): `total_declared`, `item_count`, `largest_item`, `by_type` (7 grupos), `unverified`, `sq_candidato`. **Descrição livre dos bens não é lida nem guardada.**
- [x] Grupos pelo código do tipo do TSE (`grupoDoBem`): imóveis (1-3, 11-19), veículos e outros bens móveis (21-29), participações em empresas (31-39), aplicações e fundos (41-49, 71-79, 97), créditos (51-59), dinheiro e depósitos (61-69), outros. Código desconhecido vai para "outros": a soma dos grupos é sempre o total.
- [x] Trava de sanidade: total > R$ 1 bi ou algum item > R$ 500 mi marca `unverified`. A API então devolve `total: null` e `byType: null` (o número não sai), e a ficha explica que o valor está acima do limite do site para exibir sem checagem. **Em 2022 a trava não disparou em nenhum deputado ou senador** (maior total R$ 158,2 mi, maior item R$ 154,5 mi); fica como proteção para 2026, onde há risco de erro de digitação.
- [x] Casamento: `SQ_CANDIDATO` do arquivo de bens -> CPF em `consulta_cand_2022` -> `politicians.cpf`. Só Câmara (sem CPF de senador no banco).
- [x] Ficha (`BensDeclarados.tsx`, card "Bens declarados (2022)" na mesma aba do financiamento): total declarado, número de bens e divisão por grupo com percentuais que somam 100. Aviso fixo: "Valores declarados pelo próprio candidato ao TSE em 2022. Não são valor de mercado e não foram auditados por nós. Não afetam a nota." Sem ranking, sem "mais rico", sem comparação entre parlamentares, sem "enriquecimento" (teste automático falha se esses termos aparecerem). Sem dado: texto honesto de que em geral é suplente que não disputou 2022.
- [ ] **Evolução entre eleições: não feita, de propósito.** Só existe 2022. Só se mostra quando houver duas eleições comparáveis (2018 no Senado e 2026), como valores brutos lado a lado, sem cálculo de crescimento.
- **Medido com dados reais:** 6.991 candidatos a deputado federal/senador com bens, 38.117 itens, R$ 8.259,06 mi no total; a lib e um cálculo independente em Python dão exatamente os mesmos números. Casando com as 733 fichas de produção (CPF só como hash, nada gravado): 648 fichas da Câmara casam com candidatura 2022, **619 têm bens declarados (95,5%)**, mediana R$ 1,0 mi, máximo R$ 158,2 mi, 0 marcadas sem verificação.
- Teste de mutação: 4 regras quebradas de propósito (código 97, limite do item, API vazando o total sem verificação, valor negativo somando), as 4 pegas.
- Verificação visual com Playwright em 1100 px e 375 px, nos 4 estados (normal, sem verificação, sem dado, mobile): sem overflow.

### Fase E: Ingestão 2026 e 58ª legislatura (levantamento feito em 2026-11-02; nada ingerido)
Resultado completo em `docs/LEVANTAMENTO-INGESTAO-2026-11-02.md`. Em resumo:
- O TSE já publicou 2026 (candidatura, bens, redes e prestação de contas) e 2018, e o CDN respondeu desta máquina. **O resultado já está nos dados: 513 deputados federais e 54 senadores eleitos.**
- **Renovação:** 320 dos 513 deputados atuais foram reeleitos e há 202 rostos novos entre os eleitos; entre os 54 senadores eleitos, 14 são atuais e 40 são novos.
- **A prestação de contas de 2026 ainda não é final** (51% "relatório financeiro", 33% "final", 15% "parcial"): não mostrar como final (decisão D1).
- **Armadilhas achadas:** o rótulo da eleição muda de caixa entre arquivos (filtrar errado devolve zero sem erro); os arquivos de 2022 foram republicados (números das Fases C e D continuam valendo); `data/tse/2026/` aparecia como não rastreado no git (corrigido no `.gitignore`).
- **Decisões abertas:** D1 financiamento 2026, D2 quais eleições na ficha, D3 chave para casar senadores, D4 rostos novos antes da posse (ver o levantamento).
- Execução proposta (E1 a E6) no levantamento: registro de captura, syncs por ano sem sobrescrever 2022, senadores, service sem 2022 fixo, 2018, rostos novos. `DRY_RUN` e snapshot do banco antes de gravar; nenhuma ingestão pesada no VPS junto com builds; nenhum push ou deploy sem sua autorização.
- Prazo duro: 01/02/2027.

### Fase F: Governança de confiança (contínua)
- Changelog público da metodologia (aproveitando `formulaVersion`).
- Dados abertos baixáveis (JSON/CSV) com data e hash.
- Convidar uma pessoa de fora (cientista político ou jornalista de dados) para criticar a metodologia publicamente. É a medida mais barata e mais convincente.
- Revisar o `riskLevel: HIGH` das despesas à luz do passe de honestidade.

## 5. Não fazer

- Cruzamento sócio × candidato, doação circular, fracionamento, "empresa de fachada".
- IA para classificar posts ou perfis.
- Mostrar CPF/CNPJ completo (a minimização continua).
- Integrar BrasilAPI no caminho crítico.
- Embutir widgets de redes sociais.
- Chamar de "verificação" um link que não confirma o número mostrado.
- `git add -A` neste repo (há arquivos de outra pessoa na árvore).

## 6. Capacidade de uma pessoa

Fases A e B juntas cabem em poucos dias e não tocam em nota nem em dado sensível. C e D pedem migration e merecem cada uma sua semana de observação. E é a única com prazo duro (01/02/2027). F é hábito, não tarefa.

Estimativas são minhas, não medidas. Revisar depois da Fase A para calibrar.

## 7. Pendências oficiais (atualizado em 2026-11-01)

Legenda: **[D]** decisão sua · **[T]** trabalho técnico · **[C]** conferência antes do deploy.

### Decisões suas
1. ~~**[D] Links de YouTube comprovadamente quebrados (27 de 158).**~~ DECIDIDO em 2026-11-01: esconder (seção 9). Original: Opções: (a) mostrar tudo como a Câmara informa; (b) esconder os que derem 404 numa auditoria offline, mantendo uma lista versionada. Recomendação: (b), porque um link morto numa página que pede confiança custa mais do que a ausência do ícone. Bloqueia B3.
2. **[D] Ranking × ficha** (herdada de `PLANO-POS-ELEICAO.md`). Não bloqueia A e B, mas define a ordem das fases seguintes e a home.
3. **[D] Aprovar migrations.** B2 (redes do TSE), C (origem dos recursos) e D (bens) exigem colunas ou tabelas novas e guardar o `SQ_CANDIDATO`.
4. **[D] Quando commitar, fazer push e fazer deploy.** Hoje nada foi commitado. Os arquivos estão listados na seção 8.
5. **[D] Convidar um revisor externo** (cientista político ou jornalista de dados) para criticar a metodologia publicamente (Fase F).

### Trabalho técnico pendente
6. ~~**[T] B2, parte que falta:**~~ FEITO em 2026-11-21. `sync:tse:redes` rodado contra o banco de produção: 563 fichas com redes oficiais gravadas em `politicians.tse_social_urls`.
7. ~~**[T] B3** Linha de ícones na ficha.~~ FEITO em 2026-11-02 (só local). Conferência pré-deploy: em produção, abrir uma ficha de deputado com redes e uma de senador com site, e clicar em um link de cada.
8. ~~**[T] B4** Script offline de auditoria de links.~~ FEITO em 2026-11-01. Nova pendência: **[C]** rodar `pnpm auditar:links` contra o banco de produção (e não só contra o snapshot) antes do deploy, e rodar de novo a cada atualização da Câmara.
9. **[T] A5** Links de financiamento e bens para o DivulgaCandContas (depende de guardar `SQ_CANDIDATO`).
10. ~~**[T] A6** Link de despesas.~~ FEITO em 2026-11-02, verificado. Conferência pós-deploy: abrir a aba Gastos de um deputado e de um senador e clicar no link.
11. ~~**[T] A7** SHA-256 por arquivo de fonte.~~ FEITO em 2026-11-02 (E1). A cada download novo: `pnpm registrar:fontes --gravar` e revisar o diff. Conferência pós-deploy: abrir `/dados`, expandir a seção e conferir 1 hash com `sha256sum`.
12. ~~**[T] C** Origem dos recursos de campanha por `DS_ORIGEM_RECEITA`; trocar o destaque de "maior doação".~~ FEITO em 2026-11-21: `sync:tse:receitas` rodado em produção (513 parlamentares gravados com divisão por origem auditável).
13. ~~**[T] D** Bens declarados com trava de sanidade.~~ FEITO em 2026-11-21: `sync:tse:bens` rodado em produção (620 parlamentares gravados na tabela `candidate_assets`).
14. **[T] E** Ingestão 2026 + 2018 (Senado), `DRY_RUN`, snapshot e hash. Prazo duro: 01/02/2027.
15. ~~**[T]** Cobertura de financiamento do Senado~~ FEITO em 2026-11-21: casamento de senadores por `nome + UF + nascimento` (sem gravar CPF) executado para 2022 e 2018; 72 senadores ativos com bens cobertos e 26 com financiamento de 2022.
16. **[T]** Despesas da Câmara: 412 de 513 fichas sem dado.
17. ~~**[T]** Corrigir o comentário de `prisma/schema.prisma` sobre `social_media_urls`.~~ FEITO em 2026-11-02 (junto com B2).
18. ~~**[T]** Revisar o `riskLevel: HIGH` das despesas~~ FEITO em 2026-11-21: D5 adotado com `RISK_BASIS = 'contagem'`, alinhado à contagem do medidor.
19. ~~**[T]** Em `DadosAbertos.tsx` há `<a href="/errata">` e `<a href="/metodologia">` que recarregam a página~~ FEITO em 2026-11-02.
20. **[T]** Lint: 8 avisos pré-existentes. `baseline-browser-mapping` desatualizado (dev). Não relacionados a este trabalho.

### Conferências antes do deploy
21. **[C]** Em produção, abrir a ficha de um deputado e a de um senador, clicar em "Ver perfil" e confirmar que abre a pessoa certa.
22. **[C]** Repetir a consulta de `legislature_id` (hoje 733/733 preenchidos, só dígitos, sem duplicata).
23. **[C]** Conferir `GET /api/politicians/{id}` em produção: devolve `legislatureId` e `socialLinks`, e **não** devolve `social_media_urls`.
24. **[C]** Conferir que o CI rodou verde e que a página `/dados` mostra a seção "De onde vem cada dado".
25. **[C]** A leva agora TEM mudança de schema (B2 e C: 3 colunas anuláveis: `politicians.tse_social_urls`, `campaign_finance.source_breakdown`, `campaign_finance.sq_candidato`). Antes de subir o código: `db push` em produção e conferir que a coluna existe (`\d politicians`). Depois do deploy, conferir o endpoint real (`GET /api/politicians/{id}` e a lista), não só o CI.
26. **[C]** Depois de `sync:tse:redes`: contar `SELECT count(*) FROM politicians WHERE tse_social_urls IS NOT NULL` (esperado ~563) e abrir 3 fichas (uma só com rede do TSE, uma com Câmara + TSE, uma sem nada).
27. **[C]** Rodar `pnpm auditar:links` contra o banco de produção depois da importação (a lista versionada foi gerada sobre o snapshot) e revisar o diff.
28. **[C]** Conferir em 3 fichas, à mão, que o perfil do TSE é da pessoa certa (o casamento é por CPF, mas a ficha mostra o link sem conferir o conteúdo).
29. **[D, futuro]** TikTok (173 links) e Telegram (29) aparecem no TSE e hoje são descartados. Decidir se entram como redes exibidas; exige novas regras de sanitização e teste de mutação.

## 8. Arquivos da leva atual (todos não commitados)

Alterados: `package.json` (scripts `auditar:links` e `sync:tse:redes`), `prisma/schema.prisma` (coluna `tse_social_urls`; comentário de `social_media_urls` corrigido), `src/api/politicians/politicians.service.ts`, `src/hooks/usePoliticianDetail.ts`, `src/lib/sources.ts`, `src/pages/DadosAbertos.tsx`, `src/pages/PoliticianProfile.tsx`.

Novos (preparo D1-D5): `src/api/politicians/risk-level.ts`, `src/api/politicians/anos-exibidos.ts`, `src/lib/gruposBens.ts`, `src/components/common/EvolucaoBens.tsx`, `scripts/lib/senadores-tse.ts`, `scripts/lib/consulta-cand-io.ts`, `docs/TESTE-EFEMERO-SYNCS.md` e os testes `risk-level`, `anos-exibidos`, `EvolucaoBens`, `senadores-tse`; alterados: `politicians.service.ts`, `usePoliticianDetail.ts`, `BensDeclarados.tsx`, `PoliticianProfile.tsx`, `ExpenseAnalysisChart.tsx`, `DadosAbertos.tsx`, `eslint.config.js`, os três `sync-tse-*.ts`.
Novos (E2/E3): `scripts/lib/tse-eleicao.ts`, `scripts/__tests__/tse-eleicao.test.ts`, `scripts/lib/casar-senadores.ts`, `scripts/__tests__/casar-senadores.test.ts`, `docs/SENADORES-CONFERENCIA-2026-11-02.md`; alterados: `scripts/sync-tse-redes.ts`, `scripts/sync-tse-bens.ts`, `scripts/sync-tse-receitas.ts`, `scripts/lib/capturas.ts`, `scripts/__tests__/capturas.test.ts`, `src/lib/capturas.ts` (gerado).
Novos (E1): `scripts/registrar-fontes.ts`, `scripts/lib/capturas.ts`, `scripts/__tests__/capturas.test.ts`, `src/lib/capturas.ts` (gerado), `src/components/common/ArquivosDeOrigem.tsx`, `src/components/common/__tests__/ArquivosDeOrigem.test.tsx`; alterados: `package.json` (`registrar:fontes`), `src/pages/DadosAbertos.tsx`.
Novos (Fase E, levantamento): `docs/LEVANTAMENTO-INGESTAO-2026-11-02.md`; alterados: `.gitignore` (`data/tse/**/*.zip`), `docs/CAPTURA-DE-FONTES.md`.
Novos (A6/A7): `docs/CAPTURA-DE-FONTES.md`. Alterados em A6: `src/lib/sources.ts`, `src/lib/__tests__/sources.test.ts`, `src/components/common/SourceCheck.tsx` (prop `calculo`), `src/components/common/__tests__/SourceCheck.test.tsx`, `src/pages/PoliticianProfile.tsx`.
Novos (Fase D): `scripts/sync-tse-bens.ts`, `scripts/lib/tse-bens.ts`, `scripts/__tests__/tse-bens.test.ts`, `src/api/politicians/assets.ts`, `src/components/common/BensDeclarados.tsx` e os testes `src/api/politicians/__tests__/assets.test.ts`, `src/components/common/__tests__/BensDeclarados.test.tsx`. Alterados na Fase D: `prisma/schema.prisma` (tabela `candidate_assets`), `package.json` (`sync:tse:bens`), `politicians.service.ts`, `usePoliticianDetail.ts`, `PoliticianProfile.tsx` e `politicians.campaign-sources.test.ts`.
Novos (Fase C): `src/api/politicians/campaign-sources.ts`, `src/lib/origemRecursos.ts`, `src/components/common/OrigemDosRecursos.tsx` e os testes `src/api/politicians/__tests__/{campaign-sources,politicians.campaign-sources}.test.ts`, `src/lib/__tests__/origemRecursos.test.ts`, `src/components/common/__tests__/OrigemDosRecursos.test.tsx`. Alterados na Fase C: `scripts/lib/tse-receitas.ts`, `scripts/sync-tse-receitas.ts`, `scripts/__tests__/tse-receitas.test.ts`, `prisma/schema.prisma`, `src/api/politicians/politicians.service.ts`, `src/hooks/usePoliticianDetail.ts`, `src/pages/PoliticianProfile.tsx`.
Novos (Fases A/B): `scripts/sync-tse-redes.ts`, `scripts/lib/tse-redes.ts`, `scripts/__tests__/tse-redes.test.ts`, `src/components/common/RedesSociais.tsx`, `src/components/common/__tests__/RedesSociais.test.tsx`, `scripts/auditar-links.ts`, `scripts/lib/auditar-links.ts`, `scripts/__tests__/auditar-links.test.ts`, `src/api/politicians/links-quebrados.ts` (gerado), `docs/PLANO-CONFIANCA-E-DADOS-2027.md`, `docs/AUDITORIA-REDES-SOCIAIS-2026-11-01.md`, `src/api/politicians/social-links.ts`, `src/components/common/SourceCheck.tsx`, `src/components/common/FontesDeDados.tsx`, e os testes `src/api/politicians/__tests__/{politicians.legislature-id,politicians.social-links,social-links}.test.ts`, `src/components/common/__tests__/{SourceCheck,FontesDeDados}.test.tsx`, `src/lib/__tests__/sources.test.ts`.

Fora desta leva: os arquivos apagados em `canal-x/` e `gt1-export/` no `git status` não são deste trabalho. Commit por caminho, nunca `git add -A`.

## 9. Decisões do Rilson (2026-11-01)

1. **Links quebrados: esconder.** Só some o que foi comprovado quebrado (hoje, 27 canais de YouTube com 404). Instagram, Facebook e X não são checáveis por robô e continuam aparecendo. A lista de ocultos é versionada e vem de auditoria offline (B4), que precisa vir antes dos ícones (B3).
2. **Ranking × ficha: manter o ranking por enquanto.** Nada muda na página principal. A discussão (posição por décimos de ponto, dados desiguais entre parlamentares, risco de acusação de parcialidade) fica registrada e pode ser reaberta. Cuidado a manter: a nota e o ranking sempre acompanhados do aviso de que é cálculo nosso e dos limites de dado.
3. **Migrations: aprovadas desde que melhorem a experiência do usuário** (redes TSE, `SQ_CANDIDATO`, origem dos recursos, bens). Cada uma ainda é conferida no endpoint real depois do deploy, não só no CI.
4. **Commit, push e deploy: só no final**, com autorização dele na hora. Nada foi commitado até aqui.
5. **Revisor externo: adiado.**

## 10. Pendências acrescentadas em 2026-11-02 (Fase C)
30. **[T]** Em produção, na ordem: `pnpm db:push` (3 colunas anuláveis), deploy, `pnpm sync:tse:redes`, `pnpm sync:tse:receitas --dry-run` (conferir "Por origem (R$ milhões)", ~R$ 3.598 mi no total do TSE para os dois cargos, e que o DF entra), `pnpm sync:tse:receitas`. Os zips de `data/tse/` precisam estar na máquina que rodar; o de receitas tem 451 MB.
31. **[C]** Depois do reimport: `SELECT count(*) FROM campaign_finance WHERE election_year=2022` (esperado 502 para a Câmara; hoje 494), `SELECT count(*) ... WHERE source_breakdown IS NULL` (esperado 0), os 8 deputados do DF com financiamento, e a ficha de um deles aberta.
32. **[C]** Abrir 3 fichas e comparar à mão o total e a divisão por origem com a página oficial do candidato no DivulgaCandContas (TSE). Hoje não há conferência por pessoa, só a conferência agregada (R$ 3,60 bi, 10.662 candidatos).
33. **[T]** A5 ainda depende de confirmar o padrão de URL do DivulgaCandContas (é uma SPA; o `SQ_CANDIDATO` já será guardado). Não publicar link sem abrir um de cada tipo.
34. **[D, futuro]** Mostrar "Maiores origens individuais" sem recolher, ou tirar de vez? Hoje fica recolhido porque o primeiro item quase sempre é o diretório do partido.
35. **[T]** Em produção, junto com a pendência 30: o `db push` agora cria também a tabela `candidate_assets` (4 mudanças no total: 3 colunas e 1 tabela, todas aditivas). Depois do deploy: `pnpm sync:tse:bens --dry-run` (esperado: 648 casadas, 619 com bens, 0 sem verificação) e `pnpm sync:tse:bens`. Os zips `consulta_cand_2022.zip` e `bem_candidato_2022.zip` precisam estar em `data/tse/`.
36. **[C]** Depois do `sync:tse:bens`: `SELECT count(*) FROM candidate_assets` (esperado 619), e comparar 3 fichas à mão com a página do candidato no DivulgaCandContas (total e número de bens).
37. **[C]** Antes de subir: o Prisma lê a relação `assets` em toda ficha. Sem a tabela `candidate_assets`, a ficha de todo parlamentar quebra. O `db push` vem antes do deploy, sempre.
38. **[D, futuro]** Evolução de bens entre eleições só quando a Fase E trouxer 2018 (Senado) e 2026. Decidir o texto antes, sem a palavra "enriquecimento".
39. **[D, só você]** Para destravar A5: abrir um candidato de 2022 no DivulgaCandContas num navegador comum e mandar a URL da barra de endereço (ver A5 acima).
40. **[T]** Anotar a URL exata de download dos 5 zips do TSE baixados em agosto (a do `rede_social_candidato_2022.zip` já está registrada).
41. **[D]** D1 a D4 do `LEVANTAMENTO-INGESTAO-2026-11-02.md` (financiamento 2026 parcial; quais eleições na ficha; chave dos senadores; rostos novos antes da posse). Bloqueiam E2 a E6, mas não E1.
42. **[T]** E1 feito. **E2 (parte técnica) feito:** `--ano` nos syncs de redes, bens e receitas, trava de prestação final (2026 recusada com 33%), sem sobrescrever outros anos. **E3 preparado, sem gravar:** `scripts/lib/casar-senadores.ts`. **E5 levantado** (2018 baixado e registrado). Faltam, dependendo de D1 a D4: E2 no service/telas (parar de fixar 2022), E3 (gravar), E4, E6, e **executar** qualquer sync contra o banco, o que não foi feito.
43. **[C]** Conferir à mão a lista de `docs/SENADORES-CONFERENCIA-2026-11-02.md` (40 eleitos de 2026 sem ficha; 13 fichas ativas sem casamento), antes de qualquer gravação.
44. ~~**[T]** Syncs com rótulo de eleição sem diferenciar caixa.~~ FEITO em 2026-11-02 nos syncs de redes, bens e receitas (`scripts/lib/tse-eleicao.ts`, 30 testes). O `sync-tse-candidatura.ts` (2022, rótulo com a caixa certa) não foi alterado.
45. **[T]** Teste intermitente: `OrigemDosRecursos.test.tsx` ("a barra tem descrição textual...") falhou uma vez numa rodada completa (2,1 s) e passou nas 9 rodadas seguintes (6 isoladas e 3 completas); não consegui reproduzir. Se voltar a falhar no CI, investigar (suspeita: consulta `getByRole('img')` lenta sob carga).
46. ~~Os syncs nunca rodaram contra um banco.~~ **RODADOS EM PRODUÇÃO (2026-11-21):** `sync:tse:redes` (563 fichas gravadas), `sync:tse:bens` (620 gravadas) e `sync:tse:receitas` (513 gravadas com divisão por origem auditável) executados com sucesso via túnel seguro contra o banco de produção.
47. **[T]** Arquivo de 2018 do TSE inclui a eleição suplementar de MT (abril de 2020) com rótulos `Senador` e `Eleição Suplementar Senador - MT`; o filtro padrão perde 1 dos 54 eleitos. Tratar de propósito na hora de importar 2018.

## 11. Achados de 2026-11-02 (noite): selo "Atípico" e itens menores

**`riskLevel` / selo "Atípico" (item "revisar `riskLevel: HIGH`", 50 de 174) — medido em produção, somente leitura.**
- 174 parlamentares têm despesa no acervo (74.336 despesas, 644 marcadas = 0,87%). 109 têm ao menos uma marcada.
- A API decide o selo pela **proporção do VALOR** marcado (`suspiciousValue / totalValue`: >10% = "Atípico", >5% = "Atenção"). Mas o medidor do gráfico mostra a **proporção da CONTAGEM** (`suspiciousCount / totalCount`, "das N despesas analisadas, X% caem no topo 1% da própria categoria"). São duas medidas diferentes, e o selo e o medidor aparecem juntos.
- Cruzando as duas nos 174: **dos 50 "Atípico" pelo valor, só 3 são "Atípico" pela contagem; 34 têm menos de 5% das despesas marcadas e 13 entre 5% e 10%.** Dos 19 "Atenção" pelo valor, 18 são "Regular" pela contagem. Média de contagem marcada: 1,46%; média de valor marcado: 8,66%; máximo de contagem: 15,65%.
- Fragilidade: 14 dos 50 "Atípico" têm no máximo 3 despesas marcadas; 18 têm menos de 200 despesas no total. Poucas despesas grandes bastam para virar selo vermelho.
- É o mesmo tipo de contradição que o D4 de 2026-09-25 quis eliminar ("uma única fonte de verdade"): o leitor vê "1,2%" ao lado de um selo vermelho.
- **Feito (seguro, só texto):** os rótulos "% fora do padrão" que mostravam o valor passaram a dizer **"% do valor fora do padrão"** (aba Gastos, card e resumo), para não parecerem a mesma medida do medidor. **Não mudei quem recebe o selo.**
- **[D5] Decisão do Rilson (2026-11-21):** Adotada a opção **(a)** (por contagem). `RISK_BASIS = 'contagem'` ativado em `src/api/politicians/risk-level.ts`. Alinhado com o medidor visual e evitando falsos positivos alarmistas.
48. ~~**[D]** D5 acima (origem do selo "Atípico").~~ DECIDIDO e IMPLEMENTADO em 2026-11-21.

## 12. Preparado sem decisão, desligado por padrão (2026-11-02, noite)
Tudo abaixo mantém o comportamento atual até você virar a chave. Cada chave tem teste, e o que dá para provar contra dados reais foi provado no banco descartável.

| Decisão | Chave | Onde | Como virar |
|---|---|---|---|
| D5 selo "Atípico" | `RISK_BASIS` (`'valor'` hoje; `'contagem'`; `'contagem_minimo'`) | `src/api/politicians/risk-level.ts` | trocar a constante e rodar os testes. Com `'contagem'`: "Atípico" 50 -> 3, "Atenção" 19 -> 14 (medido em produção) |
| D1 financiamento exibido | `BANCADA_ANO_FINANCIAMENTO` (padrão 2022) | `src/api/politicians/anos-exibidos.ts` | só depois de a prestação 2026 ser final e importada (a trava de 95% impede importar antes) |
| D2 bens: duas eleições | `BANCADA_ANOS_BENS` (padrão `2022`) | idem | `BANCADA_ANOS_BENS=2022,2026`; a ficha passa a mostrar "Bens declarados em cada eleição" (valores brutos lado a lado, sem diferença nem percentual) |
| D3 senadores | `--senadores` nos três syncs | `scripts/sync-tse-*.ts` | `pnpm sync:tse:bens --ano 2022 --senadores --dry-run`, conferir a lista de `docs/SENADORES-CONFERENCIA-2026-11-02.md`, e então sem `--dry-run`. CPF de senador nunca é gravado |
| D4 rostos novos | nada preparado | | depende do que o site deve mostrar antes da posse |

- Os títulos "Financiamento de Campanha (ano)" e "Bens declarados (ano)" agora usam o ano do dado, não um 2022 fixo.
- Valor inválido nas variáveis de ambiente da API não derruba o site: cai no padrão (2022) e avisa no log.
- A ficha continua dizendo "2022" nos textos de estado vazio ("sem receitas registradas na prestação de contas do TSE 2022"): trocar quando D1/D2 forem decididos.
49. **[T]** Quando D1/D2 forem decididos: revisar os textos de estado vazio que ainda dizem "2022" em `PoliticianProfile.tsx`.
