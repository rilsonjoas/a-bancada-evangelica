import { describe, it, expect } from 'vitest';
import { THEMES, themeBySlug, countAgendasByTheme, matchThemes } from '../themes';

describe('catálogo de temas (M2)', () => {
  it('tem slugs únicos', () => {
    const slugs = THEMES.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('cada tema tem label, tagline e descrição leiga', () => {
    for (const t of THEMES) {
      expect(t.label.length).toBeGreaterThan(0);
      expect(t.tagline.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(50);
    }
  });

  it('themeBySlug devolve o tema certo e undefined para slug desconhecido', () => {
    expect(themeBySlug('meio-ambiente-energia')?.label).toContain('Meio ambiente');
    expect(themeBySlug('nao-existe')).toBeUndefined();
  });

  it('countAgendasByTheme conta só agendas com tema', () => {
    const agendas = [
      { theme: 'meio-ambiente-energia', totalVotes: 10 },
      { theme: 'meio-ambiente-energia', totalVotes: 5 },
      { theme: 'transito', totalVotes: 3 },
      { theme: null, totalVotes: 9 },
      { theme: undefined, totalVotes: 9 },
    ];
    const counts = countAgendasByTheme(agendas);
    expect(counts['meio-ambiente-energia']).toBe(2);
    expect(counts['transito']).toBe(1);
    expect(counts['nao-existe']).toBeUndefined();
  });
});

//(matchThemes foi adicionado em 2026-09-25: a busca da navbar só consultava
// nome de parlamentar, então "meio ambiente" não retornava nada mesmo
// existindo a página /temas/meio-ambiente-energia.)
describe('matchThemes', () => {
  it('casa por palavra do rótulo — o caso que motivou a função', () => {
    expect(matchThemes('meio ambiente').map((t) => t.slug)).toContain('meio-ambiente-energia');
  });

  it('casa por palavra da tagline', () => {
    expect(matchThemes('queimadas').map((t) => t.slug)).toContain('meio-ambiente-energia');
    expect(matchThemes('motorista').map((t) => t.slug)).toContain('transito');
  });

  it('ignora acento e caixa', () => {
    expect(matchThemes('MEIO AMBIENTE').length).toBe(matchThemes('meio ambiente').length);
    expect(matchThemes('meio-ambiente').length).toBe(matchThemes('meio ambiente').length);
  });

  it('exige ao menos 2 caracteres', () => {
    expect(matchThemes('m')).toEqual([]);
    expect(matchThemes('  ')).toEqual([]);
  });

  it('devolve vazio quando nada casa, sem inventar resultado', () => {
    expect(matchThemes('zzzzqqqq')).toEqual([]);
  });

  it('nunca devolve tema fora do catálogo', () => {
    const slugs = new Set(THEMES.map((t) => t.slug));
    for (const t of matchThemes('a')) expect(slugs.has(t.slug)).toBe(true);
  });
});
