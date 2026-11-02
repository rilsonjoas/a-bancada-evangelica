import { describe, it, expect } from 'vitest';
import { agruparBens, grupoDoBem, GRUPOS_BEM, LIMITE_ITEM, LIMITE_TOTAL } from '../lib/tse-bens';

const b = (sq: string, cd: string | number, v: string) => ({ SQ_CANDIDATO: sq, CD_TIPO_BEM_CANDIDATO: String(cd), VR_BEM_CANDIDATO: v });

describe('grupoDoBem (códigos reais do TSE 2022)', () => {
  it.each([
    [1, 'imoveis'], [2, 'imoveis'], [3, 'imoveis'], [11, 'imoveis'], [12, 'imoveis'], [13, 'imoveis'], [19, 'imoveis'],
    [21, 'moveis'], [22, 'moveis'], [25, 'moveis'], [29, 'moveis'],
    [31, 'participacoes'], [32, 'participacoes'], [39, 'participacoes'],
    [41, 'aplicacoes'], [45, 'aplicacoes'], [49, 'aplicacoes'], [71, 'aplicacoes'], [74, 'aplicacoes'], [79, 'aplicacoes'], [97, 'aplicacoes'],
    [51, 'creditos'], [59, 'creditos'],
    [61, 'dinheiro'], [63, 'dinheiro'], [69, 'dinheiro'],
    [91, 'outros'], [95, 'outros'], [99, 'outros'],
  ])('%s -> %s', (cd, g) => expect(grupoDoBem(cd)).toBe(g));

  it('código desconhecido ou ilegível vai para "outros", nunca descarta', () => {
    expect(grupoDoBem('abc')).toBe('outros');
    expect(grupoDoBem('')).toBe('outros');
    expect(grupoDoBem(777)).toBe('outros');
    expect(grupoDoBem(0)).toBe('outros');
  });
});

describe('agruparBens', () => {
  it('soma total, conta itens, guarda o maior item e separa por grupo', () => {
    const m = agruparBens([b('1', 12, '500.000,50'), b('1', 21, '40.000,00'), b('1', 61, '1.000,25'), b('2', 13, '10,00')]);
    const r = m.get('1')!;
    expect(r.total).toBe(541000.75);
    expect(r.itens).toBe(3);
    expect(r.maiorItem).toBe(500000.5);
    expect(r.porGrupo.imoveis).toBe(500000.5);
    expect(r.porGrupo.moveis).toBe(40000);
    expect(r.porGrupo.dinheiro).toBe(1000.25);
    expect(m.get('2')!.itens).toBe(1);
  });

  it('a soma dos grupos é exatamente o total', () => {
    const rows = Array.from({ length: 200 }, (_, i) => b('1', [12, 21, 32, 45, 51, 61, 99][i % 7], `${(i * 137) % 9999},${i % 100}`));
    const r = agruparBens(rows).get('1')!;
    expect(Object.values(r.porGrupo).reduce((a, c) => a + c, 0)).toBeCloseTo(r.total, 2);
    expect(Object.keys(r.porGrupo).sort()).toEqual([...GRUPOS_BEM].sort());
  });

  it('ignora linha sem SQ; valor ilegível conta como 0 sem derrubar', () => {
    const m = agruparBens([b('', 12, '100,00'), b('1', 12, '#NULO'), b('1', 12, '')]);
    expect(m.size).toBe(1);
    expect(m.get('1')!.total).toBe(0);
    expect(m.get('1')!.itens).toBe(2);
  });

  it('valor negativo não soma', () => {
    expect(agruparBens([b('1', 12, '-500,00'), b('1', 12, '100,00')]).get('1')!.total).toBe(100);
  });

  describe('trava de sanidade', () => {
    it('normal: sem marca', () => {
      expect(agruparBens([b('1', 12, '158.000.000,00')]).get('1')!.semVerificacao).toBe(false);
    });
    it('item acima de R$ 500 mi marca', () => {
      expect(agruparBens([b('1', 12, `${LIMITE_ITEM + 1},00`)]).get('1')!.semVerificacao).toBe(true);
    });
    it('exatamente no limite do item não marca', () => {
      expect(agruparBens([b('1', 12, `${LIMITE_ITEM},00`)]).get('1')!.semVerificacao).toBe(false);
    });
    it('total acima de R$ 1 bi marca, mesmo sem item gigante', () => {
      const rows = Array.from({ length: 11 }, () => b('1', 12, '100000000,00'));
      expect(agruparBens(rows).get('1')!.total).toBeGreaterThan(LIMITE_TOTAL);
      expect(agruparBens(rows).get('1')!.semVerificacao).toBe(true);
    });
    it('a marca vale só para o candidato afetado', () => {
      const m = agruparBens([b('1', 12, '900000000,00'), b('2', 12, '1000,00')]);
      expect(m.get('1')!.semVerificacao).toBe(true);
      expect(m.get('2')!.semVerificacao).toBe(false);
    });
  });
});
