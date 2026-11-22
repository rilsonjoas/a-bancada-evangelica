import { describe, it, expect } from 'vitest';
import {
  anoValido, deveSubstituirRedes, ehEleicaoGeralEstadual, lerAno, LIMITE_PRESTACAO_FINAL, normalizarRotulo,
  prestacaoPodeSerImportada, proporcaoFinal, resolverZip,
} from '../lib/tse-eleicao';

describe('rótulo da eleição sem diferenciar caixa nem acento (achado de 2026-11-02)', () => {
  it.each([
    'Eleições Gerais Estaduais 2026',
    'ELEIÇÕES GERAIS ESTADUAIS 2026',
    'eleicoes gerais estaduais 2026',
    '  Eleições   Gerais  Estaduais 2026 ',
  ])('aceita %s', (r) => expect(ehEleicaoGeralEstadual(r, 2026)).toBe(true));

  it.each([
    'Eleição Geral Federal 2026',
    'ELEIÇÃO GERAL FEDERAL 2026',
    'Eleição Suplementar Governador 2026',
    'Eleições Gerais Estaduais 2022',
    '',
  ])('rejeita %s', (r) => expect(ehEleicaoGeralEstadual(r, 2026)).toBe(false));

  it('null e undefined não derrubam', () => {
    expect(ehEleicaoGeralEstadual(null, 2026)).toBe(false);
    expect(ehEleicaoGeralEstadual(undefined, 2026)).toBe(false);
    expect(normalizarRotulo(undefined)).toBe('');
  });
});

describe('lerAno', () => {
  it('sem flag: 2022 (comportamento anterior)', () => expect(lerAno(['--dry-run'])).toBe(2022));
  it('--ano 2026 e --ano=2018', () => {
    expect(lerAno(['--ano', '2026'])).toBe(2026);
    expect(lerAno(['--dry-run', '--ano=2018'])).toBe(2018);
  });
  it.each([['2025'], ['abc'], ['2026.5'], ['1999'], ['']])('ano inválido (%p) lança erro, nunca vira o padrão', (v) => {
    expect(() => lerAno(['--ano', v])).toThrow(/--ano inválido/);
  });
  it('--ano sem valor lança erro', () => {
    expect(() => lerAno(['--ano'])).toThrow(/--ano inválido/);
  });
  it('anoValido: só 2018, 2022, 2026...', () => {
    expect([2018, 2022, 2026, 2030].every(anoValido)).toBe(true);
    expect([2020, 2024, 2025, 2027, NaN].some(anoValido)).toBe(false);
  });
});

describe('resolverZip', () => {
  const raiz = '/d/tse';
  it('prefere data/tse/<ano>/', () => {
    expect(resolverZip(raiz, 'x.zip', 2026, () => true)).toBe('/d/tse/2026/x.zip');
  });
  it('cai para data/tse/ (arquivos de 2022 de agosto)', () => {
    expect(resolverZip(raiz, 'x.zip', 2022, (p) => p === '/d/tse/x.zip')).toBe('/d/tse/x.zip');
  });
  it('nenhum existe: devolve o caminho por ano para a mensagem de erro', () => {
    expect(resolverZip(raiz, 'x.zip', 2026, () => false)).toBe('/d/tse/2026/x.zip');
  });
});

describe('trava da prestação de contas final', () => {
  const m = (o: Record<string, number>) => new Map(Object.entries(o));
  it('2022 (medido): 98,9% final passa', () => {
    const c = m({ FINAL: 107982, PARCIAL: 724, 'REGULARIZAÇÃO DA OMISSÃO': 324, 'RELATÓRIO FINANCEIRO': 126 });
    expect(proporcaoFinal(c)).toBeGreaterThan(0.98);
    expect(prestacaoPodeSerImportada(c, false)).toBe(true);
  });
  it('2026 em 2026-11-02 (medido): 33% final NÃO passa', () => {
    const c = m({ 'RELATÓRIO FINANCEIRO': 41073, FINAL: 26602, PARCIAL: 12042 });
    expect(proporcaoFinal(c)).toBeLessThan(0.34);
    expect(prestacaoPodeSerImportada(c, false)).toBe(false);
  });
  it('aceitar parcial é um ato explícito', () => {
    expect(prestacaoPodeSerImportada(m({ PARCIAL: 10 }), true)).toBe(true);
  });
  it('sem linhas: nunca passa sem o aceite', () => {
    expect(proporcaoFinal(m({}))).toBe(0);
    expect(prestacaoPodeSerImportada(m({}), false)).toBe(false);
  });
  it('exatamente no limite passa; logo abaixo não', () => {
    expect(prestacaoPodeSerImportada(m({ FINAL: 95, PARCIAL: 5 }), false)).toBe(true);
    expect(LIMITE_PRESTACAO_FINAL).toBe(0.95);
    expect(prestacaoPodeSerImportada(m({ FINAL: 94, PARCIAL: 6 }), false)).toBe(false);
  });
  it('"final" em outra caixa ou sem acento conta como final', () => {
    expect(proporcaoFinal(m({ final: 1 }))).toBe(1);
  });
});

describe('deveSubstituirRedes: o ano mais novo vence', () => {
  it('sem valor anterior ou inválido: grava', () => {
    for (const a of [undefined, null, 'x', NaN]) expect(deveSubstituirRedes(a, 2022)).toBe(true);
  });
  it('2026 substitui 2022; 2022 não substitui 2026; mesmo ano atualiza', () => {
    expect(deveSubstituirRedes(2022, 2026)).toBe(true);
    expect(deveSubstituirRedes(2026, 2022)).toBe(false);
    expect(deveSubstituirRedes(2026, 2026)).toBe(true);
  });
});
