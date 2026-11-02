import { describe, it, expect } from 'vitest';
import { agruparRedes, MAX_REDES_POR_CANDIDATO, mesmoConteudo, montarTseSocialUrls } from '../lib/tse-redes';

const r = (sq: string, ordem: string, url: string) => ({ SQ_CANDIDATO: sq, NR_ORDEM_REDE_SOCIAL: ordem, DS_URL: url });

describe('agruparRedes', () => {
  it('agrupa por candidato e ordena pela ordem declarada, não pela ordem do arquivo', () => {
    const m = agruparRedes([r('1', '3', 'https://c'), r('1', '1', 'https://a'), r('2', '1', 'https://x'), r('1', '2', 'https://b')]);
    expect(m.get('1')).toEqual(['https://a', 'https://b', 'https://c']);
    expect(m.get('2')).toEqual(['https://x']);
  });
  it('apara espaços, ignora vazias e remove repetidas', () => {
    const m = agruparRedes([r('1', '1', '  https://a  '), r('1', '2', ''), r('1', '3', 'https://a'), r(' ', '1', 'https://z')]);
    expect(m.get('1')).toEqual(['https://a']);
    expect(m.size).toBe(1);
  });
  it('candidato só com linhas vazias não aparece', () => {
    expect(agruparRedes([r('1', '1', '   ')]).size).toBe(0);
  });
  it('ordem ilegível vai para o fim, sem derrubar', () => {
    expect(agruparRedes([r('1', 'x', 'https://b'), r('1', '1', 'https://a')]).get('1')).toEqual(['https://a', 'https://b']);
  });
  it('limita o número de redes por candidato', () => {
    const rows = Array.from({ length: 50 }, (_, i) => r('1', String(i), `https://x/${i}`));
    expect(agruparRedes(rows).get('1')).toHaveLength(MAX_REDES_POR_CANDIDATO);
  });
});

describe('mesmoConteudo', () => {
  const v = montarTseSocialUrls(2022, ['https://a', 'https://b']);
  it('igual', () => expect(mesmoConteudo({ ano: 2022, redes: ['https://a', 'https://b'] }, v)).toBe(true));
  it('ordem diferente é diferente', () => expect(mesmoConteudo({ ano: 2022, redes: ['https://b', 'https://a'] }, v)).toBe(false));
  it('ano diferente', () => expect(mesmoConteudo({ ano: 2018, redes: ['https://a', 'https://b'] }, v)).toBe(false));
  it.each([[null], [undefined], ['x'], [{}]])('valor inválido: %p', (x) => expect(mesmoConteudo(x, v)).toBe(false));
});
