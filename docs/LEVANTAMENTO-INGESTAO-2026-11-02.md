# Levantamento da Fase E: o que o TSE já publicou de 2026 (2026-11-02)

Levantamento só de leitura, feito antes de escrever qualquer código de ingestão. Todos os números abaixo foram medidos nos arquivos baixados hoje (hashes em `CAPTURA-DE-FONTES.md`) e, onde há cruzamento com o banco, por consulta somente leitura (CPF só como hash; nada gravado; arquivos temporários apagados).

## 1. O que existe no TSE

Os 12 arquivos abaixo respondem 200 no CDN do TSE (`https://cdn.tse.jus.br/estatistica/sead/odsele/<pasta>/<arquivo>`), baixados desta máquina sem bloqueio:

| Arquivo (pasta) | 2018 | 2022 | 2026 |
|---|---|---|---|
| `consulta_cand_AAAA.zip` (consulta_cand) | 4,7 MB | 4,4 MB | 3,3 MB |
| `bem_candidato_AAAA.zip` (bem_candidato) | 5,1 MB | 5,5 MB | 3,8 MB |
| `rede_social_candidato_AAAA.zip` (consulta_cand) | 0,6 MB | 1,9 MB | 3,0 MB |
| `prestacao_de_contas_eleitorais_candidatos_AAAA.zip` (prestacao_contas) | 306 MB | 495 MB | 236 MB |

- A nota antiga ("o TSE bloqueia IP de datacenter") vale para o portal `dadosabertos.tse.jus.br`. O CDN respondeu normalmente daqui; **não testei do VPS**, e a ingestão pesada não deve rodar lá de qualquer forma (queda de 16/10).
- Os arquivos de 2026 foram gerados em 01–02/11/2026. A eleição já está nos dados: 2026 traz resultado.

## 2. A eleição de 2026 já está nos arquivos

`consulta_cand_2026`: 7.803 candidatos a deputado federal e 319 a senador. Situação final: **513 deputados federais eleitos** (385 por quociente partidário, 128 por média) e **54 senadores eleitos**. CPF preenchido em 8.121 dos 8.122.

### Renovação (cruzando com as 733 fichas de produção)
- **Deputados:** dos 513 deputados ativos hoje, **320 foram reeleitos**; 114 concorreram e ficaram como suplentes, 42 não foram eleitos, 4 sem situação, 33 não concorreram a deputado federal ou senador (ou não têm CPF no banco). Dos 513 eleitos em 2026, **311 já têm ficha e 202 são rostos novos** (sem ficha).
- **Senadores:** dos 54 eleitos, **14 casam com um senador atual** (por nome completo + UF + data de nascimento) e **40 são rostos novos**. Os 27 senadores eleitos em 2022 seguem no cargo (não estão na eleição de 2026). Atenção: o casamento de senadores é por nome, UF e nascimento, uma chave mais fraca que o CPF; a lista dos 40 "sem casamento" precisa de conferência manual antes de qualquer gravação.

## 3. O que cada fonte de 2026 permite (e o que não)

| Dado | Situação em 2026 | Conclusão |
|---|---|---|
| Candidatura e resultado | Final. | Pode entrar. |
| Redes sociais | 511 dos 513 deputados eleitos e 54 dos 54 senadores eleitos têm rede declarada (2022: 89%). | Pode entrar, pelo mesmo sanitizador e auditoria de links. |
| Bens declarados | 506 de 513 deputados e 52 de 54 senadores eleitos; mediana R$ 1,43 mi (deputados) e R$ 1,98 mi (senadores); maior total entre eleitos R$ 107 mi; **a trava de sanidade não disparou** em nenhum candidato a deputado/senador. | Pode entrar. Com 2022 + 2026, os **320 reeleitos** passam a ter duas eleições comparáveis, o que libera a "evolução" nos termos do plano (valores brutos lado a lado, sem cálculo, sem a palavra "enriquecimento"). |
| Prestação de contas (financiamento) | **Não é final.** Das linhas de receita de deputados/senadores: 51% "Relatório financeiro", 33% "Final", 15% "Parcial". Total até agora: R$ 3.994,68 mi, 7.819 candidatos (2022 final: R$ 3.597,83 mi, 10.662). | **Não mostrar 2026 como se fosse final.** Ver decisão D1. |

## 4. Achados de qualidade (para não repetir erro)

1. **O rótulo da eleição muda de caixa entre arquivos.** `consulta_cand` e `bem_candidato`: `Eleições Gerais Estaduais 2026`. `rede_social_candidato`: `ELEIÇÕES GERAIS ESTADUAIS 2026`. Filtrar com a caixa errada devolve **zero** sem dar erro (aconteceu nesta análise: a cobertura de redes deu 0 até corrigir). O sync de redes de 2022 já usa a caixa certa; o parametrizado por ano deve comparar sem diferenciar maiúsculas.
2. **Os arquivos de 2022 foram republicados** pelo TSE em 01–02/11/2026 (tamanhos diferentes dos de agosto). Comparei: mesmos 10.873 candidatos a deputado federal/senador e mesmos CPF; **bens idênticos** (38.117 itens, R$ 8.259,06 mi); financiamento de deputado/senador com 109.156 linhas nas duas versões e total R$ 3.597,85 mi contra R$ 3.597,83 mi (diferença de ~R$ 20 mil, nas categorias do fundo eleitoral); **81 candidatos mudaram de situação final** (55 "não eleito" → "suplente", 10 "suplente" → "não eleito", e movimentos entre "eleito por média", "suplente" e "não eleito", como 7 "não eleito" → "eleito por média" e 5 "eleito por média" → "suplente"), mas o total de eleitos continua 540. Conclusão: **os números já verificados nas Fases C e D continuam valendo**; o diff de 22 MB está em outros cargos. Os arquivos antigos e os novos estão guardados lado a lado (`data/tse/` e `data/tse/2022-republicado/`).
3. **`SQ_RECEITA` repetido não é duplicata.** Em 2022 há 1.474 receitas de deputados/senadores com o mesmo `SQ_RECEITA`, mas só 26 grupos são linhas idênticas; os demais diferem por `DS_RECEITA` e `VR_RECEITA` (itens estimáveis diferentes dentro do mesmo recibo). Somar todas as linhas está certo; o efeito das 26 idênticas é desprezível.
4. **`data/tse/2026/` aparecia como "não rastreado" no git**: o `.gitignore` só cobria `data/tse/*.zip`. Corrigido com `data/tse/**/*.zip` (verificado com `git check-ignore`). Sem isso, um `git add` descuidado poderia pôr 236 MB no commit.
5. **Os senadores atuais não têm CPF no banco** (0 de 85). É por isso que o financiamento, os bens e as redes do TSE não chegam ao Senado. Todos têm data de nascimento (85 de 85).
6. **O código atual fixa 2022.** `politicians.service.ts` lê `election_year: 2022` para financiamento e bens, e as telas dizem "(2022)". Com 2026 no banco, é preciso definir qual eleição aparece (ver D1 e D2).

## 5. Decisões que são suas

- **D1. Financiamento 2026 (parcial).** (a) Esperar a prestação final e só então importar (o 2022 continua na tela até lá); (b) importar agora e rotular "prestação parcial de 2026, ainda não final". Recomendação: **(a)**, porque 51% das linhas ainda são "relatório financeiro" e um total parcial na ficha pode ser lido como definitivo. Posso preparar o código para (b) e deixar desligado.
- **D2. Quais eleições aparecem na ficha** dos 320 reeleitos: só a mais recente, ou as duas lado a lado? Recomendação: bens com as duas (é o caso de uso da "evolução", em valores brutos); financiamento só a última final.
- **D3. Senadores.** Para casar senadores com o TSE é preciso uma chave. Opções: (a) nome completo + UF + data de nascimento, com conferência manual dos não casados; (b) gravar o CPF do TSE nas fichas de senador, como já é feito com deputados (dado público, mas minimização é princípio do projeto). Recomendação: **(a) para o casamento, e guardar o `SQ_CANDIDATO` em vez do CPF**.
- **D4. Rostos novos (202 deputados e 40 senadores).** Hoje a ficha de um parlamentar nasce pela API da Câmara/Senado, que só lista os novos depois da posse (01/02/2027). Antes disso o TSE só dá o nome, o partido e o resultado, sem `legislature_id` (o que alimenta o botão "Ver perfil" e o link de gastos). Decidir se, até fevereiro, o site mostra "eleitos de 2026, ainda sem mandato" ou mantém as fichas atuais e espera a posse. Isso é parte da Fase 4 do `PLANO-POS-ELEICAO.md` e não foi decidido.

## 6. Proposta de execução (nada disto foi feito)

Ordem, cada passo com `--dry-run` obrigatório, snapshot do banco antes de gravar e hash do arquivo registrado:
1. **E1. Registro de captura** (tabela: arquivo, URL, data, tamanho, SHA-256, linhas lidas) e hashes em `/dados` (fecha o A7).
2. **E2. Parametrizar por ano** os 4 syncs (`consulta_cand`, redes, bens, receitas): ano e rótulo da eleição como argumento, comparação de rótulo sem diferenciar caixa, **sem sobrescrever 2022** (as tabelas já são `unique(politician, election_year)`; `tse_social_urls` guarda `ano`, mas hoje guarda um ano só: ver E2b).
   - E2b. Redes: o campo `tse_social_urls` guarda um único ano. Para 2026 vale substituir (a declaração mais recente é a melhor), mantendo o ano no JSON.
3. **E3. Senadores** pela chave de D3, com relatório de não casados antes de gravar.
4. **E4. Service e telas** deixam de fixar 2022: escolher a eleição pela regra de D1/D2.
5. **E5. 2018 (Senado)**: arquivos já disponíveis; serve aos senadores eleitos em 2018 que seguem em mandato até 31/01/2027 e foram reeleitos (os 14) e como segunda eleição de bens.
6. **E6. Rostos novos** conforme D4, depois da posse.

Prazo duro: a 58ª legislatura começa em 01/02/2027. A execução técnica (E1 a E4) cabe em cerca de uma semana de trabalho, sem contar as decisões acima.

## 7. Limites deste levantamento
- Medi o que há nos arquivos e cruzei com as fichas; **não comparei nenhuma pessoa com a página oficial do candidato** (o DivulgaCandContas bloqueia consulta automatizada; ver A5 no plano).
- A lista de "casados" e "sem casamento" dos senadores vem de comparar nomes; vi só uma amostra dos 40 sem casamento (nomes como Michelle Bolsonaro, Marília Campos, Carlos Jordy, Marcel van Hattem, Bruno Scheid, Samanda de Lula), que parecem rostos novos de fato, mas não conferi os 40.
- Não testei o download do VPS nem do TSE por outros endereços do portal; só o CDN, desta máquina.
- Nenhum dado de 2026 foi gravado no banco nem em qualquer lugar fora de `data/tse/` (fora do git).

## 8. Complemento (2026-11-02, noite): o que foi feito sem depender de decisão

### 8.1 Syncs por ano, sem tocar em 2022 (parte de E2)
- `sync-tse-redes`, `sync-tse-bens` e `sync-tse-receitas` aceitam `--ano N` (padrão 2022: sem a flag nada muda). Procuram o zip em `data/tse/<ano>/` e, se não houver, em `data/tse/`. Ano inválido (`2025`, `abc`, `--ano` sem valor) dá erro; nunca cai no padrão em silêncio (um teste achou exatamente esse defeito em `--ano` sem valor, corrigido).
- **Rótulo da eleição sem diferenciar caixa nem acento** (item 44 do plano; achado 1 da seção 4). Nova rede de segurança: se o filtro de eleição não achar nenhuma linha, o script para com erro em vez de "importar zero".
- Bens e financiamento gravam a linha do próprio `election_year`; importar 2026 não altera 2022. Redes: o campo guarda um ano só; uma importação de ano mais antigo **nunca** sobrescreve uma mais nova.
- **Trava da prestação de contas final (resolve o lado técnico de D1):** `sync:tse:receitas` recusa uma eleição com menos de 95% das linhas de deputado/senador no tipo FINAL. Medido: 2018 = 99,3%, 2022 = 98,9%, **2026 = 33% (recusada)**. `--aceitar-parcial` existe, mas só deve ser usado se a ficha rotular o dado como parcial. A decisão de **mostrar** ou esperar continua sendo sua (D1); a trava só impede importar por engano.
- **Defeito meu, achado e corrigido hoje:** a leitura em streaming do `BRASIL.csv` (a que cobre o DF, da Fase C) usava o `parse` síncrono do `csv-parse`, que não funciona em stream. Eu a tinha verificado com uma versão de teste, não com o código real; o `tsc` dos scripts mostrou o erro. Corrigido (`csv-parse` assíncrono) e exercitado de verdade: 674.944 linhas varridas, 3.318 do DF casadas, 227 candidatos, R$ 88,63 mi. A diferença para o cálculo independente (3.367 linhas, 228 candidatos, R$ 89,99 mi) é exatamente um candidato do DF que consta no arquivo de receitas mas não no de candidaturas (49 linhas, R$ 1,36 mi), o que também confirmei à parte.
- Os três scripts não rodam sem banco; foram verificados por `tsc`, pelos testes da lógica pura (30 em `tse-eleicao`) e pelos exercícios acima. **Nenhum foi executado contra o banco.**

### 8.2 Levantamento de 2018 (Senado), E5
Baixados e registrados (hashes em `CAPTURA-DE-FONTES.md` e `/dados`): consulta_cand, bem_candidato, rede_social e prestação de contas de 2018.
- 385 candidatos a senador em 2018, **54 eleitos**. CPF com 11 dígitos em 368 dos 385.
- **Armadilha do arquivo de 2018:** ele traz também a eleição suplementar de Mato Grosso (abril de 2020) com rótulos diferentes (`Senador` em 39 linhas e `Eleição Suplementar Senador - MT`). O filtro padrão ("Eleições Gerais Estaduais 2018") enxerga só **53** dos 54 eleitos; o 54º é dessa suplementar. Quem for importar 2018 para o Senado precisa tratar essa eleição de propósito.
- Prestação de contas 2018: 99,3% final; R$ 1.649 mi para deputados e senadores (fundo eleitoral R$ 1.027 mi, fundo partidário R$ 221 mi, recursos próprios R$ 172 mi, pessoas físicas R$ 198 mi).

### 8.3 Senadores (E3 preparado, sem gravar)
- `scripts/lib/casar-senadores.ts` + 16 testes: casamento por nome completo + UF + nascimento, exato, 1 para 1; nome parecido, UF ou nascimento diferente não casam; chave ambígua não é adivinhada.
- Rodado de verdade sobre as 85 fichas de senador ativas e os eleitos de 2018, 2022 e 2026: **72 das 85 fichas casam com ao menos uma eleição de senador**; 2026: 14 de 54 eleitos casam (40 sem ficha); 2022: 25 de 27; 2018: 46 de 53 (os 7 restantes saíram do cargo ou não constam). Se adotada a chave (D3), o financiamento e os bens do TSE chegariam a 72 senadores, onde hoje é zero.
- Lista completa para conferir à mão: `docs/SENADORES-CONFERENCIA-2026-11-02.md` (item 43 do plano). Em especial as 13 fichas ativas sem casamento, que provavelmente são suplentes em exercício.
- **Nada foi gravado**, e `casar-senadores.ts` não grava nada; a decisão D3 continua sua.
