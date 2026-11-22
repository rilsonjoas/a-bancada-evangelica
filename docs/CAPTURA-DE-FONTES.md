# Registro de captura das fontes (TSE 2022)

Início do registro pedido em A7 de `PLANO-CONFIANCA-E-DADOS-2027.md`. Para cada arquivo de fonte que alimenta o banco: de onde veio, quando foi baixado, tamanho e SHA-256. Com isso, qualquer pessoa que baixe o mesmo arquivo do TSE confere se é o mesmo conteúdo que o site usou.

- **Origem:** Portal de Dados Abertos do TSE (<https://dadosabertos.tse.jus.br/>) e `cdn.tse.jus.br`. O TSE bloqueia IP de datacenter, então os arquivos foram baixados à mão, de rede residencial, e ficam em `data/tse/` (fora do git; ver `data/tse/README.md`).
- **"Data do arquivo"** é a data de modificação do arquivo na máquina de quem baixou (2026-11-02 para o que foi baixado hoje). Não é a data de publicação pelo TSE.
- **Hash calculado em 2026-11-02** com `sha256sum`.

| Arquivo | Alimenta | Tamanho (bytes) | Data do arquivo | SHA-256 |
|---|---|---:|---|---|
| `consulta_cand_2022.zip` | ligação SQ_CANDIDATO → CPF (redes, bens, financiamento, cassação) | 4.379.833 | 2026-08-20 | `2d29446a2b728f151295a0d7bb20aef64d1264430c375a076a60c7cc65594a06` |
| `consulta_cand_complementar_2022.zip` | candidatura complementar | 1.704.744 | 2026-08-20 | `a67111d79802b43e43723a1e8dce023a87f275c6d2778e7188fa48dc7683035a` |
| `motivo_cassacao_2022.zip` | motivos de cassação de candidatura | 162.480 | 2026-08-20 | `bb307fcd3565ad5a9e70a37655a8b27248d88352b4d278c880bd7bfc3f1a8712` |
| `prestacao_de_contas_eleitorais_candidatos_2022.zip` | financiamento de campanha e origem dos recursos | 473.268.465 | 2026-08-20 | `ceea3bea768f642e01a2344f8f36ddbefe1e4e8a7bf21680b04d4704792c351d` |
| `bem_candidato_2022.zip` | bens declarados | 5.376.095 | 2026-08-20 | `aec6e3bb13d192ea25ded6350bc4baf339bf63bbce99f6016b1deb130b9556e9` |
| `rede_social_candidato_2022.zip` | redes sociais declaradas | 1.907.313 | 2026-11-02 | `ffa8789fa7a4c180256d2674a22c5b243f97823e801d1eb7506ae3a894890436` |

### Baixados em 2026-11-02 (levantamento da Fase E; ver `LEVANTAMENTO-INGESTAO-2026-11-02.md`)

URL base: `https://cdn.tse.jus.br/estatistica/sead/odsele/` + pasta. Todos baixados nesta data, de `data/tse/2026/` e `data/tse/2022-republicado/` (fora do git).

| Arquivo (pasta) | Tamanho (bytes) | SHA-256 |
|---|---:|---|
| `2026/consulta_cand_2026.zip` (consulta_cand) | 3.283.629 | `5e6619a4ad0b906f057bdbe6b51c9004c891baa17230b76b1343ab37c42dc7aa` |
| `2026/bem_candidato_2026.zip` (bem_candidato) | 3.762.285 | `3b49484f7851b2815d2247fc966e8a63fe3d4841dd3fbd8d1177e0f9367b72b8` |
| `2026/rede_social_candidato_2026.zip` (consulta_cand) | 3.003.260 | `d4a21ba933f6d66a988ab598899b1ea83bfb8561d8f94fa700a03bddbdac04fd` |
| `2026/prestacao_de_contas_eleitorais_candidatos_2026.zip` (prestacao_contas) | 236.197.662 | `6c6c32268f934d2430658271845c728cb25f440e3559b913fccc240d077cb4e2` |
| `2022-republicado/consulta_cand_2022.zip` (consulta_cand) | 4.440.144 | `c6edc2b51002e74952b4736d1859aa0f41631dad8be11677f80a1a5e1a32f4aa` |
| `2022-republicado/bem_candidato_2022.zip` (bem_candidato) | 5.547.989 | `5cc42eec2cc1717edd3651e4d231fad0c379c85a92e8da91d70c375f3af0f40f` |
| `2022-republicado/prestacao_de_contas_eleitorais_candidatos_2022.zip` (prestacao_contas) | 495.259.842 | `e43c4a9d03c5c27ecf057913224efcc895fd7fb43aa4c8df89a73c41cf141520` |

Os de 2022 republicados diferem em tamanho dos de agosto (acima). Comparação no levantamento: mesmos candidatos, bens idênticos, financiamento de deputado/senador com diferença de ~R$ 20 mil, 81 mudanças de situação final.

URL do último: `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_2022.zip`. Os demais vêm do portal de dados abertos, seção "Candidatos" e "Prestação de Contas Eleitorais", eleições 2022; **a URL exata de cada um não está registrada** (foram baixados antes deste registro) e deve ser anotada no próximo download.

## Achados de qualidade registrados aqui
- `prestacao_de_contas_eleitorais_candidatos_2022.zip` traz 26 arquivos por estado e **não traz o do DF**; o `BRASIL.csv` cobre o DF. O sync lê o DF dele (`scripts/sync-tse-receitas.ts`).
- `rede_social_candidato_2022.zip` mistura eleições: 44.691 linhas da eleição geral estadual, 213 da geral federal e 27 de uma suplementar de governador de 2026. O sync filtra pela eleição.

### Baixados em 2026-11-02 (2018, levantamento do Senado)

URL base `https://cdn.tse.jus.br/estatistica/sead/odsele/` + pasta; em `data/tse/2018/` (fora do git).

| Arquivo (pasta) | Tamanho (bytes) | SHA-256 |
|---|---:|---|
| `2018/consulta_cand_2018.zip` (consulta_cand) | 4.722.704 | `57f6881f1aa036142886ae548afd275e7ee6695643a2ab62826f2ee232d3fd44` |
| `2018/bem_candidato_2018.zip` (bem_candidato) | 5.098.559 | `d2473b7eef8849faf6061618a02add730d050364f37b546c93c37b9f2fbac58f` |
| `2018/rede_social_candidato_2018.zip` (consulta_cand) | 642.323 | `27411dbc32074defd52cc2056ad41fb76a2d9a41d30aa1ac45c0b467b170ccd1` |
| `2018/prestacao_de_contas_eleitorais_candidatos_2018.zip` (prestacao_contas) | 305.897.986 | `7b8f8c6c2b46b90597fc815f798dd83d49ca6bd60b7f01eb5966d2deaf91ffee` |

Achado: o `consulta_cand_2018` inclui a eleição suplementar de MT (abril de 2020), com rótulos `Senador` e `Eleição Suplementar Senador - MT`; ver `LEVANTAMENTO-INGESTAO-2026-11-02.md` seção 8.2.

## Registro automático (E1)
A fonte da verdade passou a ser `src/lib/capturas.ts`, gerado por `pnpm registrar:fontes --gravar` e exibido em `/dados`. As tabelas acima são o registro inicial, escrito à mão e conferido contra o arquivo gerado (todos os hashes batem). A cada download novo, rode o script e revise o diff; este documento só precisa de nota quando houver um achado de qualidade.

## O que falta (Fase E)
- Registrar a quantidade de linhas lidas por importação (hoje o registro cobre só os arquivos, não as importações).
- Repetir o registro para os arquivos de 2018 quando forem baixados.
