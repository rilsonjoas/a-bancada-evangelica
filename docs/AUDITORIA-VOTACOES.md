# Auditoria da coleta de votações — 2026-09-26

**Por que esta auditoria existe.** A auditoria dos cálculos (2026-09-25)
achou que dois critérios — Proteção à Vida (30%) e Liberdade Religiosa
(10%) — não têm nenhuma votação registrada, ou seja, 40% do peso da nota sem
base medida. A conclusão óbvia seria "esses temas não geram votação nominal
no acervo". **Essa conclusão não estava provada**, e esta auditoria existe
para separar as explicações possíveis antes de decidir o peso deles.

**Método.** Varredura direta na API da Câmara
(`dadosabertos.camara.leg.br/api/v2`), contando todas as páginas de todos os
trimestres entre 2023-02-01 e 2026-07-15, e comparando com o que o
`sync-votes.ts` realmente busca. Scripts em `/tmp/opencode`:
`sessoes.py`, `casar.py`, `cobertura.py`, `buscar_props.py`, `pai.py`.

---

## 1. ACHADO PRINCIPAL — o sync nunca paginou, e perde 71% das votações

**Este é um bug de coleta, não um fato sobre o mundo.**

`scripts/sync-votes.ts:193` pede:

```
/orgaos/180/votacoes?dataInicio=…&dataFim=…&itens=200
```

A API **ignora `itens` acima de 100** e devolve no máximo 100 por página. O
sync não usa o parâmetro `pagina`. Cada trimestre, ele vê a **primeira
página** e nunca as demais.

Medido (2023-02 a 2026-07, 14 trimestres, todas as páginas):

| | sessões |
|---|---|
| Total de sessões de plenário que existem | **4.414** |
| Que o sync chega a ver (só página 1) | 1.100 |
| **Que o sync nunca vê** | **3.314** |

Mas a maior parte das 4.414 é **procedural** (não tem votos individuais). O
que interessa é a subset com `Sim:` na descrição, que é a única que o sync
usa:

| | votações substantivas |
|---|---|
| **Vistas pelo sync (página 1)** | **244** |
| **Nunca vistas (página 2+)** | **586** |
| **Cobertura real** | **29%** |

O acervo tem 75 pautas-chave com voto; existem 830 sessões substantivas.
**Rastreamos menos de um terço delas.**

### 1.1 E está piorando

| Mês | vistas | perdidas |
|---|---|---|
| 2023-02 | 16 | 3 |
| 2023-05 | 31 | 41 |
| 2023-08 | 16 | 86 |
| 2024-02 | 41 | 20 |
| 2024-05 | 28 | 42 |
| 2024-08 | 11 | 50 |
| 2025-02 | 40 | 17 |
| **2025-05** | **18** | **128** |
| **2025-08** | **21** | **105** |
| 2026-02 | 11 | 68 |
| 2026-05 | 11 | 26 |

O volume de plenárias substantivas cresceu e a cobertura caiu. Em 2025-05
vimos 18 de 146. Como a API ordena por data, e o período mais recente está
mais para o fim, **o acervo atual é justamente o mais podre** — que é o
pior cenário para um site que promete acompanhar o Congresso.

## 2. CORREÇÃO A UMA PRIMEIRA LEITURA ERRADA (registrada de propósito)

A primeira leitura deste material foi "o sync descarta 75% das sessões, logo
perdemos 75% dos votos". **Está errado, e o erro é instructive.**

3.314 sessões perdidas parece catastrófico, mas a maioria é procedural —
votação de símbolos, discussão, Questão de Ordem — sem voto individual e
sem como entrar no cálculo. O número que importa é 586 sessões
substantivas perdidas, não 3.314 sessões.

Publicar o número grande sem checar o que ele continha seria exatamente o
tipo de erro que esta auditoria existe para evitar. Fica registrado porque
o próximo que medir isto vai passar pelo mesmo número.

## 3. Por que Vida e Liberdade Religiosa seguem em zero

Varredura das **830** sessões substantivas (todas as páginas, não só a
primeira), casando as `SCAN_RULES` contra `descricao` +
`proposicaoObjeto`:

| Critério | Sessões que casam |
|---|---|
| Proteção à Vida | **0** |
| Liberdade Religiosa | **0** |
| Integridade Moral | **0** |
| Valores Familiares | 1 |
| Responsabilidade Social | 4 |

Só 5 casam pelo resumo, contra 75 que temos no banco. A discrepância é
esperada: o sync real resolve a proposição de cada votação e casa contra a
**ementa completa**, que não vem na resposta resumida.

Duas razões pelas quais o resumo não serve, ambas medidas:

1. **`proposicaoObjeto` vem `null`.** A resposta resumida traz `id`, `data`,
   `descricao`, `aprovacao` e `uriProposicaoObjeto` — o objeto da proposição
   é nulo na maioria das linhas.
2. **A maioria das plenárias é votação de emenda, não da proposição.**
   Descrições reais do acervo:
   - "Aprovada a Emenda do Senado nº 28. Sim: 229; Não: 82…"
   - "Aprovada a Emenda do Senado Federal nº 4. Sim: 234…"

   O conteúdo (aborto, liberdade religiosa) vive na ementa da proposição-mãe.
   Uma proposição sobre aborto gera **muitas** votações de emenda — cada uma
   uma sessão. Se existe proposição-mãe desses temas com emendas em
   plenário, é uma mina: uma proposição, dezenas de sessões.

## 4. Limites da API que fecham caminho (medidos)

| Chamada | Resultado |
|---|---|
| `/proposicoes?keywords=aborto` | funciona, **mas trava em 5 resultados**, ignora `itens` e `pagina` |
| `/proposicoes?…&ordenarPor=dataApresentacao` | **HTTP 400** — parâmetro inválido |
| `/orgaos/180/votacoes?itens=200` | devolve 100, ignora o `itens` |
| `/orgaos/180/votacoes?pagina=N` | **funciona** — é a saída do bug |

Ou seja: **não dá para enumerar proposições por tema** pela API. A única
porta de entrada auditável é a lista de votações, com paginação. Isso reforça
que corrigir o sync é caminho obrigatório, não opcional.

## 5. O que NÃO está provado ainda

**A conclusão "Vida e Liberdade Religiosa não têm dados" continua em aberto.**
Faltam três testes:

1. **Resolve a proposição-mãe das 586 sessões substantivas perdidas** e casar
   a ementa. Amostra inicial de 9 sessões: todas sem ementa resolvível —
   amostra pequena demais para concluir. **Este é o teste decisivo e ainda
   não foi feito.**
2. **Verificar se a proposição de aborto (PL 1904/2024, que já consta como
   pauta-chave com 0 votos) tem sessões plenárias no acervo.** Se tem, o
   grudo está falhando; se não tem, o tema é mesmo inacessível por votação
   nominal.
3. **Verificar a cobertura do Senado.** O acervo é 100% `CAMARA`. O plano
   documenta o sync do Senado, mas não há nenhum voto de senador no banco.

Nenhuma decisão de peso deveria ser tomada antes do teste 1.

## 6. Correção mínima que o bug pede

```ts
// scripts/sync-votes.ts — hoje
const data = await fetchJson(`${BASE}/orgaos/180/votacoes?dataInicio=…&dataFim=…&itens=200`);
const votacoes = data?.dados ?? [];

// o que precisa ser
let pagina = 1;
const votacoes = [];
while (true) {
  const data = await fetchJson(`${BASE}/orgaos/180/votacoes?dataInicio=…&dataFim=…&itens=100&pagina=${pagina}`);
  const lote = data?.dados ?? [];
  if (!lote.length) break;
  votacoes.push(...lote);
  if (lote.length < 100) break;
  pagina++;
}
```

Isso é **aumentar a coleta**, não mudar a fórmula: não move nenhuma nota por
si, e sim cria o dado que os dois critérios sem medição precisam. Deve vir
com uma verificação de cobertura no `SyncLog`, para que a regressão não
volte em silêncio — que foi exatamente como este bug sobreviveu 3 anos.
