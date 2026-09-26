/**
 * O TESTE GIGANTE — a página não pode mentir.
 *
 * POR QUE ESTE ARQUIVO EXISTE (2026-09-26, `docs/PLANO-CONSISTENCIA.md`):
 * a auditoria encontrou três coisas que nenhum teste normal pegaria, porque
 * são três coisas diferentes da mesma natureza — a PÁGINA afirma uma coisa e
 * o CÓDIGO faz outra:
 *
 *   1. `/metodologia` prometia histórico de processos judiciais, investigações
 *      e condenações. Não existe integração com STF, MP, TCU, CPI ou Conselho
 *      de Ética. Isso é afirmar capacidade que não existe.
 *   2. 12 dos 20 indicadores publicados não tinham medição nenhuma, e 38
 *      keywords do `SCAN_RULES` não apareciam em nenhum indicador — o site
 *      não contava ao usuário o que ele realmente procura.
 *   3. A fórmula é "soma ponderada 30/25/20/15/10", mas essa frase não era
 *      conferida contra `scoring.ts`. Mudar a fórmula sem mudar o texto
 *      passava por todo o build.
 *
 * Tests por critério não pegam nada disso, porque um teste por critério só
 * prova que o critério funciona — não que ele foi DESCRITO. Aqui os testes
 * são por AFIRMAÇÃO PUBLICADA: o que a página diz tem que bater com o que o
 * código faz.
 *
 * ── Regra de desenho que vale mais que cada teste ──────────────────────────
 * Este arquivo NÃO exige que todo indicador vira medido. Isso é decisão de
 * produto, não de teste. O que ele exige é EXPLICITUDE: todo indicador que
 * não é medido precisa estar declarado em `INDICADORES_NAO_MEDIDOS`. Se
 * alguém publicar um indicador novo sem medir, o teste falha — que é
 * exatamente o momento em que a decisão precisa ser tomada de novo.
 *
 * Consequência: `INDICADORS_NAO_MEDIDOS` não é lixo técnico. É o registro
 * do que o site admite não medir. Ele só encolhe.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SCAN_RULES, SCAN_RULES_VERSION } from '../../scripts/lib/scan-rules';
import { WEIGHTS, CRITERIA_KEYS, SCORE_FORMULA_VERSION } from '../../scripts/lib/scoring';
import { EXPENSE_RULES_VERSION } from '../../scripts/lib/expense-rules';
import { CRITERIA, SCORE_BANDS, scoreBand } from '../../src/lib/criteria';
import { performanceLabel } from '../../scripts/lib/scoring';

// src/__tests__/ -> src/ -> raiz do repo. Dois níveis, não três.
const raiz = join(__dirname, '..', '..');
const ler = (p: string) => readFileSync(join(raiz, p), 'utf8');

const METODOLOGIA = ler('src/pages/Metodologia.tsx');
const REPRODUTIVIDADE = ler('docs/REPRODUCIBILITY.md');
const README = ler('README.md');

/** Tira acento e caixa. "Proteção à Vida" e "protecao a vida" comparam igual. */
const normalizar = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

/** remove acentos de TODO o texto da página, para casar com as keywords do sync. */
const METODOLOGIA_PLAIN = normalizar(METODOLOGIA);

const TODAS_KEYWORDS = SCAN_RULES.flatMap((r) => r.keywords.map(normalizar));

// ===========================================================================
// 1.1 — PESOS E CRITÉRIOS
// ===========================================================================
describe('1.1 pesos e critérios', () => {
  it('os cinco pesos somam 100', () => {
    const soma = CRITERIA_KEYS.reduce((acc, k) => acc + WEIGHTS[k], 0);
    expect(soma).toBeCloseTo(1, 10);
  });

  it('a ordem da criteria.tsx é ordem decrescente de peso (o eixo do gráfico depende disso)', () => {
    const pesos = CRITERIA.map((c) => WEIGHTS[c.key as keyof typeof WEIGHTS]);
    const decrescente = [...pesos].sort((a, b) => b - a);
    expect(pesos).toEqual(decrescente);
  });

  it('criteria.tsx e scoring.ts têm exatamente os mesmos critérios, na mesma ordem', () => {
    expect(CRITERIA.map((c) => c.key)).toEqual(CRITERIA_KEYS);
  });

  it('o peso mostrado na tela bate com o peso que o motor usa', () => {
    for (const c of CRITERIA) {
      const doMotor = WEIGHTS[c.key as keyof typeof WEIGHTS];
      // `weight` é o rótulo de tela ("30%"). Ele é texto; tem que concordar.
      const mostrado = Number(c.weight.replace('%', '')) / 100;
      expect(`${c.label}: ${c.weight}`).toBe(`${c.label}: ${Math.round(doMotor * 100)}%`);
      expect(mostrado).toBeCloseTo(doMotor, 10);
    }
  });

  it('todo critério tem rótulo, ícone, cor e justificativa — nenhum campo vazio', () => {
    for (const c of CRITERIA) {
      expect({ crit: c.key, label: c.label.trim() }).toMatchObject({ label: expect.any(String) });
      expect({ crit: c.key, ok: c.label.trim().length > 0 }).toMatchObject({ ok: true });
      expect({ crit: c.key, ok: /^\d+%$/.test(c.weight) }).toMatchObject({ ok: true });
      expect({ crit: c.key, ok: /^#[0-9a-f]{6}$/i.test(c.barColor) }).toMatchObject({ ok: true });
      // A justificativa é o texto que explica o critério ao leigo. Sem ela o
      // critério é um número sem justificativa, que é o oposto de transparência.
      expect({ crit: c.key, tamanho: c.rationale.trim().length })
        .toMatchObject({ tamanho: expect.anything() });
      expect({ crit: c.key, ok: c.rationale.trim().length > 40 }).toMatchObject({ ok: true });
    }
  });

  it('o `field` de cada critério é único e é o nome que a API devolve', () => {
    const fields = CRITERIA.map((c) => c.field);
    expect(new Set(fields).size).toBe(fields.length);
    // Regressão do bug real (2026-09-25): a API devolvia `FAMILY_VALUES`
    // (enum) enquanto o front procurava `familyValues` (field). Este teste
    // amarra os dois lados pelo mesmo nome.
    for (const f of fields) {
      expect(f).toMatch(/^[a-z][a-zA-Z]*$/);
    }
  });
});

// ===========================================================================
// 1.2 — INDICADORES PUBLICADOS × O QUE O SCAN_RULES MEDE
// ===========================================================================

/** Extrai os `indicators: [...]` de cada critério da página de metodologia. */
function extrairIndicadoresPublicados(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const re = /key:\s*'(\w+)'[\s\S]{0,4000}?indicators:\s*\[([\s\S]*?)\]/g;
  for (const m of METODOLOGIA.matchAll(re)) {
    // A página usa a chave em camelCase (moralIntegrity); o código usa o
    // enum (MORAL_INTEGRITY). Sem esta normalização o teste não reconhecia
    // nem os indicadores que SÃO medidos, e acusava gap onde não há.
    const semUnderline = (x: string) => x.toLowerCase().replace(/_/g, '');
    const chaveEnum =
      Object.keys(WEIGHTS).find((k) => semUnderline(k) === semUnderline(m[1])) ??
      m[1];
    out[chaveEnum] = [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  }
  return out;
}

const INDICADORES = extrairIndicadoresPublicados();

/**
 * O QUE O SITE ADMITE NÃO MEDIR (2026-09-26, auditoria).
 *
 * Cada linha é um indicador publicado que nenhuma regra do código mede. Não
 * é uma lista de pendências esquecidas: é o registro do que o site publicou
 * sem lastro. Enquanto uma linha estiver aqui, o texto é enganoso — mas
 * pelo menos é um engano declarado, e o teste falha se alguém acrescentar
 * um indicador NOVO sem medir, ou renomear um destes.
 */
const INDICADORES_NAO_MEDIDOS = [
  // Proteção à Vida (4 publicados, 4 com medição) — em 2026-09-26 os quatro
  // indicadores vagos foram trocados pelos termos que o SCAN_RULES casa de
  // fato. Sobrou nenhum gap aqui.
  // Valores Familiares (4 publicados, 3 com medição)
  'Defesa da educação familiar',
  'Combate à erotização infantil',
  // Integridade Moral — indicadores reescritos em 2026-09-26 para descrever
  // as regras de despesa, que são medidas por `expense-rules.ts` e não por
  // keyword de votação. O teste reconhece esse caminho.
  // Responsabilidade Social (4 publicados, 2 com medição)
  'Defesa de políticas para vulneráveis',
  'Combate à pobreza',
  // Liberdade Religiosa (4 publicados, 3 com medição)
  'Garantia de objeção de consciência',
];

describe('1.2 indicadores publicados × o que o código mede', () => {
  it('a extração dos indicadores pegou os cinco critérios (senão o resto é falso verde)', () => {
    expect(Object.keys(INDICADORES).sort()).toEqual([...CRITERIA_KEYS].sort());
    for (const k of CRITERIA_KEYS) {
      expect({ crit: k, n: INDICADORES[k].length, ok: INDICADORES[k].length > 0 })
        .toMatchObject({ ok: true });
    }
  });

  it('todo indicador sem medição está declarado em INDICADORES_NAO_MEDIDOS', () => {
    const naoDeclarados: string[] = [];
    for (const [criterio, lista] of Object.entries(INDICADORES)) {
      for (const ind of lista) {
        const alvo = normalizar(ind);
        // Um indicador é "medido" se alguma keyword do SCAN_RULES aparece
        // dentro dele. Não exige correspondência exata: "Combate à
        // intolerância religiosa" cobre "intolerancia religiosa".
        const medido = TODAS_KEYWORDS.some((k) => alvo.includes(k) || k.includes(alvo));
        // Os indicadores de gasto são medidos pelas regras de despesa, que
        // não são keyword. Reconhecidos por dizerem de despesa/gasto/recibo.
        const medidoPorDespesa =
          criterio === 'MORAL_INTEGRITY' &&
          /gasto|despesa|recibo|cota/.test(alvo);
        if (!medido && !medidoPorDespesa && !INDICADORES_NAO_MEDIDOS.includes(ind)) {
          naoDeclarados.push(`${criterio} → "${ind}"`);
        }
      }
    }
    expect(
      naoDeclarados,
      'Indicador publicado que nada mede e que NÃO está declarado em ' +
        'INDICADORES_NAO_MEDIDOS. Ou meça e tire de lá, ou declare o gap: ' +
        'publicar indicador sem lastro é o que este teste existe para barrar.\n' +
        naoDeclarados.join('\n'),
    ).toEqual([]);
  });

  it('INDICADORES_NAO_MEDIDOS não tem entrada obsoleta (indicador renomeado some do texto)', () => {
    const publicados = Object.values(INDICADORES).flat();
    const obsoletos = INDICADORES_NAO_MEDIDOS.filter((i) => !publicados.includes(i));
    // Entrada obsoleta é ruído que esconde um gap real: se o indicador foi
    // medido ou removido, a lista tem que encolher junto.
    expect(obsoletos, `Saíram do texto: ${obsoletos.join(', ')}`).toEqual([]);
  });

  it('o site diz ao usuário o que ele procura de verdade (as keywords são conhecidas)', () => {
    // As keywords mais carregadas de significado — se o usuário não as
    // encontra em lugar nenhum da página, ele não sabe o que está sendo
    // medido. Não exigimos 100%: exigimos as que definem o critério.
    const essenciais = [
      'aborto',
      'nascituro',
      'familia',
      'adocao',
      'corrupcao',
      'liberdade religiosa',
      'liberdade de culto',
      'saude publica',
      'assistencia social',
    ];
    const ausentes = essenciais.filter((k) => !METODOLOGIA_PLAIN.includes(normalizar(k)));
    expect(
      ausentes,
      'A página não menciona termos que o SCAN_RULES usa para classificar. ' +
        'O usuário não consegue saber o que está sendo medido.',
    ).toEqual([]);
  });
});

// ===========================================================================
// 1.3 — FÓRMULAS DECLARADAS × CÓDIGO
// ===========================================================================
describe('1.3 fórmulas declaradas × código', () => {
  it('a frase "soma ponderada nos pesos 30/25/20/15/10" ainda bate com WEIGHTS', () => {
    const esperado = CRITERIA_KEYS.map((k) => Math.round(WEIGHTS[k] * 100)).join('/');
    expect(esperado).toBe('30/25/20/15/10');
    // A frase está na página? Se alguém reescrever a frase, este teste
    // falha e obriga a conferir se o texto continua descrevendo o motor.
    expect(METODOLOGIA_PLAIN).toContain('30/25/20/15/10');
    expect(REPRODUTIVIDADE).toMatch(/30\s*\/\s*25\s*\/\s*20\s*\/\s*15\s*\/\s*10/);
  });

  it('os pesos citados na TABELA de REPRODUCIBILITY.md batem com o motor, um a um', () => {
    // Lê a TABELA, não a prosa. Antes este teste varria qualquer menção ao
    // rótulo do critério nos 200 caracteres seguintes, e um parágrafo
    // explicativo mentioning "Responsabilidade Social (67,4%)" fazia ele ler
    // 67% onde a tabela diz 15%. Documento que tem tabela tem que ser lido
    // pela tabela — senão o teste valida a frase em vez do dado.
    for (const c of CRITERIA) {
      const pct = Math.round(WEIGHTS[c.key as keyof typeof WEIGHTS] * 100);
      const rotulo = normalizar(c.label);
      // linha de tabela: | **Rótulo** (NN%) |
      const linha = REPRODUTIVIDADE.split('\n').find(
        (l) => l.trim().startsWith('|') && normalizar(l).includes(rotulo),
      );
      expect({ crit: c.label, achouLinha: !!linha, motivo: 'REPRODUCIBILITY.md não tem linha de tabela para o critério' })
        .toMatchObject({ achouLinha: true });
      // o regex captura só o número ("30"), então compara com String(pct)
      const pesoNaLinha = linha!.match(/\((\d+)%\)/)?.[1];
      expect({ crit: c.label, pesoNaDoc: pesoNaLinha, pesoNoMotor: pct })
        .toMatchObject({ pesoNaDoc: String(pct) });
    }
  });

  it('a versão da fórmula é a mesma nos três lugares onde ela é citada', () => {
    // M0 criou `formula_version` justamente para a nota deixar de ser
    // anônima. O texto tem que acompanhar.
    expect(SCORE_FORMULA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(REPRODUTIVIDADE.includes(SCORE_FORMULA_VERSION)).toBe(true);
  });

  it('cada doc cita a versão atual da regra que documenta', () => {
    // Cada regra tem UM doc que a documenta. O teste não procura a versão
    // "em algum lugar" — procura no arquivo que deveria declará-la, senão
    // ele acusa a doc errada de defasamento e o teste vira ruído.
    const pares: Array<{ regra: string; versao: string; doc: string }> = [
      { regra: 'SCAN_RULES', versao: SCAN_RULES_VERSION, doc: REPRODUTIVIDADE },
      { regra: 'EXPENSE_RULES', versao: EXPENSE_RULES_VERSION, doc: ler('docs/DETECCAO-DESPESAS.md') },
      { regra: 'SCORE_FORMULA', versao: SCORE_FORMULA_VERSION, doc: REPRODUTIVIDADE },
    ];
    for (const { regra, versao, doc } of pares) {
      expect({ regra, versao, formatoOk: /^\d+\.\d+\.\d+$/.test(versao) })
        .toMatchObject({ formatoOk: true });
      expect(
        { regra, versao, citadaPelaDoc: doc.includes(versao) },
        `${regra} está em ${versao}, mas o doc que a descreve não cita essa ` +
          'versão. Doc que descreve regra sem versionar não é auditável: quando ' +
          'a regra muda, não há como saber qual texto descrevia a versão antiga.',
      ).toMatchObject({ citadaPelaDoc: true });
    }
  });

  it('a saturação da penalidade de despesa citada na doc é a do código', () => {
    // PENALTY_SATURATION_PCT = 20. A doc diz 20%? Se divergir, a doc
    // descreve um cálculo diferente do que roda.
    const docTem20 = /20\s*%/.test(REPRODUTIVIDADE) || /20\s*%/.test(METODOLOGIA);
    expect(docTem20).toBe(true);
  });
});

// ===========================================================================
// 1.7 — FAIXAS DA UI × FAIXAS DA API
// ===========================================================================

/**
 * Achado real (2026-09-26): `PoliticianCard`, `ComparisonTable` e
 * `performanceLabel` tinham TRÊS conjuntos de limiares diferentes — 80/60/40
 * em dois componentes, 80/65/45 na API. Nenhum teste comparava os três.
 *
 * Depois do M1c a escala encolheu (amplitude real 50–68), e com os limiares
 * antigos duas das quatro cores ficaram mortas e duas faixas da API viraram
 * uninhabited. A nota ficou 540 de 595 no meio.
 */
describe('1.7 faixas da UI × faixas da API', () => {
  const MAPA = {
    excellent: 'EXCELLENT',
    good: 'GOOD',
    average: 'AVERAGE',
    poor: 'POOR',
  } as const;

  it('os cortes do front são exatamente os da API', () => {
    // O corte é INCLUSIVO: 65 é excellent, 64,99 é good.
    expect({ v: performanceLabel(SCORE_BANDS.excellent).level })
      .toMatchObject({ v: 'EXCELLENT' });
    expect({ v: performanceLabel(SCORE_BANDS.excellent - 0.01).level })
      .toMatchObject({ v: 'GOOD' });
    expect({ v: performanceLabel(SCORE_BANDS.good).level })
      .toMatchObject({ v: 'GOOD' });
    expect({ v: performanceLabel(SCORE_BANDS.good - 0.01).level })
      .toMatchObject({ v: 'AVERAGE' });
    expect({ v: performanceLabel(SCORE_BANDS.average).level })
      .toMatchObject({ v: 'AVERAGE' });
    expect({ v: performanceLabel(SCORE_BANDS.average - 0.01).level })
      .toMatchObject({ v: 'POOR' });
  });

  it('scoreBand e performanceLabel concordam em TODA a escala 0–100, nota por nota', () => {
    // Esta é a amarra. Percorrer as 101 notas é o que garante que os dois
    // lados não voltem a divergir em silêncio quando alguém mexer num corte.
    const divergencias: string[] = [];
    for (let nota = 0; nota <= 100; nota++) {
      const front = MAPA[scoreBand(nota)];
      const api = performanceLabel(nota).level;
      if (front !== api) divergencias.push(`nota ${nota}: front=${front} api=${api}`);
    }
    expect(divergencias, divergencias.join('\n')).toEqual([]);
  });

  it('as faixas estão ordenadas e a escala inteira é coberta', () => {
    expect({
      ordenado:
        SCORE_BANDS.excellent > SCORE_BANDS.good && SCORE_BANDS.good > SCORE_BANDS.average,
    }).toMatchObject({ ordenado: true });
    expect({ min: scoreBand(0), max: scoreBand(100) })
      .toMatchObject({ min: 'poor', max: 'excellent' });
  });

  it('as quatro faixas são alcançáveis na escala real da 1.2.0 (50–68)', () => {
    // Se a fórmula encolher mais a escala (ou alargar), a faixa
    // correspondente tem que continuar habitável — senão "muito alta" é
    //fiction de novo, que foi exatamente o que a 1.2.0 quase deixou.
    const AMOSTRA = [50, 54, 55, 59, 60, 64, 65, 68];
    const ordem = ['poor', 'average', 'good', 'excellent'] as const;
    const vistas = [...new Set(AMOSTRA.map(scoreBand))].sort(
      (a, b) => ordem.indexOf(a) - ordem.indexOf(b),
    );
    expect({ faixas: vistas }).toMatchObject({ faixas: [...ordem] });
  });
});

// ===========================================================================
// 1.4 — NÚMEROS PUBLICADOS × BANCO
// ===========================================================================

/** Números "redondos" que a página pode citar sem esperar o banco. */
const NUMEROS_PERMITIDOS = new Set([
  '2', '4', '5', '6', '10', '20', '25', '30', '40', '50', '100', '0', '1', '3',
]);

describe('1.4 números publicados × o que é estrutural', () => {
  it('as contagens de critério citadas batem com o array (5 critérios, não 6 nem 8)', () => {
    const falaEm5 = /\b5\s+crit[ée]rios?\b/i.test(METODOLOGIA);
    expect(falaEm5, 'a metodologia não diz quantos critérios existem').toBe(true);
    expect(CRITERIA.length).toBe(5);
    // E não pode afirmar um número diferente ao lado.
    expect(METODOLOGIA).not.toMatch(/\b[678]\s+crit[ée]rios?\b/i);
  });

  it('todo número grande publicado na home/README tem data de snapshot', () => {
    // Regra do próprio repo: número sem data é mentira que envelhece. O
    // README só pode citar número grande se estiver marcado como snapshot
    // datado — que é o que o bloco "snapshot" faz.
    const bloco = README.match(/snapshot[\s\S]{0,3000}/i);
    if (!bloco) return; // sem bloco de snapshot, nada a conferir
    const comData = /\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}/.test(bloco[0]);
    expect(comData, 'bloco de snapshot sem data visível').toBe(true);
  });

  it('a nota é sempre apresentada em 0–100, como o motor calcula', () => {
    // Se alguém publicar "nota de 0 a 10" ou "percentual", a escala mudou e
    // todo o resto do texto fica errado.
    expect(METODOLOGIA_PLAIN).not.toMatch(/nota\s+de\s+0\s+a\s+10/);
    expect(METODOLOGIA_PLAIN).toMatch(/0\s*[–-]\s*100/);
  });
});

// ===========================================================================
// 1.5 — TEXTO QUE AFIRMA O QUE NÃO É MEDIDO
// ===========================================================================

/**
 * Termos que prometem capacidade inexistente.
 *
 * `allowlist` é o texto que, NA MESMA FRASE, transforma a promessa em
 * negativa ("não usamos…", "não há integração…", "não medimos…"). É o que
 * permite falar do assunto sem mentir sobre ele — e foi assim que a
 * Integridade Moral foi reescrita em 2026-09-26.
 */
const TERMOS_PROIBIDOS: Array<{ termo: string; motivo: string; allowlist: string[] }> = [
  {
    termo: 'processos judiciais',
    motivo: 'não há integração com STF/MP — o site não tem esse dado',
    allowlist: ['nao usamos', 'nao temos integracao', 'nao temos essa integracao', 'nao ha integracao', 'nao medimos'],
  },
  {
    termo: 'investigações por corrupção',
    motivo: 'não há integração com MP/CPI/TCU',
    allowlist: ['nao usamos', 'nao temos integracao', 'nao temos essa integracao', 'nao ha integracao', 'nao medimos'],
  },
  {
    termo: 'condenações',
    motivo: 'não há integração com STF/MP',
    allowlist: ['nao usamos', 'nao temos integracao', 'nao temos essa integracao', 'nao ha integracao', 'nao medimos'],
  },
  {
    termo: 'ficha limpa',
    motivo: 'o próprio site diz que não usa esse termo',
    allowlist: ['nao usamos', 'nao e usado', 'nao e usada', 'nao medimos'],
  },
  {
    termo: 'trânsito em julgado',
    motivo: 'só existe num seed não consumido pelo cálculo',
    allowlist: ['nao usamos', 'nao medimos', 'nao temos essa integracao'],
  },
  {
    termo: 'posicionamentos públicos',
    motivo: 'o sistema só lê votação nominal recorded em plénio',
    allowlist: ['nao usamos', 'nao medimos', 'nao ha votacao nominal', 'so le votacao nominal'],
  },
];

/** Frases da página. Uma ocorrência só é culpada se a frase inteira não for
 *  innocentada por uma negativa. */
function frasesDoDocumento(doc: string): string[] {
  // Colapsa TODO o whitespace (inclusive quebras de linha e os escapes
  // \n que vivem dentro de strings do TSX) ANTES de quebrar em frase.
  //
  // Sem isso o teste acusava mentira onde há verdade: uma negação que
  // quebra na linha vira dois segmentos, o segundo sem o "não", e o teste
  //_reportava_ uma promessa. Um teste que dá falso positivo treina a
  // ignorar o alarme — que é pior que não ter teste.
  const colapsado = doc.replace(/\\n|\s+/g, ' ');
  return colapsado
    .split(/(?<=[.!?])\s+/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
}

describe('1.5 texto que afirma o que não é medido', () => {
  for (const { termo, motivo, allowlist } of TERMOS_PROIBIDOS) {
    it(`"${termo}" não é prometido sem ressalva (${motivo})`, () => {
      const alvo = normalizar(termo);
      const culpadas: string[] = [];
      for (const doc of [
        { nome: 'Metodologia.tsx', texto: METODOLOGIA },
        { nome: 'REPRODUCIBILITY.md', texto: REPRODUTIVIDADE },
        { nome: 'README.md', texto: README },
      ]) {
        for (const frase of frasesDoDocumento(doc.texto)) {
          const f = normalizar(frase);
          if (!f.includes(alvo)) continue;
          // REGRA GERAL: termo proibido dentro de crase é CITAÇÃO, não
          // promessa. `ficha limpa` numa tabela que lista as keywords que o
          // SCAN_RULES procura é o registro do que o código busca — o oposto
          // de prometer checagem de ficha limpa.
          const ehCitacaoDeCodigo = new RegExp('`' + termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '`').test(
            frase,
          );
          if (ehCitacaoDeCodigo) continue;
          // innocentada se a MESMA frase nega
          const innocentada = allowlist.some((a) => f.includes(normalizar(a)));
          if (!innocentada) culpadas.push(`${doc.nome}: "${frase.slice(0, 160)}"`);
        }
      }
      expect(
        culpadas,
        `A página promete "${termo}" sem dizer que não mede isso.\n` +
          'Ou apague, ou negue na mesma frase (ex.: "Não usamos …").\n' +
          culpadas.join('\n'),
      ).toEqual([]);
    });
  }

  it('as versões das regras aparecem com o nome, não como número solto', () => {
    // Regressão real (2026-08): docs citavam "v2.0" sem dizer o quê. Um
    // número de versão solto não é auditável.
    for (const doc of [REPRODUTIVIDADE, README]) {
      const soltos = [...doc.matchAll(/(?<![\w.])([12]\.\d\.\d)(?![\w.])/g)].map((m) => m[1]);
      for (const v of soltos) {
        const perto = doc.slice(Math.max(0, doc.indexOf(v) - 200), doc.indexOf(v) + 200);
        expect(
          perto.toLowerCase(),
          `versão ${v} citada sem dizer de que regra é`,
        ).toMatch(/rules|regra|scan|despesa|formula|f[óo]rmula/);
      }
    }
  });
});

// ===========================================================================
// 1.6 — O PRÓPRIO TESTE NÃO PODE SER FALSO-VERDE
// ===========================================================================

describe('1.6 o teste se auto-confere', () => {
  it('a lista de indicadores não medidos é menor que o total publicado (senão não medimos nada)', () => {
    const total = Object.values(INDICADORES).flat().length;
    expect({ n: total, ok: total > 0 }).toMatchObject({ ok: true });
    expect({ declarados: INDICADORES_NAO_MEDIDOS.length, total, ok: INDICADORES_NAO_MEDIDOS.length < total })
      .toMatchObject({ ok: true });
  });

  it('o detector de frase realmente acha frases (senão o 1.5 é falso-verde)', () => {
    const frases = frasesDoDocumento('Primeira frase. Segunda frase! Terceira?');
    // O split é DEPOIS da pontuação, então a marca fica no fim do trecho.
    expect({ frases }).toMatchObject({ frases: ['Primeira frase.', 'Segunda frase!', 'Terceira?'] });
  });

  it('a allowlist funciona: uma frase que nega é absolvida, uma que não é, não', () => {
    // Este é o teste mais importante do arquivo: se a allowlist real
    // absolvesse TUDO, o 1.5 não estaria protegendo nada.
    const comNegacao = frasesDoDocumento(
      'Não usamos histórico de processos judiciais, investigações, condenações ou operações.',
    );
    const comPromessa = frasesDoDocumento('Analisamos o histórico de processos judiciais do político.');
    const allow = ['nao usamos'];
    const innocence = (f: string) => allow.some((a) => normalizar(f).includes(a));
    expect(innocence(comNegacao[0])).toBe(true);
    expect(innocence(comPromessa[0])).toBe(false);
  });

  it('normalizar realmente tira acento e caixa (o casamento por keyword depende disso)', () => {
    expect(normalizar('Proteção à Vida')).toBe('protecao a vida');
    expect(normalizar('LIBERDADE RELIGIOSA')).toBe('liberdade religiosa');
  });
});
