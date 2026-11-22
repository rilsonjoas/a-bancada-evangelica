import { describe, it, expect, vi } from 'vitest';
import { anoDeEleicao, lerAno, lerAnos, ANOS_BENS, ANOS_BENS_PADRAO, ANO_FINANCIAMENTO, ANO_FINANCIAMENTO_PADRAO } from '../anos-exibidos';

describe('anos exibidos (D1/D2)', () => {
  it('sem variável de ambiente, o comportamento atual: só 2022', () => {
    expect(ANO_FINANCIAMENTO).toBe(ANO_FINANCIAMENTO_PADRAO);
    expect(ANOS_BENS).toEqual([...ANOS_BENS_PADRAO]);
    expect(ANO_FINANCIAMENTO).toBe(2022);
    expect(ANOS_BENS).toEqual([2022]);
  });

  it('anoDeEleicao: 2018, 2022, 2026, 2030; não 2020, 2024, 2025', () => {
    expect([2018, 2022, 2026, 2030].every(anoDeEleicao)).toBe(true);
    expect([2020, 2024, 2025, 2013, 2051, 2026.5, NaN].some(anoDeEleicao)).toBe(false);
  });

  describe('lerAno', () => {
    it('lê um ano válido', () => expect(lerAno('2026', 2022)).toBe(2026));
    it('aceita espaços', () => expect(lerAno(' 2026 ', 2022)).toBe(2026));
    it('vazio ou ausente: padrão, sem aviso', () => {
      const aviso = vi.fn();
      expect(lerAno(undefined, 2022, aviso)).toBe(2022);
      expect(lerAno('  ', 2022, aviso)).toBe(2022);
      expect(aviso).not.toHaveBeenCalled();
    });
    it.each([['2025'], ['abc'], ['2026,2022'], ['1999']])('inválido (%s): padrão e AVISA, não derruba', (v) => {
      const aviso = vi.fn();
      expect(lerAno(v, 2022, aviso)).toBe(2022);
      expect(aviso).toHaveBeenCalledTimes(1);
    });
  });

  describe('lerAnos', () => {
    it('ordena, tira repetidos e aceita espaços', () => expect(lerAnos('2026, 2022,2022', [2022])).toEqual([2022, 2026]));
    it('um item inválido invalida a lista inteira (não importa pela metade)', () => {
      const aviso = vi.fn();
      expect(lerAnos('2022,2025', [2022], aviso)).toEqual([2022]);
      expect(aviso).toHaveBeenCalled();
    });
    it('vazio: padrão', () => expect(lerAnos('', [2022])).toEqual([2022]));
    it('o padrão devolvido é uma cópia (não deixa mudar a constante)', () => {
      const r = lerAnos(undefined, ANOS_BENS_PADRAO);
      r.push(2030);
      expect(ANOS_BENS_PADRAO).toEqual([2022]);
    });
  });
});
