import { describe, it, expect } from 'vitest';
import { toBySource } from '../campaign-sources';

const bom = {
  fundo_eleitoral: 800, fundo_partidario: 100, partido: 20, pessoas_fisicas: 60, proprios: 10, outros_candidatos: 5, outras: 5,
};

describe('toBySource', () => {
  it('converte para camelCase quando a soma fecha com o total', () => {
    expect(toBySource(bom, 1000)).toEqual({
      fundoEleitoral: 800, fundoPartidario: 100, partido: 20, pessoasFisicas: 60, proprios: 10, outrosCandidatos: 5, outras: 5,
    });
  });
  it('tolera diferença de arredondamento de até R$ 1', () => {
    expect(toBySource(bom, 1000.8)).not.toBeNull();
  });
  it('não fecha com o total: null (zero honesto)', () => {
    expect(toBySource(bom, 1500)).toBeNull();
  });
  it('falta categoria: null', () => {
    const { outras: _o, ...resto } = bom;
    expect(toBySource(resto, 995)).toBeNull();
  });
  it.each([[-1], ['10'], [null], [NaN], [Infinity]])('valor inválido numa categoria (%p): null', (v) => {
    expect(toBySource({ ...bom, partido: v as unknown }, 1000)).toBeNull();
  });
  it.each([[null], [undefined], ['x'], [42], [[]], [{}]])('dado inesperado (%p): null', (raw) => {
    expect(toBySource(raw as unknown, 1000)).toBeNull();
  });
  it.each([[0], [-5], [NaN]])('total inválido (%p): null', (t) => {
    expect(toBySource(bom, t as number)).toBeNull();
  });
});
