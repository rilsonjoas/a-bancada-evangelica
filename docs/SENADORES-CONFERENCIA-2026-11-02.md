# Senadores: conferência do casamento com o TSE (2026-11-02)

Material de conferência para a decisão D3 do `LEVANTAMENTO-INGESTAO-2026-11-02.md` (item 43 do plano). **Nada foi gravado.** Gerado por `scripts/lib/casar-senadores.ts` sobre as 85 fichas de senador ativas em produção (consulta somente leitura) e os senadores eleitos em 2018, 2022 e 2026 (`consulta_cand`).

## Como o casamento é feito
Chave exata: **nome completo + UF + data de nascimento**, depois de tirar acento e caixa; também tenta o nome parlamentar da ficha. Só vale casamento de 1 para 1. Nome parecido, nascimento diferente ou UF diferente **não** casa (homônimos e nomes parciais ficam de fora, de propósito). Não usa CPF: o banco não tem CPF de senador.

## Resumo
Os senadores eleitos em 2018 têm mandato até 31/01/2027; os de 2022, até 2031; os de 2026 tomam posse em 01/02/2027.

| Eleição | Senadores eleitos | Casam com ficha atual | Sem ficha | Ambíguos |
|---|---:|---:|---:|---:|
| 2026 | 54 | 14 | 40 | 0 |
| 2022 | 27 | 25 | 2 | 0 |
| 2018 | 53 | 46 | 7 | 0 |

### Eleitos em 2026 que casam com um senador atual (14)

| Nome de urna (TSE) | UF | Partido (TSE) | Ficha atual |
|---|---|---|---|
| JAQUES WAGNER | BA | PT | Jaques Wagner (PT) |
| EDUARDO BRAGA | AM | MDB | Eduardo Braga (MDB) |
| LUCAS BARRETO | AP | PSD | Lucas Barreto (PSD) |
| DELEGADO ALESSANDRO | SE | MDB | Alessandro Vieira (MDB) |
| HUMBERTO COSTA | PE | PT | Humberto Costa (PT) |
| CARLOS PORTINHO | RJ | PL | Carlos Portinho (PL) |
| CID GOMES | CE | PSB | Cid Gomes (PSB) |
| PLINIO VALÉRIO | AM | PSDB | Plínio Valério (PSDB) |
| MARCELO CASTRO | PI | MDB | Marcelo Castro (MDB) |
| STYVENSON VALENTIM | RN | PODE | Styvenson Valentim (PODE) |
| ROGERIO CARVALHO | SE | PT | Rogério Carvalho (PT) |
| EDUARDO GOMES | TO | PL | Eduardo Gomes (PL) |
| VENEZIANO | PB | MDB | Veneziano Vital do Rêgo (MDB) |
| MARCIO BITTAR | AC | PL | Marcio Bittar (PL) |

### Eleitos em 2026 SEM ficha de senador atual (40): rostos novos, conferir à mão

| Nome de urna (TSE) | UF | Partido (TSE) |
|---|---|---|
| MARA ROCHA | AC | REPUBLICANOS |
| MARINA JHC | AL | PSDB |
| ARTHUR LIRA | AL | PP |
| RAYSSA FURLAN | AP | PODE |
| RUI COSTA | BA | PT |
| LUIZIANNE | CE | REDE |
| MICHELLE BOLSONARO | DF | PL |
| BIA KICIS | DF | PL |
| RENATO CASAGRANDE | ES | PSB |
| EVAIR DE MELO | ES | REPUBLICANOS |
| GUSTAVO GAYER | GO | PL |
| GRACINHA CAIADO | GO | UNIÃO |
| FUFUCA | MA | PP |
| LAHESIO BONFIM | MA | NOVO |
| MARÍLIA CAMPOS | MG | PT |
| DOMINGOS SÁVIO | MG | PL |
| CAPITÃO CONTAR | MS | PL |
| REINALDO AZAMBUJA | MS | PL |
| ZÉ MEDEIROS | MT | PL |
| MAURO MENDES | MT | UNIÃO |
| HELDER | PA | MDB |
| CHICÃO | PA | UNIÃO |
| JOAO AZEVÊDO | PB | PSB |
| MARÍLIA ARRAES | PE | PDT |
| JÚLIO CÉSAR O JULIM DO LULA | PI | PSD |
| DELTAN DALLAGNOL | PR | NOVO |
| FILIPE BARROS | PR | PL |
| CARLOS JORDY | RJ | PL |
| SAMANDA DE LULA | RN | PT |
| DR. FERNANDO MÁXIMO | RO | PL |
| BRUNO SCHEID | RO | PL |
| NICOLETTI | RR | PL |
| TERESA SURITA | RR | MDB |
| MARCEL VAN HATTEM | RS | NOVO |
| SANDERSON | RS | PL |
| CAROL DE TONI | SC | PL |
| CARLOS BOLSONARO | SC | PL |
| ANDRÉ DO PRADO | SP | PL |
| GUILHERME DERRITE | SP | PP |
| ALEXANDRE GUIMARÃES | TO | MDB |

### Fichas de senador ativas que NÃO casam com nenhuma eleição de senador (2018, 2022, 2026) (13 de 85)

Provavelmente suplentes que assumiram o mandato (não disputaram a eleição). Conferir.

| Nome | UF | Partido |
|---|---|---|
| Lourdinha Pereira |  | PSB |
| Dra. Eudócia | AL | PSDB |
| Sargento Reginauro | CE | PSDB |
| Leany Lemos | DF | PSB |
| Ana Paula Lobato | MA | PSB |
| Renzo Braz | MG | PP |
| Carlos Fávaro | MT | PSD |
| Fernando Dueire | PE | PSD |
| Jussara Lima | PI | PSD |
| Roberta Acioly | RR | REPUBLICANOS |
| Hermes Klann | SC | PL |
| Ivete da Silveira | SC | MDB |
| Giordano | SP | PODE |

## O que conferir
1. Cada nome da lista "SEM ficha de senador atual (2026)" é de fato uma pessoa nova no Senado, e não um senador atual que o casamento deixou escapar por diferença de grafia do nome completo ou de data. Os conhecidos por mim pelo noticiário (por exemplo, nomes de deputados federais que migraram) parecem novos de fato, mas **eu não conferi um a um**.
2. A lista das fichas ativas sem casamento: confirmar que são suplentes que assumiram (não disputaram eleição).
3. Se algum caso estiver errado, o ajuste é no dado de origem (nome completo ou nascimento da ficha), não na regra de casamento.
