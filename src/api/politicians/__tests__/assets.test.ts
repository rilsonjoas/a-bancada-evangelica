import { describe, it, expect } from 'vitest';
import { toAssetsDto } from '../assets';

const por = { imoveis: 700, moveis: 100, participacoes: 100, aplicacoes: 50, creditos: 0, dinheiro: 40, outros: 10 };
const row = (over: Record<string, unknown> = {}) => ({ election_year: 2022, total_declared: 1000, item_count: 9, unverified: false, by_type: por, ...over });

describe('toAssetsDto', () => {
  it('sem linha: null', () => {
    expect(toAssetsDto(null)).toBeNull();
    expect(toAssetsDto(undefined)).toBeNull();
  });
  it('devolve total, itens e grupos quando a soma fecha', () => {
    expect(toAssetsDto(row())).toEqual({ electionYear: 2022, sqCandidato: null, total: 1000, itemCount: 9, unverified: false, byType: por });
  });
  it('preserva sq_candidato quando fornecido', () => {
    const r = toAssetsDto(row({ sq_candidato: '170001604083' }));
    expect(r?.sqCandidato).toBe('170001604083');
  });
  it('soma dos grupos não fecha: mantém o total mas byType null', () => {
    const r = toAssetsDto(row({ total_declared: 5000 }));
    expect(r?.total).toBe(5000);
    expect(r?.byType).toBeNull();
  });
  it('grupo ausente ou inválido: byType null', () => {
    expect(toAssetsDto(row({ by_type: { ...por, outros: -1 } }))?.byType).toBeNull();
    expect(toAssetsDto(row({ by_type: { imoveis: 1000 } }))?.byType).toBeNull();
    expect(toAssetsDto(row({ by_type: 'x' }))?.byType).toBeNull();
    expect(toAssetsDto(row({ by_type: null }))?.byType).toBeNull();
  });
  it('sem verificação: o número NÃO sai, nem o total nem os grupos', () => {
    const r = toAssetsDto(row({ unverified: true, total_declared: 9_999_999_999 }));
    expect(r).toEqual({ electionYear: 2022, sqCandidato: null, total: null, itemCount: 9, unverified: true, byType: null });
    expect(JSON.stringify(r)).not.toContain('9999999999');
  });
  it('total inválido: null', () => {
    expect(toAssetsDto(row({ total_declared: NaN }))).toBeNull();
    expect(toAssetsDto(row({ total_declared: -1 }))).toBeNull();
  });
});
