# Dados brutos do TSE — Prestação de Contas Eleitorais 2022

Este diretório NÃO é versionado no git (os zips somam ~463 MB e o maior,
`prestacao_de_contas_eleitorais_candidatos_2022.zip`, tem 451 MB — acima
do limite de 100 MB/arquivo do GitHub). Os arquivos ficam apenas na máquina
local e precisam ser baixados novamente em um clone novo.

## Arquivos esperados aqui

| Arquivo | Tamanho aprox. |
|---|---|
| `bem_candidato_2022.zip` | 5 MB |
| `consulta_cand_2022.zip` | 4 MB |
| `consulta_cand_complementar_2022.zip` | 1,6 MB |
| `motivo_cassacao_2022.zip` | 0,15 MB |
| `prestacao_de_contas_eleitorais_candidatos_2022.zip` | 451 MB |

## Onde baixar (fonte oficial)

Portal de Dados Abertos do TSE — <https://dadosabertos.tse.jus.br/>
→ seção "Candidatos" e "Prestação de Contas Eleitorais" → eleições 2022.

## Status da integração

A integração desse material ao banco está **pausada** na branch
`feature/tse-integration` (ver `ROADMAP.md` § P8/#5). Os scripts de sync
atuais (`scripts/sync-*.ts`) consomem APENAS APIs oficiais
(Câmara/Senado/Portal da Transparência) — nenhum lê esses zips ainda.
