# Classificação de pautas está errada — 67% dos votos casam por substring

**Data:** 2026-09-26 · **Severidade: P0, site pausing**
**Documento irmão:** `docs/AUDITORIA-VOTACOES.md` (bug de paginação, 29% de cobertura)

Este documento registra o achado mais grave da auditoria. Ele **anula a
premissa** de todo o resto: a nota que o site publica é calculada a partir de
votos classificados no assunto errado.

---

## 1. O achado, em uma linha

A palavra-chave `sus` — pretendendo ser o sistema de saúde — é uma
**substring** da palavra `sustentavel`. Um projeto de
**licenciamento ambiental** foi classificado como "Responsabilidade Social"
porque o texto dele menciona "desenvolvimento sustentável".

## 2. A cadeia exata

1. `scripts/lib/scan-rules.ts` tem a regra
   `{ criteria: 'SOCIAL_RESPONSIBILITY', keywords: ['saude publica', 'sus', 'atendimento a vitimas'] }`.
   `sus` são três letras.

2. `matchScanRule()` normaliza o texto e testa
   `n.includes(k)` — **substring, sem fronteira de palavra**.
   (`scripts/lib/scan-rules.ts:71`)

3. `scripts/sync-votes.ts:212` monta o texto a casar concatenando
   **quatro** campos, entre eles a descrição longa da proposição e o campo
   `keywords` da própria API da Câmara (`sync-votes.ts:103,123`). O texto é
   grande, e qualquer palavra que contenha `sus` dispara.

4. `sustentavel` contém `sus`. `consumo`, `consumidor`, `construcao`,
   `resultado`, `conclusao`, `suspeita`, `suspensao` também.

### 2.1 Prova empírica (PL 2159/2021)

Pauta com mais votos do sistema (2.872):

| | |
|---|---|
| Título real | "PL 2159/2021 — Dispõe sobre o **licenciamento ambiental**…" |
| Critério atribuído | `SOCIAL_RESPONSIBILITY` |
| Keywords que dispararam | `saude publica`, **`sus`**, `atendimento a vitimas` |
| `sus` casa na **ementa**? | **Não** |
| `keywords` da API? | **None** |
| Onde casa, então? | Na descrição da proposição: `ap.descricao` do parecer → "**sustentavel**" (6 ocorrências) |

O PROJECT não é sobre saúde. É sobre licenciamento ambiental, e entrou como
responsabilidade social por causa da sílaba de "sustentável".

## 3. A escala do estrago

| | pautas | votos | % de todos os votos |
|---|---|---|---|
| Classificadas pela regra do `sus` | **52** | **18.104** | **67,4%** |

Os 12 maiores, com o critério que receberam:

| Pauta | Criterio atribuido | Votos |
|---|---|---|
| PL 2159/2021 — licenciamento ambiental | Responsabilidade Social | 2.872 |
| PL 327/2021 — Transição Energética | Responsabilidade Social | 2.814 |
| PL 528/2020 — Lei de Shopping Centers | Responsabilidade Social | 2.469 |
| PL 3899/2012 — Estímulo à Produção | Responsabilidade Social | 2.259 |
| PL 3469/2024 — Código Florestal | Responsabilidade Social | 2.052 |
| PL 5122/2023 — Liquidação de dívida | **Valores Familiares** | 1.632 |
| MPV 1268/2024 — Crédito extraordinário | **Valores Familiares** | 1.447 |
| PL 2920/2023 — Aquisição de Alimentos | **Valores Familiares** | 1.157 |
| PL 2597/2024 — Contratos de seguro privado | **Integridade Moral** | 359 |

## 4. Não é só o `sus`

Outras palavras-chave são ativas dentro de palavras maiores, com o mesmo
mecanismo:

| keyword | dispara dentro de |
|---|---|
| `sus` | sustentável, consumo, consumidor, construção, resultado, conclusão, suspeita, suspensão |
| `familia` | familiar, familiares, família de servidores, família do produtor rural |
| `crianca` | crianças, infância |
| `crenca` | crenças |

E há falsos positivos que **não** são de substring, mas de **sentido
invertido** — a palavra está lá, mas o assunto é outro:

- `MORAL_INTEGRITY` via `prescricao` / `amnistia`: "PL 2597/2024 — normas
  gerais em **contratos de seguro privado**". "Prescrição" (statute of
  limitations) é palavra legítima de direito securitário. A proposição não é
  sobre integridade moral.
- `MORAL_INTEGRITY` via `anistia`: "PL 1536/2024 — concede anistia ao
  pagamento das **parcelas mensais**". Anistia de **dívida**, não política.
- `FAMILY_VALUES` via `familia` em "MPV 1268/2024 — **Abre crédito
  extraordinário**". A palavra família aparece no decreto Orçamentário
  (família de servidores servidores).

## 5. Votos procedurais dentro da nota

Das 830 sessões substantivas que existem:

| tipo | n | % |
|---|---|---|
| Requerimento de retirada | 249 | 30% |
| Mérito | 247 | 29% |
| Emenda | 167 | 20% |
| **Requer urgência** | **159** | **19%** |
| Redação final | 8 | 1% |

**Requer urgência** é procedural: "o projeto entra logo na pauta ou não".
Votar SIM pode ser wanting fechar a pauta, não defender o tema. Ainda assim
entra na nota com peso de voto posicional, como se fosse uma posição sobre
o mérito.

## 6. O que isso invalida

| Afirmação | Estado |
|---|---|
| "A nota reflete o voto do parlamentar" | **Não.** Setenta por cento dos votos está no critério errado. |
| "91% → 37% a party explain a variance" | O cálculo está certo; **a entrada está errada**. A métrica mede a fórmula sobre dados mal classificados. |
| "Responsabilidade Social 15% do peso" | 67% dos votos do sistema foram parar aí, em boa parte por `sus`. |
| "Valores Familiares" (PL 5122 liquidação de dívida) | Não é pauta de família. |
| "Integridade Moral" (contratos de seguro) | Não é pauta de integridade. |

A nota **não** está "um pouco errada" — está errada no assunto da maioria
absoluta dos votos que ela consome.

## 7. Correção proposta (ordem de execução)

### 7.1 Match por fronteira de palavra (imediato, P0)

Trocar `includes` por casar palavra inteira, com acento já normalizado:

```ts
function matchScanRule(text: string): ScanRule | null {
  const n = normalize(text);
  for (const rule of SCAN_RULES) {
    for (const k of rule.keywords) {
      // \b Unicode-aware: com acento já removido, \b funciona para português
      const re = new RegExp(`(?:^|[^a-z0-9])${escapeRe(normalizar(k))}(?:[^a-z0-9]|$)`);
      if (re.test(n)) return rule;
    }
  }
  return null;
}
```

Isso mata `sus` dentro de `sustentavel` e mantém o acerto de `saude publica`.

### 7.2 Corrigir keywords que são ambíguas por sentido (P0)

- `sus` → `sistema unico de saude` e/ou exigir fronteira + contexto
  (ou exigir que `sus` venha acompanhado de "saude"/"publica").
- `prescricao` (moral) → `prescricao penal`, `anistia de repressao` —
  tirar a palavra solta, que é comum em direito.
- `anistia` (moral) → `anistia` só com contexto político.

### 7.3 Teste que impede a volta (P0)

Um teste que, dado o texto real de cada pauta já classificada, verifica se
o critério continua casando. E um teste **negativo**: cada keyword precisa
casar o seu texto de exemplo e **NÃO** casar um texto onde aparece dentro de
outra palavra.

### 7.4 Suspender a nota enquanto não corrigir (P0)

**Números congelados de novo** até a reclassificação rodar. Publicar nota
calculada sobre 67% de voto no critério errado é pior que não publicar
número — é publicar número com cara de dado e conteúdo de chute.

## 8. O que NÃO fazer antes de corrigir

- **Não** implementar a paginação agora. Traz 3x mais dado, mas
  o dado entra errado. Primeiro o classificador, depois o volume.
- **Não** mexer nos pesos. Recalibrar peso sobre dado errado é afinar a
  lente de um telescópio apontado para o lado.

## 9. Ordem de trabalho

1. Corrigir `matchScanRule` para fronteira de palavra + testes. (P0)
2. Congelar os números de novo. (P0)
3. Auditar as 83 pautas já classificadas: quantas sobrevivem ao matcher
   corrigido? (P0)
4. Reclassificar tudo; medir quantos critérios ficam com dado real. (P0)
5. **Só então** decidir o peso de Proteção à Vida / Liberdade Religiosa. (P1)
6. Paginação do sync. (P1)
7. Reavaliar o que é voto de mérito vs procedimental. (P2)
8. Recalibrar a fórmula, se ainda fizer sentido. (P2)
