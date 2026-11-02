import { describe, it, expect } from 'vitest';
import { percentuaisInteiros, percentualFundosPublicos, CATEGORIAS_ORIGEM, type BySource } from '../origemRecursos';

const zero: BySource = { fundoEleitoral: 0, fundoPartidario: 0, partido: 0, pessoasFisicas: 0, proprios: 0, outrosCandidatos: 0, outras: 0 };

describe('percentuaisInteiros', () => {
  it('sempre soma 100, mesmo com restos (33,3 + 33,3 + 33,3)', () => {
    const p = percentuaisInteiros([1, 1, 1]);
    expect(p.reduce((a, b) => a + b, 0)).toBe(100);
    expect([...p].sort()).toEqual([33, 33, 34]);
  });
  it('mantém a ordem dos itens', () => {
    expect(percentuaisInteiros([50, 25, 25])).toEqual([50, 25, 25]);
  });
  it('item minúsculo vira 0 (a tela diz "menos de 1")', () => {
    const p = percentuaisInteiros([9999, 1]);
    expect(p[1]).toBe(0);
    expect(p.reduce((a, b) => a + b, 0)).toBe(100);
  });
  it.each([[[]], [[0, 0]]])('sem total devolve zeros: %p', (v) => {
    expect(percentuaisInteiros(v).every((x) => x === 0)).toBe(true);
  });
  it('propriedade: soma 100 para muitos vetores aleatórios', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 300; i++) {
      const v = Array.from({ length: 7 }, () => Math.floor(rnd() * 1000) * (rnd() < 0.3 ? 0 : 1));
      if (v.every((x) => x === 0)) continue;
      expect(percentuaisInteiros(v).reduce((a, b) => a + b, 0)).toBe(100);
    }
  });
});

describe('percentualFundosPublicos', () => {
  it('soma os dois fundos sobre o total', () => {
    expect(percentualFundosPublicos({ ...zero, fundoEleitoral: 80, fundoPartidario: 10, pessoasFisicas: 10 })).toBe(90);
  });
  it('nenhum fundo: 0; total zero: null', () => {
    expect(percentualFundosPublicos({ ...zero, pessoasFisicas: 10 })).toBe(0);
    expect(percentualFundosPublicos(zero)).toBeNull();
  });
  it('as categorias da tela cobrem todas as chaves do tipo', () => {
    expect(CATEGORIAS_ORIGEM.map((c) => c.key).sort()).toEqual(Object.keys(zero).sort());
  });
});
